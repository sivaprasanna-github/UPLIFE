import React, { useEffect, useState } from "react";
import { Plus, Search, X, ChevronDown, Trash2, Edit2 } from "lucide-react";
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

const EMPTY_FORM = {
  fullName: "", email: "", phone: "", loanAmount: "",
  loanType: "Personal Loan", leadName: "", remarks: ""
};

export default function ClientList() {
  const [clients, setClients]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus]     = useState("all");
  const [filterLoanType, setFilterLoanType] = useState("all");

  const token = sessionStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)           params.set("search", search);
      if (filterStatus !== "all")   params.set("status", filterStatus);
      if (filterLoanType !== "all") params.set("loanType", filterLoanType);
      const res = await fetch(`${API_URL}/employee/my-clients?${params}`, { headers });
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load clients"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClients(); }, [filterStatus, filterLoanType]);

  const handleSearch = (e) => { e.preventDefault(); fetchClients(); };

  const openAdd = () => { setEditClient(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (c) => {
    setEditClient(c);
    setForm({ fullName: c.fullName, email: c.email, phone: c.phone,
      loanAmount: c.loanAmount, loanType: c.loanType,
      leadName: c.leadName || "", remarks: c.remarks || "" });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editClient
        ? `${API_URL}/employee/client/${editClient._id}`
        : `${API_URL}/employee/create-client`;
      const method = editClient ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify({ ...form, loanAmount: Number(form.loanAmount) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(editClient ? "Client updated!" : "Client added!");
      setShowModal(false);
      fetchClients();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/employee/client/${id}/status`, {
        method: "PATCH", headers, body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error();
      toast.success(`Status updated to ${status}`);
      setClients(prev => prev.map(c => c._id === id ? { ...c, status } : c));
    } catch { toast.error("Failed to update status"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this client?")) return;
    try {
      await fetch(`${API_URL}/employee/client/${id}`, { method: "DELETE", headers });
      toast.success("Client deleted");
      setClients(prev => prev.filter(c => c._id !== id));
    } catch { toast.error("Failed to delete"); }
  };

  const statusBadge = (s) => {
    if (s === "approved") return "bg-green-100 text-green-700";
    if (s === "rejected") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">My Clients</h2>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, email..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-200" />
          <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Search className="w-4 h-4" />
          </button>
        </form>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={filterLoanType} onChange={e => setFilterLoanType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 max-w-xs">
          <option value="all">All Loan Types</option>
          {LOAN_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">S.No</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Loan Type</th>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Loan Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Remarks</th>
                <th className="px-4 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-gray-400">No clients found</td></tr>
              ) : clients.map((c, i) => (
                <tr key={c._id} className="border-b last:border-0 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.fullName}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-36 truncate" title={c.loanType}>{c.loanType}</td>
                  <td className="px-4 py-3 text-gray-600">{c.leadName || "—"}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">₹{c.loanAmount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <select value={c.status}
                      onChange={e => handleStatusChange(c._id, e.target.value)}
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border-0 cursor-pointer capitalize ${statusBadge(c.status)}`}>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-32 truncate" title={c.remarks}>{c.remarks || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(c)}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-blue-600 transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(c._id)}
                        className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-lg text-gray-800">{editClient ? "Edit Client" : "Add New Client"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name *</label>
                  <input required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone *</label>
                  <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email *</label>
                  <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Loan Type *</label>
                  <select required value={form.loanType} onChange={e => setForm({...form, loanType: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                    {LOAN_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Loan Amount (₹) *</label>
                  <input type="number" required min="1" value={form.loanAmount} onChange={e => setForm({...form, loanAmount: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Lead Name</label>
                  <input value={form.leadName} onChange={e => setForm({...form, leadName: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Remarks</label>
                  <textarea rows={2} value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? "Saving..." : editClient ? "Update Client" : "Add Client"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}