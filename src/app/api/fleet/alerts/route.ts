import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { authConfig, SESSION_COOKIE, verifySessionToken } from "@/lib/fleet/auth";
import { buildView, istanbulToday } from "@/lib/fleet/calc";
import { sendDigest } from "@/lib/fleet/notify";
import { loadData } from "@/lib/fleet/service";
import { getRepo } from "@/lib/fleet/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cronAllowed(request: Request): boolean {
  const secret = process.env.FLEET_CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || secret.length < 24) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Günlük uyarı özeti. Oturumla (panelden) ya da FLEET_CRON_SECRET ile
 * (zamanlanmış görev) çağrılır. ?gonder=1 verilirse yapılandırılmış kanallara
 * gönderir; kanal yapılandırılmamışsa sonuç bunu açıkça söyler.
 */
export async function GET(request: Request) {
  const jar = await cookies();
  const authed = verifySessionToken(jar.get(SESSION_COOKIE)?.value, authConfig()) || cronAllowed(request);
  if (!authed) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  try {
    const today = istanbulToday();
    const view = buildView(await loadData(getRepo()), today);
    const send = new URL(request.url).searchParams.get("gonder") === "1";
    const channels = send ? await sendDigest(view.alerts, today) : [];
    return NextResponse.json(
      { today, count: view.alerts.length, alerts: view.alerts, channels },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    console.error("[fleet] alerts failed");
    return NextResponse.json({ error: "Uyarılar hesaplanamadı." }, { status: 500 });
  }
}
