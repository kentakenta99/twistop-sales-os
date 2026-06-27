#!/usr/bin/env node
// Usage: node scripts/login.js [email]
// Generates a magic link and opens it in the browser

const { createClient } = require("@supabase/supabase-js");
const { execSync } = require("child_process");
const fs = require("fs");

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();

const email = process.argv[2] || "kenta_yagi@wishbone.tokyo";
const redirectTo = "https://twistop-sales-os.vercel.app/auth/confirm";

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

supabase.auth.admin
  .generateLink({ type: "magiclink", email, options: { redirectTo } })
  .then(({ data, error }) => {
    if (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
    const link = data.properties.action_link;
    console.log("\n✅ Magic link generated for:", email);
    console.log("\n" + link + "\n");
    console.log("Opening in browser...");
    execSync(`open "${link}"`);
  });
