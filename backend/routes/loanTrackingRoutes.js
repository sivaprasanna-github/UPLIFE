import express from 'express';
import LoanTracking from '../models/loanTrackingModel.js';
import LoanUser from '../models/LoanUserModel.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
function generateEmiSchedule(disbursementDate, tenureMonths, emiAmount) {
  const schedule = [];
  const start = new Date(disbursementDate);
  for (let i = 1; i <= tenureMonths; i++) {
    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + i);
    schedule.push({ emiNumber: i, dueDate, amount: emiAmount, status: 'Pending' });
  }
  return schedule;
}

function markOverdueEmis(schedule) {
  const today = new Date();
  return schedule.map(emi => {
    if (emi.status === 'Pending' && new Date(emi.dueDate) < today) {
      emi.status = 'Overdue';
    }
    return emi;
  });
}

// ─────────────────────────────────────────────────────────────────
// 1. STATS SUMMARY (MUST BE ABOVE /:id TO PREVENT ROUTE SHADOWING)
// GET /api/loan/tracking/stats/summary
// ─────────────────────────────────────────────────────────────────
router.get('/stats/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const [total, active, closed, npa] = await Promise.all([
      LoanTracking.countDocuments(),
      LoanTracking.countDocuments({ trackingStatus: 'Active' }),
      LoanTracking.countDocuments({ trackingStatus: 'Closed' }),
      LoanTracking.countDocuments({ trackingStatus: 'NPA' }),
    ]);

    const amountAgg = await LoanTracking.aggregate([
      {
        $group: {
          _id: null,
          totalDisbursed: { $sum: '$totalAmount' },
          totalPaid:      { $sum: '$paidAmount' },
          totalDue:       { $sum: '$dueAmount' }
        }
      }
    ]);

    const amounts = amountAgg[0] || { totalDisbursed: 0, totalPaid: 0, totalDue: 0 };
    res.json({ success: true, data: { total, active, closed, npa, ...amounts } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 2. CREATE LOAN TRACKING ENTRY
// POST /api/loan/tracking
// ─────────────────────────────────────────────────────────────────
router.post('/', protect, authorize('admin', 'employee'), async (req, res) => {
  try {
    const { loanUser, loanType, totalAmount, interestRate, tenureMonths, emiAmount, disbursementDate, remarks } = req.body;

    const user = await LoanUser.findById(loanUser);
    if (!user) return res.status(404).json({ message: 'Loan user not found' });

    const emiSchedule = generateEmiSchedule(disbursementDate || new Date(), tenureMonths, emiAmount);
    const nextDueDate = emiSchedule.length > 0 ? emiSchedule[0].dueDate : null;

    const tracking = await LoanTracking.create({
      loanUser,
      createdBy: req.user._id || req.user.id,
      loanType, totalAmount, interestRate: interestRate || 0,
      tenureMonths, emiAmount, paidAmount: 0, dueAmount: totalAmount,
      disbursementDate: disbursementDate || new Date(),
      nextDueDate, emiSchedule, remarks: remarks || ''
    });

    const populated = await LoanTracking.findById(tracking._id).populate('loanUser', 'fullName phone loanType');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 3. GET ALL LOAN TRACKINGS
// GET /api/loan/tracking
// ─────────────────────────────────────────────────────────────────
router.get('/', protect, authorize('admin', 'employee'), async (req, res) => {
  try {
    const { status, loanType, search } = req.query;
    let query = {};

    if (req.user.role === 'employee') query.createdBy = req.user._id || req.user.id;
    if (status && status !== 'all') query.trackingStatus = status;
    if (loanType && loanType !== 'all') query.loanType = loanType;

    let trackings = await LoanTracking.find(query)
      .populate('loanUser', 'fullName phone loanType sno')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    trackings = trackings.map(t => {
      t.emiSchedule = markOverdueEmis(t.emiSchedule);
      return t;
    });

    if (search) {
      const s = search.toLowerCase();
      trackings = trackings.filter(t =>
        t.loanUser?.fullName?.toLowerCase().includes(s) ||
        t.loanUser?.phone?.toLowerCase().includes(s) ||
        t.loanType?.toLowerCase().includes(s)
      );
    }

    res.json({ success: true, data: trackings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 4. GET SINGLE LOAN TRACKING (Must be BELOW /stats/summary)
// GET /api/loan/tracking/:id
// ─────────────────────────────────────────────────────────────────
router.get('/:id', protect, authorize('admin', 'employee'), async (req, res) => {
  try {
    const tracking = await LoanTracking.findById(req.params.id)
      .populate('loanUser', 'fullName phone loanType sno status')
      .populate('createdBy', 'name email');

    if (!tracking) return res.status(404).json({ message: 'Tracking record not found' });

    tracking.emiSchedule = markOverdueEmis(tracking.emiSchedule);
    res.json({ success: true, data: tracking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 5. UPDATE LOAN TRACKING
// PUT /api/loan/tracking/:id
// ─────────────────────────────────────────────────────────────────
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const tracking = await LoanTracking.findById(req.params.id);
    if (!tracking) return res.status(404).json({ message: 'Tracking record not found' });

    Object.assign(tracking, req.body);
    await tracking.save();

    const updated = await LoanTracking.findById(tracking._id).populate('loanUser', 'fullName phone loanType');
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 6. MARK EMI AS PAID
// PATCH /api/loan/tracking/:id/emi/:emiId/pay
// ─────────────────────────────────────────────────────────────────
router.patch('/:id/emi/:emiId/pay', protect, authorize('admin', 'employee'), async (req, res) => {
  try {
    const tracking = await LoanTracking.findById(req.params.id);
    if (!tracking) return res.status(404).json({ message: 'Tracking record not found' });

    const emi = tracking.emiSchedule.id(req.params.emiId);
    if (!emi) return res.status(404).json({ message: 'EMI not found' });
    if (emi.status === 'Paid') return res.status(400).json({ message: 'EMI already marked as paid' });

    emi.status = 'Paid';
    emi.paidDate = req.body.paidDate || new Date();
    emi.remarks = req.body.remarks || '';

    tracking.paidAmount = tracking.emiSchedule.filter(e => e.status === 'Paid').reduce((sum, e) => sum + e.amount, 0);
    
    const nextPending = tracking.emiSchedule.find(e => e.status === 'Pending' || e.status === 'Overdue');
    tracking.nextDueDate = nextPending ? nextPending.dueDate : null;

    if (tracking.emiSchedule.every(e => e.status === 'Paid')) {
      tracking.trackingStatus = 'Closed';
    }

    await tracking.save();
    res.json({ success: true, data: tracking });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 7. DELETE LOAN TRACKING
// DELETE /api/loan/tracking/:id
// ─────────────────────────────────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await LoanTracking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Tracking record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;