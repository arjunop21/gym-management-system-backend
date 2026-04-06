import Attendance from '../models/Attendance.js';

export const getAttendance = async (req, res) => {
  const attendance = await Attendance.find().populate({
    path: 'memberId',
    select: 'name personalTraining personalTrainerId',
    populate: { path: 'personalTrainerId', select: 'name' }
  });
  res.json(attendance);
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
