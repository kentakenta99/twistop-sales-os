"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";

// admin.generateLink() が生成するマジックリンクは implicit flow（#access_token= がハッシュに入る）。
// サーバーサイドルートはハッシュを読めないため、このクライアントページで処理する。
export default function AuthConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleAuth() {
      const supabase = createBrowserSupabase();

      // ハッシュから access_token + refresh_token を取得
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error) {
          router.replace("/");
          return;
        }
        console.error("[auth/confirm] setSession error:", error.message);
      }

      // PKCE flow のフォールバック（?code= がある場合）
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace("/");
          return;
        }
        console.error("[auth/confirm] exchangeCodeForSession error:", error.message);
      }

      router.replace("/login?error=auth_callback_failed");
    }

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-slate-400 text-sm animate-pulse">Signing in…</div>
    </div>
  );
}
