import React, { useState } from "react";
import toast from "react-hot-toast";

const CreateEmployee = () => {
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", password: "password123" });
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/admin/create-employee`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create employee");

      toast.success("Loan Employee Registered in DB!");
      setFormData({ firstName: "", lastName: "", email: "", password: "password123" });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Employee (Loan Dept)</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input 
            placeholder="First Name" 
            value={formData.firstName} 
            onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
            required className="p-2 border rounded-lg" 
          />
          <input 
            placeholder="Last Name" 
            value={formData.lastName} 
            onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
            required className="p-2 border rounded-lg" 
          />
        </div>
        <input 
          type="email" 
          placeholder="Email Address" 
          value={formData.email} 
          onChange={(e) => setFormData({...formData, email: e.target.value})} 
          required className="w-full p-2 border rounded-lg" 
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Register Employee"}
        </button>
      </form>
    </div>
  );
};

export default CreateEmployee;