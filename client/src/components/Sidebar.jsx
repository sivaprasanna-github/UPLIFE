import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, UserPlus, ArrowLeft, Shield, Users,
  FileText, Bell, Briefcase, DollarSign, Umbrella,
  PieChart, ClipboardList, UserCheck
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
    // { path: "/employee/applications", name: "Loan Apps",       icon: <Briefcase size={20} /> },
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
  ];

  // ── Admin Insurance Links ───────────────────────────────────────────────────
  const adminInsuranceLinks = [
    // { path: "/dashboard/insurance",                  name: "Insurance Overview", icon: <LayoutDashboard size={20} /> },
    { path: "/dashboard/insurance/admin",            name: "Admin Dashboard",    icon: <Shield size={20} /> },
    { path: "/dashboard/insurance/create-agent",     name: "Create Agent",       icon: <UserPlus size={20} /> },
    { path: "/dashboard/insurance/customers/manage", name: "Ins. Customers",     icon: <UserCheck size={20} /> },
    { path: "/dashboard/insurance/customers",        name: "All Policies",       icon: <Users size={20} /> },
    { path: "/dashboard/insurance/claims",           name: "Claims Management",  icon: <FileText size={20} /> },
    { path: "/dashboard/insurance/notices",          name: "Notices",            icon: <Bell size={20} /> },
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
    <aside className="w-64 bg-slate-900 text-white h-full flex flex-col shadow-xl z-20 shrink-0">
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-xl font-bold text-white">{sidebarTitle}</h2>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {activeLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path.split("/").length <= 3}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            {link.icon}
            <span className="font-medium">{link.name}</span>
          </NavLink>
        ))}
      </nav>

      {showBackButton && (
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-full px-4 py-2 hover:bg-slate-800 rounded-lg text-sm"
          >
            <ArrowLeft size={18} />
            <span>Back to Modules</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;