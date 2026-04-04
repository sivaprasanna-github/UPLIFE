import mongoose from "mongoose";

const loanApplicationSchema = new mongoose.Schema(
  {
    loanId: {
      type: String,
      required: true,
      unique: true,
    },
    client: {
      type: String,
      required: true,
    },
    // The ID of the employee who created this loan (retrieved from your frontend sessionStorage)
    employeeId: {
      type: String, 
      required: true,
    },
    // Storing employee name for easy display in the Admin table
    employee: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Under Review", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("LoanApplication", loanApplicationSchema);