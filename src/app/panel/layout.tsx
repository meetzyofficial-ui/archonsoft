import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../fleet/fleet.css";

/** Sitenin ziyaretçi ve talep paneli. Gizli, arama motorlarına kapalı, Fleet'in şifresiyle açılır. */
export const metadata: Metadata = { title: "Archon Panel", robots: { index: false, follow: false, nocache: true }, referrer: "no-referrer" };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function PanelRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="fl" style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
