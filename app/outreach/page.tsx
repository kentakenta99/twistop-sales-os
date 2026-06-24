"use client";

import { useState } from "react";
import { prospects } from "@/lib/mockData";
import { Zap, Send, Reply, Clock, CheckCircle2, Circle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { GeneratedSequence } from "@/lib/claude";

// ── Automation status cards ──────────────────────────────────────────────────
const STEPS = [
  {
    num: 1,
    label: "Lead Discovery",
    desc: "CSV import → AI scoring → Supabase",
    status: "ready",
    detail: "Apollo CSV + Claude scoring",
    color: "border-violet-400",
    bg: "bg-violet-50",
    textColor: "text-violet-700",
  },
  {
    num: 2,
    label: "Sequence Planning",
    desc: "New prospect → Claude → 3-step plan",
    status: "ready",
    detail: "100% automated via Claude API",
    color: "border-blue-400",
    bg: "bg-blue-50",
    textColor: "text-blue-700",
  },
  {
    num: 3,
    label: "Outreach Queue",
    desc: "Cron 9am JST → Resend → Webhook",
    status: "pending",
    detail: "Activate: add RESEND_API_KEY",
    color: "border-amber-400",
    bg: "bg-amber-50",
    textColor: "text-amber-700",
  },
];

// ── Mock scheduled queue (shown while Supabase not connected) ────────────────
const MOCK_QUEUE = [
  { id: "q1", company: "Coachella / Goldenvoice",  flag: "🇺🇸", contact: "Alex Rivera",    step: 1, subject: "Your festival + an instant cocktail station?", scheduledAt: "Jun 25, 9am PST",  status: "scheduled" },
  { id: "q2", company: "Live Nation Entertainment", flag: "🇺🇸", contact: "Sarah Chen",      step: 1, subject: "20 venues, one cocktail solution",             scheduledAt: "Jun 25, 9am PST",  status: "scheduled" },
  { id: "q3", company: "Glastonbury Festival",      flag: "🇬🇧", contact: "Emily Eavis",     step: 1, subject: "What if Glasto served cocktails with no bar?",  scheduledAt: "Jun 25, 9am GMT",  status: "scheduled" },
  { id: "q4", company: "Beam Suntory Asia",         flag: "🇯🇵", contact: "Kenji Watanabe",  step: 1, subject: "New spirit-mixer category — APAC rights",       scheduledAt: "Jun 25, 9am JST",  status: "scheduled" },
  { id: "q5", company: "Fuji Rock Festival",        flag: "🇯🇵", contact: "Tanaka Hiroshi",  step: 2, subject: "Still thinking it over, Tanaka-san?",           scheduledAt: "Jun 27, 9am JST",  status: "scheduled" },
  { id: "q6", company: "Ministry of Sound",         flag: "🇬🇧", contact: "James Palumbo",   step: 3, subject: "Last one from me — quick question",            scheduledAt: "Jun 28, 9am GMT",  status: "scheduled" },
];

const statusBadge: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  sent:       "bg-green-100 text-green-700",
  replied:    "bg-violet-100 text-violet-700",
  failed:     "bg-red-100 text-red-700",
};

// ── Component ────────────────────────────────────────────────────────────────
export default function OutreachPage() {
  const [selectedId, setSelectedId] = useState(prospects[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sequence, setSequence] = useState<GeneratedSequence | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const selected = prospects.find((p) => p.id === selectedId)!;

  async function handleGenerate() {
    setIsGenerating(true);
    setSequence(null);
    setError(null);
    setExpandedStep(null);

    try {
      const res = await fetch("/api/outreach/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: selected.company,
          contact: selected.contact,
          country: selected.country,
          segment: selected.segment,
          axis: selected.axis,
          notes: selected.notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Generation failed");
      }

      const data: GeneratedSequence = await res.json();
      setSequence(data);
      setExpandedStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Outreach Automation</h1>
          <p className="text-slate-500 text-sm mt-1">
            3-step automated system — list → plan → send
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Automation Active
        </div>
      </div>

      {/* Step status cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {STEPS.map((s) => (
          <div key={s.num} className={`bg-white rounded-xl border-t-4 ${s.color} border border-slate-200 p-5`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.textColor}`}>
                Step {s.num}
              </div>
              {s.status === "ready" ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : (
                <Circle size={16} className="text-amber-400" />
              )}
            </div>
            <div className="font-semibold text-slate-900 text-sm mb-1">{s.label}</div>
            <div className="text-xs text-slate-500 mb-2">{s.desc}</div>
            <div className={`text-[10px] font-semibold ${s.status === "ready" ? "text-green-600" : "text-amber-600"}`}>
              {s.status === "ready" ? "✓ " : "○ "}{s.detail}
            </div>
          </div>
        ))}
      </div>

      {/* AI Live Demo */}
      <div className="bg-white rounded-xl border border-slate-200 mb-8">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
          <Zap size={15} className="text-amber-500" />
          <span className="font-semibold text-slate-900 text-sm">Live AI Demo — Generate Email Sequence</span>
          <span className="ml-2 text-xs text-slate-400">Powered by Claude claude-sonnet-4-6</span>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4">
            Select a prospect and watch Claude generate a personalized 3-step outreach sequence in real time.
          </p>

          {/* Prospect selector */}
          <div className="flex gap-3 mb-5">
            <select
              value={selectedId}
              onChange={(e) => { setSelectedId(e.target.value); setSequence(null); setError(null); }}
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400/50 bg-white"
            >
              {prospects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.flag} {p.company} — Axis {p.axis} · {p.segment}
                </option>
              ))}
            </select>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
            >
              {isGenerating ? (
                <><Loader2 size={14} className="animate-spin" /> Generating…</>
              ) : (
                <><Zap size={14} /> Generate Sequence</>
              )}
            </button>
          </div>

          {/* Selected prospect summary */}
          <div className="bg-slate-50 rounded-lg px-4 py-3 mb-5 flex gap-4 text-xs text-slate-500">
            <span className="text-base">{selected.flag}</span>
            <span><strong className="text-slate-700">{selected.company}</strong></span>
            <span>Contact: <strong className="text-slate-700">{selected.contact}</strong></span>
            <span>Segment: <strong className="text-slate-700">{selected.segment}</strong></span>
            <span className={`ml-auto font-bold px-2 py-0.5 rounded ${selected.axis === "A" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
              Axis {selected.axis}
            </span>
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 mb-4">
              <strong>Error:</strong> {error}
              {error.includes("ANTHROPIC_API_KEY") && (
                <div className="mt-1 text-xs text-red-500">Add ANTHROPIC_API_KEY to .env.local to enable AI generation.</div>
              )}
            </div>
          )}

          {/* Generated sequence */}
          {sequence && (
            <div className="space-y-3">
              {/* Research summary */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-800">
                <span className="font-semibold text-blue-700">AI Research: </span>
                {sequence.research_summary}
              </div>

              {/* Email steps */}
              {sequence.emails.map((email) => (
                <div key={email.step} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    onClick={() => setExpandedStep(expandedStep === email.step ? null : email.step)}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                      email.step === 1 ? "bg-violet-500" : email.step === 2 ? "bg-blue-500" : "bg-amber-500"
                    }`}>{email.step}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-400 mb-0.5">
                        {email.step === 1 ? "Day 0 — Cold Email" : email.step === 2 ? `Day ${email.send_at_days} — Follow-up` : `Day ${email.send_at_days} — Breakup`}
                      </div>
                      <div className="font-semibold text-slate-800 text-sm truncate">
                        A: &quot;{email.subject_a}&quot;
                      </div>
                    </div>
                    {expandedStep === email.step ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </button>

                  {expandedStep === email.step && (
                    <div className="px-4 py-4 bg-white border-t border-slate-100">
                      <div className="flex gap-4 mb-3 text-xs">
                        <div><span className="text-slate-400">Subject A:</span> <span className="font-semibold text-slate-800">{email.subject_a}</span></div>
                        <div><span className="text-slate-400">Subject B:</span> <span className="font-semibold text-slate-800">{email.subject_b}</span></div>
                      </div>
                      <pre className="text-sm text-slate-700 font-sans whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-lg p-4 border border-slate-100">
                        {email.body}
                      </pre>
                      <div className="flex gap-2 mt-3">
                        <button className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                          <Send size={11} /> Add to Queue
                        </button>
                        <button className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-3 py-1.5 rounded-lg transition-colors">
                          Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Idle state */}
          {!sequence && !isGenerating && !error && (
            <div className="border-2 border-dashed border-slate-200 rounded-xl py-10 text-center text-slate-400 text-sm">
              Select a prospect above and click <strong className="text-slate-600">Generate Sequence</strong> to see Claude write personalized emails live.
            </div>
          )}
        </div>
      </div>

      {/* Outreach Queue */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-900 text-sm">Outreach Queue</span>
            <span className="ml-1 text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{MOCK_QUEUE.length} scheduled</span>
          </div>
          <div className="text-xs text-slate-400">Next cron: Today 9:00 AM JST</div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50 bg-slate-50">
              {["Prospect", "Contact", "Step", "Subject Preview", "Scheduled", "Status"].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_QUEUE.map((row) => (
              <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3">
                  <span className="mr-1.5">{row.flag}</span>
                  <span className="text-xs font-semibold text-slate-800">{row.company}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{row.contact}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    row.step === 1 ? "bg-violet-100 text-violet-700" : row.step === 2 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                  }`}>Step {row.step}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">&quot;{row.subject}&quot;</td>
                <td className="px-4 py-3 text-xs text-slate-400">{row.scheduledAt}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge[row.status]}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
