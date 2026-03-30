import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function Claims() {
  const navigate = useNavigate();

  const [claims, setClaims] = useState([]);
  const [search, setSearch] = useState({ claimId: "", customerName: "", status: "" });

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    const res = await axios.get(`${API_URL}/api/claims`);
    setClaims(res.data || []);
  };

  const handleChange = async (e) => {
    const updated = { ...search, [e.target.name]: e.target.value };
    setSearch(updated);
    const res = await axios.get(`${API_URL}/api/claims/search`, { params: updated });
    setClaims(res.data || []);
  };

  const statusColor = (status) => {
    if (status === "Approved") return "bg-green-100 text-green-700";
    if (status === "Rejected") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">

      <h1 className="text-2xl font-bold text-gray-800">Insurance Claims</h1>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Search Claims</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            name="claimId"
            placeholder="Claim ID"
            className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            onChange={handleChange}
          />
          <input
            name="customerName"
            placeholder="Customer Name"
            className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            onChange={handleChange}
          />
          <select
            name="status"
            className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            onChange={handleChange}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Claim List</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b bg-gray-50">
                <th className="p-3">Claim ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Type</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {claims.length ? (
                claims.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="p-3 text-gray-500">{c.claimId}</td>
                    <td className="p-3 font-medium text-gray-700">{c.customerName}</td>
                    <td className="p-3 text-gray-500">{c.claimType}</td>
                    <td className="p-3 text-gray-700 font-medium">₹{c.claimAmount}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => navigate(`/claims/${c.id}`)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No claims found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}