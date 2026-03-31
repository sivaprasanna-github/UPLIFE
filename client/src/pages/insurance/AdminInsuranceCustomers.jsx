import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Umbrella, Search, CheckCircle, XCircle, Clock,
  Eye, RefreshCw, Shield
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const INSURANCE_TYPES = ["all", "Life", "Health", "Auto", "Property", "Travel"];
const STATUSES        = ["all", "Active", "Expired", "Terminated", "Lapsed"];

const TYPE_COLORS = {
  Life:     "bg-purple-100 text-purple-700",
  Health:   "bg-green-100 text-green-700",
  Auto:     "bg-blue-100 text-blue-700",
  Property: "bg-orange-100 text-orange-700",
  Travel:   "bg-cyan-100 text-cyan-700"
};

const STATUS_COLORS = {
  Active:     "bg-green-100 text-green-700",
  Expired:    "bg-gray-100 text-gray-600",
  Terminated: "bg-red-100 text-red-700",
  Lapsed:     "bg-yellow-100 text-yellow-700"
};

const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function AdminInsuranceCustomers() {
  const [policies, setPolicies]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [status, setStatus]       = useState("all");
  const [insType, setInsType]     = useState("all");
  const [selected, setSelected]   = useState(null);

  const token   = sessionStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status  !== "all") params.set("status",        status);
      if (insType !== "all") params.set("insuranceType", insType);
      if (search)            params.set("search",        search);

      const res  = await fetch(`${API_URL}/admin/insurance/policies?${params}`, { headers });
      const data = await res.json();
      setPolicies(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load policies"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPolicies(); }, [status, insType]);

  const handleSearch = (e) => { e.preventDefault(); fetchPolicies(); };

  // Summary counts
  const summary = policies.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    acc.totalPremium = (acc.totalPremium || 0) + p.premiumAmount;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Insurance Customers</h2>
        <button onClick={fetchPolicies} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500">Total Policies</p>
          <p className="text-2xl font-bold text-gray-800">{policies.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-5">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-700">{summary.Active ?? 0}</p>
        </div>
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Expired / Lapsed</p>
          <p className="text-2xl font-bold text-gray-700">{(summary.Expired ?? 0) + (summary.Lapsed ?? 0)}</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
          <p className="text-sm text-gray-500">Total Premium</p>
          <p className="text-2xl font-bold text-blue-700">{fmt(summary.totalPremium ?? 0)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search client name, policy number…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
            {STATUSES.map(s => <option key={s} value={s}>{s === "all" ? "All Status" : s}</option>)}
          </select>
          <select value={insType} onChange={e => setInsType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
            {INSURANCE_TYPES.map(t => <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>)}
          </select>
          <button type="submit"
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-gray-700">All Policies ({policies.length})</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">Loading…</div>
        ) : policies.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Umbrella className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No policies found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Policy #", "Client", "Type", "Premium", "Sum Assured", "Agent", "Expiry", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {policies.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-gray-700">{p.policyNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{p.clientName}</p>
                      <p className="text-xs text-gray-400">{p.clientPhone}</p>
                      <p className="text-xs text-gray-400">{p.clientEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[p.insuranceType] || "bg-gray-100 text-gray-600"}`}>
                        {p.insuranceType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{fmt(p.premiumAmount)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(p.sumAssured)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-700">{p.agent?.name}</p>
                      <p className="text-xs text-gray-400">{p.agent?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(p.expiryDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(p)}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Policy Details</h3>
                <p className="text-xs text-gray-400 font-mono">{selected.policyNumber}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Client Name",    selected.clientName],
                  ["Client Phone",   selected.clientPhone || "—"],
                  ["Client Email",   selected.clientEmail || "—"],
                  ["Insurance Type", selected.insuranceType],
                  ["Premium",        fmt(selected.premiumAmount)],
                  ["Sum Assured",    fmt(selected.sumAssured)],
                  ["Status",         selected.status],
                  ["Expiry",         new Date(selected.expiryDate).toLocaleDateString("en-IN")],
                  ["Agent",          selected.agent?.name || "—"],
                  ["Agent Email",    selected.agent?.email || "—"],
                  ["Created",        new Date(selected.createdAt).toLocaleDateString("en-IN")],
                ].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">{k}</p>
                    <p className="font-medium text-gray-800">{v}</p>
                  </div>
                ))}
              </div>
              {selected.remarks && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Remarks</p>
                  <p className="text-gray-700">{selected.remarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}