import { SplitReveal } from "@/components/motion/SplitReveal";
import { Reveal } from "@/components/motion/Reveal";
import { CapabilityTabs } from "@/components/sections/CapabilityTabs";
import { ActionLink } from "@/components/ui/Action";
import { Band, SectionRule } from "@/components/ui/primitives";
import type { Copy } from "@/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * The capability tabs.
 *
 * On its own page the masthead above it already prints this chapter's name,
 * its aside, its statement and its standfirst — so on that page the section
 * shows the tabs and nothing else. `withLink` marks the difference: where the
 * section stands alone it introduces itself and offers the way through; where
 * it sits under its own page's masthead it says nothing twice.
 */
export function Capabilities({
  locale,
  copy,
  withLink = true,
}: {
  locale: Locale;
  copy: Copy;
  withLink?: boolean;
}) {
  return (
    <Band scheme="haze" size="regular" id="capabilities">
      <div className="frame">
        {withLink ? (
          <>
            <SectionRule label={copy.capabilities.label} aside={copy.capabilities.aside} />

            <div className="mt-14 grid gap-10 md:mt-20 md:grid-cols-12 md:items-end md:gap-8">
              <SplitReveal
                as="h2"
                lineHeight="0.98em"
                className="text-sub md:col-span-7"
                text={[
                  { text: copy.capabilities.statement },
                  { text: copy.capabilities.statementAccent, accent: true },
                ]}
              />
              <Reveal className="md:col-span-4 md:col-start-9">
                <p className="text-[var(--fg-dim)]">{copy.capabilities.body}</p>
              </Reveal>
            </div>
          </>
        ) : null}

        <div className={withLink ? "mt-14 md:mt-20" : undefined}>
          <CapabilityTabs locale={locale} copy={copy} />
        </div>

        {withLink ? (
          <Reveal className="mt-12">
            <ActionLink href={localePath(locale, "/capabilities")} variant="line">
              {copy.capabilities.detail}
            </ActionLink>
          </Reveal>
        ) : null}
      </div>
    </Band>
  );
}
