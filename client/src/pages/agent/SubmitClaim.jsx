import React, { useEffect, useState } from "react";
import { Plus, X, FileText, CheckCircle, Clock, Ban, ArchiveX } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;
const EMPTY = { policyNumber: "", clientName: "", claimAmount: "", description: "" };

// ✅ Correctly mapped UI statuses
const STATUS_STYLE = {
  Filed:           { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: FileText },
  "Under Process": { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: Clock },
  "Under Review":  { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: Clock }, // Fallback for DB enum
  Approved:        { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle },
  Paid:            { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200", icon: CheckCircle },
  Rejected:        { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", icon: Ban },
};

// UI Labels to show on the stat cards
const UI_STATUS_LABELS = ["Filed", "Under Process", "Approved", "Paid", "Rejected"];

export default function SubmitClaim() {
  const [claims, setClaims]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [policies, setPolicies] = useState([]);
  const [saving, setSaving]     = useState(false);

  const token = sessionStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/agent/my-claims`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/agent/my-policies`, { headers }).then(r => r.json()),
    ]).then(([c, p]) => {
      setClaims(Array.isArray(c) ? c : []);
      setPolicies(Array.isArray(p) ? p.filter(pol => pol.status === "Active") : []);
    }).catch(() => toast.error("Failed to load data"))
    .finally(() => setLoading(false));
  }, []);

  const handlePolicySelect = (e) => {
    const pol = policies.find(p => p.policyNumber === e.target.value);
    if (pol) setForm({ ...form, policyNumber: pol.policyNumber, clientName: pol.clientName });
    else setForm({ ...form, policyNumber: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/agent/create-claim`, {
        method: "POST", headers,
        body: JSON.stringify({ ...form, claimAmount: Number(form.claimAmount) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Claim submitted successfully!");
      setClaims(prev => [data, ...prev]);
      setShowModal(false); setForm(EMPTY);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const inputClass = "w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all shadow-sm";

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 rounded-3xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ArchiveX className="w-8 h-8 text-rose-500" /> Claims Registry
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Track your submitted customer claims and resolutions.</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowModal(true); }}
          className="flex items-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-rose-700 shadow-sm hover:shadow-lg hover:shadow-rose-600/20 transition-all active:scale-95">
          <Plus className="w-5 h-5" /> Submit New Claim
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {UI_STATUS_LABELS.map(s => {
          // Map UI "Under Process" back to DB "Under Review" for counting purposes
          const checkStatus = s === "Under Process" ? "Under Review" : s;
          const count = claims.filter(c => c.status === checkStatus || c.status === s).length;
          const UI = STATUS_STYLE[s] || STATUS_STYLE["Under Review"];
          const Icon = UI.icon;
          
          return (
            <div key={s} className={`rounded-2xl border ${UI.border} ${UI.bg} p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-sm`}>
              <Icon className={`w-8 h-8 mb-2 opacity-40 ${UI.text}`} />
              <p className={`text-[11px] font-extrabold uppercase tracking-widest text-center ${UI.text}`}>{s}</p>
              <p className={`text-3xl font-black ${UI.text} mt-1`}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Date", "Policy No.", "Client Name", "Claim Amount", "Description", "Status"].map((h) => (
                  <th key={h} className="px-5 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-400 font-medium">Loading claims history...</td></tr>
              ) : claims.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-400 font-medium">No claims submitted yet.</td></tr>
              ) : claims.map(c => {
                // Determine display status name and styles
                const displayStatus = c.status === "Under Review" ? "Under Process" : c.status;
                const ui = STATUS_STYLE[displayStatus] || STATUS_STYLE["Under Review"];
                
                return (
                  <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 text-slate-500 font-medium whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-600 bg-slate-100 inline-block m-3 rounded px-2 py-1 border border-slate-200">{c.policyNumber}</td>
                    <td className="px-5 py-4 font-bold text-slate-800">{c.clientName}</td>
                    <td className="px-5 py-4 font-black text-rose-600 text-base">₹{c.claimAmount?.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4 text-slate-600 font-medium max-w-xs truncate" title={c.description}>{c.description}</td>
                    <td className="px-5 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${ui.bg} ${ui.text} ${ui.border}`}>
                        {displayStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Claim Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-500" /> Lodge a Claim
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center bg-slate-200 hover:bg-rose-100 hover:text-rose-600 rounded-full transition font-bold">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Select Active Policy *</label>
                <select required value={form.policyNumber} onChange={handlePolicySelect} className={`${inputClass} cursor-pointer`}>
                  <option value="">-- Choose a customer policy --</option>
                  {policies.map(p => (
                    <option key={p._id} value={p.policyNumber}>{p.policyNumber} — {p.clientName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Client Name *</label>
                <input required value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} className={inputClass} readOnly={!!form.policyNumber} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Claim Request Amount (₹) *</label>
                <input type="number" required min="1" value={form.claimAmount} onChange={e => setForm({...form, claimAmount: e.target.value})} className={inputClass} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Detailed Reason / Incident *</label>
                <textarea required rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={`${inputClass} resize-none`} placeholder="Describe the reason for this claim in detail..." />
              </div>
              
              <div className="pt-4 flex gap-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-[2] bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-700 transition shadow-sm disabled:opacity-50 active:scale-95 text-sm">
                  {saving ? "Lodging Claim..." : "Submit Claim to Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}