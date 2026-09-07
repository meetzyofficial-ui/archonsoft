import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "../globals.css";

import { Cursor } from "@/components/chrome/Cursor";
import { Footer } from "@/components/chrome/Footer";
import { Nav } from "@/components/chrome/Nav";
import { Preloader } from "@/components/chrome/Preloader";
import { SmoothScroll } from "@/components/chrome/SmoothScroll";
import { dict } from "@/i18n/dictionary";
import { HTML_LANG, isLocale, LOCALES, OG_LOCALE, type Locale } from "@/lib/i18n";
import { CONTACT_EMAIL, SITE } from "@/lib/site";

/**
 * The root layout lives under `[locale]` so `<html lang>` is correct for the
 * document rather than patched in on the client. Middleware guarantees every
 * request reaching here already carries a locale prefix.
 */

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
  themeColor: "#0b0f1a",
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
      data-scheme="dark"
      className={`${GeistSans.variable} ${GeistMono.variable} no-js`}
      suppressHydrationWarning
    >
      <head>
        {/* The display face carries every headline. Preloading it stops the
            swap from reflowing type after first paint. */}
        <link
          rel="preload"
          href="/fonts/space-grotesk-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Runs before paint, so the class is gone before the first frame and
            no reveal ever flashes in its resting state. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.remove('no-js')`,
          }}
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          // Static, author-controlled JSON-LD. No user input reaches this.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation) }}
        />
        <Preloader />
        <SmoothScroll />
        <Cursor />
        <Nav locale={locale} copy={copy} />
        <main id="main">{children}</main>
        <Footer locale={locale} copy={copy} />
      </body>
    </html>
  );
}
