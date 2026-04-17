import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Umbrella, Search, Clock, Eye, RefreshCw, Shield, AlertCircle
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const INSURANCE_TYPES = ["all", "Life", "Health", "Auto", "Property", "Travel"];
const STATUSES        = ["all", "Active", "Expired", "Terminated", "Lapsed"];

const TYPE_COLORS = {
  Life:     "bg-indigo-100 text-indigo-700 border-indigo-200",
  Health:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  Auto:     "bg-blue-100 text-blue-700 border-blue-200",
  Property: "bg-amber-100 text-amber-700 border-amber-200",
  Travel:   "bg-cyan-100 text-cyan-700 border-cyan-200"
};

const STATUS_COLORS = {
  Active:     "bg-emerald-100 text-emerald-700 border-emerald-200",
  Expired:    "bg-slate-100 text-slate-600 border-slate-200",
  Terminated: "bg-rose-100 text-rose-700 border-rose-200",
  Lapsed:     "bg-amber-100 text-amber-700 border-amber-200"
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

  const summary = policies.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    acc.totalPremium = (acc.totalPremium || 0) + p.premiumAmount;
    return acc;
  }, {});

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 rounded-3xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Policies Management</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Track and manage all issued insurance policies.</p>
        </div>
        <button onClick={fetchPolicies} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 shadow-sm text-sm font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-xl transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Shield className="w-16 h-16"/></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 relative z-10">Total Policies</p>
          <p className="text-3xl font-extrabold text-slate-800 relative z-10">{policies.length}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Shield className="w-16 h-16 text-emerald-600"/></div>
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 relative z-10">Active Coverages</p>
          <p className="text-3xl font-extrabold text-emerald-800 relative z-10">{summary.Active ?? 0}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl border border-amber-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><AlertCircle className="w-16 h-16 text-amber-600"/></div>
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 relative z-10">Expired / Lapsed</p>
          <p className="text-3xl font-extrabold text-amber-800 relative z-10">{(summary.Expired ?? 0) + (summary.Lapsed ?? 0)}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl border border-indigo-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Umbrella className="w-16 h-16 text-indigo-600"/></div>
          <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 relative z-10">Total Premium</p>
          <p className="text-3xl font-extrabold text-indigo-800 relative z-10">{fmt(summary.totalPremium ?? 0)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search policy #, client name…"
              className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all shadow-inner" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 bg-slate-50 cursor-pointer shadow-sm">
            {STATUSES.map(s => <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>)}
          </select>
          <select value={insType} onChange={e => setInsType(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 bg-slate-50 cursor-pointer shadow-sm">
            {INSURANCE_TYPES.map(t => <option key={t} value={t}>{t === "all" ? "All Product Types" : t}</option>)}
          </select>
          <button type="submit"
            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow-lg hover:shadow-indigo-600/20 transition-all active:scale-95">
            Filter Results
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" /> Active Registry
          </h3>
        </div>
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-3" />
            <p className="font-medium text-sm">Retrieving policies...</p>
          </div>
        ) : policies.length === 0 ? (
          <div className="text-center py-24 text-slate-400">
            <Umbrella className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-slate-600">No policies match your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Policy #", "Client", "Product", "Premium", "Sum Assured", "Agent", "Expiry", "Status", ""].map(h => (
                    <th key={h} className="px-5 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {policies.map(p => (
                  <tr key={p._id} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block border border-slate-200">{p.policyNumber}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">{p.clientName}</p>
                      <p className="text-xs text-slate-400 font-medium">{p.clientPhone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${TYPE_COLORS[p.insuranceType] || "bg-slate-100 text-slate-600"}`}>
                        {p.insuranceType}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-black text-indigo-700">{fmt(p.premiumAmount)}</td>
                    <td className="px-5 py-4 text-slate-600 font-semibold">{fmt(p.sumAssured)}</td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-700">{p.agent?.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.agent?.email}</p>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-2">
                      <Clock className="w-3.5 h-3.5"/> {new Date(p.expiryDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${STATUS_COLORS[p.status] || "bg-slate-100 text-slate-600"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => setSelected(p)} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 text-indigo-600 hover:border-indigo-200 transition shadow-sm">
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

      {/* Detail Modal (Glassmorphism) */}
      {selected && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 transform transition-all scale-100">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600"><Shield className="w-6 h-6"/></div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Policy Details</h3>
                  <p className="text-sm text-slate-500 font-mono font-bold">{selected.policyNumber}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors font-bold text-lg">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Client Name",    selected.clientName],
                  ["Client Phone",   selected.clientPhone || "—"],
                  ["Client Email",   selected.clientEmail || "—"],
                  ["Insurance Type", selected.insuranceType],
                  ["Premium",        <span className="text-indigo-600 font-black">{fmt(selected.premiumAmount)}</span>],
                  ["Sum Assured",    fmt(selected.sumAssured)],
                  ["Status",         <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>],
                  ["Expiry",         new Date(selected.expiryDate).toLocaleDateString("en-IN")],
                  ["Agent",          selected.agent?.name || "—"],
                  ["Agent Email",    selected.agent?.email || "—"],
                  ["Created Date",   new Date(selected.createdAt).toLocaleDateString("en-IN")],
                ].map(([k, v], idx) => (
                  <div key={k} className={`p-4 rounded-xl border border-slate-100 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{k}</p>
                    <div className="font-semibold text-slate-800 text-sm">{v}</div>
                  </div>
                ))}
              </div>
              {selected.remarks && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-[10px] text-amber-600/80 font-bold uppercase tracking-widest mb-1.5">Remarks / Notes</p>
                  <p className="text-slate-700 text-sm font-medium leading-relaxed">{selected.remarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}