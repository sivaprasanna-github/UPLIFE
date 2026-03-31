import express from 'express';
import { Client } from '../models/LoanModels.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/employee/create-client
router.post('/create-client', protect, authorize('employee'), async (req, res, next) => {
  try {
    const { fullName, email, phone, loanAmount, loanType, leadName, remarks } = req.body;
    const client = await Client.create({
      employee: req.user._id,
      fullName, email, phone, loanAmount, loanType,
      leadName: leadName || '',
      remarks:  remarks  || ''
    });
    res.status(201).json(client);
  } catch (error) { next(error); }
});

// @route   GET /api/employee/my-clients
router.get('/my-clients', protect, authorize('employee'), async (req, res, next) => {
  try {
    const { status, loanType, search } = req.query;
    let query = { employee: req.user._id };
    if (status   && status   !== 'all') query.status   = status;
    if (loanType && loanType !== 'all') query.loanType = loanType;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone:    { $regex: search, $options: 'i' } },
        { email:    { $regex: search, $options: 'i' } }
      ];
    }
    const clients = await Client.find(query).sort('-createdAt');
    res.json(clients);
  } catch (error) { next(error); }
});

// @route   GET /api/employee/stats
router.get('/stats', protect, authorize('employee'), async (req, res, next) => {
  try {
    const empId = req.user._id;
    const [total, pending, approved, rejected] = await Promise.all([
      Client.countDocuments({ employee: empId }),
      Client.countDocuments({ employee: empId, status: 'pending' }),
      Client.countDocuments({ employee: empId, status: 'approved' }),
      Client.countDocuments({ employee: empId, status: 'rejected' })
    ]);
    const totalAmtResult = await Client.aggregate([
      { $match: { employee: empId, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$loanAmount' } } }
    ]);
    const approvedAmount = totalAmtResult[0]?.total || 0;
    res.json({ total, pending, approved, rejected, approvedAmount });
  } catch (error) { next(error); }
});

// @route   PATCH /api/employee/client/:id/status
router.patch('/client/:id/status', protect, authorize('employee'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, employee: req.user._id },
      { status },
      { new: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (error) { next(error); }
});

// @route   PUT /api/employee/client/:id
router.put('/client/:id', protect, authorize('employee'), async (req, res, next) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, employee: req.user._id },
      req.body,
      { new: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (error) { next(error); }
});

// @route   DELETE /api/employee/client/:id
router.delete('/client/:id', protect, authorize('employee'), async (req, res, next) => {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, employee: req.user._id });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) { next(error); }
});

export default router;