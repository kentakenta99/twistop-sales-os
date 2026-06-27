"use client";

import { useState, useEffect, useRef } from "react";
import { contentAssets, type ContentType } from "@/lib/mockData";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Mail, Share2, Download, Upload, X, Loader2, CheckCircle } from "lucide-react";

type FilterType = "all" | ContentType;

type UploadedAsset = {
  id: string;
  title: string;
  type: ContentType;
  url: string;
  tags: string[];
  created_at: string;
};

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

const typeEmoji: Record<ContentType, string> = {
  video: "🎬",
  pdf:   "📄",
  image: "🖼️",
  gif:   "✨",
};

const thumbnailBg: Record<ContentType, string> = {
  video: "bg-gradient-to-br from-red-50 to-rose-100",
  pdf:   "bg-gradient-to-br from-orange-50 to-amber-100",
  image: "bg-gradient-to-br from-green-50 to-emerald-100",
  gif:   "bg-gradient-to-br from-violet-50 to-purple-100",
};

const categoryStyle: Record<string, string> = {
  "Product Demo":   "bg-amber-50 text-amber-700 border border-amber-200",
  "Business Pitch": "bg-blue-50 text-blue-700 border border-blue-200",
  "Viral":          "bg-pink-50 text-pink-700 border border-pink-200",
  "Social Proof":   "bg-green-50 text-green-700 border border-green-200",
};

export default function ContentPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [uploaded, setUploaded] = useState<UploadedAsset[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch uploaded assets from Supabase
  useEffect(() => {
    fetch("/api/content/list")
      .then((r) => r.json())
      .then((d) => { if (d.assets) setUploaded(d.assets); })
      .catch(() => {});
  }, []);

  function openModal() {
    setShowModal(true);
    setUploadDone(false);
    setUploadError("");
    setUploadProgress(0);
    setTitle("");
    setTags("");
    setSelectedFile(null);
  }

  function closeModal() {
    setShowModal(false);
  }

  function detectType(mime: string): "video" | "pdf" | "image" | "gif" {
    if (mime === "application/pdf") return "pdf";
    if (mime === "image/gif") return "gif";
    if (mime.startsWith("video/")) return "video";
    return "image";
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadError("");
    try {
      const BUCKET = "content-assets";
      const safeName = `${Date.now()}-${selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

      // Step 1: Upload directly to Supabase Storage from browser (no Next.js size limit)
      const supabase = createBrowserSupabase();
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .upload(safeName, selectedFile, {
          contentType: selectedFile.type,
          upsert: false,
        });

      if (storageError) throw new Error(storageError.message);

      setUploadProgress(90);

      const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(safeName);

      // Step 2: Save metadata to DB (small JSON request, no file)
      const metaRes = await fetch("/api/content/save-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || selectedFile.name,
          type: detectType(selectedFile.type),
          url: publicData.publicUrl,
          storage_path: safeName,
          size_bytes: selectedFile.size,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const metaData = await metaRes.json();
      if (!metaRes.ok) throw new Error(metaData.error || "Failed to save metadata");

      setUploadProgress(100);
      setUploaded((prev) => [metaData.asset, ...prev]);
      setUploadDone(true);
      setTimeout(() => setShowModal(false), 1200);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // Merge mock + uploaded
  const allAssets = [
    ...uploaded.map((a) => ({ ...a, isMock: false })),
    ...contentAssets.map((a) => ({ ...a, isMock: true })),
  ];

  const filtered = allAssets.filter((a) => filter === "all" || a.type === filter);

  const counts = {
    all:   allAssets.length,
    video: allAssets.filter((a) => a.type === "video").length,
    pdf:   allAssets.filter((a) => a.type === "pdf").length,
    image: allAssets.filter((a) => a.type === "image").length,
    gif:   allAssets.filter((a) => a.type === "gif").length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Store</h1>
          <p className="text-slate-500 text-sm mt-1">
            {allAssets.length} assets — attach to emails or post to SNS in one click
          </p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
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
            <div className={`h-36 flex items-center justify-center text-5xl relative overflow-hidden ${thumbnailBg[asset.type as ContentType]} border-b border-slate-100`}>
              {"isMock" in asset && !asset.isMock && (asset.type === "image" || asset.type === "gif") && "url" in asset ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={asset.url as string}
                  alt={asset.title}
                  className="w-full h-full object-cover"
                />
              ) : "isMock" in asset && !asset.isMock && asset.type === "video" && "url" in asset ? (
                <video
                  src={asset.url as string}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
              ) : "thumbnail" in asset ? (
                asset.thumbnail
              ) : (
                typeEmoji[asset.type as ContentType]
              )}
              {"isMock" in asset && !asset.isMock && (
                <span className="absolute top-2 right-2 text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded">
                  NEW
                </span>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-start gap-2 mb-3">
                <h3 className="text-sm font-semibold text-slate-900 leading-snug flex-1">{asset.title}</h3>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${typeBadge[asset.type as ContentType]}`}>
                  {typeLabel[asset.type as ContentType].toUpperCase()}
                </span>
              </div>

              {"category" in asset && (
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryStyle[asset.category as string] ?? "bg-slate-100 text-slate-500"}`}>
                    {asset.category as string}
                  </span>
                  {"markets" in asset && (asset.markets as string[]).map((m) => (
                    <span key={m} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{m}</span>
                  ))}
                </div>
              )}

              {"tags" in asset && !("category" in asset) && (asset.tags as string[]).length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {(asset.tags as string[]).map((t) => (
                    <span key={t} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}

              {"createdBy" in asset && (
                <div className="text-[10px] text-slate-400 mb-4">
                  by {asset.createdBy as string} · {asset.uploadedAt as string}
                </div>
              )}

              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                  <Mail size={11} /> Attach to Email
                </button>
                <button className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors">
                  <Share2 size={11} /> Post SNS
                </button>
                {"url" in asset && (
                  <a
                    href={asset.url as string}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors ml-auto"
                  >
                    <Download size={11} />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-slate-400 text-sm">No assets in this category.</div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Upload Asset</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* File picker */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                  File
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-xl p-6 text-center cursor-pointer transition-colors"
                >
                  {selectedFile ? (
                    <div className="text-sm font-semibold text-slate-700">{selectedFile.name}</div>
                  ) : (
                    <>
                      <Upload size={24} className="text-slate-300 mx-auto mb-2" />
                      <div className="text-sm text-slate-400">Click to select file</div>
                      <div className="text-xs text-slate-300 mt-1">Video, PDF, Image, GIF</div>
                    </>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*,application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={selectedFile?.name ?? "Asset title"}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                  Tags <span className="text-slate-300 font-normal normal-case">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="HeyGen, product demo, Australia"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>

              {uploading && uploadProgress > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Uploading…</span><span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {uploadError}
                </div>
              )}
            </div>

            <div className="px-6 pb-5">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading || uploadDone}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                {uploadDone ? (
                  <><CheckCircle size={15} /> Uploaded!</>
                ) : uploading ? (
                  <><Loader2 size={15} className="animate-spin" /> Uploading…</>
                ) : (
                  <><Upload size={15} /> Upload to Supabase</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
