import type { LabBase } from "@/data/labs/types";

/** Concepts 03–06. Commerce, events and the support desk. */

export const CONCEPTS_B: LabBase[] = [
  /* ------------------------------------------------------------ 03 kervan */
  {
    slug: "kervan",
    name: "Kervan",
    index: "03",
    sector: { en: "Multi-sided marketplace", tr: "Çok taraflı pazar yeri" },
    accent: "#E8944A",
    icon: "cart",
    statement: {
      en: "Two products, one ledger. That is what makes a marketplace hard.",
      tr: "İki ürün, tek defter. Bir pazar yerini zor kılan da bu.",
    },
    premise: {
      en: [
        "A marketplace looks like a shop and is not one. There are two products — the side that buys and the side that sells — and a third thing underneath them that has to stay correct while both are moving: who owes what to whom.",
        "This concept is built from that centre outward. An order is one record with two views of it, payouts are derived rather than typed, and moderation is a state on the catalogue instead of a separate spreadsheet.",
      ],
      tr: [
        "Pazar yeri bir dükkâna benzer ama dükkân değildir. İki ürün vardır — alan taraf ve satan taraf — ve ikisi de hareket hâlindeyken doğru kalması gereken üçüncü bir şey: kimin kime ne borçlu olduğu.",
        "Bu konsept bu merkezden dışa doğru kuruluyor. Sipariş, iki görünümü olan tek bir kayıt; hakedişler elle yazılmak yerine türetiliyor; moderasyon ayrı bir tablo değil, katalogun üzerindeki bir durum.",
      ],
    },
    proves: {
      en: [
        "Two distinct applications over one data model",
        "Payments, commission splits and seller payouts",
        "Search, faceted filtering and catalogue moderation",
        "Order lifecycle shared between buyer, seller and operator",
      ],
      tr: [
        "Tek veri modeli üzerinde birbirinden ayrı iki uygulama",
        "Ödeme, komisyon paylaşımı ve satıcı hakedişi",
        "Arama, çok kriterli filtreleme ve katalog moderasyonu",
        "Alıcı, satıcı ve işletmeci arasında paylaşılan sipariş yaşam döngüsü",
      ],
    },
    system: [
      {
        label: { en: "Catalogue", tr: "Katalog" },
        detail: {
          en: "Products belong to sellers, carry variants and a moderation state, and are searchable across both.",
          tr: "Ürünler satıcılara ait, varyant ve moderasyon durumu taşır, ikisi üzerinden de aranabilir.",
        },
      },
      {
        label: { en: "Orders", tr: "Siparişler" },
        detail: {
          en: "One order can split across sellers, and each split tracks its own fulfilment without breaking the buyer's single view.",
          tr: "Bir sipariş satıcılara bölünebilir; her bölüm kendi teslimatını izler ve alıcının tek görünümü bozulmaz.",
        },
      },
      {
        label: { en: "Money", tr: "Para" },
        detail: {
          en: "Commission, refunds and payouts are computed from order events, so the ledger cannot disagree with the orders.",
          tr: "Komisyon, iade ve hakediş sipariş olaylarından hesaplanır; böylece defter siparişlerle çelişemez.",
        },
      },
    ],
    domains: ["commerce", "systems", "products"],
    views: [
      {
        id: "browse",
        label: { en: "Storefront", tr: "Vitrin" },
        icon: "search",
        title: { en: "Ceramics and glass", tr: "Seramik ve cam" },
        meta: { en: "Buyer view", tr: "Alıcı görünümü" },
        body: {
          kind: "catalog",
          cartLabel: { en: "Cart", tr: "Sepet" },
          addLabel: { en: "Add", tr: "Ekle" },
          emptyLabel: { en: "Cart is empty", tr: "Sepet boş" },
          items: [
            {
              id: "p1",
              title: "Stoneware carafe",
              meta: "Kil Atölyesi · Kütahya",
              price: "₺840",
              tag: { en: "Free delivery", tr: "Ücretsiz teslimat" },
              tone: "accent",
            },
            { id: "p2", title: "Hand-blown tumbler, set of 4", meta: "Cam Ocağı · İzmir", price: "₺1,260" },
            {
              id: "p3",
              title: "Glazed serving bowl",
              meta: "Kil Atölyesi · Kütahya",
              price: "₺620",
              tag: { en: "2 left", tr: "2 adet kaldı" },
              tone: "warn",
            },
            { id: "p4", title: "Matte espresso cups", meta: "Toprak & Ateş · Ankara", price: "₺480" },
            { id: "p5", title: "Copper-rim pitcher", meta: "Cam Ocağı · İzmir", price: "₺1,540" },
            { id: "p6", title: "Speckled dinner plates", meta: "Toprak & Ateş · Ankara", price: "₺980" },
          ],
        },
      },
      {
        id: "orders",
        label: { en: "Orders", tr: "Siparişler" },
        icon: "truck",
        badge: "6",
        title: { en: "Order management", tr: "Sipariş yönetimi" },
        meta: { en: "Seller view", tr: "Satıcı görünümü" },
        body: {
          kind: "records",
          filters: [
            { id: "all", label: { en: "All", tr: "Tümü" } },
            { id: "open", label: { en: "To ship", tr: "Gönderilecek" } },
            { id: "issue", label: { en: "Issues", tr: "Sorunlu" } },
          ],
          columns: [
            { key: "no", label: { en: "Order", tr: "Sipariş" } },
            { key: "items", label: { en: "Items", tr: "Kalem" }, hideNarrow: true },
            { key: "state", label: { en: "State", tr: "Durum" } },
            { key: "total", label: { en: "Total", tr: "Tutar" }, align: "end" },
          ],
          rows: [
            {
              id: "o1",
              cells: {
                no: "KV-30281",
                items: "3 items · 2 sellers",
                state: { text: "Partly shipped", tone: "warn" },
                total: "₺2,720",
              },
              detail: {
                title: "KV-30281",
                eyebrow: { en: "Split across two sellers", tr: "İki satıcıya bölünmüş" },
                fields: [
                  { label: { en: "Buyer sees", tr: "Alıcı görüyor" }, value: "One order" },
                  { label: { en: "Sellers see", tr: "Satıcılar görüyor" }, value: "Their lines only" },
                  { label: { en: "Shipped", tr: "Gönderilen" }, value: "2 of 3" },
                  { label: { en: "Commission", tr: "Komisyon" }, value: "₺272" },
                ],
                note: {
                  en: "The split is the interesting part. One payment, two fulfilments, two payouts, and a buyer who should never have to know any of that happened.",
                  tr: "İşin can alıcı yeri bölünme. Tek ödeme, iki teslimat, iki hakediş — ve bunların hiçbirini bilmek zorunda olmaması gereken bir alıcı.",
                },
              },
            },
            {
              id: "o2",
              cells: {
                no: "KV-30279",
                items: "1 item",
                state: { text: "Delivered", tone: "good" },
                total: "₺840",
              },
              detail: {
                title: "KV-30279",
                eyebrow: { en: "Closed", tr: "Kapandı" },
                fields: [
                  { label: { en: "Delivered", tr: "Teslim" }, value: "2 days ago" },
                  { label: { en: "Payout", tr: "Hakediş" }, value: "Released" },
                  { label: { en: "Commission", tr: "Komisyon" }, value: "₺84" },
                ],
              },
            },
            {
              id: "o3",
              cells: {
                no: "KV-30274",
                items: "2 items",
                state: { text: "Refund requested", tone: "risk" },
                total: "₺1,460",
              },
              detail: {
                title: "KV-30274",
                eyebrow: { en: "Payout on hold", tr: "Hakediş beklemede" },
                fields: [
                  { label: { en: "Reason", tr: "Sebep" }, value: "Damaged in transit" },
                  { label: { en: "Payout", tr: "Hakediş" }, value: "Held" },
                  { label: { en: "Decision by", tr: "Karar" }, value: "Operator" },
                ],
                note: {
                  en: "A refund is not a delete. It reverses the commission, holds the payout and leaves the original order intact, because the money has to stay reconcilable afterwards.",
                  tr: "İade bir silme değil. Komisyonu geri alıyor, hakedişi tutuyor ve siparişi olduğu gibi bırakıyor — çünkü paranın sonrasında da mutabık kalabilmesi gerekiyor.",
                },
              },
            },
          ],
        },
      },
      {
        id: "seller",
        label: { en: "Seller", tr: "Satıcı" },
        icon: "chart",
        title: { en: "Seller performance", tr: "Satıcı performansı" },
        meta: { en: "Kil Atölyesi", tr: "Kil Atölyesi" },
        body: {
          kind: "dashboard",
          stats: [
            { label: { en: "Revenue", tr: "Ciro" }, value: "₺86,400", delta: "+14%", tone: "good" },
            { label: { en: "Orders", tr: "Sipariş" }, value: "112", delta: "+9" },
            { label: { en: "Payout due", tr: "Ödenecek" }, value: "₺12,280", delta: "Friday" },
            { label: { en: "Return rate", tr: "İade oranı" }, value: "1.8%", delta: "-0.4 pts", tone: "good" },
          ],
          chart: {
            type: "area",
            values: [18, 24, 21, 29, 34, 31, 38, 44, 41, 52, 58, 63],
            labels: ["Jan", "Apr", "Jul", "Oct"],
            peak: "₺86,400",
          },
          breakdown: [
            { label: { en: "Stoneware carafe", tr: "Taş çömlek sürahi" }, value: 31 },
            { label: { en: "Glazed serving bowl", tr: "Sırlı servis kâsesi" }, value: 24 },
            { label: { en: "Speckled plates", tr: "Benekli tabaklar" }, value: 19 },
            { label: { en: "Espresso cups", tr: "Espresso fincanları" }, value: 12 },
          ],
        },
      },
      {
        id: "moderation",
        label: { en: "Moderation", tr: "Moderasyon" },
        icon: "shield",
        badge: "4",
        title: { en: "Catalogue moderation", tr: "Katalog moderasyonu" },
        meta: { en: "Operator view", tr: "İşletmeci görünümü" },
        body: {
          kind: "board",
          columns: [
            {
              title: { en: "Submitted", tr: "Gönderildi" },
              cards: [
                { id: "m1", title: "Copper-rim pitcher", meta: "Cam Ocağı · 3 photos" },
                { id: "m2", title: "Terracotta planter", meta: "Toprak & Ateş · 5 photos" },
              ],
            },
            {
              title: { en: "Needs changes", tr: "Düzeltme" },
              cards: [
                {
                  id: "m3",
                  title: "Marble coaster set",
                  meta: "Missing dimensions",
                  tag: { en: "Returned", tr: "Geri gönderildi" },
                  tone: "warn",
                },
              ],
            },
            {
              title: { en: "Live", tr: "Yayında" },
              cards: [
                {
                  id: "m4",
                  title: "Stoneware carafe",
                  meta: "Kil Atölyesi",
                  tag: { en: "Listed", tr: "Listede" },
                  tone: "good",
                },
                {
                  id: "m5",
                  title: "Hand-blown tumblers",
                  meta: "Cam Ocağı",
                  tag: { en: "Listed", tr: "Listede" },
                  tone: "good",
                },
              ],
            },
          ],
        },
      },
    ],
  },

  /* ------------------------------------------------------------ 04 vesile */
  {
    slug: "vesile",
    name: "Vesile",
    index: "04",
    sector: { en: "Event platform", tr: "Etkinlik platformu" },
    accent: "#F0587A",
    icon: "ticket",
    statement: {
      en: "Discovery, a ticket, a door, and the numbers afterwards.",
      tr: "Keşif, bir bilet, bir kapı ve sonrasındaki rakamlar.",
    },
    premise: {
      en: [
        "Meetzy answered one half of this problem for real: finding someone to go with. The other half — selling the ticket, scanning it at a door with no signal, and telling the organiser what actually happened — is a different system entirely, and it is the half most event products get wrong.",
        "This concept is that second half drawn out properly. It is a concept, not a roadmap: nothing here is a feature of Meetzy, planned or otherwise.",
      ],
      tr: [
        "Meetzy bu problemin bir yarısını gerçekten çözdü: birlikte gidecek kişiyi bulmak. Diğer yarısı — bileti satmak, kapıda çekmeyen bir telefonla okutmak ve organizatöre gerçekte ne olduğunu anlatmak — bambaşka bir sistem ve etkinlik ürünlerinin çoğunun yanıldığı yarı da bu.",
        "Bu konsept, o ikinci yarının düzgünce çizilmiş hâli. Bir konsept; yol haritası değil. Buradaki hiçbir şey Meetzy'nin planlanmış ya da planlanmamış bir özelliği değildir.",
      ],
    },
    proves: {
      en: [
        "A mobile product and an operator console over one event model",
        "Ticketing, QR issuance and offline-tolerant door scanning",
        "Capacity, waitlists and attendee management",
        "Post-event reporting an organiser can act on",
      ],
      tr: [
        "Tek etkinlik modeli üzerinde bir mobil ürün ve bir operatör konsolu",
        "Biletleme, QR üretimi ve çevrimdışına dayanıklı kapı okutması",
        "Kontenjan, bekleme listesi ve katılımcı yönetimi",
        "Organizatörün üzerine iş yapabileceği etkinlik sonrası raporlama",
      ],
    },
    system: [
      {
        label: { en: "Ticket", tr: "Bilet" },
        detail: {
          en: "A ticket is a signed token, so a door can verify it without a network and reconcile when one returns.",
          tr: "Bilet imzalı bir jeton; kapı onu ağ olmadan doğrulayabiliyor, bağlantı gelince mutabık kalıyor.",
        },
      },
      {
        label: { en: "Capacity", tr: "Kontenjan" },
        detail: {
          en: "Holds, releases and waitlists are the same counter, which is the only way overselling stays impossible under load.",
          tr: "Rezervasyon, iptal ve bekleme listesi aynı sayaç; yoğunlukta fazla satışın imkânsız kalmasının tek yolu bu.",
        },
      },
      {
        label: { en: "Reporting", tr: "Raporlama" },
        detail: {
          en: "Scans, no-shows and sales windows come from the same events the door produced.",
          tr: "Okutmalar, gelmeyenler ve satış pencereleri, kapının ürettiği olaylardan gelir.",
        },
      },
    ],
    domains: ["products", "systems", "data", "infrastructure"],
    views: [
      {
        id: "discovery",
        label: { en: "Discover", tr: "Keşfet" },
        icon: "pin",
        title: { en: "What is on tonight", tr: "Bu akşam ne var" },
        meta: { en: "Attendee app", tr: "Katılımcı uygulaması" },
        body: {
          kind: "mobile",
          screenTitle: { en: "Near you", tr: "Yakınında" },
          deviceLabel: { en: "Attendee app", tr: "Katılımcı uygulaması" },
          rows: [
            {
              title: "Quartet at the old depot",
              meta: "820 m · 21:00 · ₺240",
              tag: { en: "12 left", tr: "12 kaldı" },
              tone: "warn",
            },
            { title: "Open-air screening", meta: "1.4 km · 20:30 · Free", tag: { en: "Free", tr: "Ücretsiz" }, tone: "good" },
            { title: "Ceramics evening class", meta: "2.1 km · 19:00 · ₺380" },
            { title: "Late reading, Kuğulu", meta: "2.8 km · 21:30 · ₺120" },
            { title: "Sunday market walk", meta: "3.4 km · Sun 10:00 · Free" },
          ],
          aside: {
            title: { en: "Quartet at the old depot", tr: "Eski depoda dörtlü" },
            fields: [
              { label: { en: "Capacity", tr: "Kontenjan" }, value: "180" },
              { label: { en: "Sold", tr: "Satılan" }, value: "168" },
              { label: { en: "Held", tr: "Rezerve" }, value: "6" },
              { label: { en: "Waitlist", tr: "Bekleyen" }, value: "23" },
              { label: { en: "Doors", tr: "Kapı" }, value: "20:30" },
            ],
          },
        },
      },
      {
        id: "door",
        label: { en: "Door", tr: "Kapı" },
        icon: "check",
        badge: "168",
        title: { en: "Check-in", tr: "Giriş" },
        meta: { en: "Offline tolerant", tr: "Çevrimdışına dayanıklı" },
        body: {
          kind: "records",
          filters: [
            { id: "all", label: { en: "All", tr: "Tümü" } },
            { id: "in", label: { en: "Checked in", tr: "Giriş yapan" } },
            { id: "issue", label: { en: "Flagged", tr: "İşaretli" } },
          ],
          columns: [
            { key: "ticket", label: { en: "Ticket", tr: "Bilet" } },
            { key: "type", label: { en: "Type", tr: "Tür" }, hideNarrow: true },
            { key: "state", label: { en: "State", tr: "Durum" } },
            { key: "at", label: { en: "Scanned", tr: "Okutma" }, align: "end" },
          ],
          rows: [
            {
              id: "k1",
              cells: {
                ticket: "VS-8841-A",
                type: "Standard",
                state: { text: "Admitted", tone: "good" },
                at: "20:41",
              },
              detail: {
                title: "VS-8841-A",
                eyebrow: { en: "Admitted", tr: "İçeri alındı" },
                fields: [
                  { label: { en: "Verified", tr: "Doğrulama" }, value: "Offline, signature" },
                  { label: { en: "Synced", tr: "Eşitleme" }, value: "20:44" },
                ],
                note: {
                  en: "The door verified the signature with no network and uploaded the scan three minutes later. A venue basement is the normal case, not the edge case.",
                  tr: "Kapı imzayı ağ olmadan doğruladı, okutmayı üç dakika sonra yükledi. Mekânın bodrumu istisna değil, normal durum.",
                },
              },
            },
            {
              id: "k2",
              cells: {
                ticket: "VS-8790-C",
                type: "Standard",
                state: { text: "Already used", tone: "risk" },
                at: "20:52",
              },
              detail: {
                title: "VS-8790-C",
                eyebrow: { en: "Duplicate scan", tr: "Mükerrer okutma" },
                fields: [
                  { label: { en: "First scan", tr: "İlk okutma" }, value: "20:33 · Door A" },
                  { label: { en: "This scan", tr: "Bu okutma" }, value: "20:52 · Door B" },
                  { label: { en: "Action", tr: "Eylem" }, value: "Held for steward" },
                ],
              },
            },
            {
              id: "k3",
              cells: {
                ticket: "VS-8902-A",
                type: "Guest",
                state: { text: "Admitted", tone: "good" },
                at: "20:58",
              },
              detail: {
                title: "VS-8902-A",
                eyebrow: { en: "Guest list", tr: "Konuk listesi" },
                fields: [
                  { label: { en: "Added by", tr: "Ekleyen" }, value: "Organiser" },
                  { label: { en: "Verified", tr: "Doğrulama" }, value: "Online" },
                ],
              },
            },
            {
              id: "k4",
              cells: {
                ticket: "VS-8815-B",
                type: "Standard",
                state: { text: "Not arrived", tone: "idle" },
                at: "—",
              },
              detail: {
                title: "VS-8815-B",
                eyebrow: { en: "Sold, not scanned", tr: "Satıldı, okutulmadı" },
                fields: [
                  { label: { en: "Sold", tr: "Satış" }, value: "6 days ago" },
                  { label: { en: "Waitlist offer", tr: "Bekleme teklifi" }, value: "Sent 21:10" },
                ],
              },
            },
          ],
        },
      },
      {
        id: "organiser",
        label: { en: "Organiser", tr: "Organizatör" },
        icon: "chart",
        title: { en: "Event report", tr: "Etkinlik raporu" },
        meta: { en: "Quartet at the old depot", tr: "Eski depoda dörtlü" },
        body: {
          kind: "dashboard",
          stats: [
            { label: { en: "Sold", tr: "Satılan" }, value: "168 / 180", delta: "93%", tone: "good" },
            { label: { en: "Attended", tr: "Katılan" }, value: "154", delta: "92% of sold" },
            { label: { en: "No-show", tr: "Gelmeyen" }, value: "14", delta: "8%", tone: "warn" },
            { label: { en: "Gross", tr: "Brüt" }, value: "₺40,320" },
          ],
          chart: {
            type: "bar",
            values: [4, 6, 9, 14, 22, 31, 46, 68, 92, 121, 149, 168],
            labels: ["D-14", "D-10", "D-6", "D-3", "D-1", "Door"],
            caption: {
              en: "Cumulative tickets sold, by day before the event",
              tr: "Etkinlik öncesi günlere göre kümülatif bilet satışı",
            },
          },
          timeline: [
            { at: "21:04", actor: "Door B", text: { en: "flagged a duplicate scan", tr: "mükerrer okutma işaretledi" } },
            {
              at: "21:10",
              actor: "System",
              text: { en: "offered 8 waitlist places on no-shows", tr: "gelmeyenler için 8 bekleme yeri sundu" },
            },
            { at: "22:47", actor: "System", text: { en: "closed the door and sealed the count", tr: "kapıyı kapatıp sayımı mühürledi" } },
          ],
        },
      },
    ],
  },

  /* ------------------------------------------------------------ 05 tezgah */
  {
    slug: "tezgah",
    name: "Tezgah",
    index: "05",
    sector: { en: "Commerce system", tr: "Ticaret sistemi" },
    accent: "#C89B5A",
    icon: "box",
    statement: {
      en: "A storefront is the easy half. Stock, money and returns are the product.",
      tr: "Vitrin kolay yarısı. Asıl ürün stok, para ve iade.",
    },
    premise: {
      en: [
        "Erden Davetiye is the real version of this argument and it is live: a storefront and the admin the atelier actually runs on. This concept asks what the same system looks like when the catalogue has variants, stock is finite, and campaigns and returns are moving at the same time.",
        "The interesting problems are not on the product page. They are the ones that decide whether a business can be operated from the software: what happens to a basket when the last one sells, what a coupon does to a margin, what a return does to stock that was already counted.",
      ],
      tr: [
        "Bu argümanın gerçek ve canlı hâli Erden Davetiye: bir vitrin ve atölyenin işini gerçekten yürüttüğü yönetim tarafı. Bu konsept ise aynı sistemin katalog varyantlandığında, stok sınırlı olduğunda, kampanya ve iadeler aynı anda hareket ettiğinde neye benzediğini soruyor.",
        "İlginç problemler ürün sayfasında değil. Bir işin yazılımın üzerinden yürütülüp yürütülemeyeceğine karar veren sorularda: sonuncusu satıldığında sepete ne olur, bir kupon marja ne yapar, iade edilen bir ürün zaten sayılmış stoğa ne yapar.",
      ],
    },
    proves: {
      en: [
        "Variants, stock reservation and oversell protection",
        "Checkout, payment states and refunds",
        "Coupons, campaigns and their effect on margin",
        "An admin that a non-technical team can run a business from",
      ],
      tr: [
        "Varyant, stok rezervasyonu ve fazla satış koruması",
        "Ödeme akışı, ödeme durumları ve iadeler",
        "Kupon, kampanya ve bunların marja etkisi",
        "Teknik olmayan bir ekibin iş yürütebileceği bir yönetim paneli",
      ],
    },
    system: [
      {
        label: { en: "Catalogue", tr: "Katalog" },
        detail: {
          en: "Products carry variants, and stock is held against the variant rather than the product.",
          tr: "Ürünler varyant taşır; stok ürünün değil, varyantın üzerinde tutulur.",
        },
      },
      {
        label: { en: "Checkout", tr: "Ödeme" },
        detail: {
          en: "Stock is reserved at basket, released on timeout, and only committed when payment settles.",
          tr: "Stok sepette rezerve edilir, süre dolunca serbest bırakılır ve ancak ödeme kesinleşince düşülür.",
        },
      },
      {
        label: { en: "Admin", tr: "Yönetim" },
        detail: {
          en: "Products, orders, customers, coupons and reports in one place, operated by the business.",
          tr: "Ürün, sipariş, müşteri, kupon ve raporlar tek yerde; işi yapanın kendi yönettiği hâlde.",
        },
      },
    ],
    domains: ["commerce", "systems"],
    views: [
      {
        id: "storefront",
        label: { en: "Storefront", tr: "Vitrin" },
        icon: "cart",
        title: { en: "Autumn collection", tr: "Sonbahar koleksiyonu" },
        meta: { en: "Customer view", tr: "Müşteri görünümü" },
        body: {
          kind: "catalog",
          cartLabel: { en: "Basket", tr: "Sepet" },
          addLabel: { en: "Add", tr: "Ekle" },
          emptyLabel: { en: "Basket is empty", tr: "Sepet boş" },
          items: [
            {
              id: "t1",
              title: "Linen throw — sand",
              meta: "3 sizes · 4 colours",
              price: "₺1,240",
              tag: { en: "Campaign −15%", tr: "Kampanya −%15" },
              tone: "accent",
            },
            { id: "t2", title: "Wool runner — slate", meta: "2 sizes", price: "₺2,180" },
            {
              id: "t3",
              title: "Cotton napkins, set of 6",
              meta: "5 colours",
              price: "₺460",
              tag: { en: "Low stock", tr: "Stok az" },
              tone: "warn",
            },
            { id: "t4", title: "Quilted cushion cover", meta: "3 colours", price: "₺520" },
            { id: "t5", title: "Table cloth — ecru", meta: "4 sizes", price: "₺1,680" },
            {
              id: "t6",
              title: "Bath set — charcoal",
              meta: "Out of stock",
              price: "₺940",
              tag: { en: "Notify me", tr: "Haber ver" },
              tone: "idle",
            },
          ],
        },
      },
      {
        id: "orders",
        label: { en: "Orders", tr: "Siparişler" },
        icon: "truck",
        badge: "9",
        title: { en: "Orders", tr: "Siparişler" },
        meta: { en: "Today", tr: "Bugün" },
        body: {
          kind: "records",
          filters: [
            { id: "all", label: { en: "All", tr: "Tümü" } },
            { id: "pack", label: { en: "To pack", tr: "Paketlenecek" } },
            { id: "return", label: { en: "Returns", tr: "İadeler" } },
          ],
          columns: [
            { key: "no", label: { en: "Order", tr: "Sipariş" } },
            { key: "customer", label: { en: "Customer", tr: "Müşteri" }, hideNarrow: true },
            { key: "state", label: { en: "State", tr: "Durum" } },
            { key: "total", label: { en: "Total", tr: "Tutar" }, align: "end" },
          ],
          rows: [
            {
              id: "e1",
              cells: {
                no: "TZ-11204",
                customer: "Repeat customer",
                state: { text: "Paid", tone: "good" },
                total: "₺2,640",
              },
              detail: {
                title: "TZ-11204",
                eyebrow: { en: "Ready to pack", tr: "Paketlenmeye hazır" },
                fields: [
                  { label: { en: "Items", tr: "Kalem" }, value: "3" },
                  { label: { en: "Coupon", tr: "Kupon" }, value: "AUTUMN15" },
                  { label: { en: "Discount", tr: "İndirim" }, value: "−₺396" },
                  { label: { en: "Margin", tr: "Marj" }, value: "38%" },
                ],
                note: {
                  en: "Margin is shown next to the discount on purpose. A coupon that quietly sells stock below cost is the failure mode nobody notices until the quarter closes.",
                  tr: "Marj, indirimin yanında bilerek gösteriliyor. Sessizce maliyetin altına satan bir kupon, çeyrek kapanana kadar kimsenin fark etmediği hata biçimidir.",
                },
              },
            },
            {
              id: "e2",
              cells: {
                no: "TZ-11201",
                customer: "New customer",
                state: { text: "Payment failed", tone: "risk" },
                total: "₺1,240",
              },
              detail: {
                title: "TZ-11201",
                eyebrow: { en: "Stock released", tr: "Stok serbest bırakıldı" },
                fields: [
                  { label: { en: "Attempts", tr: "Deneme" }, value: "2" },
                  { label: { en: "Reservation", tr: "Rezervasyon" }, value: "Expired, 20m" },
                  { label: { en: "Recovery mail", tr: "Hatırlatma" }, value: "Queued" },
                ],
              },
            },
            {
              id: "e3",
              cells: {
                no: "TZ-11188",
                customer: "Repeat customer",
                state: { text: "Return in transit", tone: "warn" },
                total: "₺460",
              },
              detail: {
                title: "TZ-11188",
                eyebrow: { en: "Return", tr: "İade" },
                fields: [
                  { label: { en: "Reason", tr: "Sebep" }, value: "Wrong colour" },
                  { label: { en: "Restock", tr: "Stoğa dönüş" }, value: "On arrival" },
                  { label: { en: "Refund", tr: "İade tutarı" }, value: "On inspection" },
                ],
              },
            },
          ],
        },
      },
      {
        id: "inventory",
        label: { en: "Inventory", tr: "Stok" },
        icon: "layers",
        badge: "2",
        title: { en: "Stock by variant", tr: "Varyanta göre stok" },
        meta: { en: "Live", tr: "Canlı" },
        body: {
          kind: "records",
          columns: [
            { key: "variant", label: { en: "Variant", tr: "Varyant" } },
            { key: "held", label: { en: "Held", tr: "Rezerve" }, hideNarrow: true },
            { key: "state", label: { en: "State", tr: "Durum" } },
            { key: "free", label: { en: "Free", tr: "Serbest" }, align: "end" },
          ],
          rows: [
            {
              id: "v1",
              cells: {
                variant: "Cotton napkins · ecru",
                held: "4",
                state: { text: "Low", tone: "warn" },
                free: "6",
              },
              detail: {
                title: "Cotton napkins · ecru",
                eyebrow: { en: "Below reorder point", tr: "Sipariş noktasının altında" },
                fields: [
                  { label: { en: "On hand", tr: "Elde" }, value: "10" },
                  { label: { en: "Held in baskets", tr: "Sepetlerde" }, value: "4" },
                  { label: { en: "Reorder at", tr: "Sipariş noktası" }, value: "12" },
                ],
                note: {
                  en: "Held and free are separate numbers for a reason. Selling what is sitting in somebody else's basket is the classic way a storefront oversells itself.",
                  tr: "Rezerve ve serbest sayıların ayrı olmasının sebebi var. Başkasının sepetinde duranı satmak, bir vitrinin kendini fazla satmasının klasik yolu.",
                },
              },
            },
            {
              id: "v2",
              cells: {
                variant: "Linen throw · sand · L",
                held: "2",
                state: { text: "Healthy", tone: "good" },
                free: "38",
              },
              detail: {
                title: "Linen throw · sand · L",
                eyebrow: { en: "In stock", tr: "Stokta" },
                fields: [
                  { label: { en: "On hand", tr: "Elde" }, value: "40" },
                  { label: { en: "Held in baskets", tr: "Sepetlerde" }, value: "2" },
                  { label: { en: "Reorder at", tr: "Sipariş noktası" }, value: "15" },
                ],
              },
            },
            {
              id: "v3",
              cells: {
                variant: "Bath set · charcoal",
                held: "0",
                state: { text: "Out of stock", tone: "risk" },
                free: "0",
              },
              detail: {
                title: "Bath set · charcoal",
                eyebrow: { en: "Waiting list open", tr: "Bekleme listesi açık" },
                fields: [
                  { label: { en: "Waiting", tr: "Bekleyen" }, value: "17 customers" },
                  { label: { en: "Incoming", tr: "Gelecek" }, value: "60 · 12 days" },
                ],
              },
            },
          ],
        },
      },
      {
        id: "reports",
        label: { en: "Reports", tr: "Raporlar" },
        icon: "chart",
        title: { en: "Trading", tr: "Satış" },
        meta: { en: "Last 12 weeks", tr: "Son 12 hafta" },
        body: {
          kind: "dashboard",
          stats: [
            { label: { en: "Revenue", tr: "Ciro" }, value: "₺318,400", delta: "+8.4%", tone: "good" },
            { label: { en: "Orders", tr: "Sipariş" }, value: "412", delta: "+31" },
            { label: { en: "Average basket", tr: "Ortalama sepet" }, value: "₺773", delta: "−₺22", tone: "risk" },
            { label: { en: "Return rate", tr: "İade oranı" }, value: "3.1%" },
          ],
          chart: {
            type: "area",
            values: [22, 26, 24, 31, 29, 36, 42, 39, 48, 54, 51, 62],
            labels: ["W1", "W4", "W8", "W12"],
            peak: "₺318,400",
          },
          ranges: [
            { id: "4w", label: "4w", values: [48, 54, 51, 62] },
            { id: "12w", label: "12w", values: [22, 26, 24, 31, 29, 36, 42, 39, 48, 54, 51, 62] },
            { id: "1y", label: "1y", values: [14, 19, 22, 26, 31, 29, 38, 42, 39, 48, 54, 62] },
          ],
          breakdown: [
            { label: { en: "Full price", tr: "Tam fiyat" }, value: 214800 },
            { label: { en: "Campaign", tr: "Kampanya" }, value: 78200 },
            { label: { en: "Coupon", tr: "Kupon" }, value: 25400 },
          ],
          breakdownUnit: " ₺",
        },
      },
    ],
  },

  /* ----------------------------------------------------------- 06 vardiya */
  {
    slug: "vardiya",
    name: "Vardiya",
    index: "06",
    sector: { en: "AI customer support", tr: "Yapay zekâ müşteri desteği" },
    accent: "#3FB6A0",
    icon: "message",
    statement: {
      en: "Answer from what is true, or hand it to someone who knows.",
      tr: "Doğru olandan cevap ver; bilmiyorsan bilene devret.",
    },
    premise: {
      en: [
        "A support assistant that guesses is worse than no assistant, because a confident wrong answer costs more than a slow right one. The whole design problem is the handover: knowing when not to answer, and passing the conversation across with everything the person needs already gathered.",
        "This concept answers from the order record and the policy text, cites both, and escalates the moment the ground under the answer runs out — with the customer history, the order and the draft reply already on the agent's screen.",
      ],
      tr: [
        "Tahmin eden bir destek asistanı, hiç asistan olmamasından kötüdür; çünkü kendinden emin yanlış bir cevap, yavaş ama doğru olandan pahalıya patlar. Asıl tasarım problemi devir: ne zaman cevap vermemesi gerektiğini bilmek ve görüşmeyi, karşı tarafın ihtiyacı olan her şey toplanmış hâlde teslim etmek.",
        "Bu konsept cevabını sipariş kaydından ve politika metninden veriyor, ikisini de kaynak gösteriyor ve cevabın altındaki zemin bittiği anda devrediyor — müşteri geçmişi, sipariş ve taslak yanıt temsilcinin ekranında hazır.",
      ],
    },
    proves: {
      en: [
        "Retrieval over a company's own records and policies",
        "Citations on every generated answer",
        "Escalation, human takeover and a shared conversation state",
        "Automation rules a support lead can change without a developer",
      ],
      tr: [
        "Şirketin kendi kayıtları ve politikaları üzerinde getirme",
        "Üretilen her cevapta kaynak gösterimi",
        "Devir, insana geçiş ve ortak görüşme durumu",
        "Destek sorumlusunun geliştiriciye ihtiyaç duymadan değiştirebildiği otomasyon kuralları",
      ],
    },
    system: [
      {
        label: { en: "Retrieval", tr: "Getirme" },
        detail: {
          en: "The order record first, the policy text second, and nothing outside either.",
          tr: "Önce sipariş kaydı, sonra politika metni; ikisinin dışında hiçbir şey.",
        },
      },
      {
        label: { en: "Confidence", tr: "Güven" },
        detail: {
          en: "An answer without a citation is not sent. It becomes an escalation instead.",
          tr: "Kaynağı olmayan cevap gönderilmez; yerine devir kaydı oluşur.",
        },
      },
      {
        label: { en: "Takeover", tr: "Devir" },
        detail: {
          en: "An agent inherits the full thread, the context and a draft, not a summary of it.",
          tr: "Temsilci, özetini değil, görüşmenin tamamını, bağlamı ve taslağı devralır.",
        },
      },
    ],
    domains: ["ai", "automation"],
    views: [
      {
        id: "inbox",
        label: { en: "Inbox", tr: "Gelen kutusu" },
        icon: "message",
        badge: "3",
        title: { en: "Conversations", tr: "Görüşmeler" },
        meta: { en: "Shared queue", tr: "Ortak kuyruk" },
        body: {
          kind: "thread",
          composer: { en: "Reply as the team", tr: "Ekip adına yanıtla" },
          conversations: [
            {
              id: "v1",
              subject: "Where is order TZ-11188?",
              who: "Customer · repeat",
              meta: { en: "Answered by assistant", tr: "Asistan yanıtladı" },
              tone: "good",
              messages: [
                {
                  from: "customer",
                  at: "14:02",
                  text: {
                    en: "I sent the napkins back four days ago and I have not heard anything.",
                    tr: "Peçeteleri dört gün önce geri gönderdim, hâlâ bir haber yok.",
                  },
                },
                {
                  from: "assistant",
                  at: "14:02",
                  sources: ["Order TZ-11188", "Returns policy §3"],
                  text: {
                    en: "Your return was collected on Tuesday and reached the warehouse this morning. Inspection takes up to two working days, and the refund of ₺460 goes back to the original card within three days of that. You do not need to do anything — I will write again when it is issued.",
                    tr: "İadeniz salı günü alındı ve bu sabah depoya ulaştı. İnceleme iki iş gününe kadar sürüyor; ₺460 tutarındaki iade, ardından üç gün içinde kartınıza geçiyor. Yapmanız gereken bir şey yok — işlendiğinde tekrar yazacağım.",
                  },
                },
              ],
              context: [
                { label: { en: "Order", tr: "Sipariş" }, value: "TZ-11188" },
                { label: { en: "Return", tr: "İade" }, value: "At warehouse" },
                { label: { en: "Sources", tr: "Kaynak" }, value: "2" },
                { label: { en: "Handled in", tr: "Süre" }, value: "3s" },
              ],
            },
            {
              id: "v2",
              subject: "Can I return an opened bath set?",
              who: "Customer · new",
              meta: { en: "Escalated", tr: "Devredildi" },
              tone: "warn",
              messages: [
                {
                  from: "customer",
                  at: "14:20",
                  text: {
                    en: "I opened the packaging before I realised it was the wrong colour. Can I still send it back?",
                    tr: "Yanlış renk olduğunu fark etmeden ambalajı açtım. Yine de geri gönderebilir miyim?",
                  },
                },
                {
                  from: "assistant",
                  at: "14:20",
                  sources: ["Returns policy §5 — hygiene items"],
                  text: {
                    en: "The policy treats bath textiles as hygiene items and does not cover an opened package, but it also lets the team make an exception. I am not the right one to decide that, so I am passing this to a person now with your order attached.",
                    tr: "Politika banyo tekstilini hijyen ürünü sayıyor ve açılmış ambalajı kapsamıyor; ancak ekibe istisna yapma yetkisi de veriyor. Buna karar verecek olan ben değilim, bu yüzden siparişinizle birlikte bir kişiye aktarıyorum.",
                  },
                },
                {
                  from: "agent",
                  at: "14:26",
                  text: {
                    en: "This one is on us — the colour swatch on that listing is genuinely misleading. Return label is on its way and I have flagged the photography.",
                    tr: "Bu bizden — o ürünün renk örneği gerçekten yanıltıcı. İade etiketi yolda, fotoğrafı da işaretledim.",
                  },
                },
              ],
              context: [
                { label: { en: "Reason", tr: "Sebep" }, value: "Outside policy" },
                { label: { en: "Escalated in", tr: "Devir süresi" }, value: "8s" },
                { label: { en: "Agent", tr: "Temsilci" }, value: "Support lead" },
                { label: { en: "Outcome", tr: "Sonuç" }, value: "Exception granted" },
              ],
            },
            {
              id: "v3",
              subject: "Do you ship to Northern Cyprus?",
              who: "Customer · new",
              meta: { en: "Answered by assistant", tr: "Asistan yanıtladı" },
              tone: "good",
              messages: [
                {
                  from: "customer",
                  at: "13:41",
                  text: { en: "Do you deliver to Girne?", tr: "Girne'ye teslimat yapıyor musunuz?" },
                },
                {
                  from: "assistant",
                  at: "13:41",
                  sources: ["Shipping zones · table"],
                  text: {
                    en: "Yes. Girne is in zone 4: delivery is ₺180 and takes five to seven working days. Orders over ₺2,500 ship free to that zone.",
                    tr: "Evet. Girne 4. bölgede: teslimat ₺180 ve beş ila yedi iş günü sürüyor. ₺2.500 üzeri siparişlerde bu bölgeye kargo ücretsiz.",
                  },
                },
              ],
              context: [
                { label: { en: "Zone", tr: "Bölge" }, value: "4" },
                { label: { en: "Sources", tr: "Kaynak" }, value: "1" },
                { label: { en: "Handled in", tr: "Süre" }, value: "2s" },
              ],
            },
          ],
        },
      },
      {
        id: "rules",
        label: { en: "Rules", tr: "Kurallar" },
        icon: "flow",
        title: { en: "Escalation rules", tr: "Devir kuralları" },
        meta: { en: "Editable by the team", tr: "Ekip tarafından düzenlenebilir" },
        body: {
          kind: "board",
          columns: [
            {
              title: { en: "Answer directly", tr: "Doğrudan cevapla" },
              cards: [
                { id: "vr1", title: "Order status", meta: "From the order record" },
                { id: "vr2", title: "Shipping and zones", meta: "From the rate table" },
                { id: "vr3", title: "Stock and restock dates", meta: "From inventory" },
              ],
            },
            {
              title: { en: "Draft, do not send", tr: "Taslak yaz, gönderme" },
              cards: [
                {
                  id: "vr4",
                  title: "Refund amounts",
                  meta: "Agent confirms the figure",
                  tag: { en: "Review", tr: "İnceleme" },
                  tone: "warn",
                },
                { id: "vr5", title: "Damage claims", meta: "Needs photographs", tag: { en: "Review", tr: "İnceleme" }, tone: "warn" },
              ],
            },
            {
              title: { en: "Escalate at once", tr: "Hemen devret" },
              cards: [
                {
                  id: "vr6",
                  title: "Outside policy",
                  meta: "Any exception request",
                  tag: { en: "Human", tr: "İnsan" },
                  tone: "accent",
                },
                {
                  id: "vr7",
                  title: "No citable source",
                  meta: "The answer would be a guess",
                  tag: { en: "Human", tr: "İnsan" },
                  tone: "accent",
                },
                {
                  id: "vr8",
                  title: "Customer asks for a person",
                  meta: "Always, immediately",
                  tag: { en: "Human", tr: "İnsan" },
                  tone: "accent",
                },
              ],
            },
          ],
        },
      },
      {
        id: "performance",
        label: { en: "Analytics", tr: "Analitik" },
        icon: "chart",
        title: { en: "Desk performance", tr: "Destek performansı" },
        meta: { en: "Last 8 weeks", tr: "Son 8 hafta" },
        body: {
          kind: "dashboard",
          stats: [
            { label: { en: "Resolved by assistant", tr: "Asistanın çözdüğü" }, value: "64%", delta: "+7 pts", tone: "good" },
            { label: { en: "Median first reply", tr: "Ortanca ilk yanıt" }, value: "4s", delta: "was 38m" },
            { label: { en: "Escalated", tr: "Devredilen" }, value: "36%" },
            { label: { en: "Reopened", tr: "Yeniden açılan" }, value: "2.1%", delta: "−0.6 pts", tone: "good" },
          ],
          chart: {
            type: "bar",
            values: [41, 44, 48, 51, 55, 58, 61, 64],
            labels: ["W1", "W3", "W5", "W7"],
            caption: {
              en: "Share resolved without an agent, by week",
              tr: "Haftalara göre, temsilciye uğramadan çözülen oranı",
            },
          },
          breakdown: [
            { label: { en: "Order status", tr: "Sipariş durumu" }, value: 1840 },
            { label: { en: "Shipping", tr: "Kargo" }, value: 960 },
            { label: { en: "Returns", tr: "İadeler" }, value: 740 },
            { label: { en: "Product questions", tr: "Ürün soruları" }, value: 520 },
            { label: { en: "Exceptions", tr: "İstisnalar" }, value: 180 },
          ],
        },
      },
    ],
  },
];
