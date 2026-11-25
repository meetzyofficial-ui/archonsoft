/**
 * Archon Fleet — veri modeli.
 *
 * Tutarlar her yerde kuruş cinsinden tam sayıdır (6.500,00 ₺ = 650000), böylece
 * toplamlar kayan nokta hatası biriktirmez. Tarihler "YYYY-MM-DD" metnidir ve
 * İstanbul takvim günü olarak okunur; saat dilimi kaymasıyla bir gün oynamaz.
 *
 * Finansal kayıtlar (tahsilat, gider, düzeltme) hiçbir zaman silinmez: iptal
 * edilir (`voided`) ve gerekçesi saklanır. Araç ve sürücü de silinmez, pasife
 * alınır — geçmiş kiralamalar ve ödemeler bağlı oldukları kaydı her zaman bulur.
 */

export type ISODate = string;
export type Kurus = number;

export const PERIODS = ["daily", "weekly", "monthly"] as const;
export type Period = (typeof PERIODS)[number];

export const VEHICLE_MANUAL_STATUSES = ["available", "maintenance", "passive"] as const;
export type VehicleManualStatus = (typeof VEHICLE_MANUAL_STATUSES)[number];
/** Görünen durum: aktif kiralaması olan araç her zaman "rented". */
export type VehicleStatus = VehicleManualStatus | "rented";

export const DRIVER_STATUSES = ["active", "passive", "blacklist"] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

export const RENTAL_STATUSES = ["active", "completed", "cancelled"] as const;
export type RentalStatus = (typeof RENTAL_STATUSES)[number];

export const PAYMENT_METHODS = ["cash", "transfer", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const EXPENSE_CATEGORIES = [
  "Bakım",
  "Tamir",
  "Yağ",
  "Lastik",
  "Sigorta",
  "Kasko",
  "MTV",
  "Muayene",
  "Trafik cezası",
  "Temizlik",
  "Diğer",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const ODOMETER_KINDS = ["reading", "service", "oil", "repair", "tire", "inspection", "other"] as const;
export type OdometerKind = (typeof ODOMETER_KINDS)[number];

export const PAYMENT_TIMINGS = ["advance", "arrears"] as const;
export type PaymentTiming = (typeof PAYMENT_TIMINGS)[number];

export interface Vehicle {
  id: string;
  code: string;
  plate: string;
  brand: string;
  model: string;
  year: number | null;
  initialKm: number;
  dailyRate: Kurus;
  weeklyRate: Kurus;
  monthlyRate: Kurus;
  manualStatus: VehicleManualStatus;
  insuranceEnd: ISODate | null;
  kaskoEnd: ISODate | null;
  inspectionDate: ISODate | null;
  documents: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  /** TC kimlik no — yalnızca sürücü detayında açık gösterilir, listelerde maskelenir. */
  nationalId: string;
  phone: string;
  licenseInfo: string;
  licenseDate: ISODate | null;
  status: DriverStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rental {
  id: string;
  code: string;
  vehicleId: string;
  driverId: string;
  startDate: ISODate;
  /** null = açık uçlu, devam eden kiralama. */
  endDate: ISODate | null;
  period: Period;
  dailyRate: Kurus;
  /** null = günlük × 7 */
  weeklyRate: Kurus | null;
  /** null = günlük × 30 */
  monthlyRate: Kurus | null;
  deposit: Kurus;
  status: RentalStatus;
  notes: string;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  code: string;
  date: ISODate;
  rentalId: string;
  /** Kayıt anında kiralamadan kopyalanır; kiralama değişse de tahsilatın kime ait olduğu bozulmaz. */
  vehicleId: string;
  driverId: string;
  periodStart: ISODate | null;
  periodEnd: ISODate | null;
  amount: Kurus;
  method: PaymentMethod;
  note: string;
  voided: boolean;
  voidReason: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  code: string;
  date: ISODate;
  /** null = genel gider (araçla ilişkisiz). */
  vehicleId: string | null;
  category: ExpenseCategory;
  description: string;
  amount: Kurus;
  method: PaymentMethod;
  invoice: string;
  note: string;
  voided: boolean;
  voidReason: string | null;
  createdAt: string;
}

export interface OdometerEntry {
  id: string;
  date: ISODate;
  vehicleId: string;
  km: number;
  kind: OdometerKind;
  work: string;
  /** Bilgi amaçlı. Kasadan düşmesi için ayrıca gider girilir. */
  cost: Kurus;
  nextServiceKm: number | null;
  note: string;
  createdAt: string;
}

/** Kasa düzeltmesi: sayım farkı, depozito girişi vb. İşaretli tutar (+/−). */
export interface Adjustment {
  id: string;
  code: string;
  date: ISODate;
  amount: Kurus;
  reason: string;
  voided: boolean;
  voidReason: string | null;
  createdAt: string;
}

export interface Settings {
  openingBalance: Kurus;
  openingDate: ISODate;
  serviceIntervalKm: number;
  serviceWarnKm: number;
  documentWarnDays: number;
  dueSoonDays: number;
  paymentTiming: PaymentTiming;
}

export interface AuditEntry {
  id: string;
  at: string;
  op: string;
  entity: string;
  entityId: string;
  /** Kişisel veri (TC, telefon) asla buraya yazılmaz. */
  summary: string;
}

export interface FleetData {
  vehicles: Vehicle[];
  drivers: Driver[];
  rentals: Rental[];
  payments: Payment[];
  expenses: Expense[];
  odometer: OdometerEntry[];
  adjustments: Adjustment[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  openingBalance: 0,
  openingDate: "2026-01-01",
  serviceIntervalKm: 10000,
  serviceWarnKm: 1000,
  documentWarnDays: 30,
  dueSoonDays: 2,
  paymentTiming: "advance",
};

export const LABELS = {
  period: { daily: "Günlük", weekly: "Haftalık", monthly: "Aylık" } satisfies Record<Period, string>,
  vehicleStatus: {
    available: "Boşta",
    maintenance: "Bakımda",
    passive: "Pasif",
    rented: "Kirada",
  } satisfies Record<VehicleStatus, string>,
  driverStatus: { active: "Aktif", passive: "Pasif", blacklist: "Kara liste" } satisfies Record<DriverStatus, string>,
  rentalStatus: { active: "Aktif", completed: "Tamamlandı", cancelled: "İptal" } satisfies Record<RentalStatus, string>,
  method: { cash: "Nakit", transfer: "Havale/EFT", other: "Diğer" } satisfies Record<PaymentMethod, string>,
  odometer: {
    reading: "Km okuma",
    service: "Bakım",
    oil: "Yağ",
    repair: "Tamir",
    tire: "Lastik",
    inspection: "Muayene",
    other: "Diğer",
  } satisfies Record<OdometerKind, string>,
  timing: { advance: "Peşin (dönem başında)", arrears: "Dönem sonunda" } satisfies Record<PaymentTiming, string>,
};
