import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  UserPlus, Users, Eye, X, Search,
  RefreshCw, Trash2, Edit3, Upload, Download, FileSpreadsheet,
  CheckCircle, AlertCircle
} from "lucide-react";
import * as XLSX from "xlsx";

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
  date:       new Date().toISOString().slice(0, 10),
  fullName:   "",
  phone:      "",
  leadName:   "",
  loanType:   "Personal Loan",
  loanAmount: "",
  remarks:    ""
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

export default function EmployeeAddUser() {
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
  const [success, setSuccess]     = useState(null);
  const [failedImports, setFailedImports] = useState([]);
  const fileInputRef = useRef(null);

  const token   = sessionStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    setFetching(true);
    try {
      const res  = await fetch(`${API_URL}/loan/users`, { headers });
      const text = await res.text();
      let data = JSON.parse(text);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || "Failed to load records");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── DATA FILTERING LOGIC ───────────────────────────────────────────────────
  const displayedUsers = users.filter((u) => {
    if (filterStatus !== "all" && u.status !== filterStatus) return false;

    const uLoanType = u.loanType || u.preferredLoanType || "None";
    if (filterLoanType !== "all" && uLoanType !== filterLoanType) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName   = u.fullName?.toLowerCase().includes(q);
      const matchPhone  = u.phone?.toLowerCase().includes(q);
      const matchLead   = u.leadName?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchLead) return false;
    }

    if (startDate || endDate) {
      const userDate = new Date(u.date || u.createdAt);
      userDate.setHours(0, 0, 0, 0);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (userDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        if (userDate > end) return false;
      }
    }

    return true;
  });

  const stats = {
    total:    displayedUsers.length,
    pending:  displayedUsers.filter(u => u.status === "Pending").length,
    approved: displayedUsers.filter(u => u.status === "Approved").length,
    rejected: displayedUsers.filter(u => u.status === "Rejected").length,
    totalAmt: fmt(displayedUsers.reduce((s, u) => s + (u.loanAmount || u.requiredLoanAmount || 0), 0))
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    try {
      const payload = {
        ...form,
        loanAmount: parseFloat(form.loanAmount) || 0,
        preferredLoanType: form.loanType,
        requiredLoanAmount: parseFloat(form.loanAmount) || 0,
        ...(editMode ? {} : { status: "Pending" })
      };

      const url = editMode && selected ? `${API_URL}/loan/users/${selected._id}` : `${API_URL}/loan/users/create`;
      const method = editMode ? "PUT" : "POST";

      const res  = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Operation failed");

      if (!editMode) {
        setSuccess({
          name:       data.fullName,
          loanType:   data.loanType || data.preferredLoanType,
          loanAmount: data.loanAmount || data.requiredLoanAmount,
          status:     data.status,
          date:       data.date || data.createdAt
        });
        toast.success("Application submitted!");
      } else {
        toast.success("Record updated!");
      }

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

  const openEdit = (u) => {
    setForm({
      date:       u.date ? new Date(u.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      fullName:   u.fullName   || "",
      phone:      u.phone      || "",
      leadName:   u.leadName   || "",
      loanType:   u.loanType   || u.preferredLoanType || "Personal Loan",
      loanAmount: u.loanAmount || u.requiredLoanAmount || "",
      remarks:    u.remarks    || ""
    });
    setEditMode(true);
    setSelected(u);
    setSuccess(null);
    setTab("create");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this loan user?")) return;
    try {
      await fetch(`${API_URL}/loan/users/${id}`, { method: "DELETE", headers });
      toast.success("Deleted successfully");
      setSelected(null);
      fetchUsers();
    } catch { toast.error("Delete failed"); }
  };

  // ── Export (Excel) ─────────────────────────────────────────────────────────
  const handleExport = () => {
    if (displayedUsers.length === 0) return toast.error("No data to export!");
    
    const exportData = displayedUsers.map(u => ({
      "Date": u.date ? new Date(u.date).toLocaleDateString() : new Date(u.createdAt).toLocaleDateString(),
      "Full Name": u.fullName,
      "Phone": u.phone,
      "Lead Source": u.leadName,
      "Loan Type": u.loanType || u.preferredLoanType,
      "Required Amount": u.loanAmount || u.requiredLoanAmount,
      "Status": u.status,
      "Remarks": u.remarks
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "My_Records");
    XLSX.writeFile(workbook, `My_Applications_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ── Import (Excel) ─────────────────────────────────────────────────────────
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        setFailedImports([]);
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) throw new Error("Excel file is empty!");

        let successCount = 0;
        let errors = [];

        for (const [index, row] of jsonData.entries()) {
          const payload = {
            ...EMPTY,
            fullName: row["Full Name"] || row["Applicant"] || row.fullName || "",
            phone: row["Phone"] || row["Mobile"] || String(row.phone || ""),
            leadName: row["Lead Source"] || row["Lead"] || row.leadName || "",
            preferredLoanType: row["Loan Type"] || row.loanType || "Personal Loan",
            requiredLoanAmount: parseFloat(row["Required Amount"] || row["Loan Amount"] || row.loanAmount) || 0,
            status: "Pending"
          };

          if (!payload.fullName || !payload.phone) {
            errors.push({ row: index + 2, name: payload.fullName || "Unknown", reason: "Missing Name or Phone" });
            continue;
          }

          const res = await fetch(`${API_URL}/loan/users/create`, {
            method: "POST", headers, body: JSON.stringify(payload)
          });
          if (res.ok) successCount++;
          else errors.push({ row: index + 2, name: payload.fullName, reason: "Server rejected (Duplicate or Invalid data)" });
        }

        if (errors.length > 0) setFailedImports(errors);
        if (successCount > 0) {
          toast.success(`${successCount} records imported!`);
          fetchUsers();
        }
      } catch (err) {
        toast.error("Error reading Excel. Check format.");
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = ""; 
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const f = (key) => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="space-y-5">
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Loan Applications</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage your submitted loan records</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {tab === "list" && (
            <>
              <button onClick={() => fileInputRef.current?.click()} disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                <Upload size={14} /> {loading ? "Importing…" : "Import Excel"}
              </button>
              <button onClick={handleExport} disabled={loading || displayedUsers.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition disabled:opacity-50">
                <Download size={14} /> Export Excel
              </button>
            </>
          )}

          <button onClick={() => { setTab("list"); setEditMode(false); setForm(EMPTY); setSuccess(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === "list" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            <span className="flex items-center gap-1.5"><Users size={15} /> All Records ({displayedUsers.length})</span>
          </button>

          {/* BEAUTIFUL PURPLE BUTTON */}
          <button onClick={() => { setTab("create"); setEditMode(false); setForm(EMPTY); setSuccess(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm ${tab === "create" ? "bg-purple-600 text-white shadow-purple-600/20" : "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"}`}>
            <span className="flex items-center gap-1.5"><UserPlus size={15} /> {editMode ? "Edit Record" : "New Application"}</span>
          </button>
        </div>
      </div>

      {/* ── FAILED IMPORTS ── */}
      {failedImports.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-rose-700 font-bold flex items-center gap-2"><AlertCircle size={18}/> Import Errors ({failedImports.length} Failed)</h3>
            <button onClick={() => setFailedImports([])} className="text-rose-500 hover:bg-rose-100 p-1 rounded-md"><X size={16}/></button>
          </div>
          <div className="max-h-40 overflow-y-auto bg-white rounded-lg border border-rose-100 p-3">
            {failedImports.map((err, i) => (
              <div key={i} className="flex gap-4 text-xs border-b last:border-0 border-gray-100 py-1.5">
                <span className="font-bold text-gray-500 w-12">Row {err.row}</span>
                <span className="font-semibold text-gray-800 w-32 truncate">{err.name}</span>
                <span className="text-rose-600 font-medium">{err.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LIST TAB ── */}
      {tab === "list" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, lead…"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            
            {/* Standardized Date Range UI */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-300 transition-shadow">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm outline-none text-gray-600 bg-transparent" />
              <span className="text-gray-400 font-medium text-sm">to</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm outline-none text-gray-600 bg-transparent" />
              {(startDate || endDate) && (
                <button onClick={() => { setStartDate(""); setEndDate(""); }} className="ml-1 text-gray-400 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              <option value="all">All Status</option>{STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterLoanType} onChange={e => setFilterLoanType(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 max-w-[150px]">
              <option value="all">All Loan Types</option>{LOAN_TYPES.filter(t => t !== "None").map(t => <option key={t}>{t}</option>)}
            </select>
            <button onClick={fetchUsers} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shrink-0">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total Filtered", val: stats.total,    color: "bg-white border-gray-200" },
              { label: "Pending",        val: stats.pending,  color: "bg-yellow-50 border-yellow-200" },
              { label: "Approved",       val: stats.approved, color: "bg-green-50 border-green-200" },
              { label: "Rejected",       val: stats.rejected, color: "bg-red-50 border-red-200" },
              { label: "Total Amount",   val: stats.totalAmt, color: "bg-blue-50 border-blue-200" },
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
              <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading Data…</div>
            ) : displayedUsers.length === 0 ? (
              <div className="text-center py-20">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 text-sm">No records match your filters</p>
                {users.length === 0 && (
                  <button onClick={() => setTab("create")}
                    className="mt-3 text-purple-600 text-sm font-bold hover:underline">
                    + Submit First Application
                  </button>
                )}
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
                            {u.loanType || u.preferredLoanType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800 text-sm whitespace-nowrap">
                          {fmt(u.loanAmount || u.requiredLoanAmount)}
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
        <div className="space-y-5 max-w-2xl">
          {success && !editMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-blue-700 font-semibold">
                <CheckCircle className="w-5 h-5" /> Application Submitted Successfully
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Applicant",   success.name],
                  ["Loan Type",   success.loanType],
                  ["Loan Amount", fmt(success.loanAmount)],
                  ["Status",      success.status],
                  ["Date",        new Date(success.date).toLocaleDateString("en-IN")],
                ].map(([k, v]) => (
                  <div key={k} className="bg-white rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">{k}</p>
                    <p className="font-semibold text-gray-800">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <UserPlus className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-700 text-lg">
                {editMode ? `Editing: ${selected?.fullName}` : "New Loan Application"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">

                <Field label="Date" required>
                  <input required type="date" {...f("date")} className={inp} />
                </Field>

                <Field label="Full Name" required>
                  <input required {...f("fullName")} placeholder="Ramesh Kumar" className={inp} />
                </Field>

                <Field label="Mobile Number" required>
                  <input required {...f("phone")} placeholder="+91 99999 00000" className={inp} />
                </Field>

                <Field label="Lead / Agent Name">
                  <input {...f("leadName")} placeholder="e.g. Anil, Walk-in" className={inp} />
                </Field>

                <Field label="Loan Type" required span={2}>
                  <select required {...f("loanType")} className={inp}>
                    {LOAN_TYPES.filter(t => t !== "None").map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>

                <Field label="Loan Amount (₹)" required>
                  <input required type="number" min={0} placeholder="500000" {...f("loanAmount")} className={inp} />
                </Field>

                <div className="flex items-center">
                  {form.loanAmount && parseFloat(form.loanAmount) > 0 && (
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 w-full">
                      <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
                      <p className="text-xs text-blue-700">
                        <strong>{fmt(parseFloat(form.loanAmount))}</strong> · {form.loanType}
                      </p>
                    </div>
                  )}
                </div>

                <Field label="Remarks / Notes" span={2}>
                  <textarea {...f("remarks")} rows={3}
                    placeholder="e.g. Cibil issue, statement pending, property details…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
                </Field>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 text-sm shadow-sm">
                  {loading ? "Saving…" : editMode ? "Update Record" : "Submit Application"}
                </button>
                <button type="button"
                  onClick={() => { setTab("list"); setForm(EMPTY); setEditMode(false); setSuccess(null); }}
                  className="px-6 py-3 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW MODAL ── */}
      {selected && tab === "list" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}>

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
                ["Loan Type",   selected.loanType || selected.preferredLoanType],
                ["Loan Amount", fmt(selected.loanAmount || selected.requiredLoanAmount)],
                ["Remarks",     selected.remarks || "—"],
                ["Added On",    new Date(selected.createdAt).toLocaleDateString("en-IN")],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-400 font-medium">{k}</span>
                  <span className="text-gray-800 font-semibold text-right max-w-48">{v}</span>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <button onClick={() => { openEdit(selected); setSelected(null); }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
                <Edit3 size={14} /> Edit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}