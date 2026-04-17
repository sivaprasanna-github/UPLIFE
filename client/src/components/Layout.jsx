import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import Sidebar from "./Sidebar";

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  let headerTitle = "System Dashboard";
  let userName = "User";

  if (location.pathname.startsWith("/employee")) {
    headerTitle = "Loan Department (Employee View)";
    userName = "Employee";
  } else if (location.pathname.startsWith("/agent")) {
    headerTitle = "Insurance Department (Agent View)";
    userName = "Agent";
  } else if (location.pathname.startsWith("/dashboard")) {
    headerTitle = "UPLIFE Control Center";
    userName = "Admin";
  }

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-900 font-sans overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-[72px] bg-white/80 backdrop-blur-md flex items-center px-8 justify-between border-b border-slate-200 shrink-0 z-10">
          <h1 className="font-extrabold text-xl text-slate-800 tracking-tight">{headerTitle}</h1>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Logged in as</span>
              <span className="text-sm font-extrabold text-indigo-600">{userName}</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 hover:shadow-sm transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto bg-slate-100/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;