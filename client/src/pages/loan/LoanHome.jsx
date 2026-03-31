import React, { useEffect, useState } from "react";
import { Users, Clock, CheckCircle, XCircle, TrendingUp, Download } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL; // e.g., http://localhost:5000/api

export default function LoanHome() {
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]); // Changed 'clients' to 'users' to match your model
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");

  const token = sessionStorage.getItem("token");
  const headers = { 
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats from /api/loan/users/stats/summary
      const statsRes = await fetch(`${API_URL}/loan/users/stats/summary`, { headers });
      const statsData = await statsRes.json();

      // 2. Fetch All Loan Users from /api/loan/users
      const usersRes = await fetch(`${API_URL}/loan/users`, { headers });
      const usersData = await usersRes.json();

      setStats(statsData);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load loan department data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      // Matches: PATCH /api/loan/users/:id/status
      const res = await fetch(`${API_URL}/loan/users/${id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status })
      });
      
      if (!res.ok) throw new Error();
      
      toast.success(`Status updated to ${status}`);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, status } : u));
      
      // Refresh stats after status change
      const statsRes = await fetch(`${API_URL}/loan/users/stats/summary`, { headers });
      setStats(await statsRes.json());
    } catch {
      toast.error("Status update failed");
    }
  };

  const downloadCSV = () => {
    const rows = [
      ["S.No", "Date", "Customer Name", "Phone", "Email", "Loan Type", "Employment", "Amount", "Status", "Agent/Employee"],
      ...users.map((u, i) => [
        i + 1,
        new Date(u.createdAt).toLocaleDateString("en-IN"),
        u.fullName, u.phone, u.email, u.preferredLoanType,
        u.employmentType, u.requiredLoanAmount, u.status,
        u.createdBy?.name || "Admin"
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `loan-users-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filtered = filter === "all" ? users : users.filter(u => u.status.toLowerCase() === filter.toLowerCase());

  const statusBadge = (s) => {
    const status = s.toLowerCase();
    if (status === "active") return "bg-green-100 text-green-700";
    if (status === "inactive") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Loan User Management</h2>
          <p className="text-gray-500 text-sm">Overview of all loan applications and users</p>
        </div>
        <button onClick={downloadCSV}
          className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition w-full md:w-auto">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Backend Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats?.total || 0} icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Active" value={stats?.active || 0} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
        <StatCard label="Inactive" value={stats?.inactive || 0} icon={XCircle} color="text-red-500" bg="bg-red-50" />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 border-l-4 border-l-indigo-500">
           <div className="bg-indigo-50 p-3 rounded-full"><TrendingUp className="w-5 h-5 text-indigo-600" /></div>
           <div>
             <p className="text-xs text-gray-500">Total Required Capital</p>
             <p className="text-xl font-bold text-gray-800">₹{(stats?.totalRequiredAmount || 0).toLocaleString("en-IN")}</p>
           </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between px-5 py-4 border-b gap-4">
          <h3 className="font-semibold text-gray-700">Application Records</h3>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {["all", "Active", "Inactive"].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                  filter === s ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>{s}</button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500 uppercase text-[10px] tracking-wider">
                <th className="px-4 py-3 font-bold">Details</th>
                <th className="px-4 py-3 font-bold">KYC Info</th>
                <th className="px-4 py-3 font-bold">Loan Type</th>
                <th className="px-4 py-3 font-bold">Amount</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Created By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 font-medium">No users found in this category</td></tr>
              ) : filtered.map((u) => (
                <tr key={u._id} className="border-b last:border-0 hover:bg-gray-50/50 transition">
                  <td className="px-4 py-4">
                    <div className="font-bold text-gray-800">{u.fullName}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                    <div className="text-xs text-gray-500">{u.phone}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xs font-medium text-gray-700">PAN: {u.panNumber || 'N/A'}</div>
                    <div className="text-xs font-medium text-gray-700">AADHAR: {u.aadharNumber || 'N/A'}</div>
                    <div className="text-[10px] text-gray-400 mt-1 italic">{u.employmentType}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[11px] font-bold">
                      {u.preferredLoanType}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-black text-gray-900">
                    ₹{u.requiredLoanAmount?.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-4">
                    <select 
                      value={u.status} 
                      onChange={e => handleStatusChange(u._id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border-0 cursor-pointer shadow-sm ${statusBadge(u.status)}`}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xs font-semibold text-gray-600">{u.createdBy?.name || "System"}</div>
                    <div className="text-[10px] text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className={`${bg} p-3 rounded-full`}><Icon className={`w-5 h-5 ${color}`} /></div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}