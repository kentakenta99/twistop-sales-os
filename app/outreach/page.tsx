"use client";

import { useState, useEffect } from "react";
import { prospects as mockProspects } from "@/lib/mockData";
import type { Prospect } from "@/lib/mockData";
import { getGeneratedLeads } from "@/lib/generatedLeads";
import {
  getOutreachPlans,
  upsertOutreachPlan,
  updatePlanStatus,
  deleteOutreachPlan,
  type OutreachPlan,
} from "@/lib/outreachPlans";
import {
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  RefreshCw,
  Trash2,
  Mail,
  Clock,
  Sparkles,
} from "lucide-react";

function LinkedInIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}

const dayLabel = (day: number) =>
  day === 0 ? "Day 0 — Initial outreach" : `Day ${day} — Follow-up`;

const statusBadge: Record<OutreachPlan["status"], string> = {
  draft: "bg-slate-100 text-slate-500",
  approved: "bg-amber-100 text-amber-700",
  sent: "bg-green-100 text-green-700",
};

const statusLabel: Record<OutreachPlan["status"], string> = {
  draft: "Draft",
  approved: "Approved",
  sent: "Sent",
};

export default function OutreachPage() {
  const [allLeads, setAllLeads] = useState<Prospect[]>([]);
  const [plans, setPlans] = useState<OutreachPlan[]>([]);
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<Set<string>>(new Set());
  const [sendingLinkedIn, setSendingLinkedIn] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<Record<string, string>>({});
  const [sendResult, setSendResult] = useState<Record<string, "ok" | "err">>({});

  useEffect(() => {
    setAllLeads([...mockProspects, ...getGeneratedLeads()]);
    setPlans(getOutreachPlans());
  }, []);

  function refreshPlans() {
    setPlans(getOutreachPlans());
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function generatePlan(lead: Prospect) {
    setGenerating((prev) => new Set(prev).add(lead.id));
    setError((prev) => ({ ...prev, [lead.id]: "" }));
    try {
      const res = await fetch("/api/outreach/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          company: lead.company,
          contact: lead.contact,
          email: lead.email,
          country: lead.country,
          segment: lead.segment,
          axis: lead.axis,
          score: lead.score,
          notes: lead.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      upsertOutreachPlan(data.plan);
      refreshPlans();
      setExpanded((prev) => new Set(prev).add(lead.id));
    } catch (e) {
      setError((prev) => ({
        ...prev,
        [lead.id]: e instanceof Error ? e.message : "Something went wrong",
      }));
    } finally {
      setGenerating((prev) => {
        const next = new Set(prev);
        next.delete(lead.id);
        return next;
      });
    }
  }

  function approvePlan(leadId: string) {
    updatePlanStatus(leadId, "approved");
    refreshPlans();
  }

  async function sendEmails(plan: OutreachPlan) {
    setSending((prev) => new Set(prev).add(plan.leadId));
    setSendResult((prev) => ({ ...prev, [plan.leadId]: "ok" }));
    try {
      // Send all 3 steps; Day 0 goes immediately, others are informational for now
      const day0 = plan.steps.find((s) => s.day === 0);
      if (!day0) throw new Error("No Day 0 email in plan");

      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: plan.email,
          subject: day0.subject,
          body: day0.body,
          company: plan.company,
          contact: plan.contact,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      updatePlanStatus(plan.leadId, "sent");
      setSendResult((prev) => ({ ...prev, [plan.leadId]: "ok" }));
      refreshPlans();
    } catch (e) {
      setSendResult((prev) => ({ ...prev, [plan.leadId]: "err" }));
      setError((prev) => ({
        ...prev,
        [plan.leadId]: e instanceof Error ? e.message : "Send failed",
      }));
    } finally {
      setSending((prev) => {
        const next = new Set(prev);
        next.delete(plan.leadId);
        return next;
      });
    }
  }

  async function sendLinkedInDM(plan: OutreachPlan, lead: Prospect) {
    if (!lead.linkedin_url) return;
    setSendingLinkedIn((prev) => new Set(prev).add(plan.leadId));
    setError((prev) => ({ ...prev, [plan.leadId]: "" }));
    try {
      const day0 = plan.steps.find((s) => s.day === 0);
      if (!day0) throw new Error("No Day 0 message in plan");

      // LinkedIn DM はメール本文を短縮して送る（300字目安）
      const dmText = day0.body.slice(0, 300) + (day0.body.length > 300 ? "…" : "");

      const res = await fetch("/api/outreach/linkedin-dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linkedin_url: lead.linkedin_url,
          message: dmText,
          contact: plan.contact,
          company: plan.company,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "LinkedIn DM failed");
      updatePlanStatus(plan.leadId, "sent");
      setSendResult((prev) => ({ ...prev, [plan.leadId]: "ok" }));
      refreshPlans();
    } catch (e) {
      setSendResult((prev) => ({ ...prev, [plan.leadId]: "err" }));
      setError((prev) => ({
        ...prev,
        [plan.leadId]: e instanceof Error ? e.message : "LinkedIn DM failed",
      }));
    } finally {
      setSendingLinkedIn((prev) => {
        const next = new Set(prev);
        next.delete(plan.leadId);
        return next;
      });
    }
  }

  function removePlan(leadId: string) {
    deleteOutreachPlan(leadId);
    refreshPlans();
  }

  const planMap = new Map(plans.map((p) => [p.leadId, p]));
  const draftCount = plans.filter((p) => p.status === "draft").length;
  const approvedCount = plans.filter((p) => p.status === "approved").length;
  const sentCount = plans.filter((p) => p.status === "sent").length;

  const coldLeads = allLeads.filter((l) => l.stage === "Cold");
  const otherPlannedLeads = allLeads.filter(
    (l) => planMap.has(l.id) && l.stage !== "Cold"
  );
  const displayLeads = [...coldLeads, ...otherPlannedLeads];

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Send size={16} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Outreach Planner</h1>
        </div>
        <p className="text-slate-500 text-sm ml-11">
          Claude writes a personalised 3-email sequence per lead. Review, approve, then send.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Cold leads", value: coldLeads.length, color: "text-slate-700" },
          { label: "Plans drafted", value: draftCount, color: "text-slate-700" },
          { label: "Approved", value: approvedCount, color: "text-amber-600" },
          { label: "Sent", value: sentCount, color: "text-green-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 px-5 py-4">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Lead list */}
      <div className="space-y-3">
        {displayLeads.length === 0 && (
          <div className="text-center py-14 text-slate-400 text-sm">
            No leads yet.{" "}
            <a href="/generate" className="text-amber-500 hover:underline font-semibold">
              Generate leads first →
            </a>
          </div>
        )}

        {displayLeads.map((lead) => {
          const plan = planMap.get(lead.id);
          const isGenerating = generating.has(lead.id);
          const isExpanded = expanded.has(lead.id);
          const errMsg = error[lead.id];

          return (
            <div key={lead.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Lead row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <span className="text-xl">{lead.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{lead.company}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      lead.axis === "A" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      Axis {lead.axis}
                    </span>
                    {plan && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge[plan.status]}`}>
                        {statusLabel[plan.status]}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">
                    {lead.contact} · {lead.email}
                  </div>
                </div>

                {/* Score bar */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-12 bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        lead.score >= 85 ? "bg-green-400" : lead.score >= 70 ? "bg-amber-400" : "bg-slate-300"
                      }`}
                      style={{ width: `${lead.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-500">{lead.score}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!plan ? (
                    <button
                      onClick={() => generatePlan(lead)}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {isGenerating ? (
                        <><Loader2 size={12} className="animate-spin" />Writing…</>
                      ) : (
                        <><Sparkles size={12} />Generate Plan</>
                      )}
                    </button>
                  ) : (
                    <>
                      {plan.status === "draft" && (
                        <button
                          onClick={() => approvePlan(lead.id)}
                          className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <CheckCircle size={12} /> Approve
                        </button>
                      )}
                      <button
                        onClick={() => generatePlan(lead)}
                        disabled={isGenerating}
                        title="Regenerate"
                        className="text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      </button>
                      <button
                        onClick={() => removePlan(lead.id)}
                        title="Delete plan"
                        className="text-slate-300 hover:text-red-400 px-2 py-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}

                  {plan && (
                    <button
                      onClick={() => toggleExpand(lead.id)}
                      className="text-slate-400 hover:text-slate-700 px-1"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Error */}
              {errMsg && (
                <div className="px-5 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
                  {errMsg}
                </div>
              )}

              {/* Email sequence accordion */}
              {plan && isExpanded && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {plan.steps.map((step) => (
                    <div key={step.day} className="px-5 py-4 bg-slate-50/50">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        <Clock size={11} />
                        {dayLabel(step.day)}
                      </div>
                      <div className="flex items-start gap-2">
                        <Mail size={13} className="text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-700 mb-1">{step.subject}</div>
                          <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">{step.body}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {plan.status === "approved" && (
                    <div className="px-5 py-3 bg-amber-50/60 flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-xs text-amber-700 font-semibold">
                        ✓ Approved — Day 0 ready to send
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Email送信 */}
                        <button
                          onClick={() => sendEmails(plan)}
                          disabled={sending.has(lead.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-white bg-green-500 hover:bg-green-600 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {sending.has(lead.id) ? (
                            <><Loader2 size={11} className="animate-spin" /> Sending…</>
                          ) : (
                            <><Mail size={11} /> Send Email</>
                          )}
                        </button>
                        {/* LinkedIn DM送信 */}
                        <button
                          onClick={() => sendLinkedInDM(plan, lead)}
                          disabled={sendingLinkedIn.has(lead.id) || !lead.linkedin_url}
                          title={!lead.linkedin_url ? "LinkedIn URL not set for this lead" : "Send LinkedIn DM"}
                          className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#0A66C2] hover:bg-[#004182] disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {sendingLinkedIn.has(lead.id) ? (
                            <><Loader2 size={11} className="animate-spin" /> Sending…</>
                          ) : (
                            <><LinkedInIcon size={11} /> LinkedIn DM</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {plan.status === "sent" && (
                    <div className="px-5 py-3 bg-green-50/60 flex items-center gap-2">
                      <CheckCircle size={13} className="text-green-500" />
                      <span className="text-xs text-green-700 font-semibold">
                        Day 0 sent — follow-ups scheduled at Day 3 &amp; Day 7
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
