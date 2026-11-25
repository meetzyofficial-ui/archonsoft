import Link from "next/link";
import { PROCESS } from "@/data/process";
import type { Copy } from "@/i18n/dictionary";
import { localePath, t, type Locale } from "@/lib/i18n";

/** The six stages of a job and what the client has in hand after each. */
export function HowWeWork({ locale, copy }: { locale: Locale; copy: Copy }) {
  return (
    <section data-track-section="is-nasil-ilerler" className="steel py-16 md:py-28" data-scheme="haze" aria-labelledby="how-title">
      <div className="frame">
        <h2 id="how-title" className="text-section max-w-[18ch] text-[var(--fg)]">
          {copy.how.title}
        </h2>
        <ol className="mt-10 grid gap-px bg-[var(--color-black)] sm:grid-cols-2 md:mt-16 lg:grid-cols-3">
          {PROCESS.map((stage) => (
            <li key={stage.id} className="bg-[var(--color-silver)] p-6 text-[var(--color-black)] md:p-8">
              <h3 className="text-head">{t(stage.title, locale)}</h3>
              <p className="mt-4 max-w-[34ch]">{t(stage.output, locale)}</p>
            </li>
          ))}
        </ol>
        <Link href={localePath(locale, "/process")} className="btn-raised btn-ghost mt-10">
          {copy.how.more}
        </Link>
      </div>
    </section>
  );
}
