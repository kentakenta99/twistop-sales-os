"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, CheckSquare, Square, ArrowRight, RefreshCw } from "lucide-react";
import { addGeneratedLeads } from "@/lib/generatedLeads";
import type { Prospect } from "@/lib/mockData";

const REGIONS = ["USA", "UK", "Australia", "Japan", "Singapore", "Germany", "Southeast Asia", "Global"];

const SEGMENTS: Record<string, string[]> = {
  A: ["Music Festival", "Nightclub / Bar", "Corporate Events", "Sports Events", "Esports Events", "Food & Beverage Festival"],
  B: ["Spirits Distributor", "Beverage Wholesaler", "Travel Retail", "Hospitality Supply"],
};

const COUNTS = [5, 10, 15, 20];

const scoreColor = (s: number) =>
  s >= 85 ? "text-green-600" : s >= 70 ? "text-amber-600" : "text-slate-500";
const scoreBg = (s: number) =>
  s >= 85 ? "bg-green-400" : s >= 70 ? "bg-amber-400" : "bg-slate-300";

type GeneratedLead = Prospect & { reasoning?: string; generated?: boolean };

export default function GeneratePage() {
  const router = useRouter();

  const [axis, setAxis] = useState<"A" | "B">("A");
  const [region, setRegion] = useState("USA");
  const [segment, setSegment] = useState(SEGMENTS.A[0]);
  const [count, setCount] = useState(10);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedLead[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  function handleAxisChange(newAxis: "A" | "B") {
    setAxis(newAxis);
    setSegment(SEGMENTS[newAxis][0]);
    setResults([]);
    setSelected(new Set());
  }

  async function generate() {
    setLoading(true);
    setError("");
    setResults([]);
    setSelected(new Set());
    setAdded(false);
    try {
      const res = await fetch("/api/leads/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ axis, region, segment, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResults(data.leads);
      setSelected(new Set(data.leads.map((l: GeneratedLead) => l.id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function toggleAll() {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((l) => l.id)));
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addToPipeline() {
    const toAdd = results.filter((l) => selected.has(l.id));
    addGeneratedLeads(toAdd);
    setAdded(true);
    setTimeout(() => router.push("/leads"), 1200);
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">AI Lead Generator</h1>
        </div>
        <p className="text-slate-500 text-sm ml-11">
          Claude researches real target companies and scores them automatically.
        </p>
      </div>

      {/* Config form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Axis toggle */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
              Target Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleAxisChange("A")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                  axis === "A"
                    ? "bg-amber-500 border-amber-500 text-white"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                Axis A — End Users
              </button>
              <button
                onClick={() => handleAxisChange("B")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                  axis === "B"
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                Axis B — Partners
              </button>
            </div>
          </div>

          {/* Count */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
              Number of Leads
            </label>
            <div className="flex gap-2">
              {COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold border-2 transition-all ${
                    count === n
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Region */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
              Region
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 bg-white"
            >
              {REGIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* Segment */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
              Segment
            </label>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 bg-white"
            >
              {SEGMENTS[axis].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-colors"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Claude is researching {count} companies in {region}…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate {count} leads — {axis === "A" ? "End Users" : "Partners"} · {region} · {segment}
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Results header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-3">
              <button onClick={toggleAll} className="text-slate-400 hover:text-slate-700">
                {selected.size === results.length
                  ? <CheckSquare size={16} className="text-amber-500" />
                  : <Square size={16} />}
              </button>
              <span className="text-sm font-semibold text-slate-700">
                {results.length} companies found · {selected.size} selected
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                axis === "A" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
              }`}>
                Axis {axis} · {region} · {segment}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={generate}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                <RefreshCw size={12} /> Regenerate
              </button>
              <button
                onClick={addToPipeline}
                disabled={selected.size === 0 || added}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 px-4 py-1.5 rounded-lg transition-colors"
              >
                {added ? (
                  "✓ Added! Redirecting…"
                ) : (
                  <><ArrowRight size={12} /> Add {selected.size} to Pipeline</>
                )}
              </button>
            </div>
          </div>

          {/* Leads table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="w-10 px-4 py-2.5"></th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-2.5">Company</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-2.5">Contact</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-2.5">Score</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-2.5">Why TwisTop fits</th>
              </tr>
            </thead>
            <tbody>
              {results.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => toggle(lead.id)}
                  className={`border-b border-slate-50 cursor-pointer transition-colors ${
                    selected.has(lead.id) ? "bg-amber-50/60" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-4 py-3 text-center">
                    {selected.has(lead.id)
                      ? <CheckSquare size={15} className="text-amber-500 mx-auto" />
                      : <Square size={15} className="text-slate-300 mx-auto" />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{lead.flag}</span>
                      <div>
                        <div className="font-semibold text-slate-900 text-xs leading-tight">{lead.company}</div>
                        <div className="text-[10px] text-slate-400">{lead.country}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-slate-700">{lead.contact}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{lead.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-14 bg-slate-100 rounded-full h-1.5">
                        <div className={`${scoreBg(lead.score)} h-1.5 rounded-full`} style={{ width: `${lead.score}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${scoreColor(lead.score)}`}>{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-xs leading-relaxed">
                    {lead.reasoning || lead.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
