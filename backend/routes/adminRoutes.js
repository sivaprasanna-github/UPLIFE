import express from 'express';
import User from '../models/User.js';
import { Client } from '../models/LoanModels.js';
import { Policy, Claim } from '../models/InsuranceModels.js';
import AgentCounter from '../models/AgentCounter.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Build Agent ID
//
// Format : {STATECODE:2}{DISTRICTID:2}{MANDALID:2}{VILLAGEID:2}{SEQ:5}
// Example: AP + 01 + 02 + 03 + 00001  →  "AP010200300001"
//
// stateCode  — 2-letter official abbreviation e.g. "AP", "TS" (from frontend)
// districtId — zero-padded 2-digit index e.g. "01"
// mandalId   — zero-padded 2-digit index e.g. "02"
// villageId  — zero-padded 2-digit index e.g. "03"
// seq        — atomically incremented per-state counter, padded to 5 digits
// ─────────────────────────────────────────────────────────────────────────────
async function buildAgentId(stateCode, districtId, mandalId, villageId) {
  const seq       = await AgentCounter.nextSeq(stateCode.toUpperCase());
  const seqPadded = String(seq).padStart(5, '0');
  return `${stateCode.toUpperCase()}${districtId}${mandalId}${villageId}${seqPadded}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/create-employee
// ─────────────────────────────────────────────────────────────────────────────
router.post('/create-employee', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name,
      email,
      password,
      role:       'employee',
      department: 'loan',
    });

    res.status(201).json({
      _id:           user._id,
      name:          user.name,
      email:         user.email,
      role:          user.role,
      department:    user.department,
      plainPassword: password,
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/create-agent
//
// Expected body:
// {
//   firstName,   lastName,
//   email,       phone,
//   password,        ← NEW: Custom password from frontend
//   stateCode,       ← 2-letter abbreviation e.g. "AP" (derived on frontend from JSON)
//   stateName,       ← full name  e.g. "Andhra Pradesh"
//   districtId,      ← zero-padded 2-digit index "01"
//   districtName,
//   mandalId,        ← zero-padded 2-digit index "02"
//   mandalName,
//   villageId,       ← zero-padded 2-digit index "03"
//   villageName
// }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/create-agent', protect, authorize('admin'), async (req, res, next) => {
  try {
    const {
      firstName, lastName,
      email,     phone,
      password,     // ← Extracting custom password from frontend
      stateCode,    stateName,
      districtId,   districtName,
      mandalId,     mandalName,
      villageId,    villageName,
    } = req.body;

    // ── Required field validation ──────────────────────────────────────────
    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }
    if (!email?.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone must be a 10-digit number' });
    }
    // NEW: Password validation
    if (!password || password.trim() === '') {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (!stateCode || !districtId || !mandalId || !villageId) {
      return res.status(400).json({
        message: 'Complete location (state, district, mandal, village) is required',
      });
    }
    // stateCode must be the 2-letter abbreviation assigned by the frontend
    if (stateCode.trim().length !== 2) {
      return res.status(400).json({
        message: 'stateCode must be a 2-letter abbreviation (e.g. "AP", "TS")',
      });
    }

    // ── Duplicate email check ──────────────────────────────────────────────
    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    // ── Build Agent ID ─────────────────────────────────────────────────────
    const name      = `${firstName.trim()} ${lastName.trim()}`;
    const agentId   = await buildAgentId(stateCode, districtId, mandalId, villageId);

    // Collision guard (very unlikely but belt-and-suspenders)
    const idExists = await User.findOne({ agentId });
    if (idExists) {
      return res.status(409).json({ message: 'Agent ID collision — please try again' });
    }

    // ── Create user ────────────────────────────────────────────────────────
    const user = await User.create({
      name,
      email:    email.trim().toLowerCase(),
      phone,
      password: password,    // ← Passing the custom password (hashed by pre-save hook in User model)
      role:       'agent',
      department: 'insurance',
      agentId,
      location: {
        stateCode,
        stateName,
        districtId,
        districtName,
        mandalId,
        mandalName,
        villageId,
        villageName,
      },
    });

    res.status(201).json({
      _id:          user._id,
      name:         user.name,
      email:        user.email,
      phone:        user.phone,
      role:         user.role,
      department:   user.department,
      agentId:      user.agentId,
      location:     user.location,
      plainPassword: password,  // ← returning the custom password so the frontend UI can still display/copy it
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/employees
// ─────────────────────────────────────────────────────────────────────────────
router.get('/employees', protect, authorize('admin'), async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'employee', department: 'loan' })
      .select('-password')
      .sort('-createdAt');
    res.json(employees);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/agents
// Returns agents enriched with policyCount and claimCount
// ─────────────────────────────────────────────────────────────────────────────
router.get('/agents', protect, authorize('admin'), async (req, res, next) => {
  try {
    const agents = await User.find({ role: 'agent', department: 'insurance' })
      .select('-password')
      .sort('-createdAt');

    const enriched = await Promise.all(
      agents.map(async (a) => {
        const [policyCount, claimCount] = await Promise.all([
          Policy.countDocuments({ agent: a._id }),
          Claim.countDocuments({ agent: a._id }),
        ]);
        return { ...a.toObject(), policyCount, claimCount };
      })
    );

    res.json(enriched);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/loan/clients
// ─────────────────────────────────────────────────────────────────────────────
router.get('/loan/clients', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { status, loanType, search } = req.query;
    const query = {};

    if (status   && status   !== 'all') query.status   = status;
    if (loanType && loanType !== 'all') query.loanType = loanType;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone:    { $regex: search, $options: 'i' } },
        { email:    { $regex: search, $options: 'i' } },
      ];
    }

    const clients = await Client.find(query)
      .populate('employee', 'name email')
      .sort('-createdAt');
    res.json(clients);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/loan/client/:id/status
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/loan/client/:id/status', protect, authorize('admin'), async (req, res, next) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/insurance/policies
// ─────────────────────────────────────────────────────────────────────────────
router.get('/insurance/policies', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { status, insuranceType, search } = req.query;
    const query = {};

    if (status        && status        !== 'all') query.status        = status;
    if (insuranceType && insuranceType !== 'all') query.insuranceType = insuranceType;
    if (search) {
      query.$or = [
        { clientName:   { $regex: search, $options: 'i' } },
        { policyNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const policies = await Policy.find(query)
      .populate('agent', 'name email agentId')
      .sort('-createdAt');
    res.json(policies);
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/loan/stats
// ─────────────────────────────────────────────────────────────────────────────
router.get('/loan/stats', protect, authorize('admin'), async (req, res, next) => {
  try {
    const [total, pending, approved, rejected] = await Promise.all([
      Client.countDocuments(),
      Client.countDocuments({ status: 'pending' }),
      Client.countDocuments({ status: 'approved' }),
      Client.countDocuments({ status: 'rejected' }),
    ]);

    const result = await Client.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$loanAmount' } } },
    ]);
    const approvedAmount = result[0]?.total ?? 0;

    res.json({ total, pending, approved, rejected, approvedAmount });
  } catch (error) {
    next(error);
  }
});

export default router;