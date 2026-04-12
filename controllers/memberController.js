import Member from '../models/Member.js';
import Plan from '../models/Plan.js';

// @desc    Get all members
// @route   GET /api/members
export const getMembers = async (req, res) => {
  try {
    const members = await Member.find()
      .populate('membershipPlan', 'name price duration')
      .lean();
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new member
// @route   POST /api/members
export const createMember = async (req, res) => {
  try {
    const { name, phone, address, photo, membershipPlan, joinDate, status, personalTraining, personalTrainerId } = req.body;

    // Check if phone already exists
    const existingMember = await Member.findOne({ phone });
    if (existingMember) {
      return res.status(400).json({ message: `Member with phone number ${phone} already exists.` });
    }

    // Auto-calculate expiryDate from joinDate + plan.duration months
    const plan = await Plan.findById(membershipPlan);
    if (!plan) return res.status(400).json({ message: 'Invalid membership plan' });

    const startDate = joinDate ? new Date(joinDate) : new Date();
    const expiry = new Date(startDate);
    expiry.setMonth(expiry.getMonth() + plan.duration);

    const member = new Member({
      name, phone, address, photo, membershipPlan,
      joinDate: startDate,
      expiryDate: expiry,
      status, personalTraining,
      personalTrainerId: personalTrainerId || null
    });

    const createdMember = await member.save();
    res.status(201).json(createdMember);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update member
// @route   PUT /api/members/:id
export const updateMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (member) {
      // Check if phone already exists (and it's not THIS member)
      if (req.body.phone && req.body.phone !== member.phone) {
        const existingMember = await Member.findOne({ phone: req.body.phone });
        if (existingMember) {
          return res.status(400).json({ message: `Another member with phone number ${req.body.phone} already exists.` });
        }
      }

      member.name = req.body.name || member.name;
      member.phone = req.body.phone || member.phone;
      member.address = req.body.address || member.address;
      member.photo = req.body.photo || member.photo;

      // If plan or joinDate changed, recalculate expiryDate
      const newPlanId = req.body.membershipPlan || member.membershipPlan;
      const newJoinDate = req.body.joinDate ? new Date(req.body.joinDate) : member.joinDate;

      if (req.body.membershipPlan || req.body.joinDate) {
        const plan = await Plan.findById(newPlanId);
        if (plan) {
          const expiry = new Date(newJoinDate);
          expiry.setMonth(expiry.getMonth() + plan.duration);
          member.expiryDate = expiry;
        }
      }

      member.membershipPlan = newPlanId;
      member.joinDate = newJoinDate;
      member.status = req.body.status || member.status;
      if (req.body.personalTraining !== undefined) member.personalTraining = req.body.personalTraining;
      if (req.body.personalTrainerId !== undefined) member.personalTrainerId = req.body.personalTrainerId || null;

      const updatedMember = await member.save();
      res.json(updatedMember);
    } else {
      res.status(404).json({ message: 'Member not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete member
// @route   DELETE /api/members/:id
export const deleteMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (member) {
      await member.deleteOne();
      res.json({ message: 'Member removed' });
    } else {
      res.status(404).json({ message: 'Member not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get expiring soon members
// @route   GET /api/members/expiring-soon
export const getExpiringMembers = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
    next7Days.setHours(23, 59, 59, 999);

    const members = await Member.find({
      expiryDate: { $gte: today, $lte: next7Days },
      status: { $ne: 'Temporary Discontinue' }
    }, '_id name phone photo expiryDate')
    .lean();

    const expiringMembers = members.map(member => {
      const expiry = new Date(member.expiryDate);
      const diffTime = expiry - new Date();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...member, daysRemaining: daysRemaining >= 0 ? daysRemaining : 0 };
    });

    res.json(expiringMembers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get expired members
// @route   GET /api/members/expired
export const getExpiredMembers = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const members = await Member.find({
      $or: [
        { status: 'Expired' },
        { status: 'Active', expiryDate: { $lt: today } }
      ]
    }, '_id name phone joinDate photo expiryDate status')
    .lean();

    const expiredMembers = members.map(member => {
      const expiry = new Date(member.expiryDate);
      const diffTime = new Date() - expiry;
      const daysExpired = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...member, daysExpired: daysExpired >= 0 ? daysExpired : 0 };
    });

    res.json(expiredMembers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
