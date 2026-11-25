import Link from "next/link";
import { DataTable, FormDialog } from "@/components/fleet/client";
import { Badge, Money, PageHead, StoreNotice, VehicleBadge } from "@/components/fleet/ui";
import { fullName } from "@/lib/fleet/calc";
import { vehicleFields, vehicleInitial } from "@/lib/fleet/forms";
import { loadFleet } from "@/lib/fleet/server";
import { LABELS } from "@/lib/fleet/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Araçlar" };

export default async function VehiclesPage() {
  const loaded = await loadFleet();
  if (!loaded.ok) return <StoreNotice message={loaded.message} />;
  const { view } = loaded;
  const vehicles = [...view.vehicles].sort((a, b) => a.vehicle.plate.localeCompare(b.vehicle.plate, "tr"));

  return (
    <>
      <PageHead
        title="Araçlar"
        sub="Araçlar silinmez; kullanılmayan aracı 'Pasif' yapın — geçmiş kiralama ve ödemeleri korunur."
        actions={<FormDialog title="Yeni araç" buttonLabel="+ Araç ekle" op="vehicle.save" fields={vehicleFields()} initial={vehicleInitial()} />}
      />
      <DataTable
        columns={[
          { label: "Plaka" },
          { label: "Araç" },
          { label: "Durum" },
          { label: "Aktif sürücü" },
          { label: "Km", align: "right" },
          { label: "Bakıma kalan", align: "right" },
          { label: "Belgeler" },
          { label: "Gelir", align: "right" },
          { label: "Gider", align: "right" },
          { label: "Net", align: "right" },
        ]}
        filters={[{ key: "status", label: "Durum", options: (["rented", "available", "maintenance", "passive"] as const).map((s) => ({ value: s, label: LABELS.vehicleStatus[s] })) }]}
        empty="Henüz araç eklenmedi."
        rows={vehicles.map((v) => ({
          key: v.vehicle.id,
          search: `${v.vehicle.plate} ${v.vehicle.brand} ${v.vehicle.model} ${v.activeDriver ? fullName(v.activeDriver) : ""}`,
          tags: { status: v.status },
          cells: [
            <Link key="p" href={`/fleet/araclar/${v.vehicle.id}`} style={{ fontWeight: 600 }}>
              {v.vehicle.plate}
            </Link>,
            `${v.vehicle.brand} ${v.vehicle.model}${v.vehicle.year ? ` · ${v.vehicle.year}` : ""}`,
            <VehicleBadge key="s" status={v.status} />,
            v.activeDriver ? <Link href={`/fleet/suruculer/${v.activeDriver.id}`}>{fullName(v.activeDriver)}</Link> : "—",
            v.km.toLocaleString("tr-TR"),
            v.service.kmLeft === null ? "—" : (
              <span className={v.service.kmLeft <= loaded.data.settings.serviceWarnKm ? "neg" : undefined}>{v.service.kmLeft.toLocaleString("tr-TR")} km</span>
            ),
            v.documents.length ? v.documents.map((d) => <Badge key={d.type} tone={d.daysLeft < 0 ? "red" : "amber"}>{d.type} {d.daysLeft < 0 ? "bitti" : `${d.daysLeft} gün`}</Badge>) : <span className="muted">—</span>,
            <Money key="i" v={v.income} />,
            <Money key="e" v={v.expense} />,
            <Money key="n" v={v.net} signed />,
          ],
        }))}
      />
    </>
  );
}
