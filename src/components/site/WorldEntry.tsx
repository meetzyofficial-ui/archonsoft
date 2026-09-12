import Image from "next/image";
import gate from "@/assets/world/gate.jpg";
import { ScrollFrame } from "@/components/motion/ScrollFrame";
import { WorldEnterButton } from "@/components/world/WorldInvite";
import { ZONES } from "@/data/world-map";
import type { Copy } from "@/i18n/dictionary";
import { t, type Locale } from "@/lib/i18n";

/**
 * The way into Archon World.
 *
 * The world itself is untouched by this rebuild — the scene, the districts,
 * the gallery, the collision, the tour, the discovery counters and the camera
 * are all real, working software and none of it was rewritten for a visual
 * reason. What changed is only the door.
 *
 * This is the one chapter on the site where the light goes out. Everywhere
 * else the page is daylight sitting on one continuous atmosphere; here the
 * paper darkens over the height of a screen, the still of the gate arrives out
 * of the dark, and the way in is a line rather than a button. It is the site
 * admitting there is somewhere else to go, and the change of air is the whole
 * announcement — the section does not need to say "immersive experience"
 * anywhere, and it does not.
 *
 * The districts are read from the world's own map rather than typed here, so
 * a room added to the building appears in this list the same day.
 */
export function WorldEntry({ locale, copy }: { locale: Locale; copy: Copy }) {
  return (
    <section
      id="world"
      data-scheme="ink"
      data-band="ink"
      className="scheme-surface relative overflow-hidden"
    >
      {/* The dusk. A screen's worth of the paper colour draining into the
          ink, so the band is entered rather than cut to. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[38svh]"
        style={{
          background:
            "linear-gradient(to bottom, var(--color-paper) 0%, color-mix(in oklab, var(--color-haze) 70%, var(--color-ink)) 34%, var(--color-ink) 100%)",
        }}
      />

      <div className="frame relative pt-[26svh] pb-28 md:pb-40">
        <div className="hairline-t flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 pt-3">
          <span className="mono-micro text-[var(--fg-mute)]">{copy.world.bandLabel}</span>
          <span className="mono-micro text-[var(--fg-mute)]">{copy.world.bandAside}</span>
        </div>

        <ScrollFrame enter={0.5} className="mt-10 md:mt-14">
          <div className="grid gap-10 md:grid-cols-12 md:items-end">
            <h2 className="text-section rise-copy md:col-span-7">
              {copy.world.bandStatement}{" "}
              <span className="text-[var(--accent-cool)]">{copy.world.bandAccent}</span>
            </h2>
            <p className="rise-copy text-[var(--fg-dim)] md:col-span-4 md:col-start-9">
              {copy.world.bandBody}
            </p>
          </div>
        </ScrollFrame>

        {/* A still of the place, taken with the world's own interface hidden:
            that chrome belongs in the world, not on a page about it. */}
        <ScrollFrame enter={0.66} className="mt-16 md:mt-24">
          <figure className="wipe-up rise-bleed overflow-hidden">
            <Image
              src={gate}
              alt={copy.world.plate}
              placeholder="blur"
              sizes="(min-width: 1024px) 84vw, 100vw"
              className="h-auto w-full"
              style={{ borderRadius: "var(--radius-hair)" }}
            />
            <figcaption className="mono-micro mt-3 text-[var(--fg-mute)]">
              {copy.world.plate}
            </figcaption>
          </figure>
        </ScrollFrame>

        {/* The plan of the building. Everything the world contains is readable
            here too, which is the rule the world itself follows: nothing lives
            only inside the canvas. */}
        <ol className="mt-16 grid md:mt-20 md:grid-cols-5">
          {ZONES.map((zone, index) => (
            <li
              key={zone.id}
              className="hairline-t py-5 md:pr-6"
              style={{ ["--accent" as string]: zone.accent }}
            >
              <span
                className="mono-micro text-[var(--accent)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-2.5 text-[var(--fg-dim)]">{t(zone.label, locale)}</p>
            </li>
          ))}
        </ol>

        <div className="mt-14 flex flex-wrap items-center gap-x-10 gap-y-4 md:mt-20">
          <WorldEnterButton locale={locale} label={copy.world.open} />
          <ul className="mono-micro flex flex-wrap items-center gap-x-3 gap-y-2 text-[var(--fg-mute)]">
            {copy.world.bandFacts.map((fact, i) => (
              <li key={fact} className="flex items-center gap-3">
                {i > 0 ? (
                  <span aria-hidden="true" className="block h-px w-3 bg-[var(--line-strong)]" />
                ) : null}
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
