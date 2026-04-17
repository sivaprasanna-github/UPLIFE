import React, { useEffect, useState } from "react";
import { ShieldCheck, FileText, Clock, DollarSign, TrendingUp, Activity, Wallet } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

export default function AgentHome() {
  const [stats, setStats]   = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const token = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/agent/stats`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/agent/my-policies`, { headers }).then(r => r.json())
    ]).then(([s, p]) => {
      setStats(s);
      setRecent(Array.isArray(p) ? p.slice(0, 5) : []);
    }).catch(() => toast.error("Failed to load"))
    .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50 rounded-3xl">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
      <p className="text-slate-500 font-bold animate-pulse">Loading Workspace...</p>
    </div>
  );

  const cards = [
    { label: "Total Policies",  value: stats?.totalPolicies  ?? 0, icon: ShieldCheck, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Active Policies", value: stats?.activePolicies ?? 0, icon: TrendingUp,  color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Total Claims",    value: stats?.totalClaims    ?? 0, icon: FileText,    color: "text-rose-600", bg: "bg-rose-100" },
    { label: "Claims Processing", value: stats?.pendingClaims  ?? 0, icon: Clock,     color: "text-amber-600", bg: "bg-amber-100" },
  ];

  const statusBadge = (s) => {
    if (s === "Active")   return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "Inactive") return "bg-slate-100 text-slate-600 border-slate-200";
    if (s === "Expired")  return "bg-rose-50 text-rose-700 border-rose-200";
    if (s === "Lapsed")   return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 rounded-3xl">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Activity className="w-8 h-8 text-indigo-600" /> Welcome, {user.name || "Agent"} 👋
        </h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">Your insurance portfolio and commission overview.</p>
      </div>

      {/* Wallet / Commission Banner */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-800 rounded-3xl p-8 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
        <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <Wallet className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <p className="text-indigo-200 font-bold tracking-widest text-sm uppercase mb-2">Total Commission Earned</p>
          <h1 className="text-5xl font-black mb-4">₹{(stats?.totalCommission || 0).toLocaleString("en-IN")}</h1>
          
          <div className="flex gap-4">
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <span className="font-bold text-sm text-emerald-300">Paid:</span>
              <span className="font-bold text-sm ml-2">₹{(stats?.paidCommission || 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <span className="font-bold text-sm text-amber-300">Pending:</span>
              <span className="font-bold text-sm ml-2">₹{((stats?.totalCommission || 0) - (stats?.paidCommission || 0)).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{c.label}</p>
                  <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{c.value}</h3>
                </div>
                <div className={`${c.bg} p-3 rounded-xl transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`w-6 h-6 ${c.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Policies Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> Recent Policy Sales
          </h3>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-medium">
            No policies added yet. Head to "My Policies" to issue your first one!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Policy No.</th>
                  <th className="px-5 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Client Name</th>
                  <th className="px-5 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Premium</th>
                  <th className="px-5 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recent.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-600 text-xs bg-slate-100 inline-block m-3 rounded px-2 py-1 border border-slate-200">{p.policyNumber}</td>
                    <td className="px-5 py-4 font-bold text-slate-800">{p.clientName}</td>
                    <td className="px-5 py-4 font-medium text-slate-600">{p.insuranceType}</td>
                    <td className="px-5 py-4 font-black text-indigo-600">₹{p.premiumAmount?.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border shadow-sm ${statusBadge(p.status)}`}>{p.status}</span>
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