import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

const STATUS_STYLES = {
  Filed:         "bg-blue-100 text-blue-700",
  "Under Review":"bg-amber-100 text-amber-700",
  Approved:      "bg-green-100 text-green-700",
  Paid:          "bg-purple-100 text-purple-700",
  Rejected:      "bg-red-100 text-red-700",
};

export default function Claims() {
  const [claims, setClaims]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [selected, setSelected] = useState(null); // For detail modal
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
        method: "PATCH", headers,
        body: JSON.stringify({ status, adminRemarks: remark })
      });
      toast.success("Status updated");
      setClaims(prev => prev.map(c => c._id === id ? { ...c, status } : c));
      setSelected(null); setRemark("");
    } catch { toast.error("Failed to update"); }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">Claims Management</h2>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <form onSubmit={e => { e.preventDefault(); fetchClaims(); }} className="flex gap-2 flex-1 min-w-48">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by policy no. or client name..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
          <button type="submit" className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Search className="w-4 h-4" />
          </button>
        </form>
        <div className="flex gap-2 flex-wrap">
          {["all", "Filed", "Under Review", "Approved", "Paid", "Rejected"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
                filter === s ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {["Filed","Under Review","Approved","Paid","Rejected"].map(s => {
          const count = claims.filter(c => c.status === s).length;
          return (
            <div key={s} className={`rounded-xl p-3 text-center ${STATUS_STYLES[s]}`}>
              <p className="text-xs font-medium">{s}</p>
              <p className="text-xl font-bold">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Policy No.</th>
                <th className="px-4 py-3 font-medium">Client Name</th>
                <th className="px-4 py-3 font-medium">Claim Amount</th>
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : claims.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No claims found</td></tr>
              ) : claims.map(c => (
                <tr key={c._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.policyNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.clientName}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">₹{c.claimAmount?.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-gray-600">{c.agent?.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-40 truncate" title={c.description}>{c.description}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[c.status] || "bg-gray-100 text-gray-700"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => { setSelected(c); setRemark(c.adminRemarks || ""); }}
                      className="px-3 py-1 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition">
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && claims.length > 0 && (
          <div className="px-4 py-3 border-t text-xs text-gray-400 flex justify-between">
            <span>{claims.length} claims</span>
            <span className="font-semibold text-gray-600">
              Total: ₹{claims.reduce((s, c) => s + (c.claimAmount || 0), 0).toLocaleString("en-IN")}
            </span>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-lg text-gray-800">Review Claim</h3>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Policy No.</span><span className="font-mono font-medium">{selected.policyNumber}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Client</span><span className="font-medium">{selected.clientName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold text-gray-800">₹{selected.claimAmount?.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Filed by</span><span>{selected.agent?.name}</span></div>
                <div><span className="text-gray-500">Description:</span><p className="mt-1 text-gray-700">{selected.description}</p></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Admin Remarks</label>
                <textarea rows={2} value={remark} onChange={e => setRemark(e.target.value)}
                  placeholder="Add remarks (optional)..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["Under Review","Approved","Rejected"].map(s => (
                  <button key={s} onClick={() => updateStatus(selected._id, s)}
                    className={`py-2 rounded-lg text-xs font-semibold transition ${
                      s === "Approved" ? "bg-green-600 text-white hover:bg-green-700" :
                      s === "Rejected" ? "bg-red-600 text-white hover:bg-red-700" :
                      "bg-amber-500 text-white hover:bg-amber-600"}`}>
                    {s}
                  </button>
                ))}
              </div>
              <button onClick={() => updateStatus(selected._id, "Paid")}
                className="w-full py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition">
                Mark as Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}