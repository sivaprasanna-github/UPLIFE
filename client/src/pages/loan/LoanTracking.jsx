import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  TrendingUp, Plus, X, ChevronDown, ChevronUp,
  CheckCircle, Clock, AlertTriangle, Search,
  DollarSign, CreditCard, BarChart2, Calendar, Percent, RefreshCw, Trash2
} from "lucide-react";

// Fix Double /api/api issue safely
const RAW_API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = RAW_API.endsWith('/api') ? RAW_API.slice(0, -4) : RAW_API;

const LOAN_TYPES = [
  'Personal Loan', 'Business Loan',
  'Home Loan - Construction Flat', 'Home Loan - Independent House',
  'Home Loan - Plot Purchase', 'Home Loan - Plot + Construction',
  'Mortgage Loan - Residential', 'Mortgage Loan - Commercial', 'Mortgage Loan - Open Plot',
  'Education Loan', 'Used Car Loan', 'New Car Loan', 'Car Refinance'
];

const STATUS_COLORS = {
  Active:       'bg-emerald-100 text-emerald-700 border-emerald-200',
  Closed:       'bg-slate-100 text-slate-600 border-slate-200',
  NPA:          'bg-red-100 text-red-700 border-red-200',
  Restructured: 'bg-amber-100 text-amber-700 border-amber-200',
};

const EMI_STATUS_COLORS = {
  Paid:    'bg-emerald-100 text-emerald-700',
  Pending: 'bg-blue-100 text-blue-700',
  Overdue: 'bg-red-100 text-red-700',
};

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className={`rounded-2xl p-5 border ${color} flex items-start gap-4`}>
      <div className="p-3 rounded-xl bg-white/60 shadow-sm">
        <Icon size={22} className="opacity-80" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest opacity-60 mb-0.5">{label}</p>
        <p className="text-2xl font-black">{value}</p>
        {sub && <p className="text-xs opacity-50 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Create Modal ────────────────────────────────────────────────────────────
function CreateModal({ loanUsers, onClose, onCreated }) {
  const [form, setForm] = useState({
    loanUser: '', loanType: 'Personal Loan',
    totalAmount: '', interestRate: '', tenureMonths: '',
    emiAmount: '', disbursementDate: new Date().toISOString().slice(0, 10),
    remarks: ''
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const P = parseFloat(form.totalAmount);
    const r = parseFloat(form.interestRate) / 100 / 12;
    const n = parseInt(form.tenureMonths);
    if (P > 0 && n > 0) {
      if (r > 0) {
        const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        set('emiAmount', Math.round(emi));
      } else {
        set('emiAmount', Math.round(P / n));
      }
    }
  }, [form.totalAmount, form.interestRate, form.tenureMonths]);

  const submit = async () => {
    if (!form.loanUser) return toast.error('Select a loan user');
    if (!form.totalAmount || !form.tenureMonths || !form.emiAmount)
      return toast.error('Fill all required fields');

    setLoading(true);
    try {
      // 🔥 CHANGED TO sessionStorage
      const token = sessionStorage.getItem('token');
      await axios.post(`${API_URL}/api/loan/tracking`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Loan tracking created!');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl">
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <TrendingUp size={22} className="text-indigo-500" /> New Loan Tracking
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Loan User *</label>
            <select value={form.loanUser} onChange={e => set('loanUser', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">— Select User —</option>
              {loanUsers.map(u => (
                <option key={u._id} value={u._id}>{u.fullName} • {u.phone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Loan Type *</label>
            <select value={form.loanType} onChange={e => set('loanType', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {LOAN_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Total Amount (₹) *</label>
              <input type="number" min="0" value={form.totalAmount} onChange={e => set('totalAmount', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Interest Rate (% p.a.)</label>
              <input type="number" min="0" step="0.1" value={form.interestRate} onChange={e => set('interestRate', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tenure (Months) *</label>
              <input type="number" min="1" value={form.tenureMonths} onChange={e => set('tenureMonths', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">EMI Amount (₹) *</label>
              <input type="number" min="0" value={form.emiAmount} onChange={e => set('emiAmount', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-indigo-50 text-sm font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Disbursement Date</label>
            <input type="date" value={form.disbursementDate} onChange={e => set('disbursementDate', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Remarks</label>
            <textarea rows={2} value={form.remarks} onChange={e => set('remarks', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition">Cancel</button>
          <button onClick={submit} disabled={loading} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />} Create Tracking
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EMI Table Row ───────────────────────────────────────────────────────────
function EmiRow({ emi, trackingId, onPaid }) {
  const [paying, setPaying] = useState(false);

  const markPaid = async () => {
    setPaying(true);
    try {
      // 🔥 CHANGED TO sessionStorage
      const token = sessionStorage.getItem('token');
      await axios.patch(`${API_URL}/api/loan/tracking/${trackingId}/emi/${emi._id}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`EMI #${emi.emiNumber} marked as paid`);
      onPaid();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition">
      <td className="px-4 py-3 text-sm font-bold text-slate-600">#{emi.emiNumber}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{fmtDate(emi.dueDate)}</td>
      <td className="px-4 py-3 text-sm font-semibold text-slate-800">{fmt(emi.amount)}</td>
      <td className="px-4 py-3">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${EMI_STATUS_COLORS[emi.status]}`}>
          {emi.status === 'Overdue' && <AlertTriangle size={10} className="inline mr-1" />}
          {emi.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">{fmtDate(emi.paidDate)}</td>
      <td className="px-4 py-3">
        {emi.status !== 'Paid' && (
          <button onClick={markPaid} disabled={paying} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-1">
            {paying ? <RefreshCw size={10} className="animate-spin" /> : <CheckCircle size={10} />} Pay
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Tracking Card ───────────────────────────────────────────────────────────
function TrackingCard({ record, onRefresh, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const paidCount   = record.emiSchedule?.filter(e => e.status === 'Paid').length || 0;
  const totalCount  = record.emiSchedule?.length || 0;
  const progress    = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-extrabold text-slate-800 text-base truncate">{record.loanUser?.fullName || '—'}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLORS[record.trackingStatus]}`}>{record.trackingStatus}</span>
            </div>
            <p className="text-xs text-slate-400 font-semibold">{record.loanUser?.phone} • {record.loanType}</p>
          </div>
          <button onClick={() => onDelete(record._id)} className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition shrink-0"><Trash2 size={15} /></button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total</p>
            <p className="text-sm font-extrabold text-slate-800">{fmt(record.totalAmount)}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
            <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider mb-0.5">Paid</p>
            <p className="text-sm font-extrabold text-emerald-700">{fmt(record.paidAmount)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
            <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-0.5">Due</p>
            <p className="text-sm font-extrabold text-red-600">{fmt(record.dueAmount)}</p>
          </div>
          <div className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-0.5">EMI</p>
            <p className="text-sm font-extrabold text-indigo-700">{fmt(record.emiAmount)}</p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-500 font-semibold mb-1.5">
            <span>{paidCount} of {totalCount} EMIs paid</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
          <span className="flex items-center gap-1"><Calendar size={12} /> Disbursed {fmtDate(record.disbursementDate)}</span>
          {record.nextDueDate && <span className="flex items-center gap-1 text-amber-500 font-semibold"><Clock size={12} /> Next due {fmtDate(record.nextDueDate)}</span>}
          <span className="flex items-center gap-1"><Percent size={12} /> {record.interestRate}% p.a. • {record.tenureMonths}m</span>
        </div>
      </div>

      <div className="border-t border-slate-100">
        <button onClick={() => setExpanded(e => !e)} className="w-full flex items-center justify-between px-5 py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 transition">
          <span>EMI Schedule ({totalCount} entries)</span>
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {expanded && (
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full text-left min-w-[500px]">
              <thead className="bg-slate-50">
                <tr>
                  {['EMI #', 'Due Date', 'Amount', 'Status', 'Paid On', 'Action'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {record.emiSchedule?.map(emi => (
                  <EmiRow key={emi._id} emi={emi} trackingId={record._id} onPaid={onRefresh} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function LoanTracking() {
  const [records, setRecords]     = useState([]);
  const [loanUsers, setLoanUsers] = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // 🔥 Grab token INSIDE the function so it's never stale!
      const token = sessionStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [tRes, uRes, sRes] = await Promise.all([
        axios.get(`${API_URL}/api/loan/tracking`, { headers }),
        axios.get(`${API_URL}/api/loan/users`, { headers }),
        axios.get(`${API_URL}/api/loan/tracking/stats/summary`, { headers }).catch(() => ({ data: null }))
      ]);
      setRecords(tRes.data.data || []);
      setLoanUsers(uRes.data || []);
      if (sRes.data?.data) setStats(sRes.data.data);
    } catch (err) {
      toast.error('Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tracking record?')) return;
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${API_URL}/api/loan/tracking/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deleted');
      fetchAll();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filtered = records.filter(r => {
    const matchSearch = !search ||
      r.loanUser?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.loanUser?.phone?.includes(search) ||
      r.loanType?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.trackingStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex-1 min-h-screen bg-slate-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <TrendingUp size={30} className="text-indigo-500" />
              Loan Tracking
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">
              Monitor EMI payments, due amounts & loan repayment progress
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
            <Plus size={18} /> New Tracking
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Disbursed" value={fmt(stats.totalDisbursed)} icon={DollarSign} color="bg-indigo-50 border-indigo-200 text-indigo-800" sub={`${stats.total} loans`} />
            <StatCard label="Total Collected" value={fmt(stats.totalPaid)} icon={CheckCircle} color="bg-emerald-50 border-emerald-200 text-emerald-800" sub={`${stats.active} active`} />
            <StatCard label="Outstanding Due" value={fmt(stats.totalDue)} icon={CreditCard} color="bg-red-50 border-red-200 text-red-800" sub={`${stats.npa} NPA`} />
            <StatCard label="Loans Closed" value={stats.closed} icon={BarChart2} color="bg-slate-100 border-slate-200 text-slate-800" sub="fully repaid" />
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, loan type..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm">
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
            <option value="NPA">NPA</option>
            <option value="Restructured">Restructured</option>
          </select>
          <button onClick={fetchAll} className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition shadow-sm">
            <RefreshCw size={16} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={32} className="text-indigo-400 animate-spin" />
              <p className="text-slate-400 font-semibold">Loading loan tracking data...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center">
              <TrendingUp size={28} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="font-extrabold text-slate-600 text-lg">No tracking records found</p>
              <p className="text-slate-400 text-sm mt-1">{search ? 'Try a different search term' : 'Create your first loan tracking entry'}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5">
            {filtered.map(record => (
              <TrackingCard key={record._id} record={record} onRefresh={fetchAll} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {showCreate && <CreateModal loanUsers={loanUsers} onClose={() => setShowCreate(false)} onCreated={fetchAll} />}
      </div>
    </div>
  );
}