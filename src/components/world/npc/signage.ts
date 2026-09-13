"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { fitSize, releaseOnUpload, useEarlyUpload } from "@/components/world/pieces/release";
import { QUALITY, qualityStore } from "@/components/world/systems/quality";

/**
 * Department signage: the name over the front of every room, and the board
 * behind its team.
 *
 * Both are painted from the department's own data — its name, its tagline
 * and its services, in the visitor's language — so a sign can never say what
 * the brief form does not. The type is Instrument Sans, the site's own face,
 * set large and white on dark glass, with the glow drawn behind the letters
 * only (the halo pass paints shadows of glyphs placed off the canvas), so a
 * name reads crisp close up and as light from across a plaza. Canvases are
 * laid out at a fixed width and painted at the tier's density; sampling is
 * sharpened like the panels'. If the face has not loaded when a sign is
 * painted it is painted again, once, when it has.
 */

const FACE = '"Instrument Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

export type BoardContent = {
  eyebrow: string;
  title: string;
  tagline?: string;
  items: string[];
  accent: string;
};

type Paint = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/** Upper case in the right language: a Turkish i gets its dot. */
export const upper = (text: string, locale: string) => text.toLocaleUpperCase(locale === "tr" ? "tr-TR" : "en-US");

/** Letter-spaced text, centred or from the left; returns its width. */
function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number, align: "left" | "center") {
  let width = 0;
  for (const ch of text) width += ctx.measureText(ch).width + tracking;
  width -= tracking;
  let cursor = align === "center" ? x - width / 2 : x;
  for (const ch of text) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + tracking;
  }
  return width;
}

/** The glow behind a run of type: the glyphs' shadow only, offset back from off the canvas. */
function halo(ctx: CanvasRenderingContext2D, w: number, blur: number, colour: string, draw: () => void) {
  const density = ctx.getTransform().a || 1;
  ctx.save();
  ctx.shadowColor = colour;
  ctx.shadowBlur = blur * density;
  ctx.shadowOffsetX = w * 4 * density;
  ctx.translate(-w * 4, 0);
  draw();
  ctx.restore();
}

function glass(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string) {
  const plate = ctx.createLinearGradient(0, 0, 0, h);
  plate.addColorStop(0, "rgba(16,22,34,0.97)");
  plate.addColorStop(1, "rgba(6,9,15,0.97)");
  ctx.fillStyle = plate;
  ctx.fillRect(0, 0, w, h);
  /* A faint sheen across the top third: glass, not paint. */
  const sheen = ctx.createLinearGradient(0, 0, w * 0.6, h);
  sheen.addColorStop(0, "rgba(255,255,255,0.07)");
  sheen.addColorStop(0.4, "rgba(255,255,255,0.015)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
  ctx.fillStyle = accent;
  ctx.fillRect(0, h - Math.max(3, h * 0.035), w, Math.max(3, h * 0.035));
}

/**
 * A long name on two balanced lines, broken at a space nearest the middle —
 * a sign is read from across a plaza, and twenty letters on one line are
 * twenty small letters.
 */
export function signLines(name: string): string[] {
  if (name.length <= 13) return [name];
  let best = -1;
  for (let i = 0; i < name.length; i += 1) {
    if (name[i] !== " ") continue;
    if (best < 0 || Math.abs(i - name.length / 2) < Math.abs(best - name.length / 2)) best = i;
  }
  if (best < 0) return [name];
  let first = name.slice(0, best).trim();
  let second = name.slice(best + 1).trim();
  /* A line never starts with a joining mark: "ÖZEL PROJE /" then "DİĞER". */
  const mark = second.match(/^([/&+])\s*/);
  if (mark) {
    first = `${first} ${mark[1]}`;
    second = second.slice(mark[0].length);
  }
  return [first, second];
}

/** The name over the front of a room, on one line or two, as large as the plate allows. */
export function paintSign(name: string, accent: string): Paint & { metrics: { cap: number } } {
  /* The height of the capitals as a share of the plate, once painted. */
  const metrics = { cap: 0 };
  const paint: Paint = (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    glass(ctx, w, h, accent);
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    const lines = signLines(name);
    let size = (h * (lines.length > 1 ? 0.8 : 0.6)) / lines.length;
    const tracking = () => size * 0.06;
    const fits = () => {
      ctx.font = `600 ${size}px ${FACE}`;
      return lines.every((line) => {
        let width = 0;
        for (const ch of line) width += ctx.measureText(ch).width + tracking();
        return width < w * 0.9;
      });
    };
    while (!fits() && size > h * 0.18) size *= 0.96;
    metrics.cap = (size * 0.71) / h;
    const pitch = size * 1.12;
    const top = h * 0.5 - (pitch * (lines.length - 1)) / 2;
    lines.forEach((line, i) => {
      const y = top + i * pitch;
      halo(ctx, w, size * 0.35, "rgba(232,242,255,0.55)", () => spaced(ctx, line, w / 2, y, tracking(), "center"));
      ctx.fillStyle = "#ffffff";
      spaced(ctx, line, w / 2, y, tracking(), "center");
    });
  };
  return Object.assign(paint, { metrics });
}

/** The board behind a team: who they are, and what they can be asked for. */
export function paintBoard(content: BoardContent): Paint {
  return (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    glass(ctx, w, h, content.accent);
    const pad = w * 0.055;
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = content.accent;
    ctx.font = `500 ${h * 0.045}px ${MONO}`;
    spaced(ctx, content.eyebrow, pad, pad + h * 0.045, h * 0.012, "left");

    let titleSize = h * 0.13;
    ctx.font = `600 ${titleSize}px ${FACE}`;
    while (ctx.measureText(content.title).width > w - pad * 2 && titleSize > h * 0.07) {
      titleSize *= 0.95;
      ctx.font = `600 ${titleSize}px ${FACE}`;
    }
    const titleY = pad + h * 0.08 + titleSize;
    halo(ctx, w, titleSize * 0.3, "rgba(232,242,255,0.5)", () => ctx.fillText(content.title, pad, titleY));
    ctx.fillStyle = "#ffffff";
    ctx.fillText(content.title, pad, titleY);

    let y = titleY + h * 0.05;
    ctx.fillStyle = content.accent;
    ctx.fillRect(pad, y, w * 0.12, Math.max(3, h * 0.008));
    y += h * 0.075;

    if (content.tagline) {
      ctx.fillStyle = "rgba(226,234,246,0.92)";
      ctx.font = `500 ${h * 0.055}px ${FACE}`;
      ctx.fillText(content.tagline, pad, y, w - pad * 2);
      y += h * 0.085;
    }

    /* The services, in two columns. */
    const columns = content.items.length > 4 ? 2 : 1;
    const rows = Math.ceil(content.items.length / columns);
    const gap = w * 0.04;
    const columnW = (w - pad * 2 - gap * (columns - 1)) / columns;
    const room = h - pad - y;
    const rowH = Math.min(h * 0.105, room / Math.max(1, rows));
    const itemSize = Math.min(h * 0.064, rowH * 0.62);
    content.items.forEach((item, i) => {
      const column = columns === 1 ? 0 : i < rows ? 0 : 1;
      const row = columns === 1 ? i : i < rows ? i : i - rows;
      const x = pad + column * (columnW + gap);
      const iy = y + row * rowH + itemSize;
      ctx.fillStyle = content.accent;
      ctx.fillRect(x, iy - itemSize * 0.62, Math.max(3, w * 0.004), itemSize * 0.72);
      ctx.fillStyle = "#f4f7fb";
      ctx.font = `500 ${itemSize}px ${FACE}`;
      ctx.fillText(item, x + itemSize * 0.55, iy, columnW - itemSize * 0.6);
    });
  };
}

/**
 * A painted, sharp-sampled texture for a sign or a board: laid out at
 * `layoutWidth` and painted at the tier's density for its physical width.
 */
export function useSignTexture(paint: Paint, size: [number, number], key: string, anisotropy: number, kind: "sign" | "board" = "sign") {
  const gl = useThree((state) => state.gl);
  const texture = useMemo(() => {
    const [w, h] = size;
    const profile = QUALITY[qualityStore.tier];
    const layoutW = 1000;
    const layoutH = Math.round((layoutW * h) / w);
    const across = Math.min(profile.panelMax, Math.max(1024, Math.round((Math.sqrt(w) * profile.panelDensity) / 32) * 32));
    /* A sign is read from the arrival and keeps more texels than a board. */
    const [width, height] = fitSize(across, Math.round((across * h) / w), kind === "sign" ? profile.signMax : profile.textureMax);
    const canvas = document.createElement("canvas");
    const draw = () => {
      /* Sized on every paint: a canvas let go after its upload is a pixel
         until it is painted again. */
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(width / layoutW, 0, 0, height / layoutH, 0, 0);
      paint(ctx, layoutW, layoutH);
    };
    draw();
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    result.anisotropy = anisotropy;
    result.minFilter = THREE.LinearMipmapLinearFilter;
    result.magFilter = THREE.LinearFilter;
    result.userData.repaint = draw;
    releaseOnUpload(result);
    return result;
    // The key stands for the content; the paint closes over it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, size[0], size[1], anisotropy, kind]);
  useEarlyUpload(gl, texture);

  useEffect(() => {
    let cancelled = false;
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    if (fonts && !fonts.check(`600 48px ${FACE}`)) {
      fonts.load(`600 48px ${FACE}`).then(() => {
        if (cancelled) return;
        (texture.userData.repaint as () => void)();
        texture.needsUpdate = true;
      }).catch(() => {});
    }
    return () => {
      cancelled = true;
      texture.dispose();
    };
  }, [texture]);

  return texture;
}
