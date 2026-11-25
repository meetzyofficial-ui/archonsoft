import Image from "next/image";
import gate from "@/assets/world/gate.jpg";
import { WorldEnterButton } from "@/components/world/WorldInvite";
import type { Copy } from "@/i18n/dictionary";
import type { Locale } from "@/lib/i18n";

/** The way into Archon World, from the page. */
export function WorldEntry({ locale, copy }: { locale: Locale; copy: Copy }) {
  return (
    <section id="world" data-scheme="black" className="bg-[var(--color-black)] text-[var(--fg)]">
      <div className="frame grid gap-8 py-16 md:grid-cols-12 md:items-end md:py-24">
        <div className="md:col-span-7">
          <h2 className="text-section">
            {copy.world.bandStatement} {copy.world.bandAccent}
          </h2>
          <p className="mt-5 max-w-[52ch] text-lead text-[var(--fg-dim)]">{copy.world.bandBody}</p>
        </div>
        <div className="md:col-span-5 md:justify-self-end">
          <WorldEnterButton locale={locale} label={copy.chrome.world} className="min-h-[4.5rem] px-9 text-[1.25rem]" />
        </div>
      </div>
      <Image
        src={gate}
        alt={copy.world.plate}
        placeholder="blur"
        sizes="100vw"
        className="h-[clamp(16rem,46vw,44rem)] w-full object-cover grayscale"
      />
    </section>
  );
}
