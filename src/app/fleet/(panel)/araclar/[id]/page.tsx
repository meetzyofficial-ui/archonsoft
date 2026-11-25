import Link from "next/link";
import { notFound } from "next/navigation";
import { FormDialog } from "@/components/fleet/client";
import { Badge, D, Kpi, MiniTable, Money, PageHead, PaymentStateBadge, RentalStatusBadge, StoreNotice, VehicleBadge } from "@/components/fleet/ui";
import { formatTRY, fullName } from "@/lib/fleet/calc";
import { odometerFields, vehicleFields, vehicleInitial } from "@/lib/fleet/forms";
import { loadFleet } from "@/lib/fleet/server";
import { LABELS } from "@/lib/fleet/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Araç" };

export default async function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await loadFleet();
  if (!loaded.ok) return <StoreNotice message={loaded.message} />;
  const { data, view, today } = loaded;
  const v = view.vehicles.find((x) => x.vehicle.id === id);
  if (!v) notFound();
  const driver = new Map(data.drivers.map((d) => [d.id, d]));
  const expenses = data.expenses.filter((e) => e.vehicleId === id).sort((a, b) => b.date.localeCompare(a.date));
  const odometer = data.odometer.filter((o) => o.vehicleId === id).sort((a, b) => b.date.localeCompare(a.date) || b.km - a.km);
  const lowIds = new Set(view.odometerChecks.filter((c) => c.lowerThanPrevious).map((c) => c.entry.id));
  const { vehicle } = v;

  return (
    <>
      <PageHead
        title={vehicle.plate}
        sub={
          <>
            {vehicle.brand} {vehicle.model}
            {vehicle.year ? ` · ${vehicle.year}` : ""} · {vehicle.code} · <VehicleBadge status={v.status} />
          </>
        }
        actions={
          <>
            <Link className="fl-btn" href="/fleet/araclar">
              ‹ Araçlar
            </Link>
            <FormDialog
              title="Km / bakım kaydı"
              buttonLabel="+ Km / bakım"
              buttonClass="fl-btn"
              op="odometer.create"
              fields={odometerFields(data)}
              initial={{ vehicleId: vehicle.id, date: today, kind: "reading" }}
            />
            <FormDialog title="Aracı düzenle" buttonLabel="Düzenle" op="vehicle.save" fields={vehicleFields()} initial={vehicleInitial(vehicle)} hidden={{ id: vehicle.id }} />
          </>
        }
      />

      <div className="fl-grid fl-kpis">
        <Kpi label="Toplam gelir" value={formatTRY(v.income)} />
        <Kpi label="Toplam gider" value={formatTRY(v.expense)} />
        <Kpi primary label="Net kazanç" value={formatTRY(v.net)} />
        <Kpi label="Kilometre" value={v.km.toLocaleString("tr-TR")} sub={v.service.kmLeft === null ? "Bakım planı yok" : `Bakıma ${v.service.kmLeft.toLocaleString("tr-TR")} km`} />
      </div>

      <div className="fl-grid fl-2" style={{ marginBottom: 14 }}>
        <section className="fl-card">
          <h2>Genel bilgiler</h2>
          <dl className="fl-dl">
            <dt>Aktif sürücü</dt>
            <dd>{v.activeDriver ? <Link href={`/fleet/suruculer/${v.activeDriver.id}`}>{fullName(v.activeDriver)}</Link> : "—"}</dd>
            <dt>Kira (gün/hafta/ay)</dt>
            <dd className="num">
              {formatTRY(vehicle.dailyRate)} · {formatTRY(vehicle.weeklyRate)} · {formatTRY(vehicle.monthlyRate)}
            </dd>
            <dt>Son bakım</dt>
            <dd>
              <D v={v.service.lastServiceDate} />
              {v.service.lastServiceKm !== null ? ` · ${v.service.lastServiceKm.toLocaleString("tr-TR")} km` : ""}
            </dd>
            <dt>Sonraki bakım</dt>
            <dd>{v.service.nextServiceKm !== null ? `${v.service.nextServiceKm.toLocaleString("tr-TR")} km` : "—"}</dd>
            <dt>Notlar</dt>
            <dd style={{ whiteSpace: "pre-wrap" }}>{vehicle.notes || "—"}</dd>
          </dl>
        </section>
        <section className="fl-card">
          <h2>Sigorta · kasko · muayene · belgeler</h2>
          <dl className="fl-dl">
            {(
              [
                ["Sigorta bitiş", vehicle.insuranceEnd, "Sigorta"],
                ["Kasko bitiş", vehicle.kaskoEnd, "Kasko"],
                ["Muayene", vehicle.inspectionDate, "Muayene"],
              ] as const
            ).map(([label, date, type]) => {
              const alert = v.documents.find((d) => d.type === type);
              return (
                <div key={label} style={{ display: "contents" }}>
                  <dt>{label}</dt>
                  <dd>
                    <D v={date} /> {alert ? <Badge tone={alert.daysLeft < 0 ? "red" : "amber"}>{alert.daysLeft < 0 ? "Süresi geçti" : `${alert.daysLeft} gün kaldı`}</Badge> : null}
                  </dd>
                </div>
              );
            })}
            <dt>Belgeler</dt>
            <dd style={{ whiteSpace: "pre-wrap" }}>{vehicle.documents || "—"}</dd>
          </dl>
        </section>
      </div>

      <section className="fl-card" style={{ marginBottom: 14 }}>
        <h2>Kiralama geçmişi</h2>
        <MiniTable
          head={["Kod", "Sürücü", "Başlangıç", "Bitiş", "Durum", "Ödeme", "Beklenen", "Tahsil", "Kalan"]}
          right={[6, 7, 8]}
          rows={v.rentals.map((r) => {
            const d = driver.get(r.rental.driverId);
            return [
              <Link key="k" href={`/fleet/kiralamalar?k=${r.rental.id}`}>{r.rental.code}</Link>,
              d ? <Link href={`/fleet/suruculer/${d.id}`}>{fullName(d)}</Link> : "?",
              <D key="s" v={r.rental.startDate} />,
              r.rental.endDate ? <D v={r.rental.endDate} /> : "Devam ediyor",
              <RentalStatusBadge key="st" status={r.rental.status} />,
              <PaymentStateBadge key="ps" state={r.state} />,
              <Money key="e" v={r.expected} />,
              <Money key="p" v={r.paid} />,
              <Money key="b" v={r.balance} signed />,
            ];
          })}
        />
      </section>

      <div className="fl-grid fl-2">
        <section className="fl-card">
          <h2>
            Bakım ve kilometre geçmişi <Link href="/fleet/bakim">Tümü</Link>
          </h2>
          <MiniTable
            head={["Tarih", "Km", "İşlem", "Not"]}
            right={[1]}
            rows={odometer.map((o) => [
              <D key="d" v={o.date} />,
              <span key="k" className={lowIds.has(o.id) ? "neg" : undefined}>{o.km.toLocaleString("tr-TR")}{lowIds.has(o.id) ? " ⚠" : ""}</span>,
              `${LABELS.odometer[o.kind]}${o.work ? ` · ${o.work}` : ""}`,
              o.note || "—",
            ])}
          />
        </section>
        <section className="fl-card">
          <h2>
            Giderler <Link href="/fleet/giderler">Tümü</Link>
          </h2>
          <MiniTable
            head={["Tarih", "Kategori", "Açıklama", "Tutar"]}
            right={[3]}
            rows={expenses.map((e) => [
              <D key="d" v={e.date} />,
              e.category,
              e.voided ? <s>{e.description}</s> : e.description,
              e.voided ? <Badge>İptal</Badge> : <Money v={e.amount} />,
            ])}
          />
        </section>
      </div>
    </>
  );
}
