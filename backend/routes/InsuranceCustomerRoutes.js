import express from 'express';
import InsuranceCustomer from '../models/InsuranceCustomerModel.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── STATS (MUST BE ABOVE /:id TO PREVENT ROUTE COLLISION) ─────────────────────
// GET /api/insurance/customers/stats/summary
router.get('/stats/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const [total, active, inactive, individual, corporate] = await Promise.all([
      InsuranceCustomer.countDocuments(),
      InsuranceCustomer.countDocuments({ status: 'Active' }),
      InsuranceCustomer.countDocuments({ status: 'Inactive' }),
      InsuranceCustomer.countDocuments({ customerType: 'Individual' }),
      InsuranceCustomer.countDocuments({ customerType: 'Corporate' }),
    ]);
    const byType = await InsuranceCustomer.aggregate([
      { $group: { _id: '$preferredInsuranceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ total, active, inactive, individual, corporate, byType });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
});

// ── CREATE ─────────────────────────────────────────────────────────────────────
// POST /api/insurance/customers/create
router.post('/create', protect, authorize('admin', 'agent'), async (req, res) => {
  try {
    const customer = await InsuranceCustomer.create({
      ...req.body,
      createdBy: req.user._id || req.user.id // Fallback for different auth setups
    });
    res.status(201).json(customer);
  } catch (error) { 
    res.status(400).json({ message: error.message || "Failed to create customer" }); 
  }
});

// ── LIST ───────────────────────────────────────────────────────────────────────
// GET /api/insurance/customers
router.get('/', protect, authorize('admin', 'agent'), async (req, res) => {
  try {
    const { status, preferredInsuranceType, customerType, search } = req.query;
    let query = {};

    // Agents only see their own customers
    if (req.user.role === 'agent') query.createdBy = req.user._id || req.user.id;

    if (status && status !== 'all') query.status = status;
    if (preferredInsuranceType && preferredInsuranceType !== 'all') query.preferredInsuranceType = preferredInsuranceType;
    if (customerType && customerType !== 'all') query.customerType = customerType;

    if (search) {
      query.$or = [
        { fullName:     { $regex: search, $options: 'i' } },
        { phone:        { $regex: search, $options: 'i' } },
        { email:        { $regex: search, $options: 'i' } },
        { aadharNumber: { $regex: search, $options: 'i' } },
        { panNumber:    { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await InsuranceCustomer.find(query)
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json(customers);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
});

// ── SINGLE ─────────────────────────────────────────────────────────────────────
// GET /api/insurance/customers/:id
router.get('/:id', protect, authorize('admin', 'agent'), async (req, res) => {
  try {
    const customer = await InsuranceCustomer.findById(req.params.id)
      .populate('createdBy', 'name email');
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
});

// ── UPDATE ─────────────────────────────────────────────────────────────────────
// PUT /api/insurance/customers/:id
router.put('/:id', protect, authorize('admin', 'agent'), async (req, res) => {
  try {
    const customer = await InsuranceCustomer.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (error) { 
    res.status(400).json({ message: error.message }); 
  }
});

// ── STATUS UPDATE ──────────────────────────────────────────────────────────────
// PATCH /api/insurance/customers/:id/status
router.patch('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const customer = await InsuranceCustomer.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (error) { 
    res.status(400).json({ message: error.message }); 
  }
});

// ── DELETE ─────────────────────────────────────────────────────────────────────
// DELETE /api/insurance/customers/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await InsuranceCustomer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted' });
  } catch (error) { 
    res.status(500).json({ message: error.message }); 
  }
});

export default router;