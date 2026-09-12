import { WorldGate } from "@/components/world/WorldGate";
import { dict, type Copy } from "@/i18n/dictionary";
import type { Locale } from "@/lib/i18n";
import { buildWorld } from "@/lib/worldPayload";

/**
 * Where Archon World is mounted from.
 *
 * It renders from the layout rather than the home page, and the reason is
 * structural: the route template animates a transform, and a transformed
 * element becomes the containing block for its fixed descendants. Mounted
 * inside the page, the overlay laid out in the document flow for the first
 * second of every cold load. From the layout there is no transform above it
 * and it is fixed from the first frame.
 *
 * It is last in the body for two reasons: the world portals to the end of the
 * body anyway, so rendering here first means nothing moves; and the small
 * re-entry control it leaves behind must not come before the header's own skip
 * link in the tab order.
 *
 * Everything the world says is resolved here, on the server — localised by the
 * same function the pages use and pointed at the same optimised images — so
 * the environment and the site can never drift, and the client bundle that
 * carries the scene carries no i18n and no `next/image`.
 *
 * The world has its own language, chosen on its opening screen and kept in
 * the browser, Turkish by default — independent of the route the site is
 * on. So both languages are resolved here and the world switches between
 * them without a reload.
 */
export function WorldMount({ locale }: { locale: Locale; copy?: Copy }) {
  return (
    <WorldGate
      locale={locale}
      copies={{ en: dict("en").world, tr: dict("tr").world }}
      payloads={{ en: buildWorld("en"), tr: buildWorld("tr") }}
    />
  );
}
