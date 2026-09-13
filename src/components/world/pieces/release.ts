"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { QUALITY, qualityStore } from "@/components/world/systems/quality";

/**
 * Painted and photographed textures, held once.
 *
 * A panel painted on a canvas is in memory twice: the canvas, and the GPU's
 * copy of it with its mipmaps. Only the GPU's copy is read again, so once it
 * is made the canvas is shrunk to a pixel and its memory handed back. On a
 * phone the copy is made as soon as the panel mounts rather than all
 * together at the end of the boot, so the canvases never pile up waiting —
 * a hundred of them alive at once, then a hundred uploads in a second, is
 * what a phone's browser was killed for at the end of loading.
 *
 * A texture let go this way cannot be uploaded again from its image, so a
 * lost graphics context is recovered by building the world again, not by
 * re-uploading (see ArchonWorld).
 */
export function releaseOnUpload(texture: THREE.Texture) {
  texture.onUpdate = () => {
    const image = texture.image as { width?: number; height?: number } | null;
    /* What was uploaded, for the memory profiler, before the image goes. */
    texture.userData.texels = [image?.width ?? 0, image?.height ?? 0];
    if (typeof HTMLCanvasElement !== "undefined" && image instanceof HTMLCanvasElement) {
      image.width = 1;
      image.height = 1;
    } else if (image) {
      texture.image = EMPTY;
    }
  };
}

const EMPTY = { width: 1, height: 1, data: null };

/** Upload now, on a phone: the canvas is let go the moment the copy exists. */
export function useEarlyUpload(gl: THREE.WebGLRenderer, texture: THREE.Texture | null) {
  useEffect(() => {
    if (!texture || qualityStore.tier === "desktop") return;
    try {
      gl.initTexture(texture);
    } catch {
      /* A lost context: the texture uploads on sight, if the world comes back. */
    }
  }, [gl, texture]);
}

/**
 * A photograph that is larger than this device should hold, drawn down to
 * the tier's longest side on a canvas; the original is left for the
 * collector. Returned as it came when it already fits.
 */
export function fitImage(image: HTMLImageElement | ImageBitmap): HTMLImageElement | ImageBitmap | HTMLCanvasElement {
  const cap = QUALITY[qualityStore.tier].textureMax;
  const long = Math.max(image.width, image.height);
  if (long <= cap || typeof document === "undefined") return image;
  const k = cap / long;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * k));
  canvas.height = Math.max(1, Math.round(image.height * k));
  const ctx = canvas.getContext("2d");
  if (!ctx) return image;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Fit a painted canvas's size to the tier's longest side: [width, height]. */
export function fitSize(width: number, height: number, cap: number): [number, number] {
  const k = Math.min(1, cap / Math.max(width, height));
  return [Math.max(1, Math.round(width * k)), Math.max(1, Math.round(height * k))];
}
