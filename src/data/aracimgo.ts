import type { Localized } from "@/lib/i18n";
import { ARACIMGO, type Screen } from "@/data/screens";

export { ARACIMGO_DOMAIN, ARACIMGO_URL } from "@/data/aracimgo-url";

/**
 * AracımGo's product page, as copy.
 *
 * The page is told in the order a workshop owner meets the product: what goes
 * wrong in a service today, then the four things AracımGo does about it, each
 * with the product's own plate beside it, then the whole of it in one look.
 * The lines in quotation marks are the product's own copy, taken from its
 * plates; nothing here claims a number — no customer count, no time saved —
 * because none has been measured.
 *
 * `scene` is a usage scenario and is labelled as one on the page: an ordinary
 * morning in a workshop, told with the sample records the plates themselves
 * show ("06 ABC 123"), not a customer's story.
 */

export type AracimGoCapability = { title: Localized; body: Localized };

export type AracimGoChapter = {
  id: string;
  index: string;
  label: Localized;
  /** The product's own line, set as the chapter's headline. */
  line: Localized;
  body: Localized;
  scene: Localized;
  plate: Screen;
};

export const ARACIMGO_COPY = {
  badge: { en: "Live product", tr: "Canlı ürün" },
  title: "AracımGo",
  subtitle: { en: "Run the service from one place.", tr: "Oto servisini tek yerden yönet." },
  description: {
    en: "From customers to vehicles, from work orders to a digital history for every car — the whole service operation in one system.",
    tr: "Müşterilerden araçlara, iş emirlerinden dijital araç geçmişine kadar servis operasyonunu tek bir sistemde yönetin.",
  },
  inspect: { en: "Explore AracımGo", tr: "AracımGo'yu İncele" },
  open: { en: "Open AracımGo", tr: "AracımGo'yu Aç" },
  build: { en: "Build your product with Archon Soft", tr: "ArchonSoft ile Projeni Geliştir" },
  by: { en: "Built and run by Archon Soft", tr: "Archon Soft tarafından geliştirildi ve yürütülüyor" },

  capabilitiesLabel: { en: "What it does", tr: "Ne yapar" },
  capabilitiesLead: {
    en: "Six things a workshop stops keeping in its head.",
    tr: "Bir servisin artık aklında tutmak zorunda olmadığı altı şey.",
  },
  capabilities: [
    {
      title: { en: "Customer management", tr: "Müşteri Yönetimi" },
      body: {
        en: "Keep customers, their vehicles and every past job in one place.",
        tr: "Müşterilerini, araçlarını ve geçmiş işlemlerini tek yerde tut.",
      },
    },
    {
      title: { en: "Vehicle history", tr: "Araç Geçmişi" },
      body: {
        en: "Follow every job done on each vehicle, in order.",
        tr: "Her aracın yapılan işlemlerini kronolojik olarak takip et.",
      },
    },
    {
      title: { en: "Work orders", tr: "İş Emri Takibi" },
      body: {
        en: "See which vehicle is at which stage, on one screen.",
        tr: "Hangi aracın hangi durumda olduğunu tek ekrandan gör.",
      },
    },
    {
      title: { en: "Plate search", tr: "Plaka ile Arama" },
      body: {
        en: "Type the plate and reach the customer and the vehicle's history in seconds.",
        tr: "Plakayı yaz, müşteri ve araç geçmişine saniyeler içinde ulaş.",
      },
    },
    {
      title: { en: "Service operations", tr: "Servis Operasyonu" },
      body: {
        en: "Keep the day's service work in order.",
        tr: "Günlük servis işlerini daha düzenli takip et.",
      },
    },
    {
      title: { en: "Digital vehicle history", tr: "Dijital Araç Geçmişi" },
      body: {
        en: "Take a vehicle's history out of the workshop's memory and onto the record.",
        tr: "Araç geçmişini servis hafızasından çıkarıp kayıt altına al.",
      },
    },
  ] satisfies AracimGoCapability[],

  problemLabel: { en: "What happens in a workshop?", tr: "Serviste ne oluyor?" },
  problemLine: {
    en: "A car comes back a year later. What was done to it?",
    tr: "Bir araç bir yıl sonra geri geliyor. Üzerinde ne yapılmıştı?",
  },
  problems: [
    {
      en: "The customer's number is in one notebook, the job in another.",
      tr: "Müşterinin numarası bir defterde, yapılan iş başka birinde.",
    },
    {
      en: "Which car is waiting for a part lives in someone's head.",
      tr: "Hangi aracın parça beklediği birinin aklında.",
    },
    {
      en: "When the work piles up, so does the confusion.",
      tr: "İşler çoğaldıkça karışıklık da çoğalıyor.",
    },
  ] satisfies Localized[],
  problemAnswer: { en: "AracımGo remembers.", tr: "AracımGo aklında tutar." },

  sceneLabel: { en: "In use", tr: "Kullanım senaryosu" },

  chapters: [
    {
      id: "customers",
      index: "03",
      label: { en: "Customer management", tr: "Müşteri Yönetimi" },
      line: {
        en: "You don't have to remember the customer. AracımGo does.",
        tr: "Müşteriyi hatırlamak zorunda değilsin. AracımGo hatırlar.",
      },
      body: {
        en: "Every customer with their vehicles and the jobs done on them, on one card. The name, the car and the last visit are there before the customer finishes saying hello.",
        tr: "Her müşteri; araçları ve bu araçlarda yapılan işlerle birlikte tek kartta. İsim, araç ve son ziyaret, müşteri daha selam vermeden ekranda.",
      },
      scene: {
        en: "Ahmet Yılmaz brings his 2018 Volkswagen Golf back. The card already shows the last job — oil and filter change — and the date it was done.",
        tr: "Ahmet Yılmaz 2018 model Volkswagen Golf'üyle yeniden geliyor. Kartında son işlem — yağ ve filtre değişimi — ve tarihi zaten duruyor.",
      },
      plate: ARACIMGO.customers!,
    },
    {
      id: "history",
      index: "04",
      label: { en: "Vehicle history", tr: "Araç Geçmişi" },
      line: { en: "What was done to this car?", tr: "Bu araçta ne yapılmıştı?" },
      body: {
        en: "Every vehicle has a history, kept year by year: brakes, oil, suspension, battery, tyres. No more trying to remember — open the car and read it.",
        tr: "Her aracın yıl yıl tutulan bir geçmişi var: fren, yağ, ön takım, akü, lastik. Artık hatırlamaya çalışmak yok — aracı aç, geçmişini oku.",
      },
      scene: {
        en: "06 ABC 123 is in for a noise at the front. The history shows the front-end check from this year and the battery change from last — the diagnosis starts from there.",
        tr: "06 ABC 123 önden gelen bir sesle geliyor. Geçmişte bu yılki ön takım kontrolü ve geçen yılki akü değişimi görünüyor — teşhis oradan başlıyor.",
      },
      plate: ARACIMGO.history!,
    },
    {
      id: "work-orders",
      index: "05",
      label: { en: "Work orders", tr: "İş Emri Takibi" },
      line: {
        en: "When the work piles up, don't let the confusion start.",
        tr: "İşler çoğaldığında karışıklık başlamasın.",
      },
      body: {
        en: "Which car is in progress, which is waiting, which is done — every open job on one screen, with its status, so nobody has to walk the floor to find out.",
        tr: "Hangi araç devam ediyor, hangisi bekliyor, hangisi bitti — açık her iş, durumuyla birlikte tek ekranda. Öğrenmek için kimsenin atölyeyi dolaşması gerekmiyor.",
      },
      scene: {
        en: "Three cars on the floor at noon: one oil change in progress, one brake check waiting for a part, one service finished and ready to hand back.",
        tr: "Öğlen atölyede üç araç: biri yağ değişiminde, biri parça bekleyen fren kontrolünde, biri periyodik bakımı bitmiş, teslime hazır.",
      },
      plate: ARACIMGO.workOrders!,
    },
    {
      id: "plate-search",
      index: "06",
      label: { en: "Plate search", tr: "Plaka ile Arama" },
      line: {
        en: "Type the plate. AracımGo finds the rest.",
        tr: "Plakayı yaz. Gerisini AracımGo bulsun.",
      },
      body: {
        en: "The plate is the one thing everyone knows. Type it, and the customer, the vehicle and its past jobs come back in seconds — find it in a second, not in an hour.",
        tr: "Plaka herkesin bildiği tek şey. Yazıyorsun; müşteri, araç ve geçmiş işlemler saniyeler içinde geliyor — saniyede bul, saatlerce arama.",
      },
      scene: {
        en: "A call: “Is my car ready?” You type 06 ABC 123 while they are still talking, and the answer is on the screen.",
        tr: "Telefon çalıyor: “Aracım hazır mı?” Müşteri daha konuşurken 06 ABC 123 yazıyorsun; cevap ekranda.",
      },
      plate: ARACIMGO.plateSearch!,
    },
  ] satisfies AracimGoChapter[],

  summaryLabel: { en: "In one look", tr: "Özetle" },
  summaryLine: {
    en: "You focus on the work. AracımGo keeps track of the rest.",
    tr: "Sen işine odaklan. Gerisini AracımGo takip etsin.",
  },
  summaryBody: {
    en: "Customer records, vehicle history and work orders — written into a system, not a notebook. Tidier, faster, more in control.",
    tr: "Müşteri kayıtları, araç geçmişi ve iş emirleri — deftere değil, sisteme yazılıyor. Daha düzenli, daha hızlı, daha fazla kontrol.",
  },
  summaryList: [
    { en: "Customer records", tr: "Müşteri kayıtları" },
    { en: "Vehicle history", tr: "Araç geçmişi" },
    { en: "Work orders", tr: "İş emirleri" },
    { en: "Plate search", tr: "Plaka ile arama" },
  ] satisfies Localized[],
  summaryPlate: ARACIMGO.why!,
  overviewPlate: ARACIMGO.overview!,

  factsLabel: { en: "The product", tr: "Ürün" },
  facts: [
    { label: { en: "Status", tr: "Durum" }, value: { en: "Live", tr: "Canlı" } },
    { label: { en: "For", tr: "Kimin için" }, value: { en: "Car and motorcycle workshops", tr: "Oto ve motosiklet servisleri" } },
    { label: { en: "Surfaces", tr: "Yüzeyler" }, value: { en: "Mobile app and web panel", tr: "Mobil uygulama ve web paneli" } },
    { label: { en: "Built on", tr: "Altyapı" }, value: { en: "Flutter · Next.js · PostgreSQL", tr: "Flutter · Next.js · PostgreSQL" } },
  ],

  studioLabel: { en: "Archon Soft", tr: "Archon Soft" },
  studioLine: {
    en: "We don't only write software. We build real products for real problems.",
    tr: "ArchonSoft olarak yalnızca yazılım geliştirmiyoruz. Gerçek problemlere gerçek ürünler geliştiriyoruz.",
  },
  studioBody: {
    en: "AracımGo started as a question every workshop asks — what was done to this car? — and is now a live product. That is the whole of what we do: an idea, taken all the way to something people can use.",
    tr: "AracımGo her servisin sorduğu bir soruyla başladı — bu araçta ne yapılmıştı? — ve bugün canlıda çalışan bir ürün. Yaptığımız işin tamamı bu: bir fikri, insanların kullanabileceği bir şeye kadar götürmek.",
  },
  ctaLine: { en: "Out of the notebook, into the system.", tr: "Deftere değil, sisteme yaz." },
  ctaBody: {
    en: "AracımGo is live. Open it and see the service the way it looks from the inside.",
    tr: "AracımGo canlıda. Aç, servisi içeriden nasıl göründüğüyle gör.",
  },
};
