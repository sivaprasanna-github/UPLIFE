import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !storedUser) {
      navigate("/login");
    } else {
      setUserData(JSON.parse(storedUser));
    }
  }, [navigate]);

  if (!userData) return null; 

  return (
    <div className="w-full max-w-4xl p-8 bg-white rounded-xl shadow-lg dark:bg-gray-800 text-gray-800 dark:text-white">
      <h2 className="text-3xl font-bold mb-6 border-b border-gray-200 pb-4 dark:border-gray-700">
        Dashboard Overview
      </h2>
      
      <div className="space-y-6">
        <p className="text-xl">
          Welcome back, <span className="font-bold text-blue-600 dark:text-blue-400">{userData.owner}</span>!
        </p>
        
        <div className="p-6 bg-gray-50 rounded-lg dark:bg-gray-700 shadow-inner">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2 dark:border-gray-600">
            Business Profile
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Company / Shop Name</p>
              <p className="font-medium text-lg">{userData.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
              <p className="font-medium text-lg">{userData.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
              <p className="font-medium text-lg">{userData.ph}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
              <p className="font-medium text-lg">{userData.address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;