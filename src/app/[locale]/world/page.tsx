import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { LOCALES, isLocale, localePath, type Locale } from "@/lib/i18n";

/**
 * `/world`, as an address for something that is not a page.
 *
 * Archon World is an overlay over the home page rather than a route of its
 * own: it has to be able to hand the visitor back to the site underneath it,
 * it is entered from half a dozen places, and building a second copy of it
 * behind a URL would be two worlds to keep in step.
 *
 * What a URL is for is being typed, linked and shared, and that this route
 * exists at all is the point — it sends the visitor to the page the world
 * lives on with the world asked for, and the gate opens it before the first
 * frame. The redirect carries the query rather than a hash so it survives a
 * copy-paste and a server render.
 */

type Params = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  return {
    alternates: { canonical: localePath(locale) },
  };
}

export default async function WorldRoute({ params }: Params) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  redirect(`${localePath(raw as Locale)}?world=1`);
}
