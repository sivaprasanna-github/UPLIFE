import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, UserPlus, ArrowLeft, Shield, Users, 
  FileText, Bell, Briefcase, DollarSign, Umbrella, PieChart 
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Role/Module detection based on URL
  const isEmployee = location.pathname.startsWith("/employee");
  const isAgent = location.pathname.startsWith("/agent");
  const isAdminLoan = location.pathname.includes("/dashboard/loan");
  const isAdminInsurance = location.pathname.includes("/dashboard/insurance");

  // 1. Employee Links (4 components)
  const employeeLinks = [
    { path: "/employee/home", name: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { path: "/employee/clients", name: "My Clients", icon: <Users size={20} /> },
    { path: "/employee/applications", name: "Loan Apps", icon: <Briefcase size={20} /> },
    { path: "/employee/reports", name: "Reports", icon: <PieChart size={20} /> },
  ];

  // 2. Agent Links (4 components)
  const agentLinks = [
    { path: "/agent/home", name: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { path: "/agent/policies", name: "My Policies", icon: <Umbrella size={20} /> },
    { path: "/agent/claims", name: "Submit Claim", icon: <FileText size={20} /> },
    { path: "/agent/commissions", name: "Commissions", icon: <DollarSign size={20} /> },
  ];

  // 3. Admin Links
  const adminLoanLinks = [
    { path: "/dashboard/loan", name: "Loan Overview", icon: <LayoutDashboard size={20} /> },
    { path: "/dashboard/loan/create-employee", name: "Create Employee", icon: <UserPlus size={20} /> },
  ];

  const adminInsuranceLinks = [
    { path: "/dashboard/insurance", name: "Insurance Overview", icon: <LayoutDashboard size={20} /> },
    { path: "/dashboard/insurance/admin", name: "Admin Dashboard", icon: <Shield size={20} /> },
    { path: "/dashboard/insurance/create-agent", name: "Create Agent", icon: <UserPlus size={20} /> },
    { path: "/dashboard/insurance/customers", name: "Customers List", icon: <Users size={20} /> },
    { path: "/dashboard/insurance/claims", name: "Claims Management", icon: <FileText size={20} /> },
    { path: "/dashboard/insurance/notices", name: "Notices", icon: <Bell size={20} /> },
  ];

  // Determine Active Config
  let activeLinks = [];
  let sidebarTitle = "";
  let showBackButton = false;

  if (isEmployee) {
    activeLinks = employeeLinks;
    sidebarTitle = "Employee Portal";
  } else if (isAgent) {
    activeLinks = agentLinks;
    sidebarTitle = "Agent Portal";
  } else if (isAdminLoan) {
    activeLinks = adminLoanLinks;
    sidebarTitle = "Admin: Loan";
    showBackButton = true; // Admin can go back to module selection
  } else if (isAdminInsurance) {
    activeLinks = adminInsuranceLinks;
    sidebarTitle = "Admin: Insurance";
    showBackButton = true; // Admin can go back to module selection
  }

  // Fallback
  if (activeLinks.length === 0) return null;

  return (
    <aside className="w-64 bg-slate-900 text-white h-full flex flex-col shadow-xl transition-all duration-300 z-20 shrink-0">
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-2xl font-bold text-white">{sidebarTitle}</h2>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {activeLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
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

      {/* Only show "Back to Modules" to Admins */}
      {showBackButton && (
        <div className="p-4 border-t border-slate-700 bg-slate-900">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-full px-4 py-2 hover:bg-slate-800 rounded-lg"
          >
            <ArrowLeft size={20} />
            <span>Back to Modules</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;