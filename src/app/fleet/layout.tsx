import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./fleet.css";

/**
 * Fleet'in kendi kök düzeni. Sitenin başlığı, menüsü, animasyonları ve
 * yazı tipi yüklemeleri burada yok: bu, herkese açık sitenin bir sayfası değil,
 * tek kişinin kullandığı gizli bir yönetim paneli. Arama motorlarına kapalı.
 */
export const metadata: Metadata = {
  title: { default: "Archon Fleet", template: "%s · Archon Fleet" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0f1a",
};

export default function FleetRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="fl" style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
