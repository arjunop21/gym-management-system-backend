import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true
  },
  membershipPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
    index: true
  },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now, index: true },
  renewDate: { type: Date, required: true, index: true },   // membership renewal start date
  expiryDate: { type: Date, required: true, index: true },  // new expiry = renewDate + plan.duration months
  status: { type: String, enum: ['Paid', 'Unpaid'], default: 'Paid', index: true }
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
