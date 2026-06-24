const KEY = "twistop_outreach_plans";

export type EmailStep = {
  day: number;
  subject: string;
  body: string;
};

export type OutreachPlan = {
  leadId: string;
  company: string;
  contact: string;
  email: string;
  axis: "A" | "B";
  steps: EmailStep[];
  createdAt: string;
  status: "draft" | "approved" | "sent";
};

function load(): OutreachPlan[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(plans: OutreachPlan[]) {
  localStorage.setItem(KEY, JSON.stringify(plans));
}

export function getOutreachPlans(): OutreachPlan[] {
  return load();
}

export function getOutreachPlan(leadId: string): OutreachPlan | undefined {
  return load().find((p) => p.leadId === leadId);
}

export function upsertOutreachPlan(plan: OutreachPlan) {
  const plans = load().filter((p) => p.leadId !== plan.leadId);
  save([...plans, plan]);
}

export function updatePlanStatus(leadId: string, status: OutreachPlan["status"]) {
  const plans = load().map((p) =>
    p.leadId === leadId ? { ...p, status } : p
  );
  save(plans);
}

export function deleteOutreachPlan(leadId: string) {
  save(load().filter((p) => p.leadId !== leadId));
}
