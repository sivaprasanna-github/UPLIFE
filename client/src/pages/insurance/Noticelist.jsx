import React, { useState, useEffect } from "react";
import { Bell, Clock, Plus, Trash2, X, AlertCircle, Megaphone } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

const PRIORITY_STYLES = {
  Low:    "bg-slate-100 text-slate-600 border-slate-200",
  Medium: "bg-indigo-100 text-indigo-700 border-indigo-200",
  High:   "bg-amber-100 text-amber-700 border-amber-200",
  Urgent: "bg-rose-100 text-rose-700 border-rose-200 animate-pulse",
};

export default function NoticeList() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", priority: "Medium" });
  const [saving, setSaving] = useState(false);

  const token = sessionStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/insurance/notices`, { headers });
      const data = await res.json();
      setNotices(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/insurance/notices`, {
        method: "POST", headers, body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Failed to create notice");
      toast.success("Notice broadcasted successfully!");
      setForm({ title: "", message: "", priority: "Medium" });
      setShowForm(false);
      fetchNotices();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notice? It will be removed for everyone.")) return;
    try {
      const res = await fetch(`${API_URL}/insurance/notices/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Notice deleted");
      setNotices(prev => prev.filter(n => n._id !== id));
    } catch {
      toast.error("Could not delete notice");
    }
  };

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 rounded-3xl relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-indigo-600" /> System Notices
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage and broadcast important updates to staff and agents.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow-lg hover:shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Broadcast New Notice
        </button>
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Bell className="w-8 h-8 animate-bounce mb-4 text-indigo-300" />
          <p className="font-medium text-sm">Loading latest announcements...</p>
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-extrabold text-slate-800 mb-2">No Active Notices</h3>
          <p className="text-slate-500 font-medium">There are currently no announcements broadcasted to the system.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {notices.map((notice) => (
            <div key={notice._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col h-full">
              
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-md border ${PRIORITY_STYLES[notice.priority] || PRIORITY_STYLES.Medium}`}>
                  {notice.priority} Priority
                </span>
                <button 
                  onClick={() => handleDelete(notice._id)}
                  className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100 absolute top-4 right-4"
                  title="Delete Notice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 pr-6">{notice.title}</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6 flex-1 whitespace-pre-wrap">
                {notice.message}
              </p>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 mt-auto">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">
                    {notice.createdBy?.name?.charAt(0) || "A"}
                  </div>
                  <span>{notice.createdBy?.name || "Admin"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 
                  {new Date(notice.createdAt).toLocaleDateString("en-IN", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over / Modal for Creating Notice */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-indigo-600" /> Broadcast Notice
                </h3>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center bg-slate-200 hover:bg-rose-100 hover:text-rose-600 rounded-full transition font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Notice Title</label>
                <input 
                  required autoFocus
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="e.g. System Maintenance Scheduled..."
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Detailed Message</label>
                <textarea 
                  required rows={5}
                  value={form.message} 
                  onChange={e => setForm({...form, message: e.target.value})}
                  placeholder="Type the full announcement details here..."
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 focus:bg-white resize-none shadow-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Priority Level</label>
                <div className="grid grid-cols-4 gap-3">
                  {["Low", "Medium", "High", "Urgent"].map(p => (
                    <button 
                      key={p} type="button"
                      onClick={() => setForm({...form, priority: p})}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        form.priority === p 
                          ? PRIORITY_STYLES[p] + " shadow-md scale-105" 
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 transition-all disabled:opacity-50 text-sm active:scale-95 flex justify-center items-center gap-2">
                  {saving ? <span className="animate-pulse">Broadcasting...</span> : "Publish Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}