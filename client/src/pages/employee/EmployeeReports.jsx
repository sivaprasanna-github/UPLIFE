import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

const STATUS_COLORS = { approved: "#16a34a", pending: "#d97706", rejected: "#dc2626" };
const COLORS = ["#3b82f6","#8b5cf6","#06b6d4","#f59e0b","#10b981","#ef4444","#ec4899","#f97316","#84cc16","#6366f1","#14b8a6","#a855f7","#64748b"];

export default function EmployeeReports() {
  const [stats, setStats]   = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/employee/stats`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/employee/my-clients`, { headers }).then(r => r.json())
    ]).then(([s, c]) => {
      setStats(s);
      setClients(Array.isArray(c) ? c : []);
    }).catch(() => toast.error("Failed to load reports"))
    .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statusData = [
    { name: "Approved", value: stats?.approved || 0 },
    { name: "Pending",  value: stats?.pending  || 0 },
    { name: "Rejected", value: stats?.rejected || 0 },
  ].filter(d => d.value > 0);

  // Group by loan type
  const typeMap = {};
  clients.forEach(c => {
    const short = c.loanType.replace("Loan", "").replace("Home -", "").trim();
    typeMap[c.loanType] = { name: short, count: (typeMap[c.loanType]?.count || 0) + 1,
      amount: (typeMap[c.loanType]?.amount || 0) + c.loanAmount };
  });
  const typeData = Object.values(typeMap).sort((a, b) => b.count - a.count);

  // Monthly trend
  const monthMap = {};
  clients.forEach(c => {
    const key = new Date(c.createdAt).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    monthMap[key] = (monthMap[key] || 0) + 1;
  });
  const monthData = Object.entries(monthMap).map(([month, count]) => ({ month, count })).slice(-6);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Performance Reports</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Clients", value: stats?.total || 0, color: "text-blue-600" },
          { label: "Approved", value: stats?.approved || 0, color: "text-green-600" },
          { label: "Pending", value: stats?.pending || 0, color: "text-amber-600" },
          { label: "Approved Amount", value: `₹${((stats?.approvedAmount || 0) / 100000).toFixed(1)}L`, color: "text-purple-600" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Pie */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Application Status</h3>
          {statusData.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {statusData.map((e, i) => (
                    <Cell key={i} fill={STATUS_COLORS[e.name.toLowerCase()] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, "Applications"]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Bar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Monthly Applications</h3>
          {monthData.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Applications" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Loan Type Breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Applications by Loan Type</h3>
        {typeData.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-gray-400">
                  <th className="pb-2 font-medium">Loan Type</th>
                  <th className="pb-2 font-medium">Applications</th>
                  <th className="pb-2 font-medium">Total Amount</th>
                  <th className="pb-2 font-medium">Share</th>
                </tr>
              </thead>
              <tbody>
                {typeData.map((t, i) => (
                  <tr key={t.name} className="border-b last:border-0">
                    <td className="py-2.5 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      {t.name}
                    </td>
                    <td className="py-2.5 text-gray-700 font-medium">{t.count}</td>
                    <td className="py-2.5 text-gray-700">₹{t.amount.toLocaleString("en-IN")}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{
                            width: `${((t.count / clients.length) * 100).toFixed(0)}%`,
                            background: COLORS[i % COLORS.length]
                          }} />
                        </div>
                        <span className="text-gray-500 text-xs w-8">{((t.count / clients.length) * 100).toFixed(0)}%</span>
                      </div>
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