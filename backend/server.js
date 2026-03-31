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
// Load Environment Variables & Connect to DB
dotenv.config();
connectDB();

const app = express();

<<<<<<< HEAD
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
=======
// ✅ CORS Configuration (Netlify + Localhost)
app.use(
  cors({
    origin: [
      'https://uplife-26.netlify.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

>>>>>>> 1df245ac382142b174eca6f58dc67a556f625106
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/agent', agentRoutes);

app.use('/api/insurance/admin', insuranceAdminRoutes);

// ✅ FIX 1: Changed "customer" to "customers" (PLURAL)
app.use('/api/insurance/customers', insuranceCustomerRoutes);

// ✅ FIX 2: Plural "users" placed specifically ABOVE the general "/api/loan" route
app.use('/api/loan/users', loanUserRoutes);
app.use('/api/loan', loanRoutes);
app.use('/api/insurance/notices', insuranceNoticeRoutes);
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
