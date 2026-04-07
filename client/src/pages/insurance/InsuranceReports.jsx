import React, { useState } from "react";
import { 
  BarChart3, TrendingUp, Download, Calendar, 
  DollarSign, ShieldAlert, Users, ArrowUpRight, ArrowDownRight, FileText
} from "lucide-react";

export default function InsuranceReports() {
  const [timeframe, setTimeframe] = useState("This Month");

  // Mock data for the visual UI
  const topAgents = [
    { id: 1, name: "Ramesh Kumar", sales: 45, revenue: "₹4,50,000", progress: "w-[85%]" },
    { id: 2, name: "Priya Sharma", sales: 38, revenue: "₹3,80,000", progress: "w-[70%]" },
    { id: 3, name: "Abdul Rehman", sales: 30, revenue: "₹2,90,000", progress: "w-[55%]" },
    { id: 4, name: "Anita Desai", sales: 22, revenue: "₹1,85,000", progress: "w-[40%]" },
  ];

  const chartData = [
    { label: "Jan", height: "h-[40%]", amount: "₹2.1L" },
    { label: "Feb", height: "h-[60%]", amount: "₹3.4L" },
    { label: "Mar", height: "h-[45%]", amount: "₹2.8L" },
    { label: "Apr", height: "h-[80%]", amount: "₹4.5L" },
    { label: "May", height: "h-[55%]", amount: "₹3.1L" },
    { label: "Jun", height: "h-[100%]", amount: "₹5.8L" },
  ];

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
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm cursor-pointer"
          >
            <option>This Week</option>
            <option>This Month</option>
            <option>Last Quarter</option>
            <option>This Year</option>
          </select>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm active:scale-95">
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
          <h3 className="text-3xl font-black text-slate-800 relative z-10">₹18,45,000</h3>
          <p className="text-xs font-bold text-emerald-500 flex items-center gap-1 mt-3 relative z-10">
            <ArrowUpRight className="w-4 h-4" /> +12.5% vs last period
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 p-8 bg-rose-50 rounded-full group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-8 h-8 text-rose-200" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Claims Paid Out</p>
          <h3 className="text-3xl font-black text-slate-800 relative z-10">₹4,20,000</h3>
          <p className="text-xs font-bold text-rose-500 flex items-center gap-1 mt-3 relative z-10">
            <ArrowUpRight className="w-4 h-4" /> +4.2% vs last period
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 p-8 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform">
            <TrendingUp className="w-8 h-8 text-emerald-200" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Net Profit Margin</p>
          <h3 className="text-3xl font-black text-slate-800 relative z-10">24.8%</h3>
          <p className="text-xs font-bold text-emerald-500 flex items-center gap-1 mt-3 relative z-10">
            <ArrowUpRight className="w-4 h-4" /> +1.5% vs last period
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart Simulation */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" /> Premium Revenue Trend
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

            {/* Bars */}
            {chartData.map((data, i) => (
              <div key={i} className="flex flex-col items-center flex-1 z-10 group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded mb-2 shadow-lg pointer-events-none">
                  {data.amount}
                </div>
                <div className={`w-full max-w-[3rem] ${data.height} bg-indigo-100 rounded-t-xl relative overflow-hidden group-hover:bg-indigo-200 transition-colors`}>
                  <div className="absolute bottom-0 w-full h-full bg-indigo-500 transform translate-y-[20%] group-hover:translate-y-0 transition-transform duration-500"></div>
                </div>
                <span className="text-xs font-bold text-slate-400 mt-3">{data.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Agents List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" /> Top Performing Agents
          </h3>
          <div className="space-y-6">
            {topAgents.map((agent, i) => (
              <div key={agent.id}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
                      #{i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{agent.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">{agent.sales} Policies Sold</p>
                    </div>
                  </div>
                  <span className="font-black text-indigo-600 text-sm">{agent.revenue}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 shadow-inner">
                  <div className={`${agent.progress} bg-emerald-500 h-2 rounded-full`}></div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm">
            View Complete Agent Ranking
          </button>
        </div>
      </div>
    </div>
  );
}