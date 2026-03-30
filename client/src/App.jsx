import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layout
import Layout from "./components/Layout";

// Shared Pages
import LoginPage from "./pages/LoginPage";
import DashboardSelection from "./pages/DashboardSelection";

// --- ADMIN PAGES ---
// Admin Loan (Corrected paths)
import LoanHome from "./pages/loan/LoanHome";
import CreateEmployee from "./pages/loan/CreateEmployee";

// Admin Insurance (Corrected paths & filenames)
import InsuranceHome from "./pages/insurance/InsuranceHome";
import CreateAgent from "./pages/insurance/CreateAgent";
import AdminDashboard from "./pages/insurance/AdminDashboard";
import CustomersList from "./pages/insurance/Agentcustomerslist"; // Fixed name
import Claims from "./pages/insurance/Claims";
import Notice from "./pages/insurance/Noticelist"; // Fixed name

// --- EMPLOYEE PAGES (LOAN) ---
import EmployeeHome from "./pages/employee/EmployeeHome";
import ClientList from "./pages/employee/ClientList";
import LoanApplications from "./pages/employee/LoanApplications";
import EmployeeReports from "./pages/employee/EmployeeReports";

// --- AGENT PAGES (INSURANCE) ---
import AgentHome from "./pages/agent/AgentHome";
import MyPolicies from "./pages/agent/MyPolicies";
import SubmitClaim from "./pages/agent/SubmitClaim";
import Commissions from "./pages/agent/Commissions";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* ADMIN: Selection Screen (No Sidebar) */}
        <Route path="/dashboard" element={<DashboardSelection />} />

        {/* PROTECTED ROUTES (Wrapped in Layout WITH dynamic Sidebar) */}
        <Route element={<Layout />}>

          {/* === ADMIN LOAN === */}
          <Route path="/dashboard/loan" element={<LoanHome />} />
          <Route path="/dashboard/loan/create-employee" element={<CreateEmployee />} />

          {/* === ADMIN INSURANCE === */}
          <Route path="/dashboard/insurance" element={<InsuranceHome />} />
          <Route path="/dashboard/insurance/create-agent" element={<CreateAgent />} />
          <Route path="/dashboard/insurance/admin" element={<AdminDashboard />} />
          
          {/* Admin Insurance Customers */}
          <Route path="/dashboard/insurance/customers" element={<CustomersList />} />
          <Route path="/customers/view/:custId" element={<CustomersList />} />
          <Route path="/customers/edit/:custId" element={<CustomersList />} />

          {/* Admin Insurance Claims & Notices */}
          <Route path="/dashboard/insurance/claims" element={<Claims />} />
          <Route path="/claims/:id" element={<Claims />} />
          <Route path="/dashboard/insurance/notices" element={<Notice />} />

          {/* === EMPLOYEE (LOAN DEPT) === */}
          <Route path="/employee/home" element={<EmployeeHome />} />
          <Route path="/employee/clients" element={<ClientList />} />
          <Route path="/employee/applications" element={<LoanApplications />} />
          <Route path="/employee/reports" element={<EmployeeReports />} />

          {/* === AGENT (INSURANCE DEPT) === */}
          <Route path="/agent/home" element={<AgentHome />} />
          <Route path="/agent/policies" element={<MyPolicies />} />
          <Route path="/agent/claims" element={<SubmitClaim />} />
          <Route path="/agent/commissions" element={<Commissions />} />

        </Route>
      </Routes>
    </div>
  );
}

export default App;