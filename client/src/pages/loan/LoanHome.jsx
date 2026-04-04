import React, { useEffect, useState } from "react";
import { Users, CheckCircle, XCircle, TrendingUp, Download, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

export default function LoanHome() {
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]); 
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
      const statsRes = await fetch(`${API_URL}/loan/users/stats/summary`, { headers });
      const statsData = await statsRes.json();

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

  useEffect(() => { fetchData(); }, []);

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/loan/users/${id}/status`, {
        method: "PATCH", headers, body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error();
      
      toast.success(`Status updated to ${status}`);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, status } : u));
      
      const statsRes = await fetch(`${API_URL}/loan/users/stats/summary`, { headers });
      setStats(await statsRes.json());
    } catch {
      toast.error("Status update failed");
    }
  };

  const downloadCSV = () => {
    const rows = [
      ["S.No", "Date", "Customer Name", "Phone", "Email", "Loan Type", "Employment", "Amount", "Status", "Created By"],
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
    if (status === "active") return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100";
    if (status === "inactive") return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
    return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">Loading Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Loan Overview</h2>
          <p className="text-gray-500 text-sm mt-1.5 font-medium">Comprehensive snapshot of all registered users and capital</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-2.5 bg-gray-50 text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-100 hover:text-blue-600 transition shadow-sm" title="Refresh Data">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={downloadCSV} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm w-full md:w-auto">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total Users" value={stats?.total || 0} icon={Users} color="text-blue-600" bg="bg-blue-50" border="border-l-blue-500" />
        <StatCard label="Active Accounts" value={stats?.active || 0} icon={CheckCircle} color="text-green-600" bg="bg-green-50" border="border-l-green-500" />
        <StatCard label="Inactive Accounts" value={stats?.inactive || 0} icon={XCircle} color="text-red-600" bg="bg-red-50" border="border-l-red-500" />
        <div className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-indigo-500 shadow-sm p-6 flex items-center gap-5 transition-all hover:-translate-y-1 hover:shadow-md">
           <div className="bg-indigo-50 p-4 rounded-xl"><TrendingUp className="w-6 h-6 text-indigo-600" /></div>
           <div>
             <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Required Capital</p>
             <p className="text-2xl font-black text-gray-900 mt-1 tracking-tight">₹{(stats?.totalRequiredAmount || 0).toLocaleString("en-IN")}</p>
           </div>
        </div>
      </div>

      {/* ── Main Table Section ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header & Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-5 border-b border-gray-100 bg-white gap-4">
          <h3 className="font-bold text-lg text-gray-800">Application Records</h3>
          
          {/* Segmented Control Filter */}
          <div className="flex bg-gray-100/80 p-1.5 rounded-xl border border-gray-200/60">
            {["all", "Active", "Inactive"].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-5 py-1.5 rounded-lg text-sm font-bold capitalize transition-all duration-200 ${
                  filter === s ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">S.No</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer Info</th>
                <th className="px-6 py-4">KYC Details</th>
                <th className="px-6 py-4">Loan Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Employee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium text-base">No users found in this category</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((u, i) => (
                <tr key={u._id} className="hover:bg-blue-50/20 transition duration-150 group">
                  <td className="px-6 py-4 text-gray-400 font-bold">{i + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-semibold">
                    {new Date(u.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{u.fullName}</div>
                    <div className="text-xs font-semibold text-gray-500 mt-1">{u.phone}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className="text-[11px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md tracking-wide">
                        PAN: <span className="text-gray-800">{u.panNumber || 'N/A'}</span>
                      </span>
                      <span className="text-[11px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md tracking-wide">
                        UID: <span className="text-gray-800">{u.aadharNumber || 'N/A'}</span>
                      </span>
                      <span className="text-xs text-blue-600 mt-0.5 font-bold">{u.employmentType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50/50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm">
                      {u.preferredLoanType}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-gray-900 text-base tracking-tight">
                    ₹{u.requiredLoanAmount?.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <select 
                        value={u.status} 
                        onChange={e => handleStatusChange(u._id, e.target.value)}
                        className={`appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-bold border outline-none cursor-pointer shadow-sm transition-colors ${statusBadge(u.status)}`}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                      {/* Custom dropdown arrow to fit the pill style */}
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-800 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg inline-block shadow-sm">
                      {u.createdBy?.name || "System"}
                    </div>
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

function StatCard({ label, value, icon: Icon, color, bg, border }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${border} shadow-sm p-6 flex items-center gap-5 transition-all hover:-translate-y-1 hover:shadow-md`}>
      <div className={`${bg} p-4 rounded-xl shadow-sm`}><Icon className={`w-6 h-6 ${color}`} /></div>
      <div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );
}