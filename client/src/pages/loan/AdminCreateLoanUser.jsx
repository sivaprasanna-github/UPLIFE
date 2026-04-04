import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  UserPlus, Users, Eye, X, Search,
  RefreshCw, Trash2, Edit3, Briefcase
} from "lucide-react";

// Fallback to localhost if env variable is missing
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const LOAN_TYPES = [
  "None", "Personal Loan", "Business Loan",
  "Home Loan - Construction Flat", "Home Loan - Independent House",
  "Home Loan - Plot Purchase", "Home Loan - Plot + Construction",
  "Mortgage Loan - Residential", "Mortgage Loan - Commercial", "Mortgage Loan - Open Plot",
  "Education Loan", "Used Car Loan", "New Car Loan", "Car Refinance"
];
const EMPLOYMENT_TYPES = ["Salaried", "Self-Employed", "Business", "Farmer", "Retired", "Other"];
const LEAD_SOURCES     = ["Walk-in", "Online", "Agent Referral", "Employee Referral", "Advertisement", "Other"];
const GENDERS          = ["Male", "Female", "Other"];
const STATUSES         = ["Active", "Inactive", "Blacklisted"];

const EMPTY = {
  fullName: "", dateOfBirth: "", gender: "Male", phone: "", email: "",
  address: "", city: "", state: "", pincode: "",
  aadharNumber: "", panNumber: "",
  employmentType: "Salaried", employerName: "",
  monthlyIncome: "", existingEMIs: "", creditScore: "",
  preferredLoanType: "None",
  requiredLoanAmount: "", propertyValue: "", propertyAddress: "",
  leadSource: "Walk-in", remarks: ""
};

const STATUS_BADGE = {
  Active:      "bg-green-100 text-green-700",
  Inactive:    "bg-gray-100 text-gray-500",
  Blacklisted: "bg-red-100 text-red-700"
};

const fmt = (n) => n ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n) : "—";

const Field = ({ label, children, required, span }) => (
  <div className={span === 2 ? "col-span-2" : ""}>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white";

export default function AdminCreateLoanUser() {
  const [tab, setTab]           = useState("list");
  const [form, setForm]         = useState(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [users, setUsers]       = useState([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilterStatus]     = useState("all");
  const [filterLoanType, setFilterLoanType] = useState("all");
  const [filterEmp, setFilterEmp]           = useState("all");
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const token   = sessionStorage.getItem("token");
  
  // Added Accept: application/json to force backend to return JSON
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
      if (filterLoanType !== "all") params.set("preferredLoanType", filterLoanType);
      if (filterEmp !== "all") params.set("employmentType", filterEmp);
      if (search) params.set("search", search);
      
      const res  = await fetch(`${API_URL}/loan/users?${params}`, { headers });
      const text = await res.text(); // Read text first to prevent JSON crash
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Fetch Users Failed. Server returned:", text);
        throw new Error("Server returned HTML instead of JSON. Check backend logs.");
      }
      
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) { 
      toast.error(err.message || "Failed to load users"); 
    } finally { 
      setFetching(false); 
    }
  };

  useEffect(() => { fetchUsers(); }, [filterStatus, filterLoanType, filterEmp]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        monthlyIncome:      parseFloat(form.monthlyIncome)      || 0,
        existingEMIs:       parseFloat(form.existingEMIs)       || 0,
        creditScore:        parseFloat(form.creditScore)        || 0,
        requiredLoanAmount: parseFloat(form.requiredLoanAmount) || 0,
        propertyValue:      parseFloat(form.propertyValue)      || 0,
      };
      
      const url = editMode && selected
        ? `${API_URL}/loan/users/${selected._id}`
        : `${API_URL}/loan/users/create`;
      const method = editMode ? "PUT" : "POST";

      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const responseText = await res.text(); // Read raw text first
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (err) {
        console.error("🚨 CRITICAL BACKEND ERROR RESPONSE:\n", responseText);
        
        // Detailed error messages based on what the server sent back
        if (responseText.includes("<!DOCTYPE html>")) {
          throw new Error("Backend route not found (404). Did you mount LoanUserRoutes in server.js? Check console.");
        }
        throw new Error(`Server Error (${res.status}): Open console to see the exact error.`);
      }

      if (!res.ok) throw new Error(data.message || "Operation failed");

      toast.success(editMode ? "User updated successfully!" : "Loan user created!");
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

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this loan user?")) return;
    try {
      await fetch(`${API_URL}/loan/users/${id}`, { method: "DELETE", headers });
      toast.success("Deleted successfully");
      setSelected(null);
      fetchUsers();
    } catch { toast.error("Delete failed"); }
  };

  const openEdit = (u) => {
    setForm({
      fullName: u.fullName || "", dateOfBirth: u.dateOfBirth?.slice(0,10) || "",
      gender: u.gender || "Male", phone: u.phone || "", email: u.email || "",
      address: u.address || "", city: u.city || "", state: u.state || "", pincode: u.pincode || "",
      aadharNumber: u.aadharNumber || "", panNumber: u.panNumber || "",
      employmentType: u.employmentType || "Salaried", employerName: u.employerName || "",
      monthlyIncome: u.monthlyIncome || "", existingEMIs: u.existingEMIs || "",
      creditScore: u.creditScore || "",
      preferredLoanType: u.preferredLoanType || "None",
      requiredLoanAmount: u.requiredLoanAmount || "", propertyValue: u.propertyValue || "",
      propertyAddress: u.propertyAddress || "", leadSource: u.leadSource || "Walk-in",
      remarks: u.remarks || ""
    });
    setEditMode(true);
    setSelected(u);
    setTab("create");
  };

  const f = (key) => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) });
  const isPropertyLoan = form.preferredLoanType.includes("Home") || form.preferredLoanType.includes("Mortgage");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Loan Users</h2>
          <p className="text-sm text-gray-400 mt-0.5">Register and manage loan applicant profiles</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setTab("list"); setEditMode(false); setForm(EMPTY); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === "list" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            <span className="flex items-center gap-1.5"><Users size={15} /> All Users ({users.length})</span>
          </button>
          <button onClick={() => { setTab("create"); setEditMode(false); setForm(EMPTY); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === "create" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            <span className="flex items-center gap-1.5"><UserPlus size={15} /> {editMode ? "Edit User" : "New User"}</span>
          </button>
        </div>
      </div>

      {/* ── LIST TAB ── */}
      {tab === "list" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchUsers()}
                placeholder="Search name, phone, PAN, Aadhar…"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              <option value="all">All Status</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              <option value="all">All Employment</option>
              {EMPLOYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <button onClick={fetchUsers}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
              <RefreshCw size={14} /> Search
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Users",    val: users.length,                                      color: "bg-white border-gray-300" },
              { label: "Active",         val: users.filter(u => u.status === "Active").length,   color: "bg-blue-50 border-blue-300" },
              { label: "Inactive",       val: users.filter(u => u.status === "Inactive").length, color: "bg-red-50 border-red-300" },
              { label: "Total Required", val: fmt(users.reduce((s, u) => s + (u.requiredLoanAmount||0), 0)), color: "bg-green-50 border-green-300" },
            ].map(({ label, val, color }) => (
              <div key={label} className={`rounded-xl border p-4 ${color}`}>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{val}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {fetching ? (
              <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>
            ) : users.length === 0 ? (
              <div className="text-center py-20">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 text-sm">No users found</p>
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
                      {["User", "Contact", "Employment", "Loan Type", "Required", "CIBIL", "Lead", "Status", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => (
                      <tr key={u._id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                              {u.fullName?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{u.fullName}</p>
                              <p className="text-xs text-gray-400">{u.gender} · {u.dateOfBirth ? new Date(u.dateOfBirth).toLocaleDateString("en-IN") : "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-700">{u.phone}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700">{u.employmentType}</p>
                          <p className="text-xs text-gray-400">{u.employerName || "—"}</p>
                          <p className="text-xs text-gray-400">{u.monthlyIncome ? `₹${u.monthlyIncome.toLocaleString("en-IN")}/mo` : ""}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {u.preferredLoanType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800 text-sm">{fmt(u.requiredLoanAmount)}</td>
                        <td className="px-4 py-3">
                          {u.creditScore > 0 ? (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              u.creditScore >= 750 ? "bg-green-100 text-green-700"
                              : u.creditScore >= 600 ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                            }`}>{u.creditScore}</span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{u.leadSource}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_BADGE[u.status]}`}>{u.status}</span>
                        </td>
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
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-700 text-lg">
              {editMode ? `Editing: ${selected?.fullName}` : "New Loan User"}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Personal */}
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 pb-1 border-b border-blue-100">Personal Information</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name" required><input required {...f("fullName")} className={inp} /></Field>
                <Field label="Date of Birth" required><input required type="date" {...f("dateOfBirth")} className={inp} /></Field>
                <Field label="Gender" required>
                  <select required {...f("gender")} className={inp}>{GENDERS.map(g => <option key={g}>{g}</option>)}</select>
                </Field>
                <Field label="Phone" required><input required {...f("phone")} className={inp} /></Field>
                <Field label="Email" required><input required type="email" {...f("email")} className={inp} /></Field>
              </div>
            </div>

            {/* Section 2: Address */}
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 pb-1 border-b border-blue-100">Address</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Street Address" span={2}><input {...f("address")} className={inp} /></Field>
                <Field label="City"><input {...f("city")} className={inp} /></Field>
                <Field label="State"><input {...f("state")} className={inp} /></Field>
                <Field label="Pincode"><input {...f("pincode")} maxLength={6} className={inp} /></Field>
              </div>
            </div>

            {/* Section 3: KYC */}
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 pb-1 border-b border-blue-100">KYC / Identity</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Aadhar Number"><input {...f("aadharNumber")} maxLength={14} className={inp} /></Field>
                <Field label="PAN Number"><input {...f("panNumber")} maxLength={10} className={`${inp} uppercase`} /></Field>
              </div>
            </div>

            {/* Section 4: Employment */}
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 pb-1 border-b border-blue-100">Employment & Financial</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Employment Type">
                  <select {...f("employmentType")} className={inp}>{EMPLOYMENT_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                </Field>
                <Field label="Employer / Business Name"><input {...f("employerName")} className={inp} /></Field>
                <Field label="Monthly Income (₹)"><input type="number" min={0} {...f("monthlyIncome")} className={inp} /></Field>
                <Field label="Existing EMIs / month (₹)"><input type="number" min={0} {...f("existingEMIs")} className={inp} /></Field>
                <Field label="CIBIL / Credit Score"><input type="number" min={0} max={900} {...f("creditScore")} className={inp} /></Field>
              </div>
            </div>

            {/* Section 5: Preference */}
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 pb-1 border-b border-blue-100">Loan Preference</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Preferred Loan Type" span={2}>
                  <select {...f("preferredLoanType")} className={inp}>{LOAN_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                </Field>
                <Field label="Required Loan Amount (₹)"><input type="number" min={0} {...f("requiredLoanAmount")} className={inp} /></Field>
                <Field label="Lead Source">
                  <select {...f("leadSource")} className={inp}>{LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}</select>
                </Field>
                {isPropertyLoan && (
                  <>
                    <Field label="Property Value (₹)"><input type="number" min={0} {...f("propertyValue")} className={inp} /></Field>
                    <Field label="Property Address" span={2}><input {...f("propertyAddress")} className={inp} /></Field>
                  </>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Remarks / Notes</label>
              <textarea {...f("remarks")} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm">
                {loading ? "Saving…" : editMode ? "Update User" : "Create Loan User"}
              </button>
              <button type="button" onClick={() => { setTab("list"); setForm(EMPTY); setEditMode(false); }}
                className="px-6 py-3 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}