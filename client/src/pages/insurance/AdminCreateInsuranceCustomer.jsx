import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  UserPlus, Users, Eye, Search,
  RefreshCw, Trash2, Edit3, Shield, Info, HeartPulse,
  Upload, Download, FileSpreadsheet, X, CheckCircle, AlertCircle
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const INSURANCE_TYPES = ["Life", "Health", "Auto", "Property", "Travel", "None"];
const GENDERS         = ["Male", "Female", "Other"];
const CUSTOMER_TYPES  = ["Individual", "Corporate"];
const STATUSES        = ["Active", "Inactive", "Blacklisted"];

// ── Excel column order (matches insuranceCustomerModel fields) ─────────────────
const EXCEL_COLUMNS = [
  "fullName", "dateOfBirth", "gender", "phone", "email",
  "address", "city", "state", "pincode",
  "aadharNumber", "panNumber",
  "customerType", "preferredInsuranceType",
  "nomineeFullName", "nomineeRelation", "nomineePhone",
  "occupation", "annualIncome", "existingConditions", "remarks"
];

// Human-readable header labels shown in the Excel sheet header row
const EXCEL_LABELS = {
  fullName:               "Full Name",
  dateOfBirth:            "Date of Birth (YYYY-MM-DD)",
  gender:                 "Gender (Male/Female/Other)",
  phone:                  "Phone",
  email:                  "Email",
  address:                "Street Address",
  city:                   "City",
  state:                  "State",
  pincode:                "Pincode",
  aadharNumber:           "Aadhar Number",
  panNumber:              "PAN Number",
  customerType:           "Customer Type (Individual/Corporate)",
  preferredInsuranceType: "Insurance Type (Life/Health/Auto/Property/Travel/None)",
  nomineeFullName:        "Nominee Full Name",
  nomineeRelation:        "Nominee Relation",
  nomineePhone:           "Nominee Phone",
  occupation:             "Occupation",
  annualIncome:           "Annual Income (Rs)",
  existingConditions:     "Existing Health Conditions",
  remarks:                "Remarks"
};

const EMPTY = {
  fullName: "", dateOfBirth: "", gender: "Male", phone: "", email: "",
  address: "", city: "", state: "", pincode: "",
  aadharNumber: "", panNumber: "",
  customerType: "Individual",
  preferredInsuranceType: "None",
  nomineeFullName: "", nomineeRelation: "", nomineePhone: "",
  occupation: "", annualIncome: "", existingConditions: "", remarks: ""
};

const TYPE_BADGE = {
  Life:     "bg-indigo-100 text-indigo-700 border-indigo-200",
  Health:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  Auto:     "bg-blue-100 text-blue-700 border-blue-200",
  Property: "bg-amber-100 text-amber-700 border-amber-200",
  Travel:   "bg-cyan-100 text-cyan-700 border-cyan-200",
  None:     "bg-slate-100 text-slate-500 border-slate-200"
};

const STATUS_BADGE = {
  Active:      "bg-emerald-100 text-emerald-700 border-emerald-200",
  Inactive:    "bg-slate-100 text-slate-600 border-slate-200",
  Blacklisted: "bg-rose-100 text-rose-700 border-rose-200"
};

const Field = ({ label, children, required, span }) => (
  <div className={span === 2 ? "col-span-1 md:col-span-2" : "col-span-1"}>
    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
  </div>
);

const inp = "w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all shadow-sm";

// ── Excel Utilities ────────────────────────────────────────────────────────────

/**
 * Read an .xlsx/.xls ArrayBuffer → array of plain objects keyed by EXCEL_COLUMNS.
 * Accepts both human-label headers (from the template) and raw field-key headers.
 */
function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb  = XLSX.read(e.target.result, { type: "array", cellDates: true });
        const ws  = wb.Sheets[wb.SheetNames[0]];
        // raw:false + dateNF → dates come back as "yyyy-mm-dd" strings
        const raw = XLSX.utils.sheet_to_json(ws, { raw: false, dateNF: "yyyy-mm-dd", defval: "" });
        if (!raw.length) throw new Error("The sheet is empty — add at least one data row.");

        // Build reverse map: "Full Name" → "fullName"
        const labelToKey = Object.fromEntries(
          Object.entries(EXCEL_LABELS).map(([k, v]) => [v, k])
        );

        const rows = raw.map((row, i) => {
          const obj = {};
          Object.keys(row).forEach(header => {
            const key = labelToKey[header] || (EXCEL_COLUMNS.includes(header) ? header : null);
            if (key) obj[key] = String(row[header] ?? "").trim();
          });

          if (!obj.fullName) throw new Error(`Row ${i + 2}: "Full Name" column is missing or empty.`);
          if (!obj.phone)    throw new Error(`Row ${i + 2}: "Phone" column is missing or empty.`);
          if (!obj.email)    throw new Error(`Row ${i + 2}: "Email" column is missing or empty.`);

          return obj;
        });

        resolve(rows);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
}

/** Export an array of customer objects → download as a formatted .xlsx file */
function exportToExcel(customers, filename = "customers_export.xlsx") {
  const exportRows = customers.map(c => {
    const row = {};
    EXCEL_COLUMNS.forEach(key => {
      let val = c[key] ?? "";
      if (key === "dateOfBirth" && val) {
        // Normalise to YYYY-MM-DD regardless of how Mongo returns it
        val = new Date(val).toISOString().slice(0, 10);
      }
      row[EXCEL_LABELS[key]] = val;
    });
    return row;
  });

  const headerOrder = EXCEL_COLUMNS.map(k => EXCEL_LABELS[k]);
  const ws = XLSX.utils.json_to_sheet(exportRows, { header: headerOrder });

  // Set column widths so the file opens nicely in Excel / Google Sheets
  ws["!cols"] = EXCEL_COLUMNS.map(() => ({ wch: 30 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Customers");
  XLSX.writeFile(wb, filename);
}

/** Download a pre-filled sample template so users know the exact format */
function downloadTemplate() {
  const sample = {
    fullName: "John Doe", dateOfBirth: "1990-01-15", gender: "Male",
    phone: "9876543210", email: "john@example.com",
    address: "123 Main St", city: "Hyderabad", state: "Telangana", pincode: "500001",
    aadharNumber: "1234 5678 9012", panNumber: "ABCDE1234F",
    customerType: "Individual", preferredInsuranceType: "Health",
    nomineeFullName: "Jane Doe", nomineeRelation: "Spouse", nomineePhone: "9876543211",
    occupation: "Engineer", annualIncome: "800000",
    existingConditions: "None", remarks: "New customer"
  };
  exportToExcel([sample], "customer_import_template.xlsx");
}

// ── Import Modal ───────────────────────────────────────────────────────────────
function ImportModal({ onClose, onImported }) {
  const [step, setStep]       = useState("upload"); // upload | preview | result
  const [rows, setRows]       = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const fileRef               = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls"].includes(ext)) {
      setError("Please upload an Excel file (.xlsx or .xls).");
      return;
    }
    setError("");
    try {
      const parsed = await parseExcelFile(file);
      setRows(parsed);
      setStep("preview");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile({ target: { files: [file] } });
  };

  const handleImport = async () => {
    setLoading(true);
    const res = [];
    for (const row of rows) {
      try {
        const payload = { ...row, annualIncome: parseFloat(row.annualIncome) || 0 };
        const r = await fetch(`${API_URL}/insurance/customers/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`
          },
          body: JSON.stringify(payload)
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || "Failed");
        res.push({ name: row.fullName, success: true });
      } catch (err) {
        res.push({ name: row.fullName, success: false, error: err.message });
      }
    }
    setResults(res);
    setStep("result");
    setLoading(false);
    onImported();
  };

  const successCount = results.filter(r => r.success).length;
  const failCount    = results.filter(r => !r.success).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600"/>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800">Import Customers from Excel</h3>
              <p className="text-xs text-slate-500 mt-0.5">Upload an .xlsx file to bulk-create customers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition">
            <X className="w-4 h-4"/>
          </button>
        </div>

        <div className="p-6">

          {/* ── Step 1: Upload ── */}
          {step === "upload" && (
            <div className="space-y-5">
              {/* Download template */}
              <button onClick={downloadTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition">
                <Download className="w-4 h-4"/> Download Sample Excel Template (.xlsx)
              </button>

              {/* Drop zone */}
              <div
                className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
              >
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-slate-300"/>
                <p className="font-bold text-slate-600">Click or drag & drop your Excel file here</p>
                <p className="text-xs text-slate-400 mt-1">Supports .xlsx and .xls</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile}/>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-700 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/>{error}
                </div>
              )}

              {/* Column reference */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="font-bold text-slate-600 text-xs mb-2 uppercase tracking-wider">
                  Required columns in your Excel sheet
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {EXCEL_COLUMNS.map(k => (
                    <div key={k} className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${["fullName","phone","email"].includes(k) ? "bg-rose-400" : "bg-slate-300"}`}/>
                      <span>{EXCEL_LABELS[k]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-3">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 mr-1 mb-0.5"/>Red = Required &nbsp;·&nbsp; Download the template above for the correct format
                </p>
              </div>
            </div>
          )}

          {/* ── Step 2: Preview ── */}
          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500"/>
                  <p className="text-sm font-bold text-slate-700">{rows.length} customers ready to import</p>
                </div>
                <button
                  onClick={() => { setStep("upload"); setRows([]); if (fileRef.current) fileRef.current.value = ""; }}
                  className="text-xs text-slate-500 hover:text-slate-700 underline">
                  Change file
                </button>
              </div>

              <div className="overflow-auto max-h-64 rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      {["#", "Full Name", "Email", "Phone", "Customer Type", "Insurance", "Gender"].map(h => (
                        <th key={h} className="px-3 py-2 font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2 font-semibold text-slate-700 whitespace-nowrap">{r.fullName}</td>
                        <td className="px-3 py-2 text-slate-500">{r.email}</td>
                        <td className="px-3 py-2 text-slate-500">{r.phone}</td>
                        <td className="px-3 py-2 text-slate-500">{r.customerType || "Individual"}</td>
                        <td className="px-3 py-2 text-slate-500">{r.preferredInsuranceType || "None"}</td>
                        <td className="px-3 py-2 text-slate-500">{r.gender || "Male"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button onClick={onClose}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button onClick={handleImport} disabled={loading}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm text-sm disabled:opacity-50 active:scale-95 flex items-center gap-2">
                  {loading
                    ? <><RefreshCw className="w-4 h-4 animate-spin"/> Importing...</>
                    : <><Upload className="w-4 h-4"/> Import {rows.length} Customers</>}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Result ── */}
          {step === "result" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2"/>
                  <p className="text-3xl font-black text-emerald-700">{successCount}</p>
                  <p className="text-xs font-bold text-emerald-600 mt-1">Imported Successfully</p>
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 text-center">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2"/>
                  <p className="text-3xl font-black text-rose-600">{failCount}</p>
                  <p className="text-xs font-bold text-rose-500 mt-1">Failed</p>
                </div>
              </div>

              {failCount > 0 && (
                <div className="overflow-auto max-h-44 rounded-xl border border-rose-200 bg-rose-50 p-3 space-y-1.5">
                  <p className="text-xs font-extrabold text-rose-700 uppercase tracking-wider mb-2">Failed Rows</p>
                  {results.filter(r => !r.success).map((r, i) => (
                    <div key={i} className="text-xs text-rose-700 flex gap-2 bg-white rounded-lg px-3 py-2 border border-rose-100">
                      <span className="font-bold shrink-0">{r.name}:</span>
                      <span className="text-rose-500">{r.error}</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={onClose}
                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition text-sm">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminCreateInsuranceCustomer() {
  const [tab, setTab]             = useState("list");
  const [form, setForm]           = useState(EMPTY);
  const [loading, setLoading]     = useState(false);
  const [customers, setCustomers] = useState([]);
  const [fetching, setFetching]   = useState(true);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType]     = useState("all");
  const [selected, setSelected]   = useState(null);
  const [editMode, setEditMode]   = useState(false);
  const [showImport, setShowImport] = useState(false);

  const token   = sessionStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    Authorization: `Bearer ${token}`
  };

  const fetchCustomers = async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterType   !== "all") params.set("preferredInsuranceType", filterType);
      if (search)                 params.set("search", search);
      const res  = await fetch(`${API_URL}/insurance/customers?${params}`, { headers });
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || "Failed to load customers");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, [filterStatus, filterType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, annualIncome: parseFloat(form.annualIncome) || 0 };
      const url    = editMode && selected
        ? `${API_URL}/insurance/customers/${selected._id}`
        : `${API_URL}/insurance/customers/create`;
      const method = editMode ? "PUT" : "POST";
      const res  = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      toast.success(editMode ? "Customer updated!" : "Customer created!");
      setForm(EMPTY); setEditMode(false); setSelected(null);
      fetchCustomers();
      if (!editMode) setTab("list");
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await fetch(`${API_URL}/insurance/customers/${id}`, { method: "DELETE", headers });
      toast.success("Customer Deleted");
      setSelected(null);
      fetchCustomers();
    } catch { toast.error("Delete failed"); }
  };

  const openEdit = (c) => {
    setForm({
      fullName: c.fullName || "", dateOfBirth: c.dateOfBirth?.slice(0, 10) || "",
      gender: c.gender || "Male", phone: c.phone || "", email: c.email || "",
      address: c.address || "", city: c.city || "", state: c.state || "", pincode: c.pincode || "",
      aadharNumber: c.aadharNumber || "", panNumber: c.panNumber || "",
      customerType: c.customerType || "Individual",
      preferredInsuranceType: c.preferredInsuranceType || "None",
      nomineeFullName: c.nomineeFullName || "", nomineeRelation: c.nomineeRelation || "",
      nomineePhone: c.nomineePhone || "", occupation: c.occupation || "",
      annualIncome: c.annualIncome || "", existingConditions: c.existingConditions || "",
      remarks: c.remarks || ""
    });
    setEditMode(true); setSelected(c); setTab("create");
  };

  // ── Export currently listed customers as .xlsx ─────────────────────────────
  const handleExport = () => {
    if (!customers.length) { toast.error("No customers to export."); return; }
    const filename = `customers_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    exportToExcel(customers, filename);
    toast.success(`Exported ${customers.length} customers to Excel.`);
  };

  const f = (key) => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 rounded-3xl">

      {/* Import Modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={() => { fetchCustomers(); setShowImport(false); }}
        />
      )}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Customer Directory</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage your insurance client profiles and details.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {tab === "list" && (
            <>
              <button onClick={() => setShowImport(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-emerald-50 hover:border-emerald-300 shadow-sm transition active:scale-95">
                <Upload className="w-4 h-4 text-emerald-600"/> Import Excel
              </button>
              <button onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-emerald-50 hover:border-emerald-300 shadow-sm transition active:scale-95">
                <Download className="w-4 h-4 text-emerald-600"/> Export Excel
              </button>
            </>
          )}
          <div className="flex bg-slate-200/60 p-1.5 rounded-xl border border-slate-200">
            <button onClick={() => { setTab("list"); setEditMode(false); setForm(EMPTY); }}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              <span className="flex items-center gap-2"><Users size={16}/> Directory</span>
            </button>
            <button onClick={() => { setTab("create"); setEditMode(false); setForm(EMPTY); }}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === "create" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              <span className="flex items-center gap-2"><UserPlus size={16}/> {editMode ? "Edit Client" : "New Client"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── LIST TAB ── */}
      {tab === "list" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchCustomers()}
                placeholder="Search name, phone, email, PAN…"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all shadow-inner"/>
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-slate-50 cursor-pointer shadow-sm font-medium text-slate-700">
              <option value="all">All Statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-slate-50 cursor-pointer shadow-sm font-medium text-slate-700">
              <option value="all">All Insurance Types</option>
              {INSURANCE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <button onClick={fetchCustomers}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm active:scale-95">
              <RefreshCw size={16}/> Search
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-between">
              <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total</p><p className="text-2xl font-black text-slate-800">{customers.length}</p></div>
              <div className="p-3 bg-slate-50 rounded-xl"><Users className="w-5 h-5 text-slate-400"/></div>
            </div>
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm p-5 flex items-center justify-between">
              <div><p className="text-xs font-bold text-emerald-600/80 uppercase tracking-wider mb-1">Active</p><p className="text-2xl font-black text-emerald-700">{customers.filter(c => c.status === "Active").length}</p></div>
              <div className="p-3 bg-emerald-100 rounded-xl"><Shield className="w-5 h-5 text-emerald-600"/></div>
            </div>
            <div className="bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm p-5 flex items-center justify-between">
              <div><p className="text-xs font-bold text-indigo-600/80 uppercase tracking-wider mb-1">Individuals</p><p className="text-2xl font-black text-indigo-700">{customers.filter(c => c.customerType === "Individual").length}</p></div>
              <div className="p-3 bg-indigo-100 rounded-xl"><UserPlus className="w-5 h-5 text-indigo-600"/></div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {fetching ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mb-4"/>
                <span className="font-medium text-sm">Loading customers...</span>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-24">
                <Shield className="w-16 h-16 mx-auto mb-4 text-slate-200"/>
                <h3 className="text-lg font-bold text-slate-700 mb-1">No customers found</h3>
                <p className="text-slate-400 text-sm mb-4">Try adjusting your filters or add a new client.</p>
                <button onClick={() => setTab("create")} className="text-indigo-600 font-bold hover:underline">
                  + Add First Customer
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {["Customer Details", "Contact Info", "Type", "Interest", "Nominee", "Status", ""].map(h => (
                        <th key={h} className="px-5 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {customers.map(c => (
                      <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg shadow-inner">
                              {c.fullName?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{c.fullName}</p>
                              <p className="text-xs font-semibold text-slate-400">{c.gender} · {c.dateOfBirth ? new Date(c.dateOfBirth).toLocaleDateString("en-IN") : "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-700">{c.phone}</p>
                          <p className="text-xs text-slate-500">{c.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">{c.customerType}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${TYPE_BADGE[c.preferredInsuranceType] || "bg-slate-100 text-slate-500"}`}>
                            {c.preferredInsuranceType}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-slate-500">
                          {c.nomineeFullName || "Not provided"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${STATUS_BADGE[c.status]}`}>{c.status}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => setSelected(c)} title="View"
                              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 text-indigo-600 transition shadow-sm">
                              <Eye size={16}/>
                            </button>
                            <button onClick={() => openEdit(c)} title="Edit"
                              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 text-emerald-600 transition shadow-sm">
                              <Edit3 size={16}/>
                            </button>
                            <button onClick={() => handleDelete(c._id)} title="Delete"
                              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-rose-500 transition shadow-sm">
                              <Trash2 size={16}/>
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl">
              <UserPlus className="w-5 h-5 text-indigo-600"/>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">
                {editMode ? `Editing Client: ${selected?.fullName}` : "Client Registration Form"}
              </h3>
              <p className="text-sm text-slate-500 font-medium">Please fill in all mandatory details accurately.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-10">
            {/* Section 1: Personal Info */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="col-span-1 lg:col-span-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1"><Info className="w-4 h-4 text-indigo-500"/> Personal Info</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Basic identity and contact details of the client.</p>
              </div>
              <div className="col-span-1 lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Full Name" required><input required {...f("fullName")} className={inp}/></Field>
                <Field label="Date of Birth" required><input required type="date" {...f("dateOfBirth")} className={inp}/></Field>
                <Field label="Gender" required><select required {...f("gender")} className={inp}>{GENDERS.map(g => <option key={g}>{g}</option>)}</select></Field>
                <Field label="Phone" required><input required {...f("phone")} className={inp}/></Field>
                <Field label="Email Address" required><input required type="email" {...f("email")} className={inp}/></Field>
                <Field label="Occupation"><input {...f("occupation")} className={inp}/></Field>
                <Field label="Annual Income (Rs)"><input type="number" min={0} {...f("annualIncome")} className={inp}/></Field>
              </div>
            </div>

            <hr className="border-slate-100"/>

            {/* Section 2: Identity & Location */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="col-span-1 lg:col-span-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1"><Shield className="w-4 h-4 text-indigo-500"/> Identity & Location</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Official documents and residential address.</p>
              </div>
              <div className="col-span-1 lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Aadhar Number"><input {...f("aadharNumber")} maxLength={14} className={inp}/></Field>
                <Field label="PAN Number"><input {...f("panNumber")} maxLength={10} className={`${inp} uppercase`}/></Field>
                <Field label="Street Address" span={2}><input {...f("address")} className={inp}/></Field>
                <Field label="City"><input {...f("city")} className={inp}/></Field>
                <Field label="State"><input {...f("state")} className={inp}/></Field>
                <Field label="Pincode"><input {...f("pincode")} maxLength={6} className={inp}/></Field>
              </div>
            </div>

            <hr className="border-slate-100"/>

            {/* Section 3: Insurance Profile */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="col-span-1 lg:col-span-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1"><HeartPulse className="w-4 h-4 text-indigo-500"/> Insurance Profile</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Preferences and medical preconditions.</p>
              </div>
              <div className="col-span-1 lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Customer Type">
                  <select {...f("customerType")} className={inp}>{CUSTOMER_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                </Field>
                <Field label="Preferred Product">
                  <select {...f("preferredInsuranceType")} className={inp}>{INSURANCE_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                </Field>
                <Field label="Existing Health Conditions" span={2}>
                  <input {...f("existingConditions")} placeholder="e.g. Diabetes, Hypertension" className={inp}/>
                </Field>
              </div>
            </div>

            <hr className="border-slate-100"/>

            {/* Section 4: Nominee & Remarks */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="col-span-1 lg:col-span-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-indigo-500"/> Nominee & Remarks</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Beneficiary details and internal notes.</p>
              </div>
              <div className="col-span-1 lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Nominee Full Name"><input {...f("nomineeFullName")} className={inp}/></Field>
                <Field label="Relation to Client"><input {...f("nomineeRelation")} className={inp}/></Field>
                <Field label="Nominee Phone"><input {...f("nomineePhone")} className={inp}/></Field>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Internal Remarks</label>
                  <textarea {...f("remarks")} rows={3} className={`${inp} resize-none`} placeholder="Add any specific notes here..."/>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-end">
              <button type="button"
                onClick={() => { setTab("list"); setForm(EMPTY); setEditMode(false); }}
                className="px-6 py-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 transition-all disabled:opacity-50 text-sm active:scale-95">
                {loading ? "Processing..." : editMode ? "Update Client Profile" : "Register Client"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}