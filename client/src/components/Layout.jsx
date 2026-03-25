import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <Sidebar />
      {/* 
        Main content area: 
        Margin top (pt-16) prevents overlapping with Navbar.
        Margin left (md:ml-64) prevents overlapping with Sidebar on desktop.
      */}
      <main className="pt-16 md:ml-64 p-8 transition-all duration-300">
        {children}
      </main>
    </div>
  );
};

export default Layout;