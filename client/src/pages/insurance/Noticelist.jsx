import React, { useState, useEffect } from "react";
import { Bell, Clock, Plus, Trash2, X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

const PRIORITY_STYLES = {
  Low:    "bg-gray-100 text-gray-600",
  Medium: "bg-blue-100 text-blue-700",
  High:   "bg-amber-100 text-amber-700",
  Urgent: "bg-red-100 text-red-700",
};

export default function Noticelist() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", priority: "Medium" });
  const [saving, setSaving] = useState(false);

  const token = sessionStorage.getItem("token");
  const user  = JSON.parse(sessionStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/insurance/notices`, { headers });
      const data = await res.json();
      setNotices(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load notices"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/insurance/notices`, {
        method: "POST", headers, body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Notice published!");
      setNotices(prev => [data, ...prev]);
      setShowForm(false);
      setForm({ title: "", message: "", priority: "Medium" });
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this notice?")) return;
    try {
      await fetch(`${API_URL}/insurance/notices/${id}`, { method: "DELETE", headers });
      setNotices(prev => prev.filter(n => n._id !== id));
      toast.success("Notice deleted");
    } catch { toast.error("Delete failed"); }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Bell className="w-6 h-6 text-emerald-500" /> Notices & Notifications
        </h2>
        {isAdmin && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition">
            <Plus className="w-4 h-4" /> Post Notice
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No notices yet
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map(n => (
            <div key={n._id}
              className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition">
              <div className="bg-emerald-50 p-2 rounded-full shrink-0">
                <Bell className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-gray-800 text-sm">{n.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_STYLES[n.priority] || "bg-gray-100 text-gray-600"}`}>
                    {n.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{n.message}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1.5">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                    {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  {n.createdBy?.name && <span>By {n.createdBy.name}</span>}
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(n._id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Notice Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-lg text-gray-800">Post New Notice</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Title *</label>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Message *</label>
                <textarea required rows={3} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Priority</label>
                <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                  {["Low","Medium","High","Urgent"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50">
                {saving ? "Publishing..." : "Publish Notice"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}