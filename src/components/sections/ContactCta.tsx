import { SplitReveal } from "@/components/motion/SplitReveal";
import { Reveal } from "@/components/motion/Reveal";
import { ActionLink } from "@/components/ui/Action";
import { Band, ChapterHead } from "@/components/ui/primitives";
import type { Copy } from "@/i18n/dictionary";
import { CONTACT_EMAIL } from "@/lib/site";
import { localePath, type Locale } from "@/lib/i18n";

export function ContactCta({
  locale,
  copy,
  index,
}: {
  locale: Locale;
  copy: Copy;
  index?: string;
}) {
  return (
    <Band scheme="light" size="loose" id="start">
      <div className="frame">
        <ChapterHead
          index={index ?? copy.contact.index}
          title={copy.contact.label}
          aside={copy.contact.aside}
        />

        <h2 className="mt-14 text-d1 md:mt-20">
          <SplitReveal text={copy.contact.statement} lineHeight="0.92em" stagger={38} />
          <SplitReveal
            text={[{ text: copy.contact.statementAccent, accent: true }]}
            lineHeight="0.92em"
            stagger={38}
            delay={120}
          />
        </h2>

        <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <Reveal>
              <p className="max-w-[42ch] text-lead text-[var(--fg-dim)]">{copy.contact.body}</p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <ActionLink href={localePath(locale, "/contact")} variant="solid">
                  {copy.nav.start}
                </ActionLink>
                {CONTACT_EMAIL ? (
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="mono-label link-rule text-[var(--fg-dim)] hover:text-[var(--fg)]"
                  >
                    {CONTACT_EMAIL}
                  </a>
                ) : null}
              </div>
            </Reveal>
          </div>

          <dl className="md:col-span-6 md:col-start-7">
            {copy.contact.expect.map((item, i) => (
              <Reveal
                key={item.label}
                delay={i * 70}
                className="hairline-t grid grid-cols-[2.5rem_1fr] gap-x-4 py-5 sm:grid-cols-[2.5rem_11rem_1fr] sm:gap-x-8"
              >
                <span className="mono-label text-[var(--fg-mute)]">{`0${i + 1}`}</span>
                <dt className="font-medium">{item.label}</dt>
                <dd className="col-start-2 text-[var(--fg-dim)] sm:col-start-3">{item.value}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>
    </Band>
  );
}
