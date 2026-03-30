import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Eye, Trash2, Search } from "lucide-react";

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
    fetch(`${API_URL}/api/customers/all`)
      .then((res) => res.json())
      .then((data) => {
        setCustomers(data);
        setFiltered(data);
      })
      .catch(() => alert("Failed to load customers"));

    fetch(`${API_URL}/locations/states`)
      .then((res) => res.json())
      .then(setStates)
      .catch(() => alert("Failed to load states"));
  }, []);

  const applyFilter = (s = state, d = district, m = mandal, id = searchId, name = searchName) => {
    let result = [...customers];
    if (s) result = result.filter((c) => c.state === s);
    if (d) result = result.filter((c) => c.district === d);
    if (m) result = result.filter((c) => c.mandal === m);
    if (id) result = result.filter((c) => c.custId.toLowerCase().includes(id.toLowerCase()));
    if (name) result = result.filter((c) => c.name.toLowerCase().includes(name.toLowerCase()));
    setFiltered(result);
  };

  const handleState = async (e) => {
    const value = e.target.value;
    setState(value);
    setDistrict("");
    setMandal("");
    setMandals([]);
    const res = await fetch(`${API_URL}/locations/districts?state=${value}`);
    setDistricts(await res.json());
    applyFilter(value, "", "", searchId, searchName);
  };

  const handleDistrict = async (e) => {
    const value = e.target.value;
    setDistrict(value);
    setMandal("");
    const res = await fetch(`${API_URL}/locations/mandals?state=${state}&district=${value}`);
    setMandals(await res.json());
    applyFilter(state, value, "", searchId, searchName);
  };

  const handleMandal = (e) => {
    const value = e.target.value;
    setMandal(value);
    applyFilter(state, district, value, searchId, searchName);
  };

  const deleteCustomer = async (id) => {
    if (!confirm("Delete customer?")) return;
    await fetch(`${API_URL}/api/customers/${id}`, { method: "DELETE" });
    const updated = customers.filter((c) => c.custId !== id);
    setCustomers(updated);
    setFiltered(updated);
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* Filter Card */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Search & Filter Customers</h2>
        <div className="grid md:grid-cols-5 gap-3">
          <input
            className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Customer ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <input
            className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Customer Name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <select
            className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={state}
            onChange={handleState}
          >
            <option value="">Select State</option>
            {states.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select
            className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={district}
            onChange={handleDistrict}
            disabled={!state}
          >
            <option value="">Select District</option>
            {districts.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select
            className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={mandal}
            onChange={handleMandal}
            disabled={!district}
          >
            <option value="">Select Mandal</option>
            {mandals.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>

        <div className="flex gap-3 mt-3">
          <button
            onClick={() => applyFilter()}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            <Search className="w-4 h-4" /> Search
          </button>
          <button
            onClick={() => setFiltered(customers)}
            className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Customer Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b bg-gray-50">
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">State</th>
                <th className="p-3">District</th>
                <th className="p-3">Mandal</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((c) => (
                  <tr key={c.custId} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="p-3 text-gray-500">{c.custId}</td>
                    <td className="p-3 font-medium text-gray-700">{c.name}</td>
                    <td className="p-3 text-gray-500">{c.state}</td>
                    <td className="p-3 text-gray-500">{c.district}</td>
                    <td className="p-3 text-gray-500">{c.mandal}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => navigate(`/customers/view/${c.custId}`)}
                          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-blue-600 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/customers/edit/${c.custId}`)}
                          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-yellow-600 transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCustomer(c.custId)}
                          className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}