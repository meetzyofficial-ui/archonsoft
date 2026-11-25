import type { ReactNode } from "react";
import { Shell } from "@/components/fleet/client";
import { loadFleet } from "@/lib/fleet/server";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const loaded = await loadFleet();
  const alertCount = loaded.ok ? loaded.view.alerts.length : 0;
  return <Shell alertCount={alertCount}>{children}</Shell>;
}
