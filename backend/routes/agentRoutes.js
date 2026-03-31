import express from 'express';
import { Policy, Claim, Commission } from '../models/InsuranceModels.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Commission rates by type
const COMMISSION_RATES = { Life: 15, Health: 10, Auto: 8, Property: 7, Travel: 5 };

// ── POLICIES ──────────────────────────────────────────────────────────────────

// POST /api/agent/create-policy
router.post('/create-policy', protect, authorize('agent'), async (req, res, next) => {
  try {
    const { policyNumber, clientName, clientPhone, clientEmail, insuranceType,
            premiumAmount, sumAssured, expiryDate, remarks } = req.body;

    const exists = await Policy.findOne({ policyNumber: policyNumber.toUpperCase() });
    if (exists) return res.status(400).json({ message: 'Policy number already exists' });

    const policy = await Policy.create({
      policyNumber, agent: req.user._id, clientName, clientPhone, clientEmail,
      insuranceType, premiumAmount, sumAssured, expiryDate, remarks
    });

    // Auto-create commission record
    const rate = COMMISSION_RATES[insuranceType] || 10;
    await Commission.create({
      agent: req.user._id, policy: policy._id,
      policyNumber: policy.policyNumber, clientName, insuranceType,
      premiumAmount, commissionRate: rate,
      commissionAmount: (premiumAmount * rate) / 100
    });

    res.status(201).json(policy);
  } catch (error) { next(error); }
});

// GET /api/agent/my-policies
router.get('/my-policies', protect, authorize('agent'), async (req, res, next) => {
  try {
    const { status, insuranceType, search } = req.query;
    let query = { agent: req.user._id };
    if (status && status !== 'all') query.status = status;
    if (insuranceType && insuranceType !== 'all') query.insuranceType = insuranceType;
    if (search) {
      query.$or = [
        { clientName:    { $regex: search, $options: 'i' } },
        { policyNumber:  { $regex: search, $options: 'i' } },
        { clientPhone:   { $regex: search, $options: 'i' } }
      ];
    }
    const policies = await Policy.find(query).sort('-createdAt');
    res.json(policies);
  } catch (error) { next(error); }
});

// GET /api/agent/stats
router.get('/stats', protect, authorize('agent'), async (req, res, next) => {
  try {
    const agentId = req.user._id;
    const [totalPolicies, activePolicies, totalClaims, pendingClaims, commissions] = await Promise.all([
      Policy.countDocuments({ agent: agentId }),
      Policy.countDocuments({ agent: agentId, status: 'Active' }),
      Claim.countDocuments({ agent: agentId }),
      Claim.countDocuments({ agent: agentId, status: { $in: ['Filed', 'Under Review'] } }),
      Commission.find({ agent: agentId })
    ]);
    const totalCommission = commissions.reduce((s, c) => s + c.commissionAmount, 0);
    const paidCommission  = commissions.filter(c => c.status === 'Paid').reduce((s, c) => s + c.commissionAmount, 0);
    res.json({ totalPolicies, activePolicies, totalClaims, pendingClaims, totalCommission, paidCommission });
  } catch (error) { next(error); }
});

// PATCH /api/agent/policy/:id/status
router.patch('/policy/:id/status', protect, authorize('agent'), async (req, res, next) => {
  try {
    const policy = await Policy.findOneAndUpdate(
      { _id: req.params.id, agent: req.user._id },
      { status: req.body.status }, { new: true }
    );
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    res.json(policy);
  } catch (error) { next(error); }
});

// DELETE /api/agent/policy/:id
router.delete('/policy/:id', protect, authorize('agent'), async (req, res, next) => {
  try {
    await Policy.findOneAndDelete({ _id: req.params.id, agent: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (error) { next(error); }
});

// ── CLAIMS ────────────────────────────────────────────────────────────────────

// POST /api/agent/create-claim
router.post('/create-claim', protect, authorize('agent'), async (req, res, next) => {
  try {
    const { policyNumber, clientName, claimAmount, description } = req.body;
    const claim = await Claim.create({
      agent: req.user._id, policyNumber, clientName, claimAmount, description
    });
    res.status(201).json(claim);
  } catch (error) { next(error); }
});

// GET /api/agent/my-claims
router.get('/my-claims', protect, authorize('agent'), async (req, res, next) => {
  try {
    const claims = await Claim.find({ agent: req.user._id }).sort('-createdAt');
    res.json(claims);
  } catch (error) { next(error); }
});

// ── COMMISSIONS ───────────────────────────────────────────────────────────────

// GET /api/agent/my-commissions
router.get('/my-commissions', protect, authorize('agent'), async (req, res, next) => {
  try {
    const commissions = await Commission.find({ agent: req.user._id }).sort('-createdAt');
    res.json(commissions);
  } catch (error) { next(error); }
});

export default router;