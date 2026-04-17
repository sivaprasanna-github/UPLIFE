import React, { useState, useEffect } from "react";
import { 
  BarChart3, TrendingUp, Download, Calendar, 
  DollarSign, ShieldAlert, Users, ArrowUpRight, Loader2
} from "lucide-react";

export default function InsuranceReports() {
  const [timeframe, setTimeframe] = useState("This Year");
  const [loading, setLoading] = useState(true);

  // Data States
  const [kpiData, setKpiData] = useState({ premium: 0, claimsAmount: 0, profitMargin: 0 });
  const [topAgents, setTopAgents] = useState([]);
  const [chartData, setChartData] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Helper: Format Currency (Indian Rupees)
  const formatCurrency = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper: Filter by Timeframe
  const isWithinTimeframe = (dateString, tf) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    
    if (tf === "This Month") {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    } else if (tf === "This Week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return date >= startOfWeek;
    } else if (tf === "Last Quarter") {
      const currentQ = Math.floor(now.getMonth() / 3);
      const targetQ = currentQ === 0 ? 3 : currentQ - 1;
      const targetYear = currentQ === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const qMonthStart = targetQ * 3;
      return date.getFullYear() === targetYear && date.getMonth() >= qMonthStart && date.getMonth() < qMonthStart + 3;
    } else if (tf === "This Year") {
      return date.getFullYear() === now.getFullYear();
    }
    return true; 
  };

  // Fetch and Process Data
  useEffect(() => {
    const fetchReportsData = async () => {
      setLoading(true);
      try {
        const userStr = localStorage.getItem("hrmsUser") || sessionStorage.getItem("hrmsUser");
        const token = userStr ? JSON.parse(userStr).token : "";

        const headers = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        };

        // Fetch data concurrently using standard fetch
        const [agentsRes, claimsRes, policiesRes] = await Promise.all([
          fetch(`${API_URL}/insurance/agents`, { headers }),
          fetch(`${API_URL}/insurance/all-claims`, { headers }),
          fetch(`${API_URL}/insurance/all-policies`, { headers })
        ]);

        if (!policiesRes.ok) throw new Error("Failed to fetch data");

        const allAgents = await agentsRes.json();
        const allClaims = await claimsRes.json();
        const allPolicies = await policiesRes.json();

        // 1. FILTER KPI DATA BY TIMEFRAME
        const filteredPolicies = allPolicies.filter(p => isWithinTimeframe(p.createdAt, timeframe));
        const filteredClaims = allClaims.filter(c => isWithinTimeframe(c.createdAt, timeframe));

        // Calculate KPIs
        const totalPremium = filteredPolicies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0);
        const approvedClaims = filteredClaims.filter(c => c.status === "Approved");
        const totalClaimsAmount = approvedClaims.reduce((sum, c) => sum + (c.claimAmount || 0), 0);
        
        let margin = 0;
        if (totalPremium > 0) {
          margin = ((totalPremium - totalClaimsAmount) / totalPremium) * 100;
        }

        setKpiData({
          premium: totalPremium,
          claimsAmount: totalClaimsAmount,
          profitMargin: margin.toFixed(1)
        });

        // 2. PROCESS TOP AGENTS
        const agentsWithStats = (Array.isArray(allAgents) ? allAgents : []).map(agent => {
          const agentPolicies = filteredPolicies.filter(p => 
            (p.agent?._id === agent._id) || (p.agent === agent._id)
          );
          const revenue = agentPolicies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0);
          return {
            id: agent._id,
            name: agent.name || "Unknown Agent",
            sales: agentPolicies.length,
            revenue: revenue,
          };
        });

        // Sort by revenue descending, take top 4
        const sortedAgents = agentsWithStats
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 4);

        // Calculate progress bar percentages based on the #1 agent
        const maxSales = sortedAgents[0]?.sales || 1;
        const topAgentsFormatted = sortedAgents.map(agent => ({
          ...agent,
          progressPercent: Math.min(100, Math.round((agent.sales / maxSales) * 100))
        }));

        setTopAgents(topAgentsFormatted);

        // 3. PROCESS CHART DATA (Last 6 Months Trend)
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlySums = {};
        const last6Months = [];
        
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          monthlySums[key] = 0;
          last6Months.push({ key, label: monthNames[d.getMonth()] });
        }

        allPolicies.forEach(p => {
          if (!p.createdAt) return;
          const pd = new Date(p.createdAt);
          const key = `${pd.getFullYear()}-${pd.getMonth()}`;
          if (monthlySums[key] !== undefined) {
            monthlySums[key] += (p.premiumAmount || 0);
          }
        });

        const maxMonthlyPremium = Math.max(...Object.values(monthlySums), 1); // Prevent div by zero
        
        const finalChartData = last6Months.map(m => {
          const val = monthlySums[m.key];
          // Set a minimum height of 5% so empty months still show a tiny bar
          const heightPct = Math.max(5, Math.round((val / maxMonthlyPremium) * 100));
          return {
            label: m.label,
            amount: formatCurrency(val),
            heightPercent: heightPct
          };
        });

        setChartData(finalChartData);

      } catch (error) {
        console.error("Failed to fetch insurance reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, [timeframe, API_URL]);

  // Download Basic CSV Report
  const handleDownloadReport = () => {
    const csvContent = [
      ["Metric", "Value"],
      ["Timeframe", timeframe],
      ["Gross Premium", kpiData.premium],
      ["Claims Paid Out", kpiData.claimsAmount],
      ["Net Profit Margin (%)", kpiData.profitMargin],
      [],
      ["Top Agents", "Policies Sold", "Revenue Generated"],
      ...topAgents.map(a => [a.name, a.sales, a.revenue])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `insurance_report_${timeframe.replace(' ', '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-slate-50 rounded-3xl">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-slate-500 font-medium animate-pulse">Analyzing Financial Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 rounded-3xl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-indigo-600" /> Analytics & Reports
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Financial performance and agent statistics overview.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm cursor-pointer outline-none"
          >
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="Last Quarter">Last Quarter</option>
            <option value="This Year">This Year</option>
          </select>
          <button 
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Top Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 p-8 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform">
            <DollarSign className="w-8 h-8 text-indigo-200" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Gross Premium</p>
          <h3 className="text-3xl font-black text-slate-800 relative z-10">{formatCurrency(kpiData.premium)}</h3>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 p-8 bg-rose-50 rounded-full group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-8 h-8 text-rose-200" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Claims Paid Out</p>
          <h3 className="text-3xl font-black text-slate-800 relative z-10">{formatCurrency(kpiData.claimsAmount)}</h3>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
          <div className={`absolute -right-4 -top-4 p-8 rounded-full group-hover:scale-110 transition-transform ${kpiData.profitMargin >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
            <TrendingUp className={`w-8 h-8 ${kpiData.profitMargin >= 0 ? 'text-emerald-200' : 'text-rose-200'}`} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Net Profit Margin</p>
          <h3 className={`text-3xl font-black relative z-10 ${kpiData.profitMargin >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
            {kpiData.profitMargin}%
          </h3>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart - Last 6 Months */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" /> Premium Revenue Trend (6 Mo)
            </h3>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-2 h-64 pt-6 border-b border-slate-100 pb-2 relative">
            {/* Chart Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pb-8 pointer-events-none">
              <div className="border-t border-slate-100 w-full"></div>
              <div className="border-t border-slate-100 w-full"></div>
              <div className="border-t border-slate-100 w-full"></div>
              <div className="border-t border-slate-100 w-full"></div>
            </div>

            {/* Dynamic Bars */}
            {chartData.map((data, i) => (
              <div key={i} className="flex flex-col items-center flex-1 z-10 group h-full justify-end">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded mb-2 shadow-lg pointer-events-none">
                  {data.amount}
                </div>
                {/* Notice inline style for dynamic height instead of Tailwind arbitrary classes */}
                <div 
                  className="w-full max-w-[3rem] bg-indigo-100 rounded-t-xl relative overflow-hidden group-hover:bg-indigo-200 transition-colors flex-shrink-0"
                  style={{ height: `${data.heightPercent}%` }}
                >
                  <div className="absolute bottom-0 w-full h-full bg-indigo-500 transform translate-y-[20%] group-hover:translate-y-0 transition-transform duration-500"></div>
                </div>
                <span className="text-xs font-bold text-slate-400 mt-3">{data.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Agents List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h3 className="font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" /> Top Performing Agents
          </h3>
          
          <div className="flex-1">
            {topAgents.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 font-medium text-sm">
                No agent sales found for this period.
              </div>
            ) : (
              <div className="space-y-6">
                {topAgents.map((agent, i) => (
                  <div key={agent.id}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200 shrink-0">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm truncate max-w-[120px]">{agent.name}</p>
                          <p className="text-[10px] font-bold text-slate-400">{agent.sales} Policies Sold</p>
                        </div>
                      </div>
                      <span className="font-black text-indigo-600 text-sm shrink-0">
                        {formatCurrency(agent.revenue)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 shadow-inner">
                      {/* Dynamic width via inline style */}
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${agent.progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}