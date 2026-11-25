import { FormDialog } from "@/components/fleet/client";
import { MiniTable, PageHead, StoreNotice } from "@/components/fleet/ui";
import { formatTRY } from "@/lib/fleet/calc";
import { settingsFields, settingsInitial } from "@/lib/fleet/forms";
import { emailChannel } from "@/lib/fleet/notify";
import { loadFleet } from "@/lib/fleet/server";
import { listAudit } from "@/lib/fleet/service";
import { getRepo, storeKind } from "@/lib/fleet/store";
import { LABELS } from "@/lib/fleet/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ayarlar" };

const STORE_LABEL = {
  firestore: "Firestore (kalıcı, bulut)",
  file: "Yerel dosya (yalnızca geliştirme / kendi sunucusu)",
  none: "Yapılandırılmamış",
} as const;

export default async function SettingsPage() {
  const loaded = await loadFleet();
  if (!loaded.ok) return <StoreNotice message={loaded.message} />;
  const { settings } = loaded.data;
  const audit = await listAudit(getRepo(), 50).catch(() => []);
  const kind = storeKind();

  return (
    <>
      <PageHead
        title="Ayarlar"
        actions={<FormDialog title="Ayarları düzenle" buttonLabel="Düzenle" op="settings.save" fields={settingsFields()} initial={settingsInitial(settings)} />}
      />
      <div className="fl-grid fl-2" style={{ marginBottom: 14 }}>
        <section className="fl-card">
          <h2>Hesap ayarları</h2>
          <dl className="fl-dl">
            <dt>Başlangıç kasa bakiyesi</dt>
            <dd className="num">{formatTRY(settings.openingBalance)}</dd>
            <dt>Başlangıç tarihi</dt>
            <dd className="num">{settings.openingDate.split("-").reverse().join(".")}</dd>
            <dt>Kira ödeme zamanı</dt>
            <dd>{LABELS.timing[settings.paymentTiming]}</dd>
            <dt>Ödeme yaklaşıyor uyarısı</dt>
            <dd>{settings.dueSoonDays} gün</dd>
            <dt>Bakım aralığı</dt>
            <dd>{settings.serviceIntervalKm.toLocaleString("tr-TR")} km</dd>
            <dt>Bakım uyarısı</dt>
            <dd>{settings.serviceWarnKm.toLocaleString("tr-TR")} km kala</dd>
            <dt>Belge uyarısı</dt>
            <dd>{settings.documentWarnDays} gün kala</dd>
          </dl>
        </section>
        <section className="fl-card">
          <h2>Sistem durumu</h2>
          <dl className="fl-dl">
            <dt>Veritabanı</dt>
            <dd>{STORE_LABEL[kind]}</dd>
            <dt>Panel içi uyarılar</dt>
            <dd>Açık (Dashboard)</dd>
            <dt>E-posta özeti</dt>
            <dd>{emailChannel.configured() ? "Yapılandırıldı" : "Yapılandırılmadı — RESEND_API_KEY, CONTACT_FROM_EMAIL, FLEET_ALERT_EMAIL gerekli"}</dd>
            <dt>Oturum</dt>
            <dd>Tek şifre · 14 gün · çıkış yapınca biter</dd>
          </dl>
          <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
            Tahsilat ve gider kayıtları silinmez; hatalı kayıt gerekçeyle iptal edilir. Araç ve sürücü pasife alınır.
          </p>
        </section>
      </div>
      <section className="fl-card">
        <h2>İşlem geçmişi (son 50)</h2>
        <MiniTable
          head={["Zaman", "İşlem", "Özet"]}
          empty="Kayıt yok."
          rows={audit.map((a) => [
            new Date(a.at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
            a.op,
            a.summary,
          ])}
        />
      </section>
    </>
  );
}
