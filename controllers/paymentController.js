import Payment from '../models/Payment.js';
import Member from '../models/Member.js';
import Plan from '../models/Plan.js';

// @desc  Get all payments
// @route GET /api/payments
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('memberId', 'name phone')
      .populate('membershipPlan', 'name price duration')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Create payment + update member's joinDate & expiryDate
// @route POST /api/payments
export const createPayment = async (req, res) => {
  try {
    const { memberId, membershipPlan, amount, date, renewDate, expiryDate, status } = req.body;

    // Validate plan exists
    const plan = await Plan.findById(membershipPlan);
    if (!plan) return res.status(400).json({ message: 'Invalid membership plan' });

    // Validate member exists
    const member = await Member.findById(memberId);
    if (!member) return res.status(400).json({ message: 'Member not found' });

    // Calculate expiryDate from renewDate + plan.duration months
    const renewStart = renewDate ? new Date(renewDate) : new Date();

    // Check for duplicate payment (same member, same renewal day)
    const startOfDay = new Date(renewStart);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(renewStart);
    endOfDay.setHours(23, 59, 59, 999);

    const existingPayment = await Payment.findOne({
      memberId,
      renewDate: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingPayment) {
      return res.status(400).json({ message: 'A payment record for this member on this date already exists.' });
    }

    const expiry = expiryDate ? new Date(expiryDate) : (() => {
      const d = new Date(renewStart);
      d.setMonth(d.getMonth() + plan.duration);
      return d;
    })();

    // Save payment
    const payment = new Payment({
      memberId,
      membershipPlan,
      amount,
      date: date || new Date(),
      renewDate: renewStart,
      expiryDate: expiry,
      status: status || 'Paid'
    });
    const createdPayment = await payment.save();

    // Update member's joinDate (renew date) and expiryDate and plan
    member.joinDate = renewStart;
    member.expiryDate = expiry;
    member.membershipPlan = membershipPlan;
    member.status = 'Active';
    await member.save();

    // Populate and return
    await createdPayment.populate('memberId', 'name phone');
    await createdPayment.populate('membershipPlan', 'name price duration');

    res.status(201).json(createdPayment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc  Update payment + re-sync member's joinDate & expiryDate
// @route PUT /api/payments/:id
export const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const { membershipPlan, amount, renewDate, expiryDate, status } = req.body;

    // Resolve plan
    const planId = membershipPlan || payment.membershipPlan;
    const plan = await Plan.findById(planId);
    if (!plan) return res.status(400).json({ message: 'Invalid membership plan' });

    // Resolve dates
    const renewStart = renewDate ? new Date(renewDate) : payment.renewDate;

    // Check for duplicate payment (excluding this one)
    const startOfDay = new Date(renewStart);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(renewStart);
    endOfDay.setHours(23, 59, 59, 999);

    const existingPayment = await Payment.findOne({
      memberId: payment.memberId,
      _id: { $ne: payment._id },
      renewDate: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingPayment) {
      return res.status(400).json({ message: 'Another payment record for this member on this date already exists.' });
    }
    const expiry = expiryDate
      ? new Date(expiryDate)
      : (() => {
          const d = new Date(renewStart);
          d.setMonth(d.getMonth() + plan.duration);
          return d;
        })();

    // Update payment fields
    payment.membershipPlan = planId;
    payment.amount         = amount        ?? payment.amount;
    payment.renewDate      = renewStart;
    payment.expiryDate     = expiry;
    payment.status         = status        ?? payment.status;

    const updatedPayment = await payment.save();

    // Sync member
    const member = await Member.findById(payment.memberId);
    if (member) {
      member.joinDate       = renewStart;
      member.expiryDate     = expiry;
      member.membershipPlan = planId;
      member.status         = 'Active';
      await member.save();
    }

    await updatedPayment.populate('memberId', 'name phone');
    await updatedPayment.populate('membershipPlan', 'name price duration');

    res.json(updatedPayment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc  Delete payment
// @route DELETE /api/payments/:id
export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (payment) {
      await payment.deleteOne();
      res.json({ message: 'Payment record removed' });
    } else {
      res.status(404).json({ message: 'Payment record not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
