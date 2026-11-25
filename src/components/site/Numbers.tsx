import { TESTIMONIALS } from "@/data/testimonials";
import type { Copy } from "@/i18n/dictionary";
import type { Locale } from "@/lib/i18n";

/** Figures the studio gave, each with the product it belongs to; then, when there are any, what clients said. */
export function Numbers({ locale, copy }: { locale: Locale; copy: Copy }) {
  return (
    <section data-scheme="black" data-track-section="sayilar" className="bg-[var(--color-black)] text-[var(--fg)]">
      <dl className="frame grid gap-px py-12 sm:grid-cols-2 md:py-16 lg:grid-cols-4">
        {copy.numbers.map((one) => (
          <div key={one.label} className="flex flex-col-reverse justify-end border-l-4 border-[var(--color-orange)] py-2 pl-5">
            <dt className="mt-2 text-[var(--fg-dim)]">{one.label}</dt>
            <dd className="text-display">{one.value}</dd>
          </div>
        ))}
      </dl>
      {TESTIMONIALS.length > 0 ? (
        <ul className="frame grid gap-6 pb-16 md:grid-cols-2">
          {TESTIMONIALS.map((one) => (
            <li key={one.name}>
              <blockquote className="text-head">{one.text[locale]}</blockquote>
              <p className="mt-4 text-[var(--fg-dim)]">
                {one.name}, {one.role}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
