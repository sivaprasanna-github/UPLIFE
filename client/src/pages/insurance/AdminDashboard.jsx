import React, { useEffect, useState } from "react";
import { 
  Users, UserCircle, FileText, AlertTriangle, TrendingUp, 
  ShieldCheck, Download, DollarSign, PieChart, Umbrella 
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

const STATUS_COLORS = {
  "Filed": "bg-blue-100 text-blue-700",
  "Under Review": "bg-amber-100 text-amber-700",
  "Approved": "bg-emerald-100 text-emerald-700",
  "Paid": "bg-purple-100 text-purple-700",
  "Rejected": "bg-red-100 text-red-700",
  "Active": "bg-green-100 text-green-700",
  "Inactive": "bg-gray-100 text-gray-500",
  "Pending": "bg-amber-100 text-amber-700",
};

export default function AdminDashboard() {
  const [stats, setStats]             = useState(null);
  const [claims, setClaims]           = useState([]);
  const [agents, setAgents]           = useState([]);
  const [policies, setPolicies]       = useState([]);
  const [commissions, setCommissions] = useState([]);
  
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("claims");

  const token = sessionStorage.getItem("token");
  const headers = { 
    "Content-Type": "application/json", 
    Authorization: `Bearer ${token}` 
  };

  // ── FETCH EVERYTHING FROM BACKEND ──────────────────────────────────────────
  const fetchDashboardData = async () => {
    try {
      // ✅ FIX: Added "/admin" to all the fetch URLs to match your server.js routes
      const [statsRes, claimsRes, agentsRes, policiesRes, commissionsRes] = await Promise.all([
        fetch(`${API_URL}/insurance/admin/stats`, { headers }),
        fetch(`${API_URL}/insurance/admin/all-claims?status=all`, { headers }),
        fetch(`${API_URL}/insurance/admin/agents`, { headers }),
        fetch(`${API_URL}/insurance/admin/all-policies?status=all`, { headers }),
        fetch(`${API_URL}/insurance/admin/all-commissions`, { headers })
      ]);

      // Using .text() first to catch any remaining HTML errors gracefully
      const parseJson = async (res) => {
        const text = await res.text();
        try { return JSON.parse(text); } 
        catch { throw new Error(`Server returned HTML instead of JSON: ${text.substring(0, 50)}...`); }
      };

      const [sData, cData, aData, pData, comData] = await Promise.all([
        parseJson(statsRes), parseJson(claimsRes), parseJson(agentsRes), parseJson(policiesRes), parseJson(commissionsRes)
      ]);

      setStats(sData);
      setClaims(Array.isArray(cData) ? cData : []);
      setAgents(Array.isArray(aData) ? aData : []);
      setPolicies(Array.isArray(pData) ? pData : []);
      setCommissions(Array.isArray(comData) ? comData : []);
      
    } catch (error) {
      console.error("Dashboard Load Error:", error);
      toast.error("Failed to connect to insurance server. Check console.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ── ACTIONS ────────────────────────────────────────────────────────────────
  const handleUpdateClaim = async (id, newStatus) => {
    try {
      // ✅ FIX: Added "/admin"
      const res = await fetch(`${API_URL}/insurance/admin/claim/${id}/status`, {
        method: "PATCH", headers,
        body: JSON.stringify({ status: newStatus, adminRemarks: "Status updated by administrator" })
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(`Claim marked as ${newStatus}`);
      setClaims(prev => prev.map(c => c._id === id ? { ...c, status: newStatus } : c));
      
      // ✅ FIX: Added "/admin"
      fetch(`${API_URL}/insurance/admin/stats`, { headers }).then(r=>r.json()).then(setStats);
    } catch (err) { toast.error(err.message); }
  };

  const handlePayCommission = async (id) => {
    if (!window.confirm("Mark this commission as Paid?")) return;
    try {
      // ✅ FIX: Added "/admin"
      const res = await fetch(`${API_URL}/insurance/admin/commission/${id}/pay`, { method: "PATCH", headers });
      if (!res.ok) throw new Error("Payment failed");
      toast.success("Commission Paid");
      setCommissions(prev => prev.map(c => c._id === id ? { ...c, status: "Paid" } : c));
    } catch (err) { toast.error(err.message); }
  };

  // ── CSV EXPORT (Dynamic based on Tab) ──────────────────────────────────────
  const downloadCSV = () => {
    let rows = [];
    let filename = "";

    if (activeTab === "claims") {
      if (claims.length === 0) return toast.error("No claims to export");
      rows = [["Policy Number", "Client Name", "Claim Amount", "Agent", "Status", "Date Filed"],
        ...claims.map(c => [c.policyNumber, c.clientName, c.claimAmount, c.agent?.name || "System", c.status, new Date(c.createdAt).toLocaleDateString()])];
      filename = "Claims_Report";
    } 
    else if (activeTab === "policies") {
      if (policies.length === 0) return toast.error("No policies to export");
      rows = [["Policy Number", "Client Name", "Type", "Premium", "Status", "Date Created"],
        ...policies.map(p => [p.policyNumber, p.clientName, p.insuranceType, p.premiumAmount, p.status, new Date(p.createdAt).toLocaleDateString()])];
      filename = "Policies_Report";
    }
    else if (activeTab === "agents") {
      if (agents.length === 0) return toast.error("No agents to export");
      rows = [["Agent Name", "Email", "Total Policies", "Total Claims", "Registration Date"],
        ...agents.map(a => [a.name, a.email, a.policyCount || 0, a.claimCount || 0, new Date(a.createdAt).toLocaleDateString()])];
      filename = "Agents_Report";
    }
    else if (activeTab === "commissions") {
      if (commissions.length === 0) return toast.error("No commissions to export");
      rows = [["Agent Name", "Policy Number", "Client", "Commission Amt", "Status", "Date"],
        ...commissions.map(c => [c.agent?.name || "Unknown", c.policyNumber, c.clientName, c.commissionAmount, c.status, new Date(c.createdAt).toLocaleDateString()])];
      filename = "Commissions_Report";
    }

    const csvContent = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 font-medium">Fetching entire database...</p>
    </div>
  );

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Insurance Headquarters</h2>
          <p className="text-gray-500 text-sm mt-1">Real-time oversight of your entire insurance platform</p>
        </div>
        <button onClick={downloadCSV}
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95">
          <Download className="w-4 h-4" /> Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} CSV
        </button>
      </div>

      {/* ── STATS GRID (Pulled directly from API) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Agents" value={stats?.totalAgents} icon={UserCircle} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Total Policies" value={stats?.totalPolicies} icon={Umbrella} color="text-purple-600" bg="bg-purple-50" />
        <StatCard title="Pending Claims" value={stats?.pendingClaims} icon={AlertTriangle} color="text-amber-600" bg="bg-amber-50" />
        
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <DollarSign className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10" />
          <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest">Total Active Premium</p>
          <p className="text-3xl font-black mt-2">₹{stats?.totalPremium?.toLocaleString("en-IN") || 0}</p>
          <div className="flex items-center gap-1 mt-2 text-emerald-200 text-xs">
            <TrendingUp className="w-3 h-3" />
            <span>Across {stats?.activePolicies || 0} active policies</span>
          </div>
        </div>
      </div>

      {/* ── MAIN DATA TABS ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="flex border-b overflow-x-auto no-scrollbar bg-gray-50/50">
          <TabButton active={activeTab === "claims"} onClick={() => setActiveTab("claims")} label="Claims" icon={FileText} count={claims.length} />
          <TabButton active={activeTab === "policies"} onClick={() => setActiveTab("policies")} label="Policies" icon={ShieldCheck} count={policies.length} />
          <TabButton active={activeTab === "commissions"} onClick={() => setActiveTab("commissions")} label="Commissions" icon={DollarSign} count={commissions.length} />
          <TabButton active={activeTab === "agents"} onClick={() => setActiveTab("agents")} label="Agents" icon={Users} count={agents.length} />
        </div>

        <div className="p-0 overflow-x-auto">
          {/* TAB: CLAIMS */}
          {activeTab === "claims" && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left">Claim Info</th>
                  <th className="px-6 py-4 text-left">Policy & Agent</th>
                  <th className="px-6 py-4 text-left">Amount</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {claims.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">No claims found</td></tr> : 
                  claims.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{c.clientName}</div>
                      <div className="text-[11px] text-gray-400 line-clamp-1 max-w-[200px]">{c.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-mono font-bold text-indigo-600">{c.policyNumber}</div>
                      <div className="text-[11px] text-gray-500">Agent: {c.agent?.name || "System"}</div>
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900">₹{c.claimAmount?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <select value={c.status} onChange={(e) => handleUpdateClaim(c._id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border-0 cursor-pointer shadow-sm ${STATUS_COLORS[c.status] || "bg-gray-100 text-gray-600"}`}>
                        {["Filed", "Under Review", "Approved", "Paid", "Rejected"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB: POLICIES */}
          {activeTab === "policies" && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left">Policy No</th>
                  <th className="px-6 py-4 text-left">Client & Agent</th>
                  <th className="px-6 py-4 text-left">Type</th>
                  <th className="px-6 py-4 text-left">Premium / Sum</th>
                  <th className="px-6 py-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {policies.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">No policies found</td></tr> : 
                  policies.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600 text-xs">{p.policyNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{p.clientName}</div>
                      <div className="text-[11px] text-gray-500">Agent: {p.agent?.name || "System"}</div>
                    </td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-semibold">{p.insuranceType}</span></td>
                    <td className="px-6 py-4">
                      <div className="font-black text-gray-800">₹{p.premiumAmount?.toLocaleString()}</div>
                      <div className="text-[11px] text-gray-400">Cover: ₹{p.sumAssured?.toLocaleString() || "0"}</div>
                    </td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${STATUS_COLORS[p.status] || "bg-gray-100"}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB: COMMISSIONS */}
          {activeTab === "commissions" && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left">Agent</th>
                  <th className="px-6 py-4 text-left">Policy & Client</th>
                  <th className="px-6 py-4 text-left">Commission Rate</th>
                  <th className="px-6 py-4 text-left">Payout Amount</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {commissions.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">No commissions recorded</td></tr> : 
                  commissions.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-bold text-gray-800">{c.agent?.name || "Unknown"}</td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-mono font-bold text-indigo-600">{c.policyNumber}</div>
                      <div className="text-[11px] text-gray-500">{c.clientName} ({c.insuranceType})</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-600">{c.commissionRate}%</td>
                    <td className="px-6 py-4 font-black text-emerald-600 text-base">₹{c.commissionAmount?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      {c.status === "Pending" ? (
                        <button onClick={() => handlePayCommission(c._id)}
                          className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                          Mark Paid
                        </button>
                      ) : (
                        <span className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg text-xs font-bold">Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB: AGENTS */}
          {activeTab === "agents" && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left">Agent Identity</th>
                  <th className="px-6 py-4 text-left">Contact Info</th>
                  <th className="px-6 py-4 text-center">Total Policies</th>
                  <th className="px-6 py-4 text-center">Total Claims</th>
                  <th className="px-6 py-4 text-right">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {agents.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">No agents found</td></tr> : 
                  agents.map(a => (
                  <tr key={a._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
                          {a.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{a.name}</div>
                          <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">Certified Agent</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{a.email}</td>
                    <td className="px-6 py-4 text-center"><span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-black text-xs">{a.policyCount || 0}</span></td>
                    <td className="px-6 py-4 text-center"><span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-black text-xs">{a.claimCount || 0}</span></td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SUBCOMPONENTS ──
function StatCard({ title, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`${bg} p-2.5 rounded-xl`}><Icon className={`w-5 h-5 ${color}`} /></div>
        <PieChart className="w-4 h-4 text-gray-200" />
      </div>
      <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">{title}</p>
      <p className="text-3xl font-black text-gray-800 mt-1">{value?.toLocaleString() || 0}</p>
    </div>
  );
}

function TabButton({ active, onClick, label, icon: Icon, count }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative shrink-0 ${
        active ? "text-emerald-600 bg-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
      }`}>
      <Icon className="w-4 h-4" /> {label}
      <span className={`text-[10px] px-2 py-0.5 rounded-md ${active ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
        {count}
      </span>
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />}
    </button>
  );
}