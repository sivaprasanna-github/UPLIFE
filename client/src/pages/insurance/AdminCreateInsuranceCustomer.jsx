import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  UserPlus, Users, Eye, Search,
  RefreshCw, Trash2, Edit3, Shield, Info, CreditCard, HeartPulse
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const INSURANCE_TYPES = ["Life", "Health", "Auto", "Property", "Travel", "None"];
const GENDERS         = ["Male", "Female", "Other"];
const CUSTOMER_TYPES  = ["Individual", "Corporate"];
const STATUSES        = ["Active", "Inactive", "Blacklisted"];

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

export default function AdminCreateInsuranceCustomer() {
  const [tab, setTab]           = useState("list"); 
  const [form, setForm]         = useState(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [customers, setCustomers] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilterStatus]   = useState("all");
  const [filterType, setFilterType]       = useState("all");
  const [selected, setSelected] = useState(null); 
  const [editMode, setEditMode] = useState(false);

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
      const text = await res.text();
      let data = JSON.parse(text);
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
      const url = editMode && selected
        ? `${API_URL}/insurance/customers/${selected._id}`
        : `${API_URL}/insurance/customers/create`;
      const method = editMode ? "PUT" : "POST";

      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");

      toast.success(editMode ? "Customer updated!" : "Customer created!");
      setForm(EMPTY);
      setEditMode(false);
      setSelected(null);
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
      fullName: c.fullName || "", dateOfBirth: c.dateOfBirth?.slice(0,10) || "",
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
    setEditMode(true);
    setSelected(c);
    setTab("create");
  };

  const f = (key) => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 rounded-3xl">
      {/* Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Customer Directory</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage your insurance client profiles and details.</p>
        </div>
        <div className="flex bg-slate-200/60 p-1.5 rounded-xl border border-slate-200">
          <button onClick={() => { setTab("list"); setEditMode(false); setForm(EMPTY); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <span className="flex items-center gap-2"><Users size={16} /> Directory</span>
          </button>
          <button onClick={() => { setTab("create"); setEditMode(false); setForm(EMPTY); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === "create" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <span className="flex items-center gap-2"><UserPlus size={16} /> {editMode ? "Edit Client" : "New Client"}</span>
          </button>
        </div>
      </div>

      {tab === "list" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchCustomers()}
                placeholder="Search name, phone, email, PAN…"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all shadow-inner" />
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
              <RefreshCw size={16} /> Search
            </button>
          </div>

          {/* Stats Summaries */}
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
                <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                <span className="font-medium text-sm">Loading customers...</span>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-24">
                <Shield className="w-16 h-16 mx-auto mb-4 text-slate-200" />
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
                            <button onClick={() => setSelected(c)} title="View" className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 text-indigo-600 transition shadow-sm">
                              <Eye size={16} />
                            </button>
                            <button onClick={() => openEdit(c)} title="Edit" className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 text-emerald-600 transition shadow-sm">
                              <Edit3 size={16} />
                            </button>
                            <button onClick={() => handleDelete(c._id)} title="Delete" className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-rose-500 transition shadow-sm">
                              <Trash2 size={16} />
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

      {tab === "create" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl">
              <UserPlus className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">
                {editMode ? `Editing Client: ${selected?.fullName}` : "Client Registration Form"}
              </h3>
              <p className="text-sm text-slate-500 font-medium">Please fill in all mandatory details accurately.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-10">
            {/* Section 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="col-span-1 lg:col-span-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1"><Info className="w-4 h-4 text-indigo-500"/> Personal Info</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Basic identity and contact details of the client.</p>
              </div>
              <div className="col-span-1 lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Full Name" required><input required {...f("fullName")} className={inp} /></Field>
                <Field label="Date of Birth" required><input required type="date" {...f("dateOfBirth")} className={inp} /></Field>
                <Field label="Gender" required><select required {...f("gender")} className={inp}>{GENDERS.map(g => <option key={g}>{g}</option>)}</select></Field>
                <Field label="Phone" required><input required {...f("phone")} className={inp} /></Field>
                <Field label="Email Address" required><input required type="email" {...f("email")} className={inp} /></Field>
                <Field label="Occupation"><input {...f("occupation")} className={inp} /></Field>
                <Field label="Annual Income (₹)"><input type="number" min={0} {...f("annualIncome")} className={inp} /></Field>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Section 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="col-span-1 lg:col-span-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1"><Shield className="w-4 h-4 text-indigo-500"/> Identity & Location</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Official documents and residential address.</p>
              </div>
              <div className="col-span-1 lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Aadhar Number"><input {...f("aadharNumber")} maxLength={14} className={inp} /></Field>
                <Field label="PAN Number"><input {...f("panNumber")} maxLength={10} className={`${inp} uppercase`} /></Field>
                <Field label="Street Address" span={2}><input {...f("address")} className={inp} /></Field>
                <Field label="City"><input {...f("city")} className={inp} /></Field>
                <Field label="State"><input {...f("state")} className={inp} /></Field>
                <Field label="Pincode"><input {...f("pincode")} maxLength={6} className={inp} /></Field>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Section 3 */}
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
                  <input {...f("existingConditions")} placeholder="e.g. Diabetes, Hypertension" className={inp} />
                </Field>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Section 4 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="col-span-1 lg:col-span-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-indigo-500"/> Nominee & Remarks</h4>
                <p className="text-xs text-slate-500 leading-relaxed">Beneficiary details and internal notes.</p>
              </div>
              <div className="col-span-1 lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Nominee Full Name"><input {...f("nomineeFullName")} className={inp} /></Field>
                <Field label="Relation to Client"><input {...f("nomineeRelation")} className={inp} /></Field>
                <Field label="Nominee Phone"><input {...f("nomineePhone")} className={inp} /></Field>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Internal Remarks</label>
                  <textarea {...f("remarks")} rows={3} className={`${inp} resize-none`} placeholder="Add any specific notes here..." />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-end">
              <button type="button" onClick={() => { setTab("list"); setForm(EMPTY); setEditMode(false); }}
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