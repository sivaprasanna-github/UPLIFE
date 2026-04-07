import React, { useEffect, useState } from "react";
import { 
  Landmark, Users, FileText, CheckCircle, 
  XCircle, Clock, TrendingUp, Activity, CreditCard, ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

export default function LoanHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0, pending: 0, approved: 0, rejected: 0, approvedAmount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await fetch(`${API_URL}/admin/loan/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setStats(data);
      } catch {
        toast.error("Failed to sync loan statistics");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50 rounded-3xl">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-bold animate-pulse tracking-widest uppercase text-xs">Syncing Financials...</p>
      </div>
    );
  }

  // Calculate percentages for the pipeline bar
  const total = stats.total || 1; 
  const pPending = (stats.pending / total) * 100;
  const pApproved = (stats.approved / total) * 100;
  const pRejected = (stats.rejected / total) * 100;

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 rounded-3xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-8 h-8 text-blue-600" /> Loan Department
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Global financial overview and application tracking.</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard/loan/clients')}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-lg hover:shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <FileText className="w-4 h-4" /> Review Applications
        </button>
      </div>

      {/* Hero Financial Banner */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group">
        <div className="absolute -right-10 -top-10 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
          <CreditCard className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-blue-200 font-bold tracking-widest text-xs uppercase mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Total Disbursed Amount (Approved)
            </p>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">
              ₹{(stats.approvedAmount || 0).toLocaleString("en-IN")}
            </h1>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center min-w-[140px]">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Success Rate</p>
            <p className="text-3xl font-black text-white">{pApproved.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Applications", value: stats.total, icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
          { label: "Loans Approved", value: stats.approved, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
          { label: "Loans Rejected", value: stats.rejected, icon: XCircle, color: "text-rose-600", bg: "bg-rose-100" },
        ].map((c, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
                <h3 className="text-4xl font-black text-slate-800 tracking-tight">{c.value}</h3>
              </div>
              <div className={`${c.bg} p-3.5 rounded-xl group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300`}>
                <c.icon className={`w-6 h-6 ${c.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Pipeline Visualizer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h3 className="font-extrabold text-slate-800 mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" /> Application Pipeline Health
        </h3>
        
        {/* Progress Bar */}
        <div className="flex w-full h-4 rounded-full overflow-hidden shadow-inner mb-6 bg-slate-100">
          <div style={{ width: `${pApproved}%` }} className="bg-emerald-500 hover:brightness-110 transition-all cursor-pointer"></div>
          <div style={{ width: `${pPending}%` }} className="bg-amber-400 hover:brightness-110 transition-all cursor-pointer"></div>
          <div style={{ width: `${pRejected}%` }} className="bg-rose-500 hover:brightness-110 transition-all cursor-pointer"></div>
        </div>

        {/* Legend & Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Approved</p>
              <p className="font-black text-emerald-700">{stats.approved} Applications ({pApproved.toFixed(0)}%)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-100 bg-amber-50/50">
            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Under Review</p>
              <p className="font-black text-amber-700">{stats.pending} Applications ({pPending.toFixed(0)}%)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-100 bg-rose-50/50">
            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Rejected</p>
              <p className="font-black text-rose-700">{stats.rejected} Applications ({pRejected.toFixed(0)}%)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}