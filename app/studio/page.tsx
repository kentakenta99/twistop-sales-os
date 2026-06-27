"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clapperboard, Sparkles, Copy, Check, RefreshCw,
  Video, TrendingUp, ExternalLink, Trash2, ChevronDown, ChevronUp,
  Play, Globe, Briefcase, X,
} from "lucide-react";
import { getCurrentUser } from "@/lib/currentUser";

// ── Types ──────────────────────────────────────────────────────────────────────

type Platform = "tiktok" | "youtube_short" | "youtube" | "instagram" | "linkedin";
type ContentType = "brand_story" | "product_demo" | "partner_pitch" | "event" | "testimonial";
type Tone = "exciting" | "professional" | "fun" | "educational";
type Duration = "short" | "medium" | "long";

interface GeneratedContent {
  script: string;
  hook: string;
  captions: Partial<Record<Platform, string>>;
  hashtags: { core: string[]; trend: string[]; niche: string[] };
  title_youtube: string | null;
  thumbnail_prompt: string;
  parrot_tip: string;
  production_notes: string;
}

interface ContentJob {
  id: string;
  content_type: ContentType;
  platforms: Platform[];
  tone: Tone;
  duration: Duration;
  language: string;
  key_message: string;
  script: string;
  heygen_status: string;
  video_url: string | null;
  posted_platforms: Platform[];
  views: number;
  likes: number;
  follows_gained: number;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CONTENT_TYPES: { value: ContentType; label: string; desc: string; icon: string }[] = [
  { value: "brand_story",   label: "Brand Story",   desc: "Origin + vision",       icon: "✨" },
  { value: "product_demo",  label: "Product Demo",  desc: "How TwisTop works",     icon: "🎬" },
  { value: "partner_pitch", label: "Partner Pitch", desc: "B2B partner recruit",   icon: "🤝" },
  { value: "event",         label: "Event Coverage",desc: "Live event moments",    icon: "🎪" },
  { value: "testimonial",   label: "Testimonial",   desc: "User/partner voice",    icon: "💬" },
];

const PLATFORMS: { value: Platform; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "tiktok",        label: "TikTok",          icon: <TikTokIcon />,       color: "bg-black text-white" },
  { value: "youtube_short", label: "YT Shorts",        icon: <Play size={13} />,    color: "bg-red-600 text-white" },
  { value: "youtube",       label: "YouTube",          icon: <Play size={13} />,    color: "bg-red-500 text-white" },
  { value: "instagram",     label: "Instagram",        icon: <Globe size={13} />,   color: "bg-gradient-to-r from-purple-500 to-pink-500 text-white" },
  { value: "linkedin",      label: "LinkedIn",         icon: <Briefcase size={13} />, color: "bg-blue-700 text-white" },
];

const TONES: { value: Tone; label: string }[] = [
  { value: "exciting",     label: "Exciting" },
  { value: "professional", label: "Professional" },
  { value: "fun",          label: "Fun" },
  { value: "educational",  label: "Educational" },
];

const DURATIONS: { value: Duration; label: string; desc: string }[] = [
  { value: "short",  label: "Short",  desc: "< 60s" },
  { value: "medium", label: "Medium", desc: "1–3 min" },
  { value: "long",   label: "Long",   desc: "3–5 min" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "zh", label: "中文" },
];

const PLATFORM_LINKS: Partial<Record<Platform, string>> = {
  tiktok:        "https://www.tiktok.com/upload",
  youtube_short: "https://studio.youtube.com",
  youtube:       "https://studio.youtube.com",
  instagram:     "https://www.instagram.com",
  linkedin:      "https://www.linkedin.com/feed",
};

function TikTokIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
    </svg>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      title="Copy"
    >
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
    </button>
  );
}

function PlatformBadge({ platform }: { platform: Platform }) {
  const p = PLATFORMS.find(x => x.value === platform);
  if (!p) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${p.color}`}>
      {p.icon} {p.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    not_submitted: "bg-slate-100 text-slate-500",
    processing:    "bg-amber-100 text-amber-700",
    completed:     "bg-green-100 text-green-700",
    failed:        "bg-red-100 text-red-600",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${map[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function StudioPage() {
  const me = getCurrentUser();

  // Brief form
  const [contentType, setContentType] = useState<ContentType>("product_demo");
  const [platforms, setPlatforms] = useState<Platform[]>(["tiktok", "instagram"]);
  const [tone, setTone] = useState<Tone>("exciting");
  const [duration, setDuration] = useState<Duration>("short");
  const [language, setLanguage] = useState("en");
  const [keyMessage, setKeyMessage] = useState("");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [genError, setGenError] = useState("");

  // Active caption tab
  const [captionTab, setCaptionTab] = useState<Platform>("tiktok");

  // Saving
  const [saving, setSaving] = useState(false);
  const [savedJobId, setSavedJobId] = useState<string | null>(null);

  // HeyGen
  const [heygenKey, setHeygenKey] = useState(false);
  const [submittingHeyGen, setSubmittingHeyGen] = useState(false);
  const [heygenDone, setHeygenDone] = useState(false);

  // Jobs list
  const [jobs, setJobs] = useState<ContentJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  // Engagement edit
  const [editingEngagement, setEditingEngagement] = useState<string | null>(null);
  const [engViews, setEngViews] = useState(0);
  const [engLikes, setEngLikes] = useState(0);
  const [engFollows, setEngFollows] = useState(0);

  // Active section tab
  const [tab, setTab] = useState<"create" | "jobs">("create");

  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);
    const res = await fetch("/api/studio/jobs");
    const data = await res.json();
    if (data.jobs) setJobs(data.jobs);
    setLoadingJobs(false);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // Check if HeyGen is configured
  useEffect(() => {
    fetch("/api/studio/heygen?action=avatars")
      .then(r => { if (r.ok) setHeygenKey(true); })
      .catch(() => {});
  }, []);

  function togglePlatform(p: Platform) {
    setPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  }

  async function handleGenerate() {
    if (!platforms.length) return;
    setGenerating(true);
    setGenError("");
    setGenerated(null);
    setSavedJobId(null);
    setHeygenDone(false);

    try {
      const res = await fetch("/api/studio/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, platforms, tone, duration, language, keyMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGenerated(data);
      if (platforms[0]) setCaptionTab(platforms[0]);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!generated) return;
    setSaving(true);
    const body = {
      created_by:         me?.id ?? null,
      content_type:       contentType,
      platforms,
      tone,
      duration,
      language,
      key_message:        keyMessage,
      script:             generated.script,
      caption_tiktok:     generated.captions.tiktok,
      caption_youtube:    generated.captions.youtube ?? generated.captions.youtube_short,
      caption_instagram:  generated.captions.instagram,
      caption_linkedin:   generated.captions.linkedin,
      hashtags:           [...(generated.hashtags.core ?? []), ...(generated.hashtags.trend ?? []), ...(generated.hashtags.niche ?? [])],
    };
    const res = await fetch("/api/studio/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.job) {
      setSavedJobId(data.job.id);
      await loadJobs();
    }
    setSaving(false);
  }

  async function handleSendToHeyGen() {
    if (!generated || !savedJobId) return;
    setSubmittingHeyGen(true);
    const res = await fetch("/api/studio/heygen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        script: generated.script,
        aspectRatio: platforms.some(p => p === "youtube") ? "16:9" : "9:16",
        language,
      }),
    });
    const data = await res.json();
    if (data.video_id) {
      await fetch(`/api/studio/jobs/${savedJobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heygen_video_id: data.video_id, heygen_status: "processing" }),
      });
      setHeygenDone(true);
      await loadJobs();
    }
    setSubmittingHeyGen(false);
  }

  async function handleDeleteJob(id: string) {
    await fetch(`/api/studio/jobs/${id}`, { method: "DELETE" });
    setJobs(prev => prev.filter(j => j.id !== id));
  }

  async function handleSaveEngagement(jobId: string) {
    await fetch(`/api/studio/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ views: engViews, likes: engLikes, follows_gained: engFollows }),
    });
    setJobs(prev => prev.map(j =>
      j.id === jobId ? { ...j, views: engViews, likes: engLikes, follows_gained: engFollows } : j
    ));
    setEditingEngagement(null);
  }

  const allHashtags = generated
    ? [...(generated.hashtags.core ?? []), ...(generated.hashtags.trend ?? []), ...(generated.hashtags.niche ?? [])]
    : [];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
            <Clapperboard size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Content Studio</h1>
            <p className="text-xs text-slate-500">Script → HeyGen → TikTok / YouTube / Instagram</p>
          </div>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setTab("create")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === "create" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            Create
          </button>
          <button onClick={() => setTab("jobs")} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === "jobs" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            Jobs {jobs.length > 0 && <span className="ml-1 text-[10px] bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5">{jobs.length}</span>}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">

        {/* ── CREATE TAB ── */}
        {tab === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-w-7xl mx-auto">

            {/* LEFT: Brief */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-500" /> Content Brief
                </h2>

                {/* Content type */}
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-2">Content Type</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {CONTENT_TYPES.map(ct => (
                      <button
                        key={ct.value}
                        onClick={() => setContentType(ct.value)}
                        className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${contentType === ct.value ? "border-amber-400 bg-amber-50 ring-1 ring-amber-400/30" : "border-slate-200 hover:border-slate-300"}`}
                      >
                        <span className="text-base leading-none mt-0.5">{ct.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-slate-800 leading-tight">{ct.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{ct.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platforms */}
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-2">Target Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => togglePlatform(p.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${platforms.includes(p.value) ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-500 hover:border-slate-400"}`}
                      >
                        {p.icon} {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone + Duration + Language */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Tone</label>
                    <select value={tone} onChange={e => setTone(e.target.value as Tone)} className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50">
                      {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Duration</label>
                    <select value={duration} onChange={e => setDuration(e.target.value as Duration)} className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50">
                      {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label} ({d.desc})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Language</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50">
                      {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Key message */}
                <div className="mb-5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Key Message (optional)</label>
                  <textarea
                    value={keyMessage}
                    onChange={e => setKeyMessage(e.target.value)}
                    placeholder="e.g. We're looking for distribution partners in SE Asia. TwisTop works with any can brand…"
                    rows={3}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 placeholder-slate-300"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating || !platforms.length}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  {generating ? (
                    <><RefreshCw size={14} className="animate-spin" /> Generating…</>
                  ) : (
                    <><Sparkles size={14} /> Generate Script & Captions</>
                  )}
                </button>
                {genError && <p className="mt-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{genError}</p>}
              </div>

              {/* Parrot AI tip */}
              <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-xs text-violet-700">
                <span className="font-bold">Parrot AI workflow:</span> Create English base video via HeyGen → upload to{" "}
                <a href="https://www.tryparrotai.com/tools/ai-avatar-video-generator" target="_blank" rel="noopener noreferrer" className="underline">tryparrotai.com</a>
                {" "}→ auto-translate & voice-clone for JP/FR/ES markets.
              </div>
            </div>

            {/* RIGHT: Generated output */}
            <div className="space-y-4">
              {!generated && !generating && (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center justify-center text-center shadow-sm min-h-64">
                  <Clapperboard size={36} className="text-slate-200 mb-3" />
                  <p className="text-sm text-slate-400 font-medium">Fill in the brief and click Generate</p>
                  <p className="text-xs text-slate-300 mt-1">Script + captions + hashtags will appear here</p>
                </div>
              )}

              {generating && (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center justify-center shadow-sm min-h-64">
                  <RefreshCw size={28} className="text-amber-400 animate-spin mb-3" />
                  <p className="text-sm text-slate-500 font-medium">Writing your script…</p>
                </div>
              )}

              {generated && (
                <>
                  {/* Script */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Video size={13} className="text-amber-500" /> Script
                      </h3>
                      <CopyButton text={generated.script} />
                    </div>
                    <div className="px-5 py-4 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-mono">
                      {generated.script}
                    </div>
                    {generated.hook && (
                      <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 text-xs">
                        <span className="font-bold text-amber-700">Hook: </span>
                        <span className="text-amber-800">{generated.hook}</span>
                      </div>
                    )}
                    {generated.production_notes && (
                      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
                        <span className="font-bold">HeyGen notes: </span>{generated.production_notes}
                      </div>
                    )}
                  </div>

                  {/* Captions */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
                      {platforms.map(p => (
                        <button
                          key={p}
                          onClick={() => setCaptionTab(p)}
                          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all ${captionTab === p ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-700"}`}
                        >
                          {PLATFORMS.find(x => x.value === p)?.label ?? p}
                        </button>
                      ))}
                    </div>
                    <div className="px-5 py-4 relative">
                      <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed min-h-16">
                        {generated.captions[captionTab] || <span className="text-slate-300">No caption for this platform</span>}
                      </div>
                      {generated.captions[captionTab] && (
                        <div className="absolute top-3 right-4">
                          <CopyButton text={generated.captions[captionTab]!} />
                        </div>
                      )}
                    </div>
                    {captionTab === "youtube" && generated.title_youtube && (
                      <div className="px-5 py-3 bg-red-50 border-t border-red-100 flex items-center justify-between text-xs">
                        <span className="text-red-700"><span className="font-bold">Title: </span>{generated.title_youtube}</span>
                        <CopyButton text={generated.title_youtube} />
                      </div>
                    )}
                  </div>

                  {/* Hashtags */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-slate-700"># Hashtags</h3>
                      <CopyButton text={allHashtags.join(" ")} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {generated.hashtags.core?.map(h => (
                        <span key={h} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[11px] font-medium">{h}</span>
                      ))}
                      {generated.hashtags.trend?.map(h => (
                        <span key={h} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[11px] font-medium">{h}</span>
                      ))}
                      {generated.hashtags.niche?.map(h => (
                        <span key={h} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium">{h}</span>
                      ))}
                    </div>
                    {generated.thumbnail_prompt && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[10px] text-slate-400 leading-relaxed"><span className="font-bold text-slate-500">Thumbnail: </span>{generated.thumbnail_prompt}</p>
                          <CopyButton text={generated.thumbnail_prompt} />
                        </div>
                      </div>
                    )}
                    {generated.parrot_tip && (
                      <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-violet-600">
                        <span className="font-bold">Parrot tip: </span>{generated.parrot_tip}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {!savedJobId ? (
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                      >
                        {saving ? <><RefreshCw size={13} className="animate-spin" /> Saving…</> : <><Check size={13} /> Save to Jobs</>}
                      </button>
                    ) : (
                      <div className="flex-1 flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 font-bold py-2.5 rounded-xl text-sm">
                        <Check size={13} /> Saved
                      </div>
                    )}

                    {heygenKey && savedJobId && !heygenDone && (
                      <button
                        onClick={handleSendToHeyGen}
                        disabled={submittingHeyGen}
                        className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                      >
                        {submittingHeyGen ? <><RefreshCw size={13} className="animate-spin" /> Submitting…</> : <><Video size={13} /> Send to HeyGen</>}
                      </button>
                    )}
                    {heygenDone && (
                      <div className="flex-1 flex items-center justify-center gap-2 bg-violet-50 border border-violet-200 text-violet-700 font-bold py-2.5 rounded-xl text-sm">
                        <Check size={13} /> HeyGen submitted
                      </div>
                    )}
                  </div>

                  {!heygenKey && (
                    <p className="text-[11px] text-slate-400 text-center">
                      Add <code className="bg-slate-100 px-1 rounded">HEYGEN_API_KEY</code> to .env.local to enable direct HeyGen submission
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── JOBS TAB ── */}
        {tab === "jobs" && (
          <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800">Content Jobs ({jobs.length})</h2>
              <button onClick={loadJobs} disabled={loadingJobs} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700">
                <RefreshCw size={12} className={loadingJobs ? "animate-spin" : ""} /> Refresh
              </button>
            </div>

            {jobs.length === 0 && !loadingJobs && (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center text-center">
                <Clapperboard size={32} className="text-slate-200 mb-3" />
                <p className="text-sm text-slate-400 font-medium">No jobs yet</p>
                <button onClick={() => setTab("create")} className="mt-3 text-xs text-amber-500 hover:underline">Create your first script →</button>
              </div>
            )}

            <div className="space-y-3">
              {jobs.map(job => (
                <div key={job.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Job header */}
                  <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-800 capitalize">{job.content_type.replace("_", " ")}</span>
                        <StatusBadge status={job.heygen_status} />
                        {job.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
                      </div>
                      {job.key_message && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{job.key_message}</p>
                      )}
                      <p className="text-[10px] text-slate-300 mt-0.5">{new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>

                    {/* Engagement mini stats */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
                      <span title="Views"><TrendingUp size={11} className="inline mr-0.5" />{job.views.toLocaleString()}</span>
                      <span title="Likes">♥ {job.likes.toLocaleString()}</span>
                      <span title="Follows">+{job.follows_gained}</span>
                    </div>

                    {/* Distribution links */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {job.video_url && (
                        <a href={job.video_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-violet-100 text-violet-600 hover:bg-violet-200" title="Download video">
                          <Video size={13} />
                        </a>
                      )}
                      {job.platforms.map(p => {
                        const link = PLATFORM_LINKS[p];
                        return link ? (
                          <a key={p} href={link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200" title={`Post to ${p}`}>
                            <ExternalLink size={13} />
                          </a>
                        ) : null;
                      })}
                    </div>

                    {/* Expand / Delete */}
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      >
                        {expandedJob === job.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expandedJob === job.id && (
                    <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                      {job.script && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Script</span>
                            <CopyButton text={job.script} />
                          </div>
                          <p className="text-xs text-slate-600 whitespace-pre-wrap font-mono bg-slate-50 rounded-xl p-3 max-h-40 overflow-y-auto">{job.script}</p>
                        </div>
                      )}

                      {/* Engagement edit */}
                      {editingEngagement === job.id ? (
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Update Engagement</span>
                          <input type="number" value={engViews} onChange={e => setEngViews(+e.target.value)} placeholder="Views" className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg" />
                          <input type="number" value={engLikes} onChange={e => setEngLikes(+e.target.value)} placeholder="Likes" className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg" />
                          <input type="number" value={engFollows} onChange={e => setEngFollows(+e.target.value)} placeholder="Follows" className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg" />
                          <button onClick={() => handleSaveEngagement(job.id)} className="px-3 py-1 bg-slate-900 text-white text-xs rounded-lg font-bold">Save</button>
                          <button onClick={() => setEditingEngagement(null)} className="text-xs text-slate-400 hover:text-slate-600"><X size={12} /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingEngagement(job.id); setEngViews(job.views); setEngLikes(job.likes); setEngFollows(job.follows_gained); }}
                          className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1"
                        >
                          <TrendingUp size={11} /> Update engagement metrics
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
