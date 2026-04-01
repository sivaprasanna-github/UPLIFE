import React, { useEffect, useState } from "react";
import { Users, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const LOAN_TYPES = [
  "Personal Loan", "Business Loan",
  "Home Loan - Construction Flat", "Home Loan - Independent House",
  "Home Loan - Plot Purchase", "Home Loan - Plot + Construction",
  "Mortgage Loan - Residential", "Mortgage Loan - Commercial",
  "Mortgage Loan - Open Plot", "Education Loan",
  "Used Car Loan", "New Car Loan", "Car Refinance"
];

export default function EmployeeHome() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_URL}/employee/stats`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/employee/my-clients`, { headers }).then(r => r.json())
    ]).then(([s, clients]) => {
      setStats(s);
      setRecent(Array.isArray(clients) ? clients.slice(0, 5) : []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const cards = [
    { label: "Total Clients", value: stats?.total ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Pending", value: stats?.pending ?? 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Approved", value: stats?.approved ?? 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Rejected", value: stats?.rejected ?? 0, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
  ];

  const statusBadge = (s) => {
    if (s === "approved") return "bg-green-100 text-green-700";
    if (s === "rejected") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Welcome, {user.name || "Employee"} 👋</h2>
        <p className="text-gray-500 text-sm mt-1">Here's your loan portfolio overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className={`${c.bg} p-3 rounded-full`}>
                <Icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className="text-2xl font-bold text-gray-800">{c.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Approved Amount Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-5 text-white flex items-center justify-between">
        <div>
          <p className="text-blue-100 text-sm">Total Approved Loan Amount</p>
          <p className="text-3xl font-bold mt-1">
            ₹{(stats?.approvedAmount ?? 0).toLocaleString("en-IN")}
          </p>
        </div>
        <TrendingUp className="w-12 h-12 text-blue-200" />
      </div>

      {/* Recent Clients */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Recent Clients</h3>
        {recent.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No clients added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Loan Type</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr key={c._id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-700">{c.fullName}</td>
                    <td className="py-2 text-gray-500">{c.loanType}</td>
                    <td className="py-2 text-gray-700">₹{c.loanAmount.toLocaleString("en-IN")}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}