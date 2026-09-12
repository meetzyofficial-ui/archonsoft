import * as THREE from "three";
import type { ScreenKind } from "@/data/departments";

/**
 * What is on the monitors.
 *
 * Each department's desks show the tools of its trade — an editor with code
 * in it, a design canvas with artboards, a model dashboard, a 3D viewport, a
 * cutting timeline, a commerce dashboard, a corporate console — drawn as
 * interface, not as words: panels, rows, bars, charts and swatches at the
 * proportions real tools have, so from a metre away it reads as a working
 * screen and from three it reads as a lit rectangle with the right shape
 * of light in it. Nothing is a claim; there are no figures and no names.
 *
 * One canvas per kind, painted once and shared by every monitor of that
 * kind in the world.
 */

const W = 512;
const H = 320;
const cache = new Map<string, THREE.CanvasTexture>();

/* A deterministic pseudo-random, so the screens are the same every visit. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

type Ctx = CanvasRenderingContext2D;

function panel(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, stroke?: string) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
}

function bars(ctx: Ctx, x: number, y: number, w: number, rows: number, pitch: number, colours: string[], r: () => number, indent = true) {
  let depth = 0;
  for (let i = 0; i < rows; i += 1) {
    const yy = y + i * pitch;
    if (indent) depth = Math.max(0, Math.min(4, depth + (r() < 0.3 ? 1 : r() < 0.5 ? -1 : 0)));
    let xx = x + depth * 10;
    const n = 2 + Math.floor(r() * 4);
    for (let k = 0; k < n && xx < x + w; k += 1) {
      const len = 12 + r() * 46;
      ctx.fillStyle = colours[Math.floor(r() * colours.length)]!;
      ctx.fillRect(xx, yy, Math.min(len, x + w - xx), pitch * 0.42);
      xx += len + 6;
    }
  }
}

function chart(ctx: Ctx, x: number, y: number, w: number, h: number, colour: string, r: () => number, fill = true) {
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  for (let i = 1; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x, y + (h / 4) * i);
    ctx.lineTo(x + w, y + (h / 4) * i);
    ctx.stroke();
  }
  const points: [number, number][] = [];
  let v = 0.4 + r() * 0.2;
  for (let i = 0; i <= 12; i += 1) {
    v = Math.max(0.1, Math.min(0.95, v + (r() - 0.42) * 0.22));
    points.push([x + (w / 12) * i, y + h - v * h]);
  }
  if (fill) {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    for (const [px, py] of points) ctx.lineTo(px, py);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, colour.replace(")", ",0.35)").replace("rgb(", "rgba("));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fill();
  }
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.stroke();
}

function paint(kind: ScreenKind, accent: string, ctx: Ctx) {
  const r = rng(kind.length * 977 + accent.charCodeAt(1) * 31);
  const dark = "#0b1220";
  const panelDark = "#111a2c";
  const line = "rgba(255,255,255,0.08)";
  const text = ["rgba(230,238,250,0.85)", "rgba(230,238,250,0.55)"];

  ctx.clearRect(0, 0, W, H);
  panel(ctx, 0, 0, W, H, dark);

  switch (kind) {
    case "code": {
      panel(ctx, 0, 0, W, 22, "#0d1526");
      for (let i = 0; i < 4; i += 1) panel(ctx, 8 + i * 92, 6, 78, 11, i === 1 ? "#1b2740" : "#121b2e");
      panel(ctx, 0, 22, 84, H - 22, "#0a1020");
      bars(ctx, 10, 34, 64, 16, 15, [text[1]!, text[1]!], r, true);
      for (let i = 0; i < 17; i += 1) {
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(92, 34 + i * 16, 10, 5);
      }
      bars(ctx, 110, 34, 300, 17, 16, ["#7fb3ff", "#c9a2ff", "#7fd6a8", "#ffd58a", text[0]!], r, true);
      panel(ctx, W - 96, 22, 96, H - 22, "#0a1020", line);
      bars(ctx, W - 88, 34, 80, 12, 14, [text[1]!], r, false);
      panel(ctx, 0, H - 18, W, 18, "#152341");
      ctx.fillStyle = accent;
      ctx.fillRect(0, H - 18, 62, 18);
      break;
    }
    case "design": {
      panel(ctx, 0, 0, W, H, "#1a1d24");
      panel(ctx, 0, 0, W, 26, "#22262e");
      panel(ctx, 0, 26, 96, H - 26, "#1e222a", line);
      bars(ctx, 10, 38, 76, 14, 17, [text[1]!], r, false);
      panel(ctx, W - 118, 26, 118, H - 26, "#1e222a", line);
      /* Swatches. */
      ["#f2a7c7", "#6aa8ff", "#ffd58a", "#7fd6a8", "#c9a2ff", "#f2a889"].forEach((c, i) => panel(ctx, W - 106 + (i % 3) * 32, 40 + Math.floor(i / 3) * 28, 24, 20, c));
      bars(ctx, W - 106, 104, 96, 9, 16, [text[1]!], r, false);
      /* The canvas, with artboards. */
      panel(ctx, 96, 26, W - 214, H - 26, "#2a2e36");
      const boards: [number, number, number, number][] = [
        [118, 48, 96, 160],
        [232, 48, 96, 160],
        [346, 48, 36, 70],
        [118, 226, 210, 70],
      ];
      boards.forEach(([bx, by, bw, bh], i) => {
        panel(ctx, bx, by, bw, bh, i % 2 ? "#f6f7fa" : "#0f1524", "rgba(255,255,255,0.15)");
        ctx.fillStyle = i % 2 ? "#1c2030" : "#e9eef7";
        ctx.fillRect(bx + 8, by + 10, bw * 0.5, 6);
        ctx.fillStyle = accent;
        ctx.fillRect(bx + 8, by + 22, bw * 0.28, 4);
        for (let k = 0; k < 3; k += 1) {
          ctx.fillStyle = i % 2 ? "rgba(28,32,48,0.12)" : "rgba(233,238,247,0.14)";
          ctx.fillRect(bx + 8, by + 36 + k * 18, bw - 16, 12);
        }
        if (bh > 100) {
          ctx.fillStyle = accent;
          ctx.fillRect(bx + 8, by + bh - 22, bw - 16, 14);
        }
      });
      break;
    }
    case "ai": {
      panel(ctx, 0, 0, 92, H, "#0a1020", line);
      bars(ctx, 10, 20, 72, 12, 18, [text[1]!], r, false);
      /* Chat pane. */
      panel(ctx, 100, 12, 220, H - 24, panelDark, line);
      for (let i = 0; i < 6; i += 1) {
        const mine = i % 2 === 1;
        const w = 90 + r() * 90;
        panel(ctx, mine ? 310 - w : 110, 24 + i * 46, w, 30, mine ? "#1c3a5c" : "#182238");
        bars(ctx, (mine ? 310 - w : 110) + 8, 32 + i * 46, w - 16, 2, 10, [text[0]!], r, false);
      }
      panel(ctx, 110, H - 40, 200, 20, "#0f1a30", accent);
      /* Model cards and a training curve. */
      panel(ctx, 330, 12, 172, 120, panelDark, line);
      chart(ctx, 340, 30, 152, 90, "rgb(86,217,255)", r);
      for (let i = 0; i < 3; i += 1) {
        panel(ctx, 330, 142 + i * 52, 172, 44, panelDark, line);
        ctx.fillStyle = i === 0 ? accent : "rgba(255,255,255,0.3)";
        ctx.beginPath();
        ctx.arc(348, 164 + i * 52, 6, 0, Math.PI * 2);
        ctx.fill();
        bars(ctx, 362, 152 + i * 52, 130, 2, 14, [text[0]!, text[1]!], r, false);
      }
      break;
    }
    case "viewport": {
      panel(ctx, 0, 0, W, H, "#191c22");
      panel(ctx, 0, 0, W, 22, "#23272e");
      panel(ctx, 0, 22, 104, H - 22, "#1e2229", line);
      bars(ctx, 10, 34, 84, 15, 17, [text[1]!], r, false);
      panel(ctx, W - 118, 22, 118, H - 22, "#1e2229", line);
      bars(ctx, W - 108, 34, 98, 14, 18, [text[1]!, accent], r, false);
      /* The viewport: a grid in perspective, a wire cube, a gizmo. */
      panel(ctx, 104, 22, W - 222, H - 22, "#2a2f38");
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      const cx = 104 + (W - 222) / 2;
      const horizon = 150;
      for (let i = -8; i <= 8; i += 1) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 6, horizon);
        ctx.lineTo(cx + i * 60, H);
        ctx.stroke();
      }
      for (let k = 0; k < 7; k += 1) {
        const yy = horizon + Math.pow(k / 6, 1.8) * (H - horizon);
        ctx.beginPath();
        ctx.moveTo(104, yy);
        ctx.lineTo(W - 118, yy);
        ctx.stroke();
      }
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      const s = 44;
      const cube = [
        [cx - s, 120],
        [cx + s * 0.4, 100],
        [cx + s * 1.1, 130],
        [cx - s * 0.3, 150],
      ];
      for (const dy of [0, 70]) {
        ctx.beginPath();
        cube.forEach(([x, y], i) => (i ? ctx.lineTo(x!, y! + dy) : ctx.moveTo(x!, y! + dy)));
        ctx.closePath();
        ctx.stroke();
      }
      for (const [x, y] of cube) {
        ctx.beginPath();
        ctx.moveTo(x!, y!);
        ctx.lineTo(x!, y! + 70);
        ctx.stroke();
      }
      ["#ff6b6b", "#7fd6a8", "#6aa8ff"].forEach((c, i) => {
        ctx.strokeStyle = c;
        ctx.beginPath();
        ctx.moveTo(130, H - 30);
        ctx.lineTo(130 + [22, 0, 12][i]!, H - 30 - [0, 22, 10][i]!);
        ctx.stroke();
      });
      break;
    }
    case "timeline": {
      panel(ctx, 0, 0, W, H, "#15171c");
      panel(ctx, 0, 0, 150, 150, "#1c1f26", line);
      bars(ctx, 10, 12, 130, 7, 18, [text[1]!], r, false);
      /* The preview. */
      panel(ctx, 158, 10, W - 168, 140, "#000");
      const g = ctx.createLinearGradient(158, 10, W - 10, 150);
      g.addColorStop(0, "#2b1a3f");
      g.addColorStop(0.5, "#ff9a5a");
      g.addColorStop(1, "#1d3f6b");
      ctx.fillStyle = g;
      ctx.fillRect(170, 22, W - 192, 116);
      /* The tracks. */
      panel(ctx, 0, 158, W, H - 158, "#111318");
      const clipColours = ["#4f7bd9", "#d97b4f", "#5aa86f", "#8f6fd9", "#d9c25a"];
      for (let t = 0; t < 5; t += 1) {
        const y = 170 + t * 28;
        panel(ctx, 0, y, 60, 22, "#1a1d24");
        let x = 66;
        while (x < W - 10) {
          const w = 30 + r() * 90;
          if (r() > 0.25) panel(ctx, x, y, Math.min(w, W - 10 - x), 22, clipColours[(t + Math.floor(r() * 2)) % clipColours.length]!, "rgba(0,0,0,0.4)");
          x += w + 4;
        }
      }
      ctx.fillStyle = accent;
      ctx.fillRect(250, 160, 2, H - 160);
      break;
    }
    case "commerce":
    case "analytics": {
      panel(ctx, 0, 0, 96, H, "#0a1020", line);
      bars(ctx, 10, 20, 76, 12, 18, [text[1]!], r, false);
      for (let i = 0; i < 4; i += 1) {
        panel(ctx, 108 + i * 98, 12, 90, 56, panelDark, line);
        ctx.fillStyle = text[1]!;
        ctx.fillRect(116 + i * 98, 22, 40, 5);
        ctx.fillStyle = i === 0 ? accent : text[0]!;
        ctx.fillRect(116 + i * 98, 36, 30 + r() * 30, 12);
      }
      panel(ctx, 108, 78, 250, 130, panelDark, line);
      chart(ctx, 118, 90, 230, 108, "rgb(242,168,137)", r);
      panel(ctx, 366, 78, 136, 130, panelDark, line);
      for (let i = 0; i < 5; i += 1) {
        panel(ctx, 376, 90 + i * 22, 16, 16, ["#f2a889", "#6aa8ff", "#ffd58a", "#7fd6a8", "#c9a2ff"][i]!);
        bars(ctx, 400, 92 + i * 22, 94, 1, 12, [text[0]!], r, false);
      }
      /* Order rows. */
      for (let i = 0; i < 5; i += 1) {
        panel(ctx, 108, 218 + i * 20, 394, 16, i % 2 ? "#0f172a" : panelDark);
        bars(ctx, 116, 222 + i * 20, 380, 1, 10, [text[0]!, text[1]!], r, false);
        ctx.fillStyle = i % 3 ? "#7fd6a8" : "#ffd58a";
        ctx.fillRect(470, 222 + i * 20, 24, 8);
      }
      break;
    }
    case "enterprise": {
      panel(ctx, 0, 0, W, 28, "#0f1a30");
      panel(ctx, 0, 28, 110, H - 28, "#0a1020", line);
      bars(ctx, 12, 44, 86, 12, 18, [text[1]!], r, false);
      for (let i = 0; i < 3; i += 1) {
        panel(ctx, 122 + i * 126, 40, 118, 48, panelDark, line);
        ctx.fillStyle = text[1]!;
        ctx.fillRect(130 + i * 126, 48, 50, 5);
        ctx.fillStyle = "#7fb3ff";
        ctx.fillRect(130 + i * 126, 62, 40 + r() * 40, 12);
      }
      /* A table. */
      panel(ctx, 122, 98, 380, 20, "#152341");
      for (let i = 0; i < 9; i += 1) {
        panel(ctx, 122, 118 + i * 20, 380, 20, i % 2 ? "#0f172a" : "#0c1424");
        for (let c = 0; c < 5; c += 1) {
          ctx.fillStyle = c === 4 ? (r() > 0.5 ? "#7fd6a8" : "#ffd58a") : text[c === 0 ? 0 : 1]!;
          ctx.fillRect(130 + c * 76, 124 + i * 20, c === 4 ? 26 : 30 + r() * 36, 7);
        }
      }
      ctx.fillStyle = accent;
      ctx.fillRect(0, 28, 110, 3);
      break;
    }
    case "lobby":
    default: {
      panel(ctx, 0, 0, W, 26, "#0f1a30");
      panel(ctx, 0, 26, 120, H - 26, "#0a1020", line);
      bars(ctx, 12, 40, 96, 12, 18, [text[1]!], r, false);
      /* Calendar week. */
      for (let d = 0; d < 5; d += 1) {
        panel(ctx, 132 + d * 74, 40, 66, 150, panelDark, line);
        const n = 1 + Math.floor(r() * 3);
        for (let k = 0; k < n; k += 1) {
          panel(ctx, 136 + d * 74, 60 + k * 44 + r() * 10, 58, 28, ["#1c3a5c", "#3a2a4f", "#2a4a3a"][(d + k) % 3]!, accent);
        }
      }
      /* Messages. */
      for (let i = 0; i < 5; i += 1) {
        panel(ctx, 132, 202 + i * 22, 370, 18, i % 2 ? "#0f172a" : panelDark);
        ctx.fillStyle = i < 2 ? accent : "rgba(255,255,255,0.25)";
        ctx.beginPath();
        ctx.arc(142, 211 + i * 22, 4, 0, Math.PI * 2);
        ctx.fill();
        bars(ctx, 154, 207 + i * 22, 340, 1, 10, [text[0]!, text[1]!], r, false);
      }
      break;
    }
  }

  /* Every screen: a faint vignette and a lighter top edge, the way a
     display looks lit from within. */
  const v = ctx.createLinearGradient(0, 0, 0, H);
  v.addColorStop(0, "rgba(255,255,255,0.06)");
  v.addColorStop(0.3, "rgba(255,255,255,0)");
  v.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

/** The texture for a kind of screen, painted once. */
export function screenTexture(kind: ScreenKind, accent: string, anisotropy = 8): THREE.CanvasTexture {
  const key = `${kind}:${accent}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (ctx) paint(kind, accent, ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  cache.set(key, texture);
  return texture;
}

export const SCREEN_ASPECT = W / H;
