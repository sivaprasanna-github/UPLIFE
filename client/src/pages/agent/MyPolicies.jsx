import React, { useEffect, useState } from "react";
import { Plus, Search, X, Trash2, Umbrella, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

const TYPES = ["Life", "Health", "Auto", "Property", "Travel"];
// ✅ Added "Inactive" as requested
const STATUSES = ["Active", "Inactive", "Expired", "Terminated", "Lapsed"]; 
const EMPTY = { policyNumber: "", clientName: "", clientPhone: "", clientEmail: "",
  insuranceType: "Health", premiumAmount: "", sumAssured: "", expiryDate: "", remarks: "" };

const STATUS_STYLE = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200", 
  Inactive: "bg-slate-100 text-slate-600 border-slate-200",
  Expired: "bg-rose-50 text-rose-700 border-rose-200",
  Terminated: "bg-gray-100 text-gray-700 border-gray-200", 
  Lapsed: "bg-amber-50 text-amber-700 border-amber-200"
};

export default function MyPolicies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("all");

  const token = sessionStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (search) params.set("search", search);
      const res = await fetch(`${API_URL}/agent/my-policies?${params}`, { headers });
      const data = await res.json();
      setPolicies(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load policies"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPolicies(); }, [filter]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/agent/create-policy`, {
        method: "POST", headers,
        body: JSON.stringify({ ...form, premiumAmount: Number(form.premiumAmount), sumAssured: Number(form.sumAssured) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Policy created! Commission recorded automatically.");
      setShowModal(false); setForm(EMPTY);
      fetchPolicies();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this policy permanently?")) return;
    try {
      await fetch(`${API_URL}/agent/policy/${id}`, { method: "DELETE", headers });
      toast.success("Policy deleted");
      setPolicies(prev => prev.filter(p => p._id !== id));
    } catch { toast.error("Failed to delete"); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await fetch(`${API_URL}/agent/policy/${id}/status`, {
        method: "PATCH", headers, body: JSON.stringify({ status })
      });
      setPolicies(prev => prev.map(p => p._id === id ? { ...p, status } : p));
      toast.success("Status updated successfully");
    } catch { toast.error("Update failed"); }
  };

  const inputClass = "w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all shadow-sm";

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 rounded-3xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-600" /> My Policies
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage the insurance policies you have sold.</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowModal(true); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm hover:shadow-lg hover:shadow-indigo-600/20 transition-all active:scale-95">
          <Plus className="w-5 h-5" /> Issue New Policy
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-4 items-center justify-between">
        <form onSubmit={e => { e.preventDefault(); fetchPolicies(); }} className="flex gap-2 flex-1 min-w-[280px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search Policy No. or Client Name..."
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 shadow-inner transition" />
          <button type="submit" className="px-5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm">
            Search
          </button>
        </form>
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 overflow-x-auto">
          {["all", ...STATUSES].map(s => (
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
                {["Policy No.", "Client Details", "Type", "Premium", "Expiry", "Status", "Actions"].map((h, i) => (
                  <th key={i} className={`px-5 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider ${i===6 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400 font-medium">Loading policies...</td></tr>
              ) : policies.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400 font-medium">
                  <Umbrella className="w-12 h-12 mx-auto mb-3 opacity-30"/>
                  No policies found. Click "Issue New Policy" to add one.
                </td></tr>
              ) : policies.map(p => (
                <tr key={p._id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-slate-600 text-xs bg-slate-100 inline-block m-3 rounded px-2 py-1 border border-slate-200">{p.policyNumber}</td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-800">{p.clientName}</p>
                    <p className="text-xs text-slate-400 font-medium">{p.clientPhone || "—"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200">{p.insuranceType}</span>
                  </td>
                  <td className="px-5 py-4 font-black text-indigo-700">₹{p.premiumAmount?.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4 text-slate-500 font-medium whitespace-nowrap">
                    {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <select value={p.status} onChange={e => handleStatusChange(p._id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm cursor-pointer outline-none ${STATUS_STYLE[p.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => handleDelete(p._id)} title="Delete Policy"
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-rose-500 transition shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Policy Modal (Glassmorphism) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
              <h3 className="font-extrabold text-xl text-slate-900 flex items-center gap-2"><Umbrella className="w-5 h-5 text-indigo-600"/> Issue New Policy</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center bg-slate-200 hover:bg-rose-100 hover:text-rose-600 rounded-full transition font-bold">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Policy Number *</label>
                  <input required value={form.policyNumber} onChange={e => setForm({...form, policyNumber: e.target.value})}
                    placeholder="e.g. POL-2026-001" className={`${inputClass} uppercase`} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Client Name *</label>
                  <input required value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Phone</label>
                  <input value={form.clientPhone} onChange={e => setForm({...form, clientPhone: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Email</label>
                  <input type="email" value={form.clientEmail} onChange={e => setForm({...form, clientEmail: e.target.value})} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Insurance Type *</label>
                  <select required value={form.insuranceType} onChange={e => setForm({...form, insuranceType: e.target.value})} className={inputClass}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Premium Amount (₹) *</label>
                  <input type="number" required min="1" value={form.premiumAmount} onChange={e => setForm({...form, premiumAmount: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Sum Assured (₹)</label>
                  <input type="number" min="0" value={form.sumAssured} onChange={e => setForm({...form, sumAssured: e.target.value})} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Expiry Date *</label>
                  <input type="date" required value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Remarks</label>
                  <textarea rows={2} value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} className={`${inputClass} resize-none`} placeholder="Optional internal notes..." />
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 p-3 rounded-xl font-medium mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4"/> Commission is auto-calculated based on type & premium.
                </p>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition disabled:opacity-50 active:scale-95 text-sm">
                    {saving ? "Saving Policy..." : "Create Policy"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}