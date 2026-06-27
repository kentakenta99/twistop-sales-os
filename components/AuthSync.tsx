"use client";

import { useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { KNOWN_USERS } from "@/lib/currentUser";

// SupabaseセッションのemailをlocalStorageの内部ユーザーIDと同期する
export function AuthSync() {
  useEffect(() => {
    async function sync() {
      const supabase = createBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      const matched = KNOWN_USERS.find(
        (u) => u.email.toLowerCase() === user.email!.toLowerCase()
      );
      if (matched) {
        localStorage.setItem("twistop_user_id", matched.id);
      }
    }
    sync();
  }, []);

  return null;
}
