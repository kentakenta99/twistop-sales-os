"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle, Settings } from "lucide-react";
import { getCurrentUser, KNOWN_USERS, type AppUser } from "@/lib/currentUser";

type Prefs = {
  tasks_enabled: boolean;
  calendar_enabled: boolean;
  board_enabled: boolean;
};

const MODULES: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: "tasks_enabled",    label: "Tasks",    desc: "Notify when a task is assigned or updated" },
  { key: "calendar_enabled", label: "Calendar", desc: "Notify when a calendar event is added or edited" },
  { key: "board_enabled",    label: "Board",    desc: "Notify when a new board post is published" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-amber-500" : "bg-slate-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [me, setMe] = useState<AppUser | null>(null);
  const [viewingId, setViewingId] = useState<string>("");
  const [prefs, setPrefs] = useState<Prefs>({ tasks_enabled: true, calendar_enabled: true, board_enabled: true });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setMe(user);
    const id = user?.id ?? KNOWN_USERS[0].id;
    setViewingId(id);
    fetchPrefs(id);
  }, []);

  async function fetchPrefs(userId: string) {
    setLoading(true);
    const res = await fetch(`/api/notifications/preferences?user_id=${userId}`);
    const data = await res.json();
    if (data.prefs) setPrefs(data.prefs);
    setLoading(false);
  }

  async function save() {
    setSaved(false);
    const res = await fetch("/api/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: viewingId, ...prefs }),
    });
    if (res.ok) setSaved(true);
  }

  function handleUserChange(id: string) {
    setViewingId(id);
    setSaved(false);
    fetchPrefs(id);
  }

  function toggle(key: keyof Prefs, value: boolean) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  const viewingUser = KNOWN_USERS.find((u) => u.id === viewingId);

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
          <Settings size={17} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage notification preferences</p>
        </div>
      </div>

      {/* User selector (admin can manage any member's prefs) */}
      {me?.role === "admin" && (
        <div className="mb-6">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
            Editing preferences for
          </label>
          <div className="flex gap-2">
            {KNOWN_USERS.map((u) => (
              <button
                key={u.id}
                onClick={() => handleUserChange(u.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                  viewingId === u.id
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ backgroundColor: u.avatarColor }}
                >
                  {u.name[0]}
                </span>
                {u.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Email display */}
      {viewingUser && (
        <div className="bg-slate-50 rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
          <Bell size={15} className="text-slate-400 flex-shrink-0" />
          <div>
            <div className="text-xs text-slate-400 font-medium">Notifications sent to</div>
            <div className="text-sm font-semibold text-slate-700">{viewingUser.email}</div>
          </div>
        </div>
      )}

      {/* Notification toggles */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-sm">Email Notifications</h2>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-slate-400 text-sm text-center">Loading…</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {MODULES.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">{label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
                </div>
                <Toggle checked={prefs[key]} onChange={(v) => toggle(key, v)} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
        >
          Save
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-semibold">
            <CheckCircle size={15} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
