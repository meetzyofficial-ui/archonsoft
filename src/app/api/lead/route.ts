import { NextResponse } from "next/server";
import { DEPARTMENTS } from "@/data/departments";
import { hasLeadErrors, validateLead, type LeadPayload, type LeadResult } from "@/lib/leads";
import { leadStoreStatus, storeLead, updateLead, type LeadStatus } from "@/lib/leadStore";
import { sendWhatsApp, whatsappStatus } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A client request from the world.
 *
 * The brief a visitor gives at one of the offices arrives here and goes
 * through, in order: the honeypot, validation against the contract the
 * form used, a throttle per address, the store — Firestore when a service
 * account is configured, a local file in development — and only then the
 * notifications: an email to the studio and a WhatsApp message, both from
 * the server, every credential in the environment. The record is written
 * before anything is sent, so a failed email or a visitor who closes the
 * tab loses nothing; the record's status says how the notifications went.
 *
 * What counts as success: the lead is kept, or — with no store configured
 * — the email went out. WhatsApp is best effort and never fails a request.
 * The response says what happened to each; nothing is reported as sent that
 * was not. Logs carry outcomes and ids, never a name, an email or a number.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 4;
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
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

/** One line, no control characters: what goes into a header or a subject. */
const oneLine = (value: string) => value.replace(/[\r\n\t]|[\x00-\x1f\x7f]/g, " ").replace(/\s+/g, " ").trim();

type Names = { department: string; service: string; timeline: string };

const TIMELINE_LABELS: Record<string, string> = { asap: "As soon as possible", "1-3m": "1–3 months", "3-6m": "3–6 months", flexible: "Flexible" };

function emailHtml(lead: LeadPayload, when: string, names: Names, id: string, storedWhere: string): string {
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:6px 18px 6px 0;color:#7a8394;font:12px/1.4 system-ui;letter-spacing:.08em;text-transform:uppercase;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:6px 0;font:${strong ? "600 " : ""}15px/1.5 system-ui;color:#111827;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`;
  const section = (title: string, rows: string) =>
    `<h3 style="margin:26px 0 6px;font:600 12px/1.4 system-ui;letter-spacing:.14em;color:#f2a889;text-transform:uppercase">${title}</h3><table style="border-collapse:collapse;width:100%">${rows}</table>`;
  const contact = [lead.email, lead.phone ? `Tel ${lead.phone}` : "", lead.whatsapp ? `WhatsApp ${lead.whatsapp}` : ""].filter(Boolean).join(" · ");
  return `<!doctype html><html><body style="margin:0;background:#f4f5f8;padding:32px 16px"><div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:32px 36px">
<p style="margin:0;font:600 11px/1.4 system-ui;letter-spacing:.18em;color:#7a8394;text-transform:uppercase">Archon Soft World</p>
<h1 style="margin:8px 0 0;font:600 22px/1.3 system-ui;color:#111827">New client request</h1>
<p style="margin:6px 0 0;font:13px/1.5 system-ui;color:#7a8394">${escapeHtml(when)} · ${escapeHtml(lead.device)} · ${escapeHtml(lead.locale.toUpperCase())} · ref ${escapeHtml(id)}</p>
${section("Client", row("Client", lead.name, true) + row("Company", lead.company || "—") + row("Contact", contact))}
${section("Request", row("Department", names.department, true) + row("Service", names.service, true) + row("Project", lead.description) + row("Timeline", names.timeline) + (lead.notes ? row("Notes", lead.notes) : ""))}
${section("Context", row("Journey", (lead.journey ?? []).join(" → ") || "—") + row("Stored", storedWhere) + row("Source", "archon_world"))}
<p style="margin:28px 0 0;font:13px/1.5 system-ui;color:#7a8394">Reply to this email to answer the client directly.</p>
</div></body></html>`;
}

function emailText(lead: LeadPayload, when: string, names: Names, id: string): string {
  return [
    "ARCHON SOFT WORLD — NEW CLIENT REQUEST",
    "",
    `CLIENT      ${lead.name}`,
    `COMPANY     ${lead.company || "—"}`,
    `CONTACT     ${[lead.email, lead.phone, lead.whatsapp ? `WhatsApp ${lead.whatsapp}` : ""].filter(Boolean).join(" · ")}`,
    `DEPARTMENT  ${names.department}`,
    `SERVICE     ${names.service}`,
    `PROJECT     ${lead.description}`,
    `TIMELINE    ${names.timeline}`,
    lead.notes ? `NOTES       ${lead.notes}` : "",
    "",
    `Date ${when} · ${lead.device} · ${lead.locale} · ref ${id}`,
    `Journey: ${(lead.journey ?? []).join(" → ") || "—"}`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function emailStatus(): "configured" | "missing" {
  return process.env.RESEND_API_KEY && process.env.CONTACT_FROM_EMAIL ? "configured" : "missing";
}

async function email(lead: LeadPayload, when: string, names: Names, id: string, storedWhere: string): Promise<"sent" | "skipped" | "failed"> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO_EMAIL ?? process.env.CONTACT_TO_EMAIL ?? "info@archonsoft.tr";
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !from) return "skipped";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: oneLine(lead.email),
        subject: "ARCHON SOFT WORLD — NEW CLIENT REQUEST",
        html: emailHtml(lead, when, names, id, storedWhere),
        text: emailText(lead, when, names, id),
      }),
    });
    if (!response.ok) {
      console.error(`[lead ${id}] email failed: ${response.status}`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error(`[lead ${id}] email failed:`, error instanceof Error ? error.message : "unknown");
    return "failed";
  }
}

/** The variables each channel needs, by name — never their values. */
const REQUIRED = {
  store: ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"],
  email: ["RESEND_API_KEY", "CONTACT_FROM_EMAIL"],
  whatsapp: ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID"],
} as const;

/**
 * What is wired up, without a single secret: for the QA harness and the
 * report. Each channel is plainly active or inactive — a mocked WhatsApp or
 * a development file is not a production channel for email or messages —
 * with the detail beside it and the names of whatever is missing.
 */
export async function GET() {
  const detail = { store: leadStoreStatus(), email: emailStatus(), whatsapp: whatsappStatus() };
  const missing = Object.values(REQUIRED)
    .flat()
    .filter((name) => !process.env[name]);
  return NextResponse.json({
    ok: true,
    store: detail.store === "none" ? "inactive" : "active",
    email: detail.email === "configured" ? "active" : "inactive",
    whatsapp: detail.whatsapp === "configured" ? "active" : "inactive",
    detail,
    missing,
  });
}

export async function POST(request: Request) {
  let body: Partial<LeadPayload>;
  try {
    body = (await request.json()) as Partial<LeadPayload>;
  } catch {
    return NextResponse.json<LeadResult>({ ok: false, code: "MALFORMED" }, { status: 400 });
  }

  /* The hidden field: answer as if accepted, send nothing on. */
  if (body.website) return NextResponse.json<LeadResult>({ ok: true });

  const errors = validateLead(body);
  if (hasLeadErrors(errors)) {
    console.info("[lead] refused:", Object.keys(errors).join(","));
    return NextResponse.json<LeadResult>({ ok: false, errors }, { status: 422 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  if (throttled(ip)) return NextResponse.json<LeadResult>({ ok: false, code: "RATE_LIMITED" }, { status: 429 });

  const trim = (value: string | undefined, max: number) => oneLine(value ?? "").slice(0, max) || undefined;
  const lead: LeadPayload = {
    name: oneLine(body.name!).slice(0, 120),
    company: trim(body.company, 160),
    email: oneLine(body.email!).slice(0, 200),
    phone: trim(body.phone, 32),
    whatsapp: trim(body.whatsapp, 32),
    department: body.department!,
    service: body.service!,
    description: body.description!.trim().slice(0, 4000),
    timeline: body.timeline || "",
    notes: body.notes?.trim().slice(0, 2000) || undefined,
    consent: true,
    locale: body.locale === "en" ? "en" : "tr",
    device: body.device === "mobile" ? "mobile" : "desktop",
    journey: Array.isArray(body.journey) ? body.journey.slice(0, 12).map((step) => oneLine(String(step)).slice(0, 40)) : undefined,
  };

  const department = DEPARTMENTS.find((one) => one.id === lead.department)!;
  const service = department.services.find((one) => one.id === lead.service)!;
  const names: Names = {
    department: department.name[lead.locale],
    service: service.name[lead.locale],
    timeline: lead.timeline ? TIMELINE_LABELS[lead.timeline] ?? lead.timeline : "—",
  };
  const when = new Date().toISOString();

  /* 1. Keep it. */
  const stored = await storeLead({
    ...lead,
    departmentName: names.department,
    serviceName: names.service,
    source: "archon_world",
    userAgent: oneLine(request.headers.get("user-agent") ?? "").slice(0, 200),
    createdAt: when,
    status: "notification_pending",
  });

  /* 2. Tell the studio. */
  const whatsappText = [
    "ARCHON SOFT WORLD — Yeni Talep",
    "",
    `Ad: ${lead.name}`,
    `Şirket: ${lead.company || "—"}`,
    `E-posta: ${lead.email}`,
    `Telefon: ${lead.phone || lead.whatsapp || "—"}`,
    `Hizmet: ${names.service}`,
    `Departman: ${names.department}`,
    `Proje: ${lead.description.slice(0, 600)}`,
    `Teslim: ${names.timeline}`,
    `Ref: ${stored.id}`,
  ].join("\n");
  const [mail, whatsapp] = await Promise.all([email(lead, when, names, stored.id, stored.where), sendWhatsApp(whatsappText)]);

  /* 3. Say how it went, on the record and in the log: `new` when no channel
     is wired up (the record waits to be read), `notified` when the email
     went and nothing failed, `notification_partial` when one channel got
     through, `failed` when every channel tried and none did. The record
     sat at `notification_pending` in between. */
  const attempted = mail !== "skipped" || whatsapp === "sent" || whatsapp === "failed";
  const status: LeadStatus = !attempted
    ? "new"
    : mail === "sent" && whatsapp !== "failed"
      ? "notified"
      : mail === "sent" || whatsapp === "sent"
        ? "notification_partial"
        : "failed";
  await updateLead(stored, { status, emailStatus: mail, whatsappStatus: whatsapp, notifiedAt: new Date().toISOString() });
  console.info(`[lead ${stored.id}] stored=${stored.where} email=${mail} whatsapp=${whatsapp} status=${status} dept=${lead.department}/${lead.service} device=${lead.device}`);

  /* Kept, or at least delivered: the visitor may be told it arrived. Neither:
     tell them to try again — the record would otherwise vanish. */
  const accepted = stored.where !== "none" || mail === "sent";
  if (!accepted) {
    return NextResponse.json<LeadResult>({ ok: false, code: "NOT_STORED", stored: "none", notified: { email: mail, whatsapp } }, { status: 502 });
  }
  return NextResponse.json<LeadResult>({
    ok: true,
    id: stored.id,
    stored: stored.where,
    status,
    notified: { email: mail, whatsapp },
  });
}
