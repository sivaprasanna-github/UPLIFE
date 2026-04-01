import express from 'express';
import LoanUser from '../models/LoanUserModel.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── STATS (MUST BE ABOVE /:id TO PREVENT ROUTE COLLISION) ─────────────────────
// GET /api/loan/users/stats/summary
router.get('/stats/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const [total, active, inactive] = await Promise.all([
      LoanUser.countDocuments(),
      LoanUser.countDocuments({ status: 'Active' }),
      LoanUser.countDocuments({ status: 'Inactive' }),
    ]);
    const byEmployment = await LoanUser.aggregate([
      { $group: { _id: '$employmentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const byLoanType = await LoanUser.aggregate([
      { $group: { _id: '$preferredLoanType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const totalRequired = await LoanUser.aggregate([
      { $group: { _id: null, total: { $sum: '$requiredLoanAmount' } } }
    ]);
    res.json({
      total, active, inactive, byEmployment, byLoanType,
      totalRequiredAmount: totalRequired[0]?.total || 0
    });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
});

// ── CREATE ─────────────────────────────────────────────────────────────────────
// POST /api/loan/users/create
router.post('/create', protect, authorize('admin', 'employee'), async (req, res) => {
  try {
    const user = await LoanUser.create({
      ...req.body,
      createdBy: req.user._id || req.user.id // Fallback just in case of different auth middleware setups
    });
    res.status(201).json(user);
  } catch (error) { 
    res.status(400).json({ message: error.message || "Failed to create user" }); 
  }
});

// ── LIST ───────────────────────────────────────────────────────────────────────
// GET /api/loan/users
router.get('/', protect, authorize('admin', 'employee'), async (req, res) => {
  try {
    const { status, preferredLoanType, employmentType, search } = req.query;
    let query = {};

    // Employees only see their own users
    if (req.user.role === 'employee') query.createdBy = req.user._id || req.user.id;

    if (status && status !== 'all') query.status = status;
    if (preferredLoanType && preferredLoanType !== 'all') query.preferredLoanType = preferredLoanType;
    if (employmentType && employmentType !== 'all') query.employmentType = employmentType;

    if (search) {
      query.$or = [
        { fullName:     { $regex: search, $options: 'i' } },
        { phone:        { $regex: search, $options: 'i' } },
        { email:        { $regex: search, $options: 'i' } },
        { panNumber:    { $regex: search, $options: 'i' } },
        { aadharNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await LoanUser.find(query)
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json(users);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
});

// ── SINGLE ─────────────────────────────────────────────────────────────────────
// GET /api/loan/users/:id
router.get('/:id', protect, authorize('admin', 'employee'), async (req, res) => {
  try {
    const user = await LoanUser.findById(req.params.id).populate('createdBy', 'name email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
});

// ── UPDATE ─────────────────────────────────────────────────────────────────────
// PUT /api/loan/users/:id
router.put('/:id', protect, authorize('admin', 'employee'), async (req, res) => {
  try {
    const user = await LoanUser.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) { 
    res.status(400).json({ message: error.message }); 
  }
});

// ── STATUS UPDATE ──────────────────────────────────────────────────────────────
// PATCH /api/loan/users/:id/status
router.patch('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await LoanUser.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) { 
    res.status(400).json({ message: error.message }); 
  }
});

// ── DELETE ─────────────────────────────────────────────────────────────────────
// DELETE /api/loan/users/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await LoanUser.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
});

export default router;