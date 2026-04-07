import express from 'express';
import multer from 'multer';                          // ✅ FIX: import multer here
import LoanUser from '../models/LoanUserModel.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import * as XLSX from 'xlsx';

const router = express.Router();

// ✅ FIX: Create multer instance with memory storage RIGHT HERE in this file
//         Previously multer was never applied to the /import route, so
//         req.file was always undefined → "No file uploaded" error.
const upload = multer({ storage: multer.memoryStorage() });

// ── STATS ──────────────────────────────────────────────────────────────────────
// GET /api/loan/users/stats/summary
router.get('/stats/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const [total, approved, pending, rejected] = await Promise.all([
      LoanUser.countDocuments(),
      LoanUser.countDocuments({ status: 'Approved' }),
      LoanUser.countDocuments({ status: 'Pending' }),
      LoanUser.countDocuments({ status: 'Rejected' }),
    ]);
    const byLoanType = await LoanUser.aggregate([
      { $group: { _id: '$loanType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const totalAmount = await LoanUser.aggregate([
      { $group: { _id: null, total: { $sum: '$loanAmount' } } }
    ]);
    res.json({
      total, approved, pending, rejected, byLoanType,
      totalLoanAmount: totalAmount[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── EXPORT TO EXCEL ────────────────────────────────────────────────────────────
// GET /api/loan/users/export
router.get('/export', protect, authorize('admin', 'employee'), async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'employee') query.createdBy = req.user._id || req.user.id;

    const users = await LoanUser.find(query).sort('-createdAt');

    const rows = users.map((u, i) => ({
      'S.no':           u.sno || i + 1,
      'Date':           u.date ? new Date(u.date).toLocaleDateString('en-IN') : '',
      'Customer Names': u.fullName,
      'Contact number': u.phone,
      'Lead':           u.leadName || '',
      'Loan Type':      u.loanType,
      'Loan amount':    u.loanAmount || '',
      'Status':         u.status,
      'Remarks':        u.remarks || ''
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    ws['!cols'] = [
      { wch: 6 }, { wch: 14 }, { wch: 24 }, { wch: 16 },
      { wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 24 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Loan');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="loan_users.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── IMPORT FROM EXCEL ──────────────────────────────────────────────────────────
// POST /api/loan/users/import
// ✅ FIX: Added `upload.single('file')` middleware BEFORE the async handler.
//         Without this, Express never parses multipart/form-data, req.file is
//         always undefined, and the route always returns "No file uploaded".
router.post(
  '/import',
  protect,
  authorize('admin', 'employee'),
  upload.single('file'),              // ← THIS was the missing piece
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded. Make sure the field name is "file".' });
      }

      const wb   = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      const createdById = req.user._id || req.user.id;

      const LOAN_TYPES_VALID = [
        'Personal Loan', 'Business Loan',
        'Home Loan - Construction Flat', 'Home Loan - Independent House',
        'Home Loan - Plot Purchase', 'Home Loan - Plot + Construction',
        'Mortgage Loan - Residential', 'Mortgage Loan - Commercial', 'Mortgage Loan - Open Plot',
        'Education Loan', 'Used Car Loan', 'New Car Loan', 'Car Refinance', 'None'
      ];
      const STATUS_VALID = ['Pending', 'Approved', 'Rejected', 'Active', 'Inactive'];

      const normalize = (val, validArr, def) => {
        if (!val) return def;
        const found = validArr.find(v => v.toLowerCase() === String(val).trim().toLowerCase());
        return found || def;
      };

      const parseDate = (val) => {
        if (!val) return new Date();
        if (val instanceof Date) return val;
        const d = new Date(val);
        return isNaN(d.getTime()) ? new Date() : d;
      };

      const docs = rows
        .filter(r => r['Customer Names'] || r['fullName'])
        .map(r => ({
          createdBy:  createdById,
          sno:        parseInt(r['S.no']) || undefined,
          date:       parseDate(r['Date']),
          fullName:   String(r['Customer Names'] || r['fullName'] || '').trim(),
          phone:      String(r['Contact number'] || r['phone'] || '').trim(),
          leadName:   String(r['Lead'] || r['leadName'] || '').trim(),
          loanType:   normalize(r['Loan Type'] || r['loanType'], LOAN_TYPES_VALID, 'None'),
          loanAmount: parseFloat(r['Loan amount'] || r['loanAmount']) || 0,
          status:     normalize(r['Status'] || r['status'], STATUS_VALID, 'Pending'),
          remarks:    String(r['Remarks'] || r['remarks'] || '').trim()
        }));

      if (docs.length === 0) {
        return res.status(400).json({ message: 'No valid rows found. Ensure the sheet has a "Customer Names" column.' });
      }

      const inserted = await LoanUser.insertMany(docs, { ordered: false });
      res.status(201).json({
        message: `Successfully imported ${inserted.length} records`,
        count:   inserted.length
      });
    } catch (error) {
      // insertMany with ordered:false throws but still inserts partial results
      if (error.name === 'BulkWriteError') {
        return res.status(207).json({
          message: `Partially imported. ${error.result?.nInserted || 0} records saved.`,
          count:   error.result?.nInserted || 0
        });
      }
      console.error('Import error:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

// ── CREATE ─────────────────────────────────────────────────────────────────────
// POST /api/loan/users/create
router.post('/create', protect, authorize('admin', 'employee'), async (req, res) => {
  try {
    const user = await LoanUser.create({
      ...req.body,
      createdBy: req.user._id || req.user.id
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to create user' });
  }
});

// ── LIST ───────────────────────────────────────────────────────────────────────
// GET /api/loan/users
router.get('/', protect, authorize('admin', 'employee'), async (req, res) => {
  try {
    const { status, loanType, search } = req.query;
    let query = {};

    if (req.user.role === 'employee') query.createdBy = req.user._id || req.user.id;

    if (status   && status   !== 'all') query.status   = status;
    if (loanType && loanType !== 'all') query.loanType = loanType;

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone:    { $regex: search, $options: 'i' } },
        { leadName: { $regex: search, $options: 'i' } },
        { remarks:  { $regex: search, $options: 'i' } }
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