import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { ScrollFrame } from "@/components/motion/ScrollFrame";
import { ARACIMGO_COPY, ARACIMGO_URL } from "@/data/aracimgo";
import { getShowcase, projectPath } from "@/data/showcase";
import type { Copy } from "@/i18n/dictionary";
import { localePath, t, type Locale, type Localized } from "@/lib/i18n";
import logo from "@/assets/work/aracimgo/logo.png";

/**
 * The products Archon Soft makes for itself, in one line-up.
 *
 * The rest of the home page shows the studio's work; this band says what the
 * studio is — somewhere ideas become products that run — and lets AracımGo,
 * the newest one that is live, stand for it at full size. The others follow
 * at a smaller size, each with only what is known about it: a product is
 * marked live when the site can show it is (AracımGo's own address answers,
 * Meetzy and DP Pano are live in their case studies). Hizmeto carries no
 * status and no link, because neither has been confirmed.
 */
type LineUp = {
  id: string;
  name: string;
  line: Localized;
  kind: Localized;
  live: boolean;
  href?: string;
  accent: string;
};

const HIZMETO: LineUp = {
  id: "hizmeto",
  name: "Hizmeto",
  line: {
    en: "A marketplace that brings service providers and customers together.",
    tr: "Hizmet verenlerle müşterileri buluşturan marketplace.",
  },
  kind: { en: "Marketplace", tr: "Marketplace" },
  live: false,
  accent: "#f2a889",
};

export function ProductEcosystem({ locale, copy }: { locale: Locale; copy: Copy }) {
  const c = copy.products;
  const aracimgo = getShowcase("aracimgo")!;
  const meetzy = getShowcase("meetzy")!;
  const dppano = getShowcase("dppano")!;

  const others: LineUp[] = [
    {
      id: meetzy.slug,
      name: meetzy.title,
      line: { en: "Social events and friendship platform.", tr: "Sosyal etkinlik ve arkadaşlık platformu." },
      kind: meetzy.category,
      live: true,
      href: localePath(locale, projectPath(meetzy.slug)),
      accent: meetzy.accent,
    },
    {
      id: dppano.slug,
      name: dppano.title,
      line: dppano.tagline,
      kind: dppano.category,
      live: true,
      href: localePath(locale, projectPath(dppano.slug)),
      accent: dppano.accent,
    },
    HIZMETO,
  ];

  return (
    <section id="products" data-band="paper" className="relative pt-24 pb-10 md:pt-36 md:pb-16" data-products>
      <div className="frame">
        <ScrollFrame enter={0.45}>
          <div className="hairline-t mono-micro rise-copy flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 pt-3 text-[var(--fg-mute)]">
            <span>{c.label}</span>
            <span>{c.aside}</span>
          </div>
          <div className="mt-8 grid gap-8 md:mt-12 md:grid-cols-12 md:items-end">
            <h2 className="text-section rise-copy md:col-span-8">
              {c.statement} <span className="text-[var(--fg-mute)]">{c.statementAccent}</span>
            </h2>
            <p className="rise-copy text-lead text-[var(--fg-dim)] md:col-span-4">{c.body}</p>
          </div>
        </ScrollFrame>

        {/* AracımGo, at full size, in its own colours. */}
        <Reveal className="mt-14 md:mt-20">
          <article className="product-feature grid gap-10 p-6 md:grid-cols-12 md:gap-8 md:p-12" data-product="aracimgo" aria-labelledby="product-aracimgo">
            <div className="flex flex-col justify-center md:col-span-7">
              <div className="mono-micro flex flex-wrap items-center gap-3 text-[var(--fg-mute)]">
                <span className="product-status text-[#0b8f77]" data-product-status="live">
                  <span aria-hidden="true" className="live-dot" />
                  {c.live}
                </span>
                <span>{c.featured}</span>
              </div>
              <div className="mt-7 flex items-center gap-4">
                <Image src={logo} alt="" width={64} height={64} className="size-12 rounded-[22%] md:size-16" />
                <h3 id="product-aracimgo" className="text-head">
                  {aracimgo.title}
                </h3>
              </div>
              <p className="mt-6 text-sub">{t(aracimgo.tagline, locale)}</p>
              <p className="mt-4 max-w-[44ch] text-lead text-[var(--fg-dim)]">{t(aracimgo.shortDescription, locale)}</p>
              <p className="mono-micro mt-6 text-[var(--fg-mute)]">{t(aracimgo.category, locale)}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={localePath(locale, projectPath(aracimgo.slug))}
                  data-cursor-label={copy.showcase.exploreShort}
                  className="btn-raised btn-aracimgo mono-label"
                >
                  {c.inspect}
                  <span aria-hidden="true">→</span>
                </Link>
                <a
                  href={ARACIMGO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-aracimgo-cta="home-open"
                  className="btn-raised btn-cream mono-label"
                >
                  {c.open}
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
            <div className="md:col-span-5">
              <figure
                className="ag-plate relative mx-auto w-[min(68vw,320px)] md:mr-0"
                style={{ aspectRatio: `${ARACIMGO_COPY.overviewPlate.image.width} / ${ARACIMGO_COPY.overviewPlate.image.height}` }}
              >
                <Image
                  src={ARACIMGO_COPY.overviewPlate.image}
                  alt={t(ARACIMGO_COPY.overviewPlate.caption, locale)}
                  fill
                  placeholder="blur"
                  sizes="(min-width: 768px) 26vw, 68vw"
                  className="object-contain"
                />
              </figure>
            </div>
          </article>
        </Reveal>

        {/* The rest of the line-up. */}
        <ul className="mt-4 grid gap-4 md:grid-cols-3">
          {others.map((one, i) => (
            <Reveal as="li" key={one.id} delay={i * 60}>
              <ProductCard product={one} locale={locale} live={c.live} more={c.more} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ProductCard({ product, locale, live, more }: { product: LineUp; locale: Locale; live: string; more: string }) {
  const body = (
    <>
      <div className="mono-micro flex min-h-6 flex-wrap items-center justify-between gap-3 text-[var(--fg-mute)]">
        <span>{t(product.kind, locale)}</span>
        {product.live ? (
          <span className="inline-flex items-center gap-2 text-[var(--fg-dim)]" data-product-status="live">
            <span aria-hidden="true" className="live-dot" />
            {live}
          </span>
        ) : null}
      </div>
      <h3 className="mt-8 text-sub">{product.name}</h3>
      <p className="mt-3 text-[var(--fg-dim)]">{t(product.line, locale)}</p>
      {product.href ? (
        <span className="mono-micro mt-auto inline-flex items-center gap-2 pt-8 text-[var(--fg)]">
          {more}
          <span aria-hidden="true">→</span>
        </span>
      ) : null}
    </>
  );
  const style = { ["--product-accent" as string]: product.accent };
  return product.href ? (
    <Link href={product.href} className="product-card" style={style} data-product={product.id}>
      {body}
    </Link>
  ) : (
    <div className="product-card" style={style} data-product={product.id}>
      {body}
    </div>
  );
}
