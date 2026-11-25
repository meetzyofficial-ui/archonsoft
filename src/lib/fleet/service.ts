/**
 * Archon Fleet — işlemler.
 *
 * Bütün yazma işlemleri buradan geçer: doğrulama, ilişki kontrolü (araç ve
 * sürücü var mı, araç o tarihlerde boş mu), iş kuralları ve işlem geçmişi.
 * Silme yoktur. Finansal kayıt iptal edilir, araç ve sürücü pasife alınır.
 */
import { findOverlap, fullName, istanbulToday, previousMaxKm, formatTRY } from "./calc";
import { getRepo, StoreError, type Collection, type Repo } from "./store";
import {
  DEFAULT_SETTINGS,
  type Adjustment,
  type AuditEntry,
  type Driver,
  type Expense,
  type FleetData,
  type OdometerEntry,
  type Payment,
  type Rental,
  type Settings,
  type Vehicle,
} from "./types";
import {
  readAdjustment,
  readDriver,
  readExpense,
  readOdometer,
  readPayment,
  readReason,
  readRental,
  readSettings,
  readVehicle,
  Reader,
  type Errors,
} from "./validate";

export class FleetError extends Error {
  status: number;
  errors: Errors;
  /** Kullanıcı onayıyla geçilebilecek uyarı (ör. düşük km). */
  warning: boolean;
  constructor(message: string, opts: { status?: number; errors?: Errors; warning?: boolean } = {}) {
    super(message);
    this.status = opts.status ?? 400;
    this.errors = opts.errors ?? {};
    this.warning = opts.warning ?? false;
  }
}

type Input = Record<string, unknown>;

export interface Ctx {
  repo: Repo;
  now: Date;
}

export function defaultCtx(): Ctx {
  return { repo: getRepo(), now: new Date() };
}

export async function loadData(repo: Repo): Promise<FleetData> {
  const [vehicles, drivers, rentals, payments, expenses, odometer, adjustments, settingsDoc] = await Promise.all([
    repo.list<Vehicle>("vehicles"),
    repo.list<Driver>("drivers"),
    repo.list<Rental>("rentals"),
    repo.list<Payment>("payments"),
    repo.list<Expense>("expenses"),
    repo.list<OdometerEntry>("odometer"),
    repo.list<Adjustment>("adjustments"),
    repo.get<Settings & { id: string }>("settings", "main"),
  ]);
  const settings: Settings = { ...DEFAULT_SETTINGS, ...(settingsDoc ?? {}) };
  delete (settings as Partial<{ id: string }>).id;
  return { vehicles, drivers, rentals, payments, expenses, odometer, adjustments, settings };
}

export async function listAudit(repo: Repo, limit = 200): Promise<AuditEntry[]> {
  const all = await repo.list<AuditEntry>("audit");
  return all.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

function check<T>(result: { ok: true; value: T } | { ok: false; errors: Errors }): T {
  if (!result.ok) throw new FleetError("Lütfen işaretli alanları düzeltin.", { errors: result.errors });
  return result.value;
}

const newId = () => crypto.randomUUID();

function nextCode(prefix: string, existing: { code: string }[]): string {
  const max = existing.reduce((m, e) => {
    const n = Number(e.code.replace(/^\D+-?/, ""));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

async function audit(ctx: Ctx, op: string, entity: Collection, entityId: string, summary: string) {
  const entry: AuditEntry = { id: newId(), at: ctx.now.toISOString(), op, entity, entityId, summary };
  await ctx.repo.create("audit", entry as unknown as AuditEntry & Record<string, unknown>);
}

async function must<T>(ctx: Ctx, c: Collection, id: unknown, label: string): Promise<T> {
  if (typeof id !== "string" || !id) throw new FleetError(`${label} seçilmedi.`);
  const found = await ctx.repo.get<T>(c, id);
  if (!found) throw new FleetError(`${label} bulunamadı.`, { status: 404 });
  return found;
}

type AnyDoc = Record<string, unknown> & { id: string };
const asDoc = <T extends { id: string }>(v: T) => v as unknown as AnyDoc;

/* ------------------------------------------------------------------ */
/*  Araç                                                                */
/* ------------------------------------------------------------------ */

export async function saveVehicle(ctx: Ctx, input: Input): Promise<Vehicle> {
  const value = check(readVehicle(input));
  const all = await ctx.repo.list<Vehicle>("vehicles");
  const id = typeof input.id === "string" && input.id ? input.id : null;
  if (all.some((v) => v.plate === value.plate && v.id !== id)) {
    throw new FleetError("Bu plaka zaten kayıtlı.", { errors: { plate: "Bu plaka zaten kayıtlı." } });
  }
  const now = ctx.now.toISOString();
  if (id) {
    const current = await must<Vehicle>(ctx, "vehicles", id, "Araç");
    const next: Vehicle = { ...current, ...value, updatedAt: now };
    await ctx.repo.update("vehicles", asDoc(next));
    await audit(ctx, "vehicle.update", "vehicles", id, `${next.plate} güncellendi`);
    return next;
  }
  const vehicle: Vehicle = { id: newId(), code: nextCode("A", all), ...value, createdAt: now, updatedAt: now };
  await ctx.repo.create("vehicles", asDoc(vehicle));
  await audit(ctx, "vehicle.create", "vehicles", vehicle.id, `${vehicle.plate} eklendi`);
  return vehicle;
}

/* ------------------------------------------------------------------ */
/*  Sürücü                                                              */
/* ------------------------------------------------------------------ */

export async function saveDriver(ctx: Ctx, input: Input): Promise<Driver> {
  const value = check(readDriver(input));
  const all = await ctx.repo.list<Driver>("drivers");
  const id = typeof input.id === "string" && input.id ? input.id : null;
  if (all.some((d) => d.nationalId === value.nationalId && d.id !== id)) {
    throw new FleetError("Bu TC kimlik numarası başka bir sürücüde kayıtlı.", {
      errors: { nationalId: "Bu TC kimlik numarası zaten kayıtlı." },
    });
  }
  const now = ctx.now.toISOString();
  if (id) {
    const current = await must<Driver>(ctx, "drivers", id, "Sürücü");
    const next: Driver = { ...current, ...value, updatedAt: now };
    await ctx.repo.update("drivers", asDoc(next));
    await audit(ctx, "driver.update", "drivers", id, `${current.code} güncellendi`);
    return next;
  }
  const driver: Driver = { id: newId(), code: nextCode("S", all), ...value, createdAt: now, updatedAt: now };
  await ctx.repo.create("drivers", asDoc(driver));
  await audit(ctx, "driver.create", "drivers", driver.id, `${driver.code} eklendi`);
  return driver;
}

/* ------------------------------------------------------------------ */
/*  Kiralama                                                            */
/* ------------------------------------------------------------------ */

export async function createRental(ctx: Ctx, input: Input): Promise<Rental> {
  const value = check(readRental(input));
  const vehicle = await must<Vehicle>(ctx, "vehicles", value.vehicleId, "Araç");
  const driver = await must<Driver>(ctx, "drivers", value.driverId, "Sürücü");
  if (vehicle.manualStatus === "passive") throw new FleetError("Pasif araç kiralanamaz.");
  if (driver.status === "blacklist") throw new FleetError("Kara listedeki sürücüye kiralama yapılamaz.");
  if (driver.status === "passive") throw new FleetError("Pasif sürücüye kiralama yapılamaz. Önce sürücüyü aktif yapın.");
  const all = await ctx.repo.list<Rental>("rentals");
  const overlap = findOverlap({ id: "", vehicleId: vehicle.id, startDate: value.startDate, endDate: value.endDate }, all);
  if (overlap) {
    throw new FleetError(
      `${vehicle.plate} bu tarihlerde ${overlap.code} ile zaten kirada. Önce o kiralamayı tamamlayın ya da tarihleri değiştirin.`,
      { status: 409 },
    );
  }
  const now = ctx.now.toISOString();
  const rental: Rental = {
    id: newId(),
    code: nextCode("K", all),
    ...value,
    status: "active",
    cancelReason: null,
    createdAt: now,
    updatedAt: now,
  };
  await ctx.repo.create("rentals", asDoc(rental));
  await audit(ctx, "rental.create", "rentals", rental.id, `${rental.code} · ${vehicle.plate} · ${driver.code}`);
  return rental;
}

function readEnd(input: Input, rental: Rental, required: boolean): string | null {
  const r = new Reader(input);
  const end = r.date("endDate", "Bitiş tarihi", { required });
  if (end && end < rental.startDate) r.errors.endDate = "Bitiş, başlangıçtan önce olamaz.";
  return check(r.result(end));
}

/** Kiralamayı bitirir. Bitiş verilmezse bugünün tarihi yazılır. */
export async function completeRental(ctx: Ctx, input: Input): Promise<Rental> {
  const rental = await must<Rental>(ctx, "rentals", input.id, "Kiralama");
  if (rental.status !== "active") throw new FleetError("Yalnızca aktif kiralama tamamlanabilir.");
  const today = istanbulToday(ctx.now);
  const end = readEnd({ endDate: input.endDate || (rental.endDate && rental.endDate < today ? rental.endDate : today) }, rental, true);
  const next: Rental = { ...rental, endDate: end, status: "completed", updatedAt: ctx.now.toISOString() };
  await ctx.repo.update("rentals", asDoc(next));
  await audit(ctx, "rental.complete", "rentals", rental.id, `${rental.code} tamamlandı (${next.endDate})`);
  return next;
}

export async function cancelRental(ctx: Ctx, input: Input): Promise<Rental> {
  const rental = await must<Rental>(ctx, "rentals", input.id, "Kiralama");
  if (rental.status === "cancelled") throw new FleetError("Kiralama zaten iptal edilmiş.");
  const reason = check(readReason(input));
  const payments = (await ctx.repo.list<Payment>("payments")).filter((p) => p.rentalId === rental.id && !p.voided);
  if (payments.length) {
    throw new FleetError(
      "Bu kiralamanın tahsilatları var. İptal yerine 'Tamamla' kullanın ya da önce tahsilatları gerekçeyle iptal edin.",
      { status: 409 },
    );
  }
  const next: Rental = { ...rental, status: "cancelled", cancelReason: reason, updatedAt: ctx.now.toISOString() };
  await ctx.repo.update("rentals", asDoc(next));
  await audit(ctx, "rental.cancel", "rentals", rental.id, `${rental.code} iptal: ${reason}`);
  return next;
}

/** Bitiş tarihini değiştirir (uzatma / kısaltma / açık uçlu yapma); çakışma kontrolüyle. */
export async function updateRentalEnd(ctx: Ctx, input: Input): Promise<Rental> {
  const rental = await must<Rental>(ctx, "rentals", input.id, "Kiralama");
  if (rental.status !== "active") throw new FleetError("Yalnızca aktif kiralamanın bitişi değiştirilebilir.");
  const end = readEnd(input, rental, false);
  const all = await ctx.repo.list<Rental>("rentals");
  const overlap = findOverlap({ ...rental, endDate: end }, all);
  if (overlap) throw new FleetError(`Yeni tarih ${overlap.code} ile çakışıyor.`, { status: 409 });
  const next: Rental = { ...rental, endDate: end, updatedAt: ctx.now.toISOString() };
  await ctx.repo.update("rentals", asDoc(next));
  await audit(ctx, "rental.end", "rentals", rental.id, `${rental.code} bitiş: ${next.endDate ?? "açık uçlu"}`);
  return next;
}

/* ------------------------------------------------------------------ */
/*  Tahsilat                                                            */
/* ------------------------------------------------------------------ */

export async function recordPayment(ctx: Ctx, input: Input): Promise<Payment> {
  const value = check(readPayment(input));
  const rental = await must<Rental>(ctx, "rentals", value.rentalId, "Kiralama");
  if (rental.status === "cancelled") throw new FleetError("İptal edilmiş kiralamaya tahsilat girilemez.");
  if (value.date > istanbulToday(ctx.now)) throw new FleetError("İleri tarihli tahsilat girilemez — para gelince kaydedin.", { errors: { date: "Bugünden ileri olamaz." } });
  const all = await ctx.repo.list<Payment>("payments");
  const payment: Payment = {
    id: newId(),
    code: nextCode("T", all),
    ...value,
    vehicleId: rental.vehicleId,
    driverId: rental.driverId,
    voided: false,
    voidReason: null,
    createdAt: ctx.now.toISOString(),
  };
  await ctx.repo.create("payments", asDoc(payment));
  await audit(ctx, "payment.create", "payments", payment.id, `${payment.code} · ${rental.code} · ${formatTRY(payment.amount)}`);
  return payment;
}

async function voidFinancial<T extends { id: string; code: string; voided: boolean; voidReason: string | null }>(
  ctx: Ctx,
  c: "payments" | "expenses" | "adjustments",
  input: Input,
  label: string,
): Promise<T> {
  const doc = await must<T>(ctx, c, input.id, label);
  if (doc.voided) throw new FleetError(`${label} zaten iptal edilmiş.`);
  const reason = check(readReason(input));
  const next = { ...doc, voided: true, voidReason: reason };
  await ctx.repo.update(c, asDoc(next));
  await audit(ctx, `${c}.void`, c, doc.id, `${doc.code} iptal: ${reason}`);
  return next;
}

export const voidPayment = (ctx: Ctx, input: Input) => voidFinancial<Payment>(ctx, "payments", input, "Tahsilat");
export const voidExpense = (ctx: Ctx, input: Input) => voidFinancial<Expense>(ctx, "expenses", input, "Gider");
export const voidAdjustment = (ctx: Ctx, input: Input) => voidFinancial<Adjustment>(ctx, "adjustments", input, "Düzeltme");

/* ------------------------------------------------------------------ */
/*  Gider, düzeltme                                                     */
/* ------------------------------------------------------------------ */

export async function recordExpense(ctx: Ctx, input: Input): Promise<Expense> {
  const value = check(readExpense(input));
  if (value.vehicleId) await must<Vehicle>(ctx, "vehicles", value.vehicleId, "Araç");
  const all = await ctx.repo.list<Expense>("expenses");
  const expense: Expense = {
    id: newId(),
    code: nextCode("G", all),
    ...value,
    voided: false,
    voidReason: null,
    createdAt: ctx.now.toISOString(),
  };
  await ctx.repo.create("expenses", asDoc(expense));
  await audit(ctx, "expense.create", "expenses", expense.id, `${expense.code} · ${expense.category} · ${formatTRY(expense.amount)}`);
  return expense;
}

export async function recordAdjustment(ctx: Ctx, input: Input): Promise<Adjustment> {
  const value = check(readAdjustment(input));
  const all = await ctx.repo.list<Adjustment>("adjustments");
  const adj: Adjustment = {
    id: newId(),
    code: nextCode("D", all),
    ...value,
    voided: false,
    voidReason: null,
    createdAt: ctx.now.toISOString(),
  };
  await ctx.repo.create("adjustments", asDoc(adj));
  await audit(ctx, "adjustment.create", "adjustments", adj.id, `${adj.code} · ${formatTRY(adj.amount)} · ${adj.reason}`);
  return adj;
}

/* ------------------------------------------------------------------ */
/*  Kilometre / bakım                                                   */
/* ------------------------------------------------------------------ */

export async function recordOdometer(ctx: Ctx, input: Input): Promise<OdometerEntry> {
  const value = check(readOdometer(input));
  const vehicle = await must<Vehicle>(ctx, "vehicles", value.vehicleId, "Araç");
  const all = await ctx.repo.list<OdometerEntry>("odometer");
  const prev = previousMaxKm(vehicle, all, value.date);
  if (value.km < prev && input.force !== true) {
    throw new FleetError(
      `Girilen km (${value.km.toLocaleString("tr-TR")}) bu aracın önceki kaydından (${prev.toLocaleString("tr-TR")}) düşük. Yine de kaydedilsin mi?`,
      { status: 409, warning: true, errors: { km: "Önceki kayıttan düşük." } },
    );
  }
  const entry: OdometerEntry = { id: newId(), ...value, createdAt: ctx.now.toISOString() };
  await ctx.repo.create("odometer", asDoc(entry));
  await audit(ctx, "odometer.create", "odometer", entry.id, `${vehicle.plate} · ${entry.km} km · ${entry.kind}`);
  return entry;
}

/* ------------------------------------------------------------------ */
/*  Ayarlar                                                             */
/* ------------------------------------------------------------------ */

export async function saveSettings(ctx: Ctx, input: Input): Promise<Settings> {
  const value = check(readSettings(input));
  await ctx.repo.upsert("settings", { id: "main", ...value });
  await audit(ctx, "settings.update", "settings", "main", `Ayarlar güncellendi (açılış ${formatTRY(value.openingBalance)})`);
  return value;
}

/* ------------------------------------------------------------------ */

export const OPERATIONS = {
  "vehicle.save": saveVehicle,
  "driver.save": saveDriver,
  "rental.create": createRental,
  "rental.complete": completeRental,
  "rental.cancel": cancelRental,
  "rental.end": updateRentalEnd,
  "payment.create": recordPayment,
  "payment.void": voidPayment,
  "expense.create": recordExpense,
  "expense.void": voidExpense,
  "adjustment.create": recordAdjustment,
  "adjustment.void": voidAdjustment,
  "odometer.create": recordOdometer,
  "settings.save": saveSettings,
} as const;

export type OperationName = keyof typeof OPERATIONS;

export function isOperation(name: unknown): name is OperationName {
  return typeof name === "string" && Object.prototype.hasOwnProperty.call(OPERATIONS, name);
}

export async function runOperation(ctx: Ctx, name: OperationName, input: Input): Promise<unknown> {
  try {
    return await OPERATIONS[name](ctx, input);
  } catch (error) {
    if (error instanceof StoreError && error.code === "NOT_CONFIGURED") throw new FleetError(error.message, { status: 503 });
    if (error instanceof StoreError && error.code === "BACKEND") throw new FleetError("Veritabanına ulaşılamadı. Tekrar deneyin.", { status: 502 });
    throw error;
  }
}

export { fullName };
