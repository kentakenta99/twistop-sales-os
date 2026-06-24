"use client";

import { useState } from "react";
import { prospects, AXIS_A_STAGES, AXIS_B_STAGES, type Axis } from "@/lib/mockData";

const stageBorderColors: Record<string, string> = {
  Cold:        "border-t-slate-300",
  Contacted:   "border-t-blue-400",
  Responded:   "border-t-violet-400",
  Demo:        "border-t-amber-400",
  Proposal:    "border-t-orange-400",
  Won:         "border-t-green-500",
  "NDA Signed":   "border-t-indigo-400",
  "Term Sheet":   "border-t-purple-400",
  Contracted:  "border-t-teal-400",
  Active:      "border-t-green-500",
};

const scoreBarColor = (score: number) =>
  score >= 85 ? "bg-green-400" : score >= 70 ? "bg-amber-400" : "bg-slate-300";

export default function PipelinePage() {
  const [axis, setAxis] = useState<Axis>("A");
  const stages = axis === "A" ? AXIS_A_STAGES : AXIS_B_STAGES;

  return (
    <div className="p-8 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pipeline</h1>
          <p className="text-slate-500 text-sm mt-1">
            {prospects.filter((p) => p.axis === axis).length} deals ·{" "}
            {axis === "A" ? "Event companies & end users" : "Distribution partners"}
          </p>
        </div>

        {/* Axis toggle */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setAxis("A")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              axis === "A"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Axis A — End Users
          </button>
          <button
            onClick={() => setAxis("B")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              axis === "B"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Axis B — Partners
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-3 overflow-x-auto pb-4 flex-1 items-start">
        {stages.map((stage) => {
          const cards = prospects.filter((p) => p.axis === axis && p.stage === stage);
          return (
            <div key={stage} className="flex-shrink-0 w-48">
              {/* Column header */}
              <div
                className={`bg-white rounded-xl border border-slate-200 border-t-[3px] ${stageBorderColors[stage]}`}
              >
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{stage}</span>
                  <span className="text-[11px] bg-slate-100 text-slate-500 rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 min-h-28">
                  {cards.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-lg p-3 border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-1.5 mb-2">
                        <span className="text-sm leading-none mt-0.5">{p.flag}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 leading-snug">{p.company}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">{p.contact}</div>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 bg-slate-100 rounded-full h-1">
                          <div
                            className={`${scoreBarColor(p.score)} h-1 rounded-full`}
                            style={{ width: `${p.score}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">{p.score}</span>
                      </div>

                      {p.notes && (
                        <div className="mt-2 text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                          {p.notes}
                        </div>
                      )}
                    </div>
                  ))}

                  {cards.length === 0 && (
                    <div className="text-[11px] text-slate-300 text-center py-6">Empty</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
