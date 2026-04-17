import React, { useState, useEffect } from "react";
import { Search, Filter, Edit, Trash2, CheckCircle, Clock, FileText, XCircle, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

// Safely parse the API URL to prevent double '/api' slashes
const RAW_API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = RAW_API.endsWith('/api') ? RAW_API.slice(0, -4) : RAW_API;

const getStatusBadge = (status) => {
  switch (status) {
    case "Approved": return <span className="flex w-fit items-center gap-1 text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle size={14}/> Approved</span>;
    case "Pending": return <span className="flex w-fit items-center gap-1 text-amber-700 bg-amber-100 px-3 py-1 rounded-full text-xs font-bold"><Clock size={14}/> Pending</span>;
    case "Under Review": return <span className="flex w-fit items-center gap-1 text-blue-700 bg-blue-100 px-3 py-1 rounded-full text-xs font-bold"><FileText size={14}/> Under Review</span>;
    case "Rejected": return <span className="flex w-fit items-center gap-1 text-rose-700 bg-rose-100 px-3 py-1 rounded-full text-xs font-bold"><XCircle size={14}/> Rejected</span>;
    default: return <span className="text-slate-700 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
  }
};

const AdminLoanManagement = () => {
  const [loans, setLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchAllLoans();
  }, []);

  const fetchAllLoans = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/loan/users/applications/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setLoans(response.data.data);
      }
    } catch (error) {
      console.error("Fetch Loans Error:", error);
      toast.error("Failed to load loan applications");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedLoan) return;
    setUpdating(true);
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/loan/users/applications/${selectedLoan.loanId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update local state instantly without refetching
        setLoans(prev => prev.map(l => l.loanId === selectedLoan.loanId ? { ...l, status: newStatus } : l));
        toast.success(`Loan successfully updated to ${newStatus}`);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Update Status Error:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (loanId) => {
    if (!window.confirm("Are you sure you want to permanently delete this application? This action cannot be undone.")) return;
    
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${API_URL}/api/loan/users/applications/${loanId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from UI instantly
      setLoans(loans.filter(l => l.loanId !== loanId));
      toast.success("Application deleted successfully");
    } catch (error) {
      console.error("Delete Loan Error:", error);
      toast.error(error.response?.data?.message || "Failed to delete application");
    }
  };

  // Filter Logic
  const filteredLoans = loans.filter(loan => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch = 
      (loan.client && loan.client.toLowerCase().includes(searchString)) || 
      (loan.employee && loan.employee.toLowerCase().includes(searchString)) ||
      (loan.loanId && loan.loanId.toLowerCase().includes(searchString));
      
    const matchesFilter = filterStatus === "All" || loan.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 bg-slate-50 min-h-screen relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Loan Management Dashboard</h1>
          <p className="text-slate-500 font-medium">Oversee all loan applications, search by specific employee, and update statuses.</p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <Search className="text-slate-400 shrink-0" size={20} />
            <input 
              type="text" 
              placeholder="Search by Loan ID, Client Name, or Employee Name..." 
              className="w-full outline-none text-slate-700 bg-transparent font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3 w-full md:w-64 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <Filter className="text-slate-400 shrink-0" size={20} />
            <select 
              className="w-full outline-none text-slate-700 bg-transparent cursor-pointer font-bold"
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wider">
                <th className="p-5 font-bold">Loan ID</th>
                <th className="p-5 font-bold">Assigned Employee</th>
                <th className="p-5 font-bold">Client Name</th>
                <th className="p-5 font-bold">Loan Details</th>
                <th className="p-5 font-bold">Status</th>
                <th className="p-5 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr>
                   <td colSpan="6" className="p-12 text-center text-slate-400 font-medium">
                     <Loader2 className="animate-spin mx-auto mb-3 text-indigo-500" size={32} />
                     Fetching Loan Applications...
                   </td>
                 </tr>
              ) : filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => (
                  <tr key={loan._id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-sm group">
                    <td className="p-5 font-bold text-indigo-600">{loan.loanId}</td>
                    <td className="p-5 text-slate-800 font-bold">{loan.employee || 'Unassigned'}</td>
                    <td className="p-5 text-slate-600 font-medium">{loan.client}</td>
                    <td className="p-5">
                      <div className="font-extrabold text-slate-800 text-base">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(loan.amount)}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">{loan.type}</div>
                    </td>
                    <td className="p-5">{getStatusBadge(loan.status)}</td>
                    <td className="p-5 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setSelectedLoan(loan); setNewStatus(loan.status); setIsModalOpen(true); }}
                          className="p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                          title="Update Status"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(loan.loanId)}
                          className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                          title="Delete Application"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500 font-medium">
                    No loan applications match your search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Status Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-slate-800 mb-1">Update Status</h2>
            <p className="text-sm text-slate-500 font-medium mb-6">Modify the current status of this application.</p>
            
            <div className="bg-slate-50 p-5 rounded-2xl mb-6 border border-slate-100 text-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Loan ID</span> 
                <span className="font-bold text-indigo-600">{selectedLoan?.loanId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Employee</span> 
                <span className="font-bold text-slate-800">{selectedLoan?.employee}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Client</span> 
                <span className="font-bold text-slate-800">{selectedLoan?.client}</span>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Status</label>
              <select 
                className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-slate-700 shadow-sm"
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
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="flex-1 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                disabled={updating}
              >
                Cancel
              </button>
              <button 
                onClick={handleStatusUpdate} 
                disabled={updating}
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating ? <Loader2 className="animate-spin" size={18} /> : null}
                {updating ? "Saving..." : "Save Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLoanManagement;