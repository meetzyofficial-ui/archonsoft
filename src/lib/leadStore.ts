import { createSign } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Where a lead is kept.
 *
 * Firestore, through its REST API, when a service account is configured:
 * a signed JWT is exchanged for a short-lived token and the document is
 * written to `world_leads`. No SDK — the two requests are all it takes, and
 * the private key never leaves the server. Without a service account the
 * lead still goes out by email and WhatsApp, and in development it is
 * appended to a local file so the flow can be tested end to end.
 *
 * Server-only: it reads `node:crypto` and `node:fs`, which no client bundle
 * has, so a client import fails the build.
 */

export type StoredLead = Record<string, unknown> & { createdAt: string };

type Stored = { where: "firestore" | "file" | "none"; id: string };

const FIRESTORE_SCOPE = "https://www.googleapis.com/auth/datastore";

function firestoreConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
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

async function toFirestore(lead: StoredLead, id: string): Promise<void> {
  const config = firestoreConfig();
  if (!config) throw new Error("NOT_CONFIGURED");
  const token = await accessToken(config);
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/world_leads?documentId=${encodeURIComponent(id)}`;
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(lead)) fields[key] = toValue(value);
  fields.createdAt = { timestampValue: lead.createdAt };
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) throw new Error(`FIRESTORE_${response.status}`);
}

async function toFile(lead: StoredLead, id: string): Promise<void> {
  const file = process.env.LEADS_FILE ?? path.join(process.cwd(), ".qa", "leads.jsonl");
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
      console.error("[lead] firestore failed:", error instanceof Error ? error.message : error);
    }
  }
  if (process.env.NODE_ENV !== "production" || process.env.LEADS_FILE) {
    try {
      await toFile(lead, id);
      return { where: "file", id };
    } catch (error) {
      console.error("[lead] file failed:", error instanceof Error ? error.message : error);
    }
  }
  return { where: "none", id };
}
