"use client";

import { useState } from "react";
import { ThumbsUp, Sparkles, CheckCircle2, Clock, Wrench, Lightbulb } from "lucide-react";

type Category = "feature" | "ui" | "crm" | "api" | "analytics";
type Status = "reviewing" | "planned" | "building" | "done";

interface FeedbackItem {
  id: string;
  title: string;
  cat: Category;
  desc: string;
  votes: number;
  status: Status;
  author: string;
  date: string;
  voted: boolean;
}

const CAT_LABELS: Record<Category, string> = {
  feature: "Feature",
  ui: "UI/UX",
  crm: "CRM",
  api: "Integrations",
  analytics: "Analytics",
};

const CAT_COLORS: Record<Category, string> = {
  feature: "bg-emerald-100 text-emerald-700",
  ui: "bg-indigo-100 text-indigo-700",
  crm: "bg-amber-100 text-amber-700",
  api: "bg-blue-100 text-blue-700",
  analytics: "bg-violet-100 text-violet-700",
};

const STATUS_CONFIG: Record<Status, { label: string; cls: string; icon: React.ReactNode }> = {
  reviewing: { label: "Under Review", cls: "bg-yellow-100 text-yellow-800", icon: <Clock size={10} /> },
  planned:   { label: "Planned",      cls: "bg-blue-100 text-blue-800",   icon: <Lightbulb size={10} /> },
  building:  { label: "Building",     cls: "bg-green-100 text-green-800", icon: <Wrench size={10} /> },
  done:      { label: "Shipped ✓",    cls: "bg-slate-100 text-slate-600", icon: <CheckCircle2 size={10} /> },
};

const INITIAL_DATA: FeedbackItem[] = [
  { id:"f1", title:"Bulk email sequence from Pipeline view", cat:"feature", desc:"Allow selecting multiple leads and launching a drip sequence directly. Currently requires switching to Outreach for each one — very slow for batches.", votes:31, status:"building", author:"Alex K.", date:"2026-06-12", voted:false },
  { id:"f2", title:"AI-generated icebreaker from LinkedIn bio", cat:"feature", desc:"Feed the prospect's LinkedIn URL and get a personalized first-line suggestion that references something specific they've shared.", votes:24, status:"building", author:"Yuki T.", date:"2026-06-15", voted:false },
  { id:"f3", title:"HubSpot two-way sync", cat:"api", desc:"Changes in TwisTop (stage updates, notes) should reflect in HubSpot automatically. We run both tools and manual copy-paste is costing us 30 min/day.", votes:22, status:"planned", author:"Maria S.", date:"2026-06-18", voted:false },
  { id:"f4", title:"Win/loss reason tagging on deal close", cat:"crm", desc:"When a deal is marked Won or Lost, prompt for a reason tag. Over time this builds pattern data on why we win and lose.", votes:19, status:"planned", author:"David L.", date:"2026-06-20", voted:false },
  { id:"f5", title:"Reply-rate analytics by message template", cat:"analytics", desc:"Show which Outreach templates are getting replies and which aren't. I'm A/B testing manually in spreadsheets right now.", votes:17, status:"reviewing", author:"Sarah M.", date:"2026-06-22", voted:false },
  { id:"f6", title:"Dark mode", cat:"ui", desc:"Long sessions in bright white are tough on the eyes. Would love a dark theme toggle.", votes:14, status:"reviewing", author:"Tom W.", date:"2026-06-24", voted:false },
  { id:"f7", title:"Mobile app (iOS/Android)", cat:"ui", desc:"Quick lead lookup and note-taking on the go between meetings. Doesn't need full functionality.", votes:13, status:"reviewing", author:"Kenji Y.", date:"2026-06-25", voted:false },
  { id:"f8", title:"Slack notifications for deal stage changes", cat:"api", desc:"Post to a Slack channel when a lead moves to Demo or Proposal stage. Keeps the team aligned without everyone checking the dashboard.", votes:11, status:"reviewing", author:"Priya N.", date:"2026-06-26", voted:false },
  { id:"f9", title:"CSV import for bulk lead upload", cat:"feature", desc:"Import 200+ leads from a spreadsheet in one shot instead of entering them one by one.", votes:20, status:"done", author:"Rachel G.", date:"2026-06-01", voted:false },
  { id:"f10", title:"Keyboard shortcuts for Pipeline drag-drop", cat:"ui", desc:"Power users want to move cards without touching the mouse.", votes:9, status:"done", author:"Chris B.", date:"2026-05-25", voted:false },
  { id:"f11", title:"Email open / click tracking", cat:"analytics", desc:"Know when a prospect opened the email so I can time a follow-up call.", votes:16, status:"done", author:"Ling F.", date:"2026-05-18", voted:false },
];

const AI_RESPONSES = [
  "Duplicate check complete — 0 matches found across {n} requests. Categorized as {cat}. Feasibility score: High. Added to roadmap.",
  "Similarity scan: closest match is \"{sim}\" (42% overlap) — flagged as distinct. New entry created under {cat}.",
  "AI moderation passed. No policy conflicts detected. Priority score: 78/100 based on vote velocity. Added to {cat} backlog.",
];

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>(INITIAL_DATA);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<Category>("feature");
  const [desc, setDesc] = useState("");
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  function vote(id: string) {
    setItems(prev => prev.map(f =>
      f.id === id ? { ...f, voted: !f.voted, votes: f.votes + (f.voted ? -1 : 1) } : f
    ));
  }

  function submit() {
    if (!title.trim()) { showToast("Please enter a title."); return; }
    const newItem: FeedbackItem = {
      id: "f" + (items.length + 1),
      title: title.trim(), cat, desc: desc.trim() || "No description provided.",
      votes: 1, status: "reviewing", author: "You", date: "2026-07-01", voted: true,
    };
    setItems(prev => [newItem, ...prev]);
    const msg = AI_RESPONSES[title.length % AI_RESPONSES.length]
      .replace("{n}", String(items.length))
      .replace("{cat}", CAT_LABELS[cat])
      .replace("{sim}", items[1]?.title ?? "existing request");
    showToast("✦ AI: " + msg);
    setTitle(""); setDesc("");
  }

  const filtered = items
    .filter(f => filter === "all" || f.status === filter)
    .sort((a, b) => b.votes - a.votes);

  const stats = {
    total: items.length,
    building: items.filter(f => f.status === "building").length,
    done: items.filter(f => f.status === "done").length,
    votes: items.reduce((s, f) => s + f.votes, 0),
  };

  const filterTabs: Array<{ key: Status | "all"; label: string }> = [
    { key: "all", label: "All" },
    { key: "reviewing", label: "Under Review" },
    { key: "planned", label: "Planned" },
    { key: "building", label: "Building" },
    { key: "done", label: "Shipped" },
  ];

  return (
    <div className="min-h-full bg-slate-50 p-6 space-y-5 max-w-4xl mx-auto">

      {/* Hero */}
      <div className="rounded-xl bg-gradient-to-br from-slate-900 to-blue-900 p-6 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-amber-400" />
          <h1 className="text-lg font-bold">Product Feedback Board</h1>
        </div>
        <p className="text-slate-300 text-sm mb-5">
          You&apos;re building this product with us. Vote on what matters, submit ideas, and watch them ship.
        </p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { n: stats.total, label: "Requests" },
            { n: stats.building, label: "In Dev" },
            { n: stats.done, label: "Shipped" },
            { n: stats.votes, label: "Votes" },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{s.n}</div>
              <div className="text-xs text-slate-400 mt-0.5 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">💡 Submit a Request</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="col-span-2 flex gap-3">
            <input
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              placeholder="e.g. Bulk email from Pipeline view"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
            />
            <select
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              value={cat}
              onChange={e => setCat(e.target.value as Category)}
            >
              {(Object.keys(CAT_LABELS) as Category[]).map(k => (
                <option key={k} value={k}>{CAT_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <textarea
            className="col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none h-20 font-sans"
            placeholder="What problem does this solve? The more context, the better."
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
        </div>
        <button
          onClick={submit}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Sparkles size={14} />
          AI-moderate & Submit
        </button>
      </div>

      {/* Roadmap */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800">📋 Public Roadmap</h2>
          <div className="flex gap-1.5">
            {filterTabs.map(t => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  filter === t.key
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3.5 py-2.5 text-xs text-blue-700 flex items-start gap-2 mb-4">
          <Sparkles size={12} className="mt-0.5 shrink-0 text-blue-500" />
          AI auto-deduplicates, categorizes, and scores every submission before it appears here.
        </div>

        <div className="space-y-2.5">
          {filtered.map(f => {
            const sc = STATUS_CONFIG[f.status];
            return (
              <div key={f.id} className="border border-slate-200 rounded-lg p-3.5 flex gap-3 hover:border-blue-300 transition-colors">
                {/* Vote */}
                <div className="flex flex-col items-center gap-1 min-w-[36px]">
                  <button
                    onClick={() => vote(f.id)}
                    className={`w-8 h-7 rounded border text-sm transition-colors flex items-center justify-center ${
                      f.voted
                        ? "bg-blue-100 border-blue-400 text-blue-600"
                        : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-blue-50 hover:border-blue-300"
                    }`}
                  >
                    <ThumbsUp size={12} />
                  </button>
                  <span className="text-sm font-bold text-slate-800">{f.votes}</span>
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-slate-800">{f.title}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[f.cat]}`}>
                      {CAT_LABELS[f.cat]}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ml-auto ${sc.cls}`}>
                      {sc.icon}{sc.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-1.5">{f.desc}</p>
                  <p className="text-[11px] text-slate-400">{f.author} · {f.date}</p>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center text-slate-400 text-sm py-8">No requests in this category yet.</div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl max-w-md text-center z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
