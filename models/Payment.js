import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  membershipPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  renewDate: { type: Date, required: true },   // membership renewal start date
  expiryDate: { type: Date, required: true },  // new expiry = renewDate + plan.duration months
  status: { type: String, enum: ['Paid', 'Unpaid'], default: 'Paid' }
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
