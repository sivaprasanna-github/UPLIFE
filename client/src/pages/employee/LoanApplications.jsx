import React, { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

const LOAN_TYPES = [
  "Personal Loan", "Business Loan",
  "Home Loan - Construction Flat", "Home Loan - Independent House",
  "Home Loan - Plot Purchase", "Home Loan - Plot + Construction",
  "Mortgage Loan - Residential", "Mortgage Loan - Commercial",
  "Mortgage Loan - Open Plot", "Education Loan",
  "Used Car Loan", "New Car Loan", "Car Refinance"
];

export default function LoanApplications() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("all");

  const token = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API_URL}/employee/my-clients`, { headers })
      .then(r => r.json())
      .then(data => setClients(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load applications"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeType === "all" ? clients : clients.filter(c => c.loanType === activeType);

  const statusBadge = (s) => {
    if (s === "approved") return "bg-green-100 text-green-700 border border-green-200";
    if (s === "rejected") return "bg-red-100 text-red-700 border border-red-200";
    return "bg-amber-100 text-amber-700 border border-amber-200";
  };

  // Count per type
  const countMap = {};
  clients.forEach(c => { countMap[c.loanType] = (countMap[c.loanType] || 0) + 1; });

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">Loan Applications</h2>

      {/* Loan Type Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveType("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
            activeType === "all" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}>
          All ({clients.length})
        </button>
        {LOAN_TYPES.filter(t => countMap[t]).map(t => (
          <button key={t} onClick={() => setActiveType(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              activeType === t ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}>
            {t} ({countMap[t]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">S.No</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Loan Type</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">No applications found</td></tr>
              ) : filtered.map((c, i) => (
                <tr key={c._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.fullName}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{c.leadName || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{c.loanType}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    ₹{c.loanAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-32 truncate">{c.remarks || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t text-xs text-gray-400 flex justify-between">
            <span>Showing {filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
            <span className="font-semibold text-gray-600">
              Total: ₹{filtered.reduce((s, c) => s + c.loanAmount, 0).toLocaleString("en-IN")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}