import type { StaticImageData } from "next/image";
import type { DepartmentId } from "@/data/departments";
import { DPPANO, ERDEN, MEETZY, type Screen } from "@/data/screens";
import { SERVICE_META, type ServiceId } from "@/data/serviceIds";
import type { ProjectType } from "@/lib/contact";
import type { Localized } from "@/lib/i18n";

import worldGate from "@/assets/work/world/01-gate.jpg";
import worldMeetzy from "@/assets/work/world/02-meetzy-station.jpg";
import worldDpPano from "@/assets/work/world/03-dppano-hall.jpg";
import worldErden from "@/assets/work/world/04-erden-station.jpg";

import aiAssistant from "@/assets/services/concepts/ai-assistant.jpg";
import aiSupport from "@/assets/services/concepts/ai-support.jpg";
import aiKnowledge from "@/assets/services/concepts/ai-knowledge.jpg";
import automationRules from "@/assets/services/concepts/automation-rules.jpg";
import automationApprovals from "@/assets/services/concepts/automation-approvals.jpg";
import customDashboard from "@/assets/services/concepts/custom-dashboard.jpg";
import customPipeline from "@/assets/services/concepts/custom-pipeline.jpg";
import commerceOrders from "@/assets/services/concepts/commerce-marketplace-orders.jpg";
import integrationPortal from "@/assets/services/concepts/integration-client-portal.jpg";

export type { ServiceId } from "@/data/serviceIds";

/**
 * What Archon Soft builds, as one model.
 *
 * Nothing on this list was invented for the page. Every service is one the
 * studio already offers in Archon World, where each department names what it
 * can be asked for (`departments.ts`) and a lead names a department and a
 * service from that list. The explorer groups those offers into the nine
 * things a visitor actually comes to build, in the visitor's words, and says
 * where each one is answered: `world` is the office and service a brief
 * would name, `projectType` the choice it preselects on the contact form.
 *
 * The evidence is kept honest by type:
 *
 * - `projects` are shipped work, and a project is only listed under a service
 *   its own case study shows it doing.
 * - `concepts` are Archon Labs products — running interfaces built by the
 *   studio, never client work — and every picture from one carries
 *   `concept: true`, which the interface prints.
 * - There is no price, duration, count, rate or result anywhere in this file.
 *   `technologies` appears only where a real project states it.
 */

export type ServiceMedia = {
  image: StaticImageData;
  alt: Localized;
  kind: "phone" | "screen" | "scene";
  /** What the picture is, printed under it in the gallery. */
  context: Localized;
  /** An Archon Labs interface, not a client's product. */
  concept?: boolean;
};

export type Service = {
  id: ServiceId;
  title: Localized;
  /** One line over the title, e.g. the department it comes from. */
  eyebrow: Localized;
  /** The sentence that makes a visitor say "that is what I need". */
  headline: Localized;
  shortDescription: Localized;
  description: Localized;
  /** What can be built under it: three to six, from the department's own list. */
  capabilities: Localized[];
  /** Only where a shipped project states its stack. */
  technologies?: { label: Localized; value: string }[];
  /** The stage: the first picture leads. */
  hero: ServiceMedia[];
  gallery: ServiceMedia[];
  /** Shipped work that does this. Slugs from the showcase. */
  projects: string[];
  /** Archon Labs concepts that explore it. Slugs from labs. */
  concepts: string[];
  /** Where the brief goes. */
  world: { department: DepartmentId; service: string };
  projectType: ProjectType;
  accent: string;
  seoDescription: Localized;
};

const L = (en: string, tr: string): Localized => ({ en, tr });

const shot = (screen: Screen, context: Localized): ServiceMedia => ({
  image: screen.image,
  alt: screen.caption,
  kind: screen.image.width > screen.image.height ? "screen" : "phone",
  context,
});

const concept = (image: StaticImageData, alt: Localized, context: Localized): ServiceMedia => ({
  image,
  alt,
  kind: "screen",
  context,
  concept: true,
});

const world = (image: StaticImageData, alt: Localized): ServiceMedia => ({
  image,
  alt,
  kind: "scene",
  context: L("Archon Soft World · rendered in the browser", "Archon Soft World · tarayıcıda render"),
});

const MEETZY_CTX = L("Meetzy · mobile product", "Meetzy · mobil ürün");
const DPPANO_CTX = L("DP Pano · web platform", "DP Pano · web platformu");
const ERDEN_CTX = L("Erden Davetiye · commerce system", "Erden Davetiye · ticaret sistemi");
const LABS = (what: Localized): Localized => ({
  en: `Concept · Archon Labs · ${what.en}`,
  tr: `Konsept · Archon Labs · ${what.tr}`,
});

export const SERVICES: Service[] = [
  {
    id: "mobile",
    title: SERVICE_META.mobile.title,
    eyebrow: L("iOS · Android", "iOS · Android"),
    headline: L("Turn the idea into a mobile product people use.", "Fikrinizi, insanların kullandığı bir mobil ürüne dönüştürelim."),
    shortDescription: L(
      "From the first screen to the server behind it: designed, built and released as one piece of work.",
      "İlk ekrandan arkasındaki sunucuya kadar: tek bir iş olarak tasarlanır, geliştirilir ve yayına alınır.",
    ),
    description: L(
      "An app is rarely only an app. It is accounts, a server, notifications and the product decisions that make people come back. We design and build all of it end to end.",
      "Bir uygulama nadiren yalnızca uygulamadır: hesaplar, sunucu, bildirimler ve insanları geri getiren ürün kararları. Hepsini uçtan uca tasarlıyor ve geliştiriyoruz.",
    ),
    capabilities: [
      L("Mobile app design", "Mobil uygulama tasarımı"),
      L("iOS and Android", "iOS ve Android"),
      L("Backend & API", "Backend & API"),
      L("Accounts & sign-in", "Hesaplar & giriş"),
      L("Notifications", "Bildirimler"),
      L("Maps & location", "Harita & konum"),
    ],
    hero: [
      shot(MEETZY.problem!, MEETZY_CTX),
      shot(MEETZY.plan!, MEETZY_CTX),
      shot(MEETZY.real!, MEETZY_CTX),
    ],
    gallery: [
      shot(MEETZY.problem!, MEETZY_CTX),
      shot(MEETZY.plan!, MEETZY_CTX),
      shot(MEETZY.real!, MEETZY_CTX),
      shot(MEETZY.join!, MEETZY_CTX),
      shot(MEETZY.mood!, MEETZY_CTX),
      shot(MEETZY.map!, MEETZY_CTX),
    ],
    projects: ["meetzy"],
    concepts: ["vesile"],
    world: { department: "web", service: "mobile" },
    projectType: SERVICE_META.mobile.projectType,
    accent: "#F0483C",
    seoDescription: L(
      "Mobile app design and development for iOS and Android, with the backend, accounts and notifications behind it.",
      "iOS ve Android için mobil uygulama tasarımı ve geliştirme; arkasındaki backend, hesaplar ve bildirimlerle.",
    ),
  },
  {
    id: "web",
    title: SERVICE_META.web.title,
    eyebrow: L("Web · SaaS · panels", "Web · SaaS · paneller"),
    headline: L("A web platform your team and your customers run on.", "Ekibinizin ve müşterilerinizin üzerinde çalıştığı bir web platformu."),
    shortDescription: L(
      "Panels, accounts and live screens that update themselves — in the browser, on any device.",
      "Paneller, hesaplar ve kendini güncelleyen canlı ekranlar — tarayıcıda, her cihazda.",
    ),
    description: L(
      "From a corporate site to a SaaS product with roles and live data. DP Pano, a school board system run from one panel, is one we built and still develop.",
      "Kurumsal siteden roller ve canlı verisi olan bir SaaS ürününe kadar. Okulun tüm ekranlarını tek panelden yöneten DP Pano, kurduğumuz ve geliştirmeye devam ettiğimiz işlerden biri.",
    ),
    capabilities: [
      L("SaaS platform", "SaaS platform"),
      L("Admin panels", "Yönetim panelleri"),
      L("Roles & permissions", "Rol & yetkiler"),
      L("Real-time screens", "Gerçek zamanlı ekranlar"),
      L("Corporate website", "Kurumsal web sitesi"),
      L("Maintenance & development", "Bakım & geliştirme"),
    ],
    technologies: [
      { label: L("DP Pano runs on", "DP Pano altyapısı"), value: "Python · Flask · PostgreSQL · Redis · SSE" },
    ],
    hero: [
      shot(DPPANO.board!, DPPANO_CTX),
      shot(DPPANO.screens!, DPPANO_CTX),
      shot(DPPANO.staffroom!, DPPANO_CTX),
    ],
    gallery: [
      shot(DPPANO.board!, DPPANO_CTX),
      shot(DPPANO.staffroom!, DPPANO_CTX),
      shot(DPPANO.canteen!, DPPANO_CTX),
      shot(DPPANO.screens!, DPPANO_CTX),
      shot(DPPANO.layout!, DPPANO_CTX),
      shot(DPPANO.timetable!, DPPANO_CTX),
    ],
    projects: ["dppano"],
    concepts: ["olcek"],
    world: { department: "web", service: "saas" },
    projectType: SERVICE_META.web.projectType,
    accent: "#2563EB",
    seoDescription: L(
      "Web platform and SaaS development: admin panels, roles, real-time screens and corporate websites.",
      "Web platformu ve SaaS geliştirme: yönetim panelleri, roller, gerçek zamanlı ekranlar ve kurumsal web siteleri.",
    ),
  },
  {
    id: "custom",
    title: SERVICE_META.custom.title,
    eyebrow: L("ERP · CRM · internal tools", "ERP · CRM · iç araçlar"),
    headline: L("The system your business actually runs on.", "İşinizin gerçekten üzerinde döndüğü sistem."),
    shortDescription: L(
      "The internal tool your team is missing, or one system where there are four that do not talk.",
      "Ekibinizin eksik iç aracı ya da birbiriyle konuşmayan dört aracın yerine tek bir sistem.",
    ),
    description: L(
      "Customers, work, approvals, permissions and reports in one model, built around how your business works rather than how a package assumes it does.",
      "Müşteriler, işler, onaylar, yetkiler ve raporlar tek modelde; bir paket programın varsaydığı gibi değil, işinizin gerçekten yürüdüğü gibi kurulur.",
    ),
    capabilities: [
      L("ERP", "ERP"),
      L("CRM", "CRM"),
      L("Portal / intranet", "Portal / intranet"),
      L("Reporting & dashboards", "Raporlama & dashboard"),
      L("Permission matrix", "Yetki matrisi"),
      L("Modernising an old system", "Eski sistemi modernize etme"),
    ],
    hero: [
      shot(DPPANO.permissions!, DPPANO_CTX),
      shot(ERDEN.admin!, ERDEN_CTX),
      concept(customDashboard, L("Company overview", "Şirket görünümü"), LABS(L("business operating system", "iş yönetim sistemi"))),
    ],
    gallery: [
      shot(DPPANO.permissions!, DPPANO_CTX),
      shot(DPPANO.layout!, DPPANO_CTX),
      shot(ERDEN.admin!, ERDEN_CTX),
      concept(customDashboard, L("Company overview", "Şirket görünümü"), LABS(L("business operating system", "iş yönetim sistemi"))),
      concept(customPipeline, L("Sales pipeline", "Satış hattı"), LABS(L("business operating system", "iş yönetim sistemi"))),
    ],
    projects: ["dppano", "erden"],
    concepts: ["divan", "atolye"],
    world: { department: "enterprise", service: "erp" },
    projectType: SERVICE_META.custom.projectType,
    accent: "#62D8FF",
    seoDescription: L(
      "Custom business software: ERP, CRM, portals, dashboards and permission systems built around how you work.",
      "İşletmenize özel yazılım: ERP, CRM, portal, dashboard ve yetki sistemleri, çalışma şeklinize göre.",
    ),
  },
  {
    id: "commerce",
    title: SERVICE_META.commerce.title,
    eyebrow: L("Store · marketplace · admin", "Mağaza · pazar yeri · yönetim"),
    headline: L("A store, and the system behind it.", "Bir vitrin ve arkasındaki sistem."),
    shortDescription: L(
      "A storefront people buy from with confidence, and an admin the business runs on itself.",
      "İnsanların gönül rahatlığıyla alışveriş yaptığı bir vitrin ve işletmenin kendi başına yönettiği bir panel.",
    ),
    description: L(
      "Catalogue, orders, customers, coupons and reviews — the half you see and the half that keeps it running. Erden Davetiye, a live storefront with its admin, is one we built.",
      "Katalog, siparişler, müşteriler, kuponlar ve yorumlar — görünen yarısı ve onu ayakta tutan yarısı. Canlı bir vitrin ve yönetim paneli olan Erden Davetiye, kurduğumuz işlerden biri.",
    ),
    capabilities: [
      L("Online store", "Online mağaza"),
      L("Marketplace", "Pazar yeri"),
      L("Payments & checkout", "Ödeme & sepet"),
      L("Order & stock management", "Sipariş & stok yönetimi"),
      L("ERP / stock integration", "ERP / stok entegrasyonu"),
      L("Platform migration", "Platform geçişi"),
    ],
    hero: [
      shot(ERDEN.home!, ERDEN_CTX),
      shot(ERDEN.products!, ERDEN_CTX),
      shot(ERDEN.categories!, ERDEN_CTX),
    ],
    gallery: [
      shot(ERDEN.home!, ERDEN_CTX),
      shot(ERDEN.categories!, ERDEN_CTX),
      shot(ERDEN.products!, ERDEN_CTX),
      shot(ERDEN.admin!, ERDEN_CTX),
      concept(commerceOrders, L("Orders across sellers", "Satıcılar arası siparişler"), LABS(L("multi-vendor marketplace", "çok satıcılı pazar yeri"))),
    ],
    projects: ["erden"],
    concepts: ["kervan", "tezgah"],
    world: { department: "commerce", service: "store" },
    projectType: SERVICE_META.commerce.projectType,
    accent: "#B08D57",
    seoDescription: L(
      "E-commerce development: online stores, marketplaces, payments and the admin system behind them.",
      "E-ticaret geliştirme: online mağaza, pazar yeri, ödeme ve arkasındaki yönetim sistemi.",
    ),
  },
  {
    id: "ai",
    title: SERVICE_META.ai.title,
    eyebrow: L("Assistants · documents · data", "Asistanlar · dokümanlar · veri"),
    headline: L("AI inside the product, not beside it.", "Yapay zekâ ürünün yanında değil, içinde."),
    shortDescription: L(
      "Assistants that answer from your own records, documents read into fields, and data that makes sense.",
      "Kendi kayıtlarınızdan cevap veren asistanlar, alanlara okunan dokümanlar ve anlam kazanan veri.",
    ),
    description: L(
      "An assistant in front of your customers, a model that reads the paperwork, or search that answers with its source. The pictures here are Archon Labs concepts — running interfaces we built to show how it works.",
      "Müşterilerinizin karşısında bir asistan, evrakı okuyan bir model ya da kaynağıyla cevap veren bir arama. Buradaki görseller Archon Labs konseptleri — nasıl çalıştığını göstermek için kurduğumuz çalışan arayüzler.",
    ),
    capabilities: [
      L("Chatbot / assistant", "Chatbot / asistan"),
      L("Image & document processing", "Görüntü & doküman işleme"),
      L("Data analytics", "Veri analitiği"),
      L("AI integration", "Yapay zekâ entegrasyonu"),
      L("Custom model", "Özel model"),
    ],
    hero: [
      concept(aiAssistant, L("Operations assistant", "Operasyon asistanı"), LABS(L("AI operations platform", "yapay zekâ operasyon platformu"))),
      concept(aiSupport, L("Customer conversations", "Müşteri görüşmeleri"), LABS(L("AI customer support", "yapay zekâ müşteri desteği"))),
      concept(aiKnowledge, L("Ask the company", "Şirkete sor"), LABS(L("knowledge platform", "kurumsal bilgi platformu"))),
    ],
    gallery: [
      concept(aiAssistant, L("Operations assistant", "Operasyon asistanı"), LABS(L("AI operations platform", "yapay zekâ operasyon platformu"))),
      concept(aiSupport, L("Customer conversations", "Müşteri görüşmeleri"), LABS(L("AI customer support", "yapay zekâ müşteri desteği"))),
      concept(aiKnowledge, L("Ask the company", "Şirkete sor"), LABS(L("knowledge platform", "kurumsal bilgi platformu"))),
    ],
    projects: [],
    concepts: ["ulak", "vardiya", "kutuk"],
    world: { department: "ai", service: "assistant" },
    projectType: SERVICE_META.ai.projectType,
    accent: "#8B7CF6",
    seoDescription: L(
      "AI solutions: assistants, document processing, data analytics and AI built into real products.",
      "Yapay zekâ çözümleri: asistanlar, doküman işleme, veri analitiği ve gerçek ürünlere gömülü yapay zekâ.",
    ),
  },
  {
    id: "automation",
    title: SERVICE_META.automation.title,
    eyebrow: L("Workflows · scheduling · rules", "İş akışları · çizelgeleme · kurallar"),
    headline: L("The work that repeats, done by the system.", "Tekrarlanan işi sistem yapsın."),
    shortDescription: L(
      "Rules, approvals and schedules that run by themselves — and say what they could not do.",
      "Kendi başına çalışan kurallar, onaylar ve çizelgeler — ve yapamadığını söyleyen bir sistem.",
    ),
    description: L(
      "DP Pano allocates a school's duty roster and solves its timetable automatically, and shows what it could not place. The same thinking applies to approvals, notifications and any process that runs on a spreadsheet today.",
      "DP Pano bir okulun nöbet çizelgesini otomatik dağıtıyor, ders programını çözüyor ve yerleştiremediğini gösteriyor. Aynı yaklaşım onaylara, bildirimlere ve bugün bir tabloda yürüyen her sürece uygulanabilir.",
    ),
    capabilities: [
      L("Process automation", "Süreç otomasyonu"),
      L("Workflow & approvals", "İş akışı & onaylar"),
      L("Scheduling & solvers", "Çizelgeleme & çözücüler"),
      L("Notifications & alerts", "Bildirim & uyarılar"),
      L("Reporting", "Raporlama"),
    ],
    technologies: [
      { label: L("DP Pano's solver", "DP Pano çözücüsü"), value: "Google OR-Tools CP-SAT · APScheduler" },
    ],
    hero: [
      shot(DPPANO.duty!, DPPANO_CTX),
      shot(DPPANO.solver!, DPPANO_CTX),
      concept(automationRules, L("Automation rules", "Otomasyon kuralları"), LABS(L("AI operations platform", "yapay zekâ operasyon platformu"))),
    ],
    gallery: [
      shot(DPPANO.duty!, DPPANO_CTX),
      shot(DPPANO.solver!, DPPANO_CTX),
      shot(DPPANO.dutyPrint!, DPPANO_CTX),
      concept(automationRules, L("Automation rules", "Otomasyon kuralları"), LABS(L("AI operations platform", "yapay zekâ operasyon platformu"))),
      concept(automationApprovals, L("Waiting for approval", "Onay bekleyenler"), LABS(L("operations management", "operasyon yönetimi"))),
    ],
    projects: ["dppano"],
    concepts: ["ulak", "atolye"],
    world: { department: "ai", service: "automation" },
    projectType: SERVICE_META.automation.projectType,
    accent: "#2563EB",
    seoDescription: L(
      "Business process automation: workflows, approvals, scheduling solvers and notifications.",
      "İş süreci otomasyonu: iş akışları, onaylar, çizelgeleme çözücüleri ve bildirimler.",
    ),
  },
  {
    id: "integration",
    title: SERVICE_META.integration.title,
    eyebrow: L("API · backend · systems", "API · backend · sistemler"),
    headline: L("Systems that talk to each other.", "Birbiriyle konuşan sistemler."),
    shortDescription: L(
      "One source of truth feeding every screen, app and partner — through a backend built to be relied on.",
      "Her ekranı, uygulamayı ve iş ortağını besleyen tek bir doğru kaynak — güvenilecek şekilde kurulmuş bir backend ile.",
    ),
    description: L(
      "An API for your app, a bridge between the ERP and the store, or live data pushed to screens. In DP Pano, one panel updates every screen in the building within seconds.",
      "Uygulamanız için bir API, ERP ile mağaza arasında bir köprü ya da ekranlara anlık gönderilen veri. DP Pano'da tek panel, binadaki her ekranı saniyeler içinde güncelliyor.",
    ),
    capabilities: [
      L("API / backend", "API / backend"),
      L("System integration", "Sistem entegrasyonu"),
      L("Real-time data", "Gerçek zamanlı veri"),
      L("ERP / stock integration", "ERP / stok entegrasyonu"),
      L("Client portals", "Müşteri portalları"),
    ],
    technologies: [
      { label: L("DP Pano runs on", "DP Pano altyapısı"), value: "PostgreSQL · Redis pub/sub · Server-Sent Events" },
    ],
    hero: [
      shot(DPPANO.screens!, DPPANO_CTX),
      shot(DPPANO.board!, DPPANO_CTX),
      concept(integrationPortal, L("A client's own window", "Müşterinin kendi penceresi"), LABS(L("client portal", "müşteri portalı"))),
    ],
    gallery: [
      shot(DPPANO.screens!, DPPANO_CTX),
      shot(DPPANO.board!, DPPANO_CTX),
      shot(DPPANO.safeMode!, DPPANO_CTX),
      concept(integrationPortal, L("A client's own window", "Müşterinin kendi penceresi"), LABS(L("client portal", "müşteri portalı"))),
    ],
    projects: ["dppano"],
    concepts: ["esik"],
    world: { department: "web", service: "api" },
    projectType: SERVICE_META.integration.projectType,
    accent: "#2563EB",
    seoDescription: L(
      "API development and system integration: backends, real-time data, ERP and store integrations, client portals.",
      "API geliştirme ve sistem entegrasyonu: backend, gerçek zamanlı veri, ERP ve mağaza entegrasyonları, müşteri portalları.",
    ),
  },
  {
    id: "webgl",
    title: SERVICE_META.webgl.title,
    eyebrow: L("Real-time 3D · in the browser", "Gerçek zamanlı 3D · tarayıcıda"),
    headline: L("A place people walk into, not a page they scroll.", "Kaydırılan bir sayfa değil, içine girilen bir mekân."),
    shortDescription: L(
      "Real-time 3D that runs in the browser, on a phone as well as a desktop.",
      "Tarayıcıda, masaüstünde de telefonda da çalışan gerçek zamanlı 3D.",
    ),
    description: L(
      "Archon Soft World is ours: a campus you explore with a robot, product stations, guides and offices that take a brief. The same craft builds 3D product experiences and configurators.",
      "Archon Soft World bizim: bir robotla gezilen kampüs, ürün istasyonları, rehberler ve brief alan ofisler. Aynı zanaat 3D ürün deneyimleri ve konfigüratörler kurar.",
    ),
    capabilities: [
      L("Web 3D experience", "Web 3D deneyim"),
      L("Product configurator", "Ürün konfigüratörü"),
      L("3D assets & scenes", "3D varlıklar & sahneler"),
      L("Simulation / training", "Simülasyon / eğitim"),
      L("Mobile-ready performance", "Mobil uyumlu performans"),
    ],
    technologies: [
      { label: L("Archon Soft World", "Archon Soft World"), value: "three.js · React Three Fiber · GLSL" },
    ],
    hero: [
      world(worldGate, L("The Gate — the robot explorer", "Kapı — robot kâşif")),
      world(worldMeetzy, L("Meetzy's station", "Meetzy istasyonu")),
    ],
    gallery: [
      world(worldGate, L("The Gate — the robot explorer", "Kapı — robot kâşif")),
      world(worldMeetzy, L("Meetzy's station and its guide", "Meetzy istasyonu ve rehberi")),
      world(worldDpPano, L("The DP Pano hall", "DP Pano salonu")),
      world(worldErden, L("Erden Davetiye's station", "Erden Davetiye istasyonu")),
    ],
    projects: ["archon-soft-world"],
    concepts: [],
    world: { department: "games", service: "web3d" },
    projectType: SERVICE_META.webgl.projectType,
    accent: "#62D8FF",
    seoDescription: L(
      "Interactive 3D and WebGL experiences that run in the browser, on desktop and mobile.",
      "Tarayıcıda, masaüstü ve mobilde çalışan etkileşimli 3D ve WebGL deneyimleri.",
    ),
  },
  {
    id: "design",
    title: SERVICE_META.design.title,
    eyebrow: L("Research · interface · system", "Araştırma · arayüz · sistem"),
    headline: L("Design that is decided, not decorated.", "Süslenmiş değil, karar verilmiş tasarım."),
    shortDescription: L(
      "Product flows, interfaces and design systems — drawn by the same people who build them.",
      "Ürün akışları, arayüzler ve tasarım sistemleri — onları geliştirecek ekip tarafından çiziliyor.",
    ),
    description: L(
      "Every product on this site was designed and built by the same studio, so nothing is lost between a mockup and the software. We can design yours from research to prototype, or redesign the one you have.",
      "Bu sitedeki her ürün aynı stüdyoda tasarlandı ve geliştirildi; bir mockup ile yazılım arasında hiçbir şey kaybolmuyor. Sizinkini araştırmadan prototipe kadar tasarlayabilir ya da mevcut arayüzü yeniden tasarlayabiliriz.",
    ),
    capabilities: [
      L("Product design", "Ürün tasarımı"),
      L("Web & mobile design", "Web & mobil tasarım"),
      L("Design system", "Tasarım sistemi"),
      L("Prototype", "Prototip"),
      L("UX audit", "UX denetimi"),
    ],
    hero: [
      shot(MEETZY.join!, MEETZY_CTX),
      shot(ERDEN.styles!, ERDEN_CTX),
      shot(MEETZY.real!, MEETZY_CTX),
    ],
    gallery: [
      shot(MEETZY.join!, MEETZY_CTX),
      shot(ERDEN.styles!, ERDEN_CTX),
      shot(ERDEN.home!, ERDEN_CTX),
      shot(DPPANO.canteen!, DPPANO_CTX),
      shot(MEETZY.real!, MEETZY_CTX),
    ],
    projects: ["meetzy", "erden", "dppano"],
    concepts: [],
    world: { department: "design", service: "product" },
    projectType: SERVICE_META.design.projectType,
    accent: "#F0483C",
    seoDescription: L(
      "Product and interface design: research, UX, web and mobile interfaces, design systems and prototypes.",
      "Ürün ve arayüz tasarımı: araştırma, UX, web ve mobil arayüzler, tasarım sistemleri ve prototipler.",
    ),
  },
];

export const getService = (id: string | null | undefined): Service | undefined =>
  SERVICES.find((service) => service.id === id);
