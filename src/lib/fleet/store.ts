/**
 * Archon Fleet — kalıcı kayıt.
 *
 * Üretimde Firestore (REST API + servis hesabı; SDK yok, `leadStore` ile aynı
 * yaklaşım). Servis hesabının anahtarı yalnızca sunucuda durur; tarayıcı
 * Firestore'a hiç bağlanmaz, bu yüzden veritabanı kuralları istemci erişimini
 * tamamen kapatabilir (docs/FLEET.md).
 *
 * Geliştirmede (veya FLEET_DATA_FILE açıkça verilmişse) tek bir JSON dosyası.
 * İkisi de yoksa depo YOKTUR ve sistem bunu açıkça söyler — veriler sessizce
 * belleğe yazılıp kaybolmaz.
 *
 * Sunucuya özel: `node:crypto` ve `node:fs` okur.
 */
import { createSign } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export const COLLECTIONS = [
  "vehicles",
  "drivers",
  "rentals",
  "payments",
  "expenses",
  "odometer",
  "adjustments",
  "audit",
  "settings",
] as const;
export type Collection = (typeof COLLECTIONS)[number];

type Doc = { id: string } & Record<string, unknown>;

export interface Repo {
  readonly kind: "firestore" | "file" | "memory";
  list<T>(collection: Collection): Promise<T[]>;
  get<T>(collection: Collection, id: string): Promise<T | null>;
  /** Var olan kaydın üzerine yazmaz; aynı id varsa hata verir. */
  create(collection: Collection, doc: Doc): Promise<void>;
  /** Yalnızca var olan kaydı günceller. */
  update(collection: Collection, doc: Doc): Promise<void>;
  /** Ayarlar gibi tekil belgeler için. */
  upsert(collection: Collection, doc: Doc): Promise<void>;
}

export class StoreError extends Error {
  code: "NOT_CONFIGURED" | "EXISTS" | "MISSING" | "BACKEND";
  constructor(code: StoreError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/* ------------------------------------------------------------------ */
/*  Bellek (testler)                                                    */
/* ------------------------------------------------------------------ */

export class MemoryRepo implements Repo {
  readonly kind: Repo["kind"] = "memory";
  data: Record<string, Record<string, Doc>> = {};

  private bucket(c: Collection) {
    return (this.data[c] ??= {});
  }
  async list<T>(c: Collection): Promise<T[]> {
    return Object.values(this.bucket(c)).map((d) => clone(d) as unknown as T);
  }
  async get<T>(c: Collection, id: string): Promise<T | null> {
    const d = this.bucket(c)[id];
    return d ? (clone(d) as unknown as T) : null;
  }
  async create(c: Collection, doc: Doc) {
    if (this.bucket(c)[doc.id]) throw new StoreError("EXISTS", "Kayıt zaten var.");
    this.bucket(c)[doc.id] = clone(doc);
  }
  async update(c: Collection, doc: Doc) {
    if (!this.bucket(c)[doc.id]) throw new StoreError("MISSING", "Kayıt bulunamadı.");
    this.bucket(c)[doc.id] = clone(doc);
  }
  async upsert(c: Collection, doc: Doc) {
    this.bucket(c)[doc.id] = clone(doc);
  }
}

/* ------------------------------------------------------------------ */
/*  Dosya (geliştirme / kendi sunucusu)                                 */
/* ------------------------------------------------------------------ */

export class FileRepo extends MemoryRepo {
  override readonly kind: Repo["kind"] = "file";
  private loaded = false;
  private chain: Promise<unknown> = Promise.resolve();
  private readonly file: string;

  constructor(file: string) {
    super();
    this.file = file;
  }

  private async load() {
    if (this.loaded) return;
    try {
      this.data = JSON.parse(await readFile(this.file, "utf8")) as MemoryRepo["data"];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      this.data = {};
    }
    this.loaded = true;
  }

  private async persist() {
    await mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(this.data, null, 1), "utf8");
    await rename(tmp, this.file);
  }

  private serial<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.chain.then(fn, fn);
    this.chain = next.catch(() => undefined);
    return next;
  }

  override list<T>(c: Collection) {
    return this.serial(async () => {
      await this.load();
      return super.list<T>(c);
    });
  }
  override get<T>(c: Collection, id: string) {
    return this.serial(async () => {
      await this.load();
      return super.get<T>(c, id);
    });
  }
  override create(c: Collection, doc: Doc) {
    return this.serial(async () => {
      await this.load();
      await super.create(c, doc);
      await this.persist();
    });
  }
  override update(c: Collection, doc: Doc) {
    return this.serial(async () => {
      await this.load();
      await super.update(c, doc);
      await this.persist();
    });
  }
  override upsert(c: Collection, doc: Doc) {
    return this.serial(async () => {
      await this.load();
      await super.upsert(c, doc);
      await this.persist();
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Firestore REST                                                      */
/* ------------------------------------------------------------------ */

type FsValue =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { stringValue: string }
  | { arrayValue: { values?: FsValue[] } }
  | { mapValue: { fields?: Record<string, FsValue> } };

export function encodeValue(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string") return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
  if (typeof v === "object") return { mapValue: { fields: encodeFields(v as Record<string, unknown>) } };
  return { stringValue: String(v) };
}

export function encodeFields(obj: Record<string, unknown>): Record<string, FsValue> {
  const out: Record<string, FsValue> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = encodeValue(v);
  return out;
}

export function decodeValue(v: FsValue): unknown {
  if ("nullValue" in v) return null;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("stringValue" in v) return v.stringValue;
  if ("arrayValue" in v) return (v.arrayValue.values ?? []).map(decodeValue);
  if ("mapValue" in v) return decodeFields(v.mapValue.fields ?? {});
  return null;
}

export function decodeFields(fields: Record<string, FsValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v);
  return out;
}

type FsConfig = { projectId: string; clientEmail: string; privateKey: string };

function firestoreConfig(): FsConfig | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

export class FirestoreRepo implements Repo {
  readonly kind: Repo["kind"] = "firestore";
  private token: { value: string; expires: number } | null = null;
  private readonly config: FsConfig;
  private readonly prefix: string;

  constructor(config: FsConfig, prefix = "fleet_") {
    this.config = config;
    this.prefix = prefix;
  }

  private get base() {
    return `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents`;
  }

  private async accessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.token && this.token.expires > now + 60) return this.token.value;
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const claims = Buffer.from(
      JSON.stringify({
        iss: this.config.clientEmail,
        scope: "https://www.googleapis.com/auth/datastore",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      }),
    ).toString("base64url");
    const signer = createSign("RSA-SHA256");
    signer.update(`${header}.${claims}`);
    const assertion = `${header}.${claims}.${signer.sign(this.config.privateKey).toString("base64url")}`;
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    });
    if (!res.ok) throw new StoreError("BACKEND", `Veritabanı oturumu açılamadı (${res.status}).`);
    const json = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: json.access_token, expires: now + json.expires_in };
    return json.access_token;
  }

  private async call(url: string, init: RequestInit = {}): Promise<Response> {
    const token = await this.accessToken();
    return fetch(url, {
      ...init,
      cache: "no-store",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) },
    });
  }

  private col(c: Collection) {
    return `${this.base}/${this.prefix}${c}`;
  }

  async list<T>(c: Collection): Promise<T[]> {
    const out: T[] = [];
    let pageToken = "";
    for (let page = 0; page < 200; page++) {
      const url = `${this.col(c)}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
      const res = await this.call(url);
      if (!res.ok) throw new StoreError("BACKEND", `Kayıtlar okunamadı (${res.status}).`);
      const json = (await res.json()) as { documents?: { fields?: Record<string, FsValue> }[]; nextPageToken?: string };
      for (const d of json.documents ?? []) out.push(decodeFields(d.fields ?? {}) as T);
      if (!json.nextPageToken) break;
      pageToken = json.nextPageToken;
    }
    return out;
  }

  async get<T>(c: Collection, id: string): Promise<T | null> {
    const res = await this.call(`${this.col(c)}/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new StoreError("BACKEND", `Kayıt okunamadı (${res.status}).`);
    const json = (await res.json()) as { fields?: Record<string, FsValue> };
    return decodeFields(json.fields ?? {}) as T;
  }

  private async write(c: Collection, doc: Doc, precondition: "" | "exists=false" | "exists=true") {
    const qs = precondition ? `?currentDocument.${precondition}` : "";
    const res = await this.call(`${this.col(c)}/${encodeURIComponent(doc.id)}${qs}`, {
      method: "PATCH",
      body: JSON.stringify({ fields: encodeFields(doc) }),
    });
    if (res.ok) return;
    if (res.status === 409 || res.status === 400) throw new StoreError("EXISTS", "Kayıt zaten var.");
    if (res.status === 404) throw new StoreError("MISSING", "Kayıt bulunamadı.");
    throw new StoreError("BACKEND", `Kayıt yazılamadı (${res.status}).`);
  }

  create(c: Collection, doc: Doc) {
    return this.write(c, doc, "exists=false");
  }
  update(c: Collection, doc: Doc) {
    return this.write(c, doc, "exists=true");
  }
  upsert(c: Collection, doc: Doc) {
    return this.write(c, doc, "");
  }
}

/* ------------------------------------------------------------------ */

let repo: Repo | null | undefined;

export function storeKind(): "firestore" | "file" | "none" {
  if (firestoreConfig()) return "firestore";
  if (process.env.FLEET_DATA_FILE || process.env.NODE_ENV !== "production") return "file";
  return "none";
}

export function getRepo(): Repo {
  if (repo) return repo;
  const fs = firestoreConfig();
  if (fs) repo = new FirestoreRepo(fs);
  else if (process.env.FLEET_DATA_FILE || process.env.NODE_ENV !== "production") {
    repo = new FileRepo(process.env.FLEET_DATA_FILE || path.join(process.cwd(), ".qa", "fleet-data.json"));
  } else {
    throw new StoreError("NOT_CONFIGURED", "Veritabanı yapılandırılmamış (FIREBASE_* ortam değişkenleri).");
  }
  return repo;
}

/** Testler için. */
export function setRepo(next: Repo | null) {
  repo = next;
}
