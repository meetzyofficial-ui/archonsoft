import type { ServiceId } from "@/data/serviceIds";

/**
 * One page per service: what a person searching for it needs to know before
 * they write. Nothing here states a duration, a result or a client that the
 * rest of the site cannot show. The only price printed is the one the studio
 * has set; everything else is quoted in writing after the scope is known.
 */
export type ServicePageCopy = {
  /** Short name, for lists and the menu. */
  name: string;
  /** Search title and description. */
  title: string;
  description: string;
  h1: string;
  intro: string;
  forWhom: string[];
  includes: string[];
  priceLine: string;
  faq: { q: string; a: string }[];
};

export type ServicePage = {
  slug: string;
  /** The explorer's service, for the form preset. */
  service: ServiceId;
  /** Shipped work that shows it. */
  projects: string[];
  tr: ServicePageCopy;
  en: ServicePageCopy;
};

const QUOTE_TR = "Kapsamı konuşuyoruz, fiyatı yazılı veriyoruz. Siz onaylamadan iş başlamaz.";
const QUOTE_EN = "We talk the scope through and give you a price in writing. Nothing starts before you approve it.";

export const SERVICE_PAGES: ServicePage[] = [
  {
    slug: "web-sitesi",
    service: "web",
    projects: ["oyundal", "meetzy", "erden"],
    tr: {
      name: "Web sitesi",
      title: "Web Sitesi Yaptırmak: 10.000 TL'den başlayan fiyatlar",
      description: "Kurumsal web sitesi tasarımı ve yazılımı, 10.000 TL'den başlayan fiyatlarla. Mobil uyumlu, hızlı, yönetilebilir. Ankara'dan tüm Türkiye'ye.",
      h1: "Web sitesi yaptırmak",
      intro: "Şablon değil, işinize göre tasarlanan bir site. Telefonda hızlı açılır, Google'da doğru görünür, içeriğini kendiniz değiştirirsiniz.",
      forWhom: ["İlk sitesini yaptıracak işletmeler", "Eski sitesi telefonda kötü görünen firmalar", "Randevu, form ya da katalog isteyen hizmet işletmeleri", "Birden fazla dilde yayın yapacak markalar"],
      includes: ["Size özel tasarım", "Telefon, tablet ve masaüstü uyumu", "İçerik yönetim paneli", "İletişim formu ve WhatsApp bağlantısı", "Temel Google (SEO) ayarları", "Alan adı, SSL ve yayına alma", "Yayından sonra destek"],
      priceLine: "10.000 TL'den başlayan fiyatlarla. Özelliklerine ve entegrasyonlarına göre fiyat değişebilir.",
      faq: [
        { q: "10.000 TL'ye ne dahil?", a: "Tanıtım amaçlı, mobil uyumlu bir kurumsal site. Üyelik, ödeme, rezervasyon ya da başka bir sisteme bağlantı gibi özellikler eklendikçe fiyat değişir. Net fiyatı isteklerinizi dinledikten sonra yazılı veriyoruz." },
        { q: "Alan adı ve hosting kimin adına olur?", a: "Sizin adınıza. Bütün hesaplar size aittir." },
        { q: "İçeriği kendim değiştirebilir miyim?", a: "Evet. Yazı ve görselleri panelden kendiniz güncellersiniz." },
        { q: "Elimdeki siteyi yenileyebilir misiniz?", a: "Evet. Mevcut adreslerinizi koruyarak yeniliyoruz ki Google'daki yeriniz kaybolmasın." },
      ],
    },
    en: {
      name: "Website",
      title: "Website design and development, from 10,000 TL",
      description: "Business websites from 10,000 TL: designed for you, fast on phones and easy to update. Built in Ankara, Türkiye.",
      h1: "Website design and development",
      intro: "Not a template: a site designed around your business. Fast on phones, readable by Google, and yours to edit.",
      forWhom: ["Businesses getting their first site", "Companies whose site looks poor on a phone", "Services that need bookings, forms or a catalogue", "Brands publishing in more than one language"],
      includes: ["Custom design", "Phone, tablet and desktop", "Content panel", "Contact form and WhatsApp link", "Basic SEO setup", "Domain, SSL and launch", "Support after launch"],
      priceLine: "From 10,000 TL. The price changes with features and integrations.",
      faq: [
        { q: "What does 10,000 TL cover?", a: "A responsive business site. Accounts, payments, bookings or connections to other systems change the price. You get the exact figure in writing." },
        { q: "Who owns the domain and hosting?", a: "You do. Every account is in your name." },
        { q: "Can I edit the content myself?", a: "Yes, text and images, from a panel." },
      ],
    },
  },
  {
    slug: "mobil-uygulama",
    service: "mobile",
    projects: ["meetzy", "aracimgo"],
    tr: {
      name: "Mobil uygulama",
      title: "Mobil Uygulama Yaptırmak: iOS ve Android",
      description: "iOS ve Android mobil uygulama geliştirme: tasarım, yazılım, sunucu ve mağazaya yükleme. Meetzy ve AracımGo'yu yapan ekip.",
      h1: "Mobil uygulama yaptırmak",
      intro: "Uygulamanın ekranlarını, arkasındaki sunucuyu ve yönetim panelini birlikte yapıyoruz. App Store ve Google Play'e yükleme dahil. Meetzy ve AracımGo'yu böyle yaptık.",
      forWhom: ["Fikri olan girişimciler", "Müşterisine uygulama vermek isteyen işletmeler", "Saha ekibini telefondan yönetecek firmalar", "Mevcut web sistemini telefona taşıyacaklar"],
      includes: ["Ekran tasarımı", "iOS ve Android uygulaması", "Sunucu ve veritabanı", "Üyelik ve giriş", "Bildirimler", "Harita ve konum", "Yönetim paneli", "Mağazalara yükleme"],
      priceLine: QUOTE_TR,
      faq: [
        { q: "Sadece fikrim var, yeterli mi?", a: "Evet. Fikri birlikte ekranlara ve ilk sürümün kapsamına çeviriyoruz, sonra yazılı fiyat veriyoruz." },
        { q: "Uygulama mağazada kimin adına yayınlanır?", a: "Sizin geliştirici hesabınızda, sizin adınıza. Hesap açılışında yardımcı oluyoruz." },
        { q: "Yayından sonra ne olur?", a: "Hata düzeltme, yeni özellik ve mağaza güncellemeleri için bakım anlaşması yapabiliyoruz." },
        { q: "Hangi teknolojiyi kullanıyorsunuz?", a: "Projeye göre seçiyoruz. AracımGo'nun mobil uygulaması Flutter ile yazıldı." },
      ],
    },
    en: {
      name: "Mobile app",
      title: "Mobile app development: iOS and Android",
      description: "iOS and Android app development: design, code, server and store release, by the team behind Meetzy and AracımGo.",
      h1: "Mobile app development",
      intro: "We build the screens, the server behind them and the admin panel together, through to the App Store and Google Play. That is how we made Meetzy and AracımGo.",
      forWhom: ["Founders with an idea", "Businesses that want an app for customers", "Companies running field teams from a phone", "Web systems moving to mobile"],
      includes: ["Screen design", "iOS and Android app", "Server and database", "Accounts and sign-in", "Notifications", "Maps and location", "Admin panel", "Store release"],
      priceLine: QUOTE_EN,
      faq: [
        { q: "I only have an idea. Is that enough?", a: "Yes. We turn it into screens and a first scope together, then quote in writing." },
        { q: "Whose name is it published under?", a: "Yours, in your own developer account." },
      ],
    },
  },
  {
    slug: "web-platformu",
    service: "web",
    projects: ["dppano", "oyundal", "aracimgo"],
    tr: {
      name: "Web platformu ve SaaS",
      title: "Web Platformu ve SaaS Geliştirme",
      description: "Üyelik, rol, abonelik ve yönetim paneliyle web platformu ve SaaS yazılımı. DP Pano ve Oyundal'ı yapan ekip.",
      h1: "Web platformu ve SaaS",
      intro: "Kullanıcıların giriş yaptığı, ekiplerin yönettiği, aboneliğin işlediği ürünler. DP Pano okulların ekranlarını, Oyundal kafelerin masalarını böyle bir platformdan yönetiyor.",
      forWhom: ["Yazılım ürünü çıkaracak girişimler", "Bayi ya da şube yöneten firmalar", "Hizmetini abonelikle satacaklar"],
      includes: ["Üyelik, rol ve yetki", "Şube ya da müşteri bazlı ayrım", "Yönetim paneli", "Canlı güncellenen ekranlar", "Abonelik ve ödeme bağlantısı", "Raporlar"],
      priceLine: QUOTE_TR,
      faq: [
        { q: "Küçük başlayıp büyütebilir miyiz?", a: "Evet. Önce işe yarayan en küçük sürümü yayına alıp, kullanıma göre büyütüyoruz." },
        { q: "Kaynak kodu bize ait mi?", a: "Sözleşmede yazılı olarak belirliyoruz. Size özel yazılan projelerde hesaplar ve kod sizindir." },
      ],
    },
    en: {
      name: "Web platform and SaaS",
      title: "Web platform and SaaS development",
      description: "Web platforms and SaaS with accounts, roles, subscriptions and admin panels, by the team behind DP Pano and Oyundal.",
      h1: "Web platforms and SaaS",
      intro: "Products people sign in to, teams run, and subscriptions pay for. DP Pano runs school screens and Oyundal runs café tables from one.",
      forWhom: ["Start-ups shipping software", "Companies with branches or dealers", "Services sold by subscription"],
      includes: ["Accounts, roles, permissions", "Separation by branch or customer", "Admin panel", "Live screens", "Subscriptions and payments", "Reports"],
      priceLine: QUOTE_EN,
      faq: [{ q: "Can we start small?", a: "Yes. We ship the smallest useful version first and grow it from use." }],
    },
  },
  {
    slug: "ozel-yazilim",
    service: "custom",
    projects: ["aracimgo", "dppano"],
    tr: {
      name: "Özel yazılım",
      title: "Özel Yazılım Geliştirme: CRM, ERP ve işletme programı",
      description: "İşletmenize özel yazılım: CRM, ERP, iş takip ve stok programı. Excel ve defterden tek sisteme geçiş. Ankara.",
      h1: "İşletmenize özel yazılım",
      intro: "Excel, defter ve WhatsApp arasında dağılan işi tek sisteme topluyoruz. Paket programa işinizi uydurmak yerine, program işinize uyuyor. AracımGo'nun servis tarafı tam olarak bu.",
      forWhom: ["Takibi Excel'de yapan işletmeler", "Paket programı yetmeyen firmalar", "Birden fazla şubesi ya da ekibi olanlar"],
      includes: ["Müşteri ve iş takibi", "Stok ve cari", "Teklif ve onay akışı", "Rol ve yetkiler", "Raporlar", "Eski verilerin aktarımı"],
      priceLine: QUOTE_TR,
      faq: [
        { q: "Excel'deki verilerimiz taşınır mı?", a: "Evet. Dosyalarınızı inceleyip aktarımı teklife yazıyoruz." },
        { q: "Ekibimiz alışabilir mi?", a: "Kullanacak kişilerle birlikte tasarlıyor, yayında ekibi ekran ekran gezdiriyoruz." },
      ],
    },
    en: {
      name: "Custom software",
      title: "Custom software: CRM, ERP and business tools",
      description: "Custom business software: CRM, ERP, job tracking and stock. From spreadsheets to one system.",
      h1: "Custom software for your business",
      intro: "We bring work scattered across spreadsheets, notebooks and chat into one system that fits how you work. AracımGo's workshop side is exactly that.",
      forWhom: ["Businesses run on spreadsheets", "Companies that outgrew a package", "Teams in several branches"],
      includes: ["Customer and job tracking", "Stock and accounts", "Quotes and approvals", "Roles and permissions", "Reports", "Data migration"],
      priceLine: QUOTE_EN,
      faq: [{ q: "Can our spreadsheets be moved over?", a: "Yes. We look at the files and include the migration in the quote." }],
    },
  },
  {
    slug: "e-ticaret",
    service: "commerce",
    projects: ["erden"],
    tr: {
      name: "E-ticaret sitesi",
      title: "E-Ticaret Sitesi Yaptırmak",
      description: "Ürün, sipariş, kupon ve müşteri yönetimiyle e-ticaret sitesi. Ödeme ve kargo bağlantısı, kolay yönetim paneli.",
      h1: "E-ticaret sitesi yaptırmak",
      intro: "Vitrini ve arkasındaki yönetimi birlikte yapıyoruz: ürün, sipariş, kupon, yorum ve müşteri tek panelde. Erden Davetiye'nin sitesini ve panelini böyle kurduk.",
      forWhom: ["Mağazasını internete taşıyacaklar", "Kişiye özel ürün satanlar", "Pazaryerine bağımlılığı azaltmak isteyenler"],
      includes: ["Ürün ve kategori yönetimi", "Sepet ve sipariş", "Sanal POS bağlantısı", "Kargo bağlantısı", "Kupon ve kampanya", "Müşteri yorumları", "Satış raporu"],
      priceLine: QUOTE_TR,
      faq: [
        { q: "Hangi ödeme sistemleri bağlanır?", a: "Anlaştığınız banka ya da ödeme kuruluşunun sağladığı altyapıyı bağlıyoruz." },
        { q: "Ürünleri kim girer?", a: "Panelden siz. İsterseniz ilk yüklemeyi dosyadan biz yaparız." },
      ],
    },
    en: {
      name: "E-commerce",
      title: "E-commerce website development",
      description: "E-commerce sites with product, order, coupon and customer management, payments and shipping.",
      h1: "E-commerce websites",
      intro: "The storefront and the admin behind it, together: products, orders, coupons, reviews and customers in one panel. Erden Davetiye runs on one we built.",
      forWhom: ["Shops going online", "Made-to-order products", "Sellers reducing marketplace dependence"],
      includes: ["Products and categories", "Cart and orders", "Card payments", "Shipping", "Coupons", "Reviews", "Sales reports"],
      priceLine: QUOTE_EN,
      faq: [{ q: "Which payment systems?", a: "Whichever your bank or payment provider offers an interface for." }],
    },
  },
  {
    slug: "yapay-zeka",
    service: "ai",
    projects: [],
    tr: {
      name: "Yapay zekâ",
      title: "İşletmeler için Yapay Zekâ Çözümleri",
      description: "Müşteri sorularını yanıtlayan asistan, belge okuma ve veri analizi. İşletmenize yapay zekâ entegrasyonu.",
      h1: "İşletmeniz için yapay zekâ",
      intro: "Yapay zekâyı vitrin için değil, bir işi gerçekten kısaltıyorsa kullanıyoruz: sık gelen soruları yanıtlamak, belgeden veri çıkarmak, yazışmayı özetlemek.",
      forWhom: ["Aynı soruları her gün yanıtlayan ekipler", "Çok belge işleyen işletmeler", "Elindeki veriden cevap arayanlar"],
      includes: ["Müşteri asistanı", "Belge ve görsel okuma", "Kendi bilgilerinizle çalışan arama", "Mevcut sisteme bağlantı", "İnsan onayı gerektiren adımlar"],
      priceLine: QUOTE_TR,
      faq: [
        { q: "Verilerimiz nereye gider?", a: "Hangi sağlayıcının kullanılacağını ve verinin nerede işleneceğini baştan yazılı belirliyoruz." },
        { q: "Bize gerçekten gerekli mi?", a: "Değilse söylüyoruz. Çoğu işte basit bir otomasyon daha ucuz ve daha güvenilir." },
      ],
    },
    en: {
      name: "Artificial intelligence",
      title: "AI for businesses",
      description: "Customer assistants, document reading and search over your own data, connected to your systems.",
      h1: "AI for your business",
      intro: "We use AI where it genuinely shortens work: answering common questions, reading documents, summarising correspondence.",
      forWhom: ["Teams answering the same questions daily", "Businesses handling many documents", "People looking for answers in their data"],
      includes: ["Customer assistant", "Document reading", "Search over your own data", "Connection to your systems", "Human approval steps"],
      priceLine: QUOTE_EN,
      faq: [{ q: "Do we really need it?", a: "If not, we say so. A simple automation is often cheaper and more reliable." }],
    },
  },
  {
    slug: "otomasyon",
    service: "automation",
    projects: ["dppano"],
    tr: {
      name: "Otomasyon",
      title: "İş Süreci Otomasyonu",
      description: "Tekrarlayan işleri otomatikleştirin: onay, hatırlatma, çizelge, rapor ve bildirim otomasyonu.",
      h1: "Tekrarlayan işi sistem yapsın",
      intro: "Her gün elle yapılan işi kurala bağlıyoruz. DP Pano'da ders programını çakışmasız hazırlayan, nöbeti dağıtan ve gelmeyen öğretmenin dersini paylaştıran kısım buna iyi bir örnek.",
      forWhom: ["Aynı raporu her hafta hazırlayanlar", "Vardiya ya da nöbet planlayanlar", "Onay bekleyen işi takip edenler"],
      includes: ["Otomatik çizelge ve dağıtım", "Onay akışları", "Hatırlatma ve bildirim", "Zamanlanmış raporlar", "Sistemler arası veri aktarımı"],
      priceLine: QUOTE_TR,
      faq: [{ q: "Nereden başlamalıyız?", a: "En çok zaman yiyen tek işten. Onu otomatikleştirip sonucu görünce devam ediyoruz." }],
    },
    en: {
      name: "Automation",
      title: "Business process automation",
      description: "Automate repeated work: approvals, reminders, schedules, reports and notifications.",
      h1: "Let the system do the repeated work",
      intro: "We turn daily manual work into rules. In DP Pano that means generating the timetable, assigning duty and sharing out an absent teacher's lessons.",
      forWhom: ["Teams rebuilding the same report weekly", "Shift and duty planners", "People chasing approvals"],
      includes: ["Schedules and assignment", "Approval flows", "Reminders", "Scheduled reports", "Data between systems"],
      priceLine: QUOTE_EN,
      faq: [{ q: "Where do we start?", a: "With the single task that eats the most time." }],
    },
  },
  {
    slug: "entegrasyon",
    service: "integration",
    projects: ["aracimgo"],
    tr: {
      name: "Entegrasyon",
      title: "API ve Sistem Entegrasyonu",
      description: "Muhasebe, ödeme, kargo, pazaryeri ve mesajlaşma sistemlerini birbirine bağlayan API entegrasyonu.",
      h1: "Sistemlerinizi birbirine bağlıyoruz",
      intro: "Aynı bilgiyi iki programa elle girmeyin. Kullandığınız sistemleri değiştirmeden birbirine bağlıyoruz.",
      forWhom: ["Birden çok program kullanan işletmeler", "Pazaryerinde satış yapanlar", "Muhasebeye elle veri girenler"],
      includes: ["Ödeme ve sanal POS", "Muhasebe ve e-fatura", "Kargo", "Pazaryerleri", "SMS, e-posta ve WhatsApp", "Size özel API"],
      priceLine: QUOTE_TR,
      faq: [{ q: "Her program bağlanabilir mi?", a: "Dışarıya açık bir API'si ya da veri aktarma yolu olan programlar bağlanır. Bakıp size net söylüyoruz." }],
    },
    en: {
      name: "Integration",
      title: "API and systems integration",
      description: "Connecting accounting, payments, shipping, marketplaces and messaging.",
      h1: "We connect your systems",
      intro: "Stop typing the same thing into two programs. We connect what you already use.",
      forWhom: ["Businesses using several programs", "Marketplace sellers", "Teams keying data into accounts"],
      includes: ["Payments", "Accounting and e-invoice", "Shipping", "Marketplaces", "SMS, email and WhatsApp", "Your own API"],
      priceLine: QUOTE_EN,
      faq: [{ q: "Can any program be connected?", a: "Any with an API or a way to export data. We check and tell you plainly." }],
    },
  },
  {
    slug: "3d-webgl",
    service: "webgl",
    projects: ["archon-soft-world"],
    tr: {
      name: "3D ve WebGL",
      title: "3D Web ve WebGL Deneyimleri",
      description: "Tarayıcıda çalışan 3D tanıtım, sanal mekân ve ürün gösterimi. Archon Dünyası'nı yapan ekip.",
      h1: "Tarayıcıda 3D",
      intro: "İndirme gerektirmeyen, telefonda da çalışan 3D mekânlar ve ürün tanıtımları. Örneği bu sitede: Archon Dünyası'na girip yürüyebilirsiniz.",
      forWhom: ["Ürününü her açıdan göstermek isteyenler", "Sanal fuar ya da showroom açacaklar", "Akılda kalan bir tanıtım isteyen markalar"],
      includes: ["3D sahne ve model", "Ürün yapılandırıcı", "Sanal mekân", "Telefon uyumu ve performans", "Sitenize yerleştirme"],
      priceLine: QUOTE_TR,
      faq: [{ q: "Her telefonda çalışır mı?", a: "Cihazın gücüne göre kalite ayarlanır. Çalıştıramayan cihaza sade sürüm gösterilir." }],
    },
    en: {
      name: "3D and WebGL",
      title: "3D web and WebGL experiences",
      description: "3D presentations, virtual places and product views in the browser, by the team behind Archon World.",
      h1: "3D in the browser",
      intro: "3D places and product views with nothing to download, on phones too. The example is on this site: Archon World.",
      forWhom: ["Products that need every angle", "Virtual fairs and showrooms", "Brands that want to be remembered"],
      includes: ["3D scenes and models", "Product configurators", "Virtual places", "Phone performance", "Embedding in your site"],
      priceLine: QUOTE_EN,
      faq: [{ q: "Does it run on every phone?", a: "Quality adapts to the device, with a simple version where it cannot." }],
    },
  },
  {
    slug: "arayuz-tasarimi",
    service: "design",
    projects: ["meetzy", "oyundal"],
    tr: {
      name: "Arayüz tasarımı",
      title: "UI/UX ve Arayüz Tasarımı",
      description: "Mobil uygulama ve web için UI/UX tasarımı, marka kimliği ve tasarım sistemi.",
      h1: "Arayüz ve ürün tasarımı",
      intro: "Yazılacak yazılımın ekranlarını, yazacak ekip gibi düşünerek tasarlıyoruz. Sonuç güzel bir resim değil, kurulabilir bir ürün.",
      forWhom: ["Uygulamasını yenileyecekler", "Yazılım ekibi olup tasarımcısı olmayanlar", "Yeni marka kuranlar"],
      includes: ["Kullanıcı akışları", "Mobil ve web ekranları", "Tıklanabilir prototip", "Tasarım sistemi", "Logo ve marka kimliği"],
      priceLine: QUOTE_TR,
      faq: [{ q: "Sadece tasarım alabilir miyiz?", a: "Evet. Yazılımı kendi ekibiniz yapacaksa dosyaları ve tasarım sistemini teslim ediyoruz." }],
    },
    en: {
      name: "Interface design",
      title: "UI/UX and interface design",
      description: "UI/UX design for mobile and web, brand identity and design systems.",
      h1: "Interface and product design",
      intro: "We design screens thinking like the people who will build them. The result is a product, not a picture.",
      forWhom: ["Apps due a redesign", "Engineering teams without a designer", "New brands"],
      includes: ["User flows", "Mobile and web screens", "Clickable prototype", "Design system", "Logo and identity"],
      priceLine: QUOTE_EN,
      faq: [{ q: "Can we buy only the design?", a: "Yes. You get the files and the design system." }],
    },
  },
];

export const getServicePage = (slug: string) => SERVICE_PAGES.find((one) => one.slug === slug);
/** The page that explains a service of the explorer, if one does. */
export const pageForService = (id: ServiceId) => SERVICE_PAGES.find((one) => one.service === id && one.slug !== "web-sitesi") ?? SERVICE_PAGES[0]!;
