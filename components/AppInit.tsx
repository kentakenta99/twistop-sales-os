"use client";

import { useEffect, useState } from "react";
import {
  KNOWN_USERS,
  getCurrentUserId,
  setCurrentUser,
  isTutorialSeen,
  type AppUser,
} from "@/lib/currentUser";
import OnboardingTutorial from "./OnboardingTutorial";

export default function AppInit() {
  const [phase, setPhase] = useState<"idle" | "pick" | "tutorial" | "done">("idle");
  const [, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    const id = getCurrentUserId();
    if (!id) {
      setPhase("pick");
    } else if (!isTutorialSeen()) {
      setPhase("tutorial");
    } else {
      setPhase("done");
    }
  }, []);

  function handlePickUser(u: AppUser) {
    setCurrentUser(u.id);
    setUser(u);
    if (!isTutorialSeen()) {
      setPhase("tutorial");
    } else {
      setPhase("done");
    }
  }

  if (phase === "pick") {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-8 pt-8 pb-6 text-center">
            <div className="text-5xl mb-3">👋</div>
            <h2 className="text-white text-lg font-bold">Welcome to TwisTop Sales OS</h2>
            <p className="text-slate-400 text-sm mt-1">Who are you?</p>
          </div>
          <div className="p-6 space-y-3">
            {KNOWN_USERS.map((u) => (
              <button
                key={u.id}
                onClick={() => handlePickUser(u)}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 border-slate-100 hover:border-amber-300 hover:bg-amber-50 transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ backgroundColor: u.avatarColor }}
                >
                  {u.name[0]}
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-900 group-hover:text-amber-700">{u.name}</div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "tutorial") {
    return <OnboardingTutorial onClose={() => setPhase("done")} />;
  }

  return null;
}
