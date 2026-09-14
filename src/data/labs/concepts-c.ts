import type { LabBase } from "@/data/labs/types";

/** Concepts 07–10. Measurement, operations, knowledge and the client side. */

export const CONCEPTS_C: LabBase[] = [
  /* ------------------------------------------------------------- 07 ölçek */
  {
    slug: "olcek",
    name: "Ölçek",
    index: "07",
    sector: { en: "Product analytics", tr: "Ürün analitiği" },
    accent: "#4FA8FF",
    icon: "chart",
    statement: {
      en: "A number nobody can act on is decoration.",
      tr: "Üzerine iş yapılamayan rakam, süstür.",
    },
    premise: {
      en: [
        "Most analytics screens answer a question nobody asked. They report totals going up and to the right, which feels good and changes nothing, while the question a product team actually has — where did people stop, and which ones came back — takes an afternoon and an export.",
        "This concept is built the other way around: events first, funnels and cohorts as first-class objects, and every chart sitting one click from the rows that produced it.",
      ],
      tr: [
        "Analitik ekranlarının çoğu kimsenin sormadığı bir soruyu cevaplar. Sağa yukarı giden toplamları raporlar; iyi hissettirir, hiçbir şeyi değiştirmez. Ürün ekibinin asıl sorusu — insanlar nerede durdu ve hangileri geri döndü — ise bir öğleden sonra ve bir dışa aktarma ister.",
        "Bu konsept tersinden kuruluyor: önce olaylar, birinci sınıf nesne olarak huniler ve kohortlar, ve her grafiğin onu üreten satırlara bir tık uzaklıkta durması.",
      ],
    },
    proves: {
      en: [
        "Event ingestion and a queryable event model",
        "Funnels, cohorts and retention derived from raw events",
        "Charts that resolve back to the underlying rows",
        "Exports and scheduled reports",
      ],
      tr: [
        "Olay toplama ve sorgulanabilir bir olay modeli",
        "Ham olaylardan türetilen huni, kohort ve elde tutma",
        "Altındaki satırlara geri çözülen grafikler",
        "Dışa aktarma ve zamanlanmış raporlar",
      ],
    },
    system: [
      {
        label: { en: "Ingestion", tr: "Toplama" },
        detail: {
          en: "Events arrive with a name, a subject and typed properties, and are never aggregated on the way in.",
          tr: "Olaylar bir ad, bir özne ve tipli özelliklerle gelir; girişte asla toplanmaz.",
        },
      },
      {
        label: { en: "Query", tr: "Sorgu" },
        detail: {
          en: "Funnels and cohorts are queries over those events rather than tables somebody has to maintain.",
          tr: "Huni ve kohortlar, birinin bakımını yapması gereken tablolar değil, o olaylar üzerinde sorgulardır.",
        },
      },
      {
        label: { en: "Delivery", tr: "Dağıtım" },
        detail: {
          en: "Anything on screen can be scheduled to a mailbox or pulled through the API.",
          tr: "Ekrandaki her şey bir posta kutusuna zamanlanabilir veya API üzerinden çekilebilir.",
        },
      },
    ],
    domains: ["data", "systems", "infrastructure"],
    views: [
      {
        id: "overview",
        label: { en: "Overview", tr: "Genel" },
        icon: "chart",
        title: { en: "Product overview", tr: "Ürün görünümü" },
        meta: { en: "Sample workspace", tr: "Örnek çalışma alanı" },
        body: {
          kind: "dashboard",
          stats: [
            { label: { en: "Weekly active", tr: "Haftalık aktif" }, value: "8,420", delta: "+4.1%", tone: "good" },
            { label: { en: "New this week", tr: "Bu hafta yeni" }, value: "612", delta: "+38" },
            { label: { en: "Week 4 retention", tr: "4. hafta elde tutma" }, value: "31%", delta: "−2 pts", tone: "risk" },
            { label: { en: "Events / day", tr: "Günlük olay" }, value: "1.9M" },
          ],
          chart: {
            type: "area",
            values: [52, 58, 61, 57, 66, 71, 68, 76, 81, 79, 88, 94],
            labels: ["W1", "W4", "W8", "W12"],
            peak: "8,420",
          },
          ranges: [
            { id: "7d", label: "7d", values: [79, 82, 80, 86, 88, 91, 94] },
            { id: "12w", label: "12w", values: [52, 58, 61, 57, 66, 71, 68, 76, 81, 79, 88, 94] },
            { id: "1y", label: "1y", values: [18, 24, 31, 38, 44, 52, 57, 66, 71, 79, 88, 94] },
          ],
          timeline: [
            {
              at: "Mon",
              actor: "Release 2.14",
              text: { en: "shipped the shorter sign-up", tr: "kısaltılmış kaydı yayınladı" },
            },
            {
              at: "Wed",
              actor: "Alert",
              text: { en: "flagged a drop in week 4 retention", tr: "4. hafta elde tutmada düşüş bildirdi" },
            },
          ],
        },
      },
      {
        id: "funnel",
        label: { en: "Funnel", tr: "Huni" },
        icon: "filter",
        title: { en: "Sign-up to first action", tr: "Kayıttan ilk eyleme" },
        meta: { en: "Last 30 days", tr: "Son 30 gün" },
        body: {
          kind: "dashboard",
          stats: [
            { label: { en: "Entered", tr: "Giren" }, value: "12,480" },
            { label: { en: "Completed", tr: "Tamamlayan" }, value: "4,118", delta: "33%" },
            { label: { en: "Biggest drop", tr: "En büyük kayıp" }, value: "Verify", delta: "−28%", tone: "risk" },
            { label: { en: "Median time", tr: "Ortanca süre" }, value: "3m 40s" },
          ],
          chart: {
            type: "bar",
            values: [12480, 10940, 7880, 5240, 4118],
            labels: ["Open", "Start", "Verify", "Profile", "Action"],
            caption: {
              en: "Where people stop. Verification is the step that costs the most.",
              tr: "İnsanların durduğu yer. En pahalıya mal olan adım doğrulama.",
            },
          },
          breakdown: [
            { label: { en: "Opened sign-up", tr: "Kaydı açtı" }, value: 12480, note: "100%" },
            { label: { en: "Started the form", tr: "Formu başlattı" }, value: 10940, note: "88%" },
            { label: { en: "Verified", tr: "Doğruladı" }, value: 7880, note: "63%" },
            { label: { en: "Completed profile", tr: "Profili tamamladı" }, value: 5240, note: "42%" },
            { label: { en: "First real action", tr: "İlk gerçek eylem" }, value: 4118, note: "33%" },
          ],
        },
      },
      {
        id: "events",
        label: { en: "Events", tr: "Olaylar" },
        icon: "database",
        title: { en: "Event stream", tr: "Olay akışı" },
        meta: { en: "Live", tr: "Canlı" },
        body: {
          kind: "records",
          filters: [
            { id: "all", label: { en: "All", tr: "Tümü" } },
            { id: "core", label: { en: "Core", tr: "Çekirdek" } },
            { id: "errors", label: { en: "Errors", tr: "Hatalar" } },
          ],
          columns: [
            { key: "name", label: { en: "Event", tr: "Olay" } },
            { key: "props", label: { en: "Properties", tr: "Özellikler" }, hideNarrow: true },
            { key: "state", label: { en: "Health", tr: "Sağlık" } },
            { key: "count", label: { en: "24h", tr: "24s" }, align: "end" },
          ],
          rows: [
            {
              id: "ev1",
              cells: {
                name: "signup_completed",
                props: "source, plan, device",
                state: { text: "Healthy", tone: "good" },
                count: "612",
              },
              detail: {
                title: "signup_completed",
                eyebrow: { en: "Core event", tr: "Çekirdek olay" },
                fields: [
                  { label: { en: "First seen", tr: "İlk görülme" }, value: "14 months ago" },
                  { label: { en: "Properties", tr: "Özellik" }, value: "3 typed" },
                  { label: { en: "Used in", tr: "Kullanım" }, value: "4 funnels, 2 cohorts" },
                ],
                note: {
                  en: "Typed properties are what make a funnel possible later. An event logged as free text is a decision to answer fewer questions in six months.",
                  tr: "Sonradan huni kurabilmeyi mümkün kılan şey tipli özelliklerdir. Serbest metin olarak kaydedilen bir olay, altı ay sonra daha az soruya cevap vermeye karar vermektir.",
                },
              },
            },
            {
              id: "ev2",
              cells: {
                name: "verification_failed",
                props: "reason, attempt",
                state: { text: "Rising", tone: "warn" },
                count: "1,284",
              },
              detail: {
                title: "verification_failed",
                eyebrow: { en: "Rising", tr: "Yükseliyor" },
                fields: [
                  { label: { en: "Change", tr: "Değişim" }, value: "+41% week on week" },
                  { label: { en: "Top reason", tr: "Baskın sebep" }, value: "code_expired" },
                  { label: { en: "Alert", tr: "Uyarı" }, value: "Fired Wednesday" },
                ],
              },
            },
            {
              id: "ev3",
              cells: {
                name: "item_saved",
                props: "item_id, list",
                state: { text: "Healthy", tone: "good" },
                count: "9,410",
              },
              detail: {
                title: "item_saved",
                eyebrow: { en: "Engagement", tr: "Etkileşim" },
                fields: [
                  { label: { en: "Used in", tr: "Kullanım" }, value: "Retention cohort" },
                  { label: { en: "Properties", tr: "Özellik" }, value: "2 typed" },
                ],
              },
            },
            {
              id: "ev4",
              cells: {
                name: "legacy_click",
                props: "untyped",
                state: { text: "Deprecated", tone: "idle" },
                count: "44",
              },
              detail: {
                title: "legacy_click",
                eyebrow: { en: "Deprecated", tr: "Kullanımdan kalkıyor" },
                fields: [
                  { label: { en: "Replaced by", tr: "Yerine" }, value: "item_saved" },
                  { label: { en: "Removal", tr: "Kaldırma" }, value: "Next release" },
                ],
              },
            },
          ],
        },
      },
    ],
  },

  /* ------------------------------------------------------------ 08 atölye */
  {
    slug: "atolye",
    name: "Atölye",
    index: "08",
    sector: { en: "Internal operations", tr: "İç operasyon" },
    accent: "#6E7FD4",
    icon: "clock",
    statement: {
      en: "If the business runs on spreadsheets and messages, it can run on software.",
      tr: "İş, tablolar ve mesajlarla yürüyorsa, yazılımla da yürüyebilir.",
    },
    premise: {
      en: [
        "A great many working businesses are held together by one spreadsheet, a group chat and somebody who remembers everything. It works until that person is on leave, and it produces no record anybody can look back at.",
        "This concept is what that becomes when it is written down properly: jobs with a state, people with a schedule, stock that decrements when a job consumes it, approvals with a name attached, and a phone in the van that works without signal.",
      ],
      tr: [
        "Çalışan pek çok işletmeyi bir arada tutan şey tek bir tablo, bir grup sohbeti ve her şeyi hatırlayan bir kişidir. Bu kişi izne çıkana kadar işler; ve geriye kimsenin dönüp bakabileceği bir kayıt bırakmaz.",
        "Bu konsept, bunun düzgünce yazıya döküldüğünde neye dönüştüğü: durumu olan işler, programı olan kişiler, iş tükettikçe düşen stok, adı olan onaylar ve çekmediği yerde de çalışan bir saha telefonu.",
      ],
    },
    proves: {
      en: [
        "Scheduling, assignment and job state across a team",
        "Stock consumption tied to the job that consumed it",
        "Approval chains with role permissions and an audit trail",
        "An offline-capable field client that reconciles later",
      ],
      tr: [
        "Ekip genelinde planlama, atama ve iş durumu",
        "Stok tüketiminin, onu tüketen işe bağlanması",
        "Rol yetkileri ve denetim izi olan onay zincirleri",
        "Sonradan mutabık kalan, çevrimdışı çalışabilen saha istemcisi",
      ],
    },
    system: [
      {
        label: { en: "Jobs", tr: "İşler" },
        detail: {
          en: "A job carries a customer, a site, a crew, materials and a state that only moves through legal transitions.",
          tr: "Bir iş; müşteri, saha, ekip, malzeme ve yalnızca geçerli geçişlerle ilerleyen bir durum taşır.",
        },
      },
      {
        label: { en: "Field", tr: "Saha" },
        detail: {
          en: "The phone writes locally and syncs when it can, because the site is where the signal is not.",
          tr: "Telefon yerelde yazar ve şebeke geldiğinde eşitler; çünkü çekmeyen yer, tam da sahanın kendisidir.",
        },
      },
      {
        label: { en: "Approvals", tr: "Onaylar" },
        detail: {
          en: "Anything above a threshold needs a name against it, and that name stays in the record.",
          tr: "Eşiğin üstündeki her şeyin karşısında bir isim gerekir ve o isim kayıtta kalır.",
        },
      },
    ],
    domains: ["systems", "automation", "products", "infrastructure"],
    views: [
      {
        id: "jobs",
        label: { en: "Jobs", tr: "İşler" },
        icon: "grid",
        badge: "11",
        title: { en: "This week", tr: "Bu hafta" },
        meta: { en: "3 crews", tr: "3 ekip" },
        body: {
          kind: "board",
          columns: [
            {
              title: { en: "Scheduled", tr: "Planlandı" },
              cards: [
                { id: "j1", title: "Çankaya · unit 4", meta: "Tue 09:00 · Crew B" },
                { id: "j2", title: "Etimesgut depot", meta: "Wed 08:00 · Crew A" },
                { id: "j3", title: "Keçiören · roof", meta: "Thu 07:30 · Crew C" },
              ],
            },
            {
              title: { en: "In progress", tr: "Devam ediyor" },
              cards: [
                {
                  id: "j4",
                  title: "Yenimahalle · block 2",
                  meta: "Crew A · started 08:14",
                  tag: { en: "On site", tr: "Sahada" },
                  tone: "accent",
                },
                {
                  id: "j5",
                  title: "Sincan warehouse",
                  meta: "Crew B · materials short",
                  tag: { en: "Blocked", tr: "Bloke" },
                  tone: "risk",
                },
              ],
            },
            {
              title: { en: "Done", tr: "Bitti" },
              cards: [
                {
                  id: "j6",
                  title: "Gölbaşı · unit 1",
                  meta: "Mon · signed off",
                  tag: { en: "Invoiced", tr: "Faturalandı" },
                  tone: "good",
                },
                {
                  id: "j7",
                  title: "Batıkent · service",
                  meta: "Mon · signed off",
                  tag: { en: "Invoiced", tr: "Faturalandı" },
                  tone: "good",
                },
              ],
            },
          ],
        },
      },
      {
        id: "field",
        label: { en: "Field", tr: "Saha" },
        icon: "pin",
        title: { en: "Crew A · today", tr: "Ekip A · bugün" },
        meta: { en: "Works offline", tr: "Çevrimdışı çalışır" },
        body: {
          kind: "mobile",
          screenTitle: { en: "Today", tr: "Bugün" },
          deviceLabel: { en: "Field app", tr: "Saha uygulaması" },
          rows: [
            {
              title: "Yenimahalle · block 2",
              meta: "08:00 — in progress",
              tag: { en: "Open", tr: "Açık" },
              tone: "accent",
            },
            { title: "Sincan warehouse", meta: "11:30 — materials short", tag: { en: "Blocked", tr: "Bloke" }, tone: "risk" },
            { title: "Çankaya · unit 4", meta: "14:00 — scheduled" },
            { title: "Photos to upload", meta: "6 waiting for signal", tag: { en: "Queued", tr: "Kuyrukta" }, tone: "warn" },
          ],
          aside: {
            title: { en: "Yenimahalle · block 2", tr: "Yenimahalle · blok 2" },
            fields: [
              { label: { en: "Crew", tr: "Ekip" }, value: "A · 3 people" },
              { label: { en: "Started", tr: "Başlangıç" }, value: "08:14" },
              { label: { en: "Materials used", tr: "Kullanılan malzeme" }, value: "4 lines" },
              { label: { en: "Photos", tr: "Fotoğraf" }, value: "6 local" },
              { label: { en: "Sync", tr: "Eşitleme" }, value: "Pending" },
            ],
          },
        },
      },
      {
        id: "stock",
        label: { en: "Materials", tr: "Malzeme" },
        icon: "layers",
        badge: "2",
        title: { en: "Materials", tr: "Malzeme" },
        meta: { en: "Consumed by job", tr: "İşe göre tüketim" },
        body: {
          kind: "records",
          columns: [
            { key: "item", label: { en: "Item", tr: "Kalem" } },
            { key: "job", label: { en: "Last job", tr: "Son iş" }, hideNarrow: true },
            { key: "state", label: { en: "State", tr: "Durum" } },
            { key: "left", label: { en: "Left", tr: "Kalan" }, align: "end" },
          ],
          rows: [
            {
              id: "s1",
              cells: {
                item: "Sealant, 310ml",
                job: "Sincan warehouse",
                state: { text: "Short", tone: "risk" },
                left: "3",
              },
              detail: {
                title: "Sealant, 310ml",
                eyebrow: { en: "Blocking a job", tr: "Bir işi bloke ediyor" },
                fields: [
                  { label: { en: "Needed today", tr: "Bugün gereken" }, value: "14" },
                  { label: { en: "In van", tr: "Araçta" }, value: "3" },
                  { label: { en: "Reorder", tr: "Sipariş" }, value: "Raised 08:40" },
                ],
                note: {
                  en: "The job went to Blocked on its own, because the crew logged the consumption and the stock fell under what the remaining work needs. Nobody had to notice.",
                  tr: "İş kendiliğinden Bloke durumuna geçti; çünkü ekip tüketimi girdi ve stok, kalan işin gerektirdiğinin altına düştü. Kimsenin fark etmesi gerekmedi.",
                },
              },
            },
            {
              id: "s2",
              cells: {
                item: "Anchor bolts M10",
                job: "Yenimahalle · block 2",
                state: { text: "Low", tone: "warn" },
                left: "48",
              },
              detail: {
                title: "Anchor bolts M10",
                eyebrow: { en: "Below reorder point", tr: "Sipariş noktasının altında" },
                fields: [
                  { label: { en: "Reorder at", tr: "Sipariş noktası" }, value: "60" },
                  { label: { en: "Weekly use", tr: "Haftalık tüketim" }, value: "~90" },
                ],
              },
            },
            {
              id: "s3",
              cells: {
                item: "Membrane roll",
                job: "Keçiören · roof",
                state: { text: "Healthy", tone: "good" },
                left: "22",
              },
              detail: {
                title: "Membrane roll",
                eyebrow: { en: "In stock", tr: "Stokta" },
                fields: [
                  { label: { en: "Reorder at", tr: "Sipariş noktası" }, value: "8" },
                  { label: { en: "Weekly use", tr: "Haftalık tüketim" }, value: "~5" },
                ],
              },
            },
          ],
        },
      },
      {
        id: "approvals",
        label: { en: "Approvals", tr: "Onaylar" },
        icon: "check",
        badge: "3",
        title: { en: "Waiting on a name", tr: "Bir isim bekliyor" },
        meta: { en: "Above threshold", tr: "Eşiğin üstünde" },
        body: {
          kind: "records",
          columns: [
            { key: "what", label: { en: "Request", tr: "Talep" } },
            { key: "by", label: { en: "Raised by", tr: "Açan" }, hideNarrow: true },
            { key: "state", label: { en: "State", tr: "Durum" } },
            { key: "amount", label: { en: "Amount", tr: "Tutar" }, align: "end" },
          ],
          rows: [
            {
              id: "ap1",
              cells: {
                what: "Emergency sealant order",
                by: "Crew B",
                state: { text: "Waiting", tone: "warn" },
                amount: "₺8,400",
              },
              detail: {
                title: "Emergency sealant order",
                eyebrow: { en: "Waiting on operations", tr: "Operasyon onayı bekliyor" },
                fields: [
                  { label: { en: "Threshold", tr: "Eşik" }, value: "₺5,000" },
                  { label: { en: "Approver", tr: "Onaylayan" }, value: "Operations lead" },
                  { label: { en: "Blocks", tr: "Bloke ettiği" }, value: "Sincan warehouse" },
                ],
              },
            },
            {
              id: "ap2",
              cells: {
                what: "Overtime, Thursday",
                by: "Crew C",
                state: { text: "Approved", tone: "good" },
                amount: "6 hours",
              },
              detail: {
                title: "Overtime, Thursday",
                eyebrow: { en: "Approved", tr: "Onaylandı" },
                fields: [
                  { label: { en: "Approved by", tr: "Onaylayan" }, value: "Operations lead" },
                  { label: { en: "At", tr: "Zaman" }, value: "Yesterday 17:20" },
                ],
                note: {
                  en: "The approval stays on the record rather than in a chat thread. Six months later the question is not who said yes but where it was written down.",
                  tr: "Onay bir sohbet dizisinde değil, kaydın üzerinde kalıyor. Altı ay sonraki soru kimin evet dediği değil, nereye yazıldığıdır.",
                },
              },
            },
            {
              id: "ap3",
              cells: {
                what: "Scope change · unit 4",
                by: "Crew B",
                state: { text: "Waiting", tone: "warn" },
                amount: "₺22,000",
              },
              detail: {
                title: "Scope change · unit 4",
                eyebrow: { en: "Needs customer sign-off", tr: "Müşteri onayı gerekiyor" },
                fields: [
                  { label: { en: "Sent to customer", tr: "Müşteriye gönderim" }, value: "Today 09:10" },
                  { label: { en: "Expires", tr: "Geçerlilik" }, value: "48 hours" },
                ],
              },
            },
          ],
        },
      },
    ],
  },

  /* ------------------------------------------------------------- 09 kütük */
  {
    slug: "kutuk",
    name: "Kütük",
    index: "09",
    sector: { en: "Knowledge platform", tr: "Bilgi platformu" },
    accent: "#5FA36B",
    icon: "book",
    statement: {
      en: "An answer without a source is a rumour.",
      tr: "Kaynağı olmayan cevap, söylentidir.",
    },
    premise: {
      en: [
        "Company knowledge is not missing. It is in a contract folder, a handbook nobody opened, and four people's heads, and none of it is findable at the moment someone needs it.",
        "This concept indexes what a company already has and answers from it — with the passage, the document and the permission that allowed it, every time. If the source is not there, the answer is not given.",
      ],
      tr: [
        "Şirket bilgisi eksik değildir. Bir sözleşme klasöründe, kimsenin açmadığı bir el kitabında ve dört kişinin kafasındadır; ve tam ihtiyaç duyulduğu anda hiçbiri bulunabilir değildir.",
        "Bu konsept, şirketin zaten sahip olduğunu indeksler ve oradan cevap verir — her seferinde pasajı, belgeyi ve buna izin veren yetkiyle birlikte. Kaynak yoksa cevap da verilmez.",
      ],
    },
    proves: {
      en: [
        "Document processing across mixed formats",
        "Semantic search with permission enforced at retrieval",
        "Generated answers that cite the passage they came from",
        "Team spaces, ownership and index freshness",
      ],
      tr: [
        "Karışık formatlar üzerinde belge işleme",
        "Yetkinin getirme anında uygulandığı anlamsal arama",
        "Geldiği pasajı kaynak gösteren üretilmiş cevaplar",
        "Ekip alanları, sahiplik ve indeks tazeliği",
      ],
    },
    system: [
      {
        label: { en: "Processing", tr: "İşleme" },
        detail: {
          en: "PDFs, documents and pages are parsed, chunked and embedded, with the original always retrievable.",
          tr: "PDF, belge ve sayfalar ayrıştırılır, parçalanır ve gömülür; aslına her zaman ulaşılabilir.",
        },
      },
      {
        label: { en: "Permissions", tr: "Yetkiler" },
        detail: {
          en: "A space grants access, and retrieval filters on it before the model sees anything.",
          tr: "Erişimi alan verir; getirme, model bir şey görmeden önce buna göre süzer.",
        },
      },
      {
        label: { en: "Citation", tr: "Kaynak" },
        detail: {
          en: "Every sentence in an answer points at the passage that produced it, or it is not written.",
          tr: "Cevaptaki her cümle onu üreten pasajı gösterir; göstermiyorsa yazılmaz.",
        },
      },
    ],
    domains: ["ai", "data", "systems"],
    views: [
      {
        id: "ask",
        label: { en: "Ask", tr: "Sor" },
        icon: "search",
        title: { en: "Ask the company", tr: "Şirkete sor" },
        meta: { en: "Answers carry sources", tr: "Cevaplar kaynak taşır" },
        body: {
          kind: "search",
          placeholder: { en: "Ask about a policy, a contract or a process", tr: "Politika, sözleşme veya süreç sor" },
          queries: [
            {
              id: "q1",
              query: {
                en: "How much notice do we owe on the Kayra Yapı contract?",
                tr: "Kayra Yapı sözleşmesinde ne kadar ihbar süresi var?",
              },
              answer: {
                en: "Sixty days before the renewal date, in writing. The agreement renews automatically for twelve months if no notice is given, and the current term ends on 2 December — so the window closes on 3 October.",
                tr: "Yenileme tarihinden altmış gün önce, yazılı olarak. Bildirim yapılmazsa sözleşme on iki ay için otomatik yenileniyor; mevcut dönem 2 Aralık'ta bitiyor, yani pencere 3 Ekim'de kapanıyor.",
              },
              sources: [
                { title: "Kayra Yapı — MSA v2, clause 11.2", meta: { en: "Legal space · signed", tr: "Hukuk alanı · imzalı" } },
                { title: "Contract register", meta: { en: "Operations space", tr: "Operasyon alanı" } },
              ],
            },
            {
              id: "q2",
              query: {
                en: "What is our policy on returning opened hygiene items?",
                tr: "Açılmış hijyen ürünlerinin iadesinde politikamız ne?",
              },
              answer: {
                en: "Opened hygiene items are not covered by the standard return right. The support team may grant an exception where the listing was misleading, and that decision has to be recorded against the order.",
                tr: "Açılmış hijyen ürünleri standart iade hakkının kapsamında değil. Ürün sayfası yanıltıcıysa destek ekibi istisna tanıyabiliyor ve bu karar siparişin üzerine kaydedilmek zorunda.",
              },
              sources: [
                { title: "Returns policy §5", meta: { en: "Operations space · v4", tr: "Operasyon alanı · v4" } },
                { title: "Exception log", meta: { en: "Support space", tr: "Destek alanı" } },
              ],
            },
            {
              id: "q3",
              query: {
                en: "Which suppliers are allowed to add freight after the order?",
                tr: "Hangi tedarikçiler sipariş sonrası navlun ekleyebiliyor?",
              },
              answer: {
                en: "Four suppliers, all under an 8% ceiling written into their framework terms. Anything above that ceiling has to be approved by procurement before the invoice is posted.",
                tr: "Dört tedarikçi; hepsi çerçeve sözleşmelerine yazılmış %8 tavanının altında. Bu tavanın üstündeki her şey, fatura işlenmeden önce satın alma tarafından onaylanmak zorunda.",
              },
              sources: [
                { title: "Framework terms — freight annex", meta: { en: "Procurement space", tr: "Satın alma alanı" } },
              ],
            },
          ],
        },
      },
      {
        id: "spaces",
        label: { en: "Spaces", tr: "Alanlar" },
        icon: "folder",
        title: { en: "Team spaces", tr: "Ekip alanları" },
        meta: { en: "Access is per space", tr: "Erişim alan bazında" },
        body: {
          kind: "records",
          columns: [
            { key: "space", label: { en: "Space", tr: "Alan" } },
            { key: "owner", label: { en: "Owner", tr: "Sahip" }, hideNarrow: true },
            { key: "state", label: { en: "Index", tr: "İndeks" } },
            { key: "docs", label: { en: "Documents", tr: "Belge" }, align: "end" },
          ],
          rows: [
            {
              id: "sp1",
              cells: {
                space: "Legal",
                owner: "Legal lead",
                state: { text: "Fresh", tone: "good" },
                docs: "214",
              },
              detail: {
                title: "Legal",
                eyebrow: { en: "Restricted", tr: "Kısıtlı" },
                fields: [
                  { label: { en: "Members", tr: "Üye" }, value: "4" },
                  { label: { en: "Last indexed", tr: "Son indeks" }, value: "Today, 06:00" },
                  { label: { en: "Chunks", tr: "Parça" }, value: "8,410" },
                ],
                note: {
                  en: "A question from outside this space does not reach these documents at all — the filter is applied before retrieval, not after generation.",
                  tr: "Bu alanın dışından gelen bir soru bu belgelere hiç ulaşmıyor — süzgeç, üretimden sonra değil, getirmeden önce uygulanıyor.",
                },
              },
            },
            {
              id: "sp2",
              cells: {
                space: "Operations",
                owner: "Operations lead",
                state: { text: "Fresh", tone: "good" },
                docs: "96",
              },
              detail: {
                title: "Operations",
                eyebrow: { en: "All staff", tr: "Tüm çalışanlar" },
                fields: [
                  { label: { en: "Members", tr: "Üye" }, value: "31" },
                  { label: { en: "Last indexed", tr: "Son indeks" }, value: "Today, 06:00" },
                ],
              },
            },
            {
              id: "sp3",
              cells: {
                space: "Procurement",
                owner: "Procurement",
                state: { text: "Reindexing", tone: "warn" },
                docs: "148",
              },
              detail: {
                title: "Procurement",
                eyebrow: { en: "Reindexing", tr: "Yeniden indeksleniyor" },
                fields: [
                  { label: { en: "Progress", tr: "İlerleme" }, value: "62%" },
                  { label: { en: "Reason", tr: "Sebep" }, value: "New framework terms" },
                ],
              },
            },
          ],
        },
      },
      {
        id: "processing",
        label: { en: "Processing", tr: "İşleme" },
        icon: "layers",
        badge: "2",
        title: { en: "Document processing", tr: "Belge işleme" },
        meta: { en: "Ingestion queue", tr: "İşleme kuyruğu" },
        body: {
          kind: "records",
          columns: [
            { key: "doc", label: { en: "Document", tr: "Belge" } },
            { key: "kind", label: { en: "Format", tr: "Format" }, hideNarrow: true },
            { key: "state", label: { en: "Stage", tr: "Aşama" } },
            { key: "chunks", label: { en: "Chunks", tr: "Parça" }, align: "end" },
          ],
          rows: [
            {
              id: "dp1",
              cells: {
                doc: "Framework terms 2026",
                kind: "PDF · scanned",
                state: { text: "Embedding", tone: "accent" },
                chunks: "412",
              },
              detail: {
                title: "Framework terms 2026",
                eyebrow: { en: "Scanned original", tr: "Taranmış asıl" },
                fields: [
                  { label: { en: "Pages", tr: "Sayfa" }, value: "78" },
                  { label: { en: "Text layer", tr: "Metin katmanı" }, value: "Recovered" },
                  { label: { en: "Tables", tr: "Tablo" }, value: "11 preserved" },
                ],
                note: {
                  en: "A scanned contract with tables is the realistic case, not a clean text file. Losing the table structure loses the answer that lives in it.",
                  tr: "Gerçekçi durum, temiz bir metin dosyası değil, tablolu taranmış bir sözleşmedir. Tablo yapısını kaybetmek, içindeki cevabı kaybetmektir.",
                },
              },
            },
            {
              id: "dp2",
              cells: {
                doc: "Returns policy v4",
                kind: "Markdown",
                state: { text: "Indexed", tone: "good" },
                chunks: "38",
              },
              detail: {
                title: "Returns policy v4",
                eyebrow: { en: "Indexed", tr: "İndekslendi" },
                fields: [
                  { label: { en: "Supersedes", tr: "Yerine geçtiği" }, value: "v3" },
                  { label: { en: "Cited", tr: "Kaynak gösterildi" }, value: "740 times" },
                ],
              },
            },
            {
              id: "dp3",
              cells: {
                doc: "Board minutes, June",
                kind: "DOCX",
                state: { text: "Held", tone: "risk" },
                chunks: "—",
              },
              detail: {
                title: "Board minutes, June",
                eyebrow: { en: "Held for review", tr: "İnceleme için tutuldu" },
                fields: [
                  { label: { en: "Reason", tr: "Sebep" }, value: "No space assigned" },
                  { label: { en: "Default", tr: "Varsayılan" }, value: "Not indexed" },
                ],
                note: {
                  en: "The default for an unclassified document is to stay out of the index. Anything else means a document becomes readable by accident.",
                  tr: "Sınıflandırılmamış bir belgenin varsayılanı indeksin dışında kalmaktır. Aksi hâlde bir belge kazayla okunabilir hâle gelir.",
                },
              },
            },
          ],
        },
      },
    ],
  },

  /* -------------------------------------------------------------- 10 eşik */
  {
    slug: "esik",
    name: "Eşik",
    index: "10",
    sector: { en: "Client portal", tr: "Müşteri portalı" },
    accent: "#8894A8",
    icon: "lock",
    statement: {
      en: "The customer should not have to ask you where things stand.",
      tr: "Müşteri, işin nerede olduğunu sormak zorunda kalmamalı.",
    },
    premise: {
      en: [
        "Every business with ongoing customers runs a second, invisible job: telling people what is happening. It is done by mail, by phone, by forwarding a document somebody already sent, and it consumes more time than anyone counts.",
        "This concept is the customer's own window onto the same records the business already keeps. Nothing is duplicated and nothing is retyped — the portal reads the system, and the questions stop arriving.",
      ],
      tr: [
        "Devam eden müşterisi olan her işletme, ikinci ve görünmez bir işi yürütür: insanlara ne olduğunu anlatmak. Bu iş e-postayla, telefonla, birinin zaten gönderdiği bir belgeyi yeniden yollayarak yapılır ve kimsenin hesapladığından fazla zaman yer.",
        "Bu konsept, müşterinin işletmenin zaten tuttuğu kayıtlara açılan kendi penceresi. Hiçbir şey kopyalanmıyor, hiçbir şey yeniden yazılmıyor — portal sistemi okuyor ve sorular gelmeyi bırakıyor.",
      ],
    },
    proves: {
      en: [
        "Authentication and scoped access for external users",
        "A customer-facing view over internal records without duplication",
        "Documents, invoices and payment state in one place",
        "Threaded messaging tied to the record it concerns",
      ],
      tr: [
        "Dış kullanıcılar için kimlik doğrulama ve kapsamlı erişim",
        "İç kayıtlar üzerinde, kopyalamadan kurulan müşteriye dönük görünüm",
        "Belge, fatura ve ödeme durumunun tek yerde olması",
        "İlgili olduğu kayda bağlı mesajlaşma",
      ],
    },
    system: [
      {
        label: { en: "Identity", tr: "Kimlik" },
        detail: {
          en: "External accounts are a separate identity space with their own scopes, never staff accounts with fewer menus.",
          tr: "Dış hesaplar kendi kapsamları olan ayrı bir kimlik alanı; menüsü kısılmış personel hesabı değil.",
        },
      },
      {
        label: { en: "Projection", tr: "Yansıma" },
        detail: {
          en: "The portal reads the operational records through a view that decides what a customer may see.",
          tr: "Portal, operasyon kayıtlarını müşterinin ne görebileceğine karar veren bir görünüm üzerinden okur.",
        },
      },
      {
        label: { en: "Messages", tr: "Mesajlar" },
        detail: {
          en: "A message belongs to a project or an invoice, so the context never has to be explained twice.",
          tr: "Bir mesaj bir projeye veya faturaya aittir; böylece bağlam iki kez anlatılmaz.",
        },
      },
    ],
    domains: ["systems", "products", "integrations"],
    views: [
      {
        id: "projects",
        label: { en: "Projects", tr: "Projeler" },
        icon: "folder",
        title: { en: "Your projects", tr: "Projeleriniz" },
        meta: { en: "Customer view", tr: "Müşteri görünümü" },
        body: {
          kind: "records",
          columns: [
            { key: "project", label: { en: "Project", tr: "Proje" } },
            { key: "stage", label: { en: "Stage", tr: "Aşama" }, hideNarrow: true },
            { key: "state", label: { en: "State", tr: "Durum" } },
            { key: "due", label: { en: "Due", tr: "Teslim" }, align: "end" },
          ],
          rows: [
            {
              id: "pr1",
              cells: {
                project: "Warehouse fit-out",
                stage: "Installation",
                state: { text: "On track", tone: "good" },
                due: "12 Oct",
              },
              detail: {
                title: "Warehouse fit-out",
                eyebrow: { en: "Installation", tr: "Kurulum" },
                fields: [
                  { label: { en: "Started", tr: "Başlangıç" }, value: "4 Aug" },
                  { label: { en: "Completed", tr: "Tamamlanan" }, value: "6 of 9 stages" },
                  { label: { en: "Next milestone", tr: "Sonraki kilometre taşı" }, value: "26 Sep" },
                  { label: { en: "Documents", tr: "Belge" }, value: "11" },
                ],
                note: {
                  en: "This is the same job record the operations team works from, filtered. Nothing was re-entered for the customer to look at, which is why it cannot be out of date.",
                  tr: "Bu, operasyon ekibinin üzerinde çalıştığı iş kaydının süzülmüş hâli. Müşteri baksın diye hiçbir şey yeniden girilmedi; güncelliğini yitirememesinin sebebi de bu.",
                },
              },
            },
            {
              id: "pr2",
              cells: {
                project: "Office refurbishment",
                stage: "Design",
                state: { text: "Waiting on you", tone: "warn" },
                due: "—",
              },
              detail: {
                title: "Office refurbishment",
                eyebrow: { en: "Awaiting your approval", tr: "Onayınız bekleniyor" },
                fields: [
                  { label: { en: "Sent", tr: "Gönderim" }, value: "2 days ago" },
                  { label: { en: "Document", tr: "Belge" }, value: "Scope change v2" },
                  { label: { en: "Expires", tr: "Geçerlilik" }, value: "In 46 hours" },
                ],
              },
            },
            {
              id: "pr3",
              cells: {
                project: "Depot maintenance",
                stage: "Closed",
                state: { text: "Complete", tone: "idle" },
                due: "18 Jun",
              },
              detail: {
                title: "Depot maintenance",
                eyebrow: { en: "Closed", tr: "Kapandı" },
                fields: [
                  { label: { en: "Completed", tr: "Tamamlanma" }, value: "18 Jun" },
                  { label: { en: "Sign-off", tr: "Onay" }, value: "Signed" },
                  { label: { en: "Warranty", tr: "Garanti" }, value: "Until 18 Jun 2028" },
                ],
              },
            },
          ],
        },
      },
      {
        id: "invoices",
        label: { en: "Invoices", tr: "Faturalar" },
        icon: "card",
        badge: "1",
        title: { en: "Invoices", tr: "Faturalar" },
        meta: { en: "Pay from here", tr: "Buradan ödeyin" },
        body: {
          kind: "records",
          columns: [
            { key: "no", label: { en: "Invoice", tr: "Fatura" } },
            { key: "project", label: { en: "Project", tr: "Proje" }, hideNarrow: true },
            { key: "state", label: { en: "State", tr: "Durum" } },
            { key: "amount", label: { en: "Amount", tr: "Tutar" }, align: "end" },
          ],
          rows: [
            {
              id: "ci1",
              cells: {
                no: "ES-4410",
                project: "Warehouse fit-out",
                state: { text: "Due in 6 days", tone: "warn" },
                amount: "₺148,000",
              },
              detail: {
                title: "ES-4410",
                eyebrow: { en: "Stage 6 payment", tr: "6. aşama ödemesi" },
                fields: [
                  { label: { en: "Issued", tr: "Kesim" }, value: "1 Sep" },
                  { label: { en: "Due", tr: "Vade" }, value: "10 Sep" },
                  { label: { en: "Method", tr: "Yöntem" }, value: "Card or transfer" },
                  { label: { en: "Receipt", tr: "Makbuz" }, value: "Automatic" },
                ],
              },
            },
            {
              id: "ci2",
              cells: {
                no: "ES-4361",
                project: "Warehouse fit-out",
                state: { text: "Paid", tone: "good" },
                amount: "₺210,000",
              },
              detail: {
                title: "ES-4361",
                eyebrow: { en: "Paid", tr: "Ödendi" },
                fields: [
                  { label: { en: "Paid", tr: "Ödeme" }, value: "12 Aug" },
                  { label: { en: "Method", tr: "Yöntem" }, value: "Transfer" },
                ],
              },
            },
            {
              id: "ci3",
              cells: {
                no: "ES-4180",
                project: "Depot maintenance",
                state: { text: "Paid", tone: "good" },
                amount: "₺64,500",
              },
              detail: {
                title: "ES-4180",
                eyebrow: { en: "Paid", tr: "Ödendi" },
                fields: [
                  { label: { en: "Paid", tr: "Ödeme" }, value: "20 Jun" },
                  { label: { en: "Method", tr: "Yöntem" }, value: "Card" },
                ],
              },
            },
          ],
        },
      },
      {
        id: "messages",
        label: { en: "Messages", tr: "Mesajlar" },
        icon: "message",
        badge: "2",
        title: { en: "Messages", tr: "Mesajlar" },
        meta: { en: "Attached to a project", tr: "Bir projeye bağlı" },
        body: {
          kind: "thread",
          composer: { en: "Reply about this project", tr: "Bu proje hakkında yanıtla" },
          conversations: [
            {
              id: "cm1",
              subject: "Scope change v2 — office refurbishment",
              who: "Project lead",
              meta: { en: "Waiting on you", tr: "Sizi bekliyor" },
              tone: "warn",
              messages: [
                {
                  from: "agent",
                  at: "Mon 09:10",
                  text: {
                    en: "The revised scope is attached. The change is the mezzanine lighting, which adds ₺22,000 and four days. Approving here signs it — nothing else is needed.",
                    tr: "Revize kapsam ekte. Değişiklik asma kat aydınlatması; ₺22.000 ve dört gün ekliyor. Buradan onaylamanız imza yerine geçiyor, başka bir şey gerekmiyor.",
                  },
                },
                {
                  from: "customer",
                  at: "Mon 11:40",
                  text: {
                    en: "Can we see what it does to the completion date before we approve?",
                    tr: "Onaylamadan önce teslim tarihine etkisini görebilir miyiz?",
                  },
                },
                {
                  from: "agent",
                  at: "Mon 11:52",
                  text: {
                    en: "It moves completion from 12 to 16 October. The schedule on your project page is already showing both, so you can compare them side by side.",
                    tr: "Teslimi 12 Ekim'den 16 Ekim'e alıyor. Proje sayfanızdaki program ikisini de gösteriyor, yan yana karşılaştırabilirsiniz.",
                  },
                },
              ],
              context: [
                { label: { en: "Project", tr: "Proje" }, value: "Office refurbishment" },
                { label: { en: "Document", tr: "Belge" }, value: "Scope change v2" },
                { label: { en: "Impact", tr: "Etki" }, value: "+₺22,000 · +4 days" },
                { label: { en: "Expires", tr: "Geçerlilik" }, value: "46 hours" },
              ],
            },
            {
              id: "cm2",
              subject: "Delivery access — Tuesday",
              who: "Site manager",
              meta: { en: "Resolved", tr: "Çözüldü" },
              tone: "good",
              messages: [
                {
                  from: "agent",
                  at: "Last week",
                  text: {
                    en: "We need the loading bay from 07:00 on Tuesday. Is that possible, or should we plan around it?",
                    tr: "Salı 07:00'den itibaren yükleme rampasına ihtiyacımız var. Mümkün mü, yoksa ona göre mi planlayalım?",
                  },
                },
                {
                  from: "customer",
                  at: "Last week",
                  text: { en: "07:00 is fine. Security has been told.", tr: "07:00 uygun. Güvenliğe bilgi verildi." },
                },
              ],
              context: [
                { label: { en: "Project", tr: "Proje" }, value: "Warehouse fit-out" },
                { label: { en: "Closed", tr: "Kapanış" }, value: "Same day" },
              ],
            },
          ],
        },
      },
    ],
  },
];
