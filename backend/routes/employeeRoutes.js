import express from 'express';
import { Client } from '../models/LoanModels.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Create a new Loan Client/Application
// @route   POST /api/employee/create-client
// @access  Private (Employee only)
router.post('/create-client', protect, authorize('employee'), async (req, res, next) => {
  try {
    const { fullName, email, phone, loanAmount } = req.body;

    const client = new Client({
      employee: req.user._id, // Tied to the logged-in employee
      fullName,
      email,
      phone,
      loanAmount
    });

    const createdClient = await client.save();
    res.status(201).json(createdClient);
  } catch (error) {
    next(error);
  }
});

// @desc    Get all clients for the logged-in Employee
// @route   GET /api/employee/my-clients
// @access  Private (Employee only)
router.get('/my-clients', protect, authorize('employee'), async (req, res, next) => {
  try {
    const clients = await Client.find({ employee: req.user._id }).sort('-createdAt');
    res.json(clients);
  } catch (error) {
    next(error);
  }
});

export default router;