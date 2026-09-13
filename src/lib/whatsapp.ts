/**
 * A WhatsApp message to the studio.
 *
 * Through the WhatsApp Business Cloud API when it is configured — a token,
 * the business phone-number id, and the number to notify — and mocked
 * otherwise: logged on the server in development, skipped in production.
 * The token is read from the environment on the server and nowhere else.
 *
 * Note for whoever wires the real account: the Cloud API only delivers a
 * free-form text to a number that has messaged the business in the last
 * twenty-four hours; outside that window it needs an approved template.
 * Set `WHATSAPP_TEMPLATE` to the template's name to send that instead, with
 * the message as its one body parameter.
 */

export type WhatsAppResult = "sent" | "skipped" | "failed" | "mocked";

export const WHATSAPP_DEFAULT_TO = "905521920002";

/** Whether the Cloud API is wired up, without a secret: for the status endpoint. */
export function whatsappStatus(): "configured" | "mocked" | "missing" {
  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID) return "configured";
  return process.env.NODE_ENV !== "production" ? "mocked" : "missing";
}

export async function sendWhatsApp(body: string): Promise<WhatsAppResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const to = (process.env.WHATSAPP_TO ?? WHATSAPP_DEFAULT_TO).replace(/\D/g, "");
  const template = process.env.WHATSAPP_TEMPLATE;

  if (!token || !phoneId) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[whatsapp:mock] → ${to}\n${body}`);
      return "mocked";
    }
    return "skipped";
  }

  const message = template
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? "tr" },
          components: [{ type: "body", parameters: [{ type: "text", text: body.slice(0, 1024) }] }],
        },
      }
    : { messaging_product: "whatsapp", to, type: "text", text: { preview_url: false, body: body.slice(0, 4096) } };

  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    if (!response.ok) {
      console.error("[whatsapp] failed:", response.status, (await response.text()).slice(0, 300));
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[whatsapp] failed:", error instanceof Error ? error.message : error);
    return "failed";
  }
}
