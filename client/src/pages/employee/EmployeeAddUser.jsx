import React, { useState } from "react";
import toast from "react-hot-toast";
import { UserPlus, Briefcase, CheckCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const LOAN_TYPES = [
  "Personal Loan", "Business Loan",
  "Home Loan - Construction Flat", "Home Loan - Independent House",
  "Home Loan - Plot Purchase", "Home Loan - Plot + Construction",
  "Mortgage Loan - Residential", "Mortgage Loan - Commercial", "Mortgage Loan - Open Plot",
  "Education Loan", "Used Car Loan", "New Car Loan", "Car Refinance"
];

const EMPTY = {
  fullName:   "",
  email:      "",
  phone:      "",
  loanAmount: "",
  loanType:   "Personal Loan",
  leadName:   "",
  remarks:    ""
};

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function EmployeeAddUser() {
  const [form, setForm]       = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const token   = sessionStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    try {
      const res  = await fetch(`${API_URL}/employee/create-client`, {
        method: "POST", headers,
        body: JSON.stringify({
          ...form,
          loanAmount: parseFloat(form.loanAmount)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create");
      toast.success("Loan application submitted!");
      setSuccess({
        name:       data.fullName,
        loanType:   data.loanType,
        loanAmount: data.loanAmount,
        status:     data.status,
        createdAt:  data.createdAt
      });
      setForm(EMPTY);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const field = (label, key, props = {}) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>
      <input
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        {...props}
      />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800">New Loan Application</h2>

      {/* Success Banner */}
      {success && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-blue-700 font-semibold">
            <CheckCircle className="w-5 h-5" /> Application Submitted
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Applicant",    success.name],
              ["Loan Type",    success.loanType],
              ["Loan Amount",  fmt(success.loanAmount)],
              ["Status",       success.status.charAt(0).toUpperCase() + success.status.slice(1)],
              ["Filed On",     new Date(success.createdAt).toLocaleDateString("en-IN")],
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
          <UserPlus className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-700">Applicant & Loan Details</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section: Personal Info */}
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase mb-3 tracking-wider">Personal Information</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {field("Full Name *",     "fullName", { required: true, placeholder: "Ramesh Kumar" })}
              {field("Mobile Number *", "phone",    { required: true, placeholder: "+91 99999 00000" })}
              {field("Email Address *", "email",    { required: true, type: "email", placeholder: "ramesh@email.com" })}
            </div>
          </div>

          {/* Section: Loan Info */}
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase mb-3 tracking-wider">Loan Information</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Loan Type */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Loan Type *</label>
                <select required value={form.loanType}
                  onChange={e => setForm({ ...form, loanType: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                  {LOAN_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              {field("Loan Amount (₹) *", "loanAmount", {
                required: true, type: "number", min: 1000, placeholder: "500000"
              })}
              {field("Lead / Source Name", "leadName", { placeholder: "e.g. Walk-in, Online, Agent" })}
            </div>
          </div>

          {/* Loan Amount preview */}
          {form.loanAmount && parseFloat(form.loanAmount) > 0 && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-blue-700">
                Applying for <strong>{fmt(parseFloat(form.loanAmount))}</strong> under{" "}
                <strong>{form.loanType}</strong>
              </p>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Remarks / Notes</label>
            <textarea value={form.remarks}
              onChange={e => setForm({ ...form, remarks: e.target.value })}
              rows={3} placeholder="Employment details, property info, purpose of loan…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm">
            {loading ? "Submitting…" : "Submit Loan Application"}
          </button>
        </form>
      </div>
    </div>
  );
}