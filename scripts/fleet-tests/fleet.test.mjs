// Archon Fleet — finans, ilişki, doğrulama ve güvenlik testleri.
// Çalıştırma: npm run test:fleet
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

import {
  buildView,
  buildLedger,
  buildReport,
  summarizeRental,
  findOverlap,
  resolveRange,
  monthlySeries,
  istanbulToday,
  monthEnd,
  weekStart,
  formatTRY,
} from "../../src/lib/fleet/calc.ts";
import { parseMoney, isValidNationalId, normalizePlate, normalizePhone, readDriver } from "../../src/lib/fleet/validate.ts";
import { MemoryRepo, encodeFields, decodeFields } from "../../src/lib/fleet/store.ts";
import { runOperation, loadData, FleetError, listAudit } from "../../src/lib/fleet/service.ts";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  authConfig,
  loginThrottled,
  recordFailedLogin,
} from "../../src/lib/fleet/auth.ts";
import { buildXlsx, crc32 } from "../../src/lib/fleet/xlsx.ts";
import { reportSheets } from "../../src/lib/fleet/exports.ts";
import { digestHtml, emailChannel } from "../../src/lib/fleet/notify.ts";
import { DEFAULT_SETTINGS } from "../../src/lib/fleet/types.ts";

const TODAY = "2026-11-25";
const NOW = new Date("2026-11-25T12:00:00+03:00");
const TL = (n) => Math.round(n * 100);

// Geçerli algoritmalı örnek TC numaraları (gerçek kişilere ait değildir).
function makeTc(seed) {
  const d = String(seed).padStart(9, "1").slice(0, 9).split("").map(Number);
  if (d[0] === 0) d[0] = 1;
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  d.push((((odd * 7 - even) % 10) + 10) % 10);
  d.push(d.reduce((a, b) => a + b, 0) % 10);
  return d.join("");
}

/** Excel dosyasındaki örnek veriyi servis üzerinden kurar. */
async function seed() {
  const repo = new MemoryRepo();
  const ctx = { repo, now: NOW };
  await runOperation(ctx, "settings.save", {
    openingBalance: "10000",
    openingDate: "2026-10-01",
    serviceIntervalKm: 10000,
    serviceWarnKm: 1000,
    documentWarnDays: 30,
    dueSoonDays: 2,
    paymentTiming: "advance",
  });
  const car = async (plate, brand, model, km, daily, weekly, monthly, extra = {}) =>
    runOperation(ctx, "vehicle.save", { plate, brand, model, year: 2021, initialKm: km, dailyRate: daily, weeklyRate: weekly, monthlyRate: monthly, ...extra });
  const abc = await car("06abc123", "Toyota", "Corolla", 80000, "1000", "6.500", "25.000", { insuranceEnd: "2027-03-15" });
  const def = await car("06 DEF 456", "Renault", "Clio", 55000, "900", "6000", "25000", { insuranceEnd: "2026-12-10" });
  const ghj = await car("06 GHJ 789", "Fiat", "Egea", 25000, "1100", "7000", "28000");
  const klm = await car("06 KLM 012", "Hyundai", "i20", 120000, "850", "5500", "22000");
  const drv = async (firstName, lastName, n) =>
    runOperation(ctx, "driver.save", { firstName, lastName, nationalId: makeTc(n), phone: "0532 000 00 0" + (n % 10) });
  const ahmet = await drv("Ahmet", "Yılmaz", 123456781);
  const mehmet = await drv("Mehmet", "Kaya", 234567812);
  const ayse = await drv("Ayşe", "Demir", 345678123);
  const ali = await drv("Ali", "Çelik", 456781234);

  // Geçmiş tarihli kiralamalar için "şimdi"yi ilgili güne çekiyoruz.
  const k1 = await runOperation(ctx, "rental.create", { vehicleId: abc.id, driverId: ahmet.id, startDate: "2026-10-01", endDate: "2026-10-28", period: "weekly", dailyRate: "1000", weeklyRate: "6500", deposit: "5000" });
  await runOperation(ctx, "rental.complete", { id: k1.id, endDate: "2026-10-28" });
  const k2 = await runOperation(ctx, "rental.create", { vehicleId: abc.id, driverId: mehmet.id, startDate: "2026-11-01", period: "weekly", dailyRate: "1000", weeklyRate: "6500", deposit: "5000" });
  const k3 = await runOperation(ctx, "rental.create", { vehicleId: def.id, driverId: ayse.id, startDate: "2026-11-10", endDate: "2026-12-09", period: "monthly", dailyRate: "900", monthlyRate: "25000", deposit: "5000" });
  const k4 = await runOperation(ctx, "rental.create", { vehicleId: ghj.id, driverId: ali.id, startDate: "2026-11-19", period: "weekly", dailyRate: "1100", weeklyRate: "7000", deposit: "5000" });
  const k5 = await runOperation(ctx, "rental.create", { vehicleId: klm.id, driverId: ahmet.id, startDate: "2026-11-05", endDate: "2026-11-12", period: "weekly", dailyRate: "850", weeklyRate: "5500" });
  await runOperation(ctx, "rental.cancel", { id: k5.id, reason: "Sürücü vazgeçti" });

  const pay = (date, rentalId, amount, method = "cash") => runOperation(ctx, "payment.create", { date, rentalId, amount, method });
  for (const d of ["2026-10-01", "2026-10-08", "2026-10-15", "2026-10-22"]) await pay(d, k1.id, "6500");
  for (const d of ["2026-11-01", "2026-11-08", "2026-11-15"]) await pay(d, k2.id, "6500");
  await pay("2026-11-10", k3.id, "25000", "transfer");
  await pay("2026-11-19", k4.id, "7000");

  const exp = (date, vehicleId, category, description, amount) => runOperation(ctx, "expense.create", { date, vehicleId, category, description, amount });
  await exp("2026-10-05", abc.id, "Yağ", "Motor yağı", "2500");
  await exp("2026-10-20", def.id, "Lastik", "Kış lastiği", "8000");
  await exp("2026-11-03", ghj.id, "Sigorta", "Trafik sigortası", "12000");
  await exp("2026-11-12", klm.id, "Muayene", "Muayene", "1800");
  await exp("2026-11-15", "", "Diğer", "Muhasebe", "1500");
  await exp("2026-11-20", abc.id, "Bakım", "Periyodik bakım", "4500");

  const odo = (date, vehicleId, km, kind, nextServiceKm, force) => runOperation(ctx, "odometer.create", { date, vehicleId, km, kind, nextServiceKm, force });
  await odo("2026-06-10", ghj.id, 30000, "service", 40000);
  await odo("2026-10-01", abc.id, 85000, "reading");
  await odo("2026-11-01", def.id, 60000, "reading");
  await odo("2026-11-20", abc.id, 92000, "service", 102000);
  await odo("2026-11-24", ghj.id, 39400, "reading");

  return { repo, ctx, ids: { abc, def, ghj, klm, ahmet, mehmet, ayse, ali, k1, k2, k3, k4, k5 } };
}

test("Excel ile aynı sonuçlar: kasa, toplamlar, kiralama özetleri", async () => {
  const { repo, ids } = await seed();
  const data = await loadData(repo);
  const view = buildView(data, TODAY);

  assert.equal(view.cash, TL(57200), "kasa = 10.000 + 77.500 − 30.300");
  const byCode = Object.fromEntries(view.rentals.map((r) => [r.rental.code, r]));
  const k1 = byCode["K-0001"], k2 = byCode["K-0002"], k3 = byCode["K-0003"], k4 = byCode["K-0004"], k5 = byCode["K-0005"];

  assert.equal(k1.totalDays, 28);
  assert.equal(k1.expected, TL(26000));
  assert.equal(k1.balance, 0);
  assert.equal(k1.state, "closed");

  assert.equal(k2.dueToDate, TL(26000));
  assert.equal(k2.paid, TL(19500));
  assert.equal(k2.overdue, TL(6500));
  assert.equal(k2.overdueDays, 3);
  assert.equal(k2.nextDueDate, "2026-11-29");
  assert.equal(k2.state, "overdue");

  assert.equal(k3.totalDays, 30);
  assert.equal(k3.expected, TL(25000));
  assert.equal(k3.overdue, 0);
  assert.equal(k3.nextDueDate, null);

  assert.equal(k4.state, "due-soon");
  assert.equal(k4.nextDueDate, "2026-11-26");

  assert.equal(k5.expected, 0);
  assert.equal(k5.state, "cancelled");

  const totalExpected = view.rentals.reduce((a, r) => a + r.expected, 0);
  assert.equal(totalExpected, TL(84000));

  const vAbc = view.vehicles.find((v) => v.vehicle.id === ids.abc.id);
  assert.equal(vAbc.vehicle.plate, "06 ABC 123", "plaka normalize edildi");
  assert.equal(vAbc.status, "rented");
  assert.equal(vAbc.activeDriver.firstName, "Mehmet");
  assert.equal(vAbc.income, TL(45500));
  assert.equal(vAbc.expense, TL(7000));
  assert.equal(vAbc.km, 92000);
  assert.equal(vAbc.service.nextServiceKm, 102000);

  const vGhj = view.vehicles.find((v) => v.vehicle.id === ids.ghj.id);
  assert.equal(vGhj.service.kmLeft, 600);
  assert.equal(vGhj.net, TL(-5000));
  const vKlm = view.vehicles.find((v) => v.vehicle.id === ids.klm.id);
  assert.equal(vKlm.status, "available");

  const netSum = view.vehicles.reduce((a, v) => a + v.net, 0);
  assert.equal(netSum, TL(48700), "araç net toplamı genel gideri içermez");

  const kinds = view.alerts.map((a) => a.kind).sort();
  assert.deepEqual(kinds, ["document", "due-soon", "overdue", "service"]);

  const mehmet = view.drivers.find((d) => d.driver.id === ids.mehmet.id);
  assert.equal(mehmet.overdue, TL(6500));
  assert.equal(mehmet.activeVehicle.plate, "06 ABC 123");
  const ahmet = view.drivers.find((d) => d.driver.id === ids.ahmet.id);
  assert.equal(ahmet.activeRental, null);
  assert.deepEqual(ahmet.pastVehicles.map((v) => v.plate).sort(), ["06 ABC 123", "06 KLM 012"]);
});

test("Kasa tek defterden: bakiye kronolojik ve iptaller dışarıda", async () => {
  const { repo, ctx } = await seed();
  let data = await loadData(repo);
  let ledger = buildLedger(data);
  assert.equal(ledger[0].kind, "opening");
  for (let i = 1; i < ledger.length; i++) assert.equal(ledger[i].balance, ledger[i - 1].balance + ledger[i].amount);
  assert.ok(ledger.every((l, i) => i === 0 || l.date >= ledger[i - 1].date));

  const pay = data.payments.find((p) => p.date === "2026-11-19");
  await runOperation(ctx, "payment.void", { id: pay.id, reason: "Yanlış tutar" });
  data = await loadData(repo);
  ledger = buildLedger(data);
  assert.equal(ledger.at(-1).balance, TL(57200 - 7000));
  assert.equal(data.payments.length, 9, "iptal edilen tahsilat silinmez");
  const view = buildView(data, TODAY);
  const k4 = view.rentals.find((r) => r.rental.code === "K-0004");
  assert.equal(k4.overdue, TL(7000), "iptal edilen tahsilat borcu geri açar");

  await assert.rejects(runOperation(ctx, "payment.void", { id: pay.id, reason: "Tekrar" }), /zaten iptal/);
  await assert.rejects(runOperation(ctx, "payment.void", { id: data.payments[0].id, reason: "" }), (e) => e instanceof FleetError && Boolean(e.errors.reason));

  await runOperation(ctx, "adjustment.create", { date: "2026-11-25", amount: "-200", reason: "Sayım farkı" });
  data = await loadData(repo);
  assert.equal(buildView(data, TODAY).cash, TL(57200 - 7000 - 200));
});

test("Tahsilat girildiğinde kasa, araç ve sürücü toplamı birlikte güncellenir", async () => {
  const { repo, ctx, ids } = await seed();
  await runOperation(ctx, "payment.create", { date: TODAY, rentalId: ids.k2.id, amount: "6.500,00", method: "transfer" });
  const view = buildView(await loadData(repo), TODAY);
  assert.equal(view.cash, TL(63700));
  const k2 = view.rentals.find((r) => r.rental.id === ids.k2.id);
  assert.equal(k2.overdue, 0);
  assert.equal(k2.state, "ok");
  assert.equal(view.vehicles.find((v) => v.vehicle.id === ids.abc.id).income, TL(52000));
  assert.equal(view.drivers.find((d) => d.driver.id === ids.mehmet.id).totalPaid, TL(26000));
  const p = (await loadData(repo)).payments.at(-1);
  assert.equal(p.vehicleId, ids.abc.id, "tahsilat aracı kiralamadan alır");
  assert.equal(p.driverId, ids.mehmet.id);
});

test("Gider: genel ve araç bazlı, kasa azalır", async () => {
  const { repo, ctx, ids } = await seed();
  await runOperation(ctx, "expense.create", { date: TODAY, vehicleId: ids.klm.id, category: "Temizlik", description: "Yıkama", amount: "300" });
  const data = await loadData(repo);
  const view = buildView(data, TODAY);
  assert.equal(view.cash, TL(56900));
  assert.equal(view.vehicles.find((v) => v.vehicle.id === ids.klm.id).expense, TL(2100));
  const report = buildReport(data, view, "2026-11-01", "2026-11-30");
  assert.equal(report.generalExpense, TL(1500));
  assert.equal(report.expense, TL(19800 + 300));
  await assert.rejects(runOperation(ctx, "expense.create", { date: TODAY, category: "Uçak", description: "x", amount: "10" }), FleetError);
  await assert.rejects(runOperation(ctx, "expense.create", { date: TODAY, vehicleId: "yok", category: "Diğer", description: "x", amount: "10" }), /Araç bulunamadı/);
});

test("Araç aynı anda iki sürücüye kiralanamaz", async () => {
  const { ctx, ids } = await seed();
  await assert.rejects(
    runOperation(ctx, "rental.create", { vehicleId: ids.def.id, driverId: ids.ali.id, startDate: "2026-12-01", period: "weekly", dailyRate: "900" }),
    /zaten kirada/,
  );
  await assert.rejects(
    runOperation(ctx, "rental.create", { vehicleId: ids.abc.id, driverId: ids.ali.id, startDate: "2026-10-20", endDate: "2026-10-25", period: "daily", dailyRate: "900" }),
    /K-0001/,
    "tamamlanmış kiralamanın tarihleriyle de çakışmamalı",
  );
  // Biten kiralamanın ertesi günü yeni kiralama olur.
  const ok = await runOperation(ctx, "rental.create", { vehicleId: ids.def.id, driverId: ids.ali.id, startDate: "2026-12-10", period: "weekly", dailyRate: "900" });
  assert.equal(ok.status, "active");
  // İptal edilmiş kiralama tarihi kilitlemez.
  const free = await runOperation(ctx, "rental.create", { vehicleId: ids.klm.id, driverId: ids.ahmet.id, startDate: "2026-11-06", endDate: "2026-11-10", period: "daily", dailyRate: "850" });
  assert.equal(free.code, "K-0007");
  // Uzatma çakışma kontrolüne takılır.
  await assert.rejects(runOperation(ctx, "rental.end", { id: ids.k3.id, endDate: "2026-12-20" }), /çakışıyor/);
  assert.equal(findOverlap({ id: "x", vehicleId: ids.def.id, startDate: "2026-12-09", endDate: "2026-12-09" }, [ok]), null);
});

test("Kiralama kuralları: pasif araç, kara liste, tahsilatlı iptal", async () => {
  const { ctx, ids } = await seed();
  await runOperation(ctx, "vehicle.save", { ...ids.klm, id: ids.klm.id, dailyRate: "850", weeklyRate: "5500", monthlyRate: "22000", manualStatus: "passive" });
  await assert.rejects(
    runOperation(ctx, "rental.create", { vehicleId: ids.klm.id, driverId: ids.ali.id, startDate: "2027-01-01", period: "weekly", dailyRate: "900" }),
    /Pasif araç/,
  );
  await runOperation(ctx, "driver.save", { ...ids.ahmet, id: ids.ahmet.id, status: "blacklist" });
  await assert.rejects(
    runOperation(ctx, "rental.create", { vehicleId: ids.def.id, driverId: ids.ahmet.id, startDate: "2027-01-01", period: "weekly", dailyRate: "900" }),
    /Kara liste/i,
  );
  await assert.rejects(runOperation(ctx, "rental.cancel", { id: ids.k2.id, reason: "deneme" }), /tahsilatları var/);
  await assert.rejects(runOperation(ctx, "payment.create", { date: TODAY, rentalId: ids.k5.id, amount: "100" }), /İptal edilmiş/);
  await assert.rejects(runOperation(ctx, "payment.create", { date: "2026-12-01", rentalId: ids.k2.id, amount: "100" }), /İleri tarihli/);
});

test("Kilometre: düşük km uyarı verir, onayla kaydedilir ve uyarı listesinde görünür", async () => {
  const { repo, ctx, ids } = await seed();
  await assert.rejects(
    runOperation(ctx, "odometer.create", { date: "2026-11-20", vehicleId: ids.def.id, km: 59000, kind: "reading" }),
    (e) => e instanceof FleetError && e.warning === true && e.status === 409,
  );
  await runOperation(ctx, "odometer.create", { date: "2026-11-20", vehicleId: ids.def.id, km: 59000, kind: "reading", force: true });
  const view = buildView(await loadData(repo), TODAY);
  assert.ok(view.alerts.some((a) => a.kind === "odometer"));
  assert.equal(view.vehicles.find((v) => v.vehicle.id === ids.def.id).km, 60000, "güncel km en yüksek kayıttır");
});

test("Ödeme planı: kısmi son dönem, dönem sonu ödeme, günlük periyot", () => {
  const base = { id: "r", code: "K", vehicleId: "v", driverId: "d", deposit: 0, status: "active", notes: "", cancelReason: null, createdAt: "", updatedAt: "", weeklyRate: null, monthlyRate: null };
  const s1 = summarizeRental({ ...base, startDate: "2026-11-01", endDate: "2026-11-10", period: "weekly", dailyRate: TL(1000), weeklyRate: TL(7000) }, [], "2026-11-25", DEFAULT_SETTINGS);
  assert.equal(s1.schedule.length, 2);
  assert.equal(s1.schedule[1].amount, TL(3000), "3/7 hafta");
  assert.equal(s1.expected, TL(10000));
  assert.equal(s1.overdue, TL(10000));
  assert.equal(s1.overdueDays, 24);

  const arrears = { ...DEFAULT_SETTINGS, paymentTiming: "arrears" };
  const s2 = summarizeRental({ ...base, startDate: "2026-11-20", endDate: null, period: "weekly", dailyRate: TL(1000) }, [], "2026-11-25", arrears);
  assert.equal(s2.dueToDate, 0, "dönem sonu ödemede ilk hafta henüz vadesinde değil");
  assert.equal(s2.nextDueDate, "2026-11-27");
  assert.equal(s2.periodAmount, TL(7000), "haftalık boşsa günlük × 7");

  const s3 = summarizeRental({ ...base, startDate: "2026-11-23", endDate: null, period: "daily", dailyRate: TL(800) }, [{ rentalId: "r", amount: TL(800), voided: false, date: "2026-11-23" }], "2026-11-25", DEFAULT_SETTINGS);
  assert.equal(s3.dueToDate, TL(2400));
  assert.equal(s3.overdue, TL(1600));

  const s4 = summarizeRental({ ...base, startDate: "2026-12-01", endDate: null, period: "monthly", dailyRate: TL(900) }, [], "2026-11-25", DEFAULT_SETTINGS);
  assert.equal(s4.totalDays, 0, "ileri tarihli kiralama henüz gün saymaz");
  assert.equal(s4.expected, 0);
  assert.equal(s4.nextDueDate, "2026-12-01");
  assert.equal(s4.periodAmount, TL(27000));

  // Fazla ödeme: bakiye negatif, gecikme yok.
  const s5 = summarizeRental({ ...base, startDate: "2026-11-01", endDate: "2026-11-07", period: "weekly", dailyRate: TL(1000), weeklyRate: TL(7000) }, [{ rentalId: "r", amount: TL(8000), voided: false, date: "2026-11-01" }], "2026-11-25", DEFAULT_SETTINGS);
  assert.equal(s5.balance, TL(-1000));
  assert.equal(s5.overdue, 0);
});

test("Raporlar: aylık seri, tarih aralıkları, sürücü performansı", async () => {
  const { repo } = await seed();
  const data = await loadData(repo);
  const view = buildView(data, TODAY);
  const months = monthlySeries(data, TODAY, 3);
  assert.deepEqual(months.map((m) => [m.month, m.income / 100, m.expense / 100]), [
    ["2026-09-01", 0, 0],
    ["2026-10-01", 26000, 10500],
    ["2026-11-01", 51500, 19800],
  ]);
  const r = buildReport(data, view, "2026-11-01", "2026-11-30");
  assert.equal(r.net, TL(31700));
  assert.equal(r.openingBalance, TL(25500), "Ekim sonu kasa = 10.000 + 26.000 − 10.500");
  assert.equal(r.closingBalance, TL(57200));
  const mehmet = r.byDriver.find((d) => d.driver.firstName === "Mehmet");
  assert.equal(mehmet.installmentsDue, 4);
  assert.equal(mehmet.paidOnTime, 3);
  assert.deepEqual(resolveRange("week", TODAY), { from: "2026-11-23", to: "2026-11-29" });
  assert.deepEqual(resolveRange("month", TODAY), { from: "2026-11-01", to: "2026-11-30" });
  assert.deepEqual(resolveRange("custom", TODAY, "2026-12-01", "2026-11-01"), { from: "2026-11-01", to: "2026-11-30" }, "ters aralık geçersiz");
  assert.equal(monthEnd("2028-02-10"), "2028-02-29");
  assert.equal(weekStart("2026-11-29"), "2026-11-23");
  assert.equal(istanbulToday(new Date("2026-11-25T22:30:00Z")), "2026-11-26", "İstanbul gece yarısını geçti");
});

test("Boş sistem hata vermez", () => {
  const data = { vehicles: [], drivers: [], rentals: [], payments: [], expenses: [], odometer: [], adjustments: [], settings: DEFAULT_SETTINGS };
  const view = buildView(data, TODAY);
  assert.equal(view.cash, 0);
  assert.equal(view.alerts.length, 0);
  const r = buildReport(data, view, "2026-11-01", "2026-11-30");
  assert.equal(r.net, 0);
  const file = buildXlsx(reportSheets(data, view, r));
  assert.ok(file.length > 1000);
});

test("Doğrulama: para, TC, plaka, telefon", () => {
  assert.equal(parseMoney("6.500"), 650000);
  assert.equal(parseMoney("6.500,50"), 650050);
  assert.equal(parseMoney("6500.5"), 650050);
  assert.equal(parseMoney("1.234.567"), 123456700);
  assert.equal(parseMoney("₺ 250"), 25000);
  assert.equal(parseMoney("-200"), -20000);
  assert.equal(parseMoney("12,345,6"), null);
  assert.equal(parseMoney("abc"), null);
  assert.equal(parseMoney(1e3), 100000);
  assert.ok(isValidNationalId("10000000146"));
  assert.ok(!isValidNationalId("12345678901"));
  assert.ok(!isValidNationalId("01234567890"));
  assert.equal(normalizePlate("34 ab 1234"), "34 AB 1234");
  assert.equal(normalizePlate("06-ışk-99"), "06 IŞK 99");
  assert.equal(normalizePhone("+90 532 123 45 67"), "05321234567");
  assert.equal(normalizePhone("5321234567"), "05321234567");
  const bad = readDriver({ firstName: "", lastName: "X", nationalId: "123", phone: "12" });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.firstName && bad.errors.nationalId && bad.errors.phone);
  const ok = readDriver({ firstName: " Ali ", lastName: "Çelik", nationalId: "100 000 001 46", phone: "0532 123 45 67" });
  assert.equal(ok.ok, true);
  assert.equal(ok.value.nationalId, "10000000146", "TC metin olarak, boşluksuz");
  assert.equal(ok.value.firstName, "Ali");
});

test("Sürücü: aynı TC iki kez kaydedilemez; işlem geçmişine TC yazılmaz", async () => {
  const { repo, ctx, ids } = await seed();
  await assert.rejects(
    runOperation(ctx, "driver.save", { firstName: "X", lastName: "Y", nationalId: ids.ali.nationalId, phone: "05320000000" }),
    /zaten kayıtlı|başka bir sürücüde/,
  );
  const audit = await listAudit(repo, 1000);
  assert.ok(audit.length > 20);
  const allText = JSON.stringify(audit);
  for (const d of [ids.ahmet, ids.mehmet, ids.ayse, ids.ali]) {
    assert.ok(!allText.includes(d.nationalId), "TC işlem geçmişinde yok");
    assert.ok(!allText.includes(d.phone), "telefon işlem geçmişinde yok");
  }
});

test("Firestore değer kodlaması gidiş-dönüş", () => {
  const doc = { id: "a", n: 650000, f: 1.5, s: "Çağrı", b: true, z: null, arr: [1, "x"], m: { k: 2 } };
  assert.deepEqual(decodeFields(encodeFields(doc)), doc);
  assert.deepEqual(encodeFields({ n: 3 }).n, { integerValue: "3" });
});

test("Giriş: scrypt şifre, imzalı oturum, sürüm, süre, deneme freni", () => {
  const hash = hashPassword("Gizli-Şifre 42", randomBytes(16), 1024);
  assert.ok(verifyPassword("Gizli-Şifre 42", hash));
  assert.ok(!verifyPassword("gizli-şifre 42", hash));
  assert.ok(!verifyPassword("x", "scrypt:bozuk"));
  const config = authConfig({ FLEET_PASSWORD_HASH: hash, FLEET_SESSION_SECRET: "s".repeat(40) });
  assert.ok(config);
  assert.equal(authConfig({ FLEET_PASSWORD_HASH: hash, FLEET_SESSION_SECRET: "kısa" }), null, "zayıf gizli anahtar reddedilir");
  assert.equal(authConfig({}), null);
  const now = Date.now();
  const token = createSessionToken(config, now);
  assert.ok(verifySessionToken(token, config, now));
  assert.ok(!verifySessionToken(token, config, now + 15 * 86_400_000), "süresi dolan oturum geçersiz");
  assert.ok(!verifySessionToken(token, { ...config, version: "2" }, now), "sürüm değişince tüm oturumlar düşer");
  assert.ok(!verifySessionToken(token, { ...config, secret: "t".repeat(40) }, now));
  const [payload, sig] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ v: "1", exp: now + 1e12 })).toString("base64url");
  assert.ok(!verifySessionToken(`${forged}.${sig}`, config, now), "değiştirilmiş içerik reddedilir");
  assert.ok(!verifySessionToken(payload, config, now));
  assert.ok(!verifySessionToken(null, config, now));
  for (let i = 0; i < 8; i++) recordFailedLogin("1.2.3.4", now);
  assert.ok(loginThrottled("1.2.3.4", now));
  assert.ok(!loginThrottled("1.2.3.4", now + 16 * 60_000));
});

test("Excel dışa aktarma: geçerli zip ve içerik", async () => {
  const { repo } = await seed();
  const data = await loadData(repo);
  const view = buildView(data, TODAY);
  const report = buildReport(data, view, "2026-10-01", "2026-11-30");
  const sheets = reportSheets(data, view, report);
  const bytes = buildXlsx(sheets);
  assert.equal(bytes[0], 0x50);
  assert.equal(bytes[1], 0x4b);
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
  const text = new TextDecoder().decode(bytes);
  assert.ok(text.includes("Kasa hareketleri"));
  for (const d of data.drivers) assert.ok(!text.includes(d.nationalId), "dışa aktarmada TC yok");
  const fs = await import("node:fs/promises");
  if (process.env.FLEET_XLSX_OUT) await fs.writeFile(process.env.FLEET_XLSX_OUT, bytes);
});

test("Bildirim: yapılandırılmamış kanal gönderilmiş gibi davranmaz", async () => {
  delete process.env.FLEET_ALERT_EMAIL;
  const result = await emailChannel.send("x", [{ kind: "overdue", severity: "danger", title: "<b>", detail: "d", href: "/" }]);
  assert.equal(result.status, "not_configured");
  assert.ok(!digestHtml([{ kind: "overdue", severity: "danger", title: "<script>", detail: "x", href: "/" }], "https://a").includes("<script>"));
  assert.equal(formatTRY(650000).replace(/\s/g, " "), "₺6.500,00");
});

test("Dosya deposu: kayıtlar diske yazılır, yeniden açınca aynen gelir", async () => {
  const { FileRepo } = await import("../../src/lib/fleet/store.ts");
  const os = await import("node:os");
  const path = await import("node:path");
  const fs = await import("node:fs/promises");
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "fleet-"));
  const file = path.join(dir, "data.json");
  const ctx = { repo: new FileRepo(file), now: NOW };
  const v = await runOperation(ctx, "vehicle.save", { plate: "06 ZZ 100", brand: "A", model: "B", dailyRate: "500" });
  await Promise.all([
    runOperation(ctx, "expense.create", { date: TODAY, vehicleId: v.id, category: "Yağ", description: "1", amount: "10" }),
    runOperation(ctx, "expense.create", { date: TODAY, vehicleId: v.id, category: "Yağ", description: "2", amount: "20" }),
  ]);
  const again = await loadData(new FileRepo(file));
  assert.equal(again.vehicles[0].plate, "06 ZZ 100");
  assert.equal(again.expenses.length, 2, "eşzamanlı yazımlar kaybolmaz");
  await assert.rejects(ctx.repo.create("vehicles", { id: v.id }), /zaten var/);
});
