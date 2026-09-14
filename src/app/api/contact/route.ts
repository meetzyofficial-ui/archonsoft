import { NextResponse } from "next/server";
import { hasErrors, validateContact, type ContactPayload } from "@/lib/contact";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Contact delivery.
 *
 * This is the single integration point for the form. With no mail provider
 * configured it answers 503 and says so plainly rather than pretending a
 * message was sent. Swapping Resend for another provider, a CRM or a queue
 * means changing `deliver` and nothing else.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

/** Best-effort throttle. Per-instance and in-memory: it takes the edge off
 *  casual abuse, and is not a substitute for a real gateway limiter. */
const hits = new Map<string, number[]>();

function throttled(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char,
  );

async function deliver(payload: ContactPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    throw new Error("NOT_CONFIGURED");
  }

  const rows: [string, string][] = [
    ["Name", payload.name],
    ["Email", payload.email],
    ["Company", payload.company || "—"],
    ["Project type", payload.projectType],
    ...(payload.service ? ([["Service", payload.service]] as [string, string][]) : []),
  ];

  const html = [
    `<h2 style="font:600 18px system-ui">New enquiry — ${SITE.domain}</h2>`,
    `<table style="font:14px system-ui;border-collapse:collapse">`,
    ...rows.map(
      ([label, value]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#666">${escapeHtml(label)}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`,
    ),
    `</table>`,
    `<p style="font:14px/1.6 system-ui;white-space:pre-wrap">${escapeHtml(payload.message)}</p>`,
  ].join("");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: payload.email,
      subject: `Enquiry — ${payload.name}${payload.company ? ` (${payload.company})` : ""}`,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(`PROVIDER_${response.status}`);
  }
}

export async function POST(request: Request) {
  let body: Partial<ContactPayload>;
  try {
    body = (await request.json()) as Partial<ContactPayload>;
  } catch {
    return NextResponse.json({ ok: false, code: "MALFORMED" }, { status: 400 });
  }

  // Hidden field. Answer as if accepted so a bot learns nothing, but send
  // nothing on: a real person can never trip this.
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const errors = validateContact(body);
  if (hasErrors(errors)) {
    return NextResponse.json({ ok: false, errors }, { status: 422 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (throttled(ip)) {
    return NextResponse.json(
      { ok: false, code: "RATE_LIMITED" },
      { status: 429 },
    );
  }

  const payload: ContactPayload = {
    name: body.name!.trim(),
    email: body.email!.trim(),
    company: body.company?.trim() || undefined,
    projectType: body.projectType!.trim(),
    service: body.service?.trim() || undefined,
    message: body.message!.trim(),
  };

  try {
    await deliver(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "UNKNOWN";

    if (reason === "NOT_CONFIGURED") {
      return NextResponse.json(
        {
          ok: false,
          code: "NOT_CONFIGURED",
          message: "NOT_CONFIGURED",
        },
        { status: 503 },
      );
    }

    console.error("[contact] delivery failed:", reason);
    return NextResponse.json(
      { ok: false, code: "PROVIDER_ERROR" },
      { status: 502 },
    );
  }
}
