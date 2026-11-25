/**
 * Archon Fleet — tek şifreli giriş.
 *
 * Kullanıcı hesabı yok: panel tek kişiye ait ve tek bir şifreyle açılır.
 * Şifrenin kendisi hiçbir yerde saklanmaz; FLEET_PASSWORD_HASH ortam
 * değişkeninde scrypt özeti durur (`node scripts/fleet-password.mjs` üretir).
 *
 * Oturum, FLEET_SESSION_SECRET ile HMAC imzalı bir çerezdir: HttpOnly
 * (JavaScript okuyamaz), SameSite=Strict (başka siteden gelen istekte
 * gönderilmez), üretimde Secure. FLEET_SESSION_VERSION değiştirilirse bütün
 * açık oturumlar düşer.
 *
 * Sunucuya özel.
 */
import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "archon_fleet";
export const SESSION_DAYS = 14;

export type AuthConfig = { hash: string; secret: string; version: string };

export function authConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig | null {
  const hash = env.FLEET_PASSWORD_HASH?.trim();
  const secret = env.FLEET_SESSION_SECRET?.trim();
  if (!hash || !secret || secret.length < 32 || !hash.startsWith("scrypt:")) return null;
  return { hash, secret, version: env.FLEET_SESSION_VERSION?.trim() || "1" };
}

/**
 * scrypt:N:r:p:tuz(base64url):özet(base64url)
 * Ayraç ":" — "$" kullanılsaydı Next'in .env okuyucusu onları değişken sanıp silerdi.
 */
export function hashPassword(password: string, salt: Buffer, N = 16384, r = 8, p = 1): string {
  const key = scryptSync(password.normalize("NFKC"), salt, 32, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return `scrypt:${N}:${r}:${p}:${salt.toString("base64url")}:${key.toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, salt, hash] = parts as [string, string, string, string, string, string];
  const N = Number(n);
  const R = Number(r);
  const P = Number(p);
  if (![N, R, P].every((x) => Number.isInteger(x) && x > 0) || N > 1 << 20) return false;
  const expected = Buffer.from(hash, "base64url");
  if (expected.length !== 32) return false;
  const actual = scryptSync(password.normalize("NFKC"), Buffer.from(salt, "base64url"), 32, {
    N,
    r: R,
    p: P,
    maxmem: 64 * 1024 * 1024,
  });
  return timingSafeEqual(actual, expected);
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(config: AuthConfig, now = Date.now()): string {
  const payload = Buffer.from(
    JSON.stringify({ v: config.version, exp: now + SESSION_DAYS * 86_400_000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload, config.secret)}`;
}

export function verifySessionToken(token: string | undefined | null, config: AuthConfig | null, now = Date.now()): boolean {
  if (!token || !config) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = Buffer.from(sign(payload, config.secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { v?: string; exp?: number };
    return data.v === config.version && typeof data.exp === "number" && data.exp > now;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Kaba kuvvet freni                                                   */
/* ------------------------------------------------------------------ */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, number[]>();

/** Örnek başına, bellekte. Ağ geçidi limitinin yerini tutmaz; tahmin denemelerini yavaşlatır. */
export function loginThrottled(key: string, now = Date.now()): boolean {
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  attempts.set(key, recent);
  if (attempts.size > 5000) attempts.clear();
  return recent.length >= MAX_ATTEMPTS;
}

export function recordFailedLogin(key: string, now = Date.now()) {
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  attempts.set(key, recent);
}

export function clearLoginAttempts(key: string) {
  attempts.delete(key);
}

/** Durum değiştiren istekler yalnızca kendi kökenimizden gelebilir. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") === "same-origin";
  try {
    return new URL(origin).host === new URL(request.url).host || origin === process.env.NEXT_PUBLIC_SITE_URL;
  } catch {
    return false;
  }
}
