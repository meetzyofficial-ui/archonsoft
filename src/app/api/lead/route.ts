import { NextResponse } from "next/server";
import { DEPARTMENTS } from "@/data/departments";
import { hasLeadErrors, validateLead, type LeadPayload, type LeadResult } from "@/lib/leads";
import { storeLead } from "@/lib/leadStore";
import { sendWhatsApp } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A client request from the world.
 *
 * The brief a visitor gives at one of the offices arrives here, is checked
 * against the same contract the form used, throttled per address, kept
 * (Firestore when configured, a local file in development), and announced:
 * an email to the studio and a WhatsApp message, both from the server, with
 * every credential read from the environment. The response says what
 * happened to each — nothing is reported as sent that was not.
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
const oneLine = (value: string) => value.replace(/[\r\n\t]+/g, " ").trim();

type Row = [string, string];

function rows(lead: LeadPayload, when: string, names: { department: string; service: string }): Row[] {
  return [
    ["Name", lead.name],
    ["Company", lead.company || "—"],
    ["Email", lead.email],
    ["Phone", lead.phone || "—"],
    ["WhatsApp", lead.whatsapp || "—"],
    ["Department", names.department],
    ["Service", names.service],
    ["Project", lead.description],
    ["Budget", lead.budget || "—"],
    ["Timeline", lead.timeline || "—"],
    ["Notes", lead.notes || "—"],
    ["Date", when],
    ["Device", lead.device],
    ["Locale", lead.locale],
    ["Journey", (lead.journey ?? []).join(" → ") || "—"],
    ["Source", "archon_world"],
  ];
}

async function email(lead: LeadPayload, table: Row[]): Promise<"sent" | "skipped" | "failed"> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO_EMAIL ?? process.env.CONTACT_TO_EMAIL ?? "info@archonsoft.tr";
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !from) return "skipped";

  const html = [
    `<h2 style="font:600 18px system-ui">ARCHON SOFT WORLD — NEW CLIENT REQUEST</h2>`,
    `<table style="font:14px system-ui;border-collapse:collapse">`,
    ...table.map(
      ([label, value]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#666;vertical-align:top">${escapeHtml(label)}</td><td style="padding:4px 0;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
    ),
    `</table>`,
  ].join("");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: oneLine(lead.email),
        subject: "ARCHON SOFT WORLD — NEW CLIENT REQUEST",
        html,
        text: table.map(([label, value]) => `${label}: ${value}`).join("\n"),
      }),
    });
    if (!response.ok) {
      console.error("[lead] email failed:", response.status);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[lead] email failed:", error instanceof Error ? error.message : error);
    return "failed";
  }
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
  if (hasLeadErrors(errors)) return NextResponse.json<LeadResult>({ ok: false, errors }, { status: 422 });

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
    budget: body.budget || "",
    timeline: body.timeline || "",
    notes: body.notes?.trim().slice(0, 2000) || undefined,
    consent: true,
    locale: body.locale === "en" ? "en" : "tr",
    device: body.device === "mobile" ? "mobile" : "desktop",
    journey: Array.isArray(body.journey) ? body.journey.slice(0, 12).map((step) => oneLine(String(step)).slice(0, 40)) : undefined,
  };

  const department = DEPARTMENTS.find((one) => one.id === lead.department)!;
  const service = department.services.find((one) => one.id === lead.service)!;
  const names = { department: department.name[lead.locale], service: service.name[lead.locale] };
  const when = new Date().toISOString();
  const table = rows(lead, when, names);

  const stored = await storeLead({
    ...lead,
    departmentName: names.department,
    serviceName: names.service,
    source: "archon_world",
    userAgent: oneLine(request.headers.get("user-agent") ?? "").slice(0, 200),
    createdAt: when,
  });

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
    `Bütçe: ${lead.budget || "—"}`,
    `Teslim: ${lead.timeline || "—"}`,
  ].join("\n");

  const [mail, whatsapp] = await Promise.all([email(lead, table), sendWhatsApp(whatsappText)]);

  return NextResponse.json<LeadResult>({
    ok: true,
    id: stored.id,
    stored: stored.where,
    notified: { email: mail, whatsapp },
  });
}
