import mongoose from 'mongoose';

const loanUserSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  aadharNumber: { type: String, trim: true, default: '' },
  panNumber:    { type: String, trim: true, uppercase: true, default: '' },
  employmentType: {
    type: String,
    enum: ['Salaried', 'Self-Employed', 'Business', 'Farmer', 'Retired', 'Other'],
    default: 'Salaried'
  },
  employerName:    { type: String, trim: true, default: '' },
  monthlyIncome:   { type: Number, default: 0 },
  existingEMIs:    { type: Number, default: 0 }, 
  creditScore:     { type: Number, default: 0 },
  preferredLoanType: {
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
  requiredLoanAmount: { type: Number, default: 0 },
  propertyValue:      { type: Number, default: 0 },
  propertyAddress:    { type: String, trim: true, default: '' },
  leadSource: {
    type: String,
    enum: ['Walk-in', 'Online', 'Agent Referral', 'Employee Referral', 'Advertisement', 'Other'],
    default: 'Walk-in'
  },
  remarks: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Blacklisted'],
    default: 'Active'
  }
}, { timestamps: true });

loanUserSchema.index({ email: 1 });
loanUserSchema.index({ phone: 1 });
loanUserSchema.index({ createdBy: 1 });

const LoanUser = mongoose.model('LoanUser', loanUserSchema);
export default LoanUser;