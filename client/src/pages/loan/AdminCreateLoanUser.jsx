import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  UserPlus, Users, Eye, X, Search,
  RefreshCw, Trash2, Edit3, Upload, Download, FileSpreadsheet
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const LOAN_TYPES = [
  "None", "Personal Loan", "Business Loan",
  "Home Loan - Construction Flat", "Home Loan - Independent House",
  "Home Loan - Plot Purchase", "Home Loan - Plot + Construction",
  "Mortgage Loan - Residential", "Mortgage Loan - Commercial", "Mortgage Loan - Open Plot",
  "Education Loan", "Used Car Loan", "New Car Loan", "Car Refinance"
];

const STATUSES = ["Pending", "Approved", "Rejected", "Active", "Inactive"];

const EMPTY = {
  date: new Date().toISOString().slice(0, 10),
  fullName: "",
  phone: "",
  leadName: "",
  loanType: "None",
  loanAmount: "",
  status: "Pending",
  remarks: ""
};

const STATUS_BADGE = {
  Pending:  "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Active:   "bg-blue-100 text-blue-700",
  Inactive: "bg-gray-100 text-gray-500"
};

const fmt = (n) =>
  n ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n) : "—";

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white";

const Field = ({ label, children, required, span }) => (
  <div className={span === 2 ? "col-span-2" : ""}>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

export default function AdminCreateLoanUser() {
  const [tab, setTab]           = useState("list");
  const [form, setForm]         = useState(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [users, setUsers]       = useState([]);
  const [fetching, setFetching] = useState(true);
  
  // ── Filters State ────────────────────────────────────────────────────────
  const [search, setSearch]                 = useState("");
  const [filterStatus, setFilterStatus]     = useState("all");
  const [filterLoanType, setFilterLoanType] = useState("all");
  const [startDate, setStartDate]           = useState("");
  const [endDate, setEndDate]               = useState("");

  const [selected, setSelected]   = useState(null);
  const [editMode, setEditMode]   = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const token   = sessionStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    Authorization: `Bearer ${token}`
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterLoanType !== "all") params.set("loanType", filterLoanType);
      if (search) params.set("search", search);

      const res  = await fetch(`${API_URL}/loan/users?${params}`, { headers });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch { throw new Error("Server returned HTML instead of JSON. Check backend logs."); }
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filterStatus, filterLoanType]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        loanAmount: parseFloat(form.loanAmount) || 0,
      };

      const url = editMode && selected
        ? `${API_URL}/loan/users/${selected._id}`
        : `${API_URL}/loan/users/create`;
      const method = editMode ? "PUT" : "POST";

      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const responseText = await res.text();

      let data;
      try { data = JSON.parse(responseText); }
      catch {
        if (responseText.includes("<!DOCTYPE html>")) {
          throw new Error("Backend route not found (404). Check server.js mounts.");
        }
        throw new Error(`Server Error (${res.status}): Open console for details.`);
      }

      if (!res.ok) throw new Error(data.message || "Operation failed");

      toast.success(editMode ? "User updated!" : "Loan user created!");
      setForm(EMPTY);
      setEditMode(false);
      setSelected(null);
      fetchUsers();
      setTab("list");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this loan user?")) return;
    try {
      await fetch(`${API_URL}/loan/users/${id}`, { method: "DELETE", headers });
      toast.success("Deleted successfully");
      setSelected(null);
      fetchUsers();
    } catch {
      toast.error("Delete failed");
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const openEdit = (u) => {
    setForm({
      date:       u.date ? new Date(u.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      fullName:   u.fullName || "",
      phone:      u.phone || "",
      leadName:   u.leadName || "",
      loanType:   u.loanType || "None",
      loanAmount: u.loanAmount || "",
      status:     u.status || "Pending",
      remarks:    u.remarks || ""
    });
    setEditMode(true);
    setSelected(u);
    setTab("create");
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await fetch(`${API_URL}/loan/users/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `loan_users_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported successfully!");
    } catch (err) {
      toast.error(err.message || "Export failed");
    }
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/loan/users/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Import failed");
      toast.success(data.message || `Imported ${data.count} records!`);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const f = (key) => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) });

  // ── Date Filtering Logic (Client-Side) ─────────────────────────────────────
  const displayedUsers = users.filter(u => {
    if (!startDate && !endDate) return true;
    
    // Get date in YYYY-MM-DD format
    const uDateRaw = u.date || u.createdAt;
    if (!uDateRaw) return true; 
    
    const uDateStr = new Date(uDateRaw).toISOString().slice(0, 10);
    
    if (startDate && uDateStr < startDate) return false;
    if (endDate && uDateStr > endDate) return false;
    
    return true;
  });

  // ── Stats (calculated based on filtered data) ──────────────────────────────
  const stats = {
    total:    displayedUsers.length,
    pending:  displayedUsers.filter(u => u.status === "Pending").length,
    approved: displayedUsers.filter(u => u.status === "Approved").length,
    rejected: displayedUsers.filter(u => u.status === "Rejected").length,
    totalAmt: fmt(displayedUsers.reduce((s, u) => s + (u.loanAmount || 0), 0))
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Loan Users</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage loan applicant records</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImport}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            <Upload size={14} /> {importing ? "Importing…" : "Import Excel"}
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition"
          >
            <Download size={14} /> Export Excel
          </button>

          {/* Tab buttons */}
          <button
            onClick={() => { setTab("list"); setEditMode(false); setForm(EMPTY); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === "list" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <span className="flex items-center gap-1.5"><Users size={15} /> All Users ({users.length})</span>
          </button>
          <button
            onClick={() => { setTab("create"); setEditMode(false); setForm(EMPTY); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === "create" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <span className="flex items-center gap-1.5"><UserPlus size={15} /> {editMode ? "Edit User" : "New User"}</span>
          </button>
        </div>
      </div>

      {/* ── LIST TAB ── */}
      {tab === "list" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
            
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchUsers()}
                placeholder="Search name, phone, lead, remarks…"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Dropdowns */}
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              <option value="all">All Status</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterLoanType} onChange={e => setFilterLoanType(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              <option value="all">All Loan Types</option>
              {LOAN_TYPES.filter(t => t !== "None").map(t => <option key={t}>{t}</option>)}
            </select>

            {/* Date Filters */}
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                title="Start Date"
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                title="End Date"
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              {(startDate || endDate) && (
                <button 
                  onClick={() => { setStartDate(""); setEndDate(""); }} 
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Clear Dates"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Refresh */}
            <button onClick={fetchUsers}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shrink-0">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total",    val: stats.total,    color: "bg-white border-gray-200" },
              { label: "Pending",  val: stats.pending,  color: "bg-yellow-50 border-yellow-200" },
              { label: "Approved", val: stats.approved, color: "bg-green-50 border-green-200" },
              { label: "Rejected", val: stats.rejected, color: "bg-red-50 border-red-200" },
              { label: "Total Amount", val: stats.totalAmt, color: "bg-blue-50 border-blue-200" },
            ].map(({ label, val, color }) => (
              <div key={label} className={`rounded-xl border p-4 ${color}`}>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-xl font-bold text-gray-800 mt-0.5">{val}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {fetching ? (
              <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>
            ) : displayedUsers.length === 0 ? (
              <div className="text-center py-20">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 text-sm">No users found matching filters</p>
                <button onClick={() => setTab("create")}
                  className="mt-3 text-blue-600 text-sm font-semibold hover:underline">
                  + Add First Loan User
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["S.no", "Date", "Customer Name", "Contact", "Lead", "Loan Type", "Amount", "Status", "Remarks", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {displayedUsers.map((u, i) => (
                      <tr key={u._id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-gray-400 text-xs">{u.sno || i + 1}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {u.date ? new Date(u.date).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                              {u.fullName?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-800 whitespace-nowrap">{u.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{u.phone}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{u.leadName || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
                            {u.loanType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800 text-sm whitespace-nowrap">
                          {fmt(u.loanAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${STATUS_BADGE[u.status] || "bg-gray-100 text-gray-500"}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 max-w-32 truncate">{u.remarks || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setSelected(u)} title="View"
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition">
                              <Eye size={15} />
                            </button>
                            <button onClick={() => openEdit(u)} title="Edit"
                              className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 transition">
                              <Edit3 size={15} />
                            </button>
                            <button onClick={() => handleDelete(u._id)} title="Delete"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT TAB ── */}
      {tab === "create" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-700 text-lg">
              {editMode ? `Editing: ${selected?.fullName}` : "New Loan User"}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date" required>
                <input required type="date" {...f("date")} className={inp} />
              </Field>
              <Field label="Full Name" required>
                <input required {...f("fullName")} placeholder="Customer full name" className={inp} />
              </Field>
              <Field label="Contact Number" required>
                <input required {...f("phone")} placeholder="+91 99999 00000" className={inp} />
              </Field>
              <Field label="Lead / Agent Name">
                <input {...f("leadName")} placeholder="e.g. Anil, Walk-in" className={inp} />
              </Field>
              <Field label="Loan Type" span={2}>
                <select {...f("loanType")} className={inp}>
                  {LOAN_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Loan Amount (₹)">
                <input type="number" min={0} placeholder="500000" {...f("loanAmount")} className={inp} />
              </Field>
              <Field label="Status" required>
                <select required {...f("status")} className={inp}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Remarks / Notes" span={2}>
                <textarea {...f("remarks")} rows={3}
                  placeholder="e.g. Cibil issue, statement pending…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
              </Field>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm">
                {loading ? "Saving…" : editMode ? "Update User" : "Create Loan User"}
              </button>
              <button type="button"
                onClick={() => { setTab("list"); setForm(EMPTY); setEditMode(false); }}
                className="px-6 py-3 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── VIEW MODAL ── */}
      {selected && tab === "list" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
                  {selected.fullName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{selected.fullName}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[selected.status] || "bg-gray-100 text-gray-500"}`}>
                    {selected.status}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {[
                ["S.no",        selected.sno || "—"],
                ["Date",        selected.date ? new Date(selected.date).toLocaleDateString("en-IN") : "—"],
                ["Phone",       selected.phone],
                ["Lead",        selected.leadName || "—"],
                ["Loan Type",   selected.loanType],
                ["Loan Amount", fmt(selected.loanAmount)],
                ["Remarks",     selected.remarks || "—"],
                ["Created By",  selected.createdBy?.name || "—"],
                ["Added On",    new Date(selected.createdAt).toLocaleDateString("en-IN")],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-400 font-medium">{k}</span>
                  <span className="text-gray-800 font-semibold text-right max-w-48">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => { openEdit(selected); setSelected(null); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
                <Edit3 size={14} /> Edit
              </button>
              <button onClick={() => handleDelete(selected._id)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 transition">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}