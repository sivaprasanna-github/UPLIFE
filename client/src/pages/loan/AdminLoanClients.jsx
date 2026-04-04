import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Users, Search, CheckCircle, XCircle, Clock,
  TrendingUp, Eye, RefreshCw
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
  pending:  { label: "Pending",  color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <Clock className="w-3.5 h-3.5" /> },
  approved: { label: "Approved", color: "bg-green-100 text-green-700 border-green-200",  icon: <CheckCircle className="w-3.5 h-3.5" /> },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200",     icon: <XCircle className="w-3.5 h-3.5" /> }
};

const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function AdminLoanClients() {
  const [clients, setClients]   = useState([]);
  const [stats, setStats]       = useState({});
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState("all");
  const [loanType, setLoanType] = useState("all");
  const [selected, setSelected] = useState(null); 
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
    <div className={`rounded-xl p-5 border ${color} shadow-sm transition-transform hover:-translate-y-1`}>
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Loan Applications</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and track all employee-submitted loan applications</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition shadow-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Applications" value={stats.total ?? 0} color="border-gray-200 bg-white" />
        <StatCard label="Under Processing"   value={stats.underProcessing ?? 0}  color="border-yellow-200 bg-yellow-50" />
        <StatCard label="Approved"  value={stats.approved ?? 0} color="border-green-200 bg-green-50" />
        <StatCard label="Rejected"  value={stats.rejected ?? 0} color="border-red-200 bg-red-50" />
        <StatCard label="Approved Amount" value={fmt(stats.approvedAmount ?? 0)} color="border-blue-200 bg-blue-50" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer transition">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={loanType} onChange={e => setLoanType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-56 bg-white cursor-pointer transition">
            {LOAN_TYPES.map(t => <option key={t} value={t}>{t === "all" ? "All Loan Types" : t}</option>)}
          </select>
          <button type="submit"
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">All Loan Clients ({clients.length})</h3>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 font-medium">Loading applications...</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No clients found matching your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["S.No", "Date", "Client Name", "Contact Info", "Loan Type", "Amount", "Lead", "Employee", "Status", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((c, index) => {
                  const s = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={c._id} className="hover:bg-blue-50/30 transition duration-150">
                      <td className="px-5 py-4 text-gray-500 font-medium">{index + 1}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-600 font-medium">
                        {new Date(c.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-gray-800">{c.fullName}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-700 font-medium">{c.phone}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{c.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs border border-blue-200 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-semibold whitespace-nowrap">
                          {c.loanType}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-900">{fmt(c.loanAmount)}</td>
                      <td className="px-5 py-4 text-gray-600 text-xs font-medium">{c.leadName || "—"}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-700">{c.employee?.name || "—"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${s.color}`}>
                          {s.icon} {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelected(c)}
                            className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100 hover:text-blue-600 text-gray-600 transition" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          {c.status !== "approved" && (
                            <button onClick={() => updateStatus(c._id, "approved")}
                              disabled={updating === c._id}
                              className="p-1.5 rounded-md border border-green-200 bg-green-50 hover:bg-green-100 text-green-600 transition disabled:opacity-50" title="Approve">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {c.status !== "rejected" && (
                            <button onClick={() => updateStatus(c._id, "rejected")}
                              disabled={updating === c._id}
                              className="p-1.5 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition disabled:opacity-50" title="Reject">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Application Details</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-red-500 transition p-1 rounded-md hover:bg-red-50">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ["Full Name",    selected.fullName],
                  ["Email",        selected.email],
                  ["Phone",        selected.phone],
                  ["Loan Type",    selected.loanType],
                  ["Loan Amount",  fmt(selected.loanAmount)],
                  ["Lead Source",  selected.leadName || "—"],
                  ["Assigned To",  selected.employee?.name || "—"],
                  ["Applied On",   new Date(selected.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'long', year: 'numeric' })],
                ].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">{k}</p>
                    <p className="font-semibold text-gray-800">{v}</p>
                  </div>
                ))}
              </div>
              {selected.remarks && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm">
                  <p className="text-xs text-blue-500 font-bold uppercase tracking-wide mb-1">Remarks</p>
                  <p className="text-gray-700">{selected.remarks}</p>
                </div>
              )}
              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button onClick={() => { updateStatus(selected._id, "approved"); setSelected(null); }}
                  disabled={selected.status === "approved"}
                  className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-sm disabled:opacity-40">
                  Approve Application
                </button>
                <button onClick={() => { updateStatus(selected._id, "pending"); setSelected(null); }}
                  disabled={selected.status === "pending"}
                  className="flex-1 py-2.5 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition shadow-sm disabled:opacity-40">
                  Set Pending
                </button>
                <button onClick={() => { updateStatus(selected._id, "rejected"); setSelected(null); }}
                  disabled={selected.status === "rejected"}
                  className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-sm disabled:opacity-40">
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}