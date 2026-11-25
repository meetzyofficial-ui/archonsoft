import Link from "next/link";
import { DataTable, FormDialog } from "@/components/fleet/client";
import { Badge, D, Money, PageHead, StoreNotice } from "@/components/fleet/ui";
import { formatTRY, fullName, sumActive } from "@/lib/fleet/calc";
import { paymentFields, reasonField } from "@/lib/fleet/forms";
import { loadFleet } from "@/lib/fleet/server";
import { LABELS, PAYMENT_METHODS } from "@/lib/fleet/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tahsilatlar" };

export default async function PaymentsPage() {
  const loaded = await loadFleet();
  if (!loaded.ok) return <StoreNotice message={loaded.message} />;
  const { data, view, today } = loaded;
  const plate = new Map(data.vehicles.map((v) => [v.id, v.plate]));
  const driver = new Map(data.drivers.map((d) => [d.id, d]));
  const rental = new Map(data.rentals.map((r) => [r.id, r]));
  const payments = [...data.payments].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHead
        title="Tahsilatlar"
        sub={`Her para girişi ayrı kayıt. Toplam geçerli tahsilat: ${formatTRY(sumActive(data.payments))}. Hatalı kayıt silinmez, gerekçeyle iptal edilir.`}
        actions={
          data.rentals.length ? (
            <FormDialog title="Tahsilat gir" buttonLabel="+ Tahsilat" op="payment.create" fields={paymentFields(data, view)} initial={{ date: today, method: "cash" }} />
          ) : (
            <span className="muted">Önce bir kiralama açın.</span>
          )
        }
      />
      <DataTable
        columns={[
          { label: "Kod" },
          { label: "Tarih" },
          { label: "Araç" },
          { label: "Sürücü" },
          { label: "Kiralama" },
          { label: "Dönem" },
          { label: "Yöntem" },
          { label: "Tutar", align: "right" },
          { label: "Açıklama" },
          { label: "" },
        ]}
        filters={[
          { key: "method", label: "Yöntem", options: PAYMENT_METHODS.map((m) => ({ value: m, label: LABELS.method[m] })) },
          { key: "vehicle", label: "Araç", options: data.vehicles.map((v) => ({ value: v.id, label: v.plate })) },
          { key: "state", label: "Kayıt", options: [{ value: "ok", label: "Geçerli" }, { value: "void", label: "İptal" }] },
        ]}
        empty="Henüz tahsilat yok."
        rows={payments.map((p) => {
          const d = driver.get(p.driverId);
          return {
            key: p.id,
            search: `${p.code} ${plate.get(p.vehicleId) ?? ""} ${d ? fullName(d) : ""} ${p.note} ${rental.get(p.rentalId)?.code ?? ""}`,
            tags: { method: p.method, vehicle: p.vehicleId, state: p.voided ? "void" : "ok" },
            className: p.voided ? "void" : undefined,
            cells: [
              p.code,
              <D key="d" v={p.date} />,
              plate.get(p.vehicleId) ?? "?",
              d ? <Link href={`/fleet/suruculer/${d.id}`}>{fullName(d)}</Link> : "?",
              <Link key="k" href={`/fleet/kiralamalar?k=${p.rentalId}`}>{rental.get(p.rentalId)?.code ?? "?"}</Link>,
              p.periodStart || p.periodEnd ? <span className="num"><D v={p.periodStart} /> – <D v={p.periodEnd} /></span> : "—",
              LABELS.method[p.method],
              <Money key="m" v={p.amount} />,
              p.voided ? <Badge>İptal: {p.voidReason}</Badge> : p.note || "—",
              p.voided ? "" : (
                <FormDialog
                  title={`Tahsilatı iptal et · ${p.code}`}
                  buttonLabel="İptal"
                  buttonClass="fl-btn small danger"
                  op="payment.void"
                  hidden={{ id: p.id }}
                  fields={reasonField("İptal gerekçesi")}
                  description={<span className="muted">{formatTRY(p.amount)} kasadan ve sürücünün ödemelerinden düşülür. Kayıt silinmez, iptal olarak kalır.</span>}
                  submitLabel="İptal et"
                />
              ),
            ],
          };
        })}
      />
    </>
  );
}
