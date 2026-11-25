import { DataTable, FormDialog } from "@/components/fleet/client";
import { Badge, D, Kpi, Money, PageHead, StoreNotice } from "@/components/fleet/ui";
import { formatTRY, sumActive } from "@/lib/fleet/calc";
import { adjustmentFields, reasonField } from "@/lib/fleet/forms";
import { loadFleet } from "@/lib/fleet/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kasa" };

const KIND = { opening: "Açılış", payment: "Tahsilat", expense: "Gider", adjustment: "Düzeltme" } as const;

export default async function CashPage() {
  const loaded = await loadFleet();
  if (!loaded.ok) return <StoreNotice message={loaded.message} />;
  const { data, view, today } = loaded;
  const adjustments = sumActive(data.adjustments);
  const ledger = [...view.ledger].reverse();
  const voidedAdjustments = data.adjustments.filter((a) => a.voided);

  return (
    <>
      <PageHead
        title="Kasa"
        sub="Kasa tek defterden hesaplanır: başlangıç bakiyesi + tahsilatlar − giderler ± düzeltmeler. Tahsil edilmemiş kira ve depozito kasaya girmez."
        actions={
          <FormDialog
            title="Kasa düzeltmesi"
            buttonLabel="± Düzeltme"
            op="adjustment.create"
            fields={adjustmentFields()}
            initial={{ date: today }}
            description={<span className="muted">Sayım farkı, depozito girişi gibi tahsilat/gider olmayan hareketler için. Gerekçe zorunlu.</span>}
          />
        }
      />
      <div className="fl-grid fl-kpis">
        <Kpi label="Başlangıç bakiyesi" value={formatTRY(data.settings.openingBalance)} sub={`${data.settings.openingDate.split("-").reverse().join(".")} itibarıyla`} />
        <Kpi label="Tahsilatlar (+)" value={formatTRY(sumActive(data.payments))} />
        <Kpi label="Giderler (−)" value={formatTRY(sumActive(data.expenses))} />
        <Kpi label="Düzeltmeler (±)" value={formatTRY(adjustments)} />
        <Kpi primary label="Güncel kasa" value={formatTRY(view.cash)} />
      </div>
      <DataTable
        columns={[
          { label: "Tarih" },
          { label: "Kod" },
          { label: "Tür" },
          { label: "Açıklama" },
          { label: "Giriş / çıkış", align: "right" },
          { label: "Bakiye", align: "right" },
          { label: "" },
        ]}
        filters={[{ key: "kind", label: "Tür", options: Object.entries(KIND).map(([value, label]) => ({ value, label })) }]}
        pageSize={50}
        rows={ledger.map((l, i) => ({
          key: `${l.refId}-${i}`,
          search: `${l.code} ${l.description} ${l.date}`,
          tags: { kind: l.kind },
          cells: [
            <D key="d" v={l.date} />,
            l.code,
            <Badge key="k" tone={l.kind === "payment" ? "green" : l.kind === "expense" ? "red" : "blue"}>{KIND[l.kind]}</Badge>,
            l.description,
            <Money key="a" v={l.amount} signed />,
            <Money key="b" v={l.balance} signed />,
            l.kind === "adjustment" ? (
              <FormDialog
                title={`Düzeltmeyi iptal et · ${l.code}`}
                buttonLabel="İptal"
                buttonClass="fl-btn small danger"
                op="adjustment.void"
                hidden={{ id: l.refId }}
                fields={reasonField("İptal gerekçesi")}
                submitLabel="İptal et"
              />
            ) : (
              ""
            ),
          ],
        }))}
      />
      {voidedAdjustments.length ? (
        <p className="muted" style={{ fontSize: 13 }}>
          İptal edilmiş düzeltmeler: {voidedAdjustments.map((a) => `${a.code} (${formatTRY(a.amount)} · ${a.voidReason})`).join(", ")}
        </p>
      ) : null}
    </>
  );
}
