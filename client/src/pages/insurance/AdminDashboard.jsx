import { useState } from "react";
import { Users, UserCircle, FileText, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

const sampleStats = {
  customers: 1242,
  agents: 38,
  policiesThisMonth: 112,
  claimsThisMonth: 14,
};

const sampleNotices = [
  { id: 1, title: "Policy renewal reminder sent", time: "2h ago" },
  { id: 2, title: "New agent joined: Priya R.", time: "1d ago" },
  { id: 3, title: "Scheduled downtime (Sat 02:00–03:00)", time: "3d ago" },
];

const sampleCustomers = [
  { id: 1, name: "Sita Verma", policy: "Health Plus", lastPayment: "2025-11-01" },
  { id: 2, name: "Arjun Rao", policy: "Car Shield", lastPayment: "2025-10-19" },
  { id: 3, name: "Maya Singh", policy: "Life Secure", lastPayment: "2025-09-30" },
];

const statCards = [
  { title: "Customers", value: sampleStats.customers, icon: Users, trend: { value: 12, isPositive: true } },
  { title: "Agents", value: sampleStats.agents, icon: UserCircle, trend: { value: 5, isPositive: true } },
  { title: "Policies (Month)", value: sampleStats.policiesThisMonth, icon: FileText, trend: { value: 8, isPositive: true } },
  { title: "Claims (Month)", value: sampleStats.claimsThisMonth, icon: AlertTriangle, trend: { value: 3, isPositive: false } },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6 space-y-6">

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{stat.title}</span>
                <Icon className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stat.value}</span>
              <div className={`flex items-center gap-1 text-xs font-medium ${stat.trend.isPositive ? "text-green-500" : "text-red-500"}`}>
                {stat.trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.trend.value}% this month
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Customers Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Recent Customers</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b">
                <th className="pb-2">Name</th>
                <th className="pb-2">Policy</th>
                <th className="pb-2">Last Payment</th>
              </tr>
            </thead>
            <tbody>
              {sampleCustomers.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 font-medium text-gray-700">{c.name}</td>
                  <td className="py-2 text-gray-500">{c.policy}</td>
                  <td className="py-2 text-gray-500">{c.lastPayment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notices + Summary */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Recent Notices</h2>
          <div className="space-y-3">
            {sampleNotices.map((n) => (
              <div key={n.id} className="flex flex-col gap-0.5 border-b last:border-0 pb-2">
                <span className="text-sm text-gray-700">{n.title}</span>
                <span className="text-xs text-gray-400">{n.time}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t space-y-2">
            <h3 className="text-sm font-semibold text-gray-600">Summary</h3>
            {Object.entries(sampleStats).map(([key, val]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className="font-semibold text-gray-700">{val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}