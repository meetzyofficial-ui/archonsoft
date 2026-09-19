import type { Localized, LocalizedList } from "@/lib/i18n";
import { ARACIMGO, DPPANO, ERDEN, MEETZY, type Screen } from "@/data/screens";
import { ARACIMGO_URL } from "@/data/aracimgo-url";

/**
 * Case-study data.
 *
 * Every claim here is either (a) something the person who built these products
 * told me directly, or (b) something visible in the screenshots. Nothing else.
 *
 * Specifically absent, because nobody confirmed them: technology stacks,
 * growth curves, retention, revenue, conversion, order counts, customer
 * counts, sales uplift, store rankings, testimonials and project durations.
 * `facts` carries only figures that were given, and the template simply shows
 * fewer rows when there are fewer facts.
 */

export type Fact = { label: Localized; value: Localized };

export type CaseSection = {
  index: string;
  title: Localized;
  body: LocalizedList;
};

export type Project = {
  slug: string;
  name: string;
  category: Localized;
  summary: Localized;
  standfirst: Localized;
  /** One sentence, set large. The argument of the whole project. */
  statement: Localized;
  /** Verified figures only. */
  facts: Fact[];
  role: Localized;
  system: Localized;
  platform: Localized;
  /** The product's own colour, used only inside its own chapter. */
  accent: string;
  /**
   * Which of the eight domains this work belongs to.
   *
   * A classification of what is already described elsewhere on this site, not
   * a new claim: Meetzy is a product with a system behind it, Erden is
   * commerce with a system behind it, and both of those are stated in their
   * own case studies. It exists so the work index can be filtered by the same
   * vocabulary the capability pages use.
   */
  domains: string[];
  /** Screens, in the order they dock onto the board. */
  screens: Screen[];
  /** The screen the hero and the case-study opening assemble. */
  lead: Screen;
  /** Further screens for the case study, after the board. */
  detail: Screen[];
  /**
   * The areas the shipped system actually contains.
   *
   * Every entry here is either something the person who built it stated, or
   * something plainly visible in the screenshots on this site. Nothing is
   * inferred, and there is no entry for a capability that merely seems likely.
   */
  systemAreas?: {
    title: Localized;
    /** What the system holds under this area. Confirmed or visible only. */
    areas: Localized[];
    note: Localized;
    /** The screen that evidences it. */
    screen: Screen;
  };
  /**
   * Which composition the home page gives this work.
   *
   * An art-direction decision, written down rather than inferred: `bleed` runs
   * a landscape capture the full width of the frame with the name across it,
   * `stack` runs a column of handset screens beside a name that stays put, and
   * `split` is a two-column spread with the pictures offset against the type.
   * Three products that look nothing alike are not presented as though they
   * did, and the reason each one gets what it gets lives next to the work.
   */
  layout: "bleed" | "stack" | "split";
  sections: CaseSection[];
  link?: { label: string; href: string };
  /**
   * A second, softer call to action: somewhere the visitor can use the product
   * itself rather than read about it.
   *
   * Separate from `link` because the two are not the same offer — one is the
   * product's front door and the other is a running instance of the thing this
   * page is describing. Only work that has such a thing carries it.
   */
  demo?: { label: Localized; href: string; note: Localized };
  /**
   * The technology the work is actually built on.
   *
   * Only ever filled in from what the person who built it stated. Absent on
   * every project where nobody confirmed it, which is why the template renders
   * nothing rather than a plausible list.
   */
  stack?: Fact[];
  /**
   * Size, in the units the codebase itself counts in.
   *
   * Not a business metric and deliberately not presented as one: tables,
   * migrations and tests are facts about a repository, and they are the only
   * kind of number this site is in a position to verify.
   */
  scale?: { label: Localized; value: string }[];
};

export const PROJECTS: Project[] = [
  {
    slug: "aracimgo",
    name: "AracımGo",
    domains: ["products", "systems"],
    category: { en: "Automotive · Service management", tr: "Otomotiv · Servis Yönetimi" },
    summary: {
      en: "Car service management, in one place: customers, vehicles, work orders and a digital history for every car.",
      tr: "Oto servis yönetimi, tek yerde: müşteriler, araçlar, iş emirleri ve her araç için dijital geçmiş.",
    },
    standfirst: {
      en: "AracımGo is a service-management product for car and motorcycle workshops, built and run by Archon Soft. Customers, vehicles, work orders and every job ever done on a car live in one system instead of in a notebook and the mechanic's memory. It is live, on the web and on the phone.",
      tr: "AracımGo, oto ve motosiklet servisleri için Archon Soft'un geliştirip yürüttüğü bir servis yönetimi ürünü. Müşteriler, araçlar, iş emirleri ve bir araçta yapılmış her işlem; defterde ve ustanın hafızasında değil, tek bir sistemde duruyor. Canlıda — web'de ve telefonda.",
    },
    statement: {
      en: "The notebook forgets. AracımGo remembers.",
      tr: "Defter unutur. AracımGo aklında tutar.",
    },
    facts: [
      { label: { en: "Status", tr: "Durum" }, value: { en: "Live", tr: "Canlı" } },
      { label: { en: "For", tr: "Kullanıcı" }, value: { en: "Car and motorcycle workshops", tr: "Oto ve motosiklet servisleri" } },
      { label: { en: "Interface", tr: "Arayüz dili" }, value: { en: "Turkish", tr: "Türkçe" } },
    ],
    role: {
      en: "Product, design, engineering and operation",
      tr: "Ürün, tasarım, geliştirme ve işletim",
    },
    system: {
      en: "Customers, vehicles, work orders, vehicle history",
      tr: "Müşteriler, araçlar, iş emirleri, araç geçmişi",
    },
    platform: {
      en: "Mobile app and web panel",
      tr: "Mobil uygulama ve web paneli",
    },
    accent: "#10B395",
    /* The product's own plates are tall; they stand as handsets. */
    layout: "stack",
    lead: ARACIMGO.overview!,
    /* The four jobs first: the world hangs the first four over the station. */
    screens: [ARACIMGO.customers!, ARACIMGO.history!, ARACIMGO.workOrders!, ARACIMGO.plateSearch!, ARACIMGO.overview!, ARACIMGO.why!],
    detail: [],
    sections: [
      {
        index: "01",
        title: { en: "What happens in a workshop", tr: "Serviste ne oluyor?" },
        body: {
          en: [
            "A car comes back after a year and nobody remembers what was done to it. The customer's number is in one notebook, the job in another, and which car is waiting for a part lives in the head of whoever took it in.",
          ],
          tr: [
            "Bir araç bir yıl sonra geri geliyor ve üzerinde ne yapıldığını kimse hatırlamıyor. Müşterinin numarası bir defterde, yapılan iş başka birinde; hangi aracın parça beklediği ise aracı kabul eden kişinin aklında.",
          ],
        },
      },
      {
        index: "02",
        title: { en: "One system for the service", tr: "Servis için tek sistem" },
        body: {
          en: [
            "AracımGo keeps the customer, the vehicle and every job done on it together. Work orders show which car is in progress, waiting or finished; typing a plate brings back the customer and the vehicle's whole history in seconds.",
          ],
          tr: [
            "AracımGo müşteriyi, aracı ve araçta yapılan her işi bir arada tutar. İş emirleri hangi aracın devam ettiğini, beklediğini ya da bittiğini gösterir; plakayı yazmak, müşteriyi ve aracın tüm geçmişini saniyeler içinde getirir.",
          ],
        },
      },
      {
        index: "03",
        title: { en: "Live", tr: "Canlıda" },
        body: {
          en: [
            "AracımGo is live at aracımgo.com — a product Archon Soft designed, built and runs, not a commission.",
          ],
          tr: [
            "AracımGo aracımgo.com adresinde canlıda — Archon Soft'un tasarlayıp geliştirdiği ve yürüttüğü bir ürün, sipariş üzerine yapılmış bir iş değil.",
          ],
        },
      },
    ],
    link: { label: "aracımgo.com", href: ARACIMGO_URL },
  },
  {
    slug: "dppano",
    name: "DP Pano",
    domains: ["products", "systems", "automation"],
    category: { en: "Education technology", tr: "Eğitim teknolojisi" },
    summary: {
      en: "The screens in a school sit blank all day while the notices stay pinned to cork.",
      tr: "Okuldaki ekranlar gün boyu boş durur; duyurular hâlâ mantar panoya iğnelenir.",
    },
    standfirst: {
      en: "Smart boards and corridor screens sit idle all day while announcements are still pinned to a cork board. DP Pano turns those screens into one live school board fed from a single panel. An administrator enters the content once — twenty-six modules update on every screen in the building, each in its own layout, within seconds.",
      tr: "Okullardaki akıllı tahtalar ve koridor ekranları gün boyu boş durur; duyurular ise hâlâ mantar panoya iğnelenir. DP Pano bu ekranları tek panelden beslenen canlı bir okul panosuna çevirir. İdareci içeriği bir kez girer — 26 modül, okuldaki her ekranda kendi düzeniyle, saniyeler içinde güncellenir.",
    },
    statement: {
      en: "The board takes the place of the blank screen, not the lesson.",
      tr: "Ekran dersin yerine değil, boş ekranın yerine geçer.",
    },
    facts: [
      { label: { en: "Status", tr: "Durum" }, value: { en: "Live, in active development", tr: "Canlı, aktif geliştirmede" } },
      { label: { en: "Version", tr: "Sürüm" }, value: { en: "v1.53.0", tr: "v1.53.0" } },
      { label: { en: "Modules", tr: "Modül" }, value: { en: "Twenty-six", tr: "Yirmi altı" } },
      { label: { en: "For", tr: "Kullanıcı" }, value: { en: "K-12 schools", tr: "K-12 okulları" } },
      { label: { en: "Interface", tr: "Arayüz dili" }, value: { en: "Turkish", tr: "Türkçe" } },
    ],
    role: {
      en: "Product, design, architecture, engineering and deployment",
      tr: "Ürün, tasarım, mimari, geliştirme ve dağıtım",
    },
    system: {
      en: "Boards, timetable, duty roster, consent",
      tr: "Panolar, ders programı, nöbet, rıza",
    },
    platform: {
      en: "Web panel and browser board screen",
      tr: "Web paneli ve tarayıcı tabanlı pano ekranı",
    },
    accent: "#2563EB",
    /* Boards meant to be read across a room. Nothing is gained by putting one
       in a column, and the whole argument is how much is on one screen. */
    layout: "bleed",
    lead: DPPANO.board!,
    screens: [DPPANO.board!, DPPANO.staffroom!, DPPANO.canteen!, DPPANO.screens!],
    detail: [
      DPPANO.layout!,
      DPPANO.timetable!,
      DPPANO.solver!,
      DPPANO.duty!,
      DPPANO.safeMode!,
    ],
    systemAreas: {
      title: { en: "What the system holds", tr: "Sistemin tuttuğu" },
      areas: [
        { en: "Twenty-six board modules", tr: "Yirmi altı pano modülü" },
        { en: "Several screens per school, each with its own layout", tr: "Okul başına birden çok ekran, her biri kendi düzeniyle" },
        { en: "A layout editor: six regions, two rotating slots each", tr: "Düzen editörü: altı bölge, bölge başına iki dönüşümlü slot" },
        { en: "Push to screen over server-sent events", tr: "Sunucudan ekrana anlık iletim (SSE)" },
        { en: "Timetable, with a constraint solver behind it", tr: "Ders programı ve arkasındaki kısıt çözücü" },
        { en: "Duty rotation, and a printable roster", tr: "Nöbet rotasyonu ve basılabilir çizelge" },
        { en: "Automatic cover for an absent teacher", tr: "Gelmeyen öğretmen için otomatik ikame" },
        { en: "Staff accounts with permission per module", tr: "Modül bazlı yetkiyle personel hesapları" },
        { en: "Safe mode, screen PIN, network restriction, consent records", tr: "Güvenli mod, ekran PIN'i, ağ kısıtı, rıza kayıtları" },
      ],
      note: {
        en: "Every area listed is visible in the captures on this page. All of them were produced against demo data: there is no real pupil, teacher or school anywhere in this case study.",
        tr: "Buradaki her alan bu sayfadaki ekran görüntülerinde görünüyor. Hepsi demo veriyle üretildi: bu vaka çalışmasının hiçbir yerinde gerçek bir öğrenci, öğretmen ya da okul yok.",
      },
      screen: DPPANO.screens!,
    },
    sections: [
      {
        index: "01",
        title: { en: "The problem", tr: "Problem" },
        body: {
          en: [
            "Keeping a school's noticeboard current is nobody's actual job. The printed notice goes stale in a week, the duty roster is shifted along by hand every Monday, and the timetable lives in a spreadsheet that changes without anyone being told.",
            "Schools that do put something on a screen hit a second problem: the teacher closes the full-screen page on the way into a lesson, nobody opens it again afterwards, and the system is dead by the second week. On top of that, the personal-data rules arriving in 2026 made showing a pupil's name and photograph on a public screen a problem from the outset.",
          ],
          tr: [
            "Okulun panosunu güncel tutmak kimsenin asıl işi değildir. Duyuru kâğıdı bir hafta sonra eskir, nöbet çizelgesi her pazartesi elle kaydırılır, ders programı Excel'de tutulur ve değiştiğinde kimse haberdar olmaz.",
            "Ekrana bir şey yansıtan okullarda ise ikinci bir sorun çıkar: öğretmen derse girerken tam ekran sayfayı kapatır, ders bitince kimse geri açmaz — sistem ikinci hafta ölür. Üstüne 2026'daki kişisel veri düzenlemesi, öğrenci adını ve fotoğrafını kamuya açık bir ekranda göstermeyi baştan sorunlu hâle getirdi.",
          ],
        },
      },
      {
        index: "02",
        title: {
          en: "It replaces the blank screen, not the lesson",
          tr: "Dersin yerine değil, boş ekranın yerine",
        },
        body: {
          en: [
            "Outside lesson time the board opens itself, full screen. The moment a teacher signs in, it steps back. Setting it up is a single step, and it asks the teacher to change nothing about how they work.",
            "That is the whole answer to the second-week death: a system that needs somebody to remember it is a system that stops.",
          ],
          tr: [
            "Pano ders dışında kendiliğinden tam ekran açılır, öğretmen oturum açtığı anda arkaya çekilir. Kurulum tek adımdır ve öğretmenden hiçbir alışkanlık değişikliği istemez.",
            "İkinci hafta ölmesinin cevabı da bu: birinin hatırlamasına ihtiyaç duyan sistem, duran sistemdir.",
          ],
        },
      },
      {
        index: "03",
        title: { en: "One school, many boards", tr: "Bir okul, birçok pano" },
        body: {
          en: [
            "Separate screens are defined for the entrance hall, the staffroom, the canteen and the corridor. The content is held at school level and the screens differ only in layout: a notice entered once appears on every screen in that screen's own arrangement.",
            "Updates are pushed from the server to the screen as they happen, over server-sent events. Nobody refreshes a page.",
          ],
          tr: [
            "Giriş holü, öğretmenler odası, kantin ve koridor için ayrı ekranlar tanımlanır. İçerik okul seviyesinde ortaktır, ekranlar yalnızca düzen olarak ayrışır: bir kez girilen duyuru her ekranda o ekranın yerleşimiyle görünür.",
            "Güncelleme sunucudan ekrana anlık itilir (SSE); kimse sayfayı yenilemez.",
          ],
        },
      },
      {
        index: "04",
        title: {
          en: "A system that calculates, not just displays",
          tr: "Sadece gösteren değil, hesaplayan bir sistem",
        },
        body: {
          en: [
            "The timetable is built by a constraint solver that produces a clash-free schedule: teacher availability, block lessons, rooms and elective pools all enter the same calculation.",
            "The duty roster is distributed automatically on a zone-by-day rotation and prints as landscape A4, ready for the wall. When a teacher is absent, their lessons are shared among the people free at that hour on a fair measure — that day's load, plus how many covers they have taken in the last thirty days.",
          ],
          tr: [
            "Ders programı, çakışmasız çizelge üreten bir kısıt çözücüyle kurulur: öğretmen müsaitliği, blok ders, derslik ve seçmeli havuzları aynı hesaba girer.",
            "Nöbet çizelgesi bölge × gün rotasyonuyla otomatik dağıtılır ve duvara asılacak hâlde yatay A4 basılır. Gelmeyen öğretmenin dersleri, o saatte boş olan nöbetçilere adil bir ölçütle — o günkü yük artı son 30 günün ikame sayısı — dağıtılır.",
          ],
        },
      },
      {
        index: "05",
        title: {
          en: "Privacy is the default, not a layer",
          tr: "Kişisel veri güvenliği varsayılan",
        },
        body: {
          en: [
            "A board goes live in safe mode: names, photographs and sensitive fields are not shown on a publicly visible screen. A screen PIN and a school-network restriction, an explicit consent record, a parent consent portal and access logs are part of the product itself.",
            "It is not a compliance layer bolted on afterwards. It is the single door everything personal has to pass through on its way out.",
          ],
          tr: [
            "Pano varsayılan güvenli modda yayına girer: isim, fotoğraf ve hassas alanlar kamuya açık ekranda gösterilmez. Ekran PIN'i ve okul ağı (IP) kısıtı, açık rıza kaydı, veli rıza portalı ve erişim kayıtları ürünün kendi içindedir.",
            "Sonradan eklenmiş bir uyum katmanı değil, veri çıkış yolunun tek kapısıdır.",
          ],
        },
      },
    ],
    link: { label: "dppano.com", href: "https://dppano.com" },
    demo: {
      label: { en: "Open the live board", tr: "Canlı demo panoyu aç" },
      href: "https://dppano.com/pano/6234722a-ab02-4bb8-acc3-0f7e019788ae",
      note: {
        en: "Opens full screen. No sign-up.",
        tr: "Tam ekran açılır, kayıt gerekmez.",
      },
    },
    stack: [
      { label: { en: "Backend", tr: "Sunucu" }, value: { en: "Python 3.13 · Flask 3 · SQLAlchemy + Alembic · JWT · APScheduler", tr: "Python 3.13 · Flask 3 · SQLAlchemy + Alembic · JWT · APScheduler" } },
      { label: { en: "Data", tr: "Veri" }, value: { en: "PostgreSQL · Redis (cache, pub/sub, rate limiting)", tr: "PostgreSQL · Redis (önbellek, pub/sub, hız sınırı)" } },
      { label: { en: "Real time", tr: "Gerçek zamanlı" }, value: { en: "Server-sent events, on gunicorn + gevent", tr: "Server-Sent Events, gunicorn + gevent üzerinde" } },
      { label: { en: "Front end", tr: "Ön yüz" }, value: { en: "Jinja2 server rendering · vanilla JS · Tailwind CSS · Alpine.js", tr: "Jinja2 sunucu render · saf JS · Tailwind CSS · Alpine.js" } },
      { label: { en: "Solver", tr: "Çözücü" }, value: { en: "Google OR-Tools CP-SAT, with a pure-Python placement engine", tr: "Google OR-Tools CP-SAT ve saf Python yerleştirme motoru" } },
      { label: { en: "Deployment", tr: "Dağıtım" }, value: { en: "Docker · nginx · Coolify · gunicorn", tr: "Docker · nginx · Coolify · gunicorn" } },
    ],
    scale: [
      { label: { en: "Database tables", tr: "Veritabanı tablosu" }, value: "~85" },
      { label: { en: "Blueprints", tr: "Blueprint" }, value: "38" },
      { label: { en: "Migrations", tr: "Migration" }, value: "41" },
      { label: { en: "Automated tests", tr: "Otomatik test" }, value: "~1.700" },
      { label: { en: "Lines of Python", tr: "Python satırı" }, value: "~56.000" },
      { label: { en: "Lines of JS", tr: "JS satırı" }, value: "~34.000" },
    ],
  },
  {
    slug: "meetzy",
    name: "Meetzy",
    domains: ["products", "systems"],
    category: { en: "Social product", tr: "Sosyal ürün" },
    summary: {
      en: "Going to things is easy. Finding someone to go with is the part nobody solved.",
      tr: "Bir etkinliğe gitmek kolay. Zor olan, birlikte gidecek doğru kişiyi bulmak.",
    },
    standfirst: {
      en: "Meetzy is a social app for finding people to go to things with. Not a listings app and not a ticketing app — the event is the excuse, and the product's real job is the match. It has been live for about three months and around 2,000 people have signed up.",
      tr: "Meetzy, bir şeye birlikte gidecek insanları bulmak için bir sosyal uygulama. Ne bir etkinlik listesi ne de bir biletleme uygulaması — etkinlik bahane, ürünün asıl işi eşleştirme. Yaklaşık üç aydır canlı ve şu ana kadar 2.000 civarında kişi kaydoldu.",
    },
    statement: {
      en: "The hard part was never the event. It was the company.",
      tr: "Zor olan hiçbir zaman etkinlik değildi. Kiminle gideceğindi.",
    },
    facts: [
      { label: { en: "Status", tr: "Durum" }, value: { en: "Live", tr: "Canlı" } },
      {
        label: { en: "Live for", tr: "Yayında" },
        value: { en: "About three months", tr: "Yaklaşık üç aydır" },
      },
      {
        label: { en: "Signed up", tr: "Kayıtlı kişi" },
        value: { en: "Around 2,000 people", tr: "Yaklaşık 2.000 kişi" },
      },
      { label: { en: "Built by", tr: "Yapan" }, value: { en: "One person", tr: "Tek kişi" } },
    ],
    role: {
      en: "Product, design and engineering",
      tr: "Ürün, tasarım ve mühendislik",
    },
    system: {
      en: "Discovery, profiles, join requests",
      tr: "Keşif, profiller, katılma talepleri",
    },
    platform: { en: "Mobile app", tr: "Mobil uygulama" },
    accent: "#F0483C",
    /* Four handset plates and a product about people: a column of moments.
       The App Store set leads, here and in the world; the captures follow. */
    layout: "stack",
    lead: MEETZY.problem!,
    screens: [MEETZY.problem!, MEETZY.plan!, MEETZY.real!, MEETZY.join!],
    detail: [MEETZY.mood!, MEETZY.nearby!, MEETZY.feed!, MEETZY.map!],
    systemAreas: {
      title: { en: "What the product holds", tr: "Ürünün tuttuğu" },
      areas: [
        { en: "Accounts and sign-in", tr: "Hesaplar ve giriş" },
        { en: "Mood-led discovery", tr: "Ruh hâline göre keşif" },
        { en: "Events by distance", tr: "Mesafeye göre etkinlikler" },
        { en: "Map", tr: "Harita" },
        { en: "Structured profiles", tr: "Yapılandırılmış profiller" },
        { en: "Join requests and their states", tr: "Katılma talepleri ve durumları" },
        { en: "Notifications, both sides", tr: "İki taraflı bildirimler" },
        { en: "City memories", tr: "Şehir anıları" },
      ],
      note: {
        en: "Every area listed is visible in the captures on this page or was stated by the person who built it. Nothing is inferred from what an app like this usually has.",
        tr: "Buradaki her alan ya bu sayfadaki ekran görüntülerinde görünüyor ya da onu kuran kişi tarafından söylendi. Hiçbiri, böyle bir uygulamada genelde ne bulunduğundan çıkarılmadı.",
      },
      screen: MEETZY.profile!,
    },
    sections: [
      {
        index: "01",
        title: { en: "The problem", tr: "Problem" },
        body: {
          en: [
            "There is no shortage of things to do. There is a shortage of someone to do them with. People scroll past a concert, a match, a table at a café, and decide against it — not because the event was wrong, but because going alone was.",
            "So Meetzy is not built around events. It is built around the person you would be sitting next to. Everything in the interface exists to answer one question earlier: would I want to spend an evening with whoever is behind this.",
          ],
          tr: [
            "Yapacak şey eksikliği yok; birlikte yapacak insan eksikliği var. İnsanlar bir konseri, bir maçı, kafedeki bir masayı görüp geçiyor — etkinlik yanlış olduğu için değil, tek başına gitmek yanlış geldiği için.",
            "Bu yüzden Meetzy etkinliklerin etrafına kurulmadı; yanında oturacak kişinin etrafına kuruldu. Arayüzdeki her şey tek bir soruyu daha erken cevaplamak için var: bu kişiyle bir akşam geçirmek ister miyim?",
          ],
        },
      },
      {
        index: "02",
        title: { en: "Discovery", tr: "Keşif" },
        body: {
          en: [
            "Discovery starts from mood rather than category. You say what kind of evening you are after — something quiet, something social, something active — and the app narrows from there. It is a smaller question than \"what do you want to do\", and people answer it faster.",
            "From there, distance does the rest of the filtering. Events are listed by how far away they actually are, down to metres, and the same set is available on a map. Nothing is more than a couple of taps from the point where you decide.",
          ],
          tr: [
            "Keşif kategoriden değil, ruh hâlinden başlıyor. Nasıl bir akşam istediğini söylüyorsun — sakin bir şey, sosyal bir şey, hareketli bir şey — ve uygulama oradan daraltıyor. Bu, \"ne yapmak istersin\" sorusundan daha küçük bir soru ve insanlar buna daha hızlı cevap veriyor.",
            "Gerisini mesafe hallediyor. Etkinlikler gerçekten ne kadar uzakta olduklarına göre, metre hassasiyetinde sıralanıyor; aynı liste haritada da var. Karar verdiğin noktadan hiçbir şey birkaç dokunuştan uzakta değil.",
          ],
        },
      },
      {
        index: "03",
        title: { en: "Asking", tr: "Talep" },
        body: {
          en: [
            "You do not simply appear at someone's table. Every event has a host, and joining is a request that the host accepts — which is the difference between an open listing and a social product people are willing to use.",
            "That single decision pulled a lot of the system behind it: requests and their states, notifications on both sides, the profile that has to be good enough to say yes to.",
          ],
          tr: [
            "Kimsenin masasına öylece oturmuyorsun. Her etkinliğin bir sahibi var ve katılmak, sahibinin onayladığı bir talep — açık bir ilan ile insanların gerçekten kullandığı bir sosyal ürün arasındaki fark bu.",
            "Bu tek karar arkasından çok şey getirdi: talepler ve durumları, iki taraflı bildirimler, ve \"evet\" demeye değecek kadar iyi olması gereken profil.",
          ],
        },
      },
      {
        index: "04",
        title: { en: "The profile", tr: "Profil" },
        body: {
          en: [
            "A profile here is not a photo and a bio. It is structured: how someone communicates, how they live, what they do at weekends, what they are into. Enough to make a judgement, laid out so the judgement takes seconds.",
            "The app captures in this case study have their users' names and faces removed. That is not a design flourish — real people are in there, and none of them agreed to appear in a portfolio. The people in the App Store images are stock photography.",
          ],
          tr: [
            "Buradaki profil bir fotoğraf ve iki cümle değil. Yapılandırılmış: kişi nasıl iletişim kuruyor, nasıl yaşıyor, hafta sonu ne yapıyor, nelerle ilgileniyor. Karar vermeye yetecek kadar bilgi, kararın saniyeler sürmesini sağlayacak şekilde dizilmiş.",
            "Bu vaka çalışmasındaki uygulama ekranlarında kullanıcı isimleri ve yüzleri kaldırıldı. Bu bir tasarım süsü değil — orada gerçek insanlar var ve hiçbiri bir portfolyoda yer almayı kabul etmedi. App Store görsellerindeki kişiler stok fotoğraftır.",
          ],
        },
      },
      {
        index: "05",
        title: { en: "One person", tr: "Tek kişi" },
        body: {
          en: [
            "Product decisions, interface, client, server, data, authentication, notifications, release. One person, one head, no handovers — which is the only reason a product this wide could be defined and shipped in the time it was.",
            "It is live, people are using it, and it is early. That is the honest description, and it is a better one than a chart.",
          ],
          tr: [
            "Ürün kararları, arayüz, istemci, sunucu, veri, kimlik doğrulama, bildirimler, yayın. Tek kişi, tek kafa, hiç devir teslim yok — bu kadar geniş bir ürünün bu sürede tanımlanıp yayınlanabilmesinin tek sebebi de bu.",
            "Canlı, insanlar kullanıyor ve daha çok erken. Dürüst tarif bu; bir grafikten daha iyi bir tarif.",
          ],
        },
      },
    ],
  },
  {
    slug: "erden",
    domains: ["commerce", "systems"],
    name: "Erden Davetiye",
    category: { en: "Commerce system", tr: "Ticaret sistemi" },
    summary: {
      en: "A wedding invitation atelier in Ankara, rebuilt as a storefront and the system that runs behind it.",
      tr: "Ankara'da bir davetiye atölyesi; bir vitrin ve onu çalıştıran sistem olarak yeniden kuruldu.",
    },
    standfirst: {
      en: "Erden Davetiye sells something people only buy once and cannot afford to get wrong. The work was two halves of the same system: a storefront that lets a couple choose with confidence, and the admin behind it that lets the atelier actually run on it — orders, designs, products, categories, coupons, customers, reviews and analytics.",
      tr: "Erden Davetiye, insanların hayatta bir kez aldığı ve yanlış seçmeyi göze alamadığı bir şey satıyor. İş, aynı sistemin iki yarısıydı: çiftin gönül rahatlığıyla seçmesini sağlayan bir vitrin ve atölyenin işini gerçekten üzerinden yürütebildiği yönetim tarafı — sipariş, tasarım, ürün, kategori, kupon, müşteri, yorum ve analitik.",
    },
    statement: {
      en: "A storefront is the half you see. The other half is what keeps the atelier running.",
      tr: "Vitrin, görünen yarısı. Diğer yarısı atölyeyi ayakta tutan taraf.",
    },
    facts: [
      { label: { en: "Status", tr: "Durum" }, value: { en: "Live", tr: "Canlı" } },
      {
        label: { en: "Scope", tr: "Kapsam" },
        value: { en: "Storefront and admin", tr: "Vitrin ve yönetim" },
      },
      { label: { en: "Built by", tr: "Yapan" }, value: { en: "One person", tr: "Tek kişi" } },
    ],
    role: {
      en: "Product, design and engineering",
      tr: "Ürün, tasarım ve mühendislik",
    },
    system: {
      en: "Catalogue, orders, admin",
      tr: "Katalog, sipariş, yönetim",
    },
    platform: { en: "Web, mobile first", tr: "Web, önce mobil" },
    accent: "#B08D57",
    /* A storefront is itself a piece of visual design, so it gets the spread:
       type against pictures, offset, with a diagonal through it. */
    layout: "split",
    lead: ERDEN.home!,
    screens: [ERDEN.home!, ERDEN.categories!, ERDEN.products!, ERDEN.admin!],
    detail: [ERDEN.styles!, ERDEN.support!, ERDEN.navigation!],
    systemAreas: {
      title: { en: "The admin, area by area", tr: "Yönetim paneli, alan alan" },
      areas: [
        { en: "Dashboard", tr: "Panel" },
        { en: "Orders", tr: "Siparişler" },
        { en: "Design requests", tr: "Tasarımlar" },
        { en: "Products", tr: "Ürünler" },
        { en: "Categories", tr: "Kategoriler" },
        { en: "Coupons", tr: "Kuponlar" },
        { en: "Customers", tr: "Müşteriler" },
        { en: "Reviews", tr: "Yorumlar" },
        { en: "Analytics", tr: "Analitik" },
      ],
      note: {
        en: "Nine areas, all of them in the capture on this page and all of them operated by the atelier rather than by a developer. This is the half of a commerce project that decides whether it became software or stayed a website.",
        tr: "Dokuz alan; hepsi bu sayfadaki ekran görüntüsünde ve hepsini geliştirici değil atölye kullanıyor. Bir ticaret projesinin yazılıma mı dönüştüğüne yoksa web sitesi olarak mı kaldığına karar veren yarı bu.",
      },
      screen: ERDEN.admin!,
    },
    sections: [
      {
        index: "01",
        title: { en: "What is actually being sold", tr: "Aslında ne satılıyor" },
        body: {
          en: [
            "Invitations are chosen once, for a day nobody wants to get wrong, and they are chosen on feeling as much as on specification. A grid of thumbnails and a price does not carry that — it strips out exactly the qualities the purchase is being made on.",
            "So the storefront is built to be browsed the way the atelier is walked: by occasion first, then by style, with the photography given enough room to show what the paper actually looks like.",
          ],
          tr: [
            "Davetiye bir kez seçilir, kimsenin yanlış yapmak istemediği bir gün için, ve özellikler kadar hisle seçilir. Küçük görsellerden oluşan bir ızgara ve bir fiyat bunu taşımıyor — satın almanın dayandığı nitelikleri tam olarak siliyor.",
            "Bu yüzden vitrin, atölyede gezilir gibi gezilecek şekilde kuruldu: önce törene göre, sonra tarza göre; fotoğrafa da kâğıdın gerçekten nasıl göründüğünü gösterecek kadar yer verildi.",
          ],
        },
      },
      {
        index: "02",
        title: { en: "The catalogue", tr: "Katalog" },
        body: {
          en: [
            "Wedding, engagement, henna, nikah, circumcision — the collection is cut by occasion, then again by style, then again by seasonal and shape-based collections. Prices are per unit, campaign and new-arrival states are visible on the card, and anything can be saved for later.",
            "All of it is managed by the atelier rather than by a developer. Products, categories, campaign collections and coupons are theirs to change.",
          ],
          tr: [
            "Düğün, nişan, kına, nikah, sünnet — koleksiyon önce törene, sonra tarza, sonra sezonluk ve kesim bazlı koleksiyonlara göre ayrılıyor. Fiyatlar adet üzerinden; kampanya ve yeni ürün durumu kartın üstünde görünüyor; her ürün sonrası için kaydedilebiliyor.",
            "Bunların hepsini geliştirici değil, atölye yönetiyor. Ürünler, kategoriler, kampanyalı koleksiyonlar ve kuponlar onların elinde.",
          ],
        },
      },
      {
        index: "03",
        title: { en: "A person, not a bot", tr: "Bot değil, insan" },
        body: {
          en: [
            "The one thing an online storefront takes away from an atelier is the person across the table. So the site puts them back explicitly: a designer from the workshop, reachable on WhatsApp, with the hours printed next to the button.",
            "It is a deliberately unfashionable decision. No chat widget, no assistant, no promise of an instant answer — just the shop's actual phone, which is what the customer wanted anyway.",
          ],
          tr: [
            "Çevrimiçi bir vitrinin atölyeden aldığı tek şey, karşındaki insandır. Bu yüzden site onu açıkça geri koyuyor: atölyeden bir tasarımcı, WhatsApp'tan ulaşılabilir, çalışma saatleri butonun yanında yazılı.",
            "Bilinçli olarak moda olmayan bir karar. Sohbet widget'ı yok, asistan yok, anında cevap vaadi yok — sadece dükkânın gerçek telefonu; müşterinin zaten istediği de buydu.",
          ],
        },
      },
      {
        index: "04",
        title: { en: "The half you do not see", tr: "Görmediğin yarısı" },
        body: {
          en: [
            "Behind the storefront is the system the atelier runs on: orders, design requests, products, categories, coupons, customers, reviews and analytics — each its own area, all in one place.",
            "This is the part that decides whether a commerce project is a website or a business tool. A storefront nobody can operate quietly becomes the developer's job forever; this one does not.",
          ],
          tr: [
            "Vitrinin arkasında atölyenin işini yürüttüğü sistem var: siparişler, tasarım talepleri, ürünler, kategoriler, kuponlar, müşteriler, yorumlar ve analitik — her biri kendi alanı, hepsi tek yerde.",
            "Bir ticaret projesinin web sitesi mi yoksa iş aracı mı olduğuna karar veren kısım burası. Kimsenin yönetemediği bir vitrin sessizce sonsuza kadar geliştiricinin işi hâline gelir; bu öyle değil.",
          ],
        },
      },
      {
        index: "05",
        title: { en: "What it is for", tr: "Ne için" },
        body: {
          en: [
            "Two goals, stated by the atelier: sell more, and let a couple choose and design their invitation without the anxiety that usually comes with buying something once.",
            "It is live at erdendavetiye.com. No figures are published here, because none have been verified — and an unverified number would say less than the working system does.",
          ],
          tr: [
            "Atölyenin koyduğu iki hedef: daha çok satmak ve çiftin, bir şeyi hayatta bir kez satın almanın getirdiği kaygı olmadan davetiyesini seçip tasarlayabilmesi.",
            "erdendavetiye.com adresinde canlı. Burada hiçbir rakam yayınlanmıyor, çünkü hiçbiri doğrulanmadı — doğrulanmamış bir rakam, çalışan sistemin kendisinden daha azını söylerdi.",
          ],
        },
      },
    ],
    link: { label: "erdendavetiye.com", href: "https://erdendavetiye.com" },
  },
];

export const getProject = (slug: string): Project | undefined =>
  PROJECTS.find((project) => project.slug === slug);

/** Wraps around, so the last project points back at the first. */
export const getNextProject = (slug: string): Project => {
  const current = PROJECTS.findIndex((project) => project.slug === slug);
  return PROJECTS[(current + 1) % PROJECTS.length] as Project;
};
