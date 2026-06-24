import type { Prospect } from "./mockData";

const KEY = "twistop_generated_leads";

export function getGeneratedLeads(): Prospect[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addGeneratedLeads(leads: Prospect[]) {
  const existing = getGeneratedLeads();
  const existingIds = new Set(existing.map((l) => l.id));
  const fresh = leads.filter((l) => !existingIds.has(l.id));
  localStorage.setItem(KEY, JSON.stringify([...existing, ...fresh]));
}

export function removeGeneratedLead(id: string) {
  const existing = getGeneratedLeads();
  localStorage.setItem(KEY, JSON.stringify(existing.filter((l) => l.id !== id)));
}

export function clearGeneratedLeads() {
  localStorage.removeItem(KEY);
}
