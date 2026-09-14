import type { Localized } from "@/lib/i18n";

/**
 * The product story, the layer notes and the links back to shipped work.
 *
 * Kept beside the concepts rather than inside them because these three things
 * answer different questions and change at different times: the story is what
 * a visitor reads in fifteen seconds, the stack notes are what they read when
 * they want to know whether the thing is real underneath, and the relations
 * are the only place a concept is allowed to stand next to a shipped product.
 *
 * That last one carries the strictest rule on the site. A concept never
 * borrows credit from real work. It may say it explores the same problem
 * space, or that a capability shown here was already proven there — never that
 * the shipped product contains any of this.
 */

/** Five beats. One sentence each, because the point is that it scans. */
export type Story = {
  /**
   * The customer-facing line. Second person, problem-shaped, and the first
   * thing shown wherever a concept is introduced — because "Business
   * operating system" is a category, not a reason to keep reading.
   */
  promise: Localized;
  problem: Localized;
  product: Localized;
  system: Localized;
  experience: Localized;
  capability: Localized;
};

/** The spine every product is opened along, from the screen to production. */
export const STACK_LAYERS = [
  "interface",
  "application",
  "api",
  "data",
  "automation",
  "analytics",
  "production",
] as const;

export type StackLayer = (typeof STACK_LAYERS)[number];

/** Only the layers where a concept has something specific to say. */
export type StackNotes = Partial<Record<StackLayer, Localized>>;

export type Relation = {
  slug: string;
  name: string;
  /**
   * `capability` — this concept demonstrates something the shipped product
   * already proves at a smaller scale. `problem-space` — it explores the same
   * territory from a different angle. Neither means the shipped product has
   * these features.
   */
  kind: "capability" | "problem-space";
  note: Localized;
};

/* -------------------------------------------------------------- the spine */

/**
 * The seven layers every product on this site is opened along.
 *
 * The generic line is what is true of the layer in any product Archon builds.
 * A concept overrides it in `STACK_NOTES` only where it has something specific
 * to say, which keeps the diagram from becoming seventy sentences of filler.
 */
export const STACK_SPINE: {
  id: StackLayer;
  index: string;
  title: Localized;
  generic: Localized;
}[] = [
  {
    id: "interface",
    index: "01",
    title: { en: "Interface", tr: "Arayüz" },
    generic: {
      en: "What a person touches. Hierarchy, state, keyboard, the states before and after the data arrives.",
      tr: "İnsanın dokunduğu yer. Hiyerarşi, durum, klavye ve verinin gelmesinden önceki ve sonraki hâller.",
    },
  },
  {
    id: "application",
    index: "02",
    title: { en: "Application", tr: "Uygulama" },
    generic: {
      en: "The rules of the product, expressed once, on the server, where a client cannot argue with them.",
      tr: "Ürünün kuralları; bir istemcinin itiraz edemeyeceği yerde, sunucuda, bir kez ifade edilmiş.",
    },
  },
  {
    id: "api",
    index: "03",
    title: { en: "API", tr: "API" },
    generic: {
      en: "One typed surface every client goes through, with permission resolved before anything is read.",
      tr: "Her istemcinin geçtiği tek tipli yüzey; yetki, hiçbir şey okunmadan önce çözülmüş hâlde.",
    },
  },
  {
    id: "data",
    index: "04",
    title: { en: "Data", tr: "Veri" },
    generic: {
      en: "The model everything rests on. Getting this wrong is the only mistake that stays expensive for years.",
      tr: "Her şeyin üzerine oturduğu model. Yıllarca pahalıya patlamaya devam eden tek hata bu.",
    },
  },
  {
    id: "automation",
    index: "05",
    title: { en: "Automation", tr: "Otomasyon" },
    generic: {
      en: "Triggers, conditions and approvals that someone in the business can change without a developer.",
      tr: "İşin içindeki birinin geliştiriciye ihtiyaç duymadan değiştirebildiği tetikleyiciler, koşullar ve onaylar.",
    },
  },
  {
    id: "analytics",
    index: "06",
    title: { en: "Analytics", tr: "Analitik" },
    generic: {
      en: "Events modelled at the start, so the question asked in six months is a query rather than an export.",
      tr: "En baştan modellenmiş olaylar; altı ay sonraki soru bir dışa aktarma değil, bir sorgu olsun diye.",
    },
  },
  {
    id: "production",
    index: "07",
    title: { en: "Production", tr: "Yayın" },
    generic: {
      en: "Environments, releases, backups, monitoring — and every account in the client's name from the first day.",
      tr: "Ortamlar, sürümler, yedekler, izleme — ve ilk günden itibaren müşterinin adına açılmış her hesap.",
    },
  },
];

/* ------------------------------------------------------------------ stories */

export const STORIES: Record<string, Story> = {
  divan: {
    promise: {
      en: "Your business should not need five tools to know what is happening.",
      tr: "İşinizde ne olduğunu bilmek için beş ayrı araca ihtiyacınız olmamalı.",
    },
    problem: {
      en: "A growing company runs its day on spreadsheets, a chat thread and four tools that disagree with each other by Friday.",
      tr: "Büyüyen bir şirket gününü tablolarla, bir sohbet dizisiyle ve cuma günü birbiriyle çelişen dört ayrı araçla yürütüyor.",
    },
    product: {
      en: "One operating system for the business behind the business: customers, pipeline, work, invoicing and permissions in a single model.",
      tr: "İşin arkasındaki iş için tek bir işletim sistemi: müşteri, satış hattı, iş, faturalama ve yetkiler tek bir modelde.",
    },
    system: {
      en: "Relational records, row-level permissions, an auditable activity log and reporting derived from the operational tables.",
      tr: "İlişkisel kayıtlar, satır düzeyinde yetkiler, denetlenebilir hareket kaydı ve operasyon tablolarından türetilen raporlama.",
    },
    experience: {
      en: "Move a deal, and the invoice schedule, the activity log and the forecast move with it.",
      tr: "Bir fırsatı ilerlet; fatura planı, hareket kaydı ve tahmin onunla birlikte ilerlesin.",
    },
    capability: { en: "Custom business software", tr: "Özel iş yazılımı" },
  },
  ulak: {
    promise: {
      en: "Turn the operational work that repeats into a workflow that runs itself.",
      tr: "Tekrar eden operasyon işini, kendi kendine yürüyen bir akışa çevirin.",
    },
    problem: {
      en: "Most of the work inside a company arrives unstructured — a mail with an attachment, a request in a chat — and is handled by whoever notices.",
      tr: "Bir şirketteki işin çoğu yapısız gelir — ekli bir e-posta, sohbette bir talep — ve kim fark ederse o halleder.",
    },
    product: {
      en: "An operations platform that classifies what arrives, reads the documents into typed fields and completes the routine cases on its own.",
      tr: "Geleni sınıflandıran, belgeleri tipli alanlara okuyan ve rutin işleri kendi başına tamamlayan bir operasyon platformu.",
    },
    system: {
      en: "Intake queue, extraction with per-field confidence, threshold rules, approval steps and an audit record on every run.",
      tr: "Giriş kuyruğu, alan bazında güven skoruyla okuma, eşik kuralları, onay adımları ve her çalışmada denetim kaydı.",
    },
    experience: {
      en: "Ask a question about an order and get an answer with the documents it came from attached.",
      tr: "Bir sipariş hakkında soru sor; cevabı, geldiği belgeler iliştirilmiş hâlde al.",
    },
    capability: { en: "AI inside a process", tr: "Sürecin içinde yapay zekâ" },
  },
  kervan: {
    promise: {
      en: "Build the marketplace behind the marketplace.",
      tr: "Pazar yerinin arkasındaki pazar yerini kurun.",
    },
    problem: {
      en: "A marketplace looks like a shop and is not one: two products are running at once and the ledger underneath has to stay correct.",
      tr: "Pazar yeri dükkâna benzer ama değildir: aynı anda iki ürün çalışır ve altındaki defterin doğru kalması gerekir.",
    },
    product: {
      en: "A two-sided platform where a buyer sees one order, sellers see their own lines, and the operator sees the money.",
      tr: "İki taraflı bir platform: alıcı tek sipariş görür, satıcılar kendi kalemlerini görür, işletmeci parayı görür.",
    },
    system: {
      en: "One catalogue with per-seller ownership, orders that split across sellers, commission and payouts derived from order events.",
      tr: "Satıcı sahipliği olan tek katalog, satıcılara bölünen siparişler, sipariş olaylarından türetilen komisyon ve hakediş.",
    },
    experience: {
      en: "Browse as a customer, then switch sides and watch the same order from the seller desk.",
      tr: "Müşteri olarak gez, sonra tarafı değiştir ve aynı siparişi satıcı masasından izle.",
    },
    capability: { en: "Platform architecture", tr: "Platform mimarisi" },
  },
  vesile: {
    promise: {
      en: "Everything an event needs to run, from the listing to the door.",
      tr: "Bir etkinliğin yürümesi için gereken her şey — ilandan kapıya kadar.",
    },
    problem: {
      en: "Selling a ticket is easy. Scanning it at a door with no signal, and telling the organiser what actually happened, is not.",
      tr: "Bilet satmak kolay. Çekmeyen bir kapıda okutmak ve organizatöre gerçekte ne olduğunu anlatmak değil.",
    },
    product: {
      en: "An event platform with an attendee app in front of it and an operator console behind it.",
      tr: "Önünde katılımcı uygulaması, arkasında operatör konsolu olan bir etkinlik platformu.",
    },
    system: {
      en: "Signed tickets that verify offline, one counter for holds and waitlists, and reporting built from the door's own events.",
      tr: "Çevrimdışı doğrulanan imzalı biletler, rezervasyon ve bekleme listesi için tek sayaç, kapının kendi olaylarından kurulan raporlama.",
    },
    experience: {
      en: "Find something on tonight, then step behind the door and watch the same event being run.",
      tr: "Bu akşam bir şey bul, sonra kapının arkasına geç ve aynı etkinliğin yönetilişini izle.",
    },
    capability: { en: "Mobile product and operations", tr: "Mobil ürün ve operasyon" },
  },
  tezgah: {
    promise: {
      en: "Commerce is more than a storefront.",
      tr: "Ticaret, bir vitrinden ibaret değildir.",
    },
    problem: {
      en: "The storefront is the easy half. Stock that cannot oversell, coupons that cannot sell below cost and returns that reconcile are the product.",
      tr: "Vitrin kolay yarısı. Fazla satamayan stok, maliyetin altına satamayan kupon ve mutabık kalan iade — asıl ürün bunlar.",
    },
    product: {
      en: "A commerce system with variants, reserved stock, campaign pricing and an admin a shop can be run from.",
      tr: "Varyant, rezerve stok, kampanya fiyatlaması ve bir dükkânın üzerinden yürütülebileceği bir yönetim paneli olan ticaret sistemi.",
    },
    system: {
      en: "Stock held at basket and released on timeout, payment states that survive a failure, margin computed next to every discount.",
      tr: "Sepette tutulup süre dolunca bırakılan stok, hataya dayanan ödeme durumları, her indirimin yanında hesaplanan marj.",
    },
    experience: {
      en: "Add something to a basket, then open the admin and watch the same item held against its variant.",
      tr: "Sepete bir şey ekle, sonra yönetimi aç ve aynı ürünün varyantı üzerinde tutulduğunu gör.",
    },
    capability: { en: "Commerce engineering", tr: "Ticaret mühendisliği" },
  },
  vardiya: {
    promise: {
      en: "Answer customers in seconds, and never by guessing.",
      tr: "Müşterilere saniyeler içinde cevap verin; asla tahminle değil.",
    },
    problem: {
      en: "A support assistant that guesses is worse than none, because a confident wrong answer costs more than a slow right one.",
      tr: "Tahmin eden bir destek asistanı hiç olmamasından kötüdür; kendinden emin yanlış cevap, yavaş ama doğru olandan pahalıdır.",
    },
    product: {
      en: "A support desk that answers from the order record and the policy text, cites both, and hands over the moment it cannot.",
      tr: "Cevabını sipariş kaydından ve politika metninden veren, ikisini de kaynak gösteren ve veremediği anda devreden bir destek masası.",
    },
    system: {
      en: "Retrieval scoped to what the customer may see, a rule that no answer ships without a citation, and a shared conversation state.",
      tr: "Müşterinin görebileceğiyle sınırlı getirme, kaynağı olmayan cevabın gönderilmemesi kuralı ve ortak görüşme durumu.",
    },
    experience: {
      en: "Read a conversation the assistant closed, then one it refused to close, and see why.",
      tr: "Asistanın kapattığı bir görüşmeyi oku, sonra kapatmayı reddettiği birini — ve sebebini gör.",
    },
    capability: { en: "Grounded AI and escalation", tr: "Dayanaklı yapay zekâ ve devir" },
  },
  olcek: {
    promise: {
      en: "Find out which part of your product is actually working.",
      tr: "Ürününüzün hangi kısmının gerçekten işe yaradığını öğrenin.",
    },
    problem: {
      en: "Most analytics screens report totals going up and to the right, which feels good and changes nothing.",
      tr: "Analitik ekranlarının çoğu sağa yukarı giden toplamları raporlar; iyi hissettirir, hiçbir şeyi değiştirmez.",
    },
    product: {
      en: "A product analytics platform where funnels, cohorts and retention are queries over raw events rather than tables somebody maintains.",
      tr: "Huni, kohort ve elde tutmanın, birinin baktığı tablolar değil ham olaylar üzerinde sorgular olduğu bir ürün analitiği platformu.",
    },
    system: {
      en: "Typed event ingestion with nothing aggregated on the way in, so a question asked in six months is still answerable.",
      tr: "Girişte hiçbir şeyin toplanmadığı tipli olay toplama; böylece altı ay sonra sorulan soru hâlâ cevaplanabilir.",
    },
    experience: {
      en: "Change the range, then open the funnel and find the step that is costing the most.",
      tr: "Aralığı değiştir, sonra huniyi aç ve en pahalıya mal olan adımı bul.",
    },
    capability: { en: "Data modelling and reporting", tr: "Veri modelleme ve raporlama" },
  },
  atolye: {
    promise: {
      en: "If your business runs on spreadsheets and messages, it can run on software.",
      tr: "İşiniz tablolar ve mesajlarla yürüyorsa, yazılımla da yürüyebilir.",
    },
    problem: {
      en: "A working business is held together by one spreadsheet, a group chat and somebody who remembers everything — until they go on leave.",
      tr: "Çalışan bir işletmeyi bir tablo, bir grup sohbeti ve her şeyi hatırlayan bir kişi ayakta tutar — o izne çıkana kadar.",
    },
    product: {
      en: "An internal operations platform: jobs with a state, crews with a schedule, stock that decrements, approvals with a name on them.",
      tr: "Bir iç operasyon platformu: durumu olan işler, programı olan ekipler, düşen stok, üzerinde bir isim olan onaylar.",
    },
    system: {
      en: "A field client that writes locally and reconciles later, because the site is exactly where the signal is not.",
      tr: "Yerelde yazıp sonradan mutabık kalan bir saha istemcisi; çünkü çekmeyen yer tam da sahanın kendisidir.",
    },
    experience: {
      en: "Watch a job go to Blocked on its own because a crew logged the material it used.",
      tr: "Bir ekip kullandığı malzemeyi girdiği için bir işin kendiliğinden Bloke durumuna geçişini izle.",
    },
    capability: { en: "Operations software", tr: "Operasyon yazılımı" },
  },
  kutuk: {
    promise: {
      en: "Every answer your company already has, findable the moment it is needed.",
      tr: "Şirketinizin zaten sahip olduğu her cevap, tam ihtiyaç duyulduğu anda bulunabilir.",
    },
    problem: {
      en: "Company knowledge is not missing. It is in a contract folder, a handbook nobody opened and four people's heads.",
      tr: "Şirket bilgisi eksik değil. Bir sözleşme klasöründe, kimsenin açmadığı bir el kitabında ve dört kişinin kafasında.",
    },
    product: {
      en: "A knowledge platform that indexes what a company already has and answers from it, with the passage attached every time.",
      tr: "Şirketin zaten sahip olduğunu indeksleyen ve her seferinde pasajı iliştirerek oradan cevap veren bir bilgi platformu.",
    },
    system: {
      en: "Document processing across mixed formats, and access enforced at retrieval so a question never reaches a document it should not.",
      tr: "Karışık formatlarda belge işleme ve getirme anında uygulanan erişim; böylece bir soru ulaşmaması gereken belgeye hiç ulaşmaz.",
    },
    experience: {
      en: "Ask a question about a contract and read the clause the answer came from.",
      tr: "Bir sözleşme hakkında soru sor ve cevabın geldiği maddeyi oku.",
    },
    capability: { en: "Search and retrieval", tr: "Arama ve getirme" },
  },
  esik: {
    promise: {
      en: "Stop telling customers where things stand. Show them.",
      tr: "Müşterilere işin nerede olduğunu anlatmayı bırakın. Gösterin.",
    },
    problem: {
      en: "Every business with ongoing customers runs a second, invisible job: telling people what is happening, by mail and by phone.",
      tr: "Devam eden müşterisi olan her işletme ikinci ve görünmez bir iş yürütür: insanlara ne olduğunu e-postayla, telefonla anlatmak.",
    },
    product: {
      en: "A client portal that is the customer's own window onto the records the business already keeps.",
      tr: "İşletmenin zaten tuttuğu kayıtlara açılan, müşterinin kendi penceresi olan bir portal.",
    },
    system: {
      en: "A separate identity space for external accounts and a projection that decides what a customer may see — nothing duplicated.",
      tr: "Dış hesaplar için ayrı bir kimlik alanı ve müşterinin ne görebileceğine karar veren bir yansıma — hiçbir şey kopyalanmadan.",
    },
    experience: {
      en: "Approve a scope change from the portal and watch it become the schedule the team works from.",
      tr: "Portaldan bir kapsam değişikliğini onayla ve onun ekibin çalıştığı programa dönüşünü izle.",
    },
    capability: { en: "External access and identity", tr: "Dış erişim ve kimlik" },
  },
};

/* ------------------------------------------------------------- stack notes */

/**
 * Per-layer specifics. A layer without a note falls back to the generic
 * description in the dictionary, which is the honest default: the layer is
 * there in every product, and only some of them have something particular to
 * say about it.
 */
export const STACK_NOTES: Record<string, StackNotes> = {
  divan: {
    application: {
      en: "A deal stage is a state machine, not a dropdown. Illegal moves are refused on the server.",
      tr: "Fırsat aşaması bir açılır liste değil, bir durum makinesi. Geçersiz geçişler sunucuda reddediliyor.",
    },
    data: {
      en: "Accounts, deals, tasks, invoices and users, with every change written to one activity table.",
      tr: "Hesaplar, fırsatlar, görevler, faturalar ve kullanıcılar; her değişiklik tek bir aktivite tablosuna yazılıyor.",
    },
    analytics: {
      en: "Every figure is derived from the operational tables, so a report cannot disagree with the records.",
      tr: "Her rakam operasyon tablolarından türetiliyor; böylece rapor kayıtlarla çelişemiyor.",
    },
  },
  ulak: {
    application: {
      en: "The model call sits inside the workflow. Its confidence decides whether the workflow continues or stops.",
      tr: "Model çağrısı akışın içinde. Güven skoru, akışın devam mı edeceğine yoksa duracak mı olduğuna karar veriyor.",
    },
    automation: {
      en: "Triggers, thresholds and approval steps that an operations lead can change without a developer.",
      tr: "Operasyon sorumlusunun geliştiriciye ihtiyaç duymadan değiştirebildiği tetikleyiciler, eşikler ve onay adımları.",
    },
    production: {
      en: "Model, prompt version, inputs and outcome are recorded against every run, which is what makes it auditable at all.",
      tr: "Her çalışmada model, istem sürümü, girdiler ve sonuç kaydediliyor; denetlenebilir olmasının tek sebebi bu.",
    },
  },
  kervan: {
    api: {
      en: "Sellers get their own scoped surface, not the operator API with fewer menus.",
      tr: "Satıcılar menüsü kısılmış bir işletmeci API'si değil, kendi kapsamlı yüzeylerini alıyor.",
    },
    data: {
      en: "An order can split across sellers while staying one record, because the buyer must never see the seam.",
      tr: "Bir sipariş tek kayıt kalarak satıcılara bölünebiliyor; çünkü alıcı dikişi asla görmemeli.",
    },
    automation: {
      en: "Commission, refunds and payouts are computed from order events rather than typed anywhere.",
      tr: "Komisyon, iade ve hakediş hiçbir yere elle girilmiyor; sipariş olaylarından hesaplanıyor.",
    },
  },
  vesile: {
    interface: {
      en: "Two clients over one model: an attendee app and a door scanner that has to work in a basement.",
      tr: "Tek model üzerinde iki istemci: bir katılımcı uygulaması ve bodrumda da çalışması gereken bir kapı okuyucusu.",
    },
    api: {
      en: "A ticket is a signed token, so the door can verify it with no network and reconcile when one returns.",
      tr: "Bilet imzalı bir jeton; kapı onu ağ olmadan doğruluyor, bağlantı gelince mutabık kalıyor.",
    },
    data: {
      en: "Holds, releases and waitlists are one counter. That is the only way overselling stays impossible under load.",
      tr: "Rezervasyon, iptal ve bekleme listesi tek sayaç. Yoğunlukta fazla satışın imkânsız kalmasının tek yolu bu.",
    },
  },
  tezgah: {
    application: {
      en: "Stock is reserved at basket, released on timeout and only committed when payment settles.",
      tr: "Stok sepette rezerve ediliyor, süre dolunca bırakılıyor ve ancak ödeme kesinleşince düşülüyor.",
    },
    data: {
      en: "Stock lives on the variant, never on the product, which is where most storefronts start overselling.",
      tr: "Stok ürünün değil varyantın üzerinde; vitrinlerin çoğunun fazla satmaya başladığı yer tam da burası.",
    },
    analytics: {
      en: "Margin is shown next to every discount, because a coupon selling below cost is the failure nobody notices.",
      tr: "Marj her indirimin yanında gösteriliyor; maliyetin altına satan bir kupon, kimsenin fark etmediği hatadır.",
    },
  },
  vardiya: {
    application: {
      en: "The order record is read before the policy text, because a fact about this customer beats a rule about customers in general.",
      tr: "Politika metninden önce sipariş kaydı okunuyor; çünkü bu müşteriye dair bir olgu, genel bir kurala göre önceliklidir.",
    },
    automation: {
      en: "Rules a support lead edits in the interface: answer, draft, or hand straight to a person.",
      tr: "Destek sorumlusunun arayüzde düzenlediği kurallar: cevapla, taslak yaz ya da doğrudan bir insana ver.",
    },
    analytics: {
      en: "Reopened conversations are tracked as the real quality signal, not resolution speed.",
      tr: "Gerçek kalite sinyali olarak çözüm hızı değil, yeniden açılan görüşmeler izleniyor.",
    },
  },
  olcek: {
    api: {
      en: "Events arrive with a name, a subject and typed properties, and nothing is aggregated on the way in.",
      tr: "Olaylar bir ad, bir özne ve tipli özelliklerle geliyor; girişte hiçbir şey toplanmıyor.",
    },
    data: {
      en: "Funnels and cohorts are queries over those events, not a second set of tables that drifts.",
      tr: "Huni ve kohortlar, zamanla sapan ikinci bir tablo kümesi değil; o olaylar üzerinde sorgular.",
    },
    analytics: {
      en: "Every chart resolves back to the rows that produced it, one click away.",
      tr: "Her grafik, onu üreten satırlara bir tık uzaklıkta geri çözülüyor.",
    },
  },
  atolye: {
    interface: {
      en: "A field client that writes locally and syncs when it can, because the site is where the signal is not.",
      tr: "Yerelde yazan ve şebeke geldiğinde eşitleyen bir saha istemcisi; çünkü çekmeyen yer sahanın kendisi.",
    },
    application: {
      en: "A job moves itself to Blocked when logged consumption drops stock under what the remaining work needs.",
      tr: "Girilen tüketim stoğu kalan işin gerektirdiğinin altına düşürünce, iş kendini Bloke durumuna alıyor.",
    },
    production: {
      en: "Approvals stay on the record rather than in a chat thread, where nobody can find them six months later.",
      tr: "Onaylar, altı ay sonra kimsenin bulamayacağı bir sohbet dizisinde değil, kaydın üzerinde kalıyor.",
    },
  },
  kutuk: {
    api: {
      en: "Access is enforced at retrieval, not at display, so a question never reaches a document it should not.",
      tr: "Erişim gösterimde değil getirmede uygulanıyor; böylece bir soru ulaşmaması gereken belgeye hiç ulaşmıyor.",
    },
    data: {
      en: "Mixed formats parsed, chunked and embedded, with the original always retrievable.",
      tr: "Karışık formatlar ayrıştırılıp parçalanıyor ve gömülüyor; aslına her zaman ulaşılabiliyor.",
    },
    application: {
      en: "The default for an unclassified document is to stay out of the index, not to fall into it.",
      tr: "Sınıflandırılmamış bir belgenin varsayılanı indekse düşmek değil, dışında kalmak.",
    },
  },
  esik: {
    interface: {
      en: "The customer sees a filtered view of the same job record the team works from, so it cannot go stale.",
      tr: "Müşteri, ekibin çalıştığı iş kaydının süzülmüş hâlini görüyor; bu yüzden güncelliğini yitiremiyor.",
    },
    api: {
      en: "A customer token can only ever address its own account, so a mistake in the interface cannot become a data leak.",
      tr: "Müşteri jetonu yalnızca kendi hesabını adresleyebiliyor; böylece arayüzdeki bir hata veri sızıntısına dönüşemiyor.",
    },
    data: {
      en: "Nothing is duplicated for the portal. It is a projection, and a projection cannot disagree with its source.",
      tr: "Portal için hiçbir şey kopyalanmıyor. O bir yansıma ve bir yansıma kaynağıyla çelişemez.",
    },
  },
};

/* ---------------------------------------------------------------- relations */

/**
 * The links between concepts and shipped work.
 *
 * Every note is written so that it cannot be misread as a claim about the
 * shipped product. Meetzy does not sell tickets. Erden does not run a
 * marketplace. What the real work proves is that the studio ships; what the
 * concept shows is where the same thinking goes next.
 */
export const RELATIONS: Record<string, Relation[]> = {
  divan: [
    {
      slug: "erden",
      name: "Erden Davetiye",
      kind: "capability",
      note: {
        en: "The admin behind Erden is this argument at a smaller scale, shipped and running an atelier in Ankara.",
        tr: "Erden'in arkasındaki yönetim paneli, bu argümanın daha küçük ölçekli hâli — yayında ve Ankara'da bir atölyeyi çalıştırıyor.",
      },
    },
  ],
  ulak: [
    {
      slug: "erden",
      name: "Erden Davetiye",
      kind: "problem-space",
      note: {
        en: "Explores a similar problem space: work arriving as messages and documents that somebody has to turn into records.",
        tr: "Benzer bir problem alanını araştırıyor: birinin kayda dönüştürmesi gereken mesajlar ve belgeler olarak gelen iş.",
      },
    },
  ],
  kervan: [
    {
      slug: "erden",
      name: "Erden Davetiye",
      kind: "capability",
      note: {
        en: "Catalogue, orders and an operator admin are already shipped there. This concept asks what changes when a second side is added.",
        tr: "Katalog, sipariş ve işletmeci paneli orada zaten yayında. Bu konsept, ikinci bir taraf eklendiğinde neyin değiştiğini soruyor.",
      },
    },
  ],
  vesile: [
    {
      slug: "meetzy",
      name: "Meetzy",
      kind: "problem-space",
      note: {
        en: "Explores the same problem space from the other end. Meetzy solves the company you go with; it does not sell tickets.",
        tr: "Aynı problem alanını diğer uçtan araştırıyor. Meetzy birlikte gideceğin kişiyi çözüyor; bilet satmıyor.",
      },
    },
  ],
  tezgah: [
    {
      slug: "erden",
      name: "Erden Davetiye",
      kind: "capability",
      note: {
        en: "The shipped, live version of this argument — a storefront and the admin an atelier actually runs on.",
        tr: "Bu argümanın yayınlanmış ve canlı hâli — bir vitrin ve atölyenin işini gerçekten yürüttüğü yönetim paneli.",
      },
    },
  ],
  vardiya: [
    {
      slug: "erden",
      name: "Erden Davetiye",
      kind: "problem-space",
      note: {
        en: "Explores a similar problem space. Erden deliberately puts a person on WhatsApp instead; this concept asks what a machine may answer first.",
        tr: "Benzer bir problem alanını araştırıyor. Erden bilerek WhatsApp'a bir insan koyuyor; bu konsept ise bir makinenin önce neyi cevaplayabileceğini soruyor.",
      },
    },
  ],
  olcek: [
    {
      slug: "meetzy",
      name: "Meetzy",
      kind: "problem-space",
      note: {
        en: "Explores a similar problem space: an early product with real users and the question of which part of it is working.",
        tr: "Benzer bir problem alanını araştırıyor: gerçek kullanıcıları olan erken bir ürün ve hangi kısmının işe yaradığı sorusu.",
      },
    },
  ],
  atolye: [
    {
      slug: "erden",
      name: "Erden Davetiye",
      kind: "capability",
      note: {
        en: "Records, states and an admin a non-technical team operates daily — already proven there, at a smaller scale.",
        tr: "Kayıtlar, durumlar ve teknik olmayan bir ekibin her gün kullandığı bir panel — orada, daha küçük ölçekte zaten kanıtlanmış.",
      },
    },
  ],
  kutuk: [
    {
      slug: "erden",
      name: "Erden Davetiye",
      kind: "problem-space",
      note: {
        en: "Explores a similar problem space: a business whose answers live in documents and in one person who knows them.",
        tr: "Benzer bir problem alanını araştırıyor: cevapları belgelerde ve onları bilen tek bir kişide duran bir işletme.",
      },
    },
  ],
  esik: [
    {
      slug: "erden",
      name: "Erden Davetiye",
      kind: "capability",
      note: {
        en: "Customer records, orders and reviews are already shipped there. This concept asks what happens when the customer gets a key.",
        tr: "Müşteri kayıtları, siparişler ve yorumlar orada zaten yayında. Bu konsept, müşteriye bir anahtar verildiğinde ne olduğunu soruyor.",
      },
    },
  ],
};
