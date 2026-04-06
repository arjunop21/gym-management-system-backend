import Member from '../models/Member.js';
import Payment from '../models/Payment.js';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const getDashboardStats = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalMembers = await Member.countDocuments();

  const activeMembers = await Member.countDocuments({
    status: 'Active',
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: null },
      { expiryDate: { $gte: today } },
    ],
  });

  const expiredMembers = await Member.countDocuments({
    $or: [
      { status: 'Expired' },
      { status: 'Active', expiryDate: { $lt: today } },
    ],
  });

  const payments = await Payment.find({ status: 'Paid' });
  const monthlyRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

  res.json({ totalMembers, activeMembers, expiredMembers, monthlyRevenue });
};

export const getReports = async (req, res) => {
  res.json({ message: "Reports logic goes here" });
};

// ─── Legacy charts endpoint (last 12 months) ────────────────────────────────
export const getChartData = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const twelveMonthsAgo = new Date(today);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const payments = await Payment.find({ status: 'Paid', date: { $gte: twelveMonthsAgo } });

  const revenueMap = {};
  payments.forEach(p => {
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    revenueMap[key] = (revenueMap[key] || 0) + p.amount;
  });

  const revenueData = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    revenueData.push({ name: MONTH_NAMES[d.getMonth()], revenue: revenueMap[key] || 0 });
  }

  const activeMembers = await Member.countDocuments({
    status: 'Active',
    $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gte: today } }],
  });
  const expiredMembers = await Member.countDocuments({
    $or: [{ status: 'Expired' }, { status: 'Active', expiryDate: { $lt: today } }],
  });

  const memberStatusData = [
    { name: 'Active', value: activeMembers },
    { name: 'Expired', value: expiredMembers },
  ];

  res.json({ revenueData, memberStatusData });
};

// ─── Dynamic charts endpoint: GET /api/reports?type=monthly|yearly&month=4&year=2026 ──
export const getDynamicChartData = async (req, res) => {
  try {
    const { type = 'monthly', month, year } = req.query;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const selectedYear  = parseInt(year  || today.getFullYear(), 10);
    const selectedMonth = parseInt(month || (today.getMonth() + 1), 10); // 1-based

    // ── Validate: no future dates ──────────────────────────────────────────
    if (type === 'yearly') {
      if (selectedYear > today.getFullYear()) {
        return res.status(400).json({ error: 'Future year not allowed' });
      }
    } else {
      if (
        selectedYear > today.getFullYear() ||
        (selectedYear === today.getFullYear() && selectedMonth > today.getMonth() + 1)
      ) {
        return res.status(400).json({ error: 'Future month not allowed' });
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // REVENUE DATA
    // ─────────────────────────────────────────────────────────────────────
    let revenueData = [];

    if (type === 'monthly') {
      // Days in selected month — use renewDate so revenue is attributed to
      // the membership period month, not the date the admin recorded the payment
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      const startDate = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
      const endDate   = new Date(selectedYear, selectedMonth - 1, daysInMonth, 23, 59, 59, 999);

      const payments = await Payment.find({
        status: 'Paid',
        renewDate: { $gte: startDate, $lte: endDate },
      });

      const dayMap = {};
      payments.forEach(p => {
        const day = new Date(p.renewDate).getDate();
        dayMap[day] = (dayMap[day] || 0) + p.amount;
      });

      for (let d = 1; d <= daysInMonth; d++) {
        revenueData.push({ name: String(d), revenue: dayMap[d] || 0 });
      }
    } else {
      // YEARLY mode — show Jan→current month if current year, else Jan→Dec
      // Use renewDate so revenue is attributed to the membership period, not recording date
      const isCurrentYear = selectedYear === today.getFullYear();
      const maxMonth = isCurrentYear ? today.getMonth() + 1 : 12;

      const startDate = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
      const endDate   = new Date(selectedYear, maxMonth - 1,
        new Date(selectedYear, maxMonth, 0).getDate(), 23, 59, 59, 999);

      const payments = await Payment.find({
        status: 'Paid',
        renewDate: { $gte: startDate, $lte: endDate },
      });

      const monthMap = {};
      payments.forEach(p => {
        const m = new Date(p.renewDate).getMonth(); // 0-based
        monthMap[m] = (monthMap[m] || 0) + p.amount;
      });

      for (let m = 0; m < maxMonth; m++) {
        revenueData.push({ name: MONTH_NAMES[m], revenue: monthMap[m] || 0 });
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // MEMBER STATUS DATA
    // ─────────────────────────────────────────────────────────────────────
    let periodStart, periodEnd;

    if (type === 'monthly') {
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      periodStart = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
      periodEnd   = new Date(selectedYear, selectedMonth - 1, daysInMonth, 23, 59, 59, 999);
    } else {
      const isCurrentYear = selectedYear === today.getFullYear();
      const maxMonth = isCurrentYear ? today.getMonth() + 1 : 12;
      periodStart = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
      periodEnd   = new Date(selectedYear, maxMonth - 1,
        new Date(selectedYear, maxMonth, 0).getDate(), 23, 59, 59, 999);
    }

    // A member is "in period" if they joined before period end (they existed during the period)
    // Active: expiryDate >= current date (today)  AND status != "Temporary Discontinue"
    // Expired: expiryDate < current date (today)  AND status != "Temporary Discontinue"
    // We scope by: joinDate <= periodEnd (member existed in that period)
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const activeCount = await Member.countDocuments({
      status: { $ne: 'Temporary Discontinue' },
      joinDate: { $lte: periodEnd },
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: periodEnd } }, // Status as of the end of the selected period
      ],
    });

    const expiredCount = await Member.countDocuments({
      status: { $ne: 'Temporary Discontinue' },
      joinDate: { $lte: periodEnd },
      expiryDate: { $lt: periodEnd }, // Status as of the end of the selected period
    });

    const memberStatusData = [
      { name: 'Active',  value: activeCount },
      { name: 'Expired', value: expiredCount },
    ];

    res.json({ revenueData, memberStatusData });
  } catch (err) {
    console.error('getDynamicChartData error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
