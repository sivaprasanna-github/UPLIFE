import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Existing Routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import agentRoutes from './routes/agentRoutes.js';

// New Routes
import insuranceAdminRoutes from './routes/insuranceadminroutes.js';
import insuranceCustomerRoutes from './routes/InsuranceCustomerRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import loanUserRoutes from './routes/LoanUserRoutes.js';
import insuranceNoticeRoutes from './routes/insuranceNoticeRoutes.js';

// ✅ NEW: Import the new loan application tracking routes
import loanRoutesUsers from './routes/loanRoutesusers.js';
import loanTrackingRoutes from './routes/loanTrackingRoutes.js';
 
// ── ADD THIS LINE in the Routes section (after loanUserRoutes) ────────────────

// Load Environment Variables & Connect to DB
dotenv.config();
connectDB();

const app = express();

// ── Middleware: CORS Configuration ──────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173', // Default port for React Vite
  'http://localhost:3000', // Default port for React Create-React-App
  process.env.FRONTEND_URL // Production Frontend URL from your .env file
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

// Body parser
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/agent', agentRoutes);

app.use('/api/insurance/admin', insuranceAdminRoutes);
app.use('/api/insurance/customers', insuranceCustomerRoutes);
app.use('/api/insurance/notices', insuranceNoticeRoutes);
app.use('/api/loan/tracking', loanTrackingRoutes);
// ✅ FIX 1 & 2: Routing Order is VERY Important here!
// 1. First check the specific /applications routes
app.use('/api/loan/users', loanRoutesUsers); 

// 2. Then check the general loan user routes (like /:id)
app.use('/api/loan/users', loanUserRoutes);

// 3. Finally, the base loan routes
app.use('/api/loan', loanRoutes);

// ── Error Middleware ────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// ── Server Start ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));