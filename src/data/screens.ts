import type { StaticImageData } from "next/image";
import type { Localized } from "@/lib/i18n";

import meetzyAuth from "@/assets/work/meetzy/01-auth.jpg";
import meetzyMood from "@/assets/work/meetzy/02-mood.jpg";
import meetzyMap from "@/assets/work/meetzy/03-map.jpg";
import meetzyProfile from "@/assets/work/meetzy/04-profile-detail.jpg";
import meetzyNearby from "@/assets/work/meetzy/05-nearby.jpg";
import meetzyFeed from "@/assets/work/meetzy/06-feed.jpg";
import meetzyMemories from "@/assets/work/meetzy/07-memories.jpg";
import meetzyProblem from "@/assets/work/meetzy/store-01-problem.jpg";
import meetzyPlan from "@/assets/work/meetzy/store-02-plan.jpg";
import meetzyReal from "@/assets/work/meetzy/store-03-real.jpg";
import meetzyJoin from "@/assets/work/meetzy/store-04-join.jpg";

import erdenHome from "@/assets/work/erden/01-home.jpg";
import erdenCategories from "@/assets/work/erden/02-categories.jpg";
import erdenCollections from "@/assets/work/erden/03-collections.jpg";
import erdenStyles from "@/assets/work/erden/04-styles.jpg";
import erdenProducts from "@/assets/work/erden/05-products.jpg";
import erdenSupport from "@/assets/work/erden/06-support.jpg";
import erdenNavigation from "@/assets/work/erden/07-navigation.jpg";
import erdenFooter from "@/assets/work/erden/08-footer.jpg";
import erdenAdmin from "@/assets/work/erden/09-admin.jpg";

import dpBoard from "@/assets/work/dppano/01-board.jpg";
import dpStaffroom from "@/assets/work/dppano/02-staffroom.jpg";
import dpCanteen from "@/assets/work/dppano/03-canteen.jpg";
import dpScreens from "@/assets/work/dppano/04-screens.jpg";
import dpLayout from "@/assets/work/dppano/05-layout.jpg";
import dpTimetable from "@/assets/work/dppano/06-timetable.jpg";
import dpSolver from "@/assets/work/dppano/07-solver.jpg";
import dpDuty from "@/assets/work/dppano/08-duty.jpg";
import dpDutyPrint from "@/assets/work/dppano/09-duty-print.jpg";
import dpSafeMode from "@/assets/work/dppano/10-safe-mode.jpg";
import dpPermissions from "@/assets/work/dppano/11-permissions.jpg";

import agOverview from "@/assets/work/aracimgo/01-overview.jpg";
import agCustomers from "@/assets/work/aracimgo/02-customers.jpg";
import agHistory from "@/assets/work/aracimgo/03-history.jpg";
import agWorkOrders from "@/assets/work/aracimgo/04-work-orders.jpg";
import agPlateSearch from "@/assets/work/aracimgo/05-plate-search.jpg";
import agWhy from "@/assets/work/aracimgo/06-why.jpg";
import agSite from "@/assets/work/aracimgo/site.jpg";
import agPanel from "@/assets/work/aracimgo/panel.jpg";
import agPanelOrder from "@/assets/work/aracimgo/panel-work-order.jpg";
import agAppDiscover from "@/assets/work/aracimgo/app-discover.jpg";
import agAppToday from "@/assets/work/aracimgo/app-today.jpg";
import agAppOrder from "@/assets/work/aracimgo/app-work-order.jpg";
import agAppPassport from "@/assets/work/aracimgo/app-passport.jpg";

import oySite from "@/assets/work/oyundal/site.jpg";
import oyGames from "@/assets/work/oyundal/games.jpg";
import oyHome from "@/assets/work/oyundal/app-home.jpg";
import oyGame from "@/assets/work/oyundal/app-game.jpg";
import oyTable from "@/assets/work/oyundal/app-table.jpg";
import oyPanel from "@/assets/work/oyundal/panel.jpg";
import dpPlate1 from "@/assets/work/dppano/plate-1.jpg";
import dpPlate2 from "@/assets/work/dppano/plate-2.jpg";
import dpPlate3 from "@/assets/work/dppano/plate-3.jpg";
import dpPlate4 from "@/assets/work/dppano/plate-4.jpg";
import erPlate1 from "@/assets/work/erden/plate-1.jpg";
import erPlate2 from "@/assets/work/erden/plate-2.jpg";
import erPlate3 from "@/assets/work/erden/plate-3.jpg";
import erPlate4 from "@/assets/work/erden/plate-4.jpg";
import oyPlate1 from "@/assets/work/oyundal/plate-1.jpg";
import oyPlate2 from "@/assets/work/oyundal/plate-2.jpg";
import oyPlate3 from "@/assets/work/oyundal/plate-3.jpg";
import oyPlate4 from "@/assets/work/oyundal/plate-4.jpg";
import dpWide from "@/assets/work/dppano/wide.jpg";
import erWide from "@/assets/work/erden/wide.jpg";
import mzSite from "@/assets/work/meetzy/site.jpg";


/**
 * Every real product screen on the site, in one place.
 *
 * These are captures of shipped software, not mockups. Two things are true of
 * them and are stated wherever they appear:
 *
 * - They arrived as WhatsApp images at 942px wide, so they are never blown up
 *   past device scale. Compression artefacts would be the first thing a
 *   visitor noticed, and a soft screenshot undoes the argument it is making.
 * - Meetzy is a social product. Captures showing users' faces are not used at
 *   all; captures carrying names in list rows are pixelated over those rows by
 *   `scripts/prepare-assets.mjs`, and the site says so where they appear.
 *
 * Meetzy's main images are the exception to the first point: its App Store
 * set, designed plates at 1290x2796 whose people are stock photography rather
 * than users. They lead wherever Meetzy is shown; the captures follow them.
 */

export type Screen = {
  image: StaticImageData;
  /** What this screen actually shows. Descriptive, never a claim. */
  caption: Localized;
  /** True when the capture carries a deliberate redaction. */
  redacted?: boolean;
};

export const MEETZY: Record<string, Screen> = {
  problem: {
    image: meetzyProblem,
    caption: {
      en: "Going to the concert, and your friend isn't coming?",
      tr: "Konsere gideceksin, arkadaşın gelmiyor mu?",
    },
  },
  plan: {
    image: meetzyPlan,
    caption: {
      en: "Make the plan. Find your crew on Meetzy.",
      tr: "Planını oluştur. Ekibini Meetzy'de bul.",
    },
  },
  real: {
    image: meetzyReal,
    caption: {
      en: "Get off the screen. Make the plan real.",
      tr: "Ekrandan çık. Planın gerçek olsun.",
    },
  },
  join: {
    image: meetzyJoin,
    caption: {
      en: "Don't cancel because your friends are busy",
      tr: "Arkadaşların müsait değil diye planını iptal etme",
    },
  },
  mood: {
    image: meetzyMood,
    caption: { en: "Mood-led discovery", tr: "Ruh hâline göre keşif" },
  },
  nearby: {
    image: meetzyNearby,
    caption: { en: "Events near you, by distance", tr: "Yakınındaki etkinlikler, mesafeye göre" },
    redacted: true,
  },
  feed: {
    image: meetzyFeed,
    caption: { en: "Asking to join", tr: "Katılma talebi" },
    redacted: true,
  },
  map: {
    image: meetzyMap,
    caption: { en: "Events on the map", tr: "Haritada etkinlikler" },
  },
  profile: {
    image: meetzyProfile,
    caption: { en: "What a profile actually says", tr: "Profilin gerçekten söylediği" },
  },
  memories: {
    image: meetzyMemories,
    caption: { en: "City memories", tr: "Şehir anıları" },
  },
  auth: {
    image: meetzyAuth,
    caption: { en: "Sign in", tr: "Giriş" },
  },
};

export const ERDEN: Record<string, Screen> = {
  home: {
    image: erdenHome,
    caption: { en: "The storefront", tr: "Vitrin" },
  },
  categories: {
    image: erdenCategories,
    caption: { en: "Browse by occasion", tr: "Törene göre keşif" },
  },
  collections: {
    image: erdenCollections,
    caption: { en: "Collections", tr: "Koleksiyonlar" },
  },
  styles: {
    image: erdenStyles,
    caption: { en: "Browse by style", tr: "Tarza göre keşif" },
  },
  products: {
    image: erdenProducts,
    caption: { en: "Catalogue and pricing", tr: "Katalog ve fiyatlandırma" },
  },
  support: {
    image: erdenSupport,
    caption: { en: "A designer, not a bot", tr: "Bot değil, tasarımcı" },
  },
  navigation: {
    image: erdenNavigation,
    caption: { en: "Catalogue navigation", tr: "Katalog navigasyonu" },
  },
  footer: {
    image: erdenFooter,
    caption: { en: "Site index", tr: "Site indeksi" },
  },
  admin: {
    image: erdenAdmin,
    caption: {
      en: "Admin — orders, designs, products, categories, coupons, customers, reviews, analytics",
      tr: "Yönetim — sipariş, tasarım, ürün, kategori, kupon, müşteri, yorum, analitik",
    },
    redacted: true,
  },
  wide: { image: erWide, caption: { en: "Erden Davetiye: the storefront", tr: "Erden Davetiye vitrini" } },
  plate1: { image: erPlate1, caption: { en: "Designing the invitation together", tr: "Davetiyeyi birlikte tasarlamak" } },
  plate2: { image: erPlate2, caption: { en: "Choosing by style", tr: "Tarza göre seçim" } },
  plate3: { image: erPlate3, caption: { en: "A model made your own", tr: "Modeli kendi adınıza çevirmek" } },
  plate4: { image: erPlate4, caption: { en: "The atelier's admin", tr: "Atölyenin yönetim paneli" } },
};

/**
 * DP Pano — a live product, captured in the browser.
 *
 * Every screen here was produced against demo data, so unlike Meetzy none of
 * it is redacted: there is no real pupil, teacher or school anywhere in the
 * set. That is a fact about the captures, not a design decision, and it is why
 * a product whose whole argument is about personal data can be shown at full
 * size without a single mosaic on it.
 */
export const DPPANO: Record<string, Screen> = {
  board: {
    image: dpBoard,
    caption: {
      en: "One board: announcements, timetable, duty roster, menu and weather",
      tr: "Genel pano: duyuru, ders programı, nöbet, menü ve hava durumu",
    },
  },
  staffroom: {
    image: dpStaffroom,
    caption: {
      en: "The staffroom screen: cover plan, bell schedule, the week's duties",
      tr: "Öğretmenler odası ekranı: ikame planı, zil çizelgesi, haftalık nöbet",
    },
  },
  canteen: {
    image: dpCanteen,
    caption: {
      en: "The canteen screen: price list, today's offer, nutrition cards",
      tr: "Kantin ekranı: fiyat listesi, günün fırsatı, beslenme kartları",
    },
  },
  screens: {
    image: dpScreens,
    caption: {
      en: "One school, several screens, each with its own layout",
      tr: "Bir okulun birden çok ekranı, her biri kendi düzeniyle",
    },
  },
  layout: {
    image: dpLayout,
    caption: {
      en: "The layout editor: modules placed region by region",
      tr: "Düzen editörü: bölge bölge modül yerleşimi",
    },
  },
  timetable: {
    image: dpTimetable,
    caption: {
      en: "The weekly timetable: pick a lesson, the teacher resolves",
      tr: "Haftalık ders programı: ders seçilir, öğretmen otomatik çözülür",
    },
  },
  solver: {
    image: dpSolver,
    caption: {
      en: "School-wide solver: a clash-free schedule for every class",
      tr: "Okul geneli çözücü: tüm şubeler için çakışmasız çizelge üretimi",
    },
  },
  duty: {
    image: dpDuty,
    caption: {
      en: "Automatic duty allocation — preview, and what it could not place",
      tr: "Otomatik nöbetçi dağıtımı — önizleme ve karşılanamayan bulgular",
    },
  },
  dutyPrint: {
    image: dpDutyPrint,
    caption: {
      en: "The duty roster as landscape A4, ready for the wall",
      tr: "Duvara asılacak hâlde yatay A4 nöbet çizelgesi çıktısı",
    },
  },
  safeMode: {
    image: dpSafeMode,
    caption: {
      en: "Safe mode, screen PIN and the school-network restriction",
      tr: "Güvenli mod, ekran PIN'i ve okul ağı (IP) kısıtı",
    },
  },
  permissions: {
    image: dpPermissions,
    caption: {
      en: "Staff accounts, with permission granted module by module",
      tr: "Modül bazlı yetki matrisi ile personel hesapları",
    },
  },
  wide: { image: dpWide, caption: { en: "DP Pano on the board, in the canteen and on the phone", tr: "DP Pano: tahtada, kantinde ve telefonda" } },
  plate1: { image: dpPlate1, caption: { en: "The smart board becomes the school board", tr: "Akıllı tahta okulun panosu oluyor" } },
  plate2: { image: dpPlate2, caption: { en: "Written once, on every screen at once", tr: "Bir kez yaz, her ekranda anında" } },
  plate3: { image: dpPlate3, caption: { en: "The timetable, generated", tr: "Kendiliğinden hazırlanan ders programı" } },
  plate4: { image: dpPlate4, caption: { en: "Duty rota and its printout", tr: "Nöbet dağılımı ve çıktısı" } },
};

/**
 * AracımGo — a live product; these are its own designed plates.
 *
 * Six 1080x1920 plates made by the product's team, each pairing a photograph
 * of a real workshop with the app's screen and one line of its copy. They are
 * shown whole: the words on them are part of the design and a crop would cut
 * them. The screens drawn on them carry sample records ("06 ABC 123"), not a
 * customer's data.
 */
export const ARACIMGO: Record<string, Screen> = {
  overview: { image: agOverview, caption: { en: "AracımGo app: find a workshop near you", tr: "AracımGo uygulaması: yakındaki ustayı bul" } },
  customers: { image: agCustomers, caption: { en: "Write to the workshop directly, in the app", tr: "Servise uygulamadan doğrudan yaz" } },
  history: { image: agHistory, caption: { en: "The vehicle passport: every service on record", tr: "Araç karnesi: yapılan her bakım kayıtta" } },
  workOrders: { image: agWorkOrders, caption: { en: "For mechanics: the whole day on one screen", tr: "Ustalar için: bütün gün tek ekranda" } },
  plateSearch: { image: agPlateSearch, caption: { en: "Online booking with the workshop", tr: "Servisten online randevu" } },
  why: { image: agWhy, caption: { en: "The same workshop, managed from the computer", tr: "Aynı servis, bilgisayardan yönetiliyor" } },
  site: { image: agSite, caption: { en: "aracımgo.com, November 2026", tr: "aracımgo.com, Kasım 2026" } },
  panel: { image: agPanel, caption: { en: "The workshop panel: today at a glance", tr: "Servis paneli: günün özeti" } },
  panelOrder: { image: agPanelOrder, caption: { en: "A work order with parts and labour", tr: "Parça ve işçilikle bir iş emri" } },
  appDiscover: { image: agAppDiscover, caption: { en: "Driver app: find a service", tr: "Sürücü uygulaması: servis bul" } },
  appToday: { image: agAppToday, caption: { en: "Mechanic app: today", tr: "Usta uygulaması: bugün" } },
  appOrder: { image: agAppOrder, caption: { en: "Mechanic app: a work order", tr: "Usta uygulaması: iş emri" } },
  appPassport: { image: agAppPassport, caption: { en: "Driver app: vehicle passport", tr: "Sürücü uygulaması: araç karnesi" } },
};

export const OYUNDAL: Record<string, Screen> = {
  site: { image: oySite, caption: { en: "oyundal.com, November 2026", tr: "oyundal.com, Kasım 2026" } },
  games: { image: oyGames, caption: { en: "The catalogue of 37 games", tr: "37 oyunluk katalog" } },
  home: { image: oyHome, caption: { en: "What a guest sees after scanning the QR", tr: "QR okutulduktan sonra misafirin gördüğü ekran" } },
  game: { image: oyGame, caption: { en: "A game, opened in the browser", tr: "Tarayıcıda açılan bir oyun" } },
  table: { image: oyTable, caption: { en: "Choosing the table", tr: "Masa seçimi" } },
  panel: { image: oyPanel, caption: { en: "Owner panel: report across branches (sample data)", tr: "İşletme paneli: şube raporu (örnek veri)" } },
  plate1: { image: oyPlate1, caption: { en: "Oyundal at the table", tr: "Masada Oyundal" } },
  plate2: { image: oyPlate2, caption: { en: "37 games behind one QR", tr: "Tek QR'da 37 oyun" } },
  plate3: { image: oyPlate3, caption: { en: "Scan, choose the table, play", tr: "QR'ı okut, masanı seç, oyna" } },
  plate4: { image: oyPlate4, caption: { en: "Every branch in one panel", tr: "Bütün şubeler tek panelde" } },
};

export const MEETZY_SITE: Screen = { image: mzSite, caption: { en: "meetzy.tr, November 2026", tr: "meetzy.tr, Kasım 2026" } };
