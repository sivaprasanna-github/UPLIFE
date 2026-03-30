import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamic header based on URL
  let headerTitle = "Portal Dashboard";
  let userName = "User";

  if (location.pathname.startsWith("/employee")) {
    headerTitle = "Loan Department (Employee View)";
    userName = "Employee";
  } else if (location.pathname.startsWith("/agent")) {
    headerTitle = "Insurance Department (Agent View)";
    userName = "Agent";
  } else if (location.pathname.startsWith("/dashboard")) {
    headerTitle = "Admin Control Center";
    userName = "Admin";
  }

  return (
    <div className="flex h-screen w-full bg-gray-100 text-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white shadow-sm flex items-center px-6 justify-between border-b border-gray-200 shrink-0">
          <h1 className="font-semibold text-xl text-gray-800">{headerTitle}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500">Welcome, {userName}</span>
            <button 
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;