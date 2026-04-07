import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Eye, Trash2, Search, MapPin, FilterX } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function CustomersList() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);

  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/customers/all`).then(res => res.json()).then(data => { setCustomers(data); setFiltered(data); }).catch(console.error);
    fetch(`${API_URL}/locations/states`).then(res => res.json()).then(setStates).catch(console.error);
  }, []);

  const applyFilter = (s = state, d = district, m = mandal, id = searchId, name = searchName) => {
    let result = [...customers];
    if (s) result = result.filter(c => c.state === s);
    if (d) result = result.filter(c => c.district === d);
    if (m) result = result.filter(c => c.mandal === m);
    if (id) result = result.filter(c => c.custId.toLowerCase().includes(id.toLowerCase()));
    if (name) result = result.filter(c => c.name.toLowerCase().includes(name.toLowerCase()));
    setFiltered(result);
  };

  const handleState = async (e) => {
    const value = e.target.value; setState(value); setDistrict(""); setMandal(""); setMandals([]);
    const res = await fetch(`${API_URL}/locations/districts?state=${value}`); setDistricts(await res.json());
    applyFilter(value, "", "", searchId, searchName);
  };

  const handleDistrict = async (e) => {
    const value = e.target.value; setDistrict(value); setMandal("");
    const res = await fetch(`${API_URL}/locations/mandals?state=${state}&district=${value}`); setMandals(await res.json());
    applyFilter(state, value, "", searchId, searchName);
  };

  const handleMandal = (e) => { const value = e.target.value; setMandal(value); applyFilter(state, district, value, searchId, searchName); };

  const deleteCustomer = async (id) => {
    if (!confirm("Delete customer permanently?")) return;
    await fetch(`${API_URL}/api/customers/${id}`, { method: "DELETE" });
    const updated = customers.filter((c) => c.custId !== id);
    setCustomers(updated); setFiltered(updated);
  };

  const inputClass = "w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white shadow-inner transition-all";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen rounded-3xl">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Client Directory</h2>
        <p className="text-slate-500 text-sm mt-1 font-medium">Search and filter clients by ID, Name, or specific region.</p>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold">
          <MapPin className="w-5 h-5"/> <h3>Location & ID Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <input className={inputClass} placeholder="Enter Client ID..." value={searchId} onChange={(e) => setSearchId(e.target.value)} />
          <input className={inputClass} placeholder="Enter Full Name..." value={searchName} onChange={(e) => setSearchName(e.target.value)} />
          <select className={`${inputClass} cursor-pointer text-slate-700`} value={state} onChange={handleState}>
            <option value="">All States</option>{states.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className={`${inputClass} cursor-pointer text-slate-700 disabled:opacity-50`} value={district} onChange={handleDistrict} disabled={!state}>
            <option value="">All Districts</option>{districts.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select className={`${inputClass} cursor-pointer text-slate-700 disabled:opacity-50`} value={mandal} onChange={handleMandal} disabled={!district}>
            <option value="">All Mandals</option>{mandals.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex gap-3 mt-5 border-t border-slate-100 pt-5 justify-end">
          <button onClick={() => setFiltered(customers)} className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm">
            <FilterX className="w-4 h-4"/> Reset
          </button>
          <button onClick={() => applyFilter()} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2 text-sm active:scale-95">
            <Search className="w-4 h-4" /> Apply Filters
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-extrabold text-slate-800">Results ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                {["Client ID", "Name", "State", "District", "Mandal", "Actions"].map((h, i) => (
                  <th key={h} className={`p-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider ${i===5 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length ? (
                filtered.map((c) => (
                  <tr key={c.custId} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="p-4 font-mono font-bold text-slate-600 bg-slate-50 rounded m-2 inline-block border border-slate-200 text-xs">{c.custId}</td>
                    <td className="p-4 font-bold text-slate-800">{c.name}</td>
                    <td className="p-4 text-slate-500 font-medium">{c.state}</td>
                    <td className="p-4 text-slate-500 font-medium">{c.district}</td>
                    <td className="p-4 text-slate-500 font-medium">{c.mandal}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => navigate(`/customers/view/${c.custId}`)} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-indigo-50 text-indigo-600 shadow-sm transition">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate(`/customers/edit/${c.custId}`)} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-amber-50 text-amber-600 shadow-sm transition">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteCustomer(c.custId)} className="p-2 rounded-xl bg-white border border-rose-100 hover:bg-rose-50 text-rose-500 shadow-sm transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="text-center py-16 text-slate-400 font-medium">No clients found matching the criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}