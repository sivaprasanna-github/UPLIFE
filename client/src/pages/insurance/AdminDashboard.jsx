import React, { useState, useEffect } from "react";
import {
  Users, AlertTriangle, UserPlus,
  Eye, Megaphone, ArrowRight,
  Activity, ShieldCheck, Database, Briefcase
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Safely configure the API URL (automatically appends /api if missing)
let baseURL = import.meta.env.VITE_API_URL;
if (baseURL && !baseURL.endsWith('/api')) {
  baseURL = `${baseURL}/api`;
}
const API = baseURL;

function getAuthHeader() {
  const token = sessionStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ================= STAT CARD ================= */
function StatCard({ title, value, icon: Icon, theme, percent, progress }) {
  const styles = {
    dark: { card: "bg-[#2b2a6f] text-white", title: "text-indigo-200", value: "text-white", pillBg: "bg-[#00c97b]", fill: "bg-[#00c97b]", iconWrapper: "bg-white/10 text-indigo-100" },
    green: { card: "bg-white", title: "text-gray-400", value: "text-gray-800", pillBg: "bg-[#00c97b]", fill: "bg-[#00c97b]", iconWrapper: "bg-emerald-50 text-[#00c97b]" },
    blue: { card: "bg-white", title: "text-gray-400", value: "text-gray-800", pillBg: "bg-[#3b82f6]", fill: "bg-[#3b82f6]", iconWrapper: "bg-blue-50 text-[#3b82f6]" },
    red: { card: "bg-white", title: "text-gray-400", value: "text-gray-800", pillBg: "bg-[#ff6b6b]", fill: "bg-[#ff6b6b]", iconWrapper: "bg-rose-50 text-[#ff6b6b]" },
  };
  const t = styles[theme] || styles.blue;
  
  return (
    <div className={`relative p-6 rounded-[20px] shadow-sm border border-gray-100 overflow-hidden ${t.card}`}>
      <div className={`absolute top-6 right-6 w-11 h-11 rounded-xl flex items-center justify-center ${t.iconWrapper}`}>
        <Icon className="w-5 h-5" strokeWidth={2.5} />
      </div>
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <h3 className={`text-[10px] font-black uppercase tracking-wider mb-1 ${t.title}`}>{title}</h3>
          <p className={`text-4xl font-black tracking-tight ${t.value}`}>{value}</p>
        </div>
        <div className="mt-8">
          <div className="flex items-center text-[10px] font-bold mb-3">
            <span className={`px-2 py-0.5 rounded text-white ${t.pillBg}`}>{percent}</span>
            <span className={`ml-2 font-medium ${t.vsText || "text-gray-400"}`}>vs last month</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className={`h-full ${t.fill}`} style={{ width: progress }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // State for Insurance data
  const [stats, setStats] = useState({ totalAgents: 0, activePolicies: 0, pendingClaims: 0, totalPremium: 0 });
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      if (!API) {
        setError("API URL is not defined. Please check your Netlify environment variables.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const headers = { "Content-Type": "application/json", ...getAuthHeader() };

        // EXACT PATHS based on your server.js mounting
        // app.use('/api/insurance/admin', insuranceAdminRoutes)
        // app.use('/api/insurance/customers', insuranceCustomerRoutes)
        // app.use('/api/insurance/notices', insuranceNoticeRoutes)
        
        const [statsRes, customerStatsRes, customersRes, noticesRes] = await Promise.all([
          fetch(`${API}/insurance/admin/stats`, { headers }), 
          fetch(`${API}/insurance/customers/stats/summary`, { headers }),
          fetch(`${API}/insurance/customers?status=all`, { headers }),
          fetch(`${API}/insurance/notices`, { headers }),
        ]);

        if (!statsRes.ok) throw new Error(`Failed to load insurance stats (Status: ${statsRes.status})`);
        
        const statsData = await statsRes.json();
        const csData = customerStatsRes.ok ? await customerStatsRes.json() : {};
        const allCustomers = customersRes.ok ? await customersRes.json() : [];
        const noticesData = noticesRes.ok ? await noticesRes.json() : [];

        // Set Data
        setStats({
          totalAgents: statsData.totalAgents || 0,
          activePolicies: statsData.activePolicies || 0,
          pendingClaims: statsData.pendingClaims || 0,
          totalPremium: statsData.totalPremium || 0
        });

        setActiveCustomers(csData.active || 0);
        setRecentCustomers(Array.isArray(allCustomers) ? allCustomers.slice(0, 5) : []);
        setRecentNotices(Array.isArray(noticesData) ? noticesData.slice(0, 4) : []);

      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500 font-bold">
        <Activity className="w-6 h-6 mr-3 animate-spin text-blue-600" /> Connecting to Insurance API...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-[#f8faff]">
        <div className="bg-white border border-red-100 shadow-xl rounded-2xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="font-bold text-xl text-gray-800 mb-2">Connection Error</p>
          <p className="text-sm text-gray-500 mb-6 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-5 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const dateString = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto bg-[#f8faff] min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
        <div>
          <h2 className="text-[28px] font-black text-slate-800 tracking-tight">Insurance Control Center</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Manage agents, clients, policies and claims.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-sm font-black text-blue-600">
            PREMIUMS: ₹{stats.totalPremium.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-xs font-bold text-slate-600">
            {dateString} <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Insurance Agents" value={stats.totalAgents} icon={Users} theme="dark" percent="+12%" progress="80%" />
        <StatCard title="Active Customers" value={activeCustomers} icon={UserPlus} theme="green" percent="+5%" progress="60%" />
        <StatCard title="Active Policies" value={stats.activePolicies} icon={ShieldCheck} theme="blue" percent="+8%" progress="45%" />
        <StatCard title="Pending Claims" value={stats.pendingClaims} icon={AlertTriangle} theme="red" percent="+3%" progress="25%" />
      </div>

      {/* Middle Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col">
          <div className="mb-6">
            <h4 className="font-bold text-lg text-slate-800">Quick Actions</h4>
          </div>
          <div className="space-y-3 flex-1">
            {[
              { label: "Create Agent", icon: UserPlus, path: "/dashboard/insurance/create-agent" },
              { label: "View Customers", icon: Users, path: "/dashboard/insurance/customers" },
              { label: "Policy Database", icon: ShieldCheck, path: "/dashboard/insurance/all-policies" },
              { label: "Process Claims", icon: Briefcase, path: "/dashboard/insurance/claims" }
            ].map((btn, i) => (
              <button
                key={i}
                onClick={() => navigate(btn.path)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-blue-50 hover:border-blue-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <btn.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                  <span className="font-bold text-sm text-slate-600 group-hover:text-blue-700">{btn.label}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Notices List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-lg text-slate-800">System Notices</h4>
            <button onClick={() => navigate("/dashboard/insurance/notices")} className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All
            </button>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px]">
            {recentNotices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 text-gray-300">
                <Megaphone className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">No active notices.</p>
              </div>
            ) : (
              recentNotices.map((n) => (
                <div key={n._id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-4">
                      <p className="font-bold text-slate-800 text-sm">{n.title}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        n.priority === "High" || n.priority === "Urgent" ? "bg-rose-50 text-rose-600" : "bg-gray-100 text-gray-500"
                      }`}>
                        {n.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{n.message}</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-2">
                      {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 flex justify-between items-center bg-white border-b border-gray-50">
          <h4 className="font-bold text-lg text-slate-800">Recent Insurance Clients</h4>
          <button onClick={() => navigate("/dashboard/insurance/customers")} className="text-xs font-bold text-blue-600">
            View All Clients
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/50">
                {["Client Info", "Interest", "Status", "Date Added", "Action"].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest ${i === 4 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <Database className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-sm">No clients found.</p>
                  </td>
                </tr>
              ) : (
                recentCustomers.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {c.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{c.fullName}</p>
                          <p className="text-[11px] text-slate-400">{c.phone || c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 font-medium text-sm">{c.preferredInsuranceType || "None"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        c.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                      {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate("/dashboard/insurance/customers")}
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
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
    </div>
  );
}