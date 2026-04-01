import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['Paid', 'Unpaid'], default: 'Paid' }
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
