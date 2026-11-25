/**
 * Uyarı kanalları.
 *
 * Panel içi uyarılar her zaman çalışır (Dashboard ve üst çubuk, `buildView`
 * çıktısından). E-posta özeti yalnızca RESEND_API_KEY, CONTACT_FROM_EMAIL ve
 * FLEET_ALERT_EMAIL tanımlıysa gönderilir; tanımlı değilse kanal "yapılandırılmadı"
 * döner, gönderilmiş gibi davranmaz. Yeni bir kanal (WhatsApp, SMS) eklemek
 * için `Channel` arayüzünü uygulayan bir nesne `CHANNELS` listesine eklenir.
 */
import type { Alert } from "./calc";

export type ChannelResult = { channel: string; status: "sent" | "not_configured" | "skipped" | "failed"; detail?: string };

export interface Channel {
  name: string;
  configured(): boolean;
  send(subject: string, alerts: Alert[]): Promise<ChannelResult>;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

export function digestHtml(alerts: Alert[], siteUrl: string): string {
  const rows = alerts
    .map(
      (a) =>
        `<tr><td style="padding:6px 10px;color:${a.severity === "danger" ? "#9c0006" : "#9c5700"}">●</td>` +
        `<td style="padding:6px 10px"><b>${esc(a.title)}</b><br><span style="color:#555">${esc(a.detail)}</span></td></tr>`,
    )
    .join("");
  return (
    `<div style="font:14px system-ui,Arial">` +
    `<h2 style="font-size:18px">Archon Fleet — ${alerts.length} uyarı</h2>` +
    `<table style="border-collapse:collapse">${rows}</table>` +
    `<p><a href="${esc(siteUrl)}/fleet">Paneli aç</a></p></div>`
  );
}

export const emailChannel: Channel = {
  name: "email",
  configured: () => Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_FROM_EMAIL && process.env.FLEET_ALERT_EMAIL),
  async send(subject, alerts) {
    if (!this.configured()) return { channel: "email", status: "not_configured" };
    if (!alerts.length) return { channel: "email", status: "skipped", detail: "Uyarı yok" };
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL,
        to: [process.env.FLEET_ALERT_EMAIL],
        subject,
        html: digestHtml(alerts, process.env.NEXT_PUBLIC_SITE_URL ?? "https://archonsoft.tr"),
      }),
    });
    return res.ok ? { channel: "email", status: "sent" } : { channel: "email", status: "failed", detail: `HTTP ${res.status}` };
  },
};

export const CHANNELS: Channel[] = [emailChannel];

export async function sendDigest(alerts: Alert[], today: string): Promise<ChannelResult[]> {
  const subject = `Archon Fleet · ${today} · ${alerts.filter((a) => a.severity === "danger").length} acil, ${alerts.length} toplam uyarı`;
  const results: ChannelResult[] = [];
  for (const channel of CHANNELS) {
    try {
      results.push(await channel.send(subject, alerts));
    } catch {
      results.push({ channel: channel.name, status: "failed" });
    }
  }
  return results;
}
