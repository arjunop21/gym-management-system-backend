import Member from '../models/Member.js';
import Payment from '../models/Payment.js';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalMembers, activeMembers, expiredMembers, monthlyRevenueResult] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({
        status: 'Active',
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gte: today } },
        ],
      }),
      Member.countDocuments({
        $or: [
          { status: 'Expired' },
          { status: 'Active', expiryDate: { $lt: today } },
        ],
      }),
      Payment.aggregate([
        { 
          $match: { 
            status: 'Paid',
            date: { $gte: firstDayOfMonth }
          } 
        },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;

    res.json({ totalMembers, activeMembers, expiredMembers, monthlyRevenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReports = async (req, res) => {
  res.json({ message: "Reports logic goes here" });
};

// ─── Legacy charts endpoint — Optimized with Aggregation ────────────────────
export const getChartData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    // Group revenue by month using aggregation
    const monthlyRevenue = await Payment.aggregate([
      { 
        $match: { 
          status: 'Paid', 
          date: { $gte: twelveMonthsAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            year: { $year: "$date" }, 
            month: { $month: "$date" } 
          },
          revenue: { $sum: "$amount" }
        }
      }
    ]);

    const revenueMap = {};
    monthlyRevenue.forEach(item => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      revenueMap[key] = item.revenue;
    });

    const revenueData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueData.push({ name: MONTH_NAMES[d.getMonth()], revenue: revenueMap[key] || 0 });
    }

    const [activeMembers, expiredMembers] = await Promise.all([
      Member.countDocuments({
        status: 'Active',
        $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gte: today } }],
      }),
      Member.countDocuments({
        $or: [{ status: 'Expired' }, { status: 'Active', expiryDate: { $lt: today } }],
      })
    ]);

    const memberStatusData = [
      { name: 'Active', value: activeMembers },
      { name: 'Expired', value: expiredMembers },
    ];

    res.json({ revenueData, memberStatusData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Dynamic charts endpoint — Optimized ────────────────────────────────────
export const getDynamicChartData = async (req, res) => {
  try {
    const { type = 'monthly', month, year } = req.query;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const selectedYear  = parseInt(year  || today.getFullYear(), 10);
    const selectedMonth = parseInt(month || (today.getMonth() + 1), 10);

    if (type === 'yearly') {
      if (selectedYear > today.getFullYear()) return res.status(400).json({ error: 'Future year not allowed' });
    } else {
      if (selectedYear > today.getFullYear() || (selectedYear === today.getFullYear() && selectedMonth > today.getMonth() + 1)) {
        return res.status(400).json({ error: 'Future month not allowed' });
      }
    }

    let revenueData = [];
    let periodStart, periodEnd;

    if (type === 'monthly') {
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      periodStart = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
      periodEnd   = new Date(selectedYear, selectedMonth - 1, daysInMonth, 23, 59, 59, 999);

      const aggregation = await Payment.aggregate([
        { 
          $match: { 
            status: 'Paid', 
            renewDate: { $gte: periodStart, $lte: periodEnd } 
          } 
        },
        {
          $group: {
            _id: { $dayOfMonth: "$renewDate" },
            revenue: { $sum: "$amount" }
          }
        }
      ]);

      const dayMap = {};
      aggregation.forEach(item => dayMap[item._id] = item.revenue);

      for (let d = 1; d <= daysInMonth; d++) {
        revenueData.push({ name: String(d), revenue: dayMap[d] || 0 });
      }
    } else {
      const isCurrentYear = selectedYear === today.getFullYear();
      const maxMonth = isCurrentYear ? today.getMonth() + 1 : 12;
      periodStart = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
      periodEnd   = new Date(selectedYear, maxMonth - 1, new Date(selectedYear, maxMonth, 0).getDate(), 23, 59, 59, 999);

      const aggregation = await Payment.aggregate([
        { 
          $match: { 
            status: 'Paid', 
            renewDate: { $gte: periodStart, $lte: periodEnd } 
          } 
        },
        {
          $group: {
            _id: { $month: "$renewDate" },
            revenue: { $sum: "$amount" }
          }
        }
      ]);

      const monthMap = {};
      aggregation.forEach(item => monthMap[item._id - 1] = item.revenue); // convert 1-based month to 0-based

      for (let m = 0; m < maxMonth; m++) {
        revenueData.push({ name: MONTH_NAMES[m], revenue: monthMap[m] || 0 });
      }
    }

    const [activeCount, expiredCount] = await Promise.all([
      Member.countDocuments({
        status: { $ne: 'Temporary Discontinue' },
        joinDate: { $lte: periodEnd },
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gte: periodEnd } },
        ],
      }),
      Member.countDocuments({
        status: { $ne: 'Temporary Discontinue' },
        joinDate: { $lte: periodEnd },
        expiryDate: { $lt: periodEnd },
      })
    ]);

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
