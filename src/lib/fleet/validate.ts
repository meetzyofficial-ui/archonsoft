/**
 * Archon Fleet — girdi doğrulama.
 *
 * Tarayıcıdan gelen her alan burada temizlenir ve tipine çevrilir. Formdaki
 * kontroller kullanıcıya kolaylık içindir; asıl kural buradadır ve sunucu
 * tarafında çalışır.
 */
import { isISODate } from "./calc";
import {
  DRIVER_STATUSES,
  EXPENSE_CATEGORIES,
  ODOMETER_KINDS,
  PAYMENT_METHODS,
  PAYMENT_TIMINGS,
  PERIODS,
  VEHICLE_MANUAL_STATUSES,
  type ISODate,
  type Kurus,
} from "./types";

export type Errors = Record<string, string>;
export type Result<T> = { ok: true; value: T } | { ok: false; errors: Errors };

type Input = Record<string, unknown>;

export class Reader {
  readonly errors: Errors = {};
  private readonly input: Input;
  constructor(input: Input) {
    this.input = input;
  }

  private raw(key: string): unknown {
    return this.input[key];
  }

  text(key: string, label: string, opts: { required?: boolean; max?: number } = {}): string {
    const v = this.raw(key);
    const s = typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
    const max = opts.max ?? 200;
    if (opts.required && !s) this.errors[key] = `${label} zorunlu.`;
    else if (s.length > max) this.errors[key] = `${label} en fazla ${max} karakter olabilir.`;
    // Kontrol karakterlerini at.
    return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, max);
  }

  date(key: string, label: string, opts: { required?: boolean } = {}): ISODate | null {
    const v = this.raw(key);
    if (v === undefined || v === null || v === "") {
      if (opts.required) this.errors[key] = `${label} zorunlu.`;
      return null;
    }
    const s = String(v).trim();
    const tr = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s);
    const iso = tr ? `${tr[3]}-${tr[2]!.padStart(2, "0")}-${tr[1]!.padStart(2, "0")}` : s;
    if (!isISODate(iso) || iso < "2000-01-01" || iso > "2100-12-31") {
      this.errors[key] = `${label} geçerli bir tarih değil.`;
      return null;
    }
    return iso;
  }

  /** Para: "6500", "6.500", "6.500,50", "6500.5", 6500 → kuruş. */
  money(key: string, label: string, opts: { required?: boolean; allowNegative?: boolean; allowZero?: boolean } = {}): Kurus | null {
    const v = this.raw(key);
    if (v === undefined || v === null || v === "") {
      if (opts.required) this.errors[key] = `${label} zorunlu.`;
      return null;
    }
    const parsed = parseMoney(v);
    if (parsed === null) {
      this.errors[key] = `${label} geçerli bir tutar değil.`;
      return null;
    }
    if (!opts.allowNegative && parsed < 0) this.errors[key] = `${label} negatif olamaz.`;
    else if (opts.allowZero === false && parsed === 0) this.errors[key] = `${label} sıfır olamaz.`;
    else if (Math.abs(parsed) > 100_000_000_00) this.errors[key] = `${label} çok büyük.`;
    return parsed;
  }

  int(key: string, label: string, opts: { required?: boolean; min?: number; max?: number } = {}): number | null {
    const v = this.raw(key);
    if (v === undefined || v === null || v === "") {
      if (opts.required) this.errors[key] = `${label} zorunlu.`;
      return null;
    }
    const s = typeof v === "number" ? String(v) : String(v).replace(/[.\s]/g, "");
    if (!/^-?\d+$/.test(s)) {
      this.errors[key] = `${label} tam sayı olmalı.`;
      return null;
    }
    const n = Number(s);
    if (opts.min !== undefined && n < opts.min) this.errors[key] = `${label} en az ${opts.min} olmalı.`;
    if (opts.max !== undefined && n > opts.max) this.errors[key] = `${label} en fazla ${opts.max} olabilir.`;
    return n;
  }

  oneOf<T extends string>(key: string, label: string, options: readonly T[], fallback?: T): T {
    const v = this.raw(key);
    if ((v === undefined || v === "" || v === null) && fallback !== undefined) return fallback;
    if (typeof v === "string" && (options as readonly string[]).includes(v)) return v as T;
    this.errors[key] = `${label} için geçerli bir seçim yapın.`;
    return options[0]!;
  }

  bool(key: string): boolean {
    const v = this.raw(key);
    return v === true || v === "true" || v === "on" || v === "1";
  }

  result<T>(value: T): Result<T> {
    return Object.keys(this.errors).length ? { ok: false, errors: this.errors } : { ok: true, value };
  }
}

export function parseMoney(v: unknown): Kurus | null {
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v * 100) : null;
  if (typeof v !== "string") return null;
  let s = v.replace(/[\s₺]|TL/gi, "");
  if (!s) return null;
  const negative = s.startsWith("-");
  if (negative) s = s.slice(1);
  if (s.includes(",")) {
    // Türkçe: nokta binlik, virgül ondalık.
    s = s.replace(/\./g, "").replace(",", ".");
  } else if ((s.match(/\./g) ?? []).length > 1 || /^\d{1,3}\.\d{3}$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Math.round(Number(s) * 100);
  return negative ? -n : n;
}

export function normalizePlate(v: string): string {
  return v
    .toLocaleUpperCase("tr-TR")
    .replace(/[^0-9A-ZÇĞİÖŞÜ]/g, "")
    .replace(/^(\d{2})([A-ZÇĞİÖŞÜ]{1,3})(\d{2,5})$/, "$1 $2 $3");
}

/** T.C. kimlik numarası algoritma kontrolü. */
export function isValidNationalId(id: string): boolean {
  if (!/^[1-9]\d{10}$/.test(id)) return false;
  const d = id.split("").map(Number);
  const odd = d[0]! + d[2]! + d[4]! + d[6]! + d[8]!;
  const even = d[1]! + d[3]! + d[5]! + d[7]!;
  const tenth = (((odd * 7 - even) % 10) + 10) % 10;
  if (tenth !== d[9]) return false;
  const eleventh = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  return eleventh === d[10];
}

export function normalizePhone(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("90")) return `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith("5")) return `0${digits}`;
  return digits;
}

/* ------------------------------------------------------------------ */

export function readVehicle(input: Input) {
  const r = new Reader(input);
  const plateRaw = r.text("plate", "Plaka", { required: true, max: 16 });
  const plate = normalizePlate(plateRaw);
  if (plateRaw && !/^\d{2} [A-ZÇĞİÖŞÜ]{1,3} \d{2,5}$/.test(plate)) r.errors.plate = "Plaka biçimi geçersiz (ör. 06 ABC 123).";
  const value = {
    plate,
    brand: r.text("brand", "Marka", { required: true, max: 40 }),
    model: r.text("model", "Model", { required: true, max: 40 }),
    year: r.int("year", "Model yılı", { min: 1980, max: 2100 }),
    initialKm: r.int("initialKm", "Başlangıç km", { min: 0, max: 3_000_000 }) ?? 0,
    dailyRate: r.money("dailyRate", "Günlük kira", { required: true }) ?? 0,
    weeklyRate: r.money("weeklyRate", "Haftalık kira") ?? 0,
    monthlyRate: r.money("monthlyRate", "Aylık kira") ?? 0,
    manualStatus: r.oneOf("manualStatus", "Durum", VEHICLE_MANUAL_STATUSES, "available"),
    insuranceEnd: r.date("insuranceEnd", "Sigorta bitiş"),
    kaskoEnd: r.date("kaskoEnd", "Kasko bitiş"),
    inspectionDate: r.date("inspectionDate", "Muayene tarihi"),
    documents: r.text("documents", "Belgeler", { max: 1000 }),
    notes: r.text("notes", "Notlar", { max: 1000 }),
  };
  return r.result(value);
}

export function readDriver(input: Input) {
  const r = new Reader(input);
  const nationalId = r.text("nationalId", "TC kimlik no", { required: true, max: 20 }).replace(/\D/g, "");
  if (nationalId && !isValidNationalId(nationalId)) r.errors.nationalId = "TC kimlik numarası geçersiz.";
  const phone = normalizePhone(r.text("phone", "Telefon", { required: true, max: 20 }));
  if (phone && !/^0\d{10}$/.test(phone)) r.errors.phone = "Telefon 0 ile başlayan 11 hane olmalı (ör. 0532 123 45 67).";
  const value = {
    firstName: r.text("firstName", "Ad", { required: true, max: 40 }),
    lastName: r.text("lastName", "Soyad", { required: true, max: 40 }),
    nationalId,
    phone,
    licenseInfo: r.text("licenseInfo", "Ehliyet bilgileri", { max: 100 }),
    licenseDate: r.date("licenseDate", "Ehliyet tarihi"),
    status: r.oneOf("status", "Sürücü durumu", DRIVER_STATUSES, "active"),
    notes: r.text("notes", "Açıklama", { max: 1000 }),
  };
  return r.result(value);
}

export function readRental(input: Input) {
  const r = new Reader(input);
  const value = {
    vehicleId: r.text("vehicleId", "Araç", { required: true, max: 40 }),
    driverId: r.text("driverId", "Sürücü", { required: true, max: 40 }),
    startDate: r.date("startDate", "Başlangıç tarihi", { required: true }) ?? "",
    endDate: r.date("endDate", "Bitiş tarihi"),
    period: r.oneOf("period", "Ödeme periyodu", PERIODS, "weekly"),
    dailyRate: r.money("dailyRate", "Günlük ücret", { required: true, allowZero: false }) ?? 0,
    weeklyRate: r.money("weeklyRate", "Haftalık ödeme"),
    monthlyRate: r.money("monthlyRate", "Aylık ödeme"),
    deposit: r.money("deposit", "Depozito") ?? 0,
    notes: r.text("notes", "Not", { max: 1000 }),
  };
  if (value.startDate && value.endDate && value.endDate < value.startDate) r.errors.endDate = "Bitiş, başlangıçtan önce olamaz.";
  return r.result(value);
}

export function readPayment(input: Input) {
  const r = new Reader(input);
  const value = {
    date: r.date("date", "Tahsilat tarihi", { required: true }) ?? "",
    rentalId: r.text("rentalId", "Kiralama", { required: true, max: 40 }),
    periodStart: r.date("periodStart", "Dönem başlangıcı"),
    periodEnd: r.date("periodEnd", "Dönem bitişi"),
    amount: r.money("amount", "Tutar", { required: true, allowZero: false }) ?? 0,
    method: r.oneOf("method", "Ödeme yöntemi", PAYMENT_METHODS, "cash"),
    note: r.text("note", "Açıklama", { max: 500 }),
  };
  if (value.periodStart && value.periodEnd && value.periodEnd < value.periodStart) r.errors.periodEnd = "Dönem bitişi başlangıçtan önce olamaz.";
  return r.result(value);
}

export function readExpense(input: Input) {
  const r = new Reader(input);
  const vehicleId = r.text("vehicleId", "Araç", { max: 40 });
  const value = {
    date: r.date("date", "Tarih", { required: true }) ?? "",
    vehicleId: vehicleId || null,
    category: r.oneOf("category", "Kategori", EXPENSE_CATEGORIES),
    description: r.text("description", "Açıklama", { required: true, max: 200 }),
    amount: r.money("amount", "Tutar", { required: true, allowZero: false }) ?? 0,
    method: r.oneOf("method", "Ödeme yöntemi", PAYMENT_METHODS, "cash"),
    invoice: r.text("invoice", "Fatura/fiş", { max: 100 }),
    note: r.text("note", "Not", { max: 500 }),
  };
  return r.result(value);
}

export function readOdometer(input: Input) {
  const r = new Reader(input);
  const value = {
    date: r.date("date", "Tarih", { required: true }) ?? "",
    vehicleId: r.text("vehicleId", "Araç", { required: true, max: 40 }),
    km: r.int("km", "Kilometre", { required: true, min: 0, max: 3_000_000 }) ?? 0,
    kind: r.oneOf("kind", "İşlem türü", ODOMETER_KINDS, "reading"),
    work: r.text("work", "Yapılan işlem", { max: 200 }),
    cost: r.money("cost", "Masraf") ?? 0,
    nextServiceKm: r.int("nextServiceKm", "Sonraki bakım km", { min: 0, max: 3_000_000 }),
    note: r.text("note", "Açıklama", { max: 500 }),
  };
  if (value.nextServiceKm !== null && value.nextServiceKm <= value.km) r.errors.nextServiceKm = "Sonraki bakım km, mevcut km'den büyük olmalı.";
  return r.result(value);
}

export function readAdjustment(input: Input) {
  const r = new Reader(input);
  const value = {
    date: r.date("date", "Tarih", { required: true }) ?? "",
    amount: r.money("amount", "Tutar", { required: true, allowNegative: true, allowZero: false }) ?? 0,
    reason: r.text("reason", "Gerekçe", { required: true, max: 200 }),
  };
  return r.result(value);
}

export function readSettings(input: Input) {
  const r = new Reader(input);
  const value = {
    openingBalance: r.money("openingBalance", "Başlangıç bakiyesi", { required: true, allowNegative: true }) ?? 0,
    openingDate: r.date("openingDate", "Başlangıç tarihi", { required: true }) ?? "",
    serviceIntervalKm: r.int("serviceIntervalKm", "Bakım aralığı", { required: true, min: 500, max: 100_000 }) ?? 10000,
    serviceWarnKm: r.int("serviceWarnKm", "Bakım uyarı eşiği", { required: true, min: 0, max: 50_000 }) ?? 1000,
    documentWarnDays: r.int("documentWarnDays", "Belge uyarı süresi", { required: true, min: 0, max: 365 }) ?? 30,
    dueSoonDays: r.int("dueSoonDays", "Ödeme uyarı süresi", { required: true, min: 0, max: 30 }) ?? 2,
    paymentTiming: r.oneOf("paymentTiming", "Kira ödeme zamanı", PAYMENT_TIMINGS, "advance"),
  };
  return r.result(value);
}

export function readReason(input: Input, key = "reason"): Result<string> {
  const r = new Reader(input);
  const reason = r.text(key, "Gerekçe", { required: true, max: 200 });
  if (reason && reason.length < 3) r.errors[key] = "Gerekçe en az 3 karakter olmalı.";
  return r.result(reason);
}
