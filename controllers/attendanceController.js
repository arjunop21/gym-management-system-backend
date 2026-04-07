import Attendance from '../models/Attendance.js';

export const getAttendance = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [attendance, total] = await Promise.all([
      Attendance.find()
        .populate({
          path: 'memberId',
          select: 'name personalTraining personalTrainerId',
          populate: { path: 'personalTrainerId', select: 'name' }
        })
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Attendance.countDocuments()
    ]);

    res.json({
      attendance,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAttendance = async (req, res) => {
  const { memberId, status, date } = req.body;
  const attendance = new Attendance({ memberId, status, date });
  await attendance.save();
  res.status(201).json(attendance);
};

export const deleteAttendance = async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);
  if (attendance) {
    await attendance.deleteOne();
    res.json({ message: 'Attendance record removed' });
  } else {
    res.status(404).json({ message: 'Attendance record not found' });
  }
};
