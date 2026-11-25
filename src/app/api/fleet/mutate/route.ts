import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authConfig, sameOrigin, SESSION_COOKIE, verifySessionToken } from "@/lib/fleet/auth";
import { defaultCtx, FleetError, isOperation, runOperation } from "@/lib/fleet/service";
import { StoreError } from "@/lib/fleet/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bütün kayıt işlemlerinin tek kapısı: { op, input }. Oturum ve köken
 * kontrolünden geçmeyen istek hiçbir işlem yapamaz. Hata mesajları kullanıcıya
 * Türkçe gider; sunucu loguna yalnızca işlem adı yazılır, girilen veri asla.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Geçersiz istek." }, { status: 403 });
  const jar = await cookies();
  if (!verifySessionToken(jar.get(SESSION_COOKIE)?.value, authConfig())) {
    return NextResponse.json({ error: "Oturum süresi doldu. Tekrar giriş yapın." }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { op?: unknown; input?: unknown } | null;
  if (!body || !isOperation(body.op) || typeof body.input !== "object" || body.input === null || Array.isArray(body.input)) {
    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  }
  try {
    const ctx = defaultCtx();
    const result = (await runOperation(ctx, body.op, body.input as Record<string, unknown>)) as { id?: string } | null;
    return NextResponse.json({ ok: true, id: result && typeof result === "object" ? result.id ?? null : null });
  } catch (error) {
    if (error instanceof FleetError) {
      return NextResponse.json({ error: error.message, errors: error.errors, warning: error.warning }, { status: error.status });
    }
    if (error instanceof StoreError) {
      const status = error.code === "NOT_CONFIGURED" ? 503 : error.code === "EXISTS" ? 409 : error.code === "MISSING" ? 404 : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error(`[fleet] ${String(body.op)} failed`);
    return NextResponse.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 });
  }
}
