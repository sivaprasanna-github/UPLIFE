import React, { useEffect, useState } from "react";
import { DollarSign, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

const RATES = { Life: 15, Health: 10, Auto: 8, Property: 7, Travel: 5 };

export default function Commissions() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API_URL}/agent/my-commissions`, { headers })
      .then(r => r.json())
      .then(data => setCommissions(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load commissions"))
      .finally(() => setLoading(false));
  }, []);

  const totalEarned  = commissions.reduce((s, c) => s + c.commissionAmount, 0);
  const paidEarned   = commissions.filter(c => c.status === "Paid").reduce((s, c) => s + c.commissionAmount, 0);
  const pendingEarned = totalEarned - paidEarned;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Commissions</h2>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Earned",   value: totalEarned,   icon: DollarSign,  color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Paid",           value: paidEarned,    icon: CheckCircle, color: "text-green-600",   bg: "bg-green-50" },
          { label: "Pending",        value: pendingEarned, icon: Clock,       color: "text-amber-600",   bg: "bg-amber-50" },
        ].map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className={`${c.bg} p-3 rounded-full`}><Icon className={`w-5 h-5 ${c.color}`} /></div>
              <div>
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className="text-xl font-bold text-gray-800">₹{c.value.toLocaleString("en-IN")}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Commission Rates Info */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-emerald-700 mb-2">Commission Rates by Type</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(RATES).map(([type, rate]) => (
            <span key={type} className="px-3 py-1 bg-white text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
              {type}: {rate}%
            </span>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Policy No.</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Premium</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Commission</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : commissions.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No commissions yet. Create a policy to start earning!</td></tr>
              ) : commissions.map(c => (
                <tr key={c._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.policyNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.clientName}</td>
                  <td className="px-4 py-3 text-gray-600">{c.insuranceType}</td>
                  <td className="px-4 py-3 text-gray-700">₹{c.premiumAmount?.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-gray-600">{c.commissionRate}%</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">₹{c.commissionAmount?.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      c.status === "Paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && commissions.length > 0 && (
          <div className="px-4 py-3 border-t text-xs text-gray-400 flex justify-between">
            <span>{commissions.length} records</span>
            <span className="font-semibold text-gray-700">Total: ₹{totalEarned.toLocaleString("en-IN")}</span>
          </div>
        )}
      </div>
    </div>
  );
}