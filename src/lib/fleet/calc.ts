/**
 * Archon Fleet — bütün finansal hesaplar burada, tek yerde.
 *
 * Hiçbir ekran kasa, borç ya da kâr hesaplamaz; hepsi bu dosyadaki
 * fonksiyonların çıktısını gösterir. Fonksiyonlar saftır: aynı veri ve aynı
 * "bugün" için her zaman aynı sonucu verir — testler de bu yüzden mümkün.
 *
 * Ödeme planı (taksitler) kiralamadan HESAPLANIR, saklanmaz. Gerçek tahsilatlar
 * ayrı kayıtlardır ve taksitlere en eskiden başlayarak dağıtılır. Böylece plan
 * ile tahsilat hiçbir zaman birbirine karışmaz.
 */
import type {
  Driver,
  FleetData,
  ISODate,
  Kurus,
  OdometerEntry,
  Payment,
  Period,
  Rental,
  Settings,
  Vehicle,
  VehicleStatus,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Tarih                                                              */
/* ------------------------------------------------------------------ */

const DAY_MS = 86_400_000;

export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function dayNum(date: ISODate): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function fromDayNum(n: number): ISODate {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

export const addDays = (date: ISODate, days: number): ISODate => fromDayNum(dayNum(date) + days);
export const diffDays = (later: ISODate, earlier: ISODate): number => dayNum(later) - dayNum(earlier);

/** İstanbul'daki bugünün tarihi (sunucu hangi saat diliminde olursa olsun). */
export function istanbulToday(now: Date = new Date()): ISODate {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export const monthStart = (date: ISODate): ISODate => `${date.slice(0, 7)}-01`;

export function monthEnd(date: ISODate): ISODate {
  const [y, m] = date.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

export function addMonths(date: ISODate, months: number): ISODate {
  const [y, m] = date.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return d.toISOString().slice(0, 10);
}

/** Pazartesi başlangıçlı hafta. */
export function weekStart(date: ISODate): ISODate {
  const n = dayNum(date);
  const weekday = (new Date(n * DAY_MS).getUTCDay() + 6) % 7;
  return fromDayNum(n - weekday);
}

export const inRange = (date: ISODate, from: ISODate, to: ISODate) => date >= from && date <= to;

/* ------------------------------------------------------------------ */
/*  Kiralama: ödeme planı ve özet                                       */
/* ------------------------------------------------------------------ */

export const PERIOD_DAYS: Record<Period, number> = { daily: 1, weekly: 7, monthly: 30 };

export function periodAmount(rental: Pick<Rental, "period" | "dailyRate" | "weeklyRate" | "monthlyRate">): Kurus {
  if (rental.period === "monthly") return rental.monthlyRate ?? rental.dailyRate * 30;
  if (rental.period === "weekly") return rental.weeklyRate ?? rental.dailyRate * 7;
  return rental.dailyRate;
}

export type InstallmentStatus = "paid" | "overdue" | "due-soon" | "upcoming";

export interface Installment {
  index: number;
  start: ISODate;
  end: ISODate;
  days: number;
  amount: Kurus;
  dueDate: ISODate;
  paid: Kurus;
  status: InstallmentStatus;
}

/** Açık uçlu kiralamalarda bugünden sonra kaç dönem planlansın. */
const OPEN_HORIZON_PERIODS = 4;
const MAX_INSTALLMENTS = 4000;

/**
 * Taksitler. Bitişi olan kiralamada son dönem kısa kalırsa tutar gün oranında
 * hesaplanır (10 günlük haftalık kiralama = 1 hafta + 3/7 hafta).
 * Peşin ödemede vade dönemin ilk günü, dönem sonunda ödemede bitişin ertesi günü.
 */
export function buildSchedule(
  rental: Rental,
  payments: Payment[],
  today: ISODate,
  settings: Pick<Settings, "paymentTiming" | "dueSoonDays">,
): Installment[] {
  if (rental.status === "cancelled") return [];
  const len = PERIOD_DAYS[rental.period];
  const amount = periodAmount(rental);
  const s = dayNum(rental.startDate);
  const e = rental.endDate ? dayNum(rental.endDate) : null;
  const t = dayNum(today);
  const out: Installment[] = [];

  for (let k = 0; k < MAX_INSTALLMENTS; k++) {
    const ps = s + k * len;
    if (e !== null && ps > e) break;
    if (e === null && ps > Math.max(t, s) + OPEN_HORIZON_PERIODS * len) break;
    // Tamamlanmış ama bitişi olmayan kayıt olmaz (servis bitişi yazar); yine de güvenli dur.
    if (e === null && rental.status !== "active" && ps > t) break;
    const pe = e !== null ? Math.min(ps + len - 1, e) : ps + len - 1;
    const days = pe - ps + 1;
    const value = days === len ? amount : Math.round((amount * days) / len);
    const due = settings.paymentTiming === "advance" ? ps : pe + 1;
    out.push({
      index: k + 1,
      start: fromDayNum(ps),
      end: fromDayNum(pe),
      days,
      amount: value,
      dueDate: fromDayNum(due),
      paid: 0,
      status: "upcoming",
    });
  }

  let pool = sumActive(payments.filter((p) => p.rentalId === rental.id));
  for (const inst of out) {
    const take = Math.min(pool, inst.amount);
    inst.paid = take;
    pool -= take;
    const dueIn = dayNum(inst.dueDate) - t;
    if (take >= inst.amount) inst.status = "paid";
    else if (dueIn <= 0) inst.status = "overdue";
    else if (dueIn <= settings.dueSoonDays) inst.status = "due-soon";
    else inst.status = "upcoming";
  }
  return out;
}

export type RentalPaymentState = "cancelled" | "overdue" | "due-soon" | "ok" | "paid-up" | "closed" | "open-balance";

export interface RentalSummary {
  rental: Rental;
  totalDays: number;
  /** Bitişi olan: sözleşmenin tamamı. Açık uçlu: bugüne kadar vadesi gelen. */
  expected: Kurus;
  dueToDate: Kurus;
  paid: Kurus;
  /** expected − paid. Negatif = fazla / ön ödeme. */
  balance: Kurus;
  overdue: Kurus;
  overdueSince: ISODate | null;
  overdueDays: number;
  nextDueDate: ISODate | null;
  nextDueAmount: Kurus;
  periodAmount: Kurus;
  state: RentalPaymentState;
  schedule: Installment[];
}

export function summarizeRental(
  rental: Rental,
  payments: Payment[],
  today: ISODate,
  settings: Pick<Settings, "paymentTiming" | "dueSoonDays">,
): RentalSummary {
  const schedule = buildSchedule(rental, payments, today, settings);
  const t = dayNum(today);
  const paid = sumActive(payments.filter((p) => p.rentalId === rental.id));
  const cancelled = rental.status === "cancelled";
  const end = rental.endDate ? dayNum(rental.endDate) : t;
  const totalDays = cancelled ? 0 : Math.max(0, end - dayNum(rental.startDate) + 1);
  const dueToDate = schedule.filter((i) => dayNum(i.dueDate) <= t).reduce((a, i) => a + i.amount, 0);
  const expected = cancelled ? 0 : rental.endDate ? schedule.reduce((a, i) => a + i.amount, 0) : dueToDate;
  const overdue = Math.max(0, dueToDate - paid);

  const firstUnpaidDue = schedule.find((i) => i.status === "overdue");
  const overdueSince = overdue > 0 && firstUnpaidDue ? firstUnpaidDue.dueDate : null;
  const overdueDays = overdueSince ? t - dayNum(overdueSince) : 0;

  const next =
    rental.status === "active" ? schedule.find((i) => dayNum(i.dueDate) > t && i.status !== "paid") : undefined;
  const balance = expected - paid;

  let state: RentalPaymentState;
  if (cancelled) state = "cancelled";
  else if (overdue > 0) state = "overdue";
  else if (next && next.status === "due-soon") state = "due-soon";
  else if (rental.status === "active") state = next ? "ok" : balance > 0 ? "open-balance" : "paid-up";
  else state = balance > 0 ? "open-balance" : "closed";

  return {
    rental,
    totalDays,
    expected,
    dueToDate,
    paid,
    balance,
    overdue,
    overdueSince,
    overdueDays,
    nextDueDate: next?.dueDate ?? null,
    nextDueAmount: next ? next.amount - next.paid : 0,
    periodAmount: periodAmount(rental),
    state,
    schedule,
  };
}

/** Aynı araçta tarihleri çakışan, iptal edilmemiş başka kiralama var mı? */
export function findOverlap(
  candidate: Pick<Rental, "id" | "vehicleId" | "startDate" | "endDate">,
  rentals: Rental[],
): Rental | null {
  const far = "9999-12-31";
  const cs = candidate.startDate;
  const ce = candidate.endDate ?? far;
  for (const other of rentals) {
    if (other.id === candidate.id || other.vehicleId !== candidate.vehicleId || other.status === "cancelled") continue;
    const os = other.startDate;
    const oe = other.endDate ?? far;
    if (cs <= oe && os <= ce) return other;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Para                                                               */
/* ------------------------------------------------------------------ */

export function sumActive(items: { amount: Kurus; voided?: boolean }[]): Kurus {
  return items.reduce((acc, item) => (item.voided ? acc : acc + item.amount), 0);
}

/* ------------------------------------------------------------------ */
/*  Kasa: tek defter                                                    */
/* ------------------------------------------------------------------ */

export type LedgerKind = "opening" | "payment" | "expense" | "adjustment";

export interface LedgerEntry {
  date: ISODate;
  kind: LedgerKind;
  refId: string;
  code: string;
  description: string;
  /** İşaretli: giriş +, çıkış −. */
  amount: Kurus;
  balance: Kurus;
}

const KIND_ORDER: Record<LedgerKind, number> = { opening: 0, payment: 1, adjustment: 2, expense: 3 };

/**
 * Kasanın tek kaynağı. Güncel kasa = defterin son bakiyesi. Tahsil edilmemiş
 * kira ve depozito deftere girmez; iptal edilen kayıtlar da.
 */
export function buildLedger(data: Pick<FleetData, "payments" | "expenses" | "adjustments" | "settings" | "vehicles" | "drivers">): LedgerEntry[] {
  const plate = new Map(data.vehicles.map((v) => [v.id, v.plate]));
  const name = new Map(data.drivers.map((d) => [d.id, fullName(d)]));
  const rows: (Omit<LedgerEntry, "balance"> & { createdAt: string })[] = [];

  rows.push({
    date: data.settings.openingDate,
    kind: "opening",
    refId: "opening",
    code: "AÇILIŞ",
    description: "Başlangıç bakiyesi",
    amount: data.settings.openingBalance,
    createdAt: "",
  });
  for (const p of data.payments) {
    if (p.voided) continue;
    rows.push({
      date: p.date,
      kind: "payment",
      refId: p.id,
      code: p.code,
      description: `Tahsilat · ${plate.get(p.vehicleId) ?? "?"} · ${name.get(p.driverId) ?? "?"}`,
      amount: p.amount,
      createdAt: p.createdAt,
    });
  }
  for (const e of data.expenses) {
    if (e.voided) continue;
    rows.push({
      date: e.date,
      kind: "expense",
      refId: e.id,
      code: e.code,
      description: `${e.category} · ${e.vehicleId ? plate.get(e.vehicleId) ?? "?" : "Genel"}${e.description ? ` · ${e.description}` : ""}`,
      amount: -e.amount,
      createdAt: e.createdAt,
    });
  }
  for (const a of data.adjustments) {
    if (a.voided) continue;
    rows.push({
      date: a.date,
      kind: "adjustment",
      refId: a.id,
      code: a.code,
      description: `Düzeltme · ${a.reason}`,
      amount: a.amount,
      createdAt: a.createdAt,
    });
  }
  rows.sort(
    (a, b) =>
      a.date.localeCompare(b.date) || KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.createdAt.localeCompare(b.createdAt),
  );
  let balance = 0;
  return rows.map((row) => {
    balance += row.amount;
    return {
      date: row.date,
      kind: row.kind,
      refId: row.refId,
      code: row.code,
      description: row.description,
      amount: row.amount,
      balance,
    };
  });
}

export function cashBalance(ledger: LedgerEntry[]): Kurus {
  return ledger.length ? ledger[ledger.length - 1]!.balance : 0;
}

/* ------------------------------------------------------------------ */
/*  Araç, kilometre, bakım, belgeler                                    */
/* ------------------------------------------------------------------ */

export const fullName = (d: Pick<Driver, "firstName" | "lastName">) => `${d.firstName} ${d.lastName}`.trim();

export function currentKm(vehicle: Vehicle, odometer: OdometerEntry[]): number {
  return odometer
    .filter((o) => o.vehicleId === vehicle.id)
    .reduce((max, o) => Math.max(max, o.km), vehicle.initialKm);
}

/** Bu kayıttan önceki (daha eski tarihli) en yüksek km. */
export function previousMaxKm(vehicle: Vehicle, odometer: OdometerEntry[], date: ISODate, excludeId?: string): number {
  return odometer
    .filter((o) => o.vehicleId === vehicle.id && o.date < date && o.id !== excludeId)
    .reduce((max, o) => Math.max(max, o.km), vehicle.initialKm);
}

export interface ServiceInfo {
  lastServiceDate: ISODate | null;
  lastServiceKm: number | null;
  nextServiceKm: number | null;
  kmLeft: number | null;
}

export function serviceInfo(vehicle: Vehicle, odometer: OdometerEntry[], settings: Pick<Settings, "serviceIntervalKm">): ServiceInfo {
  const own = odometer.filter((o) => o.vehicleId === vehicle.id);
  const services = own.filter((o) => o.kind === "service").sort((a, b) => b.date.localeCompare(a.date) || b.km - a.km);
  const last = services[0];
  const planned = own.reduce((max, o) => Math.max(max, o.nextServiceKm ?? 0), 0);
  const next = planned > 0 ? planned : last ? last.km + settings.serviceIntervalKm : null;
  const km = currentKm(vehicle, odometer);
  return {
    lastServiceDate: last?.date ?? null,
    lastServiceKm: last?.km ?? null,
    nextServiceKm: next,
    kmLeft: next === null ? null : next - km,
  };
}

export interface DocumentAlert {
  type: "Sigorta" | "Kasko" | "Muayene";
  date: ISODate;
  daysLeft: number;
}

export function documentAlerts(vehicle: Vehicle, today: ISODate, warnDays: number): DocumentAlert[] {
  const out: DocumentAlert[] = [];
  const pairs: [DocumentAlert["type"], ISODate | null][] = [
    ["Sigorta", vehicle.insuranceEnd],
    ["Kasko", vehicle.kaskoEnd],
    ["Muayene", vehicle.inspectionDate],
  ];
  for (const [type, date] of pairs) {
    if (!date) continue;
    const left = diffDays(date, today);
    if (left <= warnDays) out.push({ type, date, daysLeft: left });
  }
  return out;
}

export interface OdometerCheck {
  entry: OdometerEntry;
  previousMax: number;
  lowerThanPrevious: boolean;
}

export function checkOdometer(vehicles: Vehicle[], odometer: OdometerEntry[]): OdometerCheck[] {
  const byId = new Map(vehicles.map((v) => [v.id, v]));
  return odometer.map((entry) => {
    const vehicle = byId.get(entry.vehicleId);
    const previousMax = vehicle ? previousMaxKm(vehicle, odometer, entry.date, entry.id) : 0;
    return { entry, previousMax, lowerThanPrevious: entry.km < previousMax };
  });
}

/* ------------------------------------------------------------------ */
/*  Bütün görünüm                                                       */
/* ------------------------------------------------------------------ */

export interface VehicleView {
  vehicle: Vehicle;
  status: VehicleStatus;
  activeRental: RentalSummary | null;
  activeDriver: Driver | null;
  km: number;
  service: ServiceInfo;
  documents: DocumentAlert[];
  income: Kurus;
  expense: Kurus;
  net: Kurus;
  rentals: RentalSummary[];
}

export interface DriverView {
  driver: Driver;
  activeRental: RentalSummary | null;
  activeVehicle: Vehicle | null;
  pastVehicles: Vehicle[];
  totalPaid: Kurus;
  balance: Kurus;
  overdue: Kurus;
  rentals: RentalSummary[];
}

export type AlertKind = "overdue" | "due-soon" | "service" | "document" | "odometer" | "rental-ended";

export interface Alert {
  kind: AlertKind;
  severity: "danger" | "warning";
  title: string;
  detail: string;
  href: string;
}

export interface FleetView {
  today: ISODate;
  rentals: RentalSummary[];
  vehicles: VehicleView[];
  drivers: DriverView[];
  ledger: LedgerEntry[];
  cash: Kurus;
  alerts: Alert[];
  odometerChecks: OdometerCheck[];
}

export function buildView(data: FleetData, today: ISODate): FleetView {
  const { settings } = data;
  const rentals = data.rentals
    .map((r) => summarizeRental(r, data.payments, today, settings))
    .sort((a, b) => b.rental.startDate.localeCompare(a.rental.startDate));
  const vehiclesById = new Map(data.vehicles.map((v) => [v.id, v]));
  const driversById = new Map(data.drivers.map((d) => [d.id, d]));

  const vehicles: VehicleView[] = data.vehicles.map((vehicle) => {
    const own = rentals.filter((r) => r.rental.vehicleId === vehicle.id);
    const active = own.find((r) => r.rental.status === "active" && r.rental.startDate <= today) ?? null;
    const income = sumActive(data.payments.filter((p) => p.vehicleId === vehicle.id));
    const expense = sumActive(data.expenses.filter((e) => e.vehicleId === vehicle.id));
    const status: VehicleStatus = vehicle.manualStatus === "passive" ? "passive" : active ? "rented" : vehicle.manualStatus;
    return {
      vehicle,
      status,
      activeRental: active,
      activeDriver: active ? driversById.get(active.rental.driverId) ?? null : null,
      km: currentKm(vehicle, data.odometer),
      service: serviceInfo(vehicle, data.odometer, settings),
      documents: vehicle.manualStatus === "passive" ? [] : documentAlerts(vehicle, today, settings.documentWarnDays),
      income,
      expense,
      net: income - expense,
      rentals: own,
    };
  });

  const drivers: DriverView[] = data.drivers.map((driver) => {
    const own = rentals.filter((r) => r.rental.driverId === driver.id);
    const active = own.find((r) => r.rental.status === "active") ?? null;
    const pastIds = [...new Set(own.filter((r) => r !== active).map((r) => r.rental.vehicleId))];
    return {
      driver,
      activeRental: active,
      activeVehicle: active ? vehiclesById.get(active.rental.vehicleId) ?? null : null,
      pastVehicles: pastIds.map((id) => vehiclesById.get(id)).filter((v): v is Vehicle => Boolean(v)),
      totalPaid: sumActive(data.payments.filter((p) => p.driverId === driver.id)),
      balance: own.reduce((a, r) => a + r.balance, 0),
      overdue: own.reduce((a, r) => a + r.overdue, 0),
      rentals: own,
    };
  });

  const ledger = buildLedger(data);
  const odometerChecks = checkOdometer(data.vehicles, data.odometer);
  const alerts: Alert[] = [];
  const plateOf = (id: string) => vehiclesById.get(id)?.plate ?? "?";
  const nameOf = (id: string) => {
    const d = driversById.get(id);
    return d ? fullName(d) : "?";
  };

  for (const r of rentals) {
    if (r.state === "overdue") {
      alerts.push({
        kind: "overdue",
        severity: "danger",
        title: `Gecikmiş ödeme · ${plateOf(r.rental.vehicleId)}`,
        detail: `${nameOf(r.rental.driverId)} · ${formatTRY(r.overdue)} · ${r.overdueDays} gün`,
        href: `/fleet/kiralamalar?k=${r.rental.id}`,
      });
    } else if (r.state === "due-soon" && r.nextDueDate) {
      alerts.push({
        kind: "due-soon",
        severity: "warning",
        title: `Ödeme yaklaşıyor · ${plateOf(r.rental.vehicleId)}`,
        detail: `${nameOf(r.rental.driverId)} · ${formatTRY(r.nextDueAmount)} · ${formatDateTR(r.nextDueDate)}`,
        href: `/fleet/kiralamalar?k=${r.rental.id}`,
      });
    }
    if (r.rental.status === "active" && r.rental.endDate && r.rental.endDate < today) {
      alerts.push({
        kind: "rental-ended",
        severity: "warning",
        title: `Bitiş tarihi geçti · ${plateOf(r.rental.vehicleId)}`,
        detail: `${r.rental.code} hâlâ aktif — tamamlayın veya bitişi uzatın`,
        href: `/fleet/kiralamalar?k=${r.rental.id}`,
      });
    }
  }
  for (const v of vehicles) {
    if (v.status === "passive") continue;
    if (v.service.kmLeft !== null && v.service.kmLeft <= settings.serviceWarnKm) {
      alerts.push({
        kind: "service",
        severity: v.service.kmLeft <= 0 ? "danger" : "warning",
        title: `Bakım zamanı · ${v.vehicle.plate}`,
        detail: v.service.kmLeft <= 0 ? `Bakım ${Math.abs(v.service.kmLeft).toLocaleString("tr-TR")} km geçti` : `${v.service.kmLeft.toLocaleString("tr-TR")} km kaldı`,
        href: `/fleet/araclar/${v.vehicle.id}`,
      });
    }
    for (const doc of v.documents) {
      alerts.push({
        kind: "document",
        severity: doc.daysLeft < 0 ? "danger" : "warning",
        title: `${doc.type} · ${v.vehicle.plate}`,
        detail: doc.daysLeft < 0 ? `${Math.abs(doc.daysLeft)} gün önce bitti` : `${doc.daysLeft} gün kaldı (${formatDateTR(doc.date)})`,
        href: `/fleet/araclar/${v.vehicle.id}`,
      });
    }
  }
  for (const c of odometerChecks) {
    if (!c.lowerThanPrevious) continue;
    alerts.push({
      kind: "odometer",
      severity: "warning",
      title: `Hatalı km olabilir · ${plateOf(c.entry.vehicleId)}`,
      detail: `${formatDateTR(c.entry.date)}: ${c.entry.km.toLocaleString("tr-TR")} km, önceki ${c.previousMax.toLocaleString("tr-TR")} km`,
      href: `/fleet/bakim`,
    });
  }
  alerts.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "danger" ? -1 : 1));

  return { today, rentals, vehicles, drivers, ledger, cash: cashBalance(ledger), alerts, odometerChecks };
}

/* ------------------------------------------------------------------ */
/*  Raporlar                                                            */
/* ------------------------------------------------------------------ */

export type RangePreset = "day" | "week" | "month" | "year" | "custom";

export function resolveRange(preset: RangePreset, today: ISODate, from?: string, to?: string): { from: ISODate; to: ISODate } {
  switch (preset) {
    case "day":
      return { from: today, to: today };
    case "week": {
      const s = weekStart(today);
      return { from: s, to: addDays(s, 6) };
    }
    case "year":
      return { from: `${today.slice(0, 4)}-01-01`, to: `${today.slice(0, 4)}-12-31` };
    case "custom":
      if (isISODate(from) && isISODate(to) && from <= to) return { from, to };
      return { from: monthStart(today), to: monthEnd(today) };
    default:
      return { from: monthStart(today), to: monthEnd(today) };
  }
}

export interface MonthRow {
  month: ISODate;
  income: Kurus;
  expense: Kurus;
  net: Kurus;
}

export function monthlySeries(data: Pick<FleetData, "payments" | "expenses">, lastMonth: ISODate, count: number): MonthRow[] {
  const out: MonthRow[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const m = addMonths(monthStart(lastMonth), -i);
    const end = monthEnd(m);
    const income = sumActive(data.payments.filter((p) => inRange(p.date, m, end)));
    const expense = sumActive(data.expenses.filter((e) => inRange(e.date, m, end)));
    out.push({ month: m, income, expense, net: income - expense });
  }
  return out;
}

export interface DriverPerformance {
  driver: Driver;
  paidInRange: Kurus;
  installmentsDue: number;
  paidOnTime: number;
  overdueNow: Kurus;
}

export interface Report {
  from: ISODate;
  to: ISODate;
  income: Kurus;
  expense: Kurus;
  net: Kurus;
  openingBalance: Kurus;
  closingBalance: Kurus;
  ledger: LedgerEntry[];
  byVehicle: { vehicle: Vehicle; income: Kurus; expense: Kurus; net: Kurus }[];
  generalExpense: Kurus;
  byCategory: { category: string; amount: Kurus }[];
  byDriver: DriverPerformance[];
  overdue: RentalSummary[];
  daily: { date: ISODate; income: Kurus; expense: Kurus; net: Kurus }[];
}

/**
 * Aralıkta vadesi gelen (ve bugünü geçmemiş) taksitlerden kaçı vadesinde
 * ödenmiş? Tahsilatlar tarih sırasıyla taksitlere dağıtılır: bir taksit, vade
 * gününe kadarki toplam tahsilat o taksit dahil tüm taksitleri karşılıyorsa
 * vadesinde ödenmiştir.
 */
function onTimeCount(summary: RentalSummary, payments: Payment[], from: ISODate, to: ISODate, today: ISODate) {
  const own = payments.filter((p) => !p.voided && p.rentalId === summary.rental.id);
  let cumulative = 0;
  let due = 0;
  let onTime = 0;
  for (const inst of summary.schedule) {
    cumulative += inst.amount;
    if (!inRange(inst.dueDate, from, to) || inst.dueDate > today) continue;
    due += 1;
    const paidByDue = own.filter((p) => p.date <= inst.dueDate).reduce((a, p) => a + p.amount, 0);
    if (paidByDue >= cumulative) onTime += 1;
  }
  return { due, onTime };
}

export function buildReport(data: FleetData, view: FleetView, from: ISODate, to: ISODate): Report {
  const payments = data.payments.filter((p) => !p.voided && inRange(p.date, from, to));
  const expenses = data.expenses.filter((e) => !e.voided && inRange(e.date, from, to));
  const income = sumActive(payments);
  const expense = sumActive(expenses);
  const before = view.ledger.filter((l) => l.date < from);
  const inside = view.ledger.filter((l) => inRange(l.date, from, to));
  const openingBalance = before.length ? before[before.length - 1]!.balance : 0;
  const closingBalance = inside.length ? inside[inside.length - 1]!.balance : openingBalance;

  const byVehicle = data.vehicles.map((vehicle) => {
    const vi = sumActive(payments.filter((p) => p.vehicleId === vehicle.id));
    const ve = sumActive(expenses.filter((e) => e.vehicleId === vehicle.id));
    return { vehicle, income: vi, expense: ve, net: vi - ve };
  });
  const categories = new Map<string, number>();
  for (const e of expenses) categories.set(e.category, (categories.get(e.category) ?? 0) + e.amount);

  const byDriver = view.drivers.map((dv) => {
    let installmentsDue = 0;
    let paidOnTime = 0;
    for (const r of dv.rentals) {
      const c = onTimeCount(r, data.payments, from, to, view.today);
      installmentsDue += c.due;
      paidOnTime += c.onTime;
    }
    return {
      driver: dv.driver,
      paidInRange: sumActive(payments.filter((p) => p.driverId === dv.driver.id)),
      installmentsDue,
      paidOnTime,
      overdueNow: dv.overdue,
    };
  });

  const daily: Report["daily"] = [];
  const span = Math.min(diffDays(to, from), 400);
  for (let i = 0; i <= span; i++) {
    const d = addDays(from, i);
    const di = sumActive(payments.filter((p) => p.date === d));
    const de = sumActive(expenses.filter((e) => e.date === d));
    if (di || de) daily.push({ date: d, income: di, expense: de, net: di - de });
  }

  return {
    from,
    to,
    income,
    expense,
    net: income - expense,
    openingBalance,
    closingBalance,
    ledger: inside,
    byVehicle,
    generalExpense: sumActive(expenses.filter((e) => e.vehicleId === null)),
    byCategory: [...categories.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
    byDriver,
    overdue: view.rentals.filter((r) => r.overdue > 0),
    daily,
  };
}

/* ------------------------------------------------------------------ */
/*  Biçim (sunucu ve istemci ortak)                                     */
/* ------------------------------------------------------------------ */

const TRY = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 });

export const formatTRY = (kurus: Kurus) => TRY.format(kurus / 100);

export function formatDateTR(date: ISODate | null | undefined): string {
  if (!date) return "—";
  const [y, m, d] = date.split("-");
  return `${d}.${m}.${y}`;
}

export function maskNationalId(id: string): string {
  return id.length >= 4 ? `•••••••${id.slice(-4)}` : "•••";
}

