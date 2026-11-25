import Link from "next/link";
import { DataTable, FormDialog } from "@/components/fleet/client";
import { Badge, D, MiniTable, Money, PageHead, PAYMENT_STATE_LABEL, PaymentStateBadge, RentalStatusBadge, StoreNotice } from "@/components/fleet/ui";
import { formatTRY, fullName, type InstallmentStatus } from "@/lib/fleet/calc";
import { moneyInput, paymentFields, reasonField, rentalFields } from "@/lib/fleet/forms";
import { loadFleet } from "@/lib/fleet/server";
import { LABELS, RENTAL_STATUSES } from "@/lib/fleet/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kiralamalar" };

const INSTALLMENT_LABEL: Record<InstallmentStatus, [string, "green" | "red" | "amber" | undefined]> = {
  paid: ["Ödendi", "green"],
  overdue: ["Gecikmiş", "red"],
  "due-soon": ["Yaklaşıyor", "amber"],
  upcoming: ["Planlı", undefined],
};

export default async function RentalsPage({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const { k } = await searchParams;
  const loaded = await loadFleet();
  if (!loaded.ok) return <StoreNotice message={loaded.message} />;
  const { data, view, today } = loaded;
  const vehicle = new Map(data.vehicles.map((v) => [v.id, v]));
  const driver = new Map(data.drivers.map((d) => [d.id, d]));
  const selected = k ? view.rentals.find((r) => r.rental.id === k) : undefined;
  const canCreate = data.vehicles.length > 0 && data.drivers.length > 0;

  return (
    <>
      <PageHead
        title="Kiralamalar"
        sub="Ödeme planı kiralamadan otomatik oluşur; tahsilatlar ayrı kaydedilir ve en eski taksitten başlayarak düşülür."
        actions={
          canCreate ? (
            <FormDialog
              title="Yeni kiralama"
              buttonLabel="+ Kiralama"
              op="rental.create"
              fields={rentalFields(data)}
              initial={{ startDate: today, period: "weekly" }}
              description={<span className="muted">Bir araç aynı tarihlerde ikinci kez kiralanamaz; sistem çakışmayı engeller.</span>}
            />
          ) : (
            <span className="muted">Önce araç ve sürücü ekleyin.</span>
          )
        }
      />

      {selected ? (
        <section className="fl-card" style={{ marginBottom: 16 }}>
          <h2>
            {selected.rental.code} · {vehicle.get(selected.rental.vehicleId)?.plate} · {(() => {
              const d = driver.get(selected.rental.driverId);
              return d ? fullName(d) : "?";
            })()}
            <Link href="/fleet/kiralamalar">Kapat ✕</Link>
          </h2>
          <div className="fl-grid fl-kpis" style={{ marginBottom: 12 }}>
            <div><div className="muted">Dönem tutarı</div><b className="num">{formatTRY(selected.periodAmount)} / {LABELS.period[selected.rental.period].toLocaleLowerCase("tr-TR")}</b></div>
            <div><div className="muted">Toplam gün</div><b className="num">{selected.totalDays}</b></div>
            <div><div className="muted">Beklenen</div><b className="num">{formatTRY(selected.expected)}</b></div>
            <div><div className="muted">Tahsil edilen</div><b className="num">{formatTRY(selected.paid)}</b></div>
            <div><div className="muted">Kalan</div><b className={`num${selected.balance > 0 ? " neg" : ""}`}>{formatTRY(selected.balance)}</b></div>
            <div><div className="muted">Depozito</div><b className="num">{formatTRY(selected.rental.deposit)}</b></div>
          </div>
          <h2 style={{ marginTop: 6 }}>Ödeme planı</h2>
          <MiniTable
            head={["#", "Dönem", "Gün", "Vade", "Tutar", "Ödenen", "Durum"]}
            right={[2, 4, 5]}
            empty="Plan yok (iptal edilmiş kiralama)."
            rows={selected.schedule.map((i) => [
              i.index,
              <span key="p" className="num">{i.start.split("-").reverse().join(".")} – {i.end.split("-").reverse().join(".")}</span>,
              i.days,
              <D key="v" v={i.dueDate} />,
              <Money key="a" v={i.amount} />,
              <Money key="pd" v={i.paid} />,
              <Badge key="s" tone={INSTALLMENT_LABEL[i.status][1]}>{INSTALLMENT_LABEL[i.status][0]}</Badge>,
            ])}
          />
          {selected.rental.notes ? <p className="muted" style={{ whiteSpace: "pre-wrap" }}>Not: {selected.rental.notes}</p> : null}
          {selected.rental.cancelReason ? <p className="muted">İptal gerekçesi: {selected.rental.cancelReason}</p> : null}
        </section>
      ) : null}

      <DataTable
        columns={[
          { label: "Kod" },
          { label: "Araç" },
          { label: "Sürücü" },
          { label: "Tarihler" },
          { label: "Periyot" },
          { label: "Gün", align: "right" },
          { label: "Beklenen", align: "right" },
          { label: "Tahsil", align: "right" },
          { label: "Kalan", align: "right" },
          { label: "Ödeme" },
          { label: "Sonraki vade" },
          { label: "Durum" },
          { label: "" },
        ]}
        filters={[
          { key: "status", label: "Durum", options: RENTAL_STATUSES.map((s) => ({ value: s, label: LABELS.rentalStatus[s] })) },
          { key: "pay", label: "Ödeme", options: (Object.keys(PAYMENT_STATE_LABEL) as (keyof typeof PAYMENT_STATE_LABEL)[]).map((s) => ({ value: s, label: PAYMENT_STATE_LABEL[s] })) },
        ]}
        empty="Henüz kiralama yok."
        rows={view.rentals.map((r) => {
          const v = vehicle.get(r.rental.vehicleId);
          const d = driver.get(r.rental.driverId);
          const active = r.rental.status === "active";
          return {
            key: r.rental.id,
            search: `${r.rental.code} ${v?.plate ?? ""} ${d ? fullName(d) : ""}`,
            tags: { status: r.rental.status, pay: r.state },
            className: r.rental.id === k ? "selected" : undefined,
            cells: [
              <Link key="c" href={`/fleet/kiralamalar?k=${r.rental.id}`} style={{ fontWeight: 600 }}>{r.rental.code}</Link>,
              v ? <Link href={`/fleet/araclar/${v.id}`}>{v.plate}</Link> : "?",
              d ? <Link href={`/fleet/suruculer/${d.id}`}>{fullName(d)}</Link> : "?",
              <span key="t" className="num">
                <D v={r.rental.startDate} /> → {r.rental.endDate ? <D v={r.rental.endDate} /> : "devam"}
              </span>,
              `${LABELS.period[r.rental.period]} · ${formatTRY(r.periodAmount)}`,
              r.totalDays,
              <Money key="e" v={r.expected} />,
              <Money key="p" v={r.paid} />,
              <Money key="b" v={r.balance} signed />,
              <span key="ps">
                <PaymentStateBadge state={r.state} />
                {r.overdue > 0 ? <span className="neg num" style={{ display: "block", fontSize: 12 }}>{formatTRY(r.overdue)} · {r.overdueDays} gün</span> : null}
              </span>,
              r.nextDueDate ? <span key="n"><D v={r.nextDueDate} /><span className="muted" style={{ display: "block", fontSize: 12 }}>{formatTRY(r.nextDueAmount)}</span></span> : "—",
              <RentalStatusBadge key="s" status={r.rental.status} />,
              active ? (
                <span key="a" style={{ display: "flex", gap: 6 }}>
                  <FormDialog
                    title={`Tahsilat · ${r.rental.code}`}
                    buttonLabel="Tahsilat"
                    buttonClass="fl-btn small"
                    op="payment.create"
                    fields={paymentFields(data, view)}
                    initial={{ rentalId: r.rental.id, date: today, method: "cash", amount: moneyInput(r.overdue > 0 ? r.overdue : r.nextDueAmount || r.periodAmount) }}
                  />
                  <FormDialog
                    title={`Bitiş tarihi · ${r.rental.code}`}
                    buttonLabel="Bitiş"
                    buttonClass="fl-btn small"
                    op="rental.end"
                    hidden={{ id: r.rental.id }}
                    fields={[{ name: "endDate", label: "Yeni bitiş tarihi", type: "date", hint: "Boş bırakırsanız açık uçlu olur." }]}
                    initial={{ endDate: r.rental.endDate ?? "" }}
                  />
                  <FormDialog
                    title={`Kiralamayı tamamla · ${r.rental.code}`}
                    buttonLabel="Tamamla"
                    buttonClass="fl-btn small"
                    op="rental.complete"
                    hidden={{ id: r.rental.id }}
                    fields={[{ name: "endDate", label: "Bitiş tarihi", type: "date", required: true }]}
                    initial={{ endDate: r.rental.endDate && r.rental.endDate < today ? r.rental.endDate : today }}
                    description={<span className="muted">Araç boşa çıkar. Kalan borç varsa sürücünün borcunda görünmeye devam eder.</span>}
                    submitLabel="Tamamla"
                  />
                  <FormDialog
                    title={`Kiralamayı iptal et · ${r.rental.code}`}
                    buttonLabel="İptal"
                    buttonClass="fl-btn small danger"
                    op="rental.cancel"
                    hidden={{ id: r.rental.id }}
                    fields={reasonField("İptal gerekçesi")}
                    description={<span className="muted">Yalnızca hiç tahsilatı olmayan (yanlış açılmış) kiralama iptal edilir. Kayıt silinmez.</span>}
                    submitLabel="İptal et"
                  />
                </span>
              ) : (
                ""
              ),
            ],
          };
        })}
      />
    </>
  );
}
