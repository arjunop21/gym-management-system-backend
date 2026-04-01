import Member from '../models/Member.js';
import Payment from '../models/Payment.js';
import Attendance from '../models/Attendance.js';

export const getDashboardStats = async (req, res) => {
  const totalMembers = await Member.countDocuments();
  const activeMembers = await Member.countDocuments({ status: 'Active' });
  const expiredMembers = await Member.countDocuments({ status: 'Expired' });
  
  const payments = await Payment.find({ status: 'Paid' });
  const monthlyRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0); // Simplified. Needs date filtering for real case

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
