"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { fitImage, fitSize, releaseOnUpload, useEarlyUpload } from "@/components/world/pieces/release";
import { QUALITY, qualityStore } from "@/components/world/systems/quality";
import type { PanelContent } from "@/data/world-map";

/**
 * The screens.
 *
 * Two kinds, and the difference matters more than anything else in this file:
 *
 * - A **photo surface** carries a capture of software that actually shipped.
 *   Nothing is done to it. It is the whole argument the world is making and it
 *   is the brightest thing anywhere in the building.
 * - A **data surface** is drawn at runtime from the site's own content — the
 *   real labs data, the real system layers, the real notes. It is text and
 *   rule and layout composed by code from the same objects the HTML pages
 *   render, not an image of an interface made to look convincing.
 *
 * There is deliberately no third kind. A screen showing invented interface
 * would undo the point of every other screen in the world.
 */

export type SurfacePaint = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/* --------------------------------------------------------------- drawing */

const SANS = '600 1px "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif';
const MONO = '500 1px ui-monospace, "SF Mono", Menlo, Consolas, monospace';

const font = (spec: string, px: number) => spec.replace("1px", `${px}px`);

/** Wrap to a width, and stop when the box is full rather than overflowing it. */
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): number {
  const words = text.split(/\s+/);
  let line = "";
  let lines = 0;
  let cursor = y;
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word;
    if (ctx.measureText(attempt).width > maxWidth && line) {
      ctx.fillText(line, x, cursor);
      cursor += lineHeight;
      lines += 1;
      line = word;
      if (lines >= maxLines) return cursor;
    } else {
      line = attempt;
    }
  }
  if (line) {
    ctx.fillText(line, x, cursor);
    cursor += lineHeight;
  }
  return cursor;
}

/** Small caps label with letter spacing, the way the site sets them. */
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, px: number) {
  ctx.font = font(MONO, px);
  let cursor = x;
  for (const character of text.toUpperCase()) {
    ctx.fillText(character, cursor, y);
    cursor += ctx.measureText(character).width + px * 0.18;
  }
  return cursor;
}

/**
 * One panel, composed.
 *
 * The layout is the site's: a mono eyebrow, a large title, a rule, a short
 * paragraph, then either facts or a stack of named layers. Keeping the two
 * media consistent is what stops the screens in the world reading as
 * decoration on the way to the real pages.
 */
export function paintPanel(content: PanelContent): SurfacePaint {
  return (ctx, w, h) => {
    const pad = Math.round(w * 0.062);
    const scale = w / 1000;

    /* Dark glass: a deep plate, a little lighter toward the top where the
       backlight is, so white type stands on it at full contrast. */
    ctx.clearRect(0, 0, w, h);
    const plate = ctx.createLinearGradient(0, 0, 0, h);
    plate.addColorStop(0, "rgba(14,24,46,0.94)");
    plate.addColorStop(1, "rgba(5,9,20,0.92)");
    ctx.fillStyle = plate;
    ctx.fillRect(0, 0, w, h);
    /* Fine scan lines, very faint. */
    ctx.fillStyle = "rgba(154,214,255,0.03)";
    for (let line = 0; line < h; line += Math.max(3, Math.round(6 * scale))) {
      ctx.fillRect(0, line, w, 1);
    }
    /* The backlight, in the glass itself: white light coming in from every
       edge and fading toward the middle, so the panel reads as lit from
       behind at any distance — a mip of this is a bright-edged plate, not a
       grey one. */
    const leak = Math.round(w * 0.075);
    const edges: [number, number, number, number][] = [
      [0, 0, 0, leak],
      [0, h, 0, h - leak],
      [0, 0, leak, 0],
      [w, 0, w - leak, 0],
    ];
    for (const [x0, y0, x1, y1] of edges) {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, "rgba(255,255,255,0.26)");
      g.addColorStop(0.35, "rgba(255,255,255,0.07)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    /* The lit edge along the top in the product's colour, and a crisp line
       of white light just inside the frame all the way round. */
    ctx.fillStyle = content.accent;
    ctx.fillRect(0, 0, w, Math.max(2, 3 * scale));
    ctx.strokeStyle = "rgba(255,255,255,0.82)";
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);

    /* Type is drawn sharp; the glow, where there is one, is a separate pass
       underneath. Sharp first, glow after, never one through the other. */
    /* Shadows are measured in canvas pixels, not in the layout's units. */
    const density = ctx.getTransform().a || 1;
    const glow = (on: boolean) => {
      ctx.shadowColor = on ? "rgba(214,236,255,0.42)" : "rgba(0,0,0,0)";
      ctx.shadowBlur = on ? Math.max(8, 18 * scale) * density : 0;
    };

    let y = pad + 26 * scale;

    ctx.fillStyle = content.accent;
    glow(false);
    label(ctx, content.eyebrow, pad, y, Math.round(22 * scale));
    y += 50 * scale;

    ctx.fillStyle = "#ffffff";
    const titleSize = Math.round(Math.min(92, w * 0.086));
    ctx.font = font(SANS.replace("600", "700"), titleSize);
    /* The halo pass draws its glyphs far off the canvas and keeps only
       their shadow, offset back onto the panel: light behind the letters,
       with no soft copy of the letters themselves under the sharp ones. */
    glow(true);
    ctx.save();
    ctx.shadowOffsetX = w * 4 * density;
    ctx.translate(-w * 4, 0);
    ctx.globalAlpha = 0.8;
    wrap(ctx, content.title, pad, y + titleSize * 0.78, w - pad * 2, titleSize * 1.08, 2);
    ctx.restore();
    ctx.globalAlpha = 1;
    glow(false);
    y = wrap(ctx, content.title, pad, y + titleSize * 0.78, w - pad * 2, titleSize * 1.08, 2);

    y += 22 * scale;
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(pad, y, w - pad * 2, Math.max(1, 1.5 * scale));
    y += 44 * scale;

    ctx.fillStyle = "#f6f9fd";
    const bodySize = Math.round(Math.min(38, Math.max(28, w * 0.035)));
    ctx.font = font(SANS.replace("600", "500"), bodySize);
    /* A panel carrying a long list keeps the paragraph short. */
    const many = (content.layers?.length ?? 0) > 4;
    y = wrap(ctx, content.body, pad, y, w - pad * 2, bodySize * 1.55, many ? 2 : 4);

    if (content.layers?.length) {
      y += 26 * scale;
      /* Up to four layers in one column; more in two, smaller. */
      const columns = many ? 2 : 1;
      const gap = 40 * scale;
      const columnWidth = (w - pad * 2 - gap * (columns - 1)) / columns;
      const size = many ? bodySize * 0.92 : bodySize;
      const rowHeight = size * 2.35;
      const top = y;
      content.layers.forEach((layer, i) => {
        const column = i % columns;
        const row = Math.floor(i / columns);
        const x = pad + column * (columnWidth + gap);
        const ly = top + row * rowHeight;
        if (ly + rowHeight * 0.6 > h - pad) return;
        ctx.fillStyle = content.accent;
        ctx.fillRect(x, ly - size * 0.72, 3 * scale, size * 0.9);
        ctx.fillStyle = "#f2f6fc";
        label(ctx, layer.label, x + 16 * scale, ly, Math.round(size * 0.74));
        ctx.fillStyle = "rgba(220,228,244,0.9)";
        ctx.font = font(SANS.replace("600", "500"), Math.round(size * 0.84));
        wrap(ctx, layer.detail, x + 16 * scale, ly + size * 1.05, columnWidth - 16 * scale, size * 1.05, 1);
      });
      y = top + Math.ceil(content.layers.length / columns) * rowHeight;
    }

    if (content.meta?.length) {
      let cursor = pad;
      const metaY = h - pad;
      ctx.fillStyle = "rgba(226,233,246,0.94)";
      for (const item of content.meta) {
        const size = Math.round(Math.min(24, w * 0.023));
        const end = label(ctx, item, cursor, metaY, size);
        cursor = end + 34 * scale;
        if (cursor > w - pad) break;
      }
    }

    if (content.provenance) {
      const size = Math.round(Math.min(20, w * 0.019));
      ctx.font = font(MONO, size);
      const text = content.provenance.toUpperCase();
      const width = ctx.measureText(text).width + size * 1.6;
      const boxY = pad + 4 * scale;
      ctx.strokeStyle = content.accent;
      ctx.lineWidth = Math.max(1, 1.4 * scale);
      ctx.strokeRect(w - pad - width, boxY - size, width, size * 1.9);
      ctx.fillStyle = content.accent;
      label(ctx, content.provenance, w - pad - width + size * 0.7, boxY + size * 0.5, size);
    }
  };
}

/* --------------------------------------------------------------- meshes */

/**
 * Type, sampled sharp.
 *
 * Trilinear filtering blends each pixel toward the next smaller mip, which
 * is right for a photograph and wrong for a line of type: letters go soft a
 * few metres before they need to. The panels sample their texture half a
 * mip level sharper — anisotropic filtering keeps that from shimmering at
 * an angle — so the type holds its edge until it is genuinely too small.
 */
export const sharpen = (shader: { fragmentShader: string }) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <map_fragment>",
    ["#ifdef USE_MAP", "vec4 sampledDiffuseColor = texture2D( map, vMapUv, -0.6 );", "diffuseColor *= sampledDiffuseColor;", "#endif"].join("\n"),
  );
};
export const sharpenKey = () => "archon-panel-sharp";

/**
 * A surface drawn from data.
 *
 * The canvas is painted once and never again. A texture redrawn every frame is
 * the most expensive thing a scene like this can do, and nothing on these
 * panels changes — what makes them feel alive is the accent bar below, which
 * is geometry and costs a matrix.
 */
export function DataSurface({
  paint,
  size,
  resolution = 1024,
  density = resolution,
  pulse = null,
}: {
  paint: SurfacePaint;
  size: [number, number];
  /** The width the panel is laid out at: type sizes and rules are in these units. */
  resolution?: number;
  /** The width it is painted at: the same layout, more texels. */
  density?: number;
  /**
   * A slow breath of brightness, with this phase, for a panel that should
   * draw the eye: normal, a little brighter, normal, over about three
   * seconds. Null for a panel that simply shows.
   */
  pulse?: number | null;
}) {
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const gl = useThree((state) => state.gl);
  useFrame(({ clock }) => {
    if (pulse === null || !material.current) return;
    const k = 0.5 + 0.5 * Math.sin((clock.elapsedTime / 3.1) * Math.PI * 2 - pulse);
    material.current.opacity = 0.84 + k * k * 0.16;
  });
  const texture = useMemo(() => {
    const [w, h] = size;
    /* Painted at the tier's scale of the asked-for resolution — a low tier
       paints at three quarters, never less — and filtered with as much
       anisotropy as the GPU has, which is what keeps a line of type legible
       on a panel seen from an angle. */
    const profile = QUALITY[qualityStore.tier];
    const layoutW = Math.round(resolution * profile.textureScale);
    const layoutH = Math.round((layoutW * h) / w);
    /* And no longer on either side than the tier holds: a tall panel was
       capped by its width alone. */
    const painted = Math.max(layoutW, Math.round(density * profile.textureScale));
    const [width, height] = fitSize(painted, Math.round((painted * h) / w), profile.textureMax);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(width / layoutW, height / layoutH);
      paint(ctx, layoutW, layoutH);
    }
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    result.anisotropy = Math.min(profile.anisotropy, gl.capabilities.getMaxAnisotropy());
    result.minFilter = THREE.LinearMipmapLinearFilter;
    result.magFilter = THREE.LinearFilter;
    result.generateMipmaps = true;
    releaseOnUpload(result);
    return result;
    // The paint function closes over content that never changes for a display.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolution, density, size[0], size[1], gl]);

  useEffect(() => () => texture.dispose(), [texture]);
  useEarlyUpload(gl, texture);

  return (
    <mesh>
      <planeGeometry args={size} />
      {/* Transparent, so the plate the canvas paints is a hologram the world
          shows through rather than a screen with a black bezel behind it. */}
      <meshBasicMaterial ref={material} map={texture} toneMapped={false} transparent depthWrite={false} onBeforeCompile={sharpen} customProgramCacheKey={sharpenKey} />
    </mesh>
  );
}

/**
 * A surface carrying a real capture.
 *
 * Loaded imperatively rather than through Suspense so that a slow image never
 * holds up the world; the panel arrives when it arrives and fades up. A
 * material compiled without a map will not take one afterwards unless it is
 * told to recompile, which is the whole reason for the `needsUpdate`.
 */
export function PhotoSurface({
  src,
  size,
  dim = false,
}: {
  src: string;
  size: [number, number];
  dim?: boolean;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    let cancelled = false;
    let loaded: THREE.Texture | null = null;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(src, (result) => {
      if (cancelled) {
        result.dispose();
        return;
      }
      result.colorSpace = THREE.SRGBColorSpace;
      result.anisotropy = Math.min(QUALITY[qualityStore.tier].anisotropy, gl.capabilities.getMaxAnisotropy());
      /* A phone holds the photograph at its tier's size, uploads it at once
         and lets the decoded image go. */
      if (qualityStore.tier !== "desktop") {
        result.image = fitImage(result.image as HTMLImageElement);
        releaseOnUpload(result);
        try {
          gl.initTexture(result);
        } catch {
          /* Uploaded on sight instead. */
        }
      }
      loaded = result;
      setTexture(result);
      if (material.current) {
        material.current.map = result;
        material.current.needsUpdate = true;
      }
    });
    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, [src, gl]);

  useEffect(() => {
    if (!material.current) return;
    material.current.opacity = texture ? (dim ? 0.55 : 1) : 0;
  }, [dim, texture]);

  return (
    <mesh>
      <planeGeometry args={size} />
      <meshBasicMaterial
        ref={material}
        map={texture}
        transparent
        opacity={0}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * What a hologram hangs in.
 *
 * A hairline frame of the accent, the rule under the panel that answers
 * approach, and a notch once it has been read. Nothing behind it: the world
 * shows through.
 */
export function Mount({
  size,
  accent,
  lit,
  seen = false,
  publish,
}: {
  size: [number, number];
  /** Kept for call sites that still pass the contact texture. */
  texture?: THREE.Texture;
  accent: string;
  /** Rises when the visitor is close enough to read it. */
  lit: boolean;
  /** Whether this panel has already been opened and read. */
  seen?: boolean;
  /**
   * Where to leave the function that answers approach.
   *
   * The walking loop already measures the distance to everything registered,
   * so the mount hands it a closure and lets it drive the rule directly. No
   * React state, no `useFrame` of its own: twenty-eight panels each asking for
   * a frame callback to change one opacity is how a world stops being sixty
   * frames a second.
   */
  publish?: MutableRefObject<((nearness: number) => void) | null>;
}) {
  const bar = useRef<THREE.Mesh>(null);
  const [w, h] = size;

  /* The rule under the panel is the whole cue. It sits at a third of the
     panel's width and drawn back, and it extends and firms up as the visitor
     walks towards it — architecture answering approach, rather than a glow
     switched on at a threshold. It is deliberately not light: nothing in this
     world emits, and a screen that blooms when you near it belongs in a
     different building. */
  useEffect(() => {
    if (!publish) return;
    publish.current = (nearness: number) => {
      const mesh = bar.current;
      if (!mesh) return;
      const material = mesh.material as THREE.MeshBasicMaterial;
      const eased = nearness * nearness * (3 - 2 * nearness);
      material.opacity = 0.28 + eased * 0.62;
      mesh.scale.x = 0.34 + eased * 0.66;
    };
    return () => {
      publish.current = null;
    };
  }, [publish]);

  useEffect(() => {
    const material = bar.current?.material as THREE.MeshBasicMaterial | undefined;
    if (material && lit) material.opacity = 1;
  }, [lit]);

  return (
    <group>
      {/* No standoffs and no shadow plate: a hologram is not bolted to a
          wall, and the three meshes that said it was were a hundred draw
          calls across the world. */}
      {/* A hairline frame of the accent, in place of the old dark bezel. */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[w + 0.1, h + 0.1]} />
        <meshBasicMaterial color={accent} transparent opacity={0.28} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh ref={bar} position={[0, -h / 2 - 0.12, 0.01]}>
        <planeGeometry args={[w * 0.3, 0.035]} />
        <meshBasicMaterial color={accent} transparent opacity={0.28} toneMapped={false} />
      </mesh>
      {/* Read.
          A single notch at the corner of anything the visitor has already
          opened. It is there so that standing in a doorway you can tell what
          you have been through and what you have not, which is the difference
          between wandering and re-walking. */}
      {seen ? (
        <mesh position={[w / 2 + 0.09, h / 2 - 0.16, 0.01]}>
          <planeGeometry args={[0.05, 0.34]} />
          <meshBasicMaterial color={accent} transparent opacity={0.62} toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
}
