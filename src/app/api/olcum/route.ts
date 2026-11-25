import { sameOrigin } from "@/lib/fleet/auth";
import { dayOf, saveVisit, type StatEvent } from "@/lib/stats/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = new Set(["click", "section", "form", "world", "wa"]);
const text = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");
const whole = (value: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(value) || 0)));
const hits = new Map<string, number[]>();

/** One page view. Anonymous: no cookie, no address kept, nothing typed into a form. */
export async function POST(request: Request) {
  const done = new Response(null, { status: 204 });
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const agent = request.headers.get("user-agent") ?? "";
  if (!agent || /bot|crawl|spider|preview|headless|lighthouse/i.test(agent)) return done;

  /* The address is used for this limit and never written anywhere. */
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  if (recent.length > 40) return done;

  const raw = await request.text();
  if (raw.length > 12_000) return done;
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return done;
  }
  const path = text(body.path, 120);
  const id = text(body.id, 40).replace(/[^a-z0-9]/gi, "");
  if (!path.startsWith("/") || id.length < 8) return done;
  const events = (Array.isArray(body.events) ? body.events : [])
    .slice(0, 80)
    .map((one: Record<string, unknown>) => ({ k: text(one?.k, 10), l: text(one?.l, 80), n: whole(one?.n, 3600) }))
    .filter((one) => KINDS.has(one.k) && one.l) as StatEvent[];

  let city = text(request.headers.get("x-vercel-ip-city"), 60);
  try {
    city = decodeURIComponent(city);
  } catch {
    /* Already plain. */
  }
  const at = new Date();
  try {
    await saveVisit({
      id,
      at: `${dayOf(at)}T${new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(at)}`,
      s: text(body.s, 24),
      path,
      ref: text(body.ref, 80),
      src: text(body.src, 40),
      device: body.device === "telefon" ? "telefon" : "masaüstü",
      lang: text(body.lang, 5),
      city,
      country: text(request.headers.get("x-vercel-ip-country"), 4),
      sec: whole(body.sec, 7200),
      scroll: whole(body.scroll, 100),
      events,
    });
  } catch {
    console.error("[olcum] write failed");
  }
  return done;
}
