import Link from "next/link";
import { FormDialog } from "@/components/fleet/client";
import { AlertList, D, GroupedBars, HBars, Kpi, MiniTable, Money, PageHead, StoreNotice } from "@/components/fleet/ui";
import { formatTRY, fullName, monthEnd, monthlySeries, monthStart, sumActive } from "@/lib/fleet/calc";
import { paymentFields } from "@/lib/fleet/forms";
import { loadFleet } from "@/lib/fleet/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const loaded = await loadFleet();
  if (!loaded.ok) return <StoreNotice message={loaded.message} />;
  const { data, view, today } = loaded;

  const ms = monthStart(today);
  const me = monthEnd(today);
  const monthIncome = sumActive(data.payments.filter((p) => p.date >= ms && p.date <= me));
  const monthExpense = sumActive(data.expenses.filter((e) => e.date >= ms && e.date <= me));
  const totalIncome = sumActive(data.payments);
  const totalExpense = sumActive(data.expenses);
  const active = view.rentals.filter((r) => r.rental.status === "active");
  const idle = view.vehicles.filter((v) => v.status === "available");
  const overdue = view.rentals.filter((r) => r.overdue > 0);
  const upcoming = active.filter((r) => r.nextDueDate).sort((a, b) => (a.nextDueDate ?? "").localeCompare(b.nextDueDate ?? "")).slice(0, 8);
  const service = view.vehicles
    .filter((v) => v.status !== "passive" && v.service.kmLeft !== null && v.service.kmLeft <= data.settings.serviceWarnKm)
    .sort((a, b) => (a.service.kmLeft ?? 0) - (b.service.kmLeft ?? 0));
  const months = monthlySeries(data, today, 12);
  const plate = new Map(data.vehicles.map((v) => [v.id, v.plate]));
  const driver = new Map(data.drivers.map((d) => [d.id, fullName(d)]));

  return (
    <>
      <PageHead
        title="Dashboard"
        sub={`Bugün ${today.split("-").reverse().join(".")} · tüm değerler kayıtlardan anlık hesaplanır`}
        actions={
          data.rentals.length ? (
            <FormDialog
              title="Tahsilat gir"
              buttonLabel="+ Tahsilat"
              op="payment.create"
              fields={paymentFields(data, view)}
              initial={{ date: today, method: "cash" }}
            />
          ) : null
        }
      />

      {data.vehicles.length === 0 ? (
        <div className="fl-notice">
          Henüz araç yok. <Link href="/fleet/araclar" style={{ textDecoration: "underline" }}>Araçlar</Link> sayfasından ilk aracı ekleyin, sonra
          sürücü ve kiralama girin. Başlangıç kasanızı <Link href="/fleet/ayarlar" style={{ textDecoration: "underline" }}>Ayarlar</Link>&apos;dan yazın.
        </div>
      ) : null}

      <div className="fl-grid fl-kpis">
        <Kpi primary label="Güncel kasa" value={formatTRY(view.cash)} sub="Tahsil edilmiş para − giderler" />
        <Kpi label="Toplam tahsilat" value={formatTRY(totalIncome)} />
        <Kpi label="Toplam gider" value={formatTRY(totalExpense)} />
        <Kpi label="Bu ayki net" value={formatTRY(monthIncome - monthExpense)} tone={monthIncome - monthExpense < 0 ? "neg" : undefined} sub={`${formatTRY(monthIncome)} gelir · ${formatTRY(monthExpense)} gider`} />
        <Kpi label="Aktif kiralama" value={active.length} sub={`${view.vehicles.filter((v) => v.status === "rented").length} araç kirada`} />
        <Kpi label="Boş araç" value={idle.length} sub={idle.map((v) => v.vehicle.plate).join(", ") || "—"} />
        <Kpi label="Gecikmiş ödeme" value={formatTRY(overdue.reduce((a, r) => a + r.overdue, 0))} tone={overdue.length ? "neg" : undefined} sub={`${overdue.length} kiralama`} />
        <Kpi label="Bakımı yaklaşan" value={service.length} sub="araç" />
      </div>

      <div className="fl-grid fl-2" style={{ marginBottom: 14 }}>
        <section className="fl-card">
          <h2>
            Uyarılar <span className="fl-badge">{view.alerts.length}</span>
          </h2>
          <AlertList alerts={view.alerts} limit={8} />
        </section>
        <section className="fl-card">
          <h2>
            Yaklaşan ödemeler <Link href="/fleet/kiralamalar">Tümü</Link>
          </h2>
          <MiniTable
            head={["Vade", "Araç", "Sürücü", "Tutar"]}
            right={[3]}
            empty="Planlı ödeme yok."
            rows={upcoming.map((r) => [<D key="d" v={r.nextDueDate} />, plate.get(r.rental.vehicleId), driver.get(r.rental.driverId), <Money key="m" v={r.nextDueAmount} />])}
          />
        </section>
      </div>

      <div className="fl-grid fl-2" style={{ marginBottom: 14 }}>
        <section className="fl-card">
          <h2>
            Ödemesi gecikenler <Link href="/fleet/raporlar">Rapor</Link>
          </h2>
          <MiniTable
            head={["Araç", "Sürücü", "Gün", "Tutar"]}
            right={[2, 3]}
            empty="Geciken ödeme yok."
            rows={overdue.map((r) => [plate.get(r.rental.vehicleId), driver.get(r.rental.driverId), r.overdueDays, <Money key="m" v={r.overdue} />])}
          />
        </section>
        <section className="fl-card">
          <h2>
            Bakım zamanı yaklaşan <Link href="/fleet/bakim">Bakım</Link>
          </h2>
          <MiniTable
            head={["Araç", "Güncel km", "Bakım km", "Kalan"]}
            right={[1, 2, 3]}
            empty="Yaklaşan bakım yok."
            rows={service.map((v) => [
              <Link key="l" href={`/fleet/araclar/${v.vehicle.id}`}>{v.vehicle.plate}</Link>,
              v.km.toLocaleString("tr-TR"),
              v.service.nextServiceKm?.toLocaleString("tr-TR") ?? "—",
              <span key="k" className={(v.service.kmLeft ?? 0) <= 0 ? "neg" : undefined}>{v.service.kmLeft?.toLocaleString("tr-TR")} km</span>,
            ])}
          />
        </section>
      </div>

      <div className="fl-grid fl-2">
        <section className="fl-card">
          <h2>Aylık gelir – gider (son 12 ay)</h2>
          <GroupedBars
            labels={months.map((m) => `${m.month.slice(5, 7)}.${m.month.slice(2, 4)}`)}
            series={[
              { name: "Gelir", color: "#0b0f1a", values: months.map((m) => m.income) },
              { name: "Gider", color: "#4f86ff", values: months.map((m) => m.expense) },
            ]}
          />
        </section>
        <section className="fl-card">
          <h2>Araç bazlı net kazanç</h2>
          <HBars items={view.vehicles.filter((v) => v.status !== "passive" || v.net !== 0).map((v) => ({ label: v.vehicle.plate, value: v.net }))} />
          <p className="muted" style={{ fontSize: 12, margin: "8px 0 0" }}>Araca bağlı tahsilat − araca bağlı gider. Genel giderler dahil değildir.</p>
        </section>
      </div>
    </>
  );
}
