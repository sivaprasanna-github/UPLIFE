import express from "express";
import LoanApplication from "../models/LoanApplication.js";

const router = express.Router();

// ==========================================
// 1. CREATE LOAN APPLICATION (For Employee)
// ==========================================
router.post("/applications", async (req, res) => {
  try {
    const { client, employeeId, employee, type, amount } = req.body;

    const count = await LoanApplication.countDocuments();
    const newLoanId = `LN-${1001 + count}`;

    const newApplication = new LoanApplication({
      loanId: newLoanId,
      client,
      employeeId,
      employee,
      type,
      amount,
      status: "Pending", 
    });

    const savedApplication = await newApplication.save();
    res.status(201).json({ success: true, data: savedApplication });

  } catch (error) {
    console.error("Error creating loan:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 2. GET ALL LOANS FOR A SPECIFIC EMPLOYEE
// ==========================================
router.get("/applications/employee/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const loans = await LoanApplication.find({ employeeId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: loans });
  } catch (error) {
    console.error("Error fetching employee loans:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 3. GET ALL LOANS (For Admin)
// ==========================================
router.get("/applications/all", async (req, res) => {
  try {
    const loans = await LoanApplication.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: loans });
  } catch (error) {
    console.error("Error fetching all loans:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 4. UPDATE LOAN STATUS (For Admin)
// ==========================================
router.put("/applications/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const updatedLoan = await LoanApplication.findOneAndUpdate(
      { loanId: req.params.id },
      { status },
      { new: true } 
    );
    if (!updatedLoan) return res.status(404).json({ success: false, message: "Loan not found" });
    res.status(200).json({ success: true, data: updatedLoan });
  } catch (error) {
    console.error("Error updating loan status:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 5. UPDATE LOAN DETAILS (For Employee Edit)
// ==========================================
router.put("/applications/:id", async (req, res) => {
  try {
    const { client, type, amount } = req.body;
    const updatedLoan = await LoanApplication.findOneAndUpdate(
      { loanId: req.params.id },
      { client, type, amount },
      { new: true }
    );
    if (!updatedLoan) return res.status(404).json({ success: false, message: "Loan not found" });
    res.status(200).json({ success: true, data: updatedLoan });
  } catch (error) {
    console.error("Error updating loan:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ==========================================
// 6. DELETE LOAN (For Employee/Admin Delete)
// ==========================================
router.delete("/applications/:id", async (req, res) => {
  try {
    const deletedLoan = await LoanApplication.findOneAndDelete({ loanId: req.params.id });
    if (!deletedLoan) return res.status(404).json({ success: false, message: "Loan not found" });
    res.status(200).json({ success: true, message: "Loan deleted successfully" });
  } catch (error) {
    console.error("Error deleting loan:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;