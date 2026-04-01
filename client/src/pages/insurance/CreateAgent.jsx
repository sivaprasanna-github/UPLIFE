import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { UserPlus, Users, Eye, EyeOff, Copy, CheckCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;
const EMPTY = { name: "", email: "", password: "password123" };

export default function CreateAgent() {
  const [form, setForm]         = useState(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [agents, setAgents]     = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [created, setCreated]   = useState(null); // { name, email, plainPassword }
  const [copied, setCopied]     = useState(false);

  const token   = sessionStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchAgents = () => {
    fetch(`${API_URL}/admin/agents`, { headers })
      .then(r => r.json())
      .then(data => setAgents(Array.isArray(data) ? data : []));
  };

  useEffect(() => { fetchAgents(); }, []);

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
      const res  = await fetch(`${API_URL}/admin/create-agent`, {
        method: "POST", headers, body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Insurance Agent Registered!");
      setCreated({ name: data.name, email: data.email, plainPassword: data.plainPassword });
      setForm(EMPTY);
      fetchAgents();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800">Register Insurance Agent</h2>

      {/* ── Credential Card (shown after creation) ── */}
      {created && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold">
            <CheckCircle className="w-5 h-5" />
            Agent created — share these credentials
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white rounded-lg p-3 border border-emerald-100">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Name</p>
              <p className="font-medium text-gray-800">{created.name}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-emerald-100">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Email</p>
              <p className="font-medium text-gray-800">{created.email}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-emerald-100 col-span-2 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Password</p>
                <p className="font-mono font-medium text-gray-800">
                  {showPass ? created.plainPassword : "••••••••••"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowPass(v => !v)}
                  className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => handleCopy(created.plainPassword)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition">
                  {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-emerald-600">⚠ This password won't be shown again. Copy it now.</p>
        </div>
      )}

      {/* ── Registration Form ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <UserPlus className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-gray-700">New Agent Details</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Full Name *</label>
            <input required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email Address *</label>
            <input type="email" required value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50">
            {loading ? "Registering..." : "Register Agent"}
          </button>
        </form>
      </div>

      {/* ── Existing Agents ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-700">Existing Agents ({agents.length})</h3>
        </div>
        {agents.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No agents registered yet</p>
        ) : (
          <div className="space-y-2">
            {agents.map(a => (
              <div key={a._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                    {a.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.name}</p>
                    <p className="text-xs text-gray-500">{a.email}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>{a.policyCount ?? 0} policies</p>
                  <p>{a.claimCount ?? 0} claims</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}