import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Real state for user input
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Use the env variable, fallback to localhost if missing
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Send the ACTUAL typed email and password to your backend
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // 2. Handle Backend Errors (e.g., wrong password, user not found)
      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password");
      }

      // 3. Store the JWT Token and User Info in Session Storage
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data));

      toast.success(`Welcome back, ${data.name}!`);

      // 4. Navigate based on the REAL role returned from MongoDB
      if (data.role === "admin") {
        navigate("/dashboard");
      } else if (data.role === "employee") {
        navigate("/employee/home");
      } else if (data.role === "agent") {
        navigate("/agent/home");
      } else {
        toast.error("Unknown user role.");
      }
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-full bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 relative z-20">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800">Secure Portal</h2>
          <p className="text-slate-500 mt-2 text-sm">Enter your credentials to access your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-slate-50 focus:bg-white text-slate-700"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-slate-50 focus:bg-white text-slate-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
          >
            {loading ? "Verifying Credentials..." : "Sign In"}
          </button>
        </form>

      </div>
    </div>
  );
};

export default LoginPage;