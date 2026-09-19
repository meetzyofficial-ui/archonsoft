import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AracimGoStory } from "@/components/projects/AracimGoStory";
import { CaseStudy } from "@/components/projects/CaseStudy";
import { SHOWCASE, getNextShowcase, getShowcase, projectPath } from "@/data/showcase";
import { dict } from "@/i18n/dictionary";
import { LOCALES, isLocale, t, type Locale } from "@/lib/i18n";
import { SITE } from "@/lib/site";

type Params = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => SHOWCASE.map((project) => ({ locale, slug: project.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const project = getShowcase(slug);
  if (!project) return { title: "404" };

  const title = `${project.title} — ${t(project.category, locale)}`;
  const description = t(project.shortDescription, locale);
  const path = projectPath(project.slug);

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { en: `/en${path}`, tr: `/tr${path}` },
    },
    openGraph: { type: "article", title, description, url: `/${locale}${path}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProjectPage({ params }: Params) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const copy = dict(locale);
  const project = getShowcase(slug);
  if (!project) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    headline: `${project.title} — ${t(project.category, locale)}`,
    abstract: t(project.tagline, locale),
    description: t(project.description, locale),
    url: `${SITE.url}/${locale}${projectPath(project.slug)}`,
    inLanguage: locale,
    creator: { "@type": "Organization", name: SITE.name, url: SITE.url },
    /* `new URL` writes an IDN host (aracımgo.com) as punycode, which is what
       a crawler expects in structured data. */
    ...(project.link ? { sameAs: [new URL(project.link.href).href] } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {/* AracımGo is Archon Soft's own live product and is told as one. */}
      {project.slug === "aracimgo" ? (
        <AracimGoStory project={project} next={getNextShowcase(project.slug)} locale={locale} copy={copy} />
      ) : (
        <CaseStudy project={project} next={getNextShowcase(project.slug)} locale={locale} copy={copy} />
      )}
    </>
  );
}
