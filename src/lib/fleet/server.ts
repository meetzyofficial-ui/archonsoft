/**
 * Next.js tarafı: oturum kontrolü ve sayfaların veri yüklemesi. Sunucuya özel.
 */
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authConfig, SESSION_COOKIE, verifySessionToken } from "./auth";
import { buildView, istanbulToday, type FleetView } from "./calc";
import { loadData } from "./service";
import { getRepo, StoreError } from "./store";
import type { FleetData } from "./types";

export async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value, authConfig());
}

export async function requireAuth(): Promise<void> {
  if (!(await isAuthed())) redirect("/fleet/giris");
}

export type Loaded = { ok: true; data: FleetData; view: FleetView; today: string } | { ok: false; message: string };

/**
 * Her panel sayfası bununla başlar: önce oturum, sonra veri. `cache` sayesinde
 * aynı istekte düzen (layout) ve sayfa veriyi tek sefer okur.
 */
export const loadFleet = cache(async function loadFleet(): Promise<Loaded> {
  await requireAuth();
  try {
    const data = await loadData(getRepo());
    const today = istanbulToday();
    return { ok: true, data, view: buildView(data, today), today };
  } catch (error) {
    if (error instanceof StoreError) return { ok: false, message: error.message };
    console.error("[fleet] load failed");
    return { ok: false, message: "Beklenmeyen bir hata oluştu." };
  }
});
