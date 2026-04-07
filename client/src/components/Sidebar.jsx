import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, UserPlus, ArrowLeft, Shield, Users,
  FileText, Bell, Briefcase, DollarSign, Umbrella,
  PieChart, ClipboardList, UserCheck, Activity, BarChart3
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isEmployee       = location.pathname.startsWith("/employee");
  const isAgent          = location.pathname.startsWith("/agent");
  const isAdminLoan      = location.pathname.includes("/dashboard/loan");
  const isAdminInsurance = location.pathname.includes("/dashboard/insurance");

  // ── Employee Links ──────────────────────────────────────────────────────────
  const employeeLinks = [
    { path: "/employee/home",         name: "Dashboard",       icon: <LayoutDashboard size={20} /> },
    { path: "/employee/add-user",     name: "New Application", icon: <UserPlus size={20} /> },
    { path: "/employee/clients",      name: "My Clients",      icon: <Users size={20} /> },
    { path: "/employee/loan-status",  name: "Loan Status",     icon: <Activity size={20} /> }, 
    { path: "/employee/reports",      name: "Reports",         icon: <PieChart size={20} /> },
  ];

  // ── Agent Links ─────────────────────────────────────────────────────────────
  const agentLinks = [
    { path: "/agent/home",         name: "Dashboard",    icon: <LayoutDashboard size={20} /> },
    { path: "/agent/add-customer", name: "Add Customer", icon: <UserPlus size={20} /> },
    { path: "/agent/policies",     name: "My Policies",  icon: <Umbrella size={20} /> },
    { path: "/agent/claims",       name: "Submit Claim", icon: <FileText size={20} /> },
    { path: "/agent/commissions",  name: "Commissions",  icon: <DollarSign size={20} /> },
  ];

  // ── Admin Loan Links ────────────────────────────────────────────────────────
  const adminLoanLinks = [
    { path: "/dashboard/loan",                 name: "Loan Overview",    icon: <LayoutDashboard size={20} /> },
    { path: "/dashboard/loan/create-employee", name: "Create Employee",  icon: <UserPlus size={20} /> },
    { path: "/dashboard/loan/users",           name: "Loan Users",       icon: <UserCheck size={20} /> },
    { path: "/dashboard/loan/clients",         name: "All Applications", icon: <ClipboardList size={20} /> },
    { path: "/dashboard/loan/management",      name: "Manage Loans",     icon: <Briefcase size={20} /> },
  ];

  // ── Admin Insurance Links (UPGRADED) ────────────────────────────────────────
  const adminInsuranceLinks = [
    { path: "/dashboard/insurance/admin",            name: "Admin Dashboard",    icon: <Shield size={20} /> },
    { path: "/dashboard/insurance/create-agent",     name: "Create Agent",       icon: <UserPlus size={20} /> },
    { path: "/dashboard/insurance/customers/manage", name: "Ins. Customers",     icon: <UserCheck size={20} /> },
    { path: "/dashboard/insurance/customers",        name: "All Policies",       icon: <Umbrella size={20} /> },
    { path: "/dashboard/insurance/claims",           name: "Claims Management",  icon: <FileText size={20} /> },
    { path: "/dashboard/insurance/commissions",      name: "Agent Payouts",      icon: <DollarSign size={20} /> }, // NEW!
    { path: "/dashboard/insurance/reports",          name: "Analytics & Reports",icon: <BarChart3 size={20} /> },  // NEW!
    { path: "/dashboard/insurance/notices",          name: "System Notices",     icon: <Bell size={20} /> },
  ];

  let activeLinks    = [];
  let sidebarTitle   = "";
  let showBackButton = false;

  if (isEmployee) {
    activeLinks  = employeeLinks;
    sidebarTitle = "Employee Portal";
  } else if (isAgent) {
    activeLinks  = agentLinks;
    sidebarTitle = "Agent Portal";
  } else if (isAdminLoan) {
    activeLinks    = adminLoanLinks;
    sidebarTitle   = "Admin: Loan";
    showBackButton = true;
  } else if (isAdminInsurance) {
    activeLinks    = adminInsuranceLinks;
    sidebarTitle   = "Admin: Insurance";
    showBackButton = true;
  }

  if (activeLinks.length === 0) return null;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 h-full flex flex-col shadow-2xl z-20 shrink-0 relative">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          {sidebarTitle}
        </h2>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {activeLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end // ✅ THIS ONE WORD FIXES THE HIGHLIGHT BUG!
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50"
                  : "hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            {link.icon}
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>

      {showBackButton && (
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold shadow-inner"
          >
            <ArrowLeft size={16} />
            <span>Back to Modules</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;