import React, { useEffect, useState } from "react";
import { Users, FileText, AlertTriangle, ShieldCheck, TrendingUp, Bell, Download } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

const TYPE_COLORS = { Life: "bg-purple-100 text-purple-700", Health: "bg-green-100 text-green-700",
  Auto: "bg-blue-100 text-blue-700", Property: "bg-amber-100 text-amber-700", Travel: "bg-pink-100 text-pink-700" };

export default function InsuranceHome() {
  const [stats, setStats]   = useState(null);
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
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statCards = [
    { label: "Total Agents",    value: stats?.totalAgents    ?? 0, icon: Users,        color: "text-blue-600",    bg: "bg-blue-50" },
    { label: "Total Policies",  value: stats?.totalPolicies  ?? 0, icon: ShieldCheck,  color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Active Policies", value: stats?.activePolicies ?? 0, icon: FileText,     color: "text-purple-600",  bg: "bg-purple-50" },
    { label: "Pending Claims",  value: stats?.pendingClaims  ?? 0, icon: AlertTriangle,color: "text-amber-600",   bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Insurance Department</h2>
          <p className="text-sm text-gray-500 mt-0.5">Admin overview</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className={`${c.bg} p-3 rounded-full`}><Icon className={`w-5 h-5 ${c.color}`} /></div>
              <div>
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className="text-2xl font-bold text-gray-800">{c.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Premium Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl p-5 text-white flex items-center justify-between">
        <div>
          <p className="text-emerald-100 text-sm">Total Active Premium</p>
          <p className="text-3xl font-bold mt-1">₹{(stats?.totalPremium || 0).toLocaleString("en-IN")}</p>
        </div>
        <TrendingUp className="w-12 h-12 text-emerald-200" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Policies by Type */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Policies by Insurance Type</h3>
          {stats?.byType?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No policies yet</p>
          ) : (
            <div className="space-y-3">
              {(stats?.byType || []).map(t => (
                <div key={t._id} className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[t._id] || "bg-gray-100 text-gray-700"}`}>
                    {t._id}
                  </span>
                  <div className="flex items-center gap-3 flex-1 ml-4">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(100, (t.count / (stats?.totalPolicies || 1)) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-6 text-right">{t.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Policies */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Recent Policies</h3>
          {stats?.recentPolicies?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No policies yet</p>
          ) : (
            <div className="space-y-3">
              {(stats?.recentPolicies || []).map(p => (
                <div key={p._id} className="flex items-center justify-between border-b last:border-0 pb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.clientName}</p>
                    <p className="text-xs text-gray-500">{p.policyNumber} · {p.agent?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">₹{p.premiumAmount?.toLocaleString("en-IN")}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Claims", value: stats?.totalClaims ?? 0, color: "text-blue-600" },
          { label: "Approved Claims", value: stats?.approvedClaims ?? 0, color: "text-green-600" },
          { label: "Active Notices", value: stats?.notices ?? 0, color: "text-amber-600" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}