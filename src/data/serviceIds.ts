/**
 * The service ids, alone.
 *
 * Kept apart from `services.ts` so the contact contract — which runs on the
 * server as the gate — can check a service without importing every picture
 * the explorer shows.
 */
import type { ProjectType } from "@/lib/contact";
import type { Localized } from "@/lib/i18n";

export const SERVICE_IDS = [
  "mobile",
  "web",
  "custom",
  "commerce",
  "ai",
  "automation",
  "integration",
  "webgl",
  "design",
] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

/**
 * What the contact form needs to know about a service — its name and the
 * project type it selects — without the pictures.
 */
export const SERVICE_META: Record<ServiceId, { title: Localized; projectType: ProjectType }> = {
  mobile: { title: { en: "Mobile app", tr: "Mobil uygulama" }, projectType: "mobile" },
  web: { title: { en: "Web platform & SaaS", tr: "Web platformu & SaaS" }, projectType: "web" },
  custom: { title: { en: "Custom software", tr: "Özel yazılım" }, projectType: "business" },
  commerce: { title: { en: "E-commerce", tr: "E-ticaret" }, projectType: "commerce" },
  ai: { title: { en: "Artificial intelligence", tr: "Yapay zekâ" }, projectType: "ai" },
  automation: { title: { en: "Automation", tr: "Otomasyon" }, projectType: "automation" },
  integration: { title: { en: "API & integration", tr: "API & entegrasyon" }, projectType: "custom" },
  webgl: { title: { en: "Interactive 3D & WebGL", tr: "Etkileşimli 3D & WebGL" }, projectType: "custom" },
  design: { title: { en: "Product & interface design", tr: "Ürün & arayüz tasarımı" }, projectType: "product" },
};

export const isServiceId = (value: unknown): value is ServiceId =>
  typeof value === "string" && (SERVICE_IDS as readonly string[]).includes(value);
