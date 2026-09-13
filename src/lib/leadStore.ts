import { createSign } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Where a lead is kept.
 *
 * Firestore, through its REST API, when a service account is configured:
 * a signed JWT is exchanged for a short-lived token and the document is
 * written to `world_leads`, then its status is patched as the notifications
 * go out. No SDK — the requests are all it takes, and the private key never
 * leaves the server. Without a service account the lead still goes out by
 * email and WhatsApp, and in development it is appended to a local file so
 * the flow can be tested end to end.
 *
 * Server-only: it reads `node:crypto` and `node:fs`, which no client bundle
 * has, so a client import fails the build.
 */

export type LeadStatus = "new" | "notification_pending" | "notified" | "notification_partial" | "failed";

export type StoredLead = Record<string, unknown> & { createdAt: string; status: LeadStatus };

export type Stored = { where: "firestore" | "file" | "none"; id: string };

const FIRESTORE_SCOPE = "https://www.googleapis.com/auth/datastore";
const COLLECTION = "world_leads";

function firestoreConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

/** Whether a store is configured at all, for the status endpoint. */
export function leadStoreStatus(): "firestore" | "file" | "none" {
  if (firestoreConfig()) return "firestore";
  if (process.env.NODE_ENV !== "production" || process.env.LEADS_FILE) return "file";
  return "none";
}

let cachedToken: { value: string; expires: number } | null = null;

/** A Google OAuth token for the service account, cached until it expires. */
async function accessToken(config: NonNullable<ReturnType<typeof firestoreConfig>>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expires > now + 60) return cachedToken.value;
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claims = Buffer.from(
    JSON.stringify({
      iss: config.clientEmail,
      scope: FIRESTORE_SCOPE,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(config.privateKey).toString("base64url");
  const assertion = `${header}.${claims}.${signature}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!response.ok) throw new Error(`FIRESTORE_AUTH_${response.status}`);
  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expires: now + data.expires_in };
  return data.access_token;
}

/** A JS value as a Firestore REST value. */
function toValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toValue) } };
  if (typeof value === "object") {
    const fields: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) fields[key] = toValue(inner);
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function documentUrl(projectId: string, id?: string) {
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${COLLECTION}`;
  return id ? `${base}/${encodeURIComponent(id)}` : base;
}

async function toFirestore(lead: StoredLead, id: string): Promise<void> {
  const config = firestoreConfig();
  if (!config) throw new Error("NOT_CONFIGURED");
  const token = await accessToken(config);
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(lead)) fields[key] = toValue(value);
  fields.createdAt = { timestampValue: lead.createdAt };
  const response = await fetch(`${documentUrl(config.projectId)}?documentId=${encodeURIComponent(id)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) throw new Error(`FIRESTORE_${response.status}`);
}

/** Patch a few fields of a stored lead — the notification outcome, mostly. */
async function patchFirestore(id: string, patch: Record<string, unknown>): Promise<void> {
  const config = firestoreConfig();
  if (!config) return;
  const token = await accessToken(config);
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) fields[key] = toValue(value);
  const mask = Object.keys(patch)
    .map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`)
    .join("&");
  const response = await fetch(`${documentUrl(config.projectId, id)}?${mask}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) throw new Error(`FIRESTORE_${response.status}`);
}

function leadsFile() {
  return process.env.LEADS_FILE ?? path.join(process.cwd(), ".qa", "leads.jsonl");
}

async function toFile(lead: StoredLead, id: string): Promise<void> {
  const file = leadsFile();
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(file, `${JSON.stringify({ id, ...lead })}\n`, "utf8");
}

/** Keep a lead, wherever this deployment keeps them. Never throws. */
export async function storeLead(lead: StoredLead): Promise<Stored> {
  const id = `wl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  if (firestoreConfig()) {
    try {
      await toFirestore(lead, id);
      return { where: "firestore", id };
    } catch (error) {
      console.error("[lead] firestore failed:", error instanceof Error ? error.message : "unknown");
    }
  }
  if (process.env.NODE_ENV !== "production" || process.env.LEADS_FILE) {
    try {
      await toFile(lead, id);
      return { where: "file", id };
    } catch (error) {
      console.error("[lead] file failed:", error instanceof Error ? error.message : "unknown");
    }
  }
  return { where: "none", id };
}

/**
 * Record how the notifications went. Best effort: a failure here is logged
 * and swallowed, because the lead itself is already kept.
 */
export async function updateLead(stored: Stored, patch: { status: LeadStatus } & Record<string, unknown>): Promise<void> {
  if (stored.where === "firestore") {
    try {
      await patchFirestore(stored.id, patch);
    } catch (error) {
      console.error("[lead] firestore status update failed:", error instanceof Error ? error.message : "unknown");
    }
  } else if (stored.where === "file") {
    try {
      await appendFile(leadsFile(), `${JSON.stringify({ id: stored.id, update: patch })}\n`, "utf8");
    } catch {
      /* The row is already there; the update is a courtesy. */
    }
  }
}
