import { NextResponse } from "next/server";
import {
  authConfig,
  clearLoginAttempts,
  createSessionToken,
  loginThrottled,
  recordFailedLogin,
  sameOrigin,
  SESSION_COOKIE,
  SESSION_DAYS,
  verifyPassword,
} from "@/lib/fleet/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clientKey = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";

/** Giriş: tek şifre. Yanlış denemeler yavaşlatılır; şifre ve özeti asla loglanmaz. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Geçersiz istek." }, { status: 403 });
  const config = authConfig();
  if (!config) return NextResponse.json({ error: "Giriş yapılandırılmamış." }, { status: 503 });

  const key = clientKey(request);
  if (loginThrottled(key)) {
    return NextResponse.json({ error: "Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin." }, { status: 429 });
  }
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password.slice(0, 200) : "";
  if (!password || !verifyPassword(password, config.hash)) {
    recordFailedLogin(key);
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
  }
  clearLoginAttempts(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(config), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Geçersiz istek." }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
