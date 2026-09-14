import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Icon } from "@/components/labs/Icon";
import { LabSurface } from "@/components/labs/LabSurface";
import { SystemStack } from "@/components/labs/SystemStack";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ContactCta } from "@/components/sections/ContactCta";
import { Provenance } from "@/components/ui/Provenance";
import { Band, SectionRule } from "@/components/ui/primitives";
import { LABS, getDomain, getLab, getNextLab } from "@/data/labs";
import { dict } from "@/i18n/dictionary";
import { LOCALES, isLocale, localePath, t, tl, type Locale } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import { conceptTitle } from "@/data/labs/titles";

type Params = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => LABS.map((lab) => ({ locale, slug: lab.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const lab = getLab(slug);
  if (!lab) return {};
  const copy = dict(locale);

  /* The title says "concept" before it says anything else. A search result is
     a surface like any other, and a prototype must not arrive looking like a
     delivered project. */
  const title = `${conceptTitle(lab.slug, locale, lab.name)} — ${copy.labs.chip}`;
  const description = `${t(lab.statement, locale)} ${copy.labs.disclaimer}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/labs/${lab.slug}`,
      languages: { en: `/en/labs/${lab.slug}`, tr: `/tr/labs/${lab.slug}` },
    },
    openGraph: {
      title: `${title} — ${SITE.name}`,
      description,
      url: `/${locale}/labs/${lab.slug}`,
      // Declaring `openGraph` here replaces the inherited object, and the
      // file-based image goes with it — so a shared link would show a card
      // with no picture. Naming it again is what keeps the card.
      images: [`/${locale}/opengraph-image`],
    },
  };
}

/**
 * A concept, presented as a product launch rather than an article.
 *
 * The order is deliberate and it is the same order a launch page uses: say
 * what it is, name it enormously, explain it in one line, then get out of the
 * way and let the running product take the page. Everything after the surface
 * — the five-beat story, the stack, the links back to shipped work — exists to
 * answer questions the interface has already raised.
 *
 * The one thing that never moves is the label. Concept first, on the chip, in
 * the metadata, and in a full sentence under the window.
 */
export default async function LabPage({ params }: Params) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const lab = getLab(slug);
  if (!lab) notFound();
  const copy = dict(locale);
  const next = getNextLab(lab.slug);

  const beats = [
    { label: copy.story.problem, value: lab.story.problem },
    { label: copy.story.product, value: lab.story.product },
    { label: copy.story.system, value: lab.story.system },
    { label: copy.story.experience, value: lab.story.experience },
  ];

  return (
    <div>
      {/* 01–03 — what it is, its name, one sentence. */}
      <Band
        scheme="paper"
        size="tight"
        className="pt-[calc(4rem+3rem)] pb-0 md:pt-[calc(4rem+4.5rem)]"
      >
        <div className="frame">
          <Reveal variant="none" className="hairline-t flex flex-wrap items-center gap-3 pt-4">
            <span className="reveal-fade">
              <Provenance kind="concept" copy={copy} />
            </span>
            <span className="mono-label reveal-fade text-[var(--fg-mute)]">
              {copy.labs.sample}
            </span>
            <span
              className="mono-label reveal-fade ml-auto text-[var(--fg-dim)]"
              style={{ transitionDelay: "80ms" }}
            >
              {lab.index} / {LABS.length}
            </span>
          </Reveal>

          <h1 className="mt-8 text-head md:mt-10">
            <SplitReveal text={conceptTitle(lab.slug, locale, lab.name)} immediate lineHeight="0.88em" stagger={38} delay={100} />
          </h1>

          <div className="mt-7 grid gap-6 md:mt-9 md:grid-cols-12 md:items-end">
            <Reveal variant="rise" priority className="md:col-span-7">
              <p className="mono-label text-[var(--accent)]">{t(lab.sector, locale)}</p>
              <p className="mt-4 max-w-[24ch] text-quote text-[var(--fg)]">
                {t(lab.story.promise, locale)}
              </p>
              <p className="mt-5 max-w-[52ch] text-lead text-[var(--fg-dim)]">
                {t(lab.statement, locale)}
              </p>
            </Reveal>

            <Reveal className="md:col-span-4 md:col-start-9" delay={260}>
              <p className="mono-label flex items-center gap-2 text-[var(--accent)]">
                <Icon name="play" size={11} />
                {copy.labs.running}
              </p>
              <p className="mt-3 max-w-[36ch] text-[var(--fg-mute)]">{copy.launch.interactBody}</p>
            </Reveal>
          </div>
        </div>
      </Band>

      {/* 04–05 — the product, given the page. */}
      <Band scheme="paper" size="tight" className="pt-10 md:pt-14">
        <div className="px-[clamp(0.75rem,2vw,2.5rem)]">
          <Reveal variant="none">
            <div className="reveal-fade">
              <LabSurface lab={lab} locale={locale} copy={copy} />
            </div>
          </Reveal>
          <p className="mx-auto mt-4 max-w-[74ch] text-center text-[0.8125rem] leading-relaxed text-[var(--fg-mute)]">
            {copy.labs.disclaimer}
          </p>
        </div>
      </Band>

      {/* 06 — the five beats, and what building it demonstrates. */}
      <Band scheme="haze" size="regular">
        <div className="frame">
          <SectionRule label={copy.story.label} aside={t(lab.sector, locale)} />

          <div className="mt-10 grid gap-12 md:mt-14 lg:grid-cols-12 lg:gap-10">
            <dl className="hairline-t lg:col-span-7">
              {beats.map((beat, index) => (
                <Reveal
                  key={beat.label}
                  variant="none"
                  as="div"
                  className="hairline-b grid gap-2 py-5 md:grid-cols-12 md:gap-6"
                  delay={index * 60}
                >
                  <dt className="mono-label reveal-fade text-[var(--fg-mute)] md:col-span-3">
                    {beat.label}
                  </dt>
                  <dd className="reveal-fade text-lead md:col-span-9">{t(beat.value, locale)}</dd>
                </Reveal>
              ))}

              <Reveal
                variant="none"
                as="div"
                className="hairline-b grid gap-2 py-5 md:grid-cols-12 md:gap-6"
                delay={240}
              >
                <dt className="mono-label reveal-fade text-[var(--accent)] md:col-span-3">
                  {copy.story.capability}
                </dt>
                <dd className="reveal-fade md:col-span-9">
                  <span className="display text-quote">{t(lab.story.capability, locale)}</span>
                </dd>
              </Reveal>
            </dl>

            <Reveal className="lg:col-span-4 lg:col-start-9" delay={120}>
              <h2 className="mono-label text-[var(--fg-mute)]">{copy.launch.demonstrates}</h2>
              <ul className="mt-5">
                {tl(lab.proves, locale).map((item) => (
                  <li key={item} className="hairline-t flex gap-3 py-3">
                    <span
                      aria-hidden="true"
                      className="mt-[0.75em] block h-px w-3 shrink-0 bg-[var(--accent)]"
                    />
                    <span className="text-[var(--fg-dim)]">{item}</span>
                  </li>
                ))}
              </ul>

              <h2 className="mono-label mt-10 text-[var(--fg-mute)]">{copy.labs.domains}</h2>
              <p className="mt-3 flex flex-wrap gap-x-2 gap-y-2">
                {lab.domains.map((id) => {
                  const domain = getDomain(id);
                  return domain ? (
                    <span
                      key={id}
                      className="mono-label border border-[var(--line)] px-2.5 py-1.5 text-[var(--fg-dim)]"
                    >
                      {t(domain.title, locale)}
                    </span>
                  ) : null;
                })}
              </p>
            </Reveal>
          </div>
        </div>
      </Band>

      {/* 07 — the system under the interface. */}
      <Band scheme="paper" size="regular" id="system">
        <div className="frame">
          <SectionRule label={copy.stack.layers} aside={copy.stack.aside} />

          <div className="mt-10 grid gap-8 md:mt-12 md:grid-cols-12 md:items-end">
            <h2 className="text-sub md:col-span-7">
              <SplitReveal text={copy.stack.statement} lineHeight="0.98em" stagger={32} />
              <SplitReveal
                text={[{ text: copy.stack.statementAccent }]}
                lineHeight="0.98em"
                stagger={32}
                delay={110}
              />
            </h2>
            <Reveal className="md:col-span-4 md:col-start-9">
              <p className="text-[var(--fg-dim)]">{copy.stack.body}</p>
            </Reveal>
          </div>

          <Reveal variant="none" className="mt-12 md:mt-16">
            <div className="reveal-fade">
              <SystemStack
                locale={locale}
                notes={lab.stack}
                accent={lab.accent}
                productName={conceptTitle(lab.slug, locale, lab.name)}
                label={copy.stack.layers}
                openLabel={copy.stack.open}
                closeLabel={copy.stack.close}
              />
            </div>
          </Reveal>

          <Reveal className="mt-8">
            <p className="mono-label flex flex-wrap items-center gap-x-5 gap-y-2 text-[var(--fg-mute)]">
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="block size-1.5 rounded-full bg-[var(--accent)]" />
                {copy.stack.specific}
              </span>
              <span>{copy.stack.generic}</span>
            </p>
          </Reveal>
        </div>
      </Band>

      {/* 09 — the links back to real work, with the relation named. */}
      {lab.relations.length > 0 ? (
        <Band scheme="haze" size="regular">
          <div className="frame">
            <SectionRule label={copy.launch.related} aside={copy.provenance.shipped} />
            <ul className="mt-10 grid gap-8 md:mt-14 md:grid-cols-2">
              {lab.relations.map((relation) => (
                <Reveal as="li" key={relation.slug} className="hairline-t pt-6">
                  <Link
                    href={localePath(locale, `/projects/${relation.slug}`)}
                    className="group/rel block"
                  >
                    <span className="mono-label block text-[var(--fg-mute)]">
                      {relation.kind === "capability"
                        ? copy.launch.relatedCapability
                        : copy.launch.relatedProblem}
                    </span>
                    <span className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                      <span className="display text-quote transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/rel:translate-x-1.5">
                        {relation.name}
                      </span>
                      <Provenance kind="shipped" copy={copy} />
                    </span>
                    <span className="mt-3 block max-w-[52ch] text-[var(--fg-dim)]">
                      {t(relation.note, locale)}
                    </span>
                    <span className="mono-label link-rule mt-5 inline-flex items-center gap-3">
                      {copy.work.read}
                      <span aria-hidden="true" className="block h-px w-8 bg-current" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>

            <Reveal className="mt-10">
              <p className="max-w-[74ch] text-[var(--fg-mute)]">{copy.launch.relatedNote}</p>
            </Reveal>
          </div>
        </Band>
      ) : null}

      {/* 10 — the next one, then the way in. */}
      <Band scheme="paper" size="tight">
        <div className="frame">
          <Reveal variant="none" className="hairline-t pt-6">
            <Link
              href={localePath(locale, `/labs/${next.slug}`)}
              className="group/next block"
            >
              <span className="mono-label reveal-fade text-[var(--fg-mute)]">{copy.labs.next}</span>
              <span className="reveal-fade mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <span className="display text-sub transition-transform duration-[700ms] ease-[var(--ease-out-expo)] group-hover/next:translate-x-2">
                  {conceptTitle(next.slug, locale, next.name)}
                </span>
                <span className="mono-label text-[var(--accent)]">{t(next.sector, locale)}</span>
                <span
                  aria-hidden="true"
                  className="mb-3 ml-auto h-px w-16 self-end bg-current transition-[width] duration-[700ms] ease-[var(--ease-out-expo)] group-hover/next:w-28"
                />
              </span>
            </Link>
          </Reveal>
        </div>
      </Band>

      <ContactCta locale={locale} copy={copy} />
    </div>
  );
}
