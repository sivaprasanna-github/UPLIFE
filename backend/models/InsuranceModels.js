import mongoose from 'mongoose';

const policySchema = new mongoose.Schema({
  policyNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientName: { type: String, required: true, trim: true },
  clientPhone: { type: String, trim: true, default: '' },
  clientEmail: { type: String, trim: true, default: '' },
  insuranceType: {
    type: String, required: true,
    enum: ['Life', 'Health', 'Auto', 'Property', 'Travel'], default: 'Health'
  },
  premiumAmount: { type: Number, required: true, min: 0 },
  sumAssured: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Terminated', 'Lapsed'], default: 'Active'
  },
  expiryDate: { type: Date, required: true },
  remarks: { type: String, trim: true, default: '' }
}, { timestamps: true });

const claimSchema = new mongoose.Schema({
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  policyNumber: { type: String, required: true, uppercase: true },
  clientName: { type: String, required: true },
  claimAmount: { type: Number, required: true, min: 0 },
  description: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['Filed', 'Under Review', 'Approved', 'Paid', 'Rejected'], default: 'Filed'
  },
  adminRemarks: { type: String, default: '' }
}, { timestamps: true });

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium'
  },
  targetModule: { type: String, default: 'insurance' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Commission: auto-calculated when policy is created
const commissionSchema = new mongoose.Schema({
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  policy: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy', required: true },
  policyNumber: { type: String, required: true },
  clientName: { type: String, required: true },
  insuranceType: { type: String, required: true },
  premiumAmount: { type: Number, required: true },
  commissionRate: { type: Number, required: true }, // percentage
  commissionAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Paid'], default: 'Pending'
  }
}, { timestamps: true });

claimSchema.index({ agent: 1, status: 1 });
commissionSchema.index({ agent: 1, status: 1 });

const Policy     = mongoose.model('Policy',     policySchema);
const Claim      = mongoose.model('Claim',      claimSchema);
const Notice     = mongoose.model('Notice',     noticeSchema);
const Commission = mongoose.model('Commission', commissionSchema);

export { Policy, Claim, Notice, Commission };