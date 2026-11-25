import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

/**
 * Shared Open Graph card.
 *
 * The same language as the site: hairline frame, the supplied Archon mark, a
 * mono spec strip, and the display serif carrying the headline. Fonts are read
 * from disk at build time — these images are prerendered, so nothing is
 * fetched at request time.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const font = (file: string) => readFileSync(join(process.cwd(), "src/assets/og", file));

const MARK = `data:image/png;base64,${readFileSync(join(process.cwd(), "src/assets/brand/archon-mark.png")).toString("base64")}`;

/* The share card is the one place the site is still night: a card has to hold
   its own against whatever timeline it lands in, and a near-white card on a
   near-white feed is invisible. The palette is the site's ink scheme. */
const INK = "#0c0c0d";
const PAPER = "#e3e5e6";
const ACCENT = "#ff7300";
const LINE = "rgba(227,229,230,0.16)";
const MUTE = "rgba(227,229,230,0.52)";

export type OgCard = {
  eyebrow: string;
  title: string;
  /** Trailing phrase, tinted. */
  accent?: string;
  meta?: string;
};

export function renderOgImage({ eyebrow, title, accent, meta }: OgCard) {
  const long = (title + (accent ?? "")).length > 30;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: INK,
          backgroundImage: "linear-gradient(135deg, #e86a04 0%, #7a3203 14%, #1c0e06 32%, #08080a 48%, #0c0b0b 74%, #4a413a 100%)",
          color: PAPER,
          padding: 64,
          fontFamily: "Display",
          position: "relative",
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "Display",
            fontSize: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MARK} width="66" height="42" alt="" />
            <span>Archonsoft</span>
          </div>
          <span style={{ color: MUTE }}>{eyebrow}</span>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: 16,
            fontSize: long ? 82 : 108,
            fontWeight: 700,
            letterSpacing: -3,
            lineHeight: 1.02,
            maxWidth: 1000,
          }}
        >
          <span>{title}</span>
          {accent ? <span style={{ color: ACCENT }}>{accent}</span> : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "Display",
              fontSize: 24,
              color: MUTE,
              borderTop: `1px solid ${LINE}`,
              paddingTop: 18,
            }}
          >
            <span>{meta ?? "Ankara, Turkey"}</span>
            <span>{SITE.domain}</span>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Display", data: font("Geist-Medium.ttf"), style: "normal", weight: 400 },
      ],
    },
  );
}
