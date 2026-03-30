import express from 'express';
import { Claim } from '../models/InsuranceModels.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Submit a new Insurance Claim
// @route   POST /api/agent/create-claim
// @access  Private (Agent only)
router.post('/create-claim', protect, authorize('agent'), async (req, res, next) => {
  try {
    const { policyNumber, clientName, claimAmount, description } = req.body;

    const claim = new Claim({
      agent: req.user._id, // Tied to the logged-in agent
      policyNumber,
      clientName,
      claimAmount,
      description
    });

    const createdClaim = await claim.save();
    res.status(201).json(createdClaim);
  } catch (error) {
    next(error);
  }
});

// @desc    Get all claims filed by the logged-in Agent
// @route   GET /api/agent/my-claims
// @access  Private (Agent only)
router.get('/my-claims', protect, authorize('agent'), async (req, res, next) => {
  try {
    const claims = await Claim.find({ agent: req.user._id }).sort('-createdAt');
    res.json(claims);
  } catch (error) {
    next(error);
  }
});

export default router;