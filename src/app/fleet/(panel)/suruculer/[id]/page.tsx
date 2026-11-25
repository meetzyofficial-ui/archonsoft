import Link from "next/link";
import { notFound } from "next/navigation";
import { FormDialog } from "@/components/fleet/client";
import { Badge, D, Kpi, MiniTable, Money, PageHead, PaymentStateBadge, RentalStatusBadge, StoreNotice } from "@/components/fleet/ui";
import { formatTRY, fullName } from "@/lib/fleet/calc";
import { driverFields, driverInitial } from "@/lib/fleet/forms";
import { loadFleet } from "@/lib/fleet/server";
import { LABELS } from "@/lib/fleet/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sürücü" };

export default async function DriverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await loadFleet();
  if (!loaded.ok) return <StoreNotice message={loaded.message} />;
  const { data, view } = loaded;
  const d = view.drivers.find((x) => x.driver.id === id);
  if (!d) notFound();
  const plate = new Map(data.vehicles.map((v) => [v.id, v.plate]));
  const payments = data.payments.filter((p) => p.driverId === id).sort((a, b) => b.date.localeCompare(a.date));
  const { driver } = d;

  return (
    <>
      <PageHead
        title={fullName(driver)}
        sub={
          <>
            {driver.code} · <Badge tone={driver.status === "active" ? "green" : driver.status === "blacklist" ? "red" : undefined}>{LABELS.driverStatus[driver.status]}</Badge>
          </>
        }
        actions={
          <>
            <Link className="fl-btn" href="/fleet/suruculer">‹ Sürücüler</Link>
            <FormDialog title="Sürücüyü düzenle" buttonLabel="Düzenle" op="driver.save" fields={driverFields()} initial={driverInitial(driver)} hidden={{ id: driver.id }} />
          </>
        }
      />
      <div className="fl-grid fl-kpis">
        <Kpi label="Toplam ödeme" value={formatTRY(d.totalPaid)} />
        <Kpi label="Kalan borç" value={formatTRY(d.balance)} tone={d.balance > 0 ? "neg" : undefined} sub="Beklenen − ödenen" />
        <Kpi label="Gecikmiş" value={formatTRY(d.overdue)} tone={d.overdue > 0 ? "neg" : undefined} />
        <Kpi primary label="Kiraladığı araç" value={d.activeVehicle?.plate ?? "—"} sub={d.activeRental ? `${d.activeRental.rental.code} · ${LABELS.period[d.activeRental.rental.period]}` : "Aktif kiralama yok"} />
      </div>
      <div className="fl-grid fl-2" style={{ marginBottom: 14 }}>
        <section className="fl-card">
          <h2>Kişisel bilgiler</h2>
          <dl className="fl-dl">
            <dt>TC kimlik no</dt>
            <dd className="num">{driver.nationalId}</dd>
            <dt>Telefon</dt>
            <dd><a className="num" href={`tel:${driver.phone}`}>{driver.phone}</a></dd>
            <dt>Ehliyet</dt>
            <dd>{driver.licenseInfo || "—"} {driver.licenseDate ? <>· <D v={driver.licenseDate} /></> : null}</dd>
            <dt>Açıklama</dt>
            <dd style={{ whiteSpace: "pre-wrap" }}>{driver.notes || "—"}</dd>
          </dl>
        </section>
        <section className="fl-card">
          <h2>Araçlar</h2>
          <dl className="fl-dl">
            <dt>Şu an</dt>
            <dd>{d.activeVehicle ? <Link href={`/fleet/araclar/${d.activeVehicle.id}`}>{d.activeVehicle.plate}</Link> : "—"}</dd>
            <dt>Geçmiş araçlar</dt>
            <dd>{d.pastVehicles.length ? d.pastVehicles.map((v, i) => <span key={v.id}>{i ? ", " : ""}<Link href={`/fleet/araclar/${v.id}`}>{v.plate}</Link></span>) : "—"}</dd>
            {d.activeRental?.nextDueDate ? (
              <>
                <dt>Sonraki ödeme</dt>
                <dd><D v={d.activeRental.nextDueDate} /> · <Money v={d.activeRental.nextDueAmount} /></dd>
              </>
            ) : null}
          </dl>
        </section>
      </div>
      <section className="fl-card" style={{ marginBottom: 14 }}>
        <h2>Kiralamalar</h2>
        <MiniTable
          head={["Kod", "Araç", "Başlangıç", "Bitiş", "Durum", "Ödeme", "Beklenen", "Tahsil", "Kalan"]}
          right={[6, 7, 8]}
          rows={d.rentals.map((r) => [
            <Link key="k" href={`/fleet/kiralamalar?k=${r.rental.id}`}>{r.rental.code}</Link>,
            plate.get(r.rental.vehicleId) ?? "?",
            <D key="s" v={r.rental.startDate} />,
            r.rental.endDate ? <D v={r.rental.endDate} /> : "Devam ediyor",
            <RentalStatusBadge key="st" status={r.rental.status} />,
            <PaymentStateBadge key="p" state={r.state} />,
            <Money key="e" v={r.expected} />,
            <Money key="pd" v={r.paid} />,
            <Money key="b" v={r.balance} signed />,
          ])}
        />
      </section>
      <section className="fl-card">
        <h2>Ödeme geçmişi</h2>
        <MiniTable
          head={["Kod", "Tarih", "Araç", "Yöntem", "Tutar"]}
          right={[4]}
          rows={payments.map((p) => [
            p.code,
            <D key="d" v={p.date} />,
            plate.get(p.vehicleId) ?? "?",
            LABELS.method[p.method],
            p.voided ? <Badge>İptal · {p.voidReason}</Badge> : <Money v={p.amount} />,
          ])}
        />
      </section>
    </>
  );
}
