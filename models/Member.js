import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  phone: { type: String, required: true, index: true },
  address: { type: String, required: true },
  photo: { type: String, default: '' },
  joinDate: { type: Date, default: Date.now, index: true },
  membershipPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
    index: true
  },
  expiryDate: { type: Date, required: false, index: true },
  status: { type: String, enum: ['Active', 'Expired', 'Temporary Discontinue'], default: 'Active', index: true },
  personalTraining: { type: Boolean, default: false, index: true },
  personalTrainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null, index: true },
}, { timestamps: true });

export default mongoose.model('Member', memberSchema);
