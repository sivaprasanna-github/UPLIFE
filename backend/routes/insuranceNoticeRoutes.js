import express from 'express';
import InsuranceNotice from '../models/InsuranceNoticeModel.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── GET ALL NOTICES ────────────────────────────────────────────────────────────
// GET /api/insurance/notices
// Open to all logged-in users (Admins, Agents, Employees)
router.get('/', protect, async (req, res) => {
  try {
    const notices = await InsuranceNotice.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 }); // Sort newest first
      
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── CREATE NOTICE ──────────────────────────────────────────────────────────────
// POST /api/insurance/notices
// Restricted to Admins only
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, message, priority } = req.body;

    const notice = await InsuranceNotice.create({
      title,
      message,
      priority: priority || 'Medium',
      createdBy: req.user._id || req.user.id // Fallback for diff auth setups
    });

    // Populate createdBy before sending it back so the frontend immediately shows "By Admin Name"
    await notice.populate('createdBy', 'name email');

    res.status(201).json(notice);
  } catch (error) {
    res.status(400).json({ message: error.message || "Failed to create notice" });
  }
});

// ── DELETE NOTICE ──────────────────────────────────────────────────────────────
// DELETE /api/insurance/notices/:id
// Restricted to Admins only
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const notice = await InsuranceNotice.findByIdAndDelete(req.params.id);
    
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    
    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;