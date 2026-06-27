const USER_KEY = "twistop_user_id";
const TUTORIAL_KEY = "twistop_tutorial_seen";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  role: string;
};

export const KNOWN_USERS: AppUser[] = [
  { id: "00000000-0000-0000-0000-000000000001", name: "Kenta",  email: "kenta_yagi@wishbone.tokyo", avatarColor: "#f59e0b", role: "admin" },
  { id: "00000000-0000-0000-0000-000000000002", name: "Damon",  email: "damonj@acuver.com",         avatarColor: "#3b82f6", role: "admin" },
];

export function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_KEY);
}

export function getCurrentUser(): AppUser | null {
  const id = getCurrentUserId();
  return KNOWN_USERS.find((u) => u.id === id) ?? null;
}

export function setCurrentUser(id: string) {
  localStorage.setItem(USER_KEY, id);
}

export function isTutorialSeen(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(TUTORIAL_KEY) === "1";
}

export function markTutorialSeen() {
  localStorage.setItem(TUTORIAL_KEY, "1");
}
