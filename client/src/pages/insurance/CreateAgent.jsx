import React, { useState } from "react";
import toast from "react-hot-toast";

const CreateAgent = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "password123" });
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/admin/create-agent`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to register agent");

      toast.success("Insurance Agent Registered Successfully!");
      setFormData({ name: "", email: "", password: "password123" });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Register New Agent (Insurance)</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4">
        <input 
          placeholder="Full Agent Name" 
          value={formData.name} 
          onChange={(e) => setFormData({...formData, name: e.target.value})} 
          required className="w-full p-2 border rounded-lg" 
        />
        <input 
          type="email" 
          placeholder="Agent Email" 
          value={formData.email} 
          onChange={(e) => setFormData({...formData, email: e.target.value})} 
          required className="w-full p-2 border rounded-lg" 
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg hover:bg-emerald-700"
        >
          {loading ? "Processing..." : "Register Agent"}
        </button>
      </form>
    </div>
  );
};

export default CreateAgent;