/**
 * Single source of truth for site-wide identity, routing and contact details.
 * Anything that would otherwise be typed twice lives here.
 */

export const SITE = {
  name: "Archon Soft",
  shortName: "Archon",
  /** Used for canonical URLs, sitemap entries and Open Graph image origins. */
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://archonsoft.tr",
  /** The bare host, for display in the footer and on Open Graph cards. */
  domain: "archonsoft.tr",
  tagline: "We build what comes next.",
  description:
    "Archon Soft is a software studio designing and engineering digital products, platforms and applied-intelligence systems for teams with ambitious ideas.",
  locale: "en_US",
} as const;

/**
 * The public contact address.
 *
 * Deliberately not invented: no mailbox exists yet, so publishing one would put
 * a dead address in front of visitors. Set `NEXT_PUBLIC_CONTACT_EMAIL` when the
 * real one is live and every mailto on the site turns on at once — until then
 * the interface routes people to the contact form instead of a broken link.
 */
export const CONTACT_EMAIL: string | null =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;

export type NavItem = {
  label: string;
  href: string;
  /** Index shown alongside the label in the overlay navigation. */
  index: string;
};

export const NAV: readonly NavItem[] = [
  { label: "Work", href: "/projects", index: "01" },
  { label: "Capabilities", href: "/capabilities", index: "02" },
  { label: "Lab", href: "/lab", index: "03" },
  { label: "About", href: "/about", index: "04" },
  { label: "Contact", href: "/contact", index: "05" },
];

/**
 * Social profiles are intentionally empty until real accounts exist.
 * The footer renders this list only when it has entries, so no placeholder
 * or dead links are ever shipped.
 */
export const SOCIALS: readonly { label: string; href: string }[] = [];
