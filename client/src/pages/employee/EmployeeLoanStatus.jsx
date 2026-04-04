import React, { useState, useEffect } from "react";
import { Search, Clock, CheckCircle, XCircle, FileText, Loader2, Plus, Edit, Trash2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const getStatusBadge = (status) => {
  switch (status) {
    case "Approved": return <span className="flex items-center w-fit gap-1 text-green-700 bg-green-100 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle size={14}/> Approved</span>;
    case "Pending": return <span className="flex items-center w-fit gap-1 text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full text-xs font-bold"><Clock size={14}/> Pending</span>;
    case "Under Review": return <span className="flex items-center w-fit gap-1 text-blue-700 bg-blue-100 px-3 py-1 rounded-full text-xs font-bold"><FileText size={14}/> Under Review</span>;
    case "Rejected": return <span className="flex items-center w-fit gap-1 text-red-700 bg-red-100 px-3 py-1 rounded-full text-xs font-bold"><XCircle size={14}/> Rejected</span>;
    default: return <span className="text-gray-700 bg-gray-100 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
  }
};

const EmployeeLoanStatus = () => {
  const [loans, setLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [currentLoan, setCurrentLoan] = useState(null);
  const [formData, setFormData] = useState({ client: "", type: "", amount: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyLoans();
  }, []);

  const fetchMyLoans = async () => {
    try {
      setLoading(true);
      const userStr = sessionStorage.getItem("user");
      if (!userStr) return toast.error("User not found. Please log in.");
      
      const user = JSON.parse(userStr);
      const employeeId = user._id || user.id;

      const API_URL = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${API_URL}/loan/users/applications/employee/${employeeId}`);
      if (response.data.success) setLoans(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch loan applications");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode, loan = null) => {
    setModalMode(mode);
    if (loan) {
      setCurrentLoan(loan);
      setFormData({ client: loan.client, type: loan.type, amount: loan.amount });
    } else {
      setCurrentLoan(null);
      setFormData({ client: "", type: "", amount: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const userStr = sessionStorage.getItem("user");
      const user = JSON.parse(userStr);
      const API_URL = import.meta.env.VITE_API_URL;

      if (modalMode === "add") {
        const payload = {
          ...formData,
          employeeId: user._id || user.id,
          employee: user.name || "Unknown Employee"
        };
        const res = await axios.post(`${API_URL}/loan/users/applications`, payload);
        if (res.data.success) {
          setLoans([res.data.data, ...loans]);
          toast.success("Application created successfully!");
        }
      } else {
        const res = await axios.put(`${API_URL}/loan/users/applications/${currentLoan.loanId}`, formData);
        if (res.data.success) {
          setLoans(loans.map(l => l.loanId === currentLoan.loanId ? res.data.data : l));
          toast.success("Application updated successfully!");
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to save application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (loanId) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      await axios.delete(`${API_URL}/loan/users/applications/${loanId}`);
      setLoans(loans.filter(l => l.loanId !== loanId));
      toast.success("Application deleted");
    } catch (error) {
      toast.error("Failed to delete application");
    }
  };

  const filteredLoans = loans.filter(loan => 
    loan.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
    loan.loanId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Loan Status Tracking</h1>
            <p className="text-slate-500">Track and manage your clients' loan applications.</p>
          </div>
          <button 
            onClick={() => openModal("add")}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow hover:bg-blue-700 transition font-medium"
          >
            <Plus size={18} /> New Application
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by Client Name or Loan ID..." 
            className="w-full outline-none text-slate-700 bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-sm">
                <th className="p-4 font-semibold">Loan ID</th>
                <th className="p-4 font-semibold">Client Name</th>
                <th className="p-4 font-semibold">Loan Type & Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500"><Loader2 className="animate-spin mx-auto" size={24} /></td></tr>
              ) : filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => (
                  <tr key={loan._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm">
                    <td className="p-4 font-medium text-blue-600">{loan.loanId}</td>
                    <td className="p-4 text-slate-800 font-medium">{loan.client}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{loan.amount}</div>
                      <div className="text-xs text-slate-500">{loan.type}</div>
                    </td>
                    <td className="p-4">{getStatusBadge(loan.status)}</td>
                    <td className="p-4 text-center space-x-2">
                      <button 
                        onClick={() => openModal("edit", loan)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(loan.loanId)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No applications found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              {modalMode === "add" ? "New Application" : "Edit Application"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Client Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.client}
                  onChange={(e) => setFormData({...formData, client: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Loan Type</label>
                <select 
                  required
                  className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="" disabled>Select Type</option>
                  <option value="Home Loan">Home Loan</option>
                  <option value="Personal Loan">Personal Loan</option>
                  <option value="Car Loan">Car Loan</option>
                  <option value="Business Loan">Business Loan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Amount</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. $50,000"
                  className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLoanStatus;