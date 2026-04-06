import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true
  },
  date: { type: Date, default: Date.now, index: true },
  status: { type: String, enum: ['Present', 'Absent'], default: 'Present', index: true }
}, { timestamps: true });

export default mongoose.model('Attendance', attendanceSchema);
