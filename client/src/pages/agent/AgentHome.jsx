import React, { useEffect, useState } from "react";
import { ShieldCheck, FileText, Clock, DollarSign, TrendingUp } from "lucide-react";
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
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const cards = [
    { label: "Total Policies",  value: stats?.totalPolicies  ?? 0, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Active Policies", value: stats?.activePolicies ?? 0, icon: TrendingUp,  color: "text-blue-600",    bg: "bg-blue-50" },
    { label: "Total Claims",    value: stats?.totalClaims    ?? 0, icon: FileText,    color: "text-purple-600",  bg: "bg-purple-50" },
    { label: "Pending Claims",  value: stats?.pendingClaims  ?? 0, icon: Clock,       color: "text-amber-600",   bg: "bg-amber-50" },
  ];

  const statusBadge = (s) => {
    if (s === "Active")   return "bg-green-100 text-green-700";
    if (s === "Expired")  return "bg-red-100 text-red-700";
    if (s === "Lapsed")   return "bg-amber-100 text-amber-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Welcome, {user.name || "Agent"} 👋</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your insurance portfolio overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => {
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

      {/* Commission Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl p-5 text-white flex items-center justify-between">
        <div>
          <p className="text-emerald-100 text-sm">Total Commission Earned</p>
          <p className="text-3xl font-bold mt-1">₹{(stats?.totalCommission || 0).toLocaleString("en-IN")}</p>
          <p className="text-emerald-200 text-xs mt-1">
            Paid: ₹{(stats?.paidCommission || 0).toLocaleString("en-IN")} &nbsp;·&nbsp;
            Pending: ₹{((stats?.totalCommission || 0) - (stats?.paidCommission || 0)).toLocaleString("en-IN")}
          </p>
        </div>
        <DollarSign className="w-12 h-12 text-emerald-200" />
      </div>

      {/* Recent Policies */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Recent Policies</h3>
        {recent.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No policies added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b">
                  <th className="pb-2 font-medium">Policy No.</th>
                  <th className="pb-2 font-medium">Client</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Premium</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(p => (
                  <tr key={p._id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 font-mono text-xs text-gray-600">{p.policyNumber}</td>
                    <td className="py-2 font-medium text-gray-800">{p.clientName}</td>
                    <td className="py-2 text-gray-600">{p.insuranceType}</td>
                    <td className="py-2 text-gray-800 font-medium">₹{p.premiumAmount?.toLocaleString("en-IN")}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(p.status)}`}>{p.status}</span>
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