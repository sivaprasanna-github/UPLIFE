import React, { useEffect, useState } from "react";
import { Search, FileText, CheckCircle, XCircle, Clock, Eye, X, Filter, Download } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

const STATUS_UI = {
  pending:  { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: Clock },
  approved: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle },
  rejected: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", icon: XCircle },
};

export default function AdminLoanClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [selected, setSelected] = useState(null);

  const token = sessionStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (search) params.set("search", search);
      
      const res = await fetch(`${API_URL}/admin/loan/clients?${params}`, { headers });
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load loan applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API_URL}/admin/loan/client/${id}/status`, {
        method: "PATCH", headers, body: JSON.stringify({ status })
      });
      toast.success(`Application marked as ${status}`);
      setClients(prev => prev.map(c => c._id === id ? { ...c, status } : c));
      setSelected(null);
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 rounded-3xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600" /> Loan Applications
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Review, approve, and manage customer loan requests.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 shadow-sm transition-all active:scale-95">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Advanced Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Tabs for Filtering */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto overflow-x-auto">
          {["all", "pending", "approved", "rejected"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-5 py-2 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                filter === s ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              {s === "all" ? "All Requests" : s}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={e => { e.preventDefault(); fetchClients(); }} className="flex gap-2 w-full md:w-auto flex-1 md:max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search Client Name, Phone, or Email..."
              className="w-full pl-11 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 bg-slate-50 shadow-inner transition-all" />
          </div>
          <button type="submit" className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Date", "Applicant", "Loan Type", "Amount Required", "Assigned Employee", "Status", "Action"].map((h, i) => (
                  <th key={i} className={`px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest ${i===6 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400 font-medium">Fetching loan records...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400 font-medium">No applications match your criteria.</td></tr>
              ) : clients.map(c => {
                const ui = STATUS_UI[c.status] || STATUS_UI.pending;
                const Icon = ui.icon;
                return (
                  <tr key={c._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-semibold text-xs whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{c.fullName}</p>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">{c.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-md text-xs font-bold">
                        {c.loanType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-blue-700 text-base">
                      ₹{c.loanAmount?.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">
                      {c.employee?.name || "Unassigned"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${ui.bg} ${ui.text} ${ui.border}`}>
                        <Icon className="w-3.5 h-3.5" /> <span className="capitalize">{c.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setSelected(c)}
                        className="px-4 py-2 bg-white border border-slate-200 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-50 hover:border-blue-200 transition shadow-sm">
                        Review File
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!loading && clients.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-sm flex justify-between items-center font-bold text-slate-500">
            <span>Showing {clients.length} applications</span>
          </div>
        )}
      </div>

      {/* Review Modal (Glassmorphism & Advanced UI) */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-extrabold text-2xl text-slate-900 tracking-tight">Application Review</h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">ID: {selected._id.slice(-8)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center bg-slate-200 hover:bg-rose-100 hover:text-rose-600 rounded-full transition font-bold">✕</button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Applicant Name", value: selected.fullName },
                  { label: "Contact Email", value: selected.email },
                  { label: "Phone Number", value: selected.phone },
                  { label: "Loan Category", value: selected.loanType },
                  { label: "Requested Amount", value: <span className="text-blue-600 font-black text-lg">₹{selected.loanAmount?.toLocaleString("en-IN")}</span> },
                  { label: "Processing Employee", value: selected.employee?.name || "N/A" },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                    <div className="font-bold text-slate-800 text-sm">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Remarks Box */}
              {selected.remarks && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-[10px] font-extrabold text-amber-600/80 uppercase tracking-widest mb-1">Employee Remarks</p>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">{selected.remarks}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">Final Decision</p>
                
                {selected.status === "pending" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => updateStatus(selected._id, "approved")}
                      className="py-3.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20 active:scale-95 flex justify-center items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Approve Loan
                    </button>
                    <button onClick={() => updateStatus(selected._id, "rejected")}
                      className="py-3.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition shadow-lg shadow-rose-500/20 active:scale-95 flex justify-center items-center gap-2">
                      <XCircle className="w-5 h-5" /> Reject Application
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm font-bold text-slate-600">
                      This application has already been <span className={`uppercase tracking-widest px-2 py-0.5 rounded text-white ${selected.status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'}`}>{selected.status}</span>.
                    </p>
                    <button onClick={() => updateStatus(selected._id, "pending")} className="mt-3 text-xs font-bold text-blue-600 hover:underline">
                      Revert to Pending Status
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}