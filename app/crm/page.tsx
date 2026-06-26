"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, X, Search, Mail, Phone } from "lucide-react";
import { getCurrentUser, type AppUser } from "@/lib/currentUser";

// ── Types ──────────────────────────────────────────────────────────────────────

type Axis = "A" | "B";
type ContactSource = "manual" | "pipeline" | "lead" | "deal";

type Contact = {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  axis: Axis | null;
  stage: string | null;
  notes: string | null;
  source: ContactSource;
  created_at: string;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const AXIS_A_STAGES = ["Cold","Contacted","Responded","Demo","Proposal","Won"];
const AXIS_B_STAGES = ["Cold","Contacted","NDA Signed","Term Sheet","Contracted","Active"];

const STAGE_COLOR: Record<string, string> = {
  Cold:         "bg-slate-100 text-slate-500",
  Contacted:    "bg-blue-100 text-blue-700",
  Responded:    "bg-violet-100 text-violet-700",
  Demo:         "bg-amber-100 text-amber-700",
  Proposal:     "bg-orange-100 text-orange-700",
  Won:          "bg-green-100 text-green-700",
  "NDA Signed": "bg-indigo-100 text-indigo-700",
  "Term Sheet": "bg-purple-100 text-purple-700",
  Contracted:   "bg-teal-100 text-teal-700",
  Active:       "bg-emerald-100 text-emerald-700",
};

const SOURCE_LABEL: Record<ContactSource, string> = {
  manual:   "Manual",
  pipeline: "Pipeline",
  lead:     "Lead Gen",
  deal:     "Deal",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function avatarColor(name: string) {
  const colors = ["#f59e0b","#3b82f6","#8b5cf6","#10b981","#ef4444","#06b6d4","#f97316","#ec4899"];
  let hash = 0;
  for (const c of name) hash = (hash << 5) - hash + c.charCodeAt(0);
  return colors[Math.abs(hash) % colors.length];
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CRMPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<AppUser | null>(null);
  const [axisFilter, setAxisFilter] = useState<"all" | "A" | "B">("all");
  const [search, setSearch] = useState("");

  // Add contact form
  const [showForm, setShowForm] = useState(false);
  const [fName, setFName] = useState("");
  const [fCompany, setFCompany] = useState("");
  const [fRole, setFRole] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fAxis, setFAxis] = useState<Axis | "">("");
  const [fStage, setFStage] = useState("");
  const [fNotes, setFNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMe(getCurrentUser());
    fetchContacts();
  }, []);

  async function fetchContacts() {
    setLoading(true);
    const res = await fetch("/api/crm/contacts");
    const data = await res.json();
    setContacts(data.contacts ?? []);
    setLoading(false);
  }

  async function addContact() {
    if (!fName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/crm/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fName, company: fCompany || null, role: fRole || null,
        email: fEmail || null, phone: fPhone || null,
        axis: fAxis || null, stage: fStage || null, notes: fNotes || null,
        source: "manual", created_by: me?.id ?? null,
      }),
    });
    const data = await res.json();
    if (data.contact) setContacts((prev) => [data.contact, ...prev]);
    setFName(""); setFCompany(""); setFRole(""); setFEmail(""); setFPhone("");
    setFAxis(""); setFStage(""); setFNotes("");
    setShowForm(false);
    setSaving(false);
  }

  async function deleteContact(id: string) {
    await fetch(`/api/crm/contacts/${id}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  const filtered = useMemo(() => {
    let list = contacts;
    if (axisFilter !== "all") list = list.filter((c) => c.axis === axisFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.company ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [contacts, axisFilter, search]);

  const axisACount = contacts.filter((c) => c.axis === "A").length;
  const axisBCount = contacts.filter((c) => c.axis === "B").length;
  const stageOptions = fAxis === "A" ? AXIS_A_STAGES : fAxis === "B" ? AXIS_B_STAGES : [];

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM</h1>
          <p className="text-slate-500 text-sm mt-1">
            {contacts.length} contacts · Axis A: {axisACount} · Axis B: {axisBCount}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={14} /> Add Contact
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mt-5 mb-6">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {(["all","A","B"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setAxisFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                axisFilter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f === "all" ? `All (${contacts.length})` : f === "A" ? `Axis A (${axisACount})` : `Axis B (${axisBCount})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, company, email…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          {search ? "No contacts match your search." : "No contacts yet. Add one to get started."}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-5 py-3">Name</th>
                  <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Role</th>
                  <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Contact</th>
                  <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3">Axis</th>
                  <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Stage</th>
                  <th className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Source</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: avatarColor(c.name) }}
                        >
                          {initials(c.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{c.name}</div>
                          {c.company && <div className="text-xs text-slate-400">{c.company}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5 text-slate-500 hidden sm:table-cell">
                      {c.role ?? <span className="text-slate-300">—</span>}
                    </td>

                    {/* Contact info */}
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800">
                            <Mail size={11} /> {c.email}
                          </a>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Phone size={11} /> {c.phone}
                          </div>
                        )}
                        {!c.email && !c.phone && <span className="text-slate-300 text-xs">—</span>}
                      </div>
                    </td>

                    {/* Axis */}
                    <td className="px-4 py-3.5">
                      {c.axis ? (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          c.axis === "A" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          Axis {c.axis}
                        </span>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>

                    {/* Stage */}
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      {c.stage ? (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STAGE_COLOR[c.stage] ?? "bg-slate-100 text-slate-500"}`}>
                          {c.stage}
                        </span>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>

                    {/* Source */}
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-slate-400">{SOURCE_LABEL[c.source]}</span>
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => deleteContact(c.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add contact modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="font-bold text-slate-900">Add Contact</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Name *</label>
                <input autoFocus value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Full name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Company</label>
                  <input value={fCompany} onChange={(e) => setFCompany(e.target.value)} placeholder="Company name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Role</label>
                  <input value={fRole} onChange={(e) => setFRole(e.target.value)} placeholder="Job title" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Email</label>
                  <input type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} placeholder="email@company.com" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Phone</label>
                  <input type="tel" value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="+1 234 567 8900" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Axis</label>
                  <select value={fAxis} onChange={(e) => { setFAxis(e.target.value as Axis | ""); setFStage(""); }} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none">
                    <option value="">—</option>
                    <option value="A">Axis A — End Users</option>
                    <option value="B">Axis B — Partners</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Stage</label>
                  <select value={fStage} onChange={(e) => setFStage(e.target.value)} disabled={!fAxis} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none disabled:opacity-40">
                    <option value="">—</option>
                    {stageOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Notes</label>
                <textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} rows={2} placeholder="Optional notes…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none resize-none" />
              </div>
              <button onClick={addContact} disabled={!fName.trim() || saving} className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                {saving ? "Saving…" : "Save Contact"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
