import React, { useEffect, useState } from "react";
import {
  DollarSign, CheckCircle, Clock, Wallet,
  Search, RefreshCw, AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL;

function getAuthHeader() {
  const token = sessionStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminCommissions() {
  const [commissions,   setCommissions]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [isRefreshing,  setIsRefreshing]  = useState(false);
  const [search,        setSearch]        = useState("");
  const [error,         setError]         = useState(null);

  const fetchCommissions = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const headers = { "Content-Type": "application/json", ...getAuthHeader() };
      const res = await fetch(`${API}/insurance/admin/all-commissions`, { headers });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setCommissions(data);
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to load commissions: ${err.message}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchCommissions(); }, []);

  const handleRefresh = () => fetchCommissions(true);

  const handlePay = async (id) => {
    if (!window.confirm("Are you sure you want to mark this commission as Paid?")) return;
    try {
      const headers = { "Content-Type": "application/json", ...getAuthHeader() };
      const res = await fetch(`${API}/insurance/admin/commission/${id}/pay`, {
        method: "PATCH",
        headers,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to process payout");
      }

      const updated = await res.json();
      setCommissions((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: "Paid" } : c))
      );
      toast.success("Commission marked as Paid successfully!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = commissions.filter(
    (c) =>
      c.agent?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.policyNumber?.toLowerCase().includes(search.toLowerCase()) ||
      c.clientName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = commissions
    .filter((c) => c.status === "Pending")
    .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);

  const totalPaid = commissions
    .filter((c) => c.status === "Paid")
    .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 rounded-3xl">
      {/* Header & Stats */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <DollarSign className="w-9 h-9 text-emerald-600 bg-emerald-100 p-1.5 rounded-xl" />
            Agent Payouts
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-medium max-w-lg">
            Review, track, and approve commission payouts for all your insurance agents.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          {/* Pending Card */}
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm w-full sm:w-64">
            <div className="bg-amber-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-600/80 mb-0.5">Total Pending</p>
              <p className="text-2xl font-black">₹{totalPending.toLocaleString("en-IN")}</p>
            </div>
          </div>

          {/* Paid Card */}
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm w-full sm:w-64">
            <div className="bg-emerald-100 p-3 rounded-full">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600/80 mb-0.5">Total Paid Out</p>
              <p className="text-2xl font-black">₹{totalPaid.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-semibold text-sm">{error}</p>
          <button
            onClick={() => fetchCommissions()}
            className="ml-auto text-xs font-bold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Agent Name, Client, or Policy No..."
              className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm transition-all outline-none"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm w-full sm:w-auto justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Date", "Agent Details", "Client & Policy", "Premium & Rate", "Commission", "Status", "Action"].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider ${i === 6 ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                      <p className="font-medium">Loading payout data...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
                      <p className="font-medium text-slate-500">No commissions found.</p>
                      {search && <p className="text-xs mt-1">Try adjusting your search criteria</p>}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-slate-600 font-medium">
                        {new Date(c.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </span>
                    </td>

                    {/* Agent */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{c.agent?.name || "Unknown Agent"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{c.agent?.email}</p>
                    </td>

                    {/* Client & Policy */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-700">{c.clientName || "N/A"}</p>
                      <p className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 inline-block mt-1">
                        {c.policyNumber}
                      </p>
                    </td>

                    {/* Premium & Rate */}
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-600">
                        ₹{c.premiumAmount?.toLocaleString("en-IN") || 0}
                      </p>
                      <p className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-1">
                        {c.insuranceType} • {c.commissionRate}%
                      </p>
                    </td>

                    {/* Commission Amount */}
                    <td className="px-6 py-4">
                      <span className="font-black text-emerald-600 text-base bg-emerald-50/50 px-3 py-1.5 rounded-lg border border-emerald-100 inline-block">
                        ₹{c.commissionAmount?.toLocaleString("en-IN")}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {c.status === "Paid" ? (
                        <span className="flex items-center gap-1.5 w-fit px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold shadow-sm">
                          <CheckCircle className="w-3.5 h-3.5" /> Paid
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 w-fit px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold shadow-sm">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right">
                      {c.status === "Pending" ? (
                        <button
                          onClick={() => handlePay(c._id)}
                          className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 hover:shadow-md transition-all active:scale-95 whitespace-nowrap"
                        >
                          Approve Payout
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs font-semibold italic pr-2">
                          Processed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-sm flex flex-col sm:flex-row justify-between items-center font-bold text-slate-600 gap-3">
            <span>Showing {filtered.length} of {commissions.length} commissions</span>
            <span className="text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
              Pending: ₹{totalPending.toLocaleString("en-IN")} · Paid: ₹{totalPaid.toLocaleString("en-IN")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}