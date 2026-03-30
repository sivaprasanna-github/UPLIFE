import React from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, ShieldCheck } from "lucide-react";

const DashboardSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-gray-100 p-6">
      
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Admin Portal</h2>
        <p className="text-lg text-gray-600">Select a department to continue</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Loan Card */}
        <button
          onClick={() => navigate("/dashboard/loan")}
          className="bg-white p-10 rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center border-t-4 border-blue-500 group"
        >
          <div className="bg-blue-50 p-6 rounded-full mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors text-blue-500">
            <Landmark size={64} />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Loan Department</h3>
          <p className="text-gray-500 text-center">Manage loans, create employees, and track finances.</p>
        </button>

        {/* Insurance Card */}
        <button
          onClick={() => navigate("/dashboard/insurance")}
          className="bg-white p-10 rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center border-t-4 border-emerald-500 group"
        >
          <div className="bg-emerald-50 p-6 rounded-full mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-colors text-emerald-500">
            <ShieldCheck size={64} />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Insurance Department</h3>
          <p className="text-gray-500 text-center">Manage policies, register agents, and track claims.</p>
        </button>
      </div>
      
    </div>
  );
};

export default DashboardSelection;