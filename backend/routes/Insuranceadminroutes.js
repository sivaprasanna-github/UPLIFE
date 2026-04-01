import express from 'express';
import { Policy, Claim, Notice, Commission } from '../models/InsuranceModels.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── STATS ─────────────────────────────────────────────────────────────────────

// GET /api/insurance/stats
router.get('/stats', protect, authorize('admin'), async (req, res, next) => {
  try {
    const [totalAgents, totalPolicies, activePolicies, totalClaims,
           pendingClaims, approvedClaims, notices] = await Promise.all([
      User.countDocuments({ role: 'agent', department: 'insurance' }),
      Policy.countDocuments(),
      Policy.countDocuments({ status: 'Active' }),
      Claim.countDocuments(),
      Claim.countDocuments({ status: { $in: ['Filed', 'Under Review'] } }),
      Claim.countDocuments({ status: 'Approved' }),
      Notice.countDocuments()
    ]);
    const premiumResult = await Policy.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: null, total: { $sum: '$premiumAmount' } } }
    ]);
    const byType = await Policy.aggregate([
      { $group: { _id: '$insuranceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const recentPolicies = await Policy.find().sort('-createdAt').limit(5).populate('agent', 'name');
    res.json({
      totalAgents, totalPolicies, activePolicies, totalClaims,
      pendingClaims, approvedClaims, notices,
      totalPremium: premiumResult[0]?.total || 0,
      byType, recentPolicies
    });
  } catch (error) { next(error); }
});

// ── POLICIES ──────────────────────────────────────────────────────────────────

// GET /api/insurance/all-policies
router.get('/all-policies', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { status, insuranceType, search } = req.query;
    let query = {};
    if (status && status !== 'all') query.status = status;
    if (insuranceType && insuranceType !== 'all') query.insuranceType = insuranceType;
    if (search) {
      query.$or = [
        { clientName:   { $regex: search, $options: 'i' } },
        { policyNumber: { $regex: search, $options: 'i' } }
      ];
    }
    const policies = await Policy.find(query).populate('agent', 'name email').sort('-createdAt');
    res.json(policies);
  } catch (error) { next(error); }
});

// ── CLAIMS ────────────────────────────────────────────────────────────────────

// GET /api/insurance/all-claims
router.get('/all-claims', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { clientName:   { $regex: search, $options: 'i' } },
        { policyNumber: { $regex: search, $options: 'i' } }
      ];
    }
    const claims = await Claim.find(query).populate('agent', 'name email').sort('-createdAt');
    res.json(claims);
  } catch (error) { next(error); }
});

// PATCH /api/insurance/claim/:id/status
router.patch('/claim/:id/status', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { status, adminRemarks } = req.body;
    const claim = await Claim.findByIdAndUpdate(
      req.params.id, { status, adminRemarks }, { new: true }
    );
    if (!claim) return res.status(404).json({ message: 'Claim not found' });
    res.json(claim);
  } catch (error) { next(error); }
});

// ── NOTICES ───────────────────────────────────────────────────────────────────

// GET /api/insurance/notices
router.get('/notices', protect, async (req, res, next) => {
  try {
    const notices = await Notice.find({ targetModule: 'insurance' })
      .populate('createdBy', 'name').sort('-createdAt');
    res.json(notices);
  } catch (error) { next(error); }
});

// POST /api/insurance/notices
router.post('/notices', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { title, message, priority } = req.body;
    const notice = await Notice.create({
      title, message, priority, createdBy: req.user._id
    });
    res.status(201).json(notice);
  } catch (error) { next(error); }
});

// DELETE /api/insurance/notices/:id
router.delete('/notices/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notice deleted' });
  } catch (error) { next(error); }
});

// ── AGENTS LIST ───────────────────────────────────────────────────────────────

// GET /api/insurance/agents
router.get('/agents', protect, authorize('admin'), async (req, res, next) => {
  try {
    const agents = await User.find({ role: 'agent', department: 'insurance' })
      .select('-password').sort('-createdAt');
    // Attach policy count
    const agentsWithCounts = await Promise.all(agents.map(async (a) => {
      const policyCount = await Policy.countDocuments({ agent: a._id });
      const claimCount  = await Claim.countDocuments({ agent: a._id });
      return { ...a.toObject(), policyCount, claimCount };
    }));
    res.json(agentsWithCounts);
  } catch (error) { next(error); }
});

// ── COMMISSIONS ───────────────────────────────────────────────────────────────

// GET /api/insurance/all-commissions
router.get('/all-commissions', protect, authorize('admin'), async (req, res, next) => {
  try {
    const commissions = await Commission.find().populate('agent', 'name email').sort('-createdAt');
    res.json(commissions);
  } catch (error) { next(error); }
});

// PATCH /api/insurance/commission/:id/pay
router.patch('/commission/:id/pay', protect, authorize('admin'), async (req, res, next) => {
  try {
    const c = await Commission.findByIdAndUpdate(req.params.id, { status: 'Paid' }, { new: true });
    res.json(c);
  } catch (error) { next(error); }
});

export default router;