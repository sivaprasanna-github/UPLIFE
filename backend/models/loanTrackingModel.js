import mongoose from 'mongoose';

const emiSchema = new mongoose.Schema({
  emiNumber:   { type: Number, required: true },
  dueDate:     { type: Date, required: true },
  amount:      { type: Number, required: true },
  paidDate:    { type: Date },
  status:      { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' },
  remarks:     { type: String, trim: true, default: '' }
}, { _id: true });

const loanTrackingSchema = new mongoose.Schema({
  // Link to the LoanUser
  loanUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanUser',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Core loan fields
  loanType: {
    type: String,
    enum: [
      'Personal Loan', 'Business Loan',
      'Home Loan - Construction Flat', 'Home Loan - Independent House',
      'Home Loan - Plot Purchase', 'Home Loan - Plot + Construction',
      'Mortgage Loan - Residential', 'Mortgage Loan - Commercial', 'Mortgage Loan - Open Plot',
      'Education Loan', 'Used Car Loan', 'New Car Loan', 'Car Refinance', 'None'
    ],
    required: true
  },

  // Financial fields
  totalAmount:       { type: Number, required: true, min: 0 },   // Principal sanctioned
  interestRate:      { type: Number, default: 0, min: 0 },        // Annual % rate
  tenureMonths:      { type: Number, required: true, min: 1 },    // Loan tenure in months
  emiAmount:         { type: Number, required: true, min: 0 },    // Monthly EMI
  paidAmount:        { type: Number, default: 0, min: 0 },        // Total paid so far
  dueAmount:         { type: Number, default: 0, min: 0 },        // Remaining balance

  // Dates
  disbursementDate:  { type: Date, default: Date.now },
  nextDueDate:       { type: Date },

  // Status
  trackingStatus: {
    type: String,
    enum: ['Active', 'Closed', 'NPA', 'Restructured'],
    default: 'Active'
  },

  // EMI schedule (auto-generated)
  emiSchedule: [emiSchema],

  remarks: { type: String, trim: true, default: '' }
}, { timestamps: true });

// Indexes
loanTrackingSchema.index({ loanUser: 1 });
loanTrackingSchema.index({ createdBy: 1 });
loanTrackingSchema.index({ trackingStatus: 1 });

// Auto-calculate dueAmount before save
loanTrackingSchema.pre('save', function (next) {
  this.dueAmount = Math.max(0, this.totalAmount - this.paidAmount);
  next();
});

// Virtual: paid EMI count
loanTrackingSchema.virtual('paidEmiCount').get(function () {
  return this.emiSchedule.filter(e => e.status === 'Paid').length;
});

// Virtual: pending EMI count
loanTrackingSchema.virtual('pendingEmiCount').get(function () {
  return this.emiSchedule.filter(e => e.status === 'Pending' || e.status === 'Overdue').length;
});

loanTrackingSchema.set('toJSON', { virtuals: true });
loanTrackingSchema.set('toObject', { virtuals: true });

const LoanTracking = mongoose.model('LoanTracking', loanTrackingSchema);
export default LoanTracking;