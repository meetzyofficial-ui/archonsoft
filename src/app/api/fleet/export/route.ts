import { cookies } from "next/headers";
import { authConfig, SESSION_COOKIE, verifySessionToken } from "@/lib/fleet/auth";
import { buildReport, buildView, istanbulToday, resolveRange, type RangePreset } from "@/lib/fleet/calc";
import { reportSheets } from "@/lib/fleet/exports";
import { loadData } from "@/lib/fleet/service";
import { getRepo } from "@/lib/fleet/store";
import { buildXlsx } from "@/lib/fleet/xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRESETS: RangePreset[] = ["day", "week", "month", "year", "custom"];

/** Raporlar sayfasındaki seçili aralığın Excel dosyası. TC/telefon içermez. */
export async function GET(request: Request) {
  const jar = await cookies();
  if (!verifySessionToken(jar.get(SESSION_COOKIE)?.value, authConfig())) return new Response("Yetkisiz", { status: 401 });
  const url = new URL(request.url);
  const preset = (PRESETS as string[]).includes(url.searchParams.get("aralik") ?? "") ? (url.searchParams.get("aralik") as RangePreset) : "month";
  try {
    const data = await loadData(getRepo());
    const today = istanbulToday();
    const view = buildView(data, today);
    const { from, to } = resolveRange(preset, today, url.searchParams.get("bas") ?? undefined, url.searchParams.get("bit") ?? undefined);
    const bytes = buildXlsx(reportSheets(data, view, buildReport(data, view, from, to)));
    return new Response(bytes as unknown as BodyInit, {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="ArchonFleet_Rapor_${from}_${to}.xlsx"`,
        "cache-control": "no-store",
      },
    });
  } catch {
    console.error("[fleet] export failed");
    return new Response("Rapor oluşturulamadı.", { status: 500 });
  }
}
