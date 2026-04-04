import React, { useState, useEffect } from "react";
import { Search, Filter, Edit, Trash2, CheckCircle, Clock, FileText, XCircle, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const getStatusBadge = (status) => {
  switch (status) {
    case "Approved": return <span className="flex w-fit items-center gap-1 text-green-700 bg-green-100 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle size={14}/> Approved</span>;
    case "Pending": return <span className="flex w-fit items-center gap-1 text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full text-xs font-bold"><Clock size={14}/> Pending</span>;
    case "Under Review": return <span className="flex w-fit items-center gap-1 text-blue-700 bg-blue-100 px-3 py-1 rounded-full text-xs font-bold"><FileText size={14}/> Under Review</span>;
    case "Rejected": return <span className="flex w-fit items-center gap-1 text-red-700 bg-red-100 px-3 py-1 rounded-full text-xs font-bold"><XCircle size={14}/> Rejected</span>;
    default: return <span className="text-gray-700 bg-gray-100 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
  }
};

const AdminLoanManagement = () => {
  const [loans, setLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAllLoans();
  }, []);

  const fetchAllLoans = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${API_URL}/loan/users/applications/all`);
      if (response.data.success) setLoans(response.data.data);
    } catch (error) {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedLoan) return;
    try {
      setUpdating(true);
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await axios.put(`${API_URL}/loan/users/applications/${selectedLoan.loanId}/status`, { status: newStatus });

      if (response.data.success) {
        setLoans(prev => prev.map(l => l.loanId === selectedLoan.loanId ? { ...l, status: newStatus } : l));
        toast.success(`Loan updated to ${newStatus}`);
        setIsModalOpen(false);
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (loanId) => {
    if (!window.confirm("Are you sure you want to permanently delete this application?")) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      await axios.delete(`${API_URL}/loan/users/applications/${loanId}`);
      setLoans(loans.filter(l => l.loanId !== loanId));
      toast.success("Application deleted");
    } catch (error) {
      toast.error("Failed to delete application");
    }
  };

  const filteredLoans = loans.filter(loan => {
    // Allows admin to search/group specifically by typing the employee's name
    const matchesSearch = loan.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          loan.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          loan.loanId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "All" || loan.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 bg-slate-50 min-h-screen relative">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Loan Management Dashboard</h1>
        <p className="text-slate-500 mb-8">Oversee all loan applications, search by specific employee, and update statuses.</p>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
            <Search className="text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by ID, Client, or specific Employee..." 
              className="w-full outline-none text-slate-700 bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3 w-full md:w-64">
            <Filter className="text-slate-400" size={20} />
            <select 
              className="w-full outline-none text-slate-700 bg-transparent cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-sm">
                <th className="p-4 font-semibold">Loan ID</th>
                <th className="p-4 font-semibold">Assigned Employee</th>
                <th className="p-4 font-semibold">Client Name</th>
                <th className="p-4 font-semibold">Loan Details</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr><td colSpan="6" className="p-8 text-center text-slate-500"><Loader2 className="animate-spin mx-auto" size={24} /></td></tr>
              ) : filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => (
                  <tr key={loan._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm">
                    <td className="p-4 font-medium text-blue-600">{loan.loanId}</td>
                    <td className="p-4 text-slate-800 font-medium">{loan.employee}</td>
                    <td className="p-4 text-slate-600">{loan.client}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{loan.amount}</div>
                      <div className="text-xs text-slate-500">{loan.type}</div>
                    </td>
                    <td className="p-4">{getStatusBadge(loan.status)}</td>
                    <td className="p-4 text-center space-x-2">
                      <button 
                        onClick={() => { setSelectedLoan(loan); setNewStatus(loan.status); setIsModalOpen(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        title="Update Status"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(loan.loanId)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                        title="Delete Application"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">No loans match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Status Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Update Loan Status</h2>
            <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-100 text-sm">
              <div className="flex justify-between mb-2"><span className="text-slate-500">Employee:</span> <span className="font-medium text-slate-800">{selectedLoan?.employee}</span></div>
              <div className="flex justify-between mb-2"><span className="text-slate-500">Client:</span> <span className="font-medium text-slate-800">{selectedLoan?.client}</span></div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">New Status</label>
              <select 
                className="w-full p-3 border border-slate-300 rounded-lg outline-none"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={handleStatusUpdate} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLoanManagement;