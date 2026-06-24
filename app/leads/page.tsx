"use client";

import { useState } from "react";
import { prospects, type Axis } from "@/lib/mockData";
import { Search, Mail, ExternalLink } from "lucide-react";

const stageBadge: Record<string, string> = {
  Cold:          "bg-slate-100 text-slate-600",
  Contacted:     "bg-blue-100 text-blue-700",
  Responded:     "bg-violet-100 text-violet-700",
  Demo:          "bg-amber-100 text-amber-700",
  Proposal:      "bg-orange-100 text-orange-700",
  Won:           "bg-green-100 text-green-700",
  "NDA Signed":  "bg-indigo-100 text-indigo-700",
  "Term Sheet":  "bg-purple-100 text-purple-700",
  Contracted:    "bg-teal-100 text-teal-700",
  Active:        "bg-green-100 text-green-700",
};

type FilterAxis = "all" | Axis;

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [axisFilter, setAxisFilter] = useState<FilterAxis>("all");

  const filtered = prospects.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.company.toLowerCase().includes(q) ||
      p.contact.toLowerCase().includes(q) ||
      p.country.toLowerCase().includes(q) ||
      p.segment.toLowerCase().includes(q);
    const matchAxis = axisFilter === "all" || p.axis === axisFilter;
    return matchSearch && matchAxis;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500 text-sm mt-1">{prospects.length} prospects in system</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          + Add Lead
        </button>
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search companies, contacts, countries…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 bg-white"
          />
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(["all", "A", "B"] as FilterAxis[]).map((f) => (
            <button
              key={f}
              onClick={() => setAxisFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                axisFilter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              {f === "all" ? "All" : `Axis ${f}`}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 ml-auto">{filtered.length} results</div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Company", "Contact", "Axis", "Segment", "Stage", "Score", "Last Contact", ""].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{p.flag}</span>
                    <div>
                      <div className="font-semibold text-slate-900 text-xs">{p.company}</div>
                      <div className="text-[11px] text-slate-400">{p.country}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs font-medium text-slate-700">{p.contact}</div>
                  <div className="text-[11px] text-slate-400">{p.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] font-bold px-2 py-1 rounded ${
                    p.axis === "A" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    Axis {p.axis}
                  </span>
                </td>
                <td className="px-4 py-3 text-[11px] text-slate-500">{p.segment}</td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${stageBadge[p.stage]}`}>
                    {p.stage}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-14 bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          p.score >= 85 ? "bg-green-400" : p.score >= 70 ? "bg-amber-400" : "bg-slate-300"
                        }`}
                        style={{ width: `${p.score}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600">{p.score}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[11px] text-slate-400">{p.lastContacted || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800 transition-colors">
                      <Mail size={13} />
                    </button>
                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-14 text-slate-400 text-sm">No leads match your search.</div>
        )}
      </div>
    </div>
  );
}
