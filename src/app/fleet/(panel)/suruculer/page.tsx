import Link from "next/link";
import { DataTable, FormDialog } from "@/components/fleet/client";
import { Badge, Money, PageHead, StoreNotice } from "@/components/fleet/ui";
import { fullName, maskNationalId } from "@/lib/fleet/calc";
import { driverFields, driverInitial } from "@/lib/fleet/forms";
import { loadFleet } from "@/lib/fleet/server";
import { DRIVER_STATUSES, LABELS } from "@/lib/fleet/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sürücüler" };

export default async function DriversPage() {
  const loaded = await loadFleet();
  if (!loaded.ok) return <StoreNotice message={loaded.message} />;
  const drivers = [...loaded.view.drivers].sort((a, b) => fullName(a.driver).localeCompare(fullName(b.driver), "tr"));

  return (
    <>
      <PageHead
        title="Sürücüler"
        sub="TC kimlik numarası listede maskelenir; tamamı yalnızca sürücü detayında görünür."
        actions={<FormDialog title="Yeni sürücü" buttonLabel="+ Sürücü ekle" op="driver.save" fields={driverFields()} initial={driverInitial()} />}
      />
      <DataTable
        columns={[
          { label: "Sürücü" },
          { label: "TC" },
          { label: "Telefon" },
          { label: "Kiraladığı araç" },
          { label: "Durum" },
          { label: "Toplam ödeme", align: "right" },
          { label: "Kalan borç", align: "right" },
          { label: "Gecikmiş", align: "right" },
        ]}
        filters={[{ key: "status", label: "Durum", options: DRIVER_STATUSES.map((s) => ({ value: s, label: LABELS.driverStatus[s] })) }]}
        empty="Henüz sürücü eklenmedi."
        rows={drivers.map((d) => ({
          key: d.driver.id,
          search: `${fullName(d.driver)} ${d.driver.phone} ${d.activeVehicle?.plate ?? ""}`,
          tags: { status: d.driver.status },
          cells: [
            <Link key="n" href={`/fleet/suruculer/${d.driver.id}`} style={{ fontWeight: 600 }}>
              {fullName(d.driver)}
            </Link>,
            <span key="t" className="num muted">{maskNationalId(d.driver.nationalId)}</span>,
            <a key="p" href={`tel:${d.driver.phone}`} className="num">{d.driver.phone}</a>,
            d.activeVehicle ? <Link href={`/fleet/araclar/${d.activeVehicle.id}`}>{d.activeVehicle.plate}</Link> : "—",
            <Badge key="s" tone={d.driver.status === "active" ? "green" : d.driver.status === "blacklist" ? "red" : undefined}>{LABELS.driverStatus[d.driver.status]}</Badge>,
            <Money key="tp" v={d.totalPaid} />,
            <Money key="b" v={d.balance} signed />,
            d.overdue > 0 ? <span className="neg"><Money v={d.overdue} /></span> : <Money v={0} />,
          ],
        }))}
      />
    </>
  );
}
