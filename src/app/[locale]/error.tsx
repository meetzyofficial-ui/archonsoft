"use client";

import { useEffect } from "react";
import { ActionButton, ActionLink } from "@/components/ui/Action";
import { SectionRule } from "@/components/ui/primitives";
import { dict } from "@/i18n/dictionary";
import { DEFAULT_LOCALE, localePath } from "@/lib/i18n";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const copy = dict(DEFAULT_LOCALE);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section
      data-scheme="paper"
      data-band="paper"
      className="scheme-surface flex min-h-[100svh] flex-col justify-center pt-16"
    >
      <div className="frame py-20">
        <SectionRule label={copy.error.label} aside={copy.error.aside} />

        <h1 className="mt-12 max-w-[16ch] text-head">
          {copy.error.title} <span className="text-[var(--accent)]">{copy.error.titleAccent}</span>
        </h1>

        <p className="mt-8 max-w-[46ch] text-lead text-[var(--fg-dim)]">{copy.error.body}</p>

        {error.digest ? (
          <p className="mono-label mt-6 text-[var(--fg-mute)]">
            {copy.error.reference} {error.digest}
          </p>
        ) : null}

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <ActionButton variant="solid" onClick={reset} arrow="none">
            {copy.error.retry}
          </ActionButton>
          <ActionLink href={localePath(DEFAULT_LOCALE)} variant="line">
            {copy.error.home}
          </ActionLink>
        </div>
      </div>
    </section>
  );
}
