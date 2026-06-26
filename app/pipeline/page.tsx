"use client";

import { useState } from "react";
import { CalendarPlus, UserPlus, X, CheckCircle } from "lucide-react";
import { prospects, AXIS_A_STAGES, AXIS_B_STAGES, type Axis, type Prospect } from "@/lib/mockData";
import { getCurrentUser } from "@/lib/currentUser";

// ── Constants ──────────────────────────────────────────────────────────────────

const stageBorderColors: Record<string, string> = {
  Cold:           "border-t-slate-300",
  Contacted:      "border-t-blue-400",
  Responded:      "border-t-violet-400",
  Demo:           "border-t-amber-400",
  Proposal:       "border-t-orange-400",
  Won:            "border-t-green-500",
  "NDA Signed":   "border-t-indigo-400",
  "Term Sheet":   "border-t-purple-400",
  Contracted:     "border-t-teal-400",
  Active:         "border-t-green-500",
};

const STAGE_TO_EVENT_TYPE: Record<string, string> = {
  Cold:         "first_meet",
  Contacted:    "first_meet",
  Responded:    "negotiation",
  Demo:         "negotiation",
  Proposal:     "negotiation",
  Won:          "milestone",
  "NDA Signed": "contract_target",
  "Term Sheet": "contract_target",
  Contracted:   "milestone",
  Active:       "milestone",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  first_meet:      "初回 Meet",
  negotiation:     "商談",
  contract_target: "契約目標日",
  general:         "General",
  production:      "製作工程",
  milestone:       "マイルストーン",
};

const scoreBarColor = (score: number) =>
  score >= 85 ? "bg-green-400" : score >= 70 ? "bg-amber-400" : "bg-slate-300";

// ── Main component ─────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [axis, setAxis] = useState<Axis>("A");
  const stages = axis === "A" ? AXIS_A_STAGES : AXIS_B_STAGES;

  // Schedule modal
  const [scheduleTarget, setScheduleTarget] = useState<Prospect | null>(null);
  const [schedDate, setSchedDate] = useState("");
  const [schedType, setSchedType] = useState("first_meet");
  const [schedSaving, setSchedSaving] = useState(false);
  const [schedDone, setSchedDone] = useState(false);

  // CRM save modal
  const [crmTarget, setCrmTarget] = useState<Prospect | null>(null);
  const [crmSaving, setCrmSaving] = useState(false);
  const [crmDone, setCrmDone] = useState(false);

  function openSchedule(p: Prospect) {
    setScheduleTarget(p);
    setSchedDate("");
    setSchedType(STAGE_TO_EVENT_TYPE[p.stage] ?? "first_meet");
    setSchedSaving(false);
    setSchedDone(false);
  }

  function openCRM(p: Prospect) {
    setCrmTarget(p);
    setCrmSaving(false);
    setCrmDone(false);
  }

  async function saveToCalendar() {
    if (!scheduleTarget || !schedDate) return;
    setSchedSaving(true);
    const me = getCurrentUser();
    await fetch("/api/team/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${scheduleTarget.company} — ${scheduleTarget.stage}`,
        event_date: schedDate,
        event_type: schedType,
        description: scheduleTarget.contact ? `Contact: ${scheduleTarget.contact}` : null,
        all_day: true,
        created_by: me?.id ?? null,
      }),
    });
    setSchedSaving(false);
    setSchedDone(true);
  }

  async function saveToCRM() {
    if (!crmTarget) return;
    setCrmSaving(true);
    const me = getCurrentUser();
    await fetch("/api/crm/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: crmTarget.contact,
        company: crmTarget.company,
        email: crmTarget.email,
        axis: crmTarget.axis,
        stage: crmTarget.stage,
        source: "pipeline",
        created_by: me?.id ?? null,
      }),
    });
    setCrmSaving(false);
    setCrmDone(true);
  }

  return (
    <div className="p-4 sm:p-8 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pipeline</h1>
          <p className="text-slate-500 text-sm mt-1">
            {prospects.filter((p) => p.axis === axis).length} deals ·{" "}
            {axis === "A" ? "Event companies & end users" : "Distribution partners"}
          </p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setAxis("A")} className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all ${axis === "A" ? "bg-amber-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
            Axis A — End Users
          </button>
          <button onClick={() => setAxis("B")} className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all ${axis === "B" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
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
              <div className={`bg-white rounded-xl border border-slate-200 border-t-[3px] ${stageBorderColors[stage]}`}>
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{stage}</span>
                  <span className="text-[11px] bg-slate-100 text-slate-500 rounded-full w-5 h-5 flex items-center justify-center font-bold">{cards.length}</span>
                </div>
                <div className="p-2 space-y-2 min-h-28">
                  {cards.map((p) => (
                    <div key={p.id} className="bg-white rounded-lg p-3 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                      <div className="flex items-start gap-1.5 mb-2">
                        <span className="text-sm leading-none mt-0.5">{p.flag}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 leading-snug">{p.company}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">{p.contact}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 bg-slate-100 rounded-full h-1">
                          <div className={`${scoreBarColor(p.score)} h-1 rounded-full`} style={{ width: `${p.score}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">{p.score}</span>
                      </div>
                      {p.notes && (
                        <div className="mt-1.5 text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{p.notes}</div>
                      )}
                      {/* Actions */}
                      <div className="flex gap-1 mt-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => openSchedule(p)}
                          className="flex-1 py-1 text-[10px] text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center gap-0.5 transition-colors"
                          title="Add to Calendar"
                        >
                          <CalendarPlus size={11} /> Cal
                        </button>
                        <button
                          onClick={() => openCRM(p)}
                          className="flex-1 py-1 text-[10px] text-slate-400 hover:text-green-600 hover:bg-green-50 rounded flex items-center justify-center gap-0.5 transition-colors"
                          title="Save to CRM"
                        >
                          <UserPlus size={11} /> CRM
                        </button>
                      </div>
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

      {/* Schedule modal */}
      {scheduleTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Add to Calendar</h2>
              <button onClick={() => setScheduleTarget(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="px-6 py-5">
              {schedDone ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <CheckCircle size={36} className="text-green-500" />
                  <p className="text-slate-700 font-semibold text-center">Added to Calendar!</p>
                  <button onClick={() => setScheduleTarget(null)} className="text-sm text-slate-400 hover:text-slate-600">Close</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl px-4 py-3">
                    <div className="text-xs text-slate-400">Deal</div>
                    <div className="font-semibold text-slate-800 text-sm mt-0.5">{scheduleTarget.company}</div>
                    <div className="text-xs text-slate-500">{scheduleTarget.contact} · {scheduleTarget.stage}</div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Date *</label>
                    <input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Event Type</label>
                    <select value={schedType} onChange={(e) => setSchedType(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none">
                      {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={saveToCalendar} disabled={!schedDate || schedSaving} className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                    {schedSaving ? "Adding…" : "Add to Calendar"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CRM save modal */}
      {crmTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Save to CRM</h2>
              <button onClick={() => setCrmTarget(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="px-6 py-5">
              {crmDone ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <CheckCircle size={36} className="text-green-500" />
                  <p className="text-slate-700 font-semibold text-center">Contact saved to CRM!</p>
                  <button onClick={() => setCrmTarget(null)} className="text-sm text-slate-400 hover:text-slate-600">Close</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1.5">
                    <div className="flex justify-between text-xs"><span className="text-slate-400">Name</span><span className="font-semibold text-slate-800">{crmTarget.contact}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-400">Company</span><span className="text-slate-600">{crmTarget.company}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-400">Email</span><span className="text-slate-600">{crmTarget.email}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-400">Axis / Stage</span><span className="text-slate-600">Axis {crmTarget.axis} · {crmTarget.stage}</span></div>
                  </div>
                  <p className="text-xs text-slate-500 text-center">This contact will be added to CRM with source "Pipeline".</p>
                  <button onClick={saveToCRM} disabled={crmSaving} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                    {crmSaving ? "Saving…" : "Save to CRM"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
