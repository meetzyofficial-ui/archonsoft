import type { Localized, LocalizedList } from "@/lib/i18n";
import { ERDEN, MEETZY, type Screen } from "@/data/screens";

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
  sections: CaseSection[];
  link?: { label: string; href: string };
};

export const PROJECTS: Project[] = [
  {
    slug: "meetzy",
    name: "Meetzy",
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
    lead: MEETZY.mood!,
    screens: [MEETZY.mood!, MEETZY.nearby!, MEETZY.feed!, MEETZY.map!],
    detail: [MEETZY.profile!, MEETZY.memories!, MEETZY.auth!],
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
            "The screens in this case study have their users' names and faces removed. That is not a design flourish — real people are in there, and none of them agreed to appear in a portfolio.",
          ],
          tr: [
            "Buradaki profil bir fotoğraf ve iki cümle değil. Yapılandırılmış: kişi nasıl iletişim kuruyor, nasıl yaşıyor, hafta sonu ne yapıyor, nelerle ilgileniyor. Karar vermeye yetecek kadar bilgi, kararın saniyeler sürmesini sağlayacak şekilde dizilmiş.",
            "Bu vaka çalışmasındaki ekranlarda kullanıcı isimleri ve yüzleri kaldırıldı. Bu bir tasarım süsü değil — orada gerçek insanlar var ve hiçbiri bir portfolyoda yer almayı kabul etmedi.",
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
    slug: "erden-davetiye",
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
