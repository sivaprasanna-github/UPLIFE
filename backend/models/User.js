import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'employee', 'agent'],
      default: 'employee',
    },
    department: {
      type: String,
      enum: ['loan', 'insurance', 'admin'],
      default: 'loan',
    },

    // ── Agent-specific fields ────────────────────────────────────────────────
    phone: {
      type: String,
      trim: true,
      default: '',
    },

    // Unique agent identifier  e.g. "TS010203 00001"
    agentId: {
      type: String,
      unique: true,
      sparse: true,   // null/undefined for non-agent users won't violate uniqueness
      uppercase: true,
      trim: true,
    },

    // Hierarchical location for agent jurisdiction
    location: {
      stateCode:    { type: String, default: '' },
      stateName:    { type: String, default: '' },
      districtId:   { type: String, default: '' },
      districtName: { type: String, default: '' },
      mandalId:     { type: String, default: '' },
      mandalName:   { type: String, default: '' },
      villageId:    { type: String, default: '' },
      villageName:  { type: String, default: '' },
    },
    // ── End agent-specific fields ────────────────────────────────────────────
  },
  { timestamps: true }
);

// ✅ FIXED: Removed 'next' because this is an async function
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return; // Just return normally
  this.password = await bcrypt.hash(this.password, 10);
});

// Match password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;