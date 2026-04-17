import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardSelection from "./pages/DashboardSelection";
import AdminDashboard from "./pages/insurance/AdminDashboard";
import LoanHome from "./pages/loan/LoanHome";
import CreateEmployee from "./pages/loan/CreateEmployee";
import AdminLoanClients from "./pages/loan/AdminLoanClients";
import AdminCreateLoanUser from "./pages/loan/AdminCreateLoanUser";
import AdminLoanManagement from "./pages/loan/AdminLoanManagement";
import LoanTracking from "./pages/loan/LoanTracking"; // ✅ NEW IMPORT

import InsuranceHome from "./pages/insurance/InsuranceHome";
import CreateAgent from "./pages/insurance/CreateAgent";
import AdminInsuranceCustomers from "./pages/insurance/AdminInsuranceCustomers";
import AdminCreateInsuranceCustomer from "./pages/insurance/AdminCreateInsuranceCustomer";
import Claims from "./pages/insurance/Claims";
import Notice from "./pages/insurance/Noticelist";
import InsuranceReports from "./pages/insurance/InsuranceReports";
import AdminCommissions from "./pages/insurance/AdminCommissions";

import EmployeeHome from "./pages/employee/EmployeeHome";
import EmployeeAddUser from "./pages/employee/EmployeeAddUser";
import ClientList from "./pages/employee/ClientList";
import LoanApplications from "./pages/employee/LoanApplications";
import EmployeeReports from "./pages/employee/EmployeeReports";
import EmployeeLoanStatus from "./pages/employee/EmployeeLoanStatus";

import AgentHome from "./pages/agent/AgentHome";
import AgentAddCustomer from "./pages/agent/AgentAddCustomer";
import MyPolicies from "./pages/agent/MyPolicies";
import SubmitClaim from "./pages/agent/SubmitClaim";
import Commissions from "./pages/agent/Commissions";

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardSelection />} />
        <Route path="/admin" element={<Navigate to="/dashboard/insurance/admin" replace />} />

        <Route element={<Layout />}>
          {/* ADMIN LOAN */}
          <Route path="/dashboard/loan" element={<LoanHome />} />
          <Route path="/dashboard/loan/create-employee" element={<CreateEmployee />} />
          <Route path="/dashboard/loan/users" element={<AdminCreateLoanUser />} />
          <Route path="/dashboard/loan/clients" element={<AdminLoanClients />} />
          <Route path="/dashboard/loan/management" element={<AdminLoanManagement />} />
          {/* ✅ NEW ROUTE */}
          <Route path="/dashboard/loan/tracking" element={<LoanTracking />} />

          {/* ADMIN INSURANCE */}
          <Route path="/dashboard/insurance" element={<InsuranceHome />} />
          <Route path="/dashboard/insurance/create-agent" element={<CreateAgent />} />
          <Route path="/dashboard/insurance/admin" element={<AdminDashboard />} />
          <Route path="/dashboard/insurance/customers/manage" element={<AdminCreateInsuranceCustomer />} />
          <Route path="/dashboard/insurance/customers" element={<AdminInsuranceCustomers />} />
          <Route path="/dashboard/insurance/claims" element={<Claims />} />
          <Route path="/claims/:id" element={<Claims />} />
          <Route path="/dashboard/insurance/notices" element={<Notice />} />
          <Route path="/dashboard/insurance/reports" element={<InsuranceReports />} />
          <Route path="/dashboard/insurance/commissions" element={<AdminCommissions />} />

          {/* EMPLOYEE */}
          <Route path="/employee/home" element={<EmployeeHome />} />
          <Route path="/employee/add-user" element={<EmployeeAddUser />} />
          <Route path="/employee/clients" element={<ClientList />} />
          <Route path="/employee/applications" element={<LoanApplications />} />
          <Route path="/employee/reports" element={<EmployeeReports />} />
          <Route path="/employee/loan-status" element={<EmployeeLoanStatus />} />

          {/* AGENT */}
          <Route path="/agent/home" element={<AgentHome />} />
          <Route path="/agent/add-customer" element={<AgentAddCustomer />} />
          <Route path="/agent/policies" element={<MyPolicies />} />
          <Route path="/agent/claims" element={<SubmitClaim />} />
          <Route path="/agent/commissions" element={<Commissions />} />
        </Route>

        <Route path="*" element={
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <h1 className="text-6xl font-black text-slate-300">404</h1>
            <p className="text-xl font-bold text-slate-600 mt-4">Page Not Found</p>
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;
