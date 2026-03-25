import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    owner: { 
      type: String, 
      required: true 
    },
    ph: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    address: { 
      type: String, 
      required: true 
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);