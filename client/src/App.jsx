import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layout
import Layout from "./components/Layout";

// Shared Pages
import LoginPage from "./pages/LoginPage";
import DashboardSelection from "./pages/DashboardSelection";

// ADMIN
import AdminDashboard from "./pages/insurance/AdminDashboard";

// LOAN
import LoanHome from "./pages/loan/LoanHome";
import CreateEmployee from "./pages/loan/CreateEmployee";
import AdminLoanClients from "./pages/loan/AdminLoanClients";
import AdminCreateLoanUser from "./pages/loan/AdminCreateLoanUser";

// INSURANCE
import InsuranceHome from "./pages/insurance/InsuranceHome";
import CreateAgent from "./pages/insurance/CreateAgent";
import AdminInsuranceCustomers from "./pages/insurance/AdminInsuranceCustomers";
import AdminCreateInsuranceCustomer from "./pages/insurance/AdminCreateInsuranceCustomer";
import Claims from "./pages/insurance/Claims";
import Notice from "./pages/insurance/Noticelist";

// EMPLOYEE
import EmployeeHome from "./pages/employee/EmployeeHome";
import EmployeeAddUser from "./pages/employee/EmployeeAddUser";
import ClientList from "./pages/employee/ClientList";
import LoanApplications from "./pages/employee/LoanApplications";
import EmployeeReports from "./pages/employee/EmployeeReports";

// AGENT
import AgentHome from "./pages/agent/AgentHome";
import AgentAddCustomer from "./pages/agent/AgentAddCustomer";
import MyPolicies from "./pages/agent/MyPolicies";
import SubmitClaim from "./pages/agent/SubmitClaim";
import Commissions from "./pages/agent/Commissions";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<DashboardSelection />} />

        {/* ✅ FIX: ADMIN ROUTE */}
        <Route path="/admin" element={<Navigate to="/dashboard/insurance/admin" replace />} />

        {/* Layout Routes */}
        <Route element={<Layout />}>

          {/* ADMIN LOAN */}
          <Route path="/dashboard/loan" element={<LoanHome />} />
          <Route path="/dashboard/loan/create-employee" element={<CreateEmployee />} />
          <Route path="/dashboard/loan/users" element={<AdminCreateLoanUser />} />
          <Route path="/dashboard/loan/clients" element={<AdminLoanClients />} />

          {/* ADMIN INSURANCE */}
          <Route path="/dashboard/insurance" element={<InsuranceHome />} />
          <Route path="/dashboard/insurance/create-agent" element={<CreateAgent />} />
          <Route path="/dashboard/insurance/admin" element={<AdminDashboard />} />
          <Route path="/dashboard/insurance/customers/manage" element={<AdminCreateInsuranceCustomer />} />
          <Route path="/dashboard/insurance/customers" element={<AdminInsuranceCustomers />} />
          <Route path="/dashboard/insurance/claims" element={<Claims />} />
          <Route path="/claims/:id" element={<Claims />} />
          <Route path="/dashboard/insurance/notices" element={<Notice />} />

          {/* EMPLOYEE */}
          <Route path="/employee/home" element={<EmployeeHome />} />
          <Route path="/employee/add-user" element={<EmployeeAddUser />} />
          <Route path="/employee/clients" element={<ClientList />} />
          <Route path="/employee/applications" element={<LoanApplications />} />
          <Route path="/employee/reports" element={<EmployeeReports />} />

          {/* AGENT */}
          <Route path="/agent/home" element={<AgentHome />} />
          <Route path="/agent/add-customer" element={<AgentAddCustomer />} />
          <Route path="/agent/policies" element={<MyPolicies />} />
          <Route path="/agent/claims" element={<SubmitClaim />} />
          <Route path="/agent/commissions" element={<Commissions />} />

        </Route>

        {/* ✅ Optional: Catch-all (no more errors) */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </div>
  );
}

export default App;