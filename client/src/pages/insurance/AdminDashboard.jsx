import React, { useState, useEffect } from "react";
import {
  Users, FileText, AlertTriangle, UserPlus,
  Eye, Plus, Megaphone, ArrowRight,
  Clock, ChevronRight, Activity, ShieldCheck, Database
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ================= EXACT MATCH STAT CARD ================= */
function StatCard({ title, value, icon: Icon, theme, percent, progress }) {
  const isDark = theme === 'dark';

  const styles = {
    dark: {
      card: "bg-[#2b2a6f] text-white",
      circle: "",
      title: "text-indigo-200",
      value: "text-white",
      pillBg: "bg-[#00c97b]",
      pillText: "text-white",
      vsText: "text-indigo-200",
      track: "bg-white/10",
      fill: "bg-[#00c97b]",
      iconWrapper: "bg-white/10 text-indigo-100"
    },
    green: {
      card: "bg-white",
      circle: "bg-[#ebfaeb]",
      title: "text-gray-400",
      value: "text-gray-800",
      pillBg: "bg-[#00c97b]",
      pillText: "text-white",
      vsText: "text-gray-400",
      track: "bg-gray-100",
      fill: "bg-[#00c97b]",
      iconWrapper: "bg-white border border-gray-100 text-[#00c97b]"
    },
    blue: {
      card: "bg-white",
      circle: "bg-[#f0f4ff]",
      title: "text-gray-400",
      value: "text-gray-800",
      pillBg: "bg-[#3b82f6]",
      pillText: "text-white",
      vsText: "text-gray-400",
      track: "bg-gray-100",
      fill: "bg-[#3b82f6]",
      iconWrapper: "bg-white border border-gray-100 text-[#3b82f6]"
    },
    red: {
      card: "bg-white",
      circle: "bg-[#fff0f2]",
      title: "text-gray-400",
      value: "text-gray-800",
      pillBg: "bg-[#ff6b6b]",
      pillText: "text-white",
      vsText: "text-gray-400",
      track: "bg-gray-100",
      fill: "bg-[#ff6b6b]",
      iconWrapper: "bg-white border border-gray-100 text-[#ff6b6b]"
    }
  };

  const currentTheme = styles[theme];

  return (
    <div className={`relative p-6 rounded-[20px] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] overflow-hidden ${currentTheme.card}`}>
      
      {/* Massive soft circle bleeding from the left (for light cards) */}
      {!isDark && (
        <div className={`absolute -left-16 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full ${currentTheme.circle} pointer-events-none`}></div>
      )}

      {/* Top Right Icon */}
      <div className={`absolute top-6 right-6 w-11 h-11 rounded-xl flex items-center justify-center ${currentTheme.iconWrapper}`}>
        <Icon className="w-5 h-5" strokeWidth={2.5} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <h3 className={`text-[10px] font-black uppercase tracking-wider mb-1 ${currentTheme.title}`}>{title}</h3>
          <p className={`text-4xl font-black tracking-tight ${currentTheme.value}`}>{value}</p>
        </div>

        <div className="mt-8">
          <div className="flex items-center text-[10px] font-bold mb-3">
            <span className={`px-2 py-0.5 rounded ${currentTheme.pillBg} ${currentTheme.pillText}`}>
              {percent}
            </span>
            <span className={`ml-2 font-medium ${currentTheme.vsText}`}>vs last month</span>
          </div>

          {/* Progress Bar */}
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${currentTheme.track}`}>
            <div className={`h-full rounded-full ${currentTheme.fill}`} style={{ width: progress }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= QUICK ACTIONS ================= */
function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { label: "Add Agent", desc: "Register new broker", icon: UserPlus, color: "text-indigo-500", bg: "bg-indigo-50", route: "/dashboard/insurance/create-agent" },
    { label: "Add Customer", desc: "Create client profile", icon: Users, color: "text-emerald-500", bg: "bg-emerald-50", route: "/dashboard/insurance/customers/manage" },
    { label: "All Policies", desc: "Manage issued policies", icon: ShieldCheck, color: "text-amber-500", bg: "bg-amber-50", route: "/dashboard/insurance/customers" },
    { label: "Review Claims", desc: "Process open claims", icon: AlertTriangle, color: "text-purple-500", bg: "bg-purple-50", route: "/dashboard/insurance/claims" },
  ];

  return (
    <div className="bg-white p-6 rounded-[20px] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] h-full flex flex-col">
      <div className="mb-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Quick Actions</p>
        <h4 className="font-bold text-xl text-gray-800">Operations</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
        {actions.map((action, idx) => (
          <button key={idx} onClick={() => navigate(action.route)}
            className="flex items-center p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all text-left">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${action.bg} ${action.color}`}>
              <action.icon className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <span className="block font-bold text-gray-800 text-sm">{action.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================= NOTICES ================= */
function NoticesList({ notices }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white p-6 rounded-[20px] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Communications</p>
          <h4 className="font-bold text-xl text-gray-800">System Notices</h4>
        </div>
        <button onClick={() => navigate('/dashboard/insurance/notices')} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
          View All <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      
      <div className="space-y-4 flex-1 overflow-y-auto">
        {notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300">
            <Megaphone className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm font-medium">No recent notices published.</p>
          </div>
        ) : (
          notices.map((n) => (
            <div key={n._id} className="flex items-start gap-4">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0"></div>
              <div className="flex-1 border-b border-gray-50 pb-4">
                <div className="flex justify-between items-start gap-4">
                  <p className="font-bold text-gray-800 text-sm">{n.title}</p>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    n.priority === "High" || n.priority === "Urgent" ? "bg-rose-50 text-rose-600" : "bg-gray-100 text-gray-500"
                  }`}>
                    {n.priority}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ================= CUSTOMERS TABLE ================= */
function CustomersTable({ customers }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-[20px] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] overflow-hidden mt-6">
      <div className="p-6 flex justify-between items-center bg-white border-b border-gray-50">
        <h4 className="font-bold text-xl text-gray-800">Recent Clients</h4>
        <button onClick={() => navigate('/dashboard/insurance/customers/manage')} className="text-xs font-bold text-gray-400 hover:text-gray-800 transition-colors">
          Showing {customers.length} of {customers.length}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Customer Info</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Interest / Policy</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Date Added</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  <Database className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-sm">No clients found.</p>
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {c.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{c.fullName}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700 font-bold text-sm">
                      {c.preferredInsuranceType || "None"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      c.status === 'Active' ? 'bg-[#00c97b] text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-medium text-sm">
                    {new Date(c.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => navigate('/dashboard/insurance/customers/manage')} className="p-2 rounded-lg border border-gray-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================= MAIN DASHBOARD ================= */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalAgents: 0, activePolicies: 0, pendingClaims: 0 });
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${sessionStorage.getItem('token')}` };
        const [statsRes, custStatsRes, custRes, noticeRes] = await Promise.all([
          fetch(`${API_URL}/insurance/stats`, { headers }),
          fetch(`${API_URL}/insurance/customers/stats/summary`, { headers }),
          fetch(`${API_URL}/insurance/customers`, { headers }),
          fetch(`${API_URL}/insurance/notices`, { headers })
        ]);
        setStats(await statsRes.json());
        setActiveCustomers((await custStatsRes.json()).active || 0);
        setRecentCustomers((await custRes.json()).slice(0, 5));
        setRecentNotices((await noticeRes.json()).slice(0, 4));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-gray-400 font-bold">
      <Activity className="w-5 h-5 mr-2 animate-spin text-blue-600" /> Loading Dashboard...
    </div>
  );

  // Current Date for the pill
  const dateString = new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto bg-[#f4f7fe] min-h-screen p-4 sm:p-6 lg:p-8">
      
      {/* Header matching the screenshot */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-[28px] font-bold text-[#1b2559] tracking-tight">Admin Dashboard</h2>
          <p className="text-[#a3aed1] text-sm mt-1 font-medium">Welcome back Admin, Have a nice day..!</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] text-xs font-bold text-gray-600">
          {dateString} <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
        </div>
      </div>

      {/* 4 Cards Grid exactly like screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Agents" value={stats.totalAgents || 0} icon={Users} 
          theme="dark" percent="+12%" progress="80%" 
        />
        <StatCard 
          title="Active Customers" value={activeCustomers} icon={UserPlus} 
          theme="green" percent="+5%" progress="60%" 
        />
        <StatCard 
          title="Active Policies" value={stats.activePolicies || 0} icon={ShieldCheck} 
          theme="blue" percent="+8%" progress="45%" 
        />
        <StatCard 
          title="Pending Claims" value={stats.pendingClaims || 0} icon={AlertTriangle} 
          theme="red" percent="+3%" progress="25%" 
        />
      </div>

      {/* Middle Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <QuickActions />
        <NoticesList notices={recentNotices} />
      </div>

      {/* Bottom Table */}
      <CustomersTable customers={recentCustomers} />

    </div>
  );
}