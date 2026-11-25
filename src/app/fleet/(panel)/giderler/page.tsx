import { DataTable, FormDialog } from "@/components/fleet/client";
import { Badge, D, Money, PageHead, StoreNotice } from "@/components/fleet/ui";
import { formatTRY, sumActive } from "@/lib/fleet/calc";
import { expenseFields, reasonField } from "@/lib/fleet/forms";
import { loadFleet } from "@/lib/fleet/server";
import { EXPENSE_CATEGORIES, LABELS } from "@/lib/fleet/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Giderler" };

export default async function ExpensesPage() {
  const loaded = await loadFleet();
  if (!loaded.ok) return <StoreNotice message={loaded.message} />;
  const { data, today } = loaded;
  const plate = new Map(data.vehicles.map((v) => [v.id, v.plate]));
  const expenses = [...data.expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHead
        title="Giderler"
        sub={`Toplam geçerli gider: ${formatTRY(sumActive(data.expenses))} · araçsız giderler 'Genel' sayılır.`}
        actions={<FormDialog title="Gider gir" buttonLabel="+ Gider" op="expense.create" fields={expenseFields(data)} initial={{ date: today, method: "cash", category: "Bakım" }} />}
      />
      <DataTable
        columns={[
          { label: "Kod" },
          { label: "Tarih" },
          { label: "Araç" },
          { label: "Kategori" },
          { label: "Açıklama" },
          { label: "Yöntem" },
          { label: "Fatura/fiş" },
          { label: "Tutar", align: "right" },
          { label: "" },
        ]}
        filters={[
          { key: "category", label: "Kategori", options: EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })) },
          { key: "vehicle", label: "Araç", options: [{ value: "general", label: "Genel" }, ...data.vehicles.map((v) => ({ value: v.id, label: v.plate }))] },
          { key: "state", label: "Kayıt", options: [{ value: "ok", label: "Geçerli" }, { value: "void", label: "İptal" }] },
        ]}
        empty="Henüz gider yok."
        rows={expenses.map((e) => ({
          key: e.id,
          search: `${e.code} ${e.description} ${e.note} ${e.invoice} ${e.vehicleId ? plate.get(e.vehicleId) ?? "" : "genel"}`,
          tags: { category: e.category, vehicle: e.vehicleId ?? "general", state: e.voided ? "void" : "ok" },
          className: e.voided ? "void" : undefined,
          cells: [
            e.code,
            <D key="d" v={e.date} />,
            e.vehicleId ? plate.get(e.vehicleId) ?? "?" : <Badge>Genel</Badge>,
            e.category,
            e.voided ? <span>{e.description} <Badge>İptal: {e.voidReason}</Badge></span> : e.description,
            LABELS.method[e.method],
            e.invoice || "—",
            <Money key="m" v={e.amount} />,
            e.voided ? "" : (
              <FormDialog
                title={`Gideri iptal et · ${e.code}`}
                buttonLabel="İptal"
                buttonClass="fl-btn small danger"
                op="expense.void"
                hidden={{ id: e.id }}
                fields={reasonField("İptal gerekçesi")}
                description={<span className="muted">{formatTRY(e.amount)} kasaya geri eklenir. Kayıt silinmez.</span>}
                submitLabel="İptal et"
              />
            ),
          ],
        }))}
      />
    </>
  );
}
