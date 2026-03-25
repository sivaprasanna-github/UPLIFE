import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Components
import Background from "./components/Background";
import Layout from "./components/Layout";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <>
      <Background />
      <Toaster position="top-right" reverseOrder={false} />

      <div className="relative z-10">
        <Routes>
          {/* Default route redirects to Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Public Routes (No Navbar/Sidebar) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes (Wrapped in Layout) */}
          <Route 
            path="/dashboard" 
            element={
              <Layout>
                <Dashboard />
              </Layout>
            } 
          />
        </Routes>
      </div>
    </>
  );
}

export default App;