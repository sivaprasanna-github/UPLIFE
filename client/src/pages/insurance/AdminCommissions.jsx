import React, { useEffect, useState } from "react";
import { DollarSign, CheckCircle, Clock, Wallet, Search } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminCommissions() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`${API_URL}/insurance/all-commissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCommissions(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load commissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCommissions(); }, []);

  const handlePay = async (id) => {
    if (!confirm("Confirm commission payout to this agent?")) return;
    try {
      const token = sessionStorage.getItem("token");
      await fetch(`${API_URL}/insurance/commission/${id}/pay`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Commission marked as Paid!");
      setCommissions(prev => prev.map(c => c._id === id ? { ...c, status: "Paid" } : c));
    } catch {
      toast.error("Failed to process payout");
    }
  };

  const filtered = commissions.filter(c => 
    c.agent?.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.policyNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = commissions.filter(c => c.status === "Pending").reduce((s, c) => s + c.commissionAmount, 0);

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 rounded-3xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-emerald-600" /> Agent Payouts
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Review and approve commission payouts for your agents.</p>
        </div>
        
        <div className="bg-amber-100 border border-amber-200 text-amber-800 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-sm">
          <Wallet className="w-6 h-6 text-amber-600" />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600/80">Total Pending Payouts</p>
            <p className="text-2xl font-black">₹{totalPending.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search Agent Name or Policy No..."
              className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-slate-50 shadow-inner" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Date", "Agent Name", "Policy No.", "Product", "Commission", "Status", "Action"].map((h, i) => (
                  <th key={h} className={`px-5 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider ${i===6?'text-right':''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400">Loading payout data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400">No commissions found.</td></tr>
              ) : filtered.map(c => (
                <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 text-slate-500 font-medium whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-5 py-4 font-bold text-slate-800">{c.agent?.name || "Unknown"}</td>
                  <td className="px-5 py-4 font-mono text-xs font-bold text-slate-600 bg-slate-100 rounded px-2 py-1 inline-block mt-2 border border-slate-200">{c.policyNumber}</td>
                  <td className="px-5 py-4 text-slate-600 font-medium">{c.insuranceType}</td>
                  <td className="px-5 py-4 font-black text-emerald-600 text-base">₹{c.commissionAmount?.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4">
                    {c.status === "Paid" ? (
                      <span className="flex items-center gap-1 w-fit px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold"><CheckCircle className="w-3.5 h-3.5" /> Paid</span>
                    ) : (
                      <span className="flex items-center gap-1 w-fit px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold"><Clock className="w-3.5 h-3.5" /> Pending</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {c.status === "Pending" && (
                      <button onClick={() => handlePay(c._id)} className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition shadow-sm active:scale-95">
                        Approve Payout
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}