import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { UserPlus, Users, Eye, EyeOff, Copy, CheckCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const EMPTY = { firstName: "", lastName: "", email: "", password: "password123" };

const CreateEmployee = () => {
  const [form, setForm]         = useState(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [employees, setEmployees] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [created, setCreated]   = useState(null); // { name, email, plainPassword }
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
          password: form.password
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      toast.success("Loan Employee Created!");
      setCreated({ name: data.name, email: data.email, plainPassword: data.plainPassword });
      setForm(EMPTY);
      fetchEmployees();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800">Create Loan Employee</h2>

      {/* ── Credential Card (shown after creation) ── */}
      {created && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-blue-700 font-semibold">
            <CheckCircle className="w-5 h-5" />
            Employee created — share these login credentials
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Name</p>
              <p className="font-medium text-gray-800">{created.name}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Email</p>
              <p className="font-medium text-gray-800">{created.email}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-100 col-span-2 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Password</p>
                <p className="font-mono font-medium text-gray-800">
                  {showPass ? created.plainPassword : "••••••••••"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowPass(v => !v)}
                  className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => handleCopy(created.plainPassword)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition">
                  {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-blue-600">⚠ This password won't be shown again. Copy it now.</p>
        </div>
      )}

      {/* ── Form ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <UserPlus className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-700">New Employee Details</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">First Name *</label>
              <input required value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Last Name *</label>
              <input required value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email Address *</label>
            <input type="email" required value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Employee must change this after first login.</p>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? "Creating..." : "Create Employee"}
          </button>
        </form>
      </div>

      {/* ── Employees List ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-700">Existing Loan Employees ({employees.length})</h3>
        </div>
        {employees.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No employees created yet</p>
        ) : (
          <div className="space-y-2">
            {employees.map(e => (
              <div key={e._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                    {e.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{e.name}</p>
                    <p className="text-xs text-gray-500">{e.email}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Loan Dept</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateEmployee;