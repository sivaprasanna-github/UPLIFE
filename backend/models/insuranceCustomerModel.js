import mongoose from 'mongoose';

// InsuranceCustomer: A person registered as a customer in the insurance system.
// Separate from Policy — one customer can have multiple policies.
const insuranceCustomerSchema = new mongoose.Schema({
  // Created by admin or agent
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ── Personal Details ──────────────────────────────────────────────────────
  fullName:    { type: String, required: true, trim: true },
  dateOfBirth: { type: Date,   required: true },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  phone:       { type: String, required: true, trim: true },
  email:       { type: String, required: true, trim: true },
  address:     { type: String, trim: true, default: '' },
  city:        { type: String, trim: true, default: '' },
  state:       { type: String, trim: true, default: '' },
  pincode:     { type: String, trim: true, default: '' },

  // ── Identity ──────────────────────────────────────────────────────────────
  aadharNumber: { type: String, trim: true, default: '' },
  panNumber:    { type: String, trim: true, uppercase: true, default: '' },

  // ── Insurance-Specific ────────────────────────────────────────────────────
  customerType: {
    type: String,
    enum: ['Individual', 'Corporate'],
    default: 'Individual'
  },
  preferredInsuranceType: {
    type: String,
    enum: ['Life', 'Health', 'Auto', 'Property', 'Travel', 'None'],
    default: 'None'
  },
  nomineeFullName:    { type: String, trim: true, default: '' },
  nomineeRelation:    { type: String, trim: true, default: '' },
  nomineePhone:       { type: String, trim: true, default: '' },
  occupation:         { type: String, trim: true, default: '' },
  annualIncome:       { type: Number, default: 0 },
  existingConditions: { type: String, trim: true, default: '' }, // for health insurance
  remarks:            { type: String, trim: true, default: '' },

  // ── Status ────────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Blacklisted'],
    default: 'Active'
  }
}, { timestamps: true });

insuranceCustomerSchema.index({ email: 1 });
insuranceCustomerSchema.index({ phone: 1 });
insuranceCustomerSchema.index({ createdBy: 1 });

const InsuranceCustomer = mongoose.model('InsuranceCustomer', insuranceCustomerSchema);
export default InsuranceCustomer;