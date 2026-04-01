import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  photo: { type: String, default: '' },
  joinDate: { type: Date, default: Date.now },
  membershipPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  expiryDate: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Expired', 'Temporary Discontinue'], default: 'Active' },
  personalTraining: { type: Boolean, default: false },
  personalTrainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
}, { timestamps: true });

export default mongoose.model('Member', memberSchema);
