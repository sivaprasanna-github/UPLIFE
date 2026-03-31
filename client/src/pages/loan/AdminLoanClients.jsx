import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Users, Search, Filter, CheckCircle, XCircle, Clock,
  TrendingUp, DollarSign, ChevronDown, Eye, RefreshCw
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const LOAN_TYPES = [
  "all",
  "Personal Loan", "Business Loan",
  "Home Loan - Construction Flat", "Home Loan - Independent House",
  "Home Loan - Plot Purchase", "Home Loan - Plot + Construction",
  "Mortgage Loan - Residential", "Mortgage Loan - Commercial", "Mortgage Loan - Open Plot",
  "Education Loan", "Used Car Loan", "New Car Loan", "Car Refinance"
];

const STATUS_CONFIG = {
  pending:  { label: "Pending",  color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3.5 h-3.5" /> },
  approved: { label: "Approved", color: "bg-green-100 text-green-700",  icon: <CheckCircle className="w-3.5 h-3.5" /> },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700",     icon: <XCircle className="w-3.5 h-3.5" /> }
};

const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function AdminLoanClients() {
  const [clients, setClients]   = useState([]);
  const [stats, setStats]       = useState({});
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState("all");
  const [loanType, setLoanType] = useState("all");
  const [selected, setSelected] = useState(null); // detail modal
  const [updating, setUpdating] = useState(null);

  const token   = sessionStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status   !== "all") params.set("status",   status);
      if (loanType !== "all") params.set("loanType", loanType);
      if (search)             params.set("search",   search);

      const [clientsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/admin/loan/clients?${params}`, { headers }),
        fetch(`${API_URL}/admin/loan/stats`, { headers })
      ]);
      const [clientsData, statsData] = await Promise.all([clientsRes.json(), statsRes.json()]);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setStats(statsData);
    } catch { toast.error("Failed to load clients"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [status, loanType]);

  const handleSearch = (e) => { e.preventDefault(); fetchAll(); };

  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      const res  = await fetch(`${API_URL}/admin/loan/client/${id}/status`, {
        method: "PATCH", headers, body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Status updated to ${newStatus}`);
      fetchAll();
      if (selected?._id === id) setSelected(prev => ({ ...prev, status: newStatus }));
    } catch { toast.error("Update failed"); }
    finally { setUpdating(null); }
  };

  const StatCard = ({ label, value, sub, color }) => (
    <div className={`rounded-xl p-5 border ${color}`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Loan Applications</h2>
        <button onClick={fetchAll} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Applications" value={stats.total ?? 0} color="border-gray-100 bg-white" />
        <StatCard label="Pending"   value={stats.pending ?? 0}  color="border-yellow-100 bg-yellow-50" />
        <StatCard label="Approved"  value={stats.approved ?? 0} color="border-green-100 bg-green-50" />
        <StatCard label="Approved Amount" value={fmt(stats.approvedAmount ?? 0)} color="border-blue-100 bg-blue-50" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={loanType} onChange={e => setLoanType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 max-w-56">
            {LOAN_TYPES.map(t => <option key={t} value={t}>{t === "all" ? "All Loan Types" : t}</option>)}
          </select>
          <button type="submit"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-700">All Loan Clients ({clients.length})</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">Loading…</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No clients found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Client", "Loan Type", "Amount", "Employee", "Lead", "Status", "Date", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clients.map(c => {
                  const s = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={c._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{c.fullName}</p>
                        <p className="text-xs text-gray-400">{c.phone}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {c.loanType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{fmt(c.loanAmount)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-700">{c.employee?.name}</p>
                        <p className="text-xs text-gray-400">{c.employee?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{c.leadName || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${s.color}`}>
                          {s.icon} {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(c.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelected(c)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          {c.status !== "approved" && (
                            <button onClick={() => updateStatus(c._id, "approved")}
                              disabled={updating === c._id}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition" title="Approve">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {c.status !== "rejected" && (
                            <button onClick={() => updateStatus(c._id, "rejected")}
                              disabled={updating === c._id}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition" title="Reject">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Client Details</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ["Full Name",    selected.fullName],
                  ["Email",        selected.email],
                  ["Phone",        selected.phone],
                  ["Loan Type",    selected.loanType],
                  ["Loan Amount",  fmt(selected.loanAmount)],
                  ["Lead Source",  selected.leadName || "—"],
                  ["Assigned To",  selected.employee?.name || "—"],
                  ["Applied On",   new Date(selected.createdAt).toLocaleDateString("en-IN")],
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
              <div className="flex gap-2 pt-2">
                <button onClick={() => { updateStatus(selected._id, "approved"); setSelected(null); }}
                  disabled={selected.status === "approved"}
                  className="flex-1 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-40">
                  Approve
                </button>
                <button onClick={() => { updateStatus(selected._id, "pending"); setSelected(null); }}
                  disabled={selected.status === "pending"}
                  className="flex-1 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition disabled:opacity-40">
                  Set Pending
                </button>
                <button onClick={() => { updateStatus(selected._id, "rejected"); setSelected(null); }}
                  disabled={selected.status === "rejected"}
                  className="flex-1 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition disabled:opacity-40">
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}