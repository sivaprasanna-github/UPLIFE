import mongoose from 'mongoose';

/** 
 * POLICY SCHEMA
 * Stores the insurance contracts managed by Agents.
 */
const policySchema = new mongoose.Schema({
  policyNumber: {
    type: String,
    required: [true, 'Policy number is mandatory'],
    unique: true,
    uppercase: true,
    trim: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Policy must be assigned to an agent']
  },
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  insuranceType: {
    type: String,
    required: true,
    enum: ['Life', 'Health', 'Auto', 'Property', 'Travel'],
    default: 'Health'
  },
  premiumAmount: {
    type: Number,
    required: true,
    min: [0, 'Premium cannot be negative']
  },
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Terminated', 'Lapsed'],
    default: 'Active'
  },
  expiryDate: {
    type: Date,
    required: true
  }
}, { timestamps: true });

/** 
 * CLAIM SCHEMA
 * Stores insurance claims filed by Agents on behalf of clients.
 */
const claimSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  policyNumber: {
    type: String, // Linking by string for easier search, or use ObjectId for strictness
    required: [true, 'Policy number is required for a claim'],
    uppercase: true
  },
  clientName: {
    type: String,
    required: true
  },
  claimAmount: {
    type: Number,
    required: [true, 'Claim amount must be specified'],
    min: 0
  },
  description: {
    type: String,
    required: [true, 'Please provide claim reason/description'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Filed', 'Under Review', 'Approved', 'Paid', 'Rejected'],
    default: 'Filed'
  }
}, { timestamps: true });

/** 
 * NOTICE SCHEMA
 * Used for the "Notices/Notifications" list in your sidebar.
 */
const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  targetModule: {
    type: String,
    default: 'insurance' // So notices only show in insurance dashboard
  }
}, { timestamps: true });

// Performance Indexing
policySchema.index({ policyNumber: 1 });
claimSchema.index({ agent: 1, status: 1 });

const Policy = mongoose.model('Policy', policySchema);
const Claim = mongoose.model('Claim', claimSchema);
const Notice = mongoose.model('Notice', noticeSchema);

export { Policy, Claim, Notice };