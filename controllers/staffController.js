import Staff from '../models/Staff.js';
import Member from '../models/Member.js';

// @desc    Get all staff
// @route   GET /api/staff
export const getStaff = async (req, res) => {
  try {
    const staff = await Staff.find();
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create staff
// @route   POST /api/staff
export const createStaff = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const staff = new Staff({ name, phone, address });
    const createdStaff = await staff.save();
    res.status(201).json(createdStaff);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update staff
// @route   PUT /api/staff/:id
export const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (staff) {
      staff.name = req.body.name || staff.name;
      staff.phone = req.body.phone || staff.phone;
      staff.address = req.body.address || staff.address;
      const updatedStaff = await staff.save();
      res.json(updatedStaff);
    } else {
      res.status(404).json({ message: 'Staff not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete staff
// @route   DELETE /api/staff/:id
export const deleteStaff = async (req, res) => {
  try {
    // Check if staff is assigned to any members
    const membersWithStaff = await Member.countDocuments({ personalTrainerId: req.params.id });
    if (membersWithStaff > 0) {
      return res.status(400).json({ message: 'Cannot delete staff. They are assigned as a personal trainer to one or more members.' });
    }

    const staff = await Staff.findById(req.params.id);
    if (staff) {
      await staff.deleteOne();
      res.json({ message: 'Staff removed' });
    } else {
      res.status(404).json({ message: 'Staff not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get members assigned to a specific staff
// @route   GET /api/staff/:id/members
export const getStaffMembers = async (req, res) => {
  try {
    const members = await Member.find({ personalTrainerId: req.params.id }).select('name phone status');
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
