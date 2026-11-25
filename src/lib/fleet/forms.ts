/**
 * Form alanları. Sunucu, seçenekleri (araçlar, sürücüler, kiralamalar) güncel
 * verilerden doldurup forma verir.
 */
import type { Field, Option } from "@/components/fleet/client";
import { fullName, type FleetView } from "./calc";
import {
  DRIVER_STATUSES,
  EXPENSE_CATEGORIES,
  LABELS,
  ODOMETER_KINDS,
  PAYMENT_METHODS,
  PAYMENT_TIMINGS,
  PERIODS,
  VEHICLE_MANUAL_STATUSES,
  type Driver,
  type FleetData,
  type Kurus,
  type Settings,
  type Vehicle,
} from "./types";

export const moneyInput = (k: Kurus | null | undefined) => (k === null || k === undefined ? "" : (k / 100).toFixed(2).replace(".", ","));

const opts = <T extends string>(values: readonly T[], labels: Record<T, string>): Option[] => values.map((v) => ({ value: v, label: labels[v] }));

const methodOptions = opts(PAYMENT_METHODS, LABELS.method);

export function vehicleOptions(data: FleetData, includePassive = false): Option[] {
  return data.vehicles
    .filter((v) => includePassive || v.manualStatus !== "passive")
    .sort((a, b) => a.plate.localeCompare(b.plate, "tr"))
    .map((v) => ({ value: v.id, label: `${v.plate} · ${v.brand} ${v.model}` }));
}

export function driverOptions(data: FleetData): Option[] {
  return data.drivers
    .filter((d) => d.status === "active")
    .sort((a, b) => fullName(a).localeCompare(fullName(b), "tr"))
    .map((d) => ({ value: d.id, label: fullName(d) }));
}

export function rentalOptions(data: FleetData, view: FleetView): Option[] {
  const plate = new Map(data.vehicles.map((v) => [v.id, v.plate]));
  const name = new Map(data.drivers.map((d) => [d.id, fullName(d)]));
  return view.rentals
    .filter((r) => r.rental.status !== "cancelled")
    .sort((a, b) => (a.rental.status === b.rental.status ? b.rental.startDate.localeCompare(a.rental.startDate) : a.rental.status === "active" ? -1 : 1))
    .map((r) => ({
      value: r.rental.id,
      label: `${r.rental.code} · ${plate.get(r.rental.vehicleId) ?? "?"} · ${name.get(r.rental.driverId) ?? "?"}${r.rental.status === "active" ? "" : " (bitti)"}`,
    }));
}

export const vehicleFields = (): Field[] => [
  { name: "plate", label: "Plaka", type: "text", required: true, placeholder: "06 ABC 123" },
  { name: "brand", label: "Marka", type: "text", required: true },
  { name: "model", label: "Model", type: "text", required: true },
  { name: "year", label: "Model yılı", type: "int" },
  { name: "initialKm", label: "Kilometre (eklerken)", type: "int", hint: "Sonraki km'ler Bakım ve Km'den gelir." },
  { name: "manualStatus", label: "Durum", type: "select", options: opts(VEHICLE_MANUAL_STATUSES, LABELS.vehicleStatus), required: true, hint: "Aktif kiralaması olan araç otomatik 'Kirada' görünür." },
  { name: "dailyRate", label: "Günlük kira", type: "money", required: true },
  { name: "weeklyRate", label: "Haftalık kira", type: "money" },
  { name: "monthlyRate", label: "Aylık kira", type: "money" },
  { name: "insuranceEnd", label: "Sigorta bitiş", type: "date" },
  { name: "kaskoEnd", label: "Kasko bitiş", type: "date" },
  { name: "inspectionDate", label: "Muayene tarihi", type: "date" },
  { name: "documents", label: "Belgeler", type: "textarea", full: true, hint: "Ruhsat seri no, poliçe numaraları, belgelerin nerede olduğu…" },
  { name: "notes", label: "Notlar", type: "textarea", full: true },
];

export const vehicleInitial = (v?: Vehicle): Record<string, string> =>
  v
    ? {
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        year: v.year ? String(v.year) : "",
        initialKm: String(v.initialKm),
        manualStatus: v.manualStatus,
        dailyRate: moneyInput(v.dailyRate),
        weeklyRate: moneyInput(v.weeklyRate || null),
        monthlyRate: moneyInput(v.monthlyRate || null),
        insuranceEnd: v.insuranceEnd ?? "",
        kaskoEnd: v.kaskoEnd ?? "",
        inspectionDate: v.inspectionDate ?? "",
        documents: v.documents,
        notes: v.notes,
      }
    : { manualStatus: "available" };

export const driverFields = (): Field[] => [
  { name: "firstName", label: "Ad", type: "text", required: true },
  { name: "lastName", label: "Soyad", type: "text", required: true },
  { name: "nationalId", label: "TC kimlik no", type: "int", required: true, hint: "11 hane, algoritmayla kontrol edilir." },
  { name: "phone", label: "Telefon", type: "tel", required: true, placeholder: "0532 123 45 67" },
  { name: "licenseInfo", label: "Ehliyet bilgileri", type: "text", placeholder: "Sınıf, belge no" },
  { name: "licenseDate", label: "Ehliyet tarihi", type: "date" },
  { name: "status", label: "Sürücü durumu", type: "select", options: opts(DRIVER_STATUSES, LABELS.driverStatus), required: true },
  { name: "notes", label: "Açıklama", type: "textarea", full: true },
];

export const driverInitial = (d?: Driver): Record<string, string> =>
  d
    ? {
        firstName: d.firstName,
        lastName: d.lastName,
        nationalId: d.nationalId,
        phone: d.phone,
        licenseInfo: d.licenseInfo,
        licenseDate: d.licenseDate ?? "",
        status: d.status,
        notes: d.notes,
      }
    : { status: "active" };

export const rentalFields = (data: FleetData): Field[] => [
  { name: "vehicleId", label: "Araç", type: "select", options: vehicleOptions(data), required: true },
  { name: "driverId", label: "Sürücü", type: "select", options: driverOptions(data), required: true, hint: "Yalnızca aktif sürücüler." },
  { name: "startDate", label: "Başlangıç tarihi", type: "date", required: true },
  { name: "endDate", label: "Bitiş tarihi", type: "date", hint: "Boş = devam ediyor (açık uçlu)." },
  { name: "period", label: "Ödeme periyodu", type: "select", options: opts(PERIODS, LABELS.period), required: true },
  { name: "dailyRate", label: "Günlük ücret", type: "money", required: true },
  { name: "weeklyRate", label: "Haftalık ödeme", type: "money", hint: "Boşsa günlük × 7." },
  { name: "monthlyRate", label: "Aylık ödeme", type: "money", hint: "Boşsa günlük × 30." },
  { name: "deposit", label: "Depozito", type: "money", hint: "Kasaya gelir olarak yazılmaz." },
  { name: "notes", label: "Not", type: "textarea", full: true },
];

export const paymentFields = (data: FleetData, view: FleetView): Field[] => [
  { name: "rentalId", label: "Kiralama", type: "select", options: rentalOptions(data, view), required: true, full: true, hint: "Araç ve sürücü kiralamadan otomatik alınır." },
  { name: "date", label: "Tahsilat tarihi", type: "date", required: true },
  { name: "amount", label: "Tutar", type: "money", required: true },
  { name: "method", label: "Ödeme yöntemi", type: "select", options: methodOptions, required: true },
  { name: "periodStart", label: "Ödeme dönemi başlangıcı", type: "date" },
  { name: "periodEnd", label: "Ödeme dönemi bitişi", type: "date" },
  { name: "note", label: "Açıklama", type: "textarea", full: true },
];

export const expenseFields = (data: FleetData): Field[] => [
  { name: "date", label: "Tarih", type: "date", required: true },
  { name: "vehicleId", label: "Araç", type: "select", options: vehicleOptions(data, true), emptyLabel: "Genel gider (araçsız)" },
  { name: "category", label: "Kategori", type: "select", options: EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })), required: true },
  { name: "amount", label: "Tutar", type: "money", required: true },
  { name: "description", label: "Açıklama", type: "text", required: true, full: true },
  { name: "method", label: "Ödeme yöntemi", type: "select", options: methodOptions, required: true },
  { name: "invoice", label: "Fatura/fiş bilgisi", type: "text" },
  { name: "note", label: "Not", type: "textarea", full: true },
];

export const odometerFields = (data: FleetData): Field[] => [
  { name: "vehicleId", label: "Araç", type: "select", options: vehicleOptions(data, true), required: true },
  { name: "date", label: "Tarih", type: "date", required: true },
  { name: "km", label: "Kilometre", type: "int", required: true },
  { name: "kind", label: "İşlem türü", type: "select", options: opts(ODOMETER_KINDS, LABELS.odometer), required: true, hint: "'Bakım' seçilen kayıt son bakımı belirler." },
  { name: "work", label: "Yapılan işlem", type: "text", full: true },
  { name: "cost", label: "Masraf (bilgi)", type: "money", hint: "Kasadan düşmesi için Giderler'e de girin." },
  { name: "nextServiceKm", label: "Sonraki bakım km", type: "int", hint: "Boşsa son bakım + Ayarlar'daki aralık." },
  { name: "note", label: "Açıklama", type: "textarea", full: true },
];

export const adjustmentFields = (): Field[] => [
  { name: "date", label: "Tarih", type: "date", required: true },
  { name: "amount", label: "Tutar (±)", type: "money", required: true, hint: "Kasadan eksiltmek için başına − koyun (ör. -250)." },
  { name: "reason", label: "Gerekçe", type: "text", required: true, full: true, placeholder: "Sayım farkı, depozito girişi…" },
];

export const settingsFields = (): Field[] => [
  { name: "openingBalance", label: "Başlangıç kasa bakiyesi", type: "money", required: true, hint: "Sisteme başladığınız gün elinizdeki para." },
  { name: "openingDate", label: "Başlangıç tarihi", type: "date", required: true },
  { name: "paymentTiming", label: "Kira ödeme zamanı", type: "select", options: opts(PAYMENT_TIMINGS, LABELS.timing), required: true, hint: "Peşin: her dönemin kirası dönem başında borç olur." },
  { name: "dueSoonDays", label: "Ödeme yaklaşıyor uyarısı (gün)", type: "int", required: true },
  { name: "serviceIntervalKm", label: "Standart bakım aralığı (km)", type: "int", required: true },
  { name: "serviceWarnKm", label: "Bakım uyarı eşiği (km kala)", type: "int", required: true },
  { name: "documentWarnDays", label: "Sigorta/kasko/muayene uyarısı (gün)", type: "int", required: true },
];

export const settingsInitial = (s: Settings): Record<string, string> => ({
  openingBalance: moneyInput(s.openingBalance),
  openingDate: s.openingDate,
  paymentTiming: s.paymentTiming,
  dueSoonDays: String(s.dueSoonDays),
  serviceIntervalKm: String(s.serviceIntervalKm),
  serviceWarnKm: String(s.serviceWarnKm),
  documentWarnDays: String(s.documentWarnDays),
});

export const reasonField = (label = "Gerekçe"): Field[] => [{ name: "reason", label, type: "text", required: true, full: true }];
