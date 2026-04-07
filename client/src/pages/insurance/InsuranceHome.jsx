import React, { useEffect, useState } from "react";
import { Users, FileText, AlertTriangle, ShieldCheck, TrendingUp, Activity, Shield } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

const TYPE_COLORS = { 
  Life: "bg-indigo-100 text-indigo-700 border-indigo-200", 
  Health: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Auto: "bg-blue-100 text-blue-700 border-blue-200", 
  Property: "bg-amber-100 text-amber-700 border-amber-200", 
  Travel: "bg-cyan-100 text-cyan-700 border-cyan-200" 
};

export default function InsuranceHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API_URL}/insurance/stats`, { headers })
      .then(r => r.json())
      .then(setStats)
      .catch(() => toast.error("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50 rounded-3xl">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
      <p className="text-slate-500 font-bold animate-pulse">Loading Dashboard...</p>
    </div>
  );

  const statCards = [
    { label: "Total Agents", value: stats?.totalAgents ?? 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Total Policies", value: stats?.totalPolicies ?? 0, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Active Policies", value: stats?.activePolicies ?? 0, icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Pending Claims", value: stats?.pendingClaims ?? 0, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-100" },
  ];

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 rounded-3xl">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8 text-indigo-600" /> Admin Overview
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Real-time statistics for the Insurance Department</p>
        </div>
      </div>

      {/* Premium Banner */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-8 text-white flex items-center justify-between shadow-lg shadow-emerald-600/20 relative overflow-hidden group">
        <div className="absolute -right-6 -top-6 opacity-20 group-hover:scale-110 transition-transform duration-500">
          <ShieldCheck className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <p className="text-emerald-100 text-sm font-bold tracking-widest uppercase mb-1">Total Active Premium</p>
          <p className="text-5xl font-black tracking-tight">₹{(stats?.totalPremium || 0).toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm relative z-10">
          <TrendingUp className="w-10 h-10 text-white" />
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition-shadow group">
              <div className={`${c.bg} p-4 rounded-xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                <Icon className={`w-6 h-6 ${c.color}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{c.label}</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{c.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Policies by Type */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" /> Portfolio Distribution
          </h3>
          {stats?.byType?.length === 0 ? (
            <p className="text-slate-400 text-sm font-medium text-center py-8">No active policies to distribute.</p>
          ) : (
            <div className="space-y-5">
              {(stats?.byType || []).map(t => (
                <div key={t._id} className="flex items-center justify-between group">
                  <span className={`px-3 py-1 rounded-md border text-xs font-bold w-24 text-center shadow-sm ${TYPE_COLORS[t._id] || "bg-slate-100 text-slate-700"}`}>
                    {t._id}
                  </span>
                  <div className="flex items-center gap-4 flex-1 ml-4">
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                      <div 
                        className="h-full rounded-full bg-indigo-500 group-hover:bg-indigo-600 transition-colors"
                        style={{ width: `${Math.min(100, (t.count / (stats?.totalPolicies || 1)) * 100)}%` }} 
                      />
                    </div>
                    <span className="text-sm font-black text-slate-700 w-8 text-right">{t.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Policies */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-0 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" /> Recent Issuances
            </h3>
          </div>
          {stats?.recentPolicies?.length === 0 ? (
            <p className="text-slate-400 text-sm font-medium text-center py-8">No recent policies issued.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {(stats?.recentPolicies || []).map(p => (
                <div key={p._id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                      {p.clientName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{p.clientName}</p>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">
                        <span className="text-indigo-500 font-mono">{p.policyNumber}</span> • {p.agent?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-800">₹{p.premiumAmount?.toLocaleString("en-IN")}</p>
                    <span className={`text-[10px] mt-1 px-2.5 py-0.5 rounded-md font-bold border inline-block ${
                      p.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Row Bottom */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {[
          { label: "Total Claims Filed", value: stats?.totalClaims ?? 0, color: "text-blue-600", border: "border-blue-100" },
          { label: "Approved Claims", value: stats?.approvedClaims ?? 0, color: "text-emerald-600", border: "border-emerald-100" },
          { label: "Active Notices", value: stats?.notices ?? 0, color: "text-amber-600", border: "border-amber-100" },
        ].map(c => (
          <div key={c.label} className={`bg-white rounded-2xl border ${c.border} shadow-sm p-6 text-center hover:shadow-md transition-shadow`}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{c.label}</p>
            <p className={`text-4xl font-black mt-2 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}