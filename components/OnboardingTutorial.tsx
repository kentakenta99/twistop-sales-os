"use client";

import { useState } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { markTutorialSeen } from "@/lib/currentUser";

const slides = [
  {
    emoji: "🥃",
    title: "Welcome to TwisTop Sales OS",
    body: "Your global outreach command center. Manage leads, send emails, and coordinate with your team — all in one place.",
    bg: "from-amber-50 to-orange-50",
    accent: "text-amber-600",
  },
  {
    emoji: "📊",
    title: "Pipeline",
    body: "Track every deal across Axis A (Events & Venues) and Axis B (Distribution Partners). Switch between axes with one click and drag cards through stages.",
    bg: "from-blue-50 to-indigo-50",
    accent: "text-blue-600",
  },
  {
    emoji: "✨",
    title: "Lead Generator",
    body: "Choose a region and segment, and Claude AI researches real companies and contacts for you in seconds. Review and add the best ones to your pipeline.",
    bg: "from-violet-50 to-purple-50",
    accent: "text-violet-600",
  },
  {
    emoji: "📧",
    title: "Outreach Planner",
    body: "Select any lead and generate a personalized 3-email sequence. Approve it, then send the first email directly from the app with your Cal.com booking link in the footer.",
    bg: "from-green-50 to-emerald-50",
    accent: "text-green-600",
  },
  {
    emoji: "🎬",
    title: "Content Store",
    body: "Upload videos, PDFs, and images. Attach them to outreach emails or share links in one click. All your sales assets in one place.",
    bg: "from-rose-50 to-pink-50",
    accent: "text-rose-600",
  },
  {
    emoji: "👥",
    title: "Team",
    body: "Coordinate with your team via the shared Task board and Bulletin Board. Create tasks, assign them, and post updates — everyone stays in sync.",
    bg: "from-slate-50 to-slate-100",
    accent: "text-slate-600",
  },
  {
    emoji: "🌏",
    title: "Ready to close deals!",
    body: "That's everything. Start by exploring the Pipeline or generating new leads. The world is TwisTop's oyster.",
    bg: "from-amber-50 to-yellow-50",
    accent: "text-amber-600",
  },
];

type Props = { onClose: () => void };

export default function OnboardingTutorial({ onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const slide = slides[idx];
  const isLast = idx === slides.length - 1;

  function finish() {
    markTutorialSeen();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Slide content */}
        <div className={`bg-gradient-to-br ${slide.bg} px-8 pt-10 pb-8 text-center relative`}>
          <button
            onClick={finish}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="text-7xl mb-5">{slide.emoji}</div>
          <h2 className={`text-xl font-bold mb-3 ${slide.accent}`}>{slide.title}</h2>
          <p className="text-slate-600 text-sm leading-relaxed max-w-sm mx-auto">{slide.body}</p>
        </div>

        {/* Navigation */}
        <div className="px-8 py-5 flex items-center justify-between bg-white">
          {/* Dots */}
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`rounded-full transition-all ${
                  i === idx ? "w-5 h-2 bg-amber-500" : "w-2 h-2 bg-slate-200 hover:bg-slate-300"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {idx > 0 && (
              <button
                onClick={() => setIdx(idx - 1)}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={15} /> Back
              </button>
            )}
            {isLast ? (
              <button
                onClick={finish}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors"
              >
                Let's go! 🚀
              </button>
            ) : (
              <button
                onClick={() => setIdx(idx + 1)}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors"
              >
                Next <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
