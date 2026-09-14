import type { Locale, Localized } from "@/lib/i18n";

/**
 * What each concept is called on the page.
 *
 * The concepts were built under one-word codenames — Divan, Ulak, Kervan and
 * the rest — which meant something to the person who built them and nothing
 * to a visitor. Those names stay as slugs and as keys in the data; everything
 * a visitor reads calls a concept what it is.
 */
export const CONCEPT_TITLES: Record<string, Localized> = {
  divan: { en: "Business Operating System", tr: "İş Yönetim Sistemi" },
  ulak: { en: "AI Operations Platform", tr: "Yapay Zekâ Operasyon Platformu" },
  kervan: { en: "Multi-vendor Marketplace", tr: "Çok Satıcılı Pazar Yeri" },
  vesile: { en: "Event & Ticketing Platform", tr: "Etkinlik ve Biletleme Platformu" },
  tezgah: { en: "Commerce Management System", tr: "Ticaret Yönetim Sistemi" },
  vardiya: { en: "AI Customer Support", tr: "Yapay Zekâ Müşteri Desteği" },
  olcek: { en: "Product Analytics Platform", tr: "Ürün Analitiği Platformu" },
  atolye: { en: "Operations Management", tr: "Operasyon Yönetimi" },
  kutuk: { en: "Company Knowledge Platform", tr: "Kurumsal Bilgi Platformu" },
  esik: { en: "Client Portal", tr: "Müşteri Portalı" },
};

export function conceptTitle(slug: string, locale: Locale, fallback = ""): string {
  const title = CONCEPT_TITLES[slug];
  return title ? title[locale] : fallback;
}

/** A piece of work as a visitor reads its name: a concept by its title, anything shipped by its own name. */
export function workName(ref: { kind: string; slug?: string; name: string }, locale: Locale): string {
  return ref.kind === "concept" && ref.slug ? conceptTitle(ref.slug, locale, ref.name) : ref.name;
}
