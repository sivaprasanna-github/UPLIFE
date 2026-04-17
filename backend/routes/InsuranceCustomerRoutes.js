import express from 'express';
import XLSX from 'xlsx';
import InsuranceCustomer from '../models/InsuranceCustomerModel.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── Excel column definitions ───────────────────────────────────────────────────
const EXCEL_COLUMNS = [
  { key: 'fullName',               label: 'Full Name' },
  { key: 'dateOfBirth',            label: 'Date of Birth (YYYY-MM-DD)' },
  { key: 'gender',                 label: 'Gender (Male/Female/Other)' },
  { key: 'phone',                  label: 'Phone' },
  { key: 'email',                  label: 'Email' },
  { key: 'address',                label: 'Street Address' },
  { key: 'city',                   label: 'City' },
  { key: 'state',                  label: 'State' },
  { key: 'pincode',                label: 'Pincode' },
  { key: 'aadharNumber',           label: 'Aadhar Number' },
  { key: 'panNumber',              label: 'PAN Number' },
  { key: 'customerType',           label: 'Customer Type (Individual/Corporate)' },
  { key: 'preferredInsuranceType', label: 'Insurance Type (Life/Health/Auto/Property/Travel/None)' },
  { key: 'nomineeFullName',        label: 'Nominee Full Name' },
  { key: 'nomineeRelation',        label: 'Nominee Relation' },
  { key: 'nomineePhone',           label: 'Nominee Phone' },
  { key: 'occupation',             label: 'Occupation' },
  { key: 'annualIncome',           label: 'Annual Income (Rs)' },
  { key: 'existingConditions',     label: 'Existing Health Conditions' },
  { key: 'remarks',                label: 'Remarks' },
  { key: 'status',                 label: 'Status' },
];

// ── STATS ──────────────────────────────────────────────────────────────────────
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

// ── EXPORT EXCEL (.xlsx) ───────────────────────────────────────────────────────
// GET /api/insurance/customers/export/excel
// Admin gets all; agents get only their own customers.
// Optional query params: status, preferredInsuranceType, customerType, search
router.get('/export/excel', protect, authorize('admin', 'agent'), async (req, res) => {
  try {
    const { status, preferredInsuranceType, customerType, search } = req.query;
    let query = {};

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

    const customers = await InsuranceCustomer.find(query).sort('-createdAt').lean();

    // Build rows using human-readable label as key (so the header row is descriptive)
    const rows = customers.map(c => {
      const row = {};
      EXCEL_COLUMNS.forEach(({ key, label }) => {
        let val = c[key] ?? '';
        if (key === 'dateOfBirth' && val) {
          val = new Date(val).toISOString().slice(0, 10);
        }
        row[label] = String(val);
      });
      return row;
    });

    const headerOrder = EXCEL_COLUMNS.map(c => c.label);
    const ws = XLSX.utils.json_to_sheet(rows, { header: headerOrder });

    // Set column widths
    ws['!cols'] = EXCEL_COLUMNS.map(() => ({ wch: 30 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');

    // Write to buffer and send as download
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `customers_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── IMPORT EXCEL (bulk create) ─────────────────────────────────────────────────
// POST /api/insurance/customers/import/excel
// Expects JSON body: { rows: [ { fullName, phone, email, ... }, ... ] }
// The frontend parses the .xlsx with SheetJS and sends the rows as JSON.
// Returns: { success: number, failed: number, errors: [{ name, row, message }] }
router.post('/import/excel', protect, authorize('admin', 'agent'), async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'No rows provided.' });
    }

    const results   = { success: 0, failed: 0, errors: [] };
    const createdBy = req.user._id || req.user.id;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.fullName) throw new Error('"fullName" is required.');
        if (!row.phone)    throw new Error('"phone" is required.');
        if (!row.email)    throw new Error('"email" is required.');

        await InsuranceCustomer.create({
          ...row,
          annualIncome: parseFloat(row.annualIncome) || 0,
          createdBy
        });
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          row:     i + 2,            // Excel row number (1-indexed, +1 for header)
          name:    row.fullName || `Row ${i + 2}`,
          message: err.message
        });
      }
    }

    // 207 Multi-Status: request processed but some rows may have failed
    res.status(207).json(results);
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
      createdBy: req.user._id || req.user.id
    });
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to create customer' });
  }
});

// ── LIST ───────────────────────────────────────────────────────────────────────
// GET /api/insurance/customers
router.get('/', protect, authorize('admin', 'agent'), async (req, res) => {
  try {
    const { status, preferredInsuranceType, customerType, search } = req.query;
    let query = {};

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