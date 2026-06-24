"use client";

import { useState } from "react";
import { contentAssets, type ContentType } from "@/lib/mockData";
import { Mail, Share2, Download, Upload } from "lucide-react";

type FilterType = "all" | ContentType;

const typeLabel: Record<ContentType, string> = {
  video: "Video",
  pdf:   "PDF",
  image: "Image",
  gif:   "GIF",
};

const typeBadge: Record<ContentType, string> = {
  video: "bg-red-100 text-red-700",
  pdf:   "bg-orange-100 text-orange-700",
  image: "bg-green-100 text-green-700",
  gif:   "bg-violet-100 text-violet-700",
};

const categoryStyle: Record<string, string> = {
  "Product Demo":   "bg-amber-50 text-amber-700 border border-amber-200",
  "Business Pitch": "bg-blue-50 text-blue-700 border border-blue-200",
  "Viral":          "bg-pink-50 text-pink-700 border border-pink-200",
  "Social Proof":   "bg-green-50 text-green-700 border border-green-200",
};

const thumbnailBg: Record<ContentType, string> = {
  video: "bg-gradient-to-br from-red-50 to-rose-100",
  pdf:   "bg-gradient-to-br from-orange-50 to-amber-100",
  image: "bg-gradient-to-br from-green-50 to-emerald-100",
  gif:   "bg-gradient-to-br from-violet-50 to-purple-100",
};

export default function ContentPage() {
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = contentAssets.filter((a) => filter === "all" || a.type === filter);

  const counts = {
    all:   contentAssets.length,
    video: contentAssets.filter((a) => a.type === "video").length,
    pdf:   contentAssets.filter((a) => a.type === "pdf").length,
    image: contentAssets.filter((a) => a.type === "image").length,
    gif:   contentAssets.filter((a) => a.type === "gif").length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Store</h1>
          <p className="text-slate-500 text-sm mt-1">
            {contentAssets.length} assets — attach to emails or post to SNS in one click
          </p>
        </div>
        <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          <Upload size={14} /> Upload Asset
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-7">
        {(["all", "video", "pdf", "image", "gif"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {f === "all" ? "All Assets" : typeLabel[f as ContentType]}
            <span className={`text-[10px] rounded-full px-1.5 ${
              filter === f ? "bg-slate-100 text-slate-600" : "bg-transparent text-slate-400"
            }`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Asset grid */}
      <div className="grid grid-cols-3 gap-5">
        {filtered.map((asset) => (
          <div
            key={asset.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-sm transition-all"
          >
            {/* Thumbnail */}
            <div className={`h-36 flex items-center justify-center text-5xl ${thumbnailBg[asset.type]} border-b border-slate-100`}>
              {asset.thumbnail}
            </div>

            <div className="p-4">
              {/* Title + type badge */}
              <div className="flex items-start gap-2 mb-3">
                <h3 className="text-sm font-semibold text-slate-900 leading-snug flex-1">{asset.title}</h3>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${typeBadge[asset.type]}`}>
                  {typeLabel[asset.type].toUpperCase()}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryStyle[asset.category]}`}>
                  {asset.category}
                </span>
                {asset.markets.map((m) => (
                  <span key={m} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                    {m}
                  </span>
                ))}
              </div>

              {/* Meta */}
              <div className="text-[10px] text-slate-400 mb-4">
                by {asset.createdBy} · {asset.uploadedAt}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                  <Mail size={11} /> Attach to Email
                </button>
                <button className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors">
                  <Share2 size={11} /> Post SNS
                </button>
                <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors ml-auto">
                  <Download size={11} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-slate-400 text-sm">No assets in this category.</div>
      )}
    </div>
  );
}
