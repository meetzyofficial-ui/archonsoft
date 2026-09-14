"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { LogoTier } from "@/components/site/LogoFieldScene";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { useWorldOpen } from "@/lib/worldOpen";

const LogoFieldScene = dynamic(() => import("@/components/site/LogoFieldScene"), {
  ssr: false,
});

/**
 * The gate in front of the live mark.
 *
 * Performance is part of this design, so the mark is not allowed to be part
 * of the load. Nothing here reaches the network until the page has loaded and
 * the browser has gone idle, and it never does for a visitor who asked for
 * less motion, a two-core device or a browser without WebGL — those keep the
 * flat mark the atmosphere already draws, which is the same shape.
 *
 * It also steps aside for Archon World. The world is the heaviest thing this
 * site runs and the one that once crashed real phones on memory; while it is
 * open the mark's canvas is unmounted outright, so there is never a second
 * WebGL context alive next to it.
 */
export function LogoField() {
  const reduced = usePrefersReducedMotion();
  const worldOpen = useWorldOpen();
  const [tier, setTier] = useState<LogoTier | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const cores = navigator.hardwareConcurrency ?? 4;
    if (cores <= 2) return;
    /* A software rasteriser (SwiftShader, llvmpipe) draws a full-screen
       canvas on the CPU. The mark is decoration; on those it is the flat one.
       The probe's context is released straight away so it never lingers as a
       second context beside the real one. */
    try {
      const probe = document.createElement("canvas");
      const gl = (probe.getContext("webgl2") ?? probe.getContext("webgl")) as WebGLRenderingContext | null;
      if (!gl) return;
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (/swiftshader|llvmpipe|software|basic render/i.test(renderer)) return;
    } catch {
      return;
    }
    const compact =
      window.matchMedia("(max-width: 900px)").matches ||
      !window.matchMedia("(pointer: fine)").matches ||
      cores <= 4;

    /* Not until the page has finished loading and gone quiet — a context
       created during the largest contentful paint costs seconds on routes
       with no picture in them at all. */
    let cancelled = false;
    let idle = 0;
    const start = () => {
      if (!cancelled) setTier(compact ? "compact" : "desktop");
    };
    const queue = () => {
      idle =
        typeof window.requestIdleCallback === "function"
          ? window.requestIdleCallback(start, { timeout: 5000 })
          : window.setTimeout(start, 2000);
    };
    if (document.readyState === "complete") queue();
    else window.addEventListener("load", queue, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", queue);
      if (!idle) return;
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [reduced]);

  const live = Boolean(tier) && !reduced && !worldOpen;

  useEffect(() => {
    if (!live) setReady(false);
  }, [live]);

  useEffect(() => {
    const root = document.documentElement;
    if (live && ready) root.setAttribute("data-logo-live", "true");
    else root.removeAttribute("data-logo-live");
    return () => root.removeAttribute("data-logo-live");
  }, [live, ready]);

  const onReady = useCallback(() => setReady(true), []);

  if (!live || !tier) return null;

  return (
    <div className="logo-field" data-ready={ready ? "true" : "false"} data-tier={tier} aria-hidden="true">
      <LogoFieldScene tier={tier} onReady={onReady} />
    </div>
  );
}
