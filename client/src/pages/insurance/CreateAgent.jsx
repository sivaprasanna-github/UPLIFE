/**
 * CreateAgent.jsx
 *
 * Reads NESTED JSON from:
 *   src/data/India_State_District_Mandal_Village.json
 *
 * JSON shape (nested):
 * [
 *   {
 *     "state": "Andaman & Nicobar Islands",
 *     "districts": [
 *       {
 *         "district": "Nicobars",
 *         "subDistricts": [
 *           {
 *             "subDistrict": "Car Nicobar",   ← this IS the Mandal
 *             "villages": ["Arong", "Big Lapati", ...]
 *           }
 *         ]
 *       }
 *     ]
 *   },
 *   ...
 * ]
 *
 * Agent ID format: {STATECODE}{DISTRICTID:2d}{MANDALID:2d}{VILLAGEID:2d}{SEQ:5d}
 * Example: AP + 01 + 02 + 03 + 00001  →  AP010200300001
 *
 * IDs are zero-padded sequential integers assigned in alphabetical order —
 * stable across reloads and consistent with the backend counter.
 */

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  UserPlus, Users, Copy, CheckCircle,
  MapPin, Phone, ChevronDown, Loader2, Mail, User,
} from "lucide-react";

// ── Import the nested JSON directly (Vite resolves at build time) ─────────────
import RAW_DATA from "../data/data.json";

// ─────────────────────────────────────────────────────────────────────────────
// STATE CODES: full state name → 2-letter official abbreviation
// ─────────────────────────────────────────────────────────────────────────────
const STATE_CODES = {
  "Andhra Pradesh":                           "AP",
  "Arunachal Pradesh":                        "AR",
  "Assam":                                    "AS",
  "Bihar":                                    "BR",
  "Chhattisgarh":                             "CG",
  "Goa":                                      "GA",
  "Gujarat":                                  "GJ",
  "Haryana":                                  "HR",
  "Himachal Pradesh":                         "HP",
  "Jharkhand":                                "JH",
  "Karnataka":                                "KA",
  "Kerala":                                   "KL",
  "Madhya Pradesh":                           "MP",
  "Maharashtra":                              "MH",
  "Manipur":                                  "MN",
  "Meghalaya":                                "ML",
  "Mizoram":                                  "MZ",
  "Nagaland":                                 "NL",
  "Odisha":                                   "OD",
  "Punjab":                                   "PB",
  "Rajasthan":                                "RJ",
  "Sikkim":                                   "SK",
  "Tamil Nadu":                               "TN",
  "Telangana":                                "TS",
  "Tripura":                                  "TR",
  "Uttar Pradesh":                            "UP",
  "Uttarakhand":                              "UK",
  "West Bengal":                              "WB",
  // Union Territories
  "Andaman & Nicobar Islands":                "AN",
  "Andaman and Nicobar Islands":              "AN",
  "Chandigarh":                               "CH",
  "Dadra and Nagar Haveli and Daman and Diu": "DD",
  "Delhi":                                    "DL",
  "Jammu & Kashmir":                          "JK",
  "Jammu and Kashmir":                        "JK",
  "Ladakh":                                   "LA",
  "Lakshadweep":                              "LD",
  "Puducherry":                               "PY",
};

// ─────────────────────────────────────────────────────────────────────────────
// buildLocationData: nested JSON array → lookup map
//
// Input:  Array of state objects (the JSON file)
// Output: {
//   "Telangana": {
//     name: "Telangana",
//     code: "TS",
//     districts: [
//       { id: "01", name: "Hyderabad",
//         mandals: [
//           { id: "01", name: "Secunderabad",
//             villages: [{ id: "01", name: "Bowenpally" }]
//           }
//         ]
//       }
//     ]
//   }
// }
// ─────────────────────────────────────────────────────────────────────────────
function buildLocationData(raw) {
  const pad = (n) => String(n).padStart(2, "0");
  const result = {};

  if (!Array.isArray(raw)) return result;

  // Sort states alphabetically
  const sortedStates = [...raw].sort((a, b) =>
    String(a.state ?? "").localeCompare(String(b.state ?? ""))
  );

  for (const stateObj of sortedStates) {
    const stateName = String(stateObj.state ?? "").trim();
    if (!stateName) continue;

    // 2-letter code — fallback to first 2 chars uppercased if not in map
    const stateCode = STATE_CODES[stateName] ?? stateName.slice(0, 2).toUpperCase();

    // Sort districts alphabetically
    const rawDistricts = Array.isArray(stateObj.districts) ? stateObj.districts : [];
    const sortedDistricts = [...rawDistricts].sort((a, b) =>
      String(a.district ?? "").localeCompare(String(b.district ?? ""))
    );

    const districts = sortedDistricts.map((distObj, dIdx) => {
      const districtName = String(distObj.district ?? "").trim();

      // subDistricts in JSON = Mandals in the app
      const rawMandals = Array.isArray(distObj.subDistricts) ? distObj.subDistricts : [];
      const sortedMandals = [...rawMandals].sort((a, b) =>
        String(a.subDistrict ?? "").localeCompare(String(b.subDistrict ?? ""))
      );

      const mandals = sortedMandals.map((mandalObj, mIdx) => {
        const mandalName = String(mandalObj.subDistrict ?? "").trim();

        // villages is an array of strings
        const rawVillages = Array.isArray(mandalObj.villages) ? mandalObj.villages : [];
        const sortedVillages = [...rawVillages]
          .map((v) => String(v ?? "").trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));

        const villages = sortedVillages.map((villageName, vIdx) => ({
          id:   pad(vIdx + 1),
          name: villageName,
        }));

        return { id: pad(mIdx + 1), name: mandalName, villages };
      });

      return { id: pad(dIdx + 1), name: districtName, mandals };
    });

    result[stateName] = { name: stateName, code: stateCode, districts };
  }

  return result;
}

// ── Built once at module load — zero re-computation on renders ────────────────
const INDIA_DATA = buildLocationData(RAW_DATA);

// Sorted state list for the dropdown
const STATE_LIST = Object.values(INDIA_DATA).sort((a, b) =>
  a.name.localeCompare(b.name)
);

const API_URL = import.meta.env.VITE_API_URL;

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL FORM STATE
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY = {
  firstName:    "",
  lastName:     "",
  email:        "",
  phone:        "",
  password:     "",   // NEW: Custom password
  stateCode:    "",   // 2-letter abbr. e.g. "AP" — sent to backend for ID generation
  stateName:    "",   // full name e.g. "Andhra Pradesh" — used as INDIA_DATA key
  districtId:   "",   // zero-padded e.g. "01"
  districtName: "",
  mandalId:     "",   // zero-padded e.g. "02"
  mandalName:   "",
  villageId:    "",   // zero-padded e.g. "03"
  villageName:  "",
};

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE SELECT FIELD
// ─────────────────────────────────────────────────────────────────────────────
function SelectField({ label, value, onChange, options, placeholder, disabled }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          required
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2.5 pr-9 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CreateAgent() {
  const [form, setForm]       = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents]   = useState([]);
  const [created, setCreated] = useState(null);
  const [copied, setCopied]   = useState(false);

  const token = sessionStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization:  `Bearer ${token}`,
  };

  // ── Cascade derivations — pure (no useState needed) ──────────────────────
  //   form.stateName  = INDIA_DATA key
  //   form.districtId = id string like "01"

  const districts = form.stateName
    ? (INDIA_DATA[form.stateName]?.districts ?? [])
    : [];

  const mandals = form.districtId
    ? (districts.find((d) => d.id === form.districtId)?.mandals ?? [])
    : [];

  const villages = form.mandalId
    ? (mandals.find((m) => m.id === form.mandalId)?.villages ?? [])
    : [];

  // ── Fetch existing agents on mount ───────────────────────────────────────
  const fetchAgents = useCallback(() => {
    fetch(`${API_URL}/admin/agents`, { headers })
      .then((r) => r.json())
      .then((data) => setAgents(Array.isArray(data) ? data : []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  // ── Cascade handlers ─────────────────────────────────────────────────────

  const handleStateChange = (e) => {
    const stateName = e.target.value;                          // full name → INDIA_DATA key
    const stateCode = INDIA_DATA[stateName]?.code ?? "";       // 2-letter code → backend
    setForm((f) => ({
      ...f, stateName, stateCode,
      districtId: "", districtName: "",
      mandalId:   "", mandalName:   "",
      villageId:  "", villageName:  "",
    }));
  };

  const handleDistrictChange = (e) => {
    const districtId   = e.target.value;
    const districtName = districts.find((d) => d.id === districtId)?.name ?? "";
    setForm((f) => ({
      ...f, districtId, districtName,
      mandalId:  "", mandalName:  "",
      villageId: "", villageName: "",
    }));
  };

  const handleMandalChange = (e) => {
    const mandalId   = e.target.value;
    const mandalName = mandals.find((m) => m.id === mandalId)?.name ?? "";
    setForm((f) => ({
      ...f, mandalId, mandalName,
      villageId: "", villageName: "",
    }));
  };

  const handleVillageChange = (e) => {
    const villageId   = e.target.value;
    const villageName = villages.find((v) => v.id === villageId)?.name ?? "";
    setForm((f) => ({ ...f, villageId, villageName }));
  };

  // ── Copy credentials to clipboard ────────────────────────────────────────
  const copyDetails = () => {
    if (!created) return;
    const text = [
      `Name:      ${created.name}`,
      `Email:     ${created.email}`,
      `Phone:     +91 ${created.phone}`,
      `Agent ID:  ${created.agentId}`,
      `Password:  ${created.plainPassword}`,
      `Location:  ${created.location?.villageName}, ${created.location?.mandalName}, ${created.location?.districtName}, ${created.location?.stateName}`,
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.stateCode)    { toast.error("Please select a state");    return; }
    if (!form.districtId)   { toast.error("Please select a district"); return; }
    if (!form.mandalId)     { toast.error("Please select a mandal");   return; }
    if (!form.villageId)    { toast.error("Please select a village");  return; }
    if (form.phone.length !== 10) {
      toast.error("Phone must be 10 digits");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/create-agent`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          firstName:    form.firstName.trim(),
          lastName:     form.lastName.trim(),
          email:        form.email.trim(),
          phone:        form.phone,
          password:     form.password,     // NEW: passing the user-entered password
          stateCode:    form.stateCode,    // e.g. "AP"
          stateName:    form.stateName,    // e.g. "Andhra Pradesh"
          districtId:   form.districtId,   // e.g. "01"
          districtName: form.districtName,
          mandalId:     form.mandalId,     // e.g. "02"
          mandalName:   form.mandalName,
          villageId:    form.villageId,    // e.g. "03"
          villageName:  form.villageName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create agent");

      // Attach the typed password back so the success UI can display/copy it
      data.plainPassword = data.plainPassword || form.password;

      setCreated(data);
      toast.success(`Agent ${data.agentId} registered successfully!`);
      setForm(EMPTY);
      fetchAgents();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

      {/* ══ CREATE FORM ══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">

        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-base">Register New Agent</h2>
            <p className="text-xs text-gray-400">Agent ID is auto-generated after registration</p>
          </div>
        </div>

        {/* Success Banner */}
        {created && (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <p className="text-sm font-bold text-emerald-700">Agent Registered!</p>
                </div>
                <p className="text-xs text-gray-500 mb-2 truncate">
                  {created.name} · {created.email}
                </p>
                <div className="font-mono text-xs space-y-1.5 bg-white rounded-lg p-3 border border-emerald-100">
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-20 shrink-0">Agent ID</span>
                    <span className="font-bold text-emerald-700 tracking-widest break-all">
                      {created.agentId}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-20 shrink-0">Password</span>
                    <span className="font-bold text-orange-600">{created.plainPassword}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-20 shrink-0">Phone</span>
                    <span className="text-gray-700">+91 {created.phone}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-20 shrink-0">Location</span>
                    <span className="text-gray-700 break-words">
                      {created.location?.villageName},{" "}
                      {created.location?.mandalName},{" "}
                      {created.location?.districtName},{" "}
                      {created.location?.stateName}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={copyDetails}
                title="Copy credentials"
                className="flex-shrink-0 flex items-center gap-1 text-xs bg-white border border-gray-200 hover:border-emerald-300 text-gray-600 px-2.5 py-1.5 rounded-lg transition"
              >
                {copied
                  ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Personal Details ─────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
              <User className="w-3 h-3" /> Personal Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  First Name *
                </label>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="First name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Last Name *
                </label>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="Last name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                />
              </div>
            </div>
          </div>

          {/* ── Contact Details & Password ───────────────────────────────── */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email *
                </span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="agent@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone *
                  </span>
                </label>
                <div className="flex">
                  <span className="flex items-center justify-center px-3 border border-r-0 border-gray-200 rounded-l-lg bg-gray-50 text-sm text-gray-500 font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                      }))
                    }
                    placeholder="10-digit number"
                    maxLength={10}
                    className="flex-1 w-full border border-gray-200 rounded-r-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Password *
                </label>
                <input
                  type="text"
                  required
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Enter Agent Password"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                />
              </div>
            </div>
          </div>

          {/* ── Location Hierarchy ───────────────────────────────────────── */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <MapPin className="w-3 h-3" /> Agent Jurisdiction
            </p>
            <div className="grid grid-cols-2 gap-4">

              {/* STATE — value is stateName (full name = INDIA_DATA key) */}
              <SelectField
                label="State *"
                value={form.stateName}
                onChange={handleStateChange}
                placeholder="— Select State —"
                options={STATE_LIST.map((s) => ({ value: s.name, label: s.name }))}
              />

              {/* DISTRICT — value is districtId "01", "02" … */}
              <SelectField
                label="District *"
                value={form.districtId}
                onChange={handleDistrictChange}
                placeholder={form.stateName ? "— Select District —" : "— Select state first —"}
                disabled={!form.stateName}
                options={districts.map((d) => ({ value: d.id, label: d.name }))}
              />

              {/* MANDAL — maps to subDistrict in JSON */}
              <SelectField
                label="Mandal *"
                value={form.mandalId}
                onChange={handleMandalChange}
                placeholder={form.districtId ? "— Select Mandal —" : "— Select district first —"}
                disabled={!form.districtId}
                options={mandals.map((m) => ({ value: m.id, label: m.name }))}
              />

              {/* VILLAGE */}
              <SelectField
                label="Village *"
                value={form.villageId}
                onChange={handleVillageChange}
                placeholder={form.mandalId ? "— Select Village —" : "— Select mandal first —"}
                disabled={!form.mandalId}
                options={villages.map((v) => ({ value: v.id, label: v.name }))}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Register Agent</>
            )}
          </button>
        </form>
      </div>

      {/* ══ EXISTING AGENTS LIST ═════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-700">
            Existing Agents ({agents.length})
          </h3>
        </div>

        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <Users className="w-10 h-10 mb-2" />
            <p className="text-sm">No agents registered yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {agents.map((a) => (
              <div
                key={a._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {a.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{a.name}</p>
                    <p className="text-xs text-gray-500 truncate">{a.email}</p>
                    {a.phone && (
                      <p className="text-xs text-gray-400">+91 {a.phone}</p>
                    )}
                    {a.agentId && (
                      <p className="text-xs font-mono font-bold text-emerald-600 mt-0.5 tracking-widest">
                        {a.agentId}
                      </p>
                    )}
                    {a.location?.districtName && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {a.location.villageName},{" "}
                          {a.location.mandalName},{" "}
                          {a.location.districtName},{" "}
                          {a.location.stateName}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500 flex-shrink-0 ml-2">
                  <p className="font-semibold">{a.policyCount ?? 0} policies</p>
                  <p>{a.claimCount ?? 0} claims</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}