/**
 * Rapor → Excel sayfaları. Ekrandaki raporla aynı hesaplardan üretilir.
 */
import { fullName, type FleetView, type Report } from "./calc";
import { LABELS, type FleetData } from "./types";
import type { Sheet } from "./xlsx";

export function reportSheets(data: FleetData, view: FleetView, report: Report): Sheet[] {
  const plate = new Map(data.vehicles.map((v) => [v.id, v.plate]));
  const name = new Map(data.drivers.map((d) => [d.id, fullName(d)]));
  const inRange = (d: string) => d >= report.from && d <= report.to;

  return [
    {
      name: "Özet",
      columns: [
        { header: "Kalem", type: "text", width: 34 },
        { header: "Değer", type: "money", width: 18 },
      ],
      rows: [
        [`Dönem: ${report.from} — ${report.to}`, null],
        ["Dönem başı kasa", report.openingBalance],
        ["Gelir (tahsilat)", report.income],
        ["Gider", report.expense],
        ["Net kazanç", report.net],
        ["Dönem sonu kasa", report.closingBalance],
        ["Güncel kasa (bugün)", view.cash],
        ["Genel giderler (araçsız)", report.generalExpense],
      ],
    },
    {
      name: "Kasa hareketleri",
      columns: [
        { header: "Tarih", type: "date" },
        { header: "Kod", type: "text" },
        { header: "Tür", type: "text" },
        { header: "Açıklama", type: "text", width: 50 },
        { header: "Tutar", type: "money", width: 16 },
        { header: "Bakiye", type: "money", width: 16 },
      ],
      rows: report.ledger.map((l) => [
        l.date,
        l.code,
        { opening: "Açılış", payment: "Tahsilat", expense: "Gider", adjustment: "Düzeltme" }[l.kind],
        l.description,
        l.amount,
        l.balance,
      ]),
    },
    {
      name: "Tahsilatlar",
      columns: [
        { header: "Kod", type: "text" },
        { header: "Tarih", type: "date" },
        { header: "Plaka", type: "text" },
        { header: "Sürücü", type: "text", width: 22 },
        { header: "Kiralama", type: "text" },
        { header: "Dönem başı", type: "date" },
        { header: "Dönem sonu", type: "date" },
        { header: "Tutar", type: "money", width: 16 },
        { header: "Yöntem", type: "text" },
        { header: "Durum", type: "text" },
        { header: "Açıklama", type: "text", width: 30 },
      ],
      rows: data.payments
        .filter((p) => inRange(p.date))
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((p) => [
          p.code,
          p.date,
          plate.get(p.vehicleId) ?? "",
          name.get(p.driverId) ?? "",
          data.rentals.find((r) => r.id === p.rentalId)?.code ?? "",
          p.periodStart,
          p.periodEnd,
          p.amount,
          LABELS.method[p.method],
          p.voided ? `İptal: ${p.voidReason ?? ""}` : "Geçerli",
          p.note,
        ]),
    },
    {
      name: "Giderler",
      columns: [
        { header: "Kod", type: "text" },
        { header: "Tarih", type: "date" },
        { header: "Plaka", type: "text" },
        { header: "Kategori", type: "text" },
        { header: "Açıklama", type: "text", width: 30 },
        { header: "Tutar", type: "money", width: 16 },
        { header: "Yöntem", type: "text" },
        { header: "Fatura/Fiş", type: "text" },
        { header: "Durum", type: "text" },
      ],
      rows: data.expenses
        .filter((e) => inRange(e.date))
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((e) => [
          e.code,
          e.date,
          e.vehicleId ? plate.get(e.vehicleId) ?? "" : "Genel",
          e.category,
          e.description,
          e.amount,
          LABELS.method[e.method],
          e.invoice,
          e.voided ? `İptal: ${e.voidReason ?? ""}` : "Geçerli",
        ]),
    },
    {
      name: "Araç kârlılığı",
      columns: [
        { header: "Plaka", type: "text" },
        { header: "Araç", type: "text", width: 22 },
        { header: "Gelir", type: "money", width: 16 },
        { header: "Gider", type: "money", width: 16 },
        { header: "Net", type: "money", width: 16 },
      ],
      rows: report.byVehicle.map((v) => [v.vehicle.plate, `${v.vehicle.brand} ${v.vehicle.model}`, v.income, v.expense, v.net]),
    },
    {
      name: "Sürücü performansı",
      columns: [
        { header: "Sürücü", type: "text", width: 22 },
        { header: "Dönemde ödenen", type: "money", width: 16 },
        { header: "Vadesi gelen taksit", type: "int" },
        { header: "Vadesinde ödenen", type: "int" },
        { header: "Şu an gecikmiş", type: "money", width: 16 },
      ],
      rows: report.byDriver.map((d) => [fullName(d.driver), d.paidInRange, d.installmentsDue, d.paidOnTime, d.overdueNow]),
    },
    {
      name: "Gecikenler",
      columns: [
        { header: "Kiralama", type: "text" },
        { header: "Plaka", type: "text" },
        { header: "Sürücü", type: "text", width: 22 },
        { header: "Gecikmiş tutar", type: "money", width: 16 },
        { header: "Gecikme (gün)", type: "int" },
        { header: "İlk ödenmeyen vade", type: "date" },
      ],
      rows: report.overdue.map((r) => [
        r.rental.code,
        plate.get(r.rental.vehicleId) ?? "",
        name.get(r.rental.driverId) ?? "",
        r.overdue,
        r.overdueDays,
        r.overdueSince,
      ]),
    },
    {
      name: "Kiralamalar",
      columns: [
        { header: "Kod", type: "text" },
        { header: "Plaka", type: "text" },
        { header: "Sürücü", type: "text", width: 22 },
        { header: "Başlangıç", type: "date" },
        { header: "Bitiş", type: "date" },
        { header: "Periyot", type: "text" },
        { header: "Dönem tutarı", type: "money", width: 14 },
        { header: "Gün", type: "int" },
        { header: "Beklenen", type: "money", width: 14 },
        { header: "Tahsil edilen", type: "money", width: 14 },
        { header: "Kalan", type: "money", width: 14 },
        { header: "Gecikmiş", type: "money", width: 14 },
        { header: "Durum", type: "text" },
      ],
      rows: view.rentals.map((r) => [
        r.rental.code,
        plate.get(r.rental.vehicleId) ?? "",
        name.get(r.rental.driverId) ?? "",
        r.rental.startDate,
        r.rental.endDate,
        LABELS.period[r.rental.period],
        r.periodAmount,
        r.totalDays,
        r.expected,
        r.paid,
        r.balance,
        r.overdue,
        LABELS.rentalStatus[r.rental.status],
      ]),
    },
  ];
}
