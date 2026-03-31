import React, { useEffect, useState } from "react";
import { Plus, X, FileText } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;
const EMPTY = { policyNumber: "", clientName: "", claimAmount: "", description: "" };

const STATUS_STYLE = {
  Filed:        "bg-blue-100 text-blue-700",
  "Under Review":"bg-amber-100 text-amber-700",
  Approved:     "bg-green-100 text-green-700",
  Paid:         "bg-purple-100 text-purple-700",
  Rejected:     "bg-red-100 text-red-700",
};

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
    }).catch(() => toast.error("Failed to load"))
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Claims</h2>
        <button onClick={() => { setForm(EMPTY); setShowModal(true); }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition">
          <Plus className="w-4 h-4" /> Submit Claim
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {["Filed","Under Review","Approved","Paid","Rejected"].map(s => {
          const count = claims.filter(c => c.status === s).length;
          return (
            <div key={s} className={`rounded-xl p-3 text-center ${STATUS_STYLE[s]}`}>
              <p className="text-xs font-medium">{s}</p>
              <p className="text-xl font-bold">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Policy No.</th>
                <th className="px-4 py-3 font-medium">Client Name</th>
                <th className="px-4 py-3 font-medium">Claim Amount</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : claims.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No claims submitted yet</td></tr>
              ) : claims.map(c => (
                <tr key={c._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.policyNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.clientName}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">₹{c.claimAmount?.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-40 truncate" title={c.description}>{c.description}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[c.status] || "bg-gray-100 text-gray-700"}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Claim Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-lg text-gray-800">Submit New Claim</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Policy *</label>
                <select required value={form.policyNumber} onChange={handlePolicySelect}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                  <option value="">-- Select Active Policy --</option>
                  {policies.map(p => (
                    <option key={p._id} value={p.policyNumber}>{p.policyNumber} — {p.clientName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Client Name *</label>
                <input required value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Claim Amount (₹) *</label>
                <input type="number" required min="1" value={form.claimAmount} onChange={e => setForm({...form, claimAmount: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Reason / Description *</label>
                <textarea required rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50">
                {saving ? "Submitting..." : "Submit Claim"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}