import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName:   { type: String, required: true, trim: true },
  email:      { type: String, required: true, trim: true },
  phone:      { type: String, required: true, trim: true },
  loanAmount: { type: Number, required: true },
  loanType: {
    type: String,
    required: true,
    enum: [
      'Personal Loan',
      'Business Loan',
      'Home Loan - Construction Flat',
      'Home Loan - Independent House',
      'Home Loan - Plot Purchase',
      'Home Loan - Plot + Construction',
      'Mortgage Loan - Residential',
      'Mortgage Loan - Commercial',
      'Mortgage Loan - Open Plot',
      'Education Loan',
      'Used Car Loan',
      'New Car Loan',
      'Car Refinance'
    ],
    default: 'Personal Loan'
  },
  leadName:  { type: String, trim: true, default: '' },
  remarks:   { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

export const Client = mongoose.model('Client', clientSchema);