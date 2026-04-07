import mongoose from 'mongoose';

const loanUserSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sno:         { type: Number },
  date:        { type: Date, default: Date.now },
  fullName:    { type: String, required: true, trim: true },
  phone:       { type: String, required: true, trim: true },
  leadName:    { type: String, trim: true, default: '' },
  loanType: {
    type: String,
    enum: [
      'Personal Loan', 'Business Loan',
      'Home Loan - Construction Flat', 'Home Loan - Independent House',
      'Home Loan - Plot Purchase', 'Home Loan - Plot + Construction',
      'Mortgage Loan - Residential', 'Mortgage Loan - Commercial', 'Mortgage Loan - Open Plot',
      'Education Loan', 'Used Car Loan', 'New Car Loan', 'Car Refinance', 'None'
    ],
    default: 'None'
  },
  loanAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Active', 'Inactive'],
    default: 'Pending'
  },
  remarks: { type: String, trim: true, default: '' }
}, { timestamps: true });

loanUserSchema.index({ phone: 1 });
loanUserSchema.index({ createdBy: 1 });

// Auto-generate sno before saving
loanUserSchema.pre('save', async function (next) {
  if (!this.sno) {
    const count = await mongoose.model('LoanUser').countDocuments();
    this.sno = count + 1;
  }
  next();
});

const LoanUser = mongoose.model('LoanUser', loanUserSchema);
export default LoanUser;