import Link from "next/link";
import { RangePicker } from "@/components/fleet/client";
import { D, GroupedBars, Kpi, MiniTable, Money, PageHead, StoreNotice } from "@/components/fleet/ui";
import { buildReport, formatDateTR, formatTRY, fullName, resolveRange, type RangePreset } from "@/lib/fleet/calc";
import { loadFleet } from "@/lib/fleet/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Raporlar" };

const PRESETS: [RangePreset, string][] = [
  ["day", "Bugün"],
  ["week", "Bu hafta"],
  ["month", "Bu ay"],
  ["year", "Bu yıl"],
  ["custom", "Özel aralık"],
];

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ aralik?: string; bas?: string; bit?: string }> }) {
  const sp = await searchParams;
  const loaded = await loadFleet();
  if (!loaded.ok) return <StoreNotice message={loaded.message} />;
  const { data, view, today } = loaded;
  const preset = (PRESETS.map((p) => p[0]) as string[]).includes(sp.aralik ?? "") ? (sp.aralik as RangePreset) : "month";
  const { from, to } = resolveRange(preset, today, sp.bas, sp.bit);
  const report = buildReport(data, view, from, to);
  const query = `aralik=${preset}${preset === "custom" ? `&bas=${from}&bit=${to}` : ""}`;
  const plate = new Map(data.vehicles.map((v) => [v.id, v.plate]));
  const driver = new Map(data.drivers.map((d) => [d.id, fullName(d)]));
  const daily = report.daily.slice(-31);

  return (
    <>
      <PageHead
        title="Raporlar"
        sub={`${formatDateTR(from)} – ${formatDateTR(to)}`}
        actions={
          <a className="fl-btn primary" href={`/api/fleet/export?${query}`}>
            Excel&apos;e aktar
          </a>
        }
      />
      <div className="fl-toolbar" style={{ justifyContent: "space-between" }}>
        <nav className="fl-tabs" aria-label="Tarih aralığı">
          {PRESETS.filter((p) => p[0] !== "custom").map(([key, label]) => (
            <Link key={key} href={`/fleet/raporlar?aralik=${key}`} aria-current={preset === key ? "true" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <RangePicker from={from} to={to} base="/fleet/raporlar" />
      </div>

      <div className="fl-grid fl-kpis">
        <Kpi label="Gelir" value={formatTRY(report.income)} />
        <Kpi label="Gider" value={formatTRY(report.expense)} />
        <Kpi primary label="Net kazanç" value={formatTRY(report.net)} />
        <Kpi label="Dönem başı kasa" value={formatTRY(report.openingBalance)} />
        <Kpi label="Dönem sonu kasa" value={formatTRY(report.closingBalance)} />
        <Kpi label="Geciken tahsilat" value={formatTRY(report.overdue.reduce((a, r) => a + r.overdue, 0))} sub={`${report.overdue.length} kiralama · bugün itibarıyla`} tone={report.overdue.length ? "neg" : undefined} />
      </div>

      <div className="fl-grid fl-2" style={{ marginBottom: 14 }}>
        <section className="fl-card">
          <h2>Günlük gelir – gider</h2>
          {daily.length ? (
            <GroupedBars
              labels={daily.map((d) => d.date.slice(8, 10) + "." + d.date.slice(5, 7))}
              series={[
                { name: "Gelir", color: "#0b0f1a", values: daily.map((d) => d.income) },
                { name: "Gider", color: "#4f86ff", values: daily.map((d) => d.expense) },
              ]}
            />
          ) : (
            <div className="fl-empty">Bu aralıkta hareket yok.</div>
          )}
        </section>
        <section className="fl-card">
          <h2>Araç kârlılığı</h2>
          <MiniTable
            head={["Araç", "Gelir", "Gider", "Net"]}
            right={[1, 2, 3]}
            rows={[
              ...report.byVehicle.map((v) => [v.vehicle.plate, <Money key="i" v={v.income} />, <Money key="e" v={v.expense} />, <Money key="n" v={v.net} signed />]),
              ["Genel giderler", "—", <Money key="g" v={report.generalExpense} />, <Money key="gn" v={-report.generalExpense} signed />],
              [<b key="t">Toplam</b>, <Money key="ti" v={report.income} />, <Money key="te" v={report.expense} />, <Money key="tn" v={report.net} signed />],
            ]}
          />
        </section>
      </div>

      <div className="fl-grid fl-2" style={{ marginBottom: 14 }}>
        <section className="fl-card">
          <h2>Sürücü ödeme performansı</h2>
          <MiniTable
            head={["Sürücü", "Dönemde ödenen", "Vadesinde", "Şu an gecikmiş"]}
            right={[1, 2, 3]}
            rows={report.byDriver
              .filter((d) => d.paidInRange || d.installmentsDue || d.overdueNow)
              .map((d) => [
                fullName(d.driver),
                <Money key="p" v={d.paidInRange} />,
                d.installmentsDue ? `${d.paidOnTime} / ${d.installmentsDue}` : "—",
                d.overdueNow ? <span className="neg"><Money v={d.overdueNow} /></span> : "—",
              ])}
            empty="Bu aralıkta ödeme hareketi yok."
          />
        </section>
        <section className="fl-card">
          <h2>Gider kategorileri</h2>
          <MiniTable head={["Kategori", "Tutar"]} right={[1]} rows={report.byCategory.map((c) => [c.category, <Money key="m" v={c.amount} />])} empty="Gider yok." />
        </section>
      </div>

      <section className="fl-card" style={{ marginBottom: 14 }}>
        <h2>Geciken tahsilatlar (bugün itibarıyla)</h2>
        <MiniTable
          head={["Kiralama", "Araç", "Sürücü", "İlk ödenmeyen vade", "Gün", "Tutar"]}
          right={[4, 5]}
          empty="Geciken tahsilat yok."
          rows={report.overdue.map((r) => [
            <Link key="k" href={`/fleet/kiralamalar?k=${r.rental.id}`}>{r.rental.code}</Link>,
            plate.get(r.rental.vehicleId),
            driver.get(r.rental.driverId),
            <D key="d" v={r.overdueSince} />,
            r.overdueDays,
            <Money key="m" v={r.overdue} />,
          ])}
        />
      </section>

      <section className="fl-card">
        <h2>Kasa hareketleri</h2>
        <MiniTable
          head={["Tarih", "Kod", "Açıklama", "Tutar", "Bakiye"]}
          right={[3, 4]}
          empty="Bu aralıkta kasa hareketi yok."
          rows={report.ledger.map((l) => [<D key="d" v={l.date} />, l.code, l.description, <Money key="a" v={l.amount} signed />, <Money key="b" v={l.balance} signed />])}
        />
      </section>
    </>
  );
}
