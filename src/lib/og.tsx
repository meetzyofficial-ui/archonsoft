import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

/**
 * Shared Open Graph card.
 *
 * The same language as the site: ink ground, hairline frame, the real arch
 * mark with its gradient keystone, a mono spec strip and Space Grotesk
 * carrying the headline. Fonts are read from disk at build time — these images
 * are prerendered, so nothing is fetched at request time.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const font = (file: string) => readFileSync(join(process.cwd(), "src/assets/og", file));

const INK = "#0b0f1a";
const PAPER = "#ffffff";
const BLUE = "#4f86ff";
const VIOLET = "#7a5cff";
const LINE = "rgba(255,255,255,0.16)";
const MUTE = "rgba(255,255,255,0.5)";

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
          fontFamily: "Grotesk",
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
            <svg width="30" height="30" viewBox="8 12 84 84">
              <defs>
                <linearGradient id="og-keystone" x1="0.1" y1="0" x2="0.9" y2="1">
                  <stop offset="0" stopColor={BLUE} />
                  <stop offset="1" stopColor={VIOLET} />
                </linearGradient>
              </defs>
              <path
                d="M16 86 L16 44 L34 20 L66 20 L84 44 L84 86 L68 86 L68 48 L58 34 L42 34 L32 48 L32 86 Z"
                fill={PAPER}
              />
              <path d="M40 20 L60 20 L55 34 L45 34 Z" fill="url(#og-keystone)" />
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
          {accent ? <span style={{ color: BLUE }}>{accent}</span> : null}
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
        { name: "Grotesk", data: font("SpaceGrotesk-Bold.ttf"), style: "normal", weight: 700 },
        { name: "Mono", data: font("GeistMono-Regular.ttf"), style: "normal", weight: 400 },
      ],
    },
  );
}
