import Link from "next/link";
import { DataTable, FormDialog } from "@/components/fleet/client";
import { Badge, D, MiniTable, Money, PageHead, StoreNotice } from "@/components/fleet/ui";
import { odometerFields } from "@/lib/fleet/forms";
import { loadFleet } from "@/lib/fleet/server";
import { LABELS, ODOMETER_KINDS } from "@/lib/fleet/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bakım ve Km" };

export default async function MaintenancePage() {
  const loaded = await loadFleet();
  if (!loaded.ok) return <StoreNotice message={loaded.message} />;
  const { data, view, today } = loaded;
  const plate = new Map(data.vehicles.map((v) => [v.id, v.plate]));
  const checks = new Map(view.odometerChecks.map((c) => [c.entry.id, c]));
  const entries = [...data.odometer].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const warn = data.settings.serviceWarnKm;

  return (
    <>
      <PageHead
        title="Bakım ve kilometre"
        sub="Km geçmişi tutulur. Önceki kayıttan düşük km girilirse sistem uyarır ve onay ister."
        actions={
          data.vehicles.length ? (
            <FormDialog title="Km / bakım kaydı" buttonLabel="+ Kayıt" op="odometer.create" fields={odometerFields(data)} initial={{ date: today, kind: "reading" }} />
          ) : null
        }
      />
      <section className="fl-card" style={{ marginBottom: 16 }}>
        <h2>Araçların bakım durumu</h2>
        <MiniTable
          head={["Araç", "Güncel km", "Son bakım", "Son bakım km", "Sonraki bakım km", "Kalan"]}
          right={[1, 3, 4, 5]}
          empty="Araç yok."
          rows={view.vehicles
            .filter((v) => v.status !== "passive")
            .sort((a, b) => (a.service.kmLeft ?? 1e9) - (b.service.kmLeft ?? 1e9))
            .map((v) => [
              <Link key="p" href={`/fleet/araclar/${v.vehicle.id}`}>{v.vehicle.plate}</Link>,
              v.km.toLocaleString("tr-TR"),
              <D key="d" v={v.service.lastServiceDate} />,
              v.service.lastServiceKm?.toLocaleString("tr-TR") ?? "—",
              v.service.nextServiceKm?.toLocaleString("tr-TR") ?? "—",
              v.service.kmLeft === null ? (
                <span className="muted">Plan yok</span>
              ) : v.service.kmLeft <= 0 ? (
                <Badge tone="red">{Math.abs(v.service.kmLeft).toLocaleString("tr-TR")} km geçti</Badge>
              ) : v.service.kmLeft <= warn ? (
                <Badge tone="amber">{v.service.kmLeft.toLocaleString("tr-TR")} km</Badge>
              ) : (
                `${v.service.kmLeft.toLocaleString("tr-TR")} km`
              ),
            ])}
        />
      </section>
      <DataTable
        columns={[
          { label: "Tarih" },
          { label: "Araç" },
          { label: "Km", align: "right" },
          { label: "İşlem" },
          { label: "Yapılan işlem" },
          { label: "Masraf", align: "right" },
          { label: "Sonraki bakım", align: "right" },
          { label: "Kontrol" },
        ]}
        filters={[
          { key: "vehicle", label: "Araç", options: data.vehicles.map((v) => ({ value: v.id, label: v.plate })) },
          { key: "kind", label: "İşlem", options: ODOMETER_KINDS.map((k) => ({ value: k, label: LABELS.odometer[k] })) },
        ]}
        empty="Henüz km/bakım kaydı yok."
        rows={entries.map((o) => {
          const c = checks.get(o.id);
          return {
            key: o.id,
            search: `${plate.get(o.vehicleId) ?? ""} ${o.work} ${o.note}`,
            tags: { vehicle: o.vehicleId, kind: o.kind },
            cells: [
              <D key="d" v={o.date} />,
              plate.get(o.vehicleId) ?? "?",
              o.km.toLocaleString("tr-TR"),
              LABELS.odometer[o.kind],
              o.work || "—",
              o.cost ? <Money v={o.cost} /> : "—",
              o.nextServiceKm?.toLocaleString("tr-TR") ?? "—",
              c?.lowerThanPrevious ? <Badge tone="red">Önceki {c.previousMax.toLocaleString("tr-TR")} km&apos;den düşük</Badge> : <Badge tone="green">✓</Badge>,
            ],
          };
        })}
      />
    </>
  );
}
