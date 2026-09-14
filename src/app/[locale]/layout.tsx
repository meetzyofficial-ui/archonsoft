import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import localFont from "next/font/local";
import "../globals.css";

import { Cursor } from "@/components/chrome/Cursor";
import { Preloader } from "@/components/chrome/Preloader";
import { SmoothScroll } from "@/components/chrome/SmoothScroll";
import { Atmosphere } from "@/components/site/Atmosphere";
import { LogoField } from "@/components/site/LogoField";
import { SiteHeader } from "@/components/site/SiteHeader";
import { StudioClosing } from "@/components/site/StudioClosing";
import { WorldMount } from "@/components/world/WorldMount";
import { dict } from "@/i18n/dictionary";
import { HTML_LANG, isLocale, LOCALES, OG_LOCALE, type Locale } from "@/lib/i18n";
import { CONTACT_EMAIL, SITE } from "@/lib/site";

/**
 * The root layout lives under `[locale]` so `<html lang>` is correct for the
 * document rather than patched in on the client. Middleware guarantees every
 * request reaching here already carries a locale prefix.
 */

/**
 * The type system, in three files.
 *
 * Newsreader sets every statement, Instrument Sans sets every interface, and
 * Geist Mono sets every piece of data. The first two are self-hosted `@font-face`
 * declarations in `globals.css` and preloaded by hand below — they are static
 * paths, so there is nothing to look up and nothing that can silently stop
 * being emitted.
 *
 * Only the mono comes through Next's loader, because only the mono is still a
 * package dependency. Two weights, not the twelve the family ships: the rest
 * were being downloaded to render glyphs nobody asks for. `adjustFontFallback`
 * stays on by default, so a swap changes the face and not the layout.
 *
 * The paths are written out because Next's font loader requires literals: it
 * reads them at build time to fingerprint and emit the files, so a template
 * string it cannot evaluate is a build error rather than a runtime one.
 */
const GeistMono = localFont({
  src: [
    {
      path: "../../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
  preload: true,
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = dict(locale);

  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: copy.meta.home.title,
      template: `%s — ${SITE.name}`,
    },
    description: copy.meta.description,
    applicationName: SITE.name,
    authors: [{ name: SITE.name, url: SITE.url }],
    creator: SITE.name,
    publisher: SITE.name,
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", tr: "/tr", "x-default": "/en" },
    },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: OG_LOCALE[locale],
      url: `${SITE.url}/${locale}`,
      title: copy.meta.home.title,
      description: copy.meta.description,
    },
    twitter: {
      card: "summary_large_image",
      title: copy.meta.home.title,
      description: copy.meta.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    formatDetection: { telephone: false, address: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#05070b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);

  const organisation = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    ...(CONTACT_EMAIL ? { email: CONTACT_EMAIL } : {}),
    description: copy.meta.description,
    slogan: copy.meta.tagline,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ankara",
      addressCountry: "TR",
    },
  };

  return (
    <html
      lang={HTML_LANG[locale]}
      data-scheme="paper"
      className={`${GeistMono.variable} no-js`}
      suppressHydrationWarning
    >
      <head>
        {/* The two faces that set the page. The display serif decides the
            largest contentful paint on every route, and the grotesk carries
            every paragraph under it, so both are fetched with the document
            rather than after the stylesheet has been parsed. */}
        <link
          rel="preload"
          href="/fonts/newsreader-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/instrument-sans-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Runs before paint, so the class is gone before the first frame and
            no reveal ever flashes in its resting state. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              `document.documentElement.classList.remove('no-js');` +
              // Archon World is server-rendered so it is the first thing
              // painted. A visitor who already dismissed it this session gets
              // it stamped away before the first frame rather than seeing it
              // flash and vanish.
              `try{if(sessionStorage.getItem('archon-world-dismissed')==='1')` +
              `document.documentElement.setAttribute('data-world','off')}catch(e){}`,
          }}
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          // Static, author-controlled JSON-LD. No user input reaches this.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation) }}
        />
        {/* The light the whole site sits in, and the form turning behind it.
            Both are fixed, both are behind every page, and neither is part of
            the load: the atmosphere is four CSS gradients and the sculpture
            does not exist until the browser is idle. */}
        <Atmosphere />
        <LogoField />
        <Preloader />
        <SmoothScroll />
        <Cursor />
        <SiteHeader locale={locale} copy={copy} />
        <main id="main">{children}</main>
        <StudioClosing locale={locale} copy={copy} />
        {/* Archon World sits over the home page rather than replacing it, and
            the gate keeps it off every other route. It is mounted from the
            layout so no route transform can become the containing block for a
            fixed overlay, and last in the body for two reasons: the open world
            portals to the end of the body anyway, so rendering here first means
            nothing moves; and once it has been dismissed the small re-entry
            control it leaves behind must not come before the header's own skip
            link in the tab order. */}
        <WorldMount locale={locale} copy={copy} />
      </body>
    </html>
  );
}
