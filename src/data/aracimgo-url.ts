/**
 * AracımGo's production address — one constant for the whole site and the
 * world, so no surface can point somewhere else.
 *
 * Taken from the product's own repository, not guessed: `apps/site/src/lib/
 * config.ts` there sets `DEFAULT_SITE = 'https://aracımgo.com'`, and its
 * deployment notes record the marketing site as live on that domain (the apex
 * answers 308 to www, www answers 200 — checked 2026-09-19). The domain is an
 * IDN; browsers send it as xn--aracmgo-ufb.com, the text shown stays readable.
 */
export const ARACIMGO_URL = "https://aracımgo.com";
export const ARACIMGO_DOMAIN = "aracımgo.com";
