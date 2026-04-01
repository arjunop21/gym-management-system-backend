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
