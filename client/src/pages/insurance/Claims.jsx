import React, { useEffect, useState } from "react";
import { Search, X, FileText, CheckCircle, Clock, Ban } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

const STATUS_UI = {
  Filed:         { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: FileText },
  "Under Review":{ bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: Clock },
  Approved:      { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle },
  Paid:          { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", icon: CheckCircle },
  Rejected:      { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", icon: Ban },
};

export default function Claims() {
  const [claims, setClaims]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [selected, setSelected] = useState(null);
  const [remark, setRemark]   = useState("");

  const token = sessionStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (search) params.set("search", search);
      const res = await fetch(`${API_URL}/insurance/all-claims?${params}`, { headers });
      const data = await res.json();
      setClaims(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load claims"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClaims(); }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API_URL}/insurance/claim/${id}/status`, {
        method: "PATCH", headers, body: JSON.stringify({ status, adminRemarks: remark })
      });
      toast.success(`Claim marked as ${status}`);
      setClaims(prev => prev.map(c => c._id === id ? { ...c, status } : c));
      setSelected(null); setRemark("");
    } catch { toast.error("Update failed"); }
  };

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 rounded-3xl">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Claims Processing</h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">Review and action pending customer insurance claims.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.keys(STATUS_UI).map(s => {
          const count = claims.filter(c => c.status === s).length;
          const UI = STATUS_UI[s];
          const Icon = UI.icon;
          return (
            <div key={s} className={`rounded-2xl border ${UI.border} ${UI.bg} p-5 flex flex-col items-center justify-center relative overflow-hidden`}>
              <Icon className={`w-8 h-8 mb-2 opacity-40 ${UI.text}`} />
              <p className={`text-[11px] font-extrabold uppercase tracking-widest ${UI.text}`}>{s}</p>
              <p className={`text-3xl font-black ${UI.text} mt-1`}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-4 items-center justify-between">
        <form onSubmit={e => { e.preventDefault(); fetchClaims(); }} className="flex gap-2 flex-1 min-w-[280px]">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search Policy No. or Client Name..."
              className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 shadow-inner transition" />
          </div>
          <button type="submit" className="px-5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm">
            Search
          </button>
        </form>
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 overflow-x-auto">
          {["all", ...Object.keys(STATUS_UI)].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition whitespace-nowrap ${
                filter === s ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Date", "Policy No", "Client", "Amount", "Agent", "Status", ""].map((h, i) => (
                  <th key={i} className="px-5 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400 font-medium">Loading claims...</td></tr>
              ) : claims.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400 font-medium">No claims match the selected criteria.</td></tr>
              ) : claims.map(c => {
                const ui = STATUS_UI[c.status] || { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
                return (
                  <tr key={c._id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-5 py-4 text-slate-500 font-medium whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-600 bg-slate-100 inline-block m-3 rounded px-2 py-1 border border-slate-200">{c.policyNumber}</td>
                    <td className="px-5 py-4 font-bold text-slate-800">{c.clientName}</td>
                    <td className="px-5 py-4 font-black text-indigo-700">₹{c.claimAmount?.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4 text-slate-600 font-medium">{c.agent?.name || "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${ui.bg} ${ui.text} ${ui.border}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => { setSelected(c); setRemark(c.adminRemarks || ""); }}
                        className="px-4 py-2 bg-white border border-slate-200 text-indigo-600 font-bold text-xs rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition shadow-sm">
                        Review Case
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!loading && claims.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-sm flex justify-between items-center font-bold text-slate-600">
            <span>Showing {claims.length} claims</span>
            <span className="text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200">
              Total Request Volume: ₹{claims.reduce((s, c) => s + (c.claimAmount || 0), 0).toLocaleString("en-IN")}
            </span>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-xl text-slate-900">Case Review</h3>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center bg-slate-200 hover:bg-rose-100 hover:text-rose-600 rounded-full transition font-bold">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-sm">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2"><span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Policy No.</span><span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{selected.policyNumber}</span></div>
                <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Client Name</span><span className="font-bold text-slate-800">{selected.clientName}</span></div>
                <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Claim Amount</span><span className="font-black text-indigo-600 text-base">₹{selected.claimAmount?.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between pb-1"><span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Agent</span><span className="font-semibold">{selected.agent?.name}</span></div>
                <div className="pt-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest block mb-1">Description of Claim</span>
                  <p className="text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed font-medium">{selected.description}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Admin Remarks (Internal)</label>
                <textarea rows={3} value={remark} onChange={e => setRemark(e.target.value)}
                  placeholder="Enter final review notes..."
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white resize-none shadow-sm transition-all" />
              </div>

              <div className="pt-2 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => updateStatus(selected._id, "Under Review")} className="py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition shadow-sm">Set Under Review</button>
                  <button onClick={() => updateStatus(selected._id, "Approved")} className="py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition shadow-sm">Approve Claim</button>
                  <button onClick={() => updateStatus(selected._id, "Rejected")} className="py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition shadow-sm">Reject Claim</button>
                </div>
                <button onClick={() => updateStatus(selected._id, "Paid")} className="w-full py-3.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm hover:shadow-lg hover:shadow-indigo-600/20 active:scale-95">
                  ✓ Mark as Paid & Closed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}