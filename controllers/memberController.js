import Member from '../models/Member.js';

// @desc    Get all members
// @route   GET /api/members
export const getMembers = async (req, res) => {
  try {
    const members = await Member.find().populate('membershipPlan', 'name price duration');
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new member
// @route   POST /api/members
export const createMember = async (req, res) => {
  try {
    const { name, phone, address, photo, membershipPlan, expiryDate, status, personalTraining, personalTrainerId } = req.body;
    
    // Calculate expiryDate if not provided
    // For simplicity, handle it on frontend or do simple calculation here
    
    const member = new Member({
      name, phone, address, photo, membershipPlan, expiryDate, status, personalTraining, personalTrainerId: personalTrainerId || null
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
      member.name = req.body.name || member.name;
      member.phone = req.body.phone || member.phone;
      member.address = req.body.address || member.address;
      member.photo = req.body.photo || member.photo;
      member.membershipPlan = req.body.membershipPlan || member.membershipPlan;
      member.expiryDate = req.body.expiryDate || member.expiryDate;
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
    }).lean();

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
