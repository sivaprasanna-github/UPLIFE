import express from 'express';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Create a new Loan Employee
// @route   POST /api/admin/create-employee
router.post('/create-employee', protect, authorize('admin'), async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const employee = await User.create({
    name,
    email,
    password,
    role: 'employee',
    department: 'loan'
  });

  if (employee) {
    res.status(201).json({ message: 'Loan Employee created successfully' });
  } else {
    res.status(400);
    throw new Error('Invalid employee data');
  }
});

// @desc    Create a new Insurance Agent
// @route   POST /api/admin/create-agent
router.post('/create-agent', protect, authorize('admin'), async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const agent = await User.create({
    name,
    email,
    password,
    role: 'agent',
    department: 'insurance'
  });

  if (agent) {
    res.status(201).json({ message: 'Insurance Agent registered successfully' });
  } else {
    res.status(400);
    throw new Error('Invalid agent data');
  }
});

export default router;