"use client";

import { useState } from "react";
import Image from "next/image";
import { createBrowserSupabase } from "@/lib/supabase-browser";

const ALLOWED_EMAILS = ["kenta_yagi@wishbone.tokyo", "damonj@acuver.com", "kentakenta99@gmail.com"];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const normalized = email.trim().toLowerCase();
    if (!ALLOWED_EMAILS.includes(normalized)) {
      setError("This email is not authorized to access TwisTop Axis.");
      return;
    }

    setSending(true);
    const supabase = createBrowserSupabase();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setSending(false);

    if (authError) {
      setError(authError.message || authError.status?.toString() || JSON.stringify(authError) || "Failed to send magic link");
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo.jpg"
            alt="TwisTop"
            width={180}
            height={74}
            style={{ filter: "invert(1) brightness(0.95)" }}
            priority
          />
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-white mb-1">Sign in to Axis</h1>
            <p className="text-slate-400 text-sm">We&apos;ll send a magic link to your email.</p>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-1">Check your inbox</p>
              <p className="text-slate-400 text-sm">Magic link sent to <span className="text-amber-400">{email}</span></p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2.5 bg-slate-700 text-white placeholder-slate-500 border border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending || !email}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                {sending ? "Sending…" : "Send Magic Link"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          TwisTop Axis · Private Access
        </p>
      </div>
    </div>
  );
}
