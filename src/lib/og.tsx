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

/* The share card is the one place the site is still night: a card has to hold
   its own against whatever timeline it lands in, and a near-white card on a
   near-white feed is invisible. The palette is the site's ink scheme. */
const INK = "#101722";
const PAPER = "#fbfcff";
const ACCENT = "#e5a184";
const LINE = "rgba(251,252,255,0.16)";
const MUTE = "rgba(251,252,255,0.52)";

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
          color: PAPER,
          padding: 64,
          fontFamily: "Display",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 32,
            top: 32,
            right: 32,
            bottom: 32,
            border: `1px solid ${LINE}`,
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "Mono",
            fontSize: 19,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* The supplied mark: three left-aligned bars of decreasing
                width, measured off the brand file rather than redrawn. */}
            <svg width="30" height="26" viewBox="0 0 34 29.4">
              <rect x="0" y="0" width="34" height="7.4" fill={PAPER} />
              <rect x="0" y="11" width="24.5" height="7.4" fill={PAPER} />
              <rect x="0" y="22" width="15" height="7.4" fill={PAPER} />
            </svg>
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
          <div style={{ display: "flex", alignItems: "flex-end", height: 12 }}>
            {Array.from({ length: 49 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 1,
                  height: i % 4 === 0 ? 12 : 6,
                  backgroundColor: LINE,
                  marginRight: 21,
                  display: "flex",
                }}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "Mono",
              fontSize: 19,
              letterSpacing: 3,
              textTransform: "uppercase",
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
        { name: "Display", data: font("Newsreader-Regular.ttf"), style: "normal", weight: 400 },
        { name: "Mono", data: font("GeistMono-Regular.ttf"), style: "normal", weight: 400 },
      ],
    },
  );
}
