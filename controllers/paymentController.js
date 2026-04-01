import Payment from '../models/Payment.js';

export const getPayments = async (req, res) => {
  const payments = await Payment.find().populate('memberId', 'name phone');
  res.json(payments);
};

export const createPayment = async (req, res) => {
  const { memberId, amount, date, status } = req.body;
  const payment = new Payment({ memberId, amount, date, status });
  const createdPayment = await payment.save();
  res.status(201).json(createdPayment);
};
