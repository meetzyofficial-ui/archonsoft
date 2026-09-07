import type { Localized, LocalizedList } from "@/lib/i18n";

/**
 * The capability matrix — one dataset, two presentations.
 *
 * On the home page it is a chooser: you pick the sentence that sounds like
 * your situation and it resolves. On the capabilities page the same rows are
 * a table you can read straight down. Keeping it as one dataset means the two
 * can never say different things, which matters more here than usual, because
 * the last column is the whole argument: every claim on this site ends at
 * something you can open.
 *
 * `proof.kind` is never decorative. "shipped" means a real, live product;
 * "concept" means an Archon Labs prototype. They are never blurred.
 */

export type MatrixRow = {
  id: string;
  /** The visitor's own words, for the chooser. */
  intent: Localized;
  /** The same thing said as a problem, for the table. */
  problem: Localized;
  productType: Localized;
  system: LocalizedList;
  /** The domain this resolves to, keyed to DOMAINS. */
  domain: string;
  capability: Localized;
  proof: {
    kind: "shipped" | "concept";
    /** Route segment: /work/<slug> for shipped, /labs/<slug> for a concept. */
    slug: string;
    name: string;
    note: Localized;
  };
  /** Further things on this site that answer the same question. */
  also?: { kind: "shipped" | "concept"; slug: string; name: string }[];
};

export const MATRIX: MatrixRow[] = [
  {
    id: "idea",
    also: [
      { kind: "concept", slug: "divan", name: "Divan" },
    ],
    intent: { en: "I have an idea", tr: "Bir fikrim var" },
    problem: {
      en: "There is a product in your head and nothing on a screen yet",
      tr: "Kafanda bir ürün var ama henüz ekranda hiçbir şey yok",
    },
    productType: { en: "A new product", tr: "Yeni bir ürün" },
    system: {
      en: ["Definition", "Prototype", "Client", "Backend", "Release"],
      tr: ["Tanımlama", "Prototip", "İstemci", "Sunucu", "Yayın"],
    },
    domain: "products",
    capability: { en: "Product development", tr: "Ürün geliştirme" },
    proof: {
      kind: "shipped",
      slug: "meetzy",
      name: "Meetzy",
      note: {
        en: "Went from a single observation to a live app with around 2,000 signups, built by one person.",
        tr: "Tek bir gözlemden, tek kişinin kurduğu ve 2.000 civarı kaydı olan canlı bir uygulamaya gitti.",
      },
    },
  },
  {
    id: "web",
    also: [
      { kind: "concept", slug: "divan", name: "Divan" },
      { kind: "concept", slug: "esik", name: "Eşik" },
    ],
    intent: { en: "I need a web product", tr: "Bir web ürünü lazım" },
    problem: {
      en: "The work happens in a browser and needs accounts, data and permissions",
      tr: "İş tarayıcıda yapılıyor; hesap, veri ve yetki gerekiyor",
    },
    productType: { en: "Web application", tr: "Web uygulaması" },
    system: {
      en: ["Frontend", "Backend", "Database", "Authentication", "Admin"],
      tr: ["Frontend", "Backend", "Veritabanı", "Kimlik doğrulama", "Yönetim"],
    },
    domain: "products",
    capability: { en: "Product development", tr: "Ürün geliştirme" },
    proof: {
      kind: "concept",
      slug: "divan",
      name: "Divan",
      note: {
        en: "A full web application with roles, records and reporting, running here.",
        tr: "Rolleri, kayıtları ve raporlaması olan eksiksiz bir web uygulaması, burada çalışıyor.",
      },
    },
  },
  {
    id: "mobile",
    also: [
      { kind: "concept", slug: "vesile", name: "Vesile" },
    ],
    intent: { en: "I need a mobile app", tr: "Mobil uygulama lazım" },
    problem: {
      en: "It has to be on a phone, in someone's pocket, wherever they are",
      tr: "Telefonda, insanın cebinde, nerede olursa olsun çalışması gerekiyor",
    },
    productType: { en: "Mobile product", tr: "Mobil ürün" },
    system: {
      en: ["Mobile client", "Backend", "Database", "Notifications", "Maps"],
      tr: ["Mobil istemci", "Sunucu", "Veritabanı", "Bildirimler", "Harita"],
    },
    domain: "products",
    capability: { en: "Product development", tr: "Ürün geliştirme" },
    proof: {
      kind: "shipped",
      slug: "meetzy",
      name: "Meetzy",
      note: {
        en: "Live on phones for about three months. The screens on this site are captures of it.",
        tr: "Yaklaşık üç aydır telefonlarda canlı. Bu sitedeki ekranlar onun kayıtları.",
      },
    },
  },
  {
    id: "business",
    also: [
      { kind: "concept", slug: "divan", name: "Divan" },
      { kind: "concept", slug: "esik", name: "Eşik" },
    ],
    intent: { en: "I need a business system", tr: "Bir iş sistemi lazım" },
    problem: {
      en: "The company runs on spreadsheets, messages and one person who remembers everything",
      tr: "Şirket tablolar, mesajlar ve her şeyi hatırlayan tek bir kişiyle yürüyor",
    },
    productType: { en: "Internal system", tr: "İç sistem" },
    system: {
      en: ["Records", "States", "Roles", "Approvals", "Reporting"],
      tr: ["Kayıtlar", "Durumlar", "Roller", "Onaylar", "Raporlama"],
    },
    domain: "systems",
    capability: { en: "Business software", tr: "İş yazılımı" },
    proof: {
      kind: "concept",
      slug: "atolye",
      name: "Atölye",
      note: {
        en: "Jobs, schedules, materials and approvals — the spreadsheet, written down properly.",
        tr: "İşler, programlar, malzeme ve onaylar — tablonun düzgünce yazıya dökülmüş hâli.",
      },
    },
  },
  {
    id: "commerce",
    also: [
      { kind: "concept", slug: "tezgah", name: "Tezgah" },
      { kind: "concept", slug: "kervan", name: "Kervan" },
    ],
    intent: { en: "I need an e-commerce platform", tr: "E-ticaret platformu lazım" },
    problem: {
      en: "You are selling, and the storefront is the smaller half of the problem",
      tr: "Satış yapıyorsun ve vitrin, problemin küçük olan yarısı",
    },
    productType: { en: "Commerce system", tr: "Ticaret sistemi" },
    system: {
      en: ["Catalogue", "Stock", "Checkout", "Payments", "Orders", "Admin"],
      tr: ["Katalog", "Stok", "Ödeme akışı", "Ödemeler", "Siparişler", "Yönetim"],
    },
    domain: "commerce",
    capability: { en: "Commerce", tr: "Ticaret" },
    proof: {
      kind: "shipped",
      slug: "erden-davetiye",
      name: "Erden Davetiye",
      note: {
        en: "A live storefront and the admin an atelier in Ankara actually runs on.",
        tr: "Canlı bir vitrin ve Ankara'daki bir atölyenin işini gerçekten yürüttüğü yönetim paneli.",
      },
    },
  },
  {
    id: "ai",
    also: [
      { kind: "concept", slug: "vardiya", name: "Vardiya" },
      { kind: "concept", slug: "kutuk", name: "Kütük" },
    ],
    intent: { en: "I want to use AI", tr: "Yapay zekâ kullanmak istiyorum" },
    problem: {
      en: "There is a model that could help, and no safe place to put it yet",
      tr: "İşe yarayabilecek bir model var ama onu koyacak güvenli bir yer henüz yok",
    },
    productType: { en: "AI inside a process", tr: "Sürecin içinde yapay zekâ" },
    system: {
      en: ["Retrieval", "Grounding", "Confidence", "Approval", "Audit"],
      tr: ["Getirme", "Dayanak", "Güven eşiği", "Onay", "Denetim"],
    },
    domain: "ai",
    capability: { en: "AI", tr: "Yapay zekâ" },
    proof: {
      kind: "concept",
      slug: "ulak",
      name: "Ulak",
      note: {
        en: "Documents read into typed fields, thresholds that decide when not to answer, every run traceable.",
        tr: "Tipli alanlara okunan belgeler, ne zaman cevap verilmeyeceğine karar veren eşikler, izlenebilir her çalışma.",
      },
    },
  },
  {
    id: "automate",
    also: [
      { kind: "concept", slug: "ulak", name: "Ulak" },
      { kind: "concept", slug: "atolye", name: "Atölye" },
    ],
    intent: { en: "I want to automate my business", tr: "İşimi otomatikleştirmek istiyorum" },
    problem: {
      en: "The same handful of tasks is done by hand, every day, by people who could be doing something else",
      tr: "Aynı birkaç iş her gün elle yapılıyor; hem de başka bir şey yapabilecek insanlar tarafından",
    },
    productType: { en: "Automation layer", tr: "Otomasyon katmanı" },
    system: {
      en: ["Triggers", "Conditions", "Approvals", "Integrations", "Audit"],
      tr: ["Tetikleyiciler", "Koşullar", "Onaylar", "Entegrasyonlar", "Denetim"],
    },
    domain: "automation",
    capability: { en: "Automation", tr: "Otomasyon" },
    proof: {
      kind: "concept",
      slug: "vardiya",
      name: "Vardiya",
      note: {
        en: "Rules a support lead can change, and a handover to a person the moment the ground runs out.",
        tr: "Destek sorumlusunun değiştirebildiği kurallar ve zemin bittiği anda insana devir.",
      },
    },
  },
  {
    id: "existing",
    also: [
      { kind: "concept", slug: "esik", name: "Eşik" },
      { kind: "concept", slug: "ulak", name: "Ulak" },
    ],
    intent: { en: "I already have a product", tr: "Zaten bir ürünüm var" },
    problem: {
      en: "It works, and nobody can say which part of it is working",
      tr: "Çalışıyor ama hangi kısmının işe yaradığını kimse söyleyemiyor",
    },
    productType: { en: "Measurement and extension", tr: "Ölçüm ve genişletme" },
    system: {
      en: ["Events", "Funnels", "Cohorts", "Reports", "Integrations"],
      tr: ["Olaylar", "Huniler", "Kohortlar", "Raporlar", "Entegrasyonlar"],
    },
    domain: "data",
    capability: { en: "Data", tr: "Veri" },
    proof: {
      kind: "concept",
      slug: "olcek",
      name: "Ölçek",
      note: {
        en: "Events modelled properly, so the question you have in six months is a query rather than an export.",
        tr: "Düzgün modellenmiş olaylar; böylece altı ay sonraki sorunuz bir dışa aktarma değil, bir sorgu olur.",
      },
    },
  },
  {
    id: "events",
    also: [{ kind: "concept", slug: "vesile", name: "Vesile" }],
    intent: { en: "I need an event platform", tr: "Etkinlik platformu lazım" },
    problem: {
      en: "People need to find something, get in, and be counted at the door",
      tr: "İnsanların bir şey bulması, içeri girmesi ve kapıda sayılması gerekiyor",
    },
    productType: { en: "Event technology", tr: "Etkinlik teknolojisi" },
    system: {
      en: ["Discovery", "Ticketing", "Check-in", "Attendees", "Reporting"],
      tr: ["Keşif", "Biletleme", "Giriş", "Katılımcılar", "Raporlama"],
    },
    domain: "products",
    capability: { en: "Product development", tr: "Ürün geliştirme" },
    proof: {
      kind: "shipped",
      slug: "meetzy",
      name: "Meetzy",
      note: {
        en: "Live, and built around the half of this problem nobody solves: finding someone to go with.",
        tr: "Canlı ve bu problemin kimsenin çözmediği yarısının etrafına kurulmuş: birlikte gidecek kişiyi bulmak.",
      },
    },
  },
  {
    id: "custom",
    also: [
      { kind: "concept", slug: "esik", name: "Eşik" },
      { kind: "concept", slug: "atolye", name: "Atölye" },
    ],
    intent: { en: "I need something custom", tr: "Özel bir şey lazım" },
    problem: {
      en: "Nothing off the shelf fits, and the parts that do not fit are the parts that matter",
      tr: "Hazır hiçbir şey oturmuyor ve oturmayan kısımlar tam da önemli olanlar",
    },
    productType: { en: "Custom software", tr: "Özel yazılım" },
    system: {
      en: ["Whatever the problem needs", "Modelled first", "Then built"],
      tr: ["Problem ne gerektiriyorsa", "Önce modellenir", "Sonra kurulur"],
    },
    domain: "systems",
    capability: { en: "Custom software", tr: "Özel yazılım" },
    proof: {
      kind: "concept",
      slug: "kervan",
      name: "Kervan",
      note: {
        en: "Two applications, one ledger, split orders and derived payouts — the hardest shape in this collection.",
        tr: "İki uygulama, tek defter, bölünmüş siparişler ve türetilmiş hakedişler — buradaki en zor biçim.",
      },
    },
  },
];

export const getMatrixRow = (id: string): MatrixRow | undefined =>
  MATRIX.find((row) => row.id === id);
