"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Radar, RefreshCw, UserPlus, Check, Trash2, ChevronDown, ChevronUp,
  MessageCircle, Globe, Play, Briefcase, X, AlertCircle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type SignalType   = "buying_intent" | "partnership_inquiry" | "general";
type SignalStatus = "new" | "replied" | "converted" | "dismissed";
type Platform     = "youtube" | "instagram" | "tiktok" | "manual";

interface SocialSignal {
  id: string;
  platform: Platform;
  post_url: string | null;
  commenter_handle: string | null;
  commenter_name: string | null;
  comment_text: string;
  signal_type: SignalType;
  signal_score: number;
  keywords_matched: string[];
  status: SignalStatus;
  reply_sent: boolean;
  contact_id: string | null;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const PLATFORM_STYLE: Record<Platform, { label: string; color: string; icon: React.ReactNode }> = {
  youtube:   { label: "YouTube",   color: "bg-red-100 text-red-700",      icon: <Play size={11} /> },
  instagram: { label: "Instagram", color: "bg-pink-100 text-pink-700",    icon: <Globe size={11} /> },
  tiktok:    { label: "TikTok",    color: "bg-slate-900 text-white",      icon: <TikTokIcon /> },
  manual:    { label: "Manual",    color: "bg-slate-100 text-slate-600",  icon: <MessageCircle size={11} /> },
};

const SIGNAL_STYLE: Record<SignalType, { label: string; color: string }> = {
  buying_intent:        { label: "Buying Intent",    color: "bg-green-100 text-green-700" },
  partnership_inquiry:  { label: "Partner Inquiry",  color: "bg-blue-100 text-blue-700" },
  general:              { label: "General",           color: "bg-slate-100 text-slate-500" },
};

const STATUS_STYLE: Record<SignalStatus, string> = {
  new:       "bg-amber-100 text-amber-700",
  replied:   "bg-blue-100 text-blue-600",
  converted: "bg-green-100 text-green-700",
  dismissed: "bg-slate-100 text-slate-400",
};

function TikTokIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
    </svg>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-400" : score >= 40 ? "bg-amber-400" : "bg-slate-300";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 bg-slate-100 rounded-full h-1.5 flex-shrink-0">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] text-slate-400 font-semibold">{score}</span>
    </div>
  );
}

function highlightKeywords(text: string, keywords: string[]): React.ReactNode {
  if (!keywords.length) return text;
  const pattern = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part) ? <mark key={i} className="bg-amber-200 text-amber-900 rounded px-0.5 not-italic">{part}</mark> : part
  );
}

// ── Simulate test data ─────────────────────────────────────────────────────────

const TEST_SIGNALS = [
  { platform: "tiktok",    comment_text: "Where can I buy this?? Shipping to Australia?",         commenter_handle: "whisky_lover_au" },
  { platform: "instagram", comment_text: "How much does this cost? I run a bar in Tokyo 🍸",       commenter_handle: "bar_tokyo_ryo" },
  { platform: "youtube",   comment_text: "Interested in distributing this in Southeast Asia. How can we partner?", commenter_handle: "drinks_dist_sg" },
  { platform: "instagram", comment_text: "どこで購入できますか？日本でも買えますか？",               commenter_handle: "nihon_drinker" },
  { platform: "tiktok",    comment_text: "We carry premium spirits in our duty free stores — interested in stocking this. Who should I contact?", commenter_handle: "heinemann_df" },
];

// ── Main ───────────────────────────────────────────────────────────────────────

export default function SocialPage() {
  const [signals, setSignals]         = useState<SocialSignal[]>([]);
  const [loading, setLoading]         = useState(false);
  const [filter, setFilter]           = useState<"all" | SignalStatus>("all");
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [converting, setConverting]   = useState<string | null>(null);
  const [converted, setConverted]     = useState<Set<string>>(new Set());
  const [simulating, setSimulating]   = useState(false);

  // Stats
  const newCount        = signals.filter(s => s.status === "new").length;
  const convertedCount  = signals.filter(s => s.status === "converted").length;
  const buyingCount     = signals.filter(s => s.signal_type === "buying_intent").length;
  const partnerCount    = signals.filter(s => s.signal_type === "partnership_inquiry").length;

  const loadSignals = useCallback(async () => {
    setLoading(true);
    const url = filter === "all" ? "/api/social/signals" : `/api/social/signals?status=${filter}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.signals) setSignals(data.signals);
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadSignals(); }, [loadSignals]);

  async function handleConvert(signal: SocialSignal) {
    setConverting(signal.id);
    const res = await fetch(`/api/social/signals/${signal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "convert_to_lead" }),
    });
    if (res.ok) {
      setConverted(prev => new Set([...prev, signal.id]));
      setSignals(prev => prev.map(s => s.id === signal.id ? { ...s, status: "converted" } : s));
    }
    setConverting(null);
  }

  async function handleDismiss(id: string) {
    await fetch(`/api/social/signals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dismissed" }),
    });
    setSignals(prev => prev.map(s => s.id === id ? { ...s, status: "dismissed" } : s));
  }

  async function handleDelete(id: string) {
    await fetch(`/api/social/signals/${id}`, { method: "DELETE" });
    setSignals(prev => prev.filter(s => s.id !== id));
  }

  async function simulateSignals() {
    setSimulating(true);
    for (const t of TEST_SIGNALS) {
      await fetch("/api/social/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...t, platform: t.platform }),
      });
    }
    await loadSignals();
    setSimulating(false);
  }

  const displayed = signals.filter(s => filter === "all" || s.status === filter);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center">
              <Radar size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Social Signals</h1>
              <p className="text-xs text-slate-500">SNSコメント → 購買意図検知 → Pipeline自動化</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={simulateSignals}
              disabled={simulating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {simulating ? <RefreshCw size={12} className="animate-spin" /> : <MessageCircle size={12} />}
              テストデータ投入
            </button>
            <button onClick={loadSignals} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> 更新
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: "New",        value: newCount,       color: "text-amber-600",  bg: "bg-amber-50"  },
            { label: "Buying",     value: buyingCount,    color: "text-green-600",  bg: "bg-green-50"  },
            { label: "Partners",   value: partnerCount,   color: "text-blue-600",   bg: "bg-blue-50"   },
            { label: "Converted",  value: convertedCount, color: "text-slate-700",  bg: "bg-slate-100" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl px-3 py-2.5 text-center`}>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-1 mt-3">
          {(["all", "new", "replied", "converted", "dismissed"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all capitalize ${filter === f ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-700"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Signal list */}
      <div className="flex-1 overflow-auto p-4">
        {displayed.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Radar size={36} className="text-slate-200 mb-3" />
            <p className="text-sm text-slate-400 font-medium">シグナルなし</p>
            <p className="text-xs text-slate-300 mt-1">「テストデータ投入」でデモを確認できます</p>
            <button onClick={simulateSignals} disabled={simulating} className="mt-4 px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-400 transition-colors">
              {simulating ? "投入中…" : "テストデータを投入する"}
            </button>
          </div>
        )}

        <div className="space-y-2 max-w-4xl mx-auto">
          {displayed.map(signal => {
            const ps = PLATFORM_STYLE[signal.platform] ?? PLATFORM_STYLE.manual;
            const ss = SIGNAL_STYLE[signal.signal_type];
            const isNew       = signal.status === "new";
            const isConverted = signal.status === "converted";
            const isExpanded  = expanded === signal.id;

            return (
              <div
                key={signal.id}
                className={`bg-white rounded-xl border shadow-sm transition-all ${isNew ? "border-amber-200" : "border-slate-200"}`}
              >
                {/* Main row */}
                <div className="px-4 py-3 flex items-start gap-3">
                  {/* Score dot */}
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isNew ? "bg-amber-400" : isConverted ? "bg-green-400" : "bg-slate-300"}`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${ps.color}`}>
                        {ps.icon} {ps.label}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ss.color}`}>
                        {ss.label}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_STYLE[signal.status]}`}>
                        {signal.status}
                      </span>
                      <ScoreBar score={signal.signal_score} />
                    </div>

                    {signal.commenter_handle && (
                      <p className="text-[10px] text-slate-400 mb-0.5">@{signal.commenter_handle}</p>
                    )}

                    <p className="text-sm text-slate-700 leading-snug">
                      {highlightKeywords(signal.comment_text, signal.keywords_matched ?? [])}
                    </p>

                    <p className="text-[10px] text-slate-300 mt-1">
                      {new Date(signal.created_at).toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isNew && (
                      <>
                        <button
                          onClick={() => handleConvert(signal)}
                          disabled={converting === signal.id}
                          title="CRM + Pipelineに追加"
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          {converting === signal.id
                            ? <RefreshCw size={11} className="animate-spin" />
                            : <UserPlus size={11} />}
                          Pipeline化
                        </button>
                        <button
                          onClick={() => handleDismiss(signal.id)}
                          title="Dismiss"
                          className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </>
                    )}
                    {isConverted && (
                      <div className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 border border-green-200 text-green-600 text-xs font-bold rounded-lg">
                        <Check size={11} /> Done
                      </div>
                    )}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : signal.id)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                    <button
                      onClick={() => handleDelete(signal.id)}
                      className="p-1.5 rounded-lg text-slate-200 hover:text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-3 space-y-3">
                    {signal.keywords_matched?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">検知キーワード</p>
                        <div className="flex flex-wrap gap-1.5">
                          {signal.keywords_matched.map(k => (
                            <span key={k} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[11px] font-medium">{k}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {signal.post_url && (
                      <a href={signal.post_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline">
                        <Globe size={11} /> 投稿を見る
                      </a>
                    )}

                    {isNew && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                        <span className="font-bold">Pipeline化すると:</span> CRM Contactを作成 + Axis {signal.signal_type === "partnership_inquiry" ? "B" : "A"} / Cold ステージで登録 + Damonへ通知メール
                      </div>
                    )}

                    {isConverted && (
                      <div className="flex items-center gap-1.5 text-xs text-green-600">
                        <Check size={11} /> CRM ContactとPipelineカードが作成済みです
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Webhook setup info */}
        <div className="max-w-4xl mx-auto mt-6 bg-white border border-slate-200 rounded-xl px-5 py-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-600 mb-1">SNS Webhook 接続手順</p>
              <div className="text-[11px] text-slate-400 space-y-1">
                <p><span className="font-semibold text-slate-500">YouTube:</span> YouTube Data API → Subscribe to comments → POST to <code className="bg-slate-100 px-1 rounded">/api/social/webhook</code></p>
                <p><span className="font-semibold text-slate-500">Instagram:</span> Meta Developer → Webhook → <code className="bg-slate-100 px-1 rounded">comments</code> field → Verify token: <code className="bg-slate-100 px-1 rounded">twistop_webhook_verify</code></p>
                <p><span className="font-semibold text-slate-500">TikTok:</span> TikTok for Developers → Comments API申請後に接続</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
