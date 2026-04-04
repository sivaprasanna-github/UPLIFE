import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { UserPlus, Users, Eye, EyeOff, Copy, CheckCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
// Password is now blank by default and Phone has been added
const EMPTY = { firstName: "", lastName: "", email: "", phone: "", password: "" };

const CreateEmployee = () => {
  const [form, setForm]         = useState(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [employees, setEmployees] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [created, setCreated]   = useState(null); 
  const [copied, setCopied]     = useState(false);

  const token   = sessionStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchEmployees = () => {
    fetch(`${API_URL}/admin/employees`, { headers })
      .then(r => r.json())
      .then(data => setEmployees(Array.isArray(data) ? data : []));
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setCreated(null);
    try {
      const res  = await fetch(`${API_URL}/admin/create-employee`, {
        method: "POST", headers,
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`,
          email: form.email,
          phone: form.phone, // Adding phone as requested
          password: form.password
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      toast.success("Loan Employee Created!");
      setCreated({ 
        name: data.name, 
        email: data.email, 
        phone: form.phone, 
        plainPassword: data.plainPassword || form.password // fallback just in case backend doesn't echo it
      });
      setForm(EMPTY);
      fetchEmployees();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Create Loan Employee</h2>
        <p className="text-sm text-gray-500 mt-1">Register a new employee to access the loan portal</p>
      </div>

      {/* ── Credential Card (shown after creation) ── */}
      {created && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 text-green-700 font-bold text-lg">
            <CheckCircle className="w-6 h-6" />
            Employee created successfully! Share these login credentials.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4 border border-green-100 shadow-sm">
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Name</p>
              <p className="font-semibold text-gray-800">{created.name}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-100 shadow-sm">
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Email</p>
              <p className="font-semibold text-gray-800">{created.email}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-100 shadow-sm">
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Phone</p>
              <p className="font-semibold text-gray-800">{created.phone || "—"}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-100 shadow-sm sm:col-span-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Password</p>
                <p className="font-mono font-bold text-gray-900 text-lg">
                  {showPass ? created.plainPassword : "••••••••••"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowPass(v => !v)}
                  className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 transition">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <button onClick={() => handleCopy(created.plainPassword)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition shadow-sm">
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs font-semibold text-green-700">⚠ This password won't be shown again. Please copy it now.</p>
        </div>
      )}

      {/* ── Form ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-2.5">
          <UserPlus className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-800">New Employee Details</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">First Name *</label>
              <input required value={form.firstName} placeholder="John"
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Last Name *</label>
              <input required value={form.lastName} placeholder="Doe"
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Email Address *</label>
              <input type="email" required value={form.email} placeholder="john.doe@company.com"
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Phone Number *</label>
              <input type="tel" required value={form.phone} placeholder="9999900000" maxLength={10} minLength={10}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Password *</label>
            <div className="relative max-w-md">
              <input
                required
                type={showPass ? "text" : "password"}
                value={form.password}
                placeholder="Enter a secure password"
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg pl-4 pr-11 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition">
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1.5 font-medium">Employee will use this password to log in for the first time.</p>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading}
              className="w-full sm:w-auto bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-sm">
              {loading ? "Creating Employee..." : "Create Employee"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Employees List ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-8">
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-2.5">
          <Users className="w-5 h-5 text-gray-600" />
          <h3 className="font-bold text-gray-800">Existing Loan Employees ({employees.length})</h3>
        </div>
        <div className="p-6">
          {employees.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6 font-medium">No employees created yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {employees.map(e => (
                <div key={e._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold shadow-sm">
                      {e.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{e.name}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">{e.email}</p>
                      {e.phone && <p className="text-xs text-gray-400 mt-0.5">{e.phone}</p>}
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full font-bold shadow-sm">Loan Dept</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateEmployee;