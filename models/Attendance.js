import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['Present', 'Absent'], default: 'Present' }
}, { timestamps: true });

export default mongoose.model('Attendance', attendanceSchema);
