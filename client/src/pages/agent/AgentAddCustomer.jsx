import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  UserPlus, Users, Eye, X, CheckCircle, Search,
  ChevronDown, RefreshCw, Trash2, Edit3, Shield
} from "lucide-react";

// Fallback to localhost if env missing
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
  Life:     "bg-purple-100 text-purple-700",
  Health:   "bg-green-100 text-green-700",
  Auto:     "bg-blue-100 text-blue-700",
  Property: "bg-orange-100 text-orange-700",
  Travel:   "bg-cyan-100 text-cyan-700",
  None:     "bg-gray-100 text-gray-500"
};

const STATUS_BADGE = {
  Active:      "bg-green-100 text-green-700",
  Inactive:    "bg-gray-100 text-gray-500",
  Blacklisted: "bg-red-100 text-red-700"
};

const Field = ({ label, children, required, span }) => (
  <div className={span === 2 ? "col-span-2" : ""}>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white";

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

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchCustomers = async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterType   !== "all") params.set("preferredInsuranceType", filterType);
      if (search)                 params.set("search", search);
      
      const res  = await fetch(`${API_URL}/insurance/customers?${params}`, { headers });
      const text = await res.text();
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Server HTML Response:", text);
        throw new Error("Server returned an invalid response. Check backend logs.");
      }
      
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) { 
      toast.error(err.message || "Failed to load customers"); 
    } finally { 
      setFetching(false); 
    }
  };

  useEffect(() => { fetchCustomers(); }, [filterStatus, filterType]);

  // ── Submit ─────────────────────────────────────────────────────────────────
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
      const text = await res.text();
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("🚨 CRITICAL ERROR:", text);
        if(text.includes("<!DOCTYPE html>")) throw new Error("Backend Route Not Found (404). Check your server.js");
        throw new Error("Server Error. Open console for details.");
      }

      if (!res.ok) throw new Error(data.message || "Failed");

      toast.success(editMode ? "Customer updated!" : "Customer created!");
      setForm(EMPTY);
      setEditMode(false);
      setSelected(null);
      fetchCustomers();
      if (!editMode) setTab("list");
    } catch (err) { 
      toast.error(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await fetch(`${API_URL}/insurance/customers/${id}`, { method: "DELETE", headers });
      toast.success("Deleted");
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Insurance Customers</h2>
          <p className="text-sm text-gray-400 mt-0.5">Register and manage insurance customer profiles</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setTab("list"); setEditMode(false); setForm(EMPTY); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === "list" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            <span className="flex items-center gap-1.5"><Users size={15} /> All Customers ({customers.length})</span>
          </button>
          <button onClick={() => { setTab("create"); setEditMode(false); setForm(EMPTY); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === "create" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            <span className="flex items-center gap-1.5"><UserPlus size={15} /> {editMode ? "Edit Customer" : "New Customer"}</span>
          </button>
        </div>
      </div>

      {tab === "list" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchCustomers()}
                placeholder="Search name, phone, email, PAN…"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="all">All Status</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="all">All Types</option>
              {INSURANCE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <button onClick={fetchCustomers}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition">
              <RefreshCw size={14} /> Search
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
             {[
              { label: "Total",    val: customers.length,                                           color: "bg-white border-gray-100" },
              { label: "Active",   val: customers.filter(c => c.status === "Active").length,        color: "bg-green-50 border-green-100" },
              { label: "Individual", val: customers.filter(c => c.customerType === "Individual").length, color: "bg-emerald-50 border-emerald-100" },
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
            ) : customers.length === 0 ? (
              <div className="text-center py-20">
                <Shield className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 text-sm">No customers found</p>
                <button onClick={() => setTab("create")}
                  className="mt-3 text-emerald-600 text-sm font-semibold hover:underline">
                  + Add First Customer
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Customer", "Contact", "Type", "Insurance Pref", "Nominee", "Status", "Added By", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {customers.map(c => (
                      <tr key={c._id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">
                              {c.fullName?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{c.fullName}</p>
                              <p className="text-xs text-gray-400">{c.gender} · {c.dateOfBirth ? new Date(c.dateOfBirth).toLocaleDateString("en-IN") : "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-700">{c.phone}</p>
                          <p className="text-xs text-gray-400">{c.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{c.customerType}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[c.preferredInsuranceType] || "bg-gray-100 text-gray-500"}`}>
                            {c.preferredInsuranceType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {c.nomineeFullName || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_BADGE[c.status]}`}>{c.status}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{c.createdBy?.name || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setSelected(c)} title="View"
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition">
                              <Eye size={15} />
                            </button>
                            <button onClick={() => openEdit(c)} title="Edit"
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition">
                              <Edit3 size={15} />
                            </button>
                            <button onClick={() => handleDelete(c._id)} title="Delete"
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

      {tab === "create" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-700 text-lg">
              {editMode ? `Editing: ${selected?.fullName}` : "New Insurance Customer"}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-4 pb-1 border-b border-emerald-100">Personal Information</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name" required><input required {...f("fullName")} className={inp} /></Field>
                <Field label="Date of Birth" required><input required type="date" {...f("dateOfBirth")} className={inp} /></Field>
                <Field label="Gender" required><select required {...f("gender")} className={inp}>{GENDERS.map(g => <option key={g}>{g}</option>)}</select></Field>
                <Field label="Phone" required><input required {...f("phone")} className={inp} /></Field>
                <Field label="Email" required><input required type="email" {...f("email")} className={inp} /></Field>
                <Field label="Occupation"><input {...f("occupation")} className={inp} /></Field>
                <Field label="Annual Income (₹)"><input type="number" min={0} {...f("annualIncome")} className={inp} /></Field>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-4 pb-1 border-b border-emerald-100">Address</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Street Address" span={2}><input {...f("address")} className={inp} /></Field>
                <Field label="City"><input {...f("city")} className={inp} /></Field>
                <Field label="State"><input {...f("state")} className={inp} /></Field>
                <Field label="Pincode"><input {...f("pincode")} maxLength={6} className={inp} /></Field>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-4 pb-1 border-b border-emerald-100">KYC / Identity</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Aadhar Number"><input {...f("aadharNumber")} maxLength={14} className={inp} /></Field>
                <Field label="PAN Number"><input {...f("panNumber")} maxLength={10} className={`${inp} uppercase`} /></Field>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-4 pb-1 border-b border-emerald-100">Insurance Details</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Customer Type">
                  <select {...f("customerType")} className={inp}>{CUSTOMER_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                </Field>
                <Field label="Preferred Insurance Type">
                  <select {...f("preferredInsuranceType")} className={inp}>{INSURANCE_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                </Field>
                <Field label="Existing Health Conditions" span={2}>
                  <input {...f("existingConditions")} placeholder="e.g. Diabetes, Hypertension" className={inp} />
                </Field>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-4 pb-1 border-b border-emerald-100">Nominee Details</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nominee Full Name"><input {...f("nomineeFullName")} className={inp} /></Field>
                <Field label="Relation to Nominee"><input {...f("nomineeRelation")} className={inp} /></Field>
                <Field label="Nominee Phone"><input {...f("nomineePhone")} className={inp} /></Field>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Remarks</label>
              <textarea {...f("remarks")} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 text-sm">
                {loading ? "Saving…" : editMode ? "Update Customer" : "Create Customer"}
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