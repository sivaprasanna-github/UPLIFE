import { useState, useEffect } from "react";
import { Bell, Clock } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function Notice() {
  const [notices, setNotices] = useState([]);

  const loadNotices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notice/list`);
      const data = await res.json();
      setNotices([...data].reverse());
    } catch (error) {
      console.error("Error loading notices", error);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-3xl mx-auto">

      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
        <Bell className="w-6 h-6 text-blue-500" />
        Notifications
      </h1>

      {notices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400">
          No notifications yet
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-3 p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="bg-blue-50 p-2 rounded-full shrink-0">
                <Bell className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{n.text}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <Clock className="w-3 h-3" />
                  {n.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}