import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { MATRIX } from "@/data/matrix";
import type { Copy } from "@/i18n/dictionary";
import { localePath, t, tl, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { workName } from "@/data/labs/titles";

/**
 * The matrix, read straight down.
 *
 * The same rows the chooser on the home page resolves one at a time, laid out
 * as a table so the shape of the argument is visible at once: nine problems,
 * each ending in something on this site that can be opened. The last column
 * is the only one that matters, and it never lets a concept sit unlabelled
 * next to a shipped product.
 *
 * Below the small breakpoint a five-column table stops being readable, so it
 * becomes a stack of records rather than a table with a scrollbar — the same
 * information, laid out for the width it has.
 */
export function CapabilityMatrix({ locale, copy }: { locale: Locale; copy: Copy }) {
  const rows = MATRIX.map((row) => ({
    row,
    href:
      row.proof.kind === "shipped"
        ? localePath(locale, `/projects/${row.proof.slug}`)
        : localePath(locale, `/labs/${row.proof.slug}`),
  }));

  return (
    <Reveal variant="none">
      {/* Wide: one table, read across. */}
      <table className="hidden w-full border-collapse text-left lg:table">
        <caption className="sr-only">{copy.matrix.label}</caption>
        <thead>
          <tr className="hairline-t hairline-b">
            {[
              copy.matrix.problem,
              copy.matrix.productType,
              copy.matrix.system,
              copy.matrix.capability,
              copy.matrix.example,
            ].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="mono-label py-3 pr-6 font-normal text-[var(--fg-mute)] last:pr-0"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ row, href }, index) => (
            <tr
              key={row.id}
              className="hairline-b reveal-fade align-top"
              style={{ transitionDelay: `${index * 45}ms` }}
            >
              <td className="max-w-[24ch] py-5 pr-6">{t(row.problem, locale)}</td>
              <td className="py-5 pr-6 text-[var(--fg-dim)]">{t(row.productType, locale)}</td>
              <td className="max-w-[22ch] py-5 pr-6">
                <span className="flex flex-wrap gap-x-2 gap-y-1">
                  {tl(row.system, locale).map((part) => (
                    <span key={part} className="mono-label text-[var(--fg-mute)]">
                      {part}
                    </span>
                  ))}
                </span>
              </td>
              <td className="py-5 pr-6 text-[var(--fg-dim)]">{t(row.capability, locale)}</td>
              <td className="py-5">
                <Link href={href} className="group/cell block">
                  <span className="flex items-baseline gap-3">
                    <span className="display text-[1.125rem] tracking-[-0.02em] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/cell:translate-x-1">
                      {workName(row.proof, locale)}
                    </span>
                    <span
                      className={cn(
                        "mono-label",
                        row.proof.kind === "shipped"
                          ? "text-[var(--accent)]"
                          : "text-[var(--fg-mute)]",
                      )}
                    >
                      {row.proof.kind === "shipped" ? copy.matrix.shipped : copy.matrix.concept}
                    </span>
                  </span>
                  <span className="mt-1.5 block max-w-[34ch] text-[var(--fg-mute)]">
                    {t(row.proof.note, locale)}
                  </span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Narrow: the same rows as records. */}
      <ol className="hairline-t lg:hidden">
        {rows.map(({ row, href }, index) => (
          <li
            key={row.id}
            className="hairline-b reveal-fade py-6"
            style={{ transitionDelay: `${index * 45}ms` }}
          >
            <p className="text-lead">{t(row.problem, locale)}</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="mono-label text-[var(--fg-mute)]">{copy.matrix.productType}</dt>
                <dd className="mt-1 text-[var(--fg-dim)]">{t(row.productType, locale)}</dd>
              </div>
              <div>
                <dt className="mono-label text-[var(--fg-mute)]">{copy.matrix.capability}</dt>
                <dd className="mt-1 text-[var(--fg-dim)]">{t(row.capability, locale)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="mono-label text-[var(--fg-mute)]">{copy.matrix.system}</dt>
                <dd className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                  {tl(row.system, locale).map((part) => (
                    <span key={part} className="mono-label text-[var(--fg-dim)]">
                      {part}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
            <Link href={href} className="mt-5 block">
              <span className="flex items-baseline gap-3">
                <span className="display text-[1.25rem] tracking-[-0.02em]">{workName(row.proof, locale)}</span>
                <span
                  className={cn(
                    "mono-label",
                    row.proof.kind === "shipped" ? "text-[var(--accent)]" : "text-[var(--fg-mute)]",
                  )}
                >
                  {row.proof.kind === "shipped" ? copy.matrix.shipped : copy.matrix.concept}
                </span>
                <span aria-hidden="true" className="mb-1.5 ml-auto h-px w-8 self-end bg-current" />
              </span>
              <span className="mt-1.5 block text-[var(--fg-mute)]">{t(row.proof.note, locale)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}
