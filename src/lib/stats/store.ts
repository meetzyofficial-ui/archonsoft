/**
 * Where visit statistics are kept: one collection a day, in the same Firestore
 * the leads and the fleet panel use. Without a service account, a local file
 * outside production, and otherwise nowhere — and the panel says so.
 *
 * Server-only.
 */
import path from "node:path";
import { FileRepo, FirestoreRepo, type Collection, type Repo } from "@/lib/fleet/store";

let repo: Repo | null | undefined;

export function statsRepo(): Repo | null {
  if (repo !== undefined) return repo;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) repo = new FirestoreRepo({ projectId, clientEmail, privateKey }, "site_");
  else if (process.env.STATS_FILE || process.env.NODE_ENV !== "production") repo = new FileRepo(process.env.STATS_FILE || path.join(process.cwd(), ".qa", "stats.json"));
  else repo = null;
  return repo;
}

/** The day a moment falls on in Istanbul: YYYY-MM-DD. */
export const dayOf = (at = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul" }).format(at);

export const dayCollection = (day: string) => `stats_${day}` as Collection;

export type StatEvent = { k: "click" | "section" | "form" | "world" | "wa"; l: string; n?: number };

/** One page, as one visitor saw it. */
export type Visit = {
  id: string;
  at: string;
  /** A random number for this tab only; gone when the tab closes. */
  s: string;
  path: string;
  ref: string;
  src: string;
  device: "telefon" | "masaüstü";
  lang: string;
  city: string;
  country: string;
  /** Seconds the page was in front of the visitor, and how far they scrolled. */
  sec: number;
  scroll: number;
  events: StatEvent[];
};

export async function saveVisit(visit: Visit): Promise<boolean> {
  const store = statsRepo();
  if (!store) return false;
  await store.upsert(dayCollection(visit.at.slice(0, 10)), visit as unknown as { id: string } & Record<string, unknown>);
  return true;
}

export async function readVisits(days: number): Promise<Visit[]> {
  const store = statsRepo();
  if (!store) return [];
  const list = Array.from({ length: days }, (_, i) => dayOf(new Date(Date.now() - i * 86_400_000)));
  const read = await Promise.all(list.map((day) => store.list<Visit>(dayCollection(day)).catch(() => [])));
  return read.flat();
}
