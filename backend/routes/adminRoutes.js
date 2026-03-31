import express from 'express';
import User from '../models/User.js';
import { Client } from '../models/LoanModels.js';
import { Policy, Claim } from '../models/InsuranceModels.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── CREATE EMPLOYEE ────────────────────────────────────────────────────────────
// POST /api/admin/create-employee
router.post('/create-employee', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name, email, password,
      role: 'employee',
      department: 'loan'
    });

    // Return plain-text password so admin can share it with the new employee
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      plainPassword: password   // ← returned once, not stored in plain form
    });
  } catch (error) { next(error); }
});

// ── CREATE AGENT ───────────────────────────────────────────────────────────────
// POST /api/admin/create-agent
router.post('/create-agent', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name, email, password,
      role: 'agent',
      department: 'insurance'
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      plainPassword: password   // ← returned once for admin to share
    });
  } catch (error) { next(error); }
});

// ── LIST EMPLOYEES ─────────────────────────────────────────────────────────────
// GET /api/admin/employees
router.get('/employees', protect, authorize('admin'), async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'employee', department: 'loan' })
      .select('-password').sort('-createdAt');
    res.json(employees);
  } catch (error) { next(error); }
});

// ── LIST AGENTS ────────────────────────────────────────────────────────────────
// GET /api/admin/agents  (alias also at /api/insurance/agents used by CreateAgent)
router.get('/agents', protect, authorize('admin'), async (req, res, next) => {
  try {
    const agents = await User.find({ role: 'agent', department: 'insurance' })
      .select('-password').sort('-createdAt');

    // Attach policyCount & claimCount for display
    const enriched = await Promise.all(agents.map(async (a) => {
      const [policyCount, claimCount] = await Promise.all([
        Policy.countDocuments({ agent: a._id }),
        Claim.countDocuments({ agent: a._id })
      ]);
      return { ...a.toObject(), policyCount, claimCount };
    }));

    res.json(enriched);
  } catch (error) { next(error); }
});

// ── ADMIN: ALL LOAN CLIENTS ────────────────────────────────────────────────────
// GET /api/admin/loan/clients
router.get('/loan/clients', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { status, loanType, search } = req.query;
    let query = {};
    if (status   && status   !== 'all') query.status   = status;
    if (loanType && loanType !== 'all') query.loanType = loanType;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone:    { $regex: search, $options: 'i' } },
        { email:    { $regex: search, $options: 'i' } }
      ];
    }
    const clients = await Client.find(query)
      .populate('employee', 'name email')
      .sort('-createdAt');
    res.json(clients);
  } catch (error) { next(error); }
});

// PATCH /api/admin/loan/client/:id/status
router.patch('/loan/client/:id/status', protect, authorize('admin'), async (req, res, next) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (error) { next(error); }
});

// ── ADMIN: ALL INSURANCE POLICIES ─────────────────────────────────────────────
// GET /api/admin/insurance/policies
router.get('/insurance/policies', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { status, insuranceType, search } = req.query;
    let query = {};
    if (status        && status        !== 'all') query.status        = status;
    if (insuranceType && insuranceType !== 'all') query.insuranceType = insuranceType;
    if (search) {
      query.$or = [
        { clientName:   { $regex: search, $options: 'i' } },
        { policyNumber: { $regex: search, $options: 'i' } }
      ];
    }
    const policies = await Policy.find(query)
      .populate('agent', 'name email')
      .sort('-createdAt');
    res.json(policies);
  } catch (error) { next(error); }
});

// ── ADMIN: LOAN STATS ──────────────────────────────────────────────────────────
// GET /api/admin/loan/stats
router.get('/loan/stats', protect, authorize('admin'), async (req, res, next) => {
  try {
    const [total, pending, approved, rejected] = await Promise.all([
      Client.countDocuments(),
      Client.countDocuments({ status: 'pending' }),
      Client.countDocuments({ status: 'approved' }),
      Client.countDocuments({ status: 'rejected' })
    ]);
    const result = await Client.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$loanAmount' } } }
    ]);
    const approvedAmount = result[0]?.total || 0;
    res.json({ total, pending, approved, rejected, approvedAmount });
  } catch (error) { next(error); }
});

export default router;