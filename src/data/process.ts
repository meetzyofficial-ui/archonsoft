import type { IconName } from "@/components/labs/Icon";
import type { Localized, LocalizedList } from "@/lib/i18n";

/**
 * How the work is actually done, and the layers it touches.
 *
 * The stages are written as what happens rather than as what is promised, and
 * each one says what you get out of it and what is required from you — which
 * is the part most process diagrams leave out and the part that decides
 * whether a project runs on time.
 */

export type Stage = {
  index: string;
  id: string;
  icon: IconName;
  title: Localized;
  precis: Localized;
  happens: LocalizedList;
  output: Localized;
  yours: Localized;
};

export const PROCESS: Stage[] = [
  {
    index: "01",
    id: "discover",
    icon: "search",
    title: { en: "Discover", tr: "Keşif" },
    precis: {
      en: "Deciding what the thing is, and what it refuses to be.",
      tr: "Şeyin ne olduğuna ve neyi olmayı reddettiğine karar vermek.",
    },
    happens: {
      en: [
        "Your problem gets written down in one paragraph, in your words, and agreed.",
        "The work is cut: what ships first, what waits, what is not being built at all.",
        "The hard constraints surface early — the integration nobody mentioned, the data that does not exist yet, the thing legal will ask about.",
      ],
      tr: [
        "Problemin tek paragrafta, senin kelimelerinle yazılıp mutabık kalınıyor.",
        "İş kesiliyor: önce ne çıkacak, ne bekleyecek, ne hiç kurulmayacak.",
        "Sert kısıtlar erken çıkıyor — kimsenin söylemediği entegrasyon, henüz var olmayan veri, hukukun soracağı şey.",
      ],
    },
    output: {
      en: "A scope, a sequence and a price, in writing.",
      tr: "Yazılı bir kapsam, bir sıra ve bir fiyat.",
    },
    yours: {
      en: "An hour or two of your time and honest answers about what already exists.",
      tr: "Bir iki saatin ve zaten neyin var olduğuna dair dürüst cevaplar.",
    },
  },
  {
    index: "02",
    id: "design",
    icon: "layers",
    title: { en: "Design", tr: "Tasarım" },
    precis: {
      en: "The product map first, then the screens it implies.",
      tr: "Önce ürün haritası, sonra onun gerektirdiği ekranlar.",
    },
    happens: {
      en: [
        "The objects get named — what a record is, what states it moves through, who may touch it.",
        "Interface design follows from that rather than preceding it, so the screens cannot promise something the data will not support.",
        "The main flows are drawn end to end before anything is built.",
      ],
      tr: [
        "Nesneler adlandırılıyor — bir kaydın ne olduğu, hangi durumlardan geçtiği, kimin dokunabileceği.",
        "Arayüz tasarımı bunun önünde değil, ardından geliyor; böylece ekranlar verinin karşılayamayacağı bir şeyi vaat edemiyor.",
        "Ana akışlar, hiçbir şey kurulmadan uçtan uca çiziliyor.",
      ],
    },
    output: {
      en: "A data model and the screens, both agreed before code exists.",
      tr: "Bir veri modeli ve ekranlar; ikisi de kod yazılmadan önce onaylanmış.",
    },
    yours: {
      en: "Reading it and saying where it is wrong. That is cheapest here.",
      tr: "Okuyup nerede yanlış olduğunu söylemek. En ucuz olduğu yer burası.",
    },
  },
  {
    index: "03",
    id: "build",
    icon: "grid",
    title: { en: "Build", tr: "Kurulum" },
    precis: {
      en: "Client, server, database and the admin, as one job.",
      tr: "İstemci, sunucu, veritabanı ve yönetim paneli; tek iş olarak.",
    },
    happens: {
      en: [
        "It is built in vertical slices — one whole working feature at a time, front to back, rather than a finished frontend waiting on a backend.",
        "You get a running URL early and it stays running, so progress is something you can open rather than something you are told.",
        "The admin is built alongside the product, not bolted on at the end when there is no budget left for it.",
      ],
      tr: [
        "Dikey dilimler hâlinde kuruluyor — bir seferde uçtan uca çalışan tek bir özellik; backend bekleyen bitmiş bir frontend değil.",
        "Erkenden çalışan bir adres alıyorsun ve çalışmaya devam ediyor; böylece ilerleme, sana anlatılan değil açabildiğin bir şey oluyor.",
        "Yönetim paneli ürünle birlikte kuruluyor; bütçe bittiğinde sonuna eklenen bir şey değil.",
      ],
    },
    output: {
      en: "Working software you can use before it is finished.",
      tr: "Bitmeden önce kullanabildiğin, çalışan yazılım.",
    },
    yours: {
      en: "Looking at it weekly and reacting. Nothing else.",
      tr: "Haftada bir bakıp tepki vermek. Başka bir şey değil.",
    },
  },
  {
    index: "04",
    id: "connect",
    icon: "plug",
    title: { en: "Connect", tr: "Bağlantı" },
    precis: {
      en: "Payments, mail, messaging, accounting, whatever already exists.",
      tr: "Ödeme, e-posta, mesajlaşma, muhasebe; zaten ne varsa.",
    },
    happens: {
      en: [
        "The systems you already pay for are wired in rather than replaced.",
        "The failure cases are handled explicitly — the timeout, the duplicate, the webhook that arrives twice — because that is where integrations are actually lost.",
        "Anything that has to be reconciled later is designed to be reconcilable now.",
      ],
      tr: [
        "Zaten para verdiğin sistemler değiştirilmiyor, bağlanıyor.",
        "Hata durumları açıkça ele alınıyor — zaman aşımı, mükerrer kayıt, iki kez gelen webhook — çünkü entegrasyonlar asıl orada kaybediliyor.",
        "Sonradan mutabık kalınması gereken her şey, şimdi mutabık kalınabilir olacak şekilde tasarlanıyor.",
      ],
    },
    output: {
      en: "One system instead of several that disagree.",
      tr: "Birbiriyle çelişen birkaç sistem yerine tek bir sistem.",
    },
    yours: {
      en: "Access, and the name of whoever owns each existing system.",
      tr: "Erişim ve mevcut her sistemin sahibinin adı.",
    },
  },
  {
    index: "05",
    id: "launch",
    icon: "play",
    title: { en: "Launch", tr: "Yayın" },
    precis: {
      en: "Live, with the boring parts done.",
      tr: "Canlı; sıkıcı kısımları da yapılmış hâlde.",
    },
    happens: {
      en: [
        "Environments, domains, certificates, backups and the accounts that own them — in your name, not mine.",
        "Whoever will operate the admin is walked through it until they are not asking questions.",
        "Analytics goes in before launch, not after, so the first week is measurable.",
      ],
      tr: [
        "Ortamlar, alan adları, sertifikalar, yedekler ve bunların sahibi olan hesaplar — benim değil, senin adına.",
        "Yönetim panelini kullanacak kişi, soru sormayı bırakana kadar gezdiriliyor.",
        "Analitik yayından sonra değil önce konuyor; böylece ilk hafta ölçülebilir oluyor.",
      ],
    },
    output: {
      en: "A running product, and every account belonging to you.",
      tr: "Çalışan bir ürün ve sana ait olan her hesap.",
    },
    yours: {
      en: "Deciding when. The technical readiness is my problem.",
      tr: "Ne zaman olacağına karar vermek. Teknik hazırlık benim işim.",
    },
  },
  {
    index: "06",
    id: "iterate",
    icon: "flow",
    title: { en: "Iterate", tr: "İterasyon" },
    precis: {
      en: "What the first weeks show, acted on.",
      tr: "İlk haftaların gösterdiğini uygulamak.",
    },
    happens: {
      en: [
        "The measurement that went in before launch starts answering questions, and the answers are usually not the ones anyone expected.",
        "Changes are made against evidence rather than against opinion, including mine.",
        "If the right answer is that nothing more should be built yet, that is said out loud.",
      ],
      tr: [
        "Yayından önce konan ölçüm soruları cevaplamaya başlıyor ve cevaplar genelde kimsenin beklediği cevaplar olmuyor.",
        "Değişiklikler görüşe değil kanıta göre yapılıyor; benim görüşüm de dâhil.",
        "Doğru cevap henüz bir şey kurulmaması ise, bu açıkça söyleniyor.",
      ],
    },
    output: {
      en: "A product that gets better for a reason you can point at.",
      tr: "Gösterebileceğin bir sebeple iyileşen bir ürün.",
    },
    yours: {
      en: "Deciding what is worth the next round.",
      tr: "Sonraki tura neyin değdiğine karar vermek.",
    },
  },
];

/* ------------------------------------------------------------------------ */

export type Layer = {
  id: string;
  group: Localized;
  title: Localized;
  detail: Localized;
  /** Where on this site you can see this layer doing something. */
  evidence: { kind: "shipped" | "concept" | "site"; slug?: string; name: Localized };
};

/**
 * The technical layers, named by function.
 *
 * Deliberately not a wall of vendor logos. Which database or which hosting
 * provider is a decision made per project against that project's constraints,
 * and printing a fixed list would be a claim about expertise nobody asked me
 * to make. What does not change is the set of layers a working product needs
 * and the fact that all of them are handled here — so that is what is listed,
 * each with somewhere on this site you can watch it working.
 */
export const LAYERS: Layer[] = [
  {
    id: "frontend",
    group: { en: "Interface", tr: "Arayüz" },
    title: { en: "Frontend", tr: "Frontend" },
    detail: {
      en: "The application people actually touch: state, routing, accessibility, performance, and motion that carries meaning rather than decorating.",
      tr: "İnsanların gerçekten dokunduğu uygulama: durum, yönlendirme, erişilebilirlik, performans ve süsleme değil anlam taşıyan hareket.",
    },
    evidence: { kind: "site", name: { en: "This site", tr: "Bu site" } },
  },
  {
    id: "mobile",
    group: { en: "Interface", tr: "Arayüz" },
    title: { en: "Mobile", tr: "Mobil" },
    detail: {
      en: "A product that lives on a phone — offline behaviour, permissions, notifications, location, and the store release at the end of it.",
      tr: "Telefonda yaşayan bir ürün — çevrimdışı davranış, izinler, bildirimler, konum ve sonundaki mağaza yayını.",
    },
    evidence: { kind: "shipped", slug: "meetzy", name: { en: "Meetzy", tr: "Meetzy" } },
  },
  {
    id: "backend",
    group: { en: "System", tr: "Sistem" },
    title: { en: "Backend", tr: "Backend" },
    detail: {
      en: "The rules of the product expressed once, on the server, where they cannot be argued with by a client.",
      tr: "Ürünün kurallarının, bir istemcinin itiraz edemeyeceği yerde — sunucuda — bir kez ifade edilmesi.",
    },
    evidence: { kind: "concept", slug: "divan", name: { en: "Divan", tr: "Divan" } },
  },
  {
    id: "database",
    group: { en: "System", tr: "Sistem" },
    title: { en: "Database", tr: "Veritabanı" },
    detail: {
      en: "The model everything else rests on. Getting this wrong is the only mistake that stays expensive for years.",
      tr: "Geri kalan her şeyin üzerine oturduğu model. Yıllarca pahalıya patlamaya devam eden tek hata bu.",
    },
    evidence: { kind: "concept", slug: "olcek", name: { en: "Ölçek", tr: "Ölçek" } },
  },
  {
    id: "auth",
    group: { en: "System", tr: "Sistem" },
    title: { en: "Authentication", tr: "Kimlik doğrulama" },
    detail: {
      en: "Accounts, sessions, roles and row-level permissions — including the external users who must see part of a system and no more.",
      tr: "Hesaplar, oturumlar, roller ve satır düzeyinde yetkiler — sistemin yalnızca bir kısmını görmesi gereken dış kullanıcılar dâhil.",
    },
    evidence: { kind: "concept", slug: "esik", name: { en: "Eşik", tr: "Eşik" } },
  },
  {
    id: "admin",
    group: { en: "System", tr: "Sistem" },
    title: { en: "Admin systems", tr: "Yönetim sistemleri" },
    detail: {
      en: "The interface your team lives in. Built with the product rather than after it, because an unoperable system quietly becomes the developer's job forever.",
      tr: "Ekibinin içinde yaşadığı arayüz. Üründen sonra değil ürünle birlikte kuruluyor; çünkü yönetilemeyen bir sistem sessizce sonsuza kadar geliştiricinin işi hâline gelir.",
    },
    evidence: {
      kind: "shipped",
      slug: "erden-davetiye",
      name: { en: "Erden Davetiye", tr: "Erden Davetiye" },
    },
  },
  {
    id: "ai",
    group: { en: "Intelligence", tr: "Zekâ" },
    title: { en: "AI", tr: "Yapay zekâ" },
    detail: {
      en: "Retrieval over your own records, answers that cite their source, confidence thresholds, approval steps and an audit trail on every run.",
      tr: "Kendi kayıtların üzerinde getirme, kaynağını gösteren cevaplar, güven eşikleri, onay adımları ve her çalışmada denetim izi.",
    },
    evidence: { kind: "concept", slug: "ulak", name: { en: "Ulak", tr: "Ulak" } },
  },
  {
    id: "automation",
    group: { en: "Intelligence", tr: "Zekâ" },
    title: { en: "Automation", tr: "Otomasyon" },
    detail: {
      en: "Triggers, conditions and actions that a person in the business can change without opening a ticket with me.",
      tr: "İşin içindeki birinin bana talep açmadan değiştirebildiği tetikleyiciler, koşullar ve eylemler.",
    },
    evidence: { kind: "concept", slug: "vardiya", name: { en: "Vardiya", tr: "Vardiya" } },
  },
  {
    id: "data",
    group: { en: "Intelligence", tr: "Zekâ" },
    title: { en: "Data and analytics", tr: "Veri ve analitik" },
    detail: {
      en: "Events modelled at the start so questions asked later are queries, plus the dashboards and exports around them.",
      tr: "Sonradan sorulan soruların birer sorgu olması için en baştan modellenmiş olaylar; ve etraflarındaki panolar ve dışa aktarmalar.",
    },
    evidence: { kind: "concept", slug: "olcek", name: { en: "Ölçek", tr: "Ölçek" } },
  },
  {
    id: "payments",
    group: { en: "Connection", tr: "Bağlantı" },
    title: { en: "Payments", tr: "Ödemeler" },
    detail: {
      en: "Checkout, payment states, refunds, commission and payouts — designed so the money is reconcilable at any moment, not just at the end.",
      tr: "Ödeme akışı, ödeme durumları, iadeler, komisyon ve hakedişler — paranın yalnızca sonda değil her an mutabık olabileceği şekilde tasarlanmış.",
    },
    evidence: { kind: "concept", slug: "kervan", name: { en: "Kervan", tr: "Kervan" } },
  },
  {
    id: "integrations",
    group: { en: "Connection", tr: "Bağlantı" },
    title: { en: "Integrations", tr: "Entegrasyonlar" },
    detail: {
      en: "Mail, messaging, accounting, shipping, and internal systems with an endpoint — with the timeouts and duplicates handled, which is the part that matters.",
      tr: "E-posta, mesajlaşma, muhasebe, kargo ve ucu olan iç sistemler — zaman aşımları ve mükerrer kayıtlar ele alınmış hâlde; asıl önemli kısım orası.",
    },
    evidence: { kind: "concept", slug: "ulak", name: { en: "Ulak", tr: "Ulak" } },
  },
  {
    id: "infrastructure",
    group: { en: "Connection", tr: "Bağlantı" },
    title: { en: "Infrastructure", tr: "Altyapı" },
    detail: {
      en: "Environments, releases, domains, certificates, backups and monitoring — held in accounts that belong to you from the first day.",
      tr: "Ortamlar, sürümler, alan adları, sertifikalar, yedekler ve izleme — ilk günden itibaren sana ait hesaplarda tutulur.",
    },
    evidence: { kind: "site", name: { en: "This site", tr: "Bu site" } },
  },
];

export const LAYER_GROUPS = ["Interface", "System", "Intelligence", "Connection"] as const;
