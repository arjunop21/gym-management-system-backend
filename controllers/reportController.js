import Member from '../models/Member.js';
import Payment from '../models/Payment.js';
import Attendance from '../models/Attendance.js';

export const getDashboardStats = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalMembers = await Member.countDocuments();

  // Active = status is Active AND (no expiryDate OR expiryDate >= today)
  const activeMembers = await Member.countDocuments({
    status: 'Active',
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: null },
      { expiryDate: { $gte: today } },
    ],
  });

  // Expired = status is 'Expired' OR (status is 'Active' but expiryDate has passed)
  // This matches the frontend's dynamicStatus logic exactly
  const expiredMembers = await Member.countDocuments({
    $or: [
      { status: 'Expired' },
      { status: 'Active', expiryDate: { $lt: today } },
    ],
  });

  const payments = await Payment.find({ status: 'Paid' });
  const monthlyRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

  res.json({
    totalMembers,
    activeMembers,
    expiredMembers,
    monthlyRevenue
  });
};

export const getReports = async (req, res) => {
  // basic reporting logic or just redirecting to dashboard stats for now
  res.json({ message: "Reports logic goes here" });
};
