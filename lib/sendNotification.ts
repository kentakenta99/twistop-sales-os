import { Resend } from "resend";
import { supabaseAdmin } from "./supabase";
import { KNOWN_USERS } from "./currentUser";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL ?? "onboarding@resend.dev";

type Module = "tasks" | "calendar" | "board";

function buildHtml(subject: string, body: string): string {
  const paragraphs = body
    .split("\n\n")
    .map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
    <div style="background:#1e293b;padding:20px 28px;display:flex;align-items:center;gap:12px">
      <div style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-.4px">TwisTop</div>
      <div style="color:#94a3b8;font-size:10px;letter-spacing:2px;text-transform:uppercase">Axis Notification</div>
    </div>
    <div style="padding:28px;color:#334155;font-size:14px;line-height:1.75">
      <h2 style="margin:0 0 16px;font-size:16px;color:#0f172a">${subject}</h2>
      ${paragraphs}
    </div>
    <div style="background:#f1f5f9;padding:14px 28px;font-size:11px;color:#94a3b8;text-align:center">
      TwisTop Axis · This is an automated team notification.
    </div>
  </div>
</body>
</html>`;
}

async function getEnabledUsers(module: Module): Promise<{ name: string; email: string }[]> {
  const { data } = await supabaseAdmin
    .from("notification_preferences")
    .select("user_id, tasks_enabled, calendar_enabled, board_enabled")
    .eq(`${module}_enabled`, true);

  if (!data) return [];

  const enabledIds = new Set(data.map((r) => r.user_id));
  return KNOWN_USERS.filter((u) => enabledIds.has(u.id));
}

export async function notifyAssignee(opts: {
  assigneeId: string;
  subject: string;
  body: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const user = KNOWN_USERS.find((u) => u.id === opts.assigneeId);
  if (!user) return;

  const { data: prefs } = await supabaseAdmin
    .from("notification_preferences")
    .select("tasks_enabled")
    .eq("user_id", opts.assigneeId)
    .single();
  if (!prefs?.tasks_enabled) return;

  const { error } = await resend.emails.send({
    from: `TwisTop Axis <${FROM}>`,
    to: [user.email],
    subject: opts.subject,
    html: buildHtml(opts.subject, opts.body),
    text: opts.body,
  });
  if (error) console.error("[notifyAssignee] Resend error:", error);
}

export async function notifyAll(opts: {
  module: Module;
  subject: string;
  body: string;
  excludeUserId?: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const users = await getEnabledUsers(opts.module);
  const targets = opts.excludeUserId
    ? users.filter((u) => u.email !== KNOWN_USERS.find((k) => k.id === opts.excludeUserId)?.email)
    : users;
  if (targets.length === 0) return;

  const { error } = await resend.emails.send({
    from: `TwisTop Axis <${FROM}>`,
    to: targets.map((u) => u.email),
    subject: opts.subject,
    html: buildHtml(opts.subject, opts.body),
    text: opts.body,
  });
  if (error) console.error("[notifyAll] Resend error:", error);
}
