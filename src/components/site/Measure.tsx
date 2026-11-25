"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type Event = { k: "click" | "section" | "form" | "world" | "wa"; l: string; n?: number };

/** Anything on the site can report something the page itself cannot see. */
export function report(k: Event["k"], l: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("archon:olcum", { detail: { k, l } }));
}

const random = () => Array.from(crypto.getRandomValues(new Uint8Array(9)), (b) => b.toString(36).padStart(2, "0")).join("");

/**
 * What a visit looked like: the page, how long and how far, which parts were
 * in view and what was pressed. No cookie, nothing typed, no address. A
 * visitor who sends Do Not Track or Global Privacy Control is not measured.
 */
export function Measure() {
  const pathname = usePathname();

  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl || nav.webdriver) return;

    let session = "";
    try {
      session = sessionStorage.getItem("archon-o") ?? random();
      sessionStorage.setItem("archon-o", session);
    } catch {
      session = random();
    }
    const id = random();
    const params = new URLSearchParams(window.location.search);
    let ref = "";
    try {
      const host = document.referrer ? new URL(document.referrer).host : "";
      ref = host === window.location.host ? "" : host;
    } catch {
      /* No readable referrer. */
    }
    const events: Event[] = [];
    const seen = new Map<string, number>();
    const visible = new Set<string>();
    let seconds = 0;
    let scroll = 0;
    let sent = "";

    const add = (event: Event) => {
      if (events.length < 60) events.push(event);
    };
    const onClick = (event: MouseEvent) => {
      const el = (event.target as Element | null)?.closest?.("a,button,summary,[role=tab]") as HTMLElement | null;
      if (!el || el.closest(".world-overlay")) return;
      const href = el.getAttribute("href") ?? "";
      const label = (el.getAttribute("aria-label") || el.innerText || el.querySelector("img")?.alt || href).replace(/\s+/g, " ").trim().slice(0, 50);
      if (href.includes("wa.me")) add({ k: "wa", l: `${label || "WhatsApp"} @ ${pathname}` });
      else add({ k: "click", l: `${label}${/^https?:/.test(href) ? ` → ${new URL(href).host}` : ""}` });
    };
    const onReport = (event: globalThis.Event) => add((event as CustomEvent<Event>).detail);
    const onScroll = () => {
      const room = document.documentElement.scrollHeight - window.innerHeight;
      scroll = Math.max(scroll, room > 0 ? Math.round((window.scrollY / room) * 100) : 100);
    };
    const watcher = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const name = el.dataset.trackSection || el.id;
          if (entry.isIntersecting) visible.add(name);
          else visible.delete(name);
        }
      },
      { threshold: 0, rootMargin: "-35% 0px -35% 0px" },
    );
    const find = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>("main [data-track-section], main article[id^=project-]").forEach((el) => watcher.observe(el));
    }, 400);
    const tick = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      seconds += 1;
      visible.forEach((name) => seen.set(name, (seen.get(name) ?? 0) + 1));
    }, 1000);

    /* The same id every time, so a page that is left and come back to is one
       record, updated. */
    const send = () => {
      const body = JSON.stringify({
        id,
        s: session,
        path: pathname,
        ref,
        src: params.get("utm_source") ?? (params.has("fbclid") ? "facebook/instagram" : params.has("gclid") ? "google reklam" : ""),
        device: window.matchMedia("(pointer: coarse)").matches ? "telefon" : "masaüstü",
        lang: document.documentElement.lang,
        sec: seconds,
        scroll,
        events: [...events, ...[...seen].filter(([, n]) => n > 1).map(([l, n]) => ({ k: "section" as const, l, n }))],
      });
      if (body === sent || seconds < 1) return;
      sent = body;
      navigator.sendBeacon?.("/api/olcum", new Blob([body], { type: "application/json" }));
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") send();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("archon:olcum", onReport);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", send);
    onScroll();
    return () => {
      send();
      window.clearTimeout(find);
      window.clearInterval(tick);
      watcher.disconnect();
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("archon:olcum", onReport);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", send);
    };
  }, [pathname]);

  return null;
}
