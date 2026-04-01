import React, { useEffect, useState } from "react";
import { Plus, Search, X, Edit2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

const TYPES = ["Life", "Health", "Auto", "Property", "Travel"];
const STATUSES = ["Active", "Expired", "Terminated", "Lapsed"];
const EMPTY = { policyNumber: "", clientName: "", clientPhone: "", clientEmail: "",
  insuranceType: "Health", premiumAmount: "", sumAssured: "", expiryDate: "", remarks: "" };

const STATUS_STYLE = {
  Active: "bg-green-100 text-green-700", Expired: "bg-red-100 text-red-700",
  Terminated: "bg-gray-100 text-gray-700", Lapsed: "bg-amber-100 text-amber-700"
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
    if (!confirm("Delete this policy?")) return;
    try {
      await fetch(`${API_URL}/agent/policy/${id}`, { method: "DELETE", headers });
      toast.success("Policy deleted");
      setPolicies(prev => prev.filter(p => p._id !== id));
    } catch { toast.error("Failed"); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await fetch(`${API_URL}/agent/policy/${id}/status`, {
        method: "PATCH", headers, body: JSON.stringify({ status })
      });
      setPolicies(prev => prev.map(p => p._id === id ? { ...p, status } : p));
      toast.success("Status updated");
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">My Policies</h2>
        <button onClick={() => { setForm(EMPTY); setShowModal(true); }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition">
          <Plus className="w-4 h-4" /> Add Policy
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <form onSubmit={e => { e.preventDefault(); fetchPolicies(); }} className="flex gap-2 flex-1 min-w-48">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, policy no., phone..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
          <button type="submit" className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Search className="w-4 h-4" />
          </button>
        </form>
        <div className="flex gap-2">
          {["all", ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
                filter === s ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Policy No.</th>
                <th className="px-4 py-3 font-medium">Client Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Premium</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : policies.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No policies found</td></tr>
              ) : policies.map(p => (
                <tr key={p._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.policyNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.clientName}</td>
                  <td className="px-4 py-3 text-gray-600">{p.clientPhone || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{p.insuranceType}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">₹{p.premiumAmount?.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select value={p.status} onChange={e => handleStatusChange(p._id, e.target.value)}
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border-0 cursor-pointer ${STATUS_STYLE[p.status] || "bg-gray-100 text-gray-700"}`}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleDelete(p._id)}
                      className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Policy Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-lg text-gray-800">Add New Policy</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Policy Number *</label>
                  <input required value={form.policyNumber} onChange={e => setForm({...form, policyNumber: e.target.value})}
                    placeholder="e.g. POL-2026-001"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 uppercase" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Client Name *</label>
                  <input required value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone</label>
                  <input value={form.clientPhone} onChange={e => setForm({...form, clientPhone: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                  <input type="email" value={form.clientEmail} onChange={e => setForm({...form, clientEmail: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Insurance Type *</label>
                  <select required value={form.insuranceType} onChange={e => setForm({...form, insuranceType: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Premium Amount (₹) *</label>
                  <input type="number" required min="1" value={form.premiumAmount} onChange={e => setForm({...form, premiumAmount: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Sum Assured (₹)</label>
                  <input type="number" min="0" value={form.sumAssured} onChange={e => setForm({...form, sumAssured: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Expiry Date *</label>
                  <input type="date" required value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Remarks</label>
                  <textarea rows={2} value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
                </div>
              </div>
              <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                Commission will be auto-calculated based on insurance type and premium amount.
              </p>
              <button type="submit" disabled={saving}
                className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50">
                {saving ? "Saving..." : "Create Policy"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}