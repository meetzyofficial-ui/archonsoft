import { SplitReveal } from "@/components/motion/SplitReveal";
import { Reveal } from "@/components/motion/Reveal";
import { CapabilityTabs } from "@/components/sections/CapabilityTabs";
import { ActionLink } from "@/components/ui/Action";
import { Band, ChapterHead } from "@/components/ui/primitives";
import type { Copy } from "@/i18n/dictionary";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * The light chapter. Inverting here breaks a long dark scroll into acts and
 * forces the navigation to prove it adapts.
 */
export function Capabilities({
  locale,
  copy,
  index,
  withLink = true,
}: {
  locale: Locale;
  copy: Copy;
  index?: string;
  withLink?: boolean;
}) {
  return (
    <Band scheme="light" size="regular" id="capabilities">
      <div className="frame">
        <ChapterHead
          index={index ?? copy.capabilities.index}
          title={copy.capabilities.label}
          aside={copy.capabilities.aside}
        />

        <div className="mt-14 grid gap-10 md:mt-20 md:grid-cols-12 md:items-end md:gap-8">
          <SplitReveal
            as="h2"
            lineHeight="0.98em"
            className="text-d2 md:col-span-7"
            text={[
              { text: copy.capabilities.statement },
              { text: copy.capabilities.statementAccent, accent: true },
            ]}
          />
          <Reveal className="md:col-span-4 md:col-start-9">
            <p className="text-[var(--fg-dim)]">{copy.capabilities.body}</p>
          </Reveal>
        </div>

        <div className="mt-14 md:mt-20">
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
