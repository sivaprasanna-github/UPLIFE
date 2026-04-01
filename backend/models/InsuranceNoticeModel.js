import mongoose from 'mongoose';

const insuranceNoticeSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Notice title is required'], 
    trim: true 
  },
  message: { 
    type: String, 
    required: [true, 'Notice message is required'], 
    trim: true 
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true // Automatically creates createdAt and updatedAt fields
});

const InsuranceNotice = mongoose.model('InsuranceNotice', insuranceNoticeSchema);
export default InsuranceNotice;