import type { Localized } from "@/lib/i18n";
import type { ZoneId } from "@/data/world-map";

/**
 * The company, as places.
 *
 * Archon Soft's services, each with a department, and most departments with
 * an office somewhere in the world: desks, screens, and the people at them,
 * who greet the visitor, explain what the department does and take a brief.
 * The lobby team by the arrival handles the first question — what are you
 * here for — and the three services that have no office of their own.
 *
 * This is the single source for the whole client journey: the letters the
 * lobby offers, where each department sits, who works there, what each one
 * can be asked for, and the words in both languages. The scene builds the
 * offices from it, the interface builds the cards from it, the walking loop
 * collides with the desks it describes, and the lead that reaches the
 * server names a department and a service from this list and nothing else.
 */

export type DepartmentId =
  | "web"
  | "design"
  | "ai"
  | "games"
  | "marketing"
  | "video"
  | "commerce"
  | "enterprise"
  | "consulting"
  | "other";

/** What the screens on a department's desks show. */
export type ScreenKind = "lobby" | "code" | "design" | "ai" | "viewport" | "timeline" | "analytics" | "commerce" | "enterprise";

export type Service = { id: string; name: Localized };

export type Office = {
  /** Where the office stands: the centre of its floor, on a deck. */
  at: [number, number, number];
  /** Where the visitor is set down on arrival; the desks face this point. */
  arrival: [number, number, number];
  /** The people at the desks, by role. */
  roles: string[];
  screen: ScreenKind;
  accent: string;
};

export type Department = {
  id: DepartmentId;
  /** The letter the lobby offers it under. */
  key: string;
  name: Localized;
  tagline: Localized;
  /** What the department's people say when the visitor arrives. */
  intro: Localized[];
  /** The question before the services. */
  ask: Localized;
  services: Service[];
  zone: ZoneId;
  /** Its own office, or none: then the lobby team handles it. */
  office: Office | null;
};

const L = (en: string, tr: string): Localized => ({ en, tr });

/** Everyone's last option. */
const OTHER: Service = { id: "other", name: L("Something else", "Diğer") };

export const DEPARTMENTS: Department[] = [
  {
    id: "web",
    key: "A",
    name: L("Web & Mobile Software", "Web & Mobil Yazılım"),
    tagline: L("Corporate web, SaaS, mobile apps, custom systems", "Kurumsal web, SaaS, mobil uygulama, özel sistemler"),
    intro: [
      L("We build web and mobile products — from a corporate site to a SaaS platform.", "Web ve mobil projeler geliştiriyoruz — kurumsal siteden SaaS platformuna kadar."),
      L("We can build a corporate web application tailored to you, or a mobile app for iOS and Android.", "Size özel kurumsal web uygulamaları oluşturabilir, iOS ve Android için mobil uygulama geliştirebiliriz."),
      L("We can also modernise the system you already have.", "Mevcut sisteminizi de modernize edebiliriz."),
    ],
    ask: L("What kind of project is it?", "Ne tür bir proje düşünüyorsunuz?"),
    services: [
      { id: "corporate", name: L("Corporate website", "Kurumsal web sitesi") },
      { id: "saas", name: L("SaaS platform", "SaaS platform") },
      { id: "mobile", name: L("Mobile app", "Mobil uygulama") },
      { id: "commerce", name: L("E-commerce", "E-Ticaret") },
      { id: "custom", name: L("Custom software", "Özel yazılım") },
      { id: "api", name: L("API / backend", "API / Backend") },
      { id: "maintenance", name: L("Maintenance & development", "Bakım & geliştirme") },
      OTHER,
    ],
    zone: "shipped",
    office: {
      at: [-13, 0, -62],
      arrival: [-4.5, 0, -62],
      roles: ["frontend", "backend", "mobile", "lead"],
      screen: "code",
      accent: "#6aa8ff",
    },
  },
  {
    id: "design",
    key: "B",
    name: L("UI/UX Design", "UI/UX Tasarım"),
    tagline: L("Product design, interfaces, design systems", "Ürün tasarımı, arayüz, tasarım sistemleri"),
    intro: [
      L("This is the design studio: interfaces, product flows and design systems are drawn here.", "Burası tasarım stüdyosu: arayüzler, ürün akışları ve tasarım sistemleri burada çiziliyor."),
      L("We can design your product from research to prototype, or redesign the interface you have.", "Ürününüzü araştırmadan prototipe kadar tasarlayabilir ya da mevcut arayüzünüzü yeniden ele alabiliriz."),
    ],
    ask: L("What would you like designed?", "Neyin tasarlanmasını istiyorsunuz?"),
    services: [
      { id: "product", name: L("Product design", "Ürün tasarımı") },
      { id: "web", name: L("Web design", "Web tasarımı") },
      { id: "mobile", name: L("Mobile app design", "Mobil uygulama tasarımı") },
      { id: "system", name: L("Design system", "Tasarım sistemi") },
      { id: "brand", name: L("Brand & identity", "Marka & kimlik") },
      { id: "prototype", name: L("Prototype", "Prototip") },
      { id: "audit", name: L("UX audit", "UX denetimi") },
      OTHER,
    ],
    zone: "archive",
    office: {
      at: [0, 0, 52],
      arrival: [0, 0, 43.5],
      roles: ["ui", "ux", "art"],
      screen: "design",
      accent: "#f2a7c7",
    },
  },
  {
    id: "ai",
    key: "C",
    name: L("AI Solutions", "Yapay Zeka Çözümleri"),
    tagline: L("Assistants, automation, data and models", "Asistanlar, otomasyon, veri ve modeller"),
    intro: [
      L("The AI lab: assistants, automations and models built into real products.", "Yapay zeka laboratuvarı: gerçek ürünlere gömülü asistanlar, otomasyonlar ve modeller."),
      L("We can put an assistant in front of your customers, automate a process, or make sense of your data.", "Müşterilerinizin karşısına bir asistan koyabilir, bir süreci otomatikleştirebilir ya da verinizi anlamlandırabiliriz."),
    ],
    ask: L("Where should the intelligence go?", "Yapay zekayı nerede kullanmak istiyorsunuz?"),
    services: [
      { id: "assistant", name: L("Chatbot / assistant", "Chatbot / asistan") },
      { id: "automation", name: L("Process automation", "Süreç otomasyonu") },
      { id: "analytics", name: L("Data analytics", "Veri analitiği") },
      { id: "vision", name: L("Image & document processing", "Görüntü & doküman işleme") },
      { id: "integration", name: L("AI integration", "Yapay zeka entegrasyonu") },
      { id: "model", name: L("Custom model", "Özel model") },
      { id: "consulting", name: L("AI consulting", "Yapay zeka danışmanlığı") },
      OTHER,
    ],
    zone: "labs",
    office: {
      at: [58, 0, -6],
      arrival: [49.5, 0, -6],
      roles: ["aiEngineer", "mlEngineer", "researcher"],
      screen: "ai",
      accent: "#56d9ff",
    },
  },
  {
    id: "games",
    key: "D",
    name: L("3D / Game Development", "3D / Oyun Geliştirme"),
    tagline: L("Real-time 3D, games, AR/VR, configurators", "Gerçek zamanlı 3D, oyun, AR/VR, konfigüratör"),
    intro: [
      L("The immersive studio: real-time 3D, games and interactive worlds — this one included.", "Immersive stüdyo: gerçek zamanlı 3D, oyunlar ve etkileşimli dünyalar — bu dünya dahil."),
      L("We can build a 3D experience for the web, a game for mobile or desktop, or an AR/VR application.", "Web için 3D deneyim, mobil ya da masaüstü için oyun, AR/VR uygulaması geliştirebiliriz."),
    ],
    ask: L("What should we build in 3D?", "3D'de ne yapalım?"),
    services: [
      { id: "web3d", name: L("Web 3D experience", "Web 3D deneyim") },
      { id: "mobileGame", name: L("Mobile game", "Mobil oyun") },
      { id: "pcGame", name: L("PC / console game", "PC / konsol oyunu") },
      { id: "arvr", name: L("AR / VR", "AR / VR") },
      { id: "configurator", name: L("Product configurator", "Ürün konfigüratörü") },
      { id: "simulation", name: L("Simulation / training", "Simülasyon / eğitim") },
      { id: "assets", name: L("3D assets & scenes", "3D varlıklar & sahneler") },
      OTHER,
    ],
    zone: "labs",
    office: {
      at: [58, 0, 6],
      arrival: [49.5, 0, 6],
      roles: ["gameDev", "artist3d", "techArtist"],
      screen: "viewport",
      accent: "#9a86ff",
    },
  },
  {
    id: "marketing",
    key: "E",
    name: L("Digital Marketing", "Dijital Pazarlama"),
    tagline: L("Growth, search, ads, content", "Büyüme, arama, reklam, içerik"),
    intro: [
      L("Digital marketing is run from the lobby team: search, ads, content and growth.", "Dijital pazarlamayı lobi ekibi yürütüyor: arama, reklam, içerik ve büyüme."),
      L("We can bring the right people to what you have built, and measure what happens next.", "Kurduğunuz şeye doğru insanları getirip sonrasında ne olduğunu ölçebiliriz."),
    ],
    ask: L("Which channel matters most?", "Hangi kanal öncelikli?"),
    services: [
      { id: "seo", name: L("SEO", "SEO") },
      { id: "ads", name: L("Paid ads", "Reklam yönetimi") },
      { id: "social", name: L("Social media", "Sosyal medya") },
      { id: "content", name: L("Content", "İçerik") },
      { id: "email", name: L("Email marketing", "E-posta pazarlama") },
      { id: "analytics", name: L("Analytics & measurement", "Analitik & ölçüm") },
      { id: "strategy", name: L("Growth strategy", "Büyüme stratejisi") },
      OTHER,
    ],
    zone: "hub",
    office: null,
  },
  {
    id: "video",
    key: "F",
    name: L("Video & Animation", "Video & Animasyon"),
    tagline: L("Promos, motion, 3D animation", "Tanıtım, motion, 3D animasyon"),
    intro: [
      L("The production studio: promos, motion graphics and 3D animation are cut here.", "Prodüksiyon stüdyosu: tanıtım filmleri, motion grafik ve 3D animasyon burada kesiliyor."),
      L("We can make a product video, an explainer, or a motion identity for your brand.", "Ürün videosu, açıklayıcı animasyon ya da markanız için hareketli bir kimlik yapabiliriz."),
    ],
    ask: L("What kind of video?", "Ne tür bir video?"),
    services: [
      { id: "promo", name: L("Promo film", "Tanıtım filmi") },
      { id: "motion", name: L("Motion graphics", "Motion grafik") },
      { id: "animation3d", name: L("3D animation", "3D animasyon") },
      { id: "explainer", name: L("Explainer video", "Açıklayıcı video") },
      { id: "social", name: L("Social video", "Sosyal medya videosu") },
      { id: "editing", name: L("Editing", "Kurgu") },
      { id: "product", name: L("Product video", "Ürün videosu") },
      OTHER,
    ],
    zone: "archive",
    office: {
      at: [0, 0, 74],
      arrival: [0, 0, 65.5],
      roles: ["editor", "motion", "animator"],
      screen: "timeline",
      accent: "#ffb347",
    },
  },
  {
    id: "commerce",
    key: "G",
    name: L("E-Commerce Solutions", "E-Ticaret Çözümleri"),
    tagline: L("Stores, marketplaces, payments, integrations", "Mağaza, pazaryeri, ödeme, entegrasyon"),
    intro: [
      L("The commerce office: storefronts, the systems behind them and the integrations between.", "Ticaret ofisi: vitrinler, arkalarındaki sistemler ve aradaki entegrasyonlar."),
      L("Erden Davetiye — a live storefront and its admin system — was built at these desks.", "Erden Davetiye — canlı bir vitrin ve yönetim sistemi — bu masalarda yapıldı."),
    ],
    ask: L("What does your commerce need?", "Ticaretinizin neye ihtiyacı var?"),
    services: [
      { id: "store", name: L("Online store", "Online mağaza") },
      { id: "marketplace", name: L("Marketplace", "Pazaryeri") },
      { id: "b2b", name: L("B2B commerce", "B2B ticaret") },
      { id: "payments", name: L("Payments & checkout", "Ödeme & sepet") },
      { id: "erp", name: L("ERP / stock integration", "ERP / stok entegrasyonu") },
      { id: "migration", name: L("Platform migration", "Platform geçişi") },
      { id: "growth", name: L("Conversion & growth", "Dönüşüm & büyüme") },
      OTHER,
    ],
    zone: "shipped",
    office: {
      at: [13, 0, -62],
      arrival: [4.5, 0, -62],
      roles: ["commerceDev", "integrations", "productOwner"],
      screen: "commerce",
      accent: "#f2a889",
    },
  },
  {
    id: "enterprise",
    key: "H",
    name: L("Enterprise Software", "Kurumsal Yazılım"),
    tagline: L("ERP, CRM, portals, workflows, dashboards", "ERP, CRM, portal, iş akışı, dashboard"),
    intro: [
      L("Corporate technology: the systems a company runs on — ERP, CRM, portals, workflows.", "Kurumsal teknoloji: bir şirketin üzerinde koştuğu sistemler — ERP, CRM, portal, iş akışı."),
      L("We can build the internal tool your team is missing, or connect the ones that do not talk to each other.", "Ekibinizin eksik olan iç aracını kurabilir ya da birbiriyle konuşmayan sistemleri bağlayabiliriz."),
    ],
    ask: L("Which system are we talking about?", "Hangi sistemden bahsediyoruz?"),
    services: [
      { id: "erp", name: L("ERP", "ERP") },
      { id: "crm", name: L("CRM", "CRM") },
      { id: "workflow", name: L("Workflow automation", "İş akışı otomasyonu") },
      { id: "portal", name: L("Portal / intranet", "Portal / intranet") },
      { id: "integration", name: L("System integration", "Sistem entegrasyonu") },
      { id: "dashboard", name: L("Reporting & dashboards", "Raporlama & dashboard") },
      { id: "modernization", name: L("Modernisation", "Modernizasyon") },
      OTHER,
    ],
    zone: "systems",
    office: {
      at: [-62, 0, -17],
      arrival: [-53.5, 0, -17],
      roles: ["architect", "backend", "analyst"],
      screen: "enterprise",
      accent: "#7fb3ff",
    },
  },
  {
    id: "consulting",
    key: "I",
    name: L("Consulting", "Danışmanlık"),
    tagline: L("Discovery, architecture, product, roadmap", "Keşif, mimari, ürün, yol haritası"),
    intro: [
      L("Consulting starts here, with the lobby team: what to build, in what order, on what.", "Danışmanlık burada, lobi ekibiyle başlıyor: ne yapılacak, hangi sırayla, neyin üstüne."),
      L("A discovery workshop, an architecture review or a product roadmap — before a line is written.", "Bir keşif atölyesi, mimari inceleme ya da ürün yol haritası — tek satır yazılmadan önce."),
    ],
    ask: L("What do you need advice on?", "Hangi konuda danışmanlık istiyorsunuz?"),
    services: [
      { id: "discovery", name: L("Discovery workshop", "Keşif atölyesi") },
      { id: "architecture", name: L("Architecture review", "Mimari inceleme") },
      { id: "product", name: L("Product strategy", "Ürün stratejisi") },
      { id: "transformation", name: L("Digital transformation", "Dijital dönüşüm") },
      { id: "security", name: L("Security & compliance", "Güvenlik & uyum") },
      { id: "team", name: L("Team & process", "Ekip & süreç") },
      { id: "roadmap", name: L("Roadmap", "Yol haritası") },
      OTHER,
    ],
    zone: "hub",
    office: null,
  },
  {
    id: "other",
    key: "J",
    name: L("Custom Project / Other", "Özel Proje / Diğer"),
    tagline: L("Tell us what you have in mind", "Aklınızdakini anlatın"),
    intro: [L("Not on the list? Tell us what you have in mind and we will find the right people for it.", "Listede yok mu? Aklınızdakini anlatın, doğru ekibi biz bulalım.")],
    ask: L("How would you describe it?", "Nasıl tarif edersiniz?"),
    services: [{ id: "describe", name: L("Let me describe it", "Ben anlatayım") }],
    zone: "hub",
    office: null,
  },
];

/** The lobby team, by the arrival: the first people the visitor meets. */
export const LOBBY_OFFICE: Office = {
  at: [-14.5, 0, 13],
  arrival: [-6, 0, 13],
  roles: ["reception", "account", "product", "support", "sales"],
  screen: "lobby",
  accent: "#f2a889",
};

/** Which way an office faces: toward its arrival point, about y. */
export const officeFacing = (office: Office) => Math.atan2(office.arrival[0] - office.at[0], office.arrival[2] - office.at[2]);
/** Which way the visitor faces on arrival, in the walking loop's convention (0 north, positive west). */
export const arrivalYaw = (office: Office) => Math.atan2(-(office.at[0] - office.arrival[0]), -(office.at[2] - office.arrival[2]));

export const departmentById = (id: string): Department | undefined => DEPARTMENTS.find((one) => one.id === id);
export const departmentByKey = (key: string): Department | undefined =>
  DEPARTMENTS.find((one) => one.key.toLowerCase() === key.toLowerCase());

/** Every office in the world, keyed: the lobby and each department's. */
export const OFFICES: { id: string; office: Office; department: DepartmentId | null }[] = [
  { id: "lobby", office: LOBBY_OFFICE, department: null },
  ...DEPARTMENTS.filter((d) => d.office).map((d) => ({ id: d.id, office: d.office!, department: d.id })),
];

/* -------------------------------------------------------------- geometry */

/**
 * How an office is laid out, in its own frame: desks in two rows facing
 * +z (the visitor's side after `yaw`), each 1.6 wide and 0.8 deep, with a
 * chair behind. The walking loop and the scene both read this, so what you
 * see is what you bump into.
 */
export const DESK = { width: 1.6, depth: 0.8, height: 0.74, gap: 0.5 };

export function deskSlots(count: number): { x: number; z: number }[] {
  const perRow = Math.min(count, 3);
  const rows = Math.ceil(count / perRow);
  const pitch = DESK.width + DESK.gap;
  const slots: { x: number; z: number }[] = [];
  for (let i = 0; i < count; i += 1) {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, count - row * perRow);
    const col = i % perRow;
    slots.push({ x: (col - (inRow - 1) / 2) * pitch, z: -row * 2.4 + (rows - 1) * 1.2 });
  }
  return slots;
}

/**
 * A point in an office's frame, in the world: rotated by the office's facing
 * about y and moved to its centre.
 */
export function officeToWorld(office: Office, x: number, z: number): [number, number] {
  const yaw = officeFacing(office);
  return [office.at[0] + x * Math.cos(yaw) + z * Math.sin(yaw), office.at[2] - x * Math.sin(yaw) + z * Math.cos(yaw)];
}

/**
 * What an office is solid as: one box per desk with its chair, and the
 * board wall behind the team — axis-aligned in the world, so a turned office
 * gets the bounding box of each piece. Appended to the world's obstacles.
 */
export function officeObstacles(office: Office): { at: [number, number, number]; size: [number, number, number] }[] {
  const yaw = officeFacing(office);
  const turned = Math.abs(Math.sin(yaw)) > 0.5;
  const boxes: { at: [number, number, number]; size: [number, number, number] }[] = [];
  for (const slot of deskSlots(office.roles.length)) {
    const [x, z] = officeToWorld(office, slot.x, slot.z - 0.35);
    const w = DESK.width + 0.3;
    const d = DESK.depth + 1.3;
    boxes.push({ at: [x, 0.6, z], size: turned ? [d, 1.2, w] : [w, 1.2, d] });
  }
  const rows = Math.ceil(office.roles.length / 3);
  const [bx, bz] = officeToWorld(office, 0, -rows * 1.2 - 1.9);
  const span = Math.min(office.roles.length, 3) * (DESK.width + DESK.gap) + 1.2;
  boxes.push({ at: [bx, 1.6, bz], size: turned ? [0.5, 3.2, span] : [span, 3.2, 0.5] });
  return boxes;
}

export const OFFICE_OBSTACLES = OFFICES.flatMap((one) => officeObstacles(one.office));
