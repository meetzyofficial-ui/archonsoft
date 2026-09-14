import type { LabBase } from "@/data/labs/types";

/**
 * Concepts 01–05.
 *
 * The names are Archon's own and deliberately Turkish: a divan is the council
 * a state is run from, a kervan is a trade caravan, a tezgah is the counter a
 * shop is worked from. A studio in Ankara naming its concept products after
 * the machinery of Ottoman commerce and administration is a more honest piece
 * of identity than another invented English SaaS word, and it makes the set
 * legible as one family.
 *
 * Nothing here is client work. Every record is sample data belonging to the
 * fictional company inside the prototype.
 */

export const CONCEPTS_A: LabBase[] = [
  /* ------------------------------------------------------------ 01 divan */
  {
    slug: "divan",
    name: "Divan",
    index: "01",
    sector: { en: "Business operating system", tr: "İş işletim sistemi" },
    accent: "#5B8CFF",
    icon: "grid",
    statement: {
      en: "One system for the business behind the business.",
      tr: "İşin arkasındaki iş için tek bir sistem.",
    },
    premise: {
      en: [
        "A growing company does not usually lack software. It has a CRM nobody updates, a spreadsheet the finance side actually trusts, a chat thread where the real decisions happen, and no single place where the state of the company is true.",
        "This concept is the opposite arrangement: customers, pipeline, work, invoicing and permissions in one model, so that moving a deal forward and the invoice that follows it are the same record rather than two systems that disagree by Friday.",
      ],
      tr: [
        "Büyüyen bir şirketin yazılımı genelde eksik değildir. Kimsenin güncellemediği bir CRM, finansın gerçekten güvendiği bir tablo, asıl kararların alındığı bir sohbet dizisi vardır — ve şirketin durumunun doğru olduğu tek bir yer yoktur.",
        "Bu konsept bunun tersi: müşteri, satış hattı, iş, faturalama ve yetkiler tek bir modelde. Bir fırsatı ilerletmekle onu izleyen fatura, cuma günü birbiriyle çelişen iki sistem değil, aynı kayıt oluyor.",
      ],
    },
    proves: {
      en: [
        "Relational data modelling across accounts, deals, tasks and invoices",
        "Role-based permissions and an auditable activity log",
        "Aggregation and reporting over live operational data",
        "An admin dense enough for daily use rather than a demo dashboard",
      ],
      tr: [
        "Hesap, fırsat, görev ve fatura arasında ilişkisel veri modeli",
        "Rol bazlı yetkilendirme ve denetlenebilir hareket kaydı",
        "Canlı operasyon verisi üzerinde toplama ve raporlama",
        "Gösteri panosu değil, günlük kullanıma dayanacak yoğunlukta bir yönetim",
      ],
    },
    system: [
      {
        label: { en: "Data model", tr: "Veri modeli" },
        detail: {
          en: "Accounts, contacts, deals, tasks, invoices and users, with every event written to one activity table.",
          tr: "Hesaplar, kişiler, fırsatlar, görevler, faturalar ve kullanıcılar; her hareket tek bir aktivite tablosuna yazılır.",
        },
      },
      {
        label: { en: "Permissions", tr: "Yetkiler" },
        detail: {
          en: "Roles resolve to row-level access, so a sales owner and a finance lead open the same page and see different amounts of it.",
          tr: "Roller satır düzeyinde erişime çözülür; satış sorumlusu ile finans sorumlusu aynı sayfayı açar, farklı kadarını görür.",
        },
      },
      {
        label: { en: "Reporting", tr: "Raporlama" },
        detail: {
          en: "Aggregates are derived from the operational tables rather than kept in a second place that drifts.",
          tr: "Toplamlar, zamanla sapan ikinci bir yerde tutulmaz; operasyon tablolarından türetilir.",
        },
      },
      {
        label: { en: "Notifications", tr: "Bildirimler" },
        detail: {
          en: "State changes fan out to the people the change belongs to, in app and by mail.",
          tr: "Durum değişiklikleri, değişikliğin ilgilendirdiği kişilere uygulama içinden ve e-postayla dağıtılır.",
        },
      },
    ],
    domains: ["systems", "data", "integrations"],
    views: [
      {
        id: "overview",
        label: { en: "Overview", tr: "Genel" },
        icon: "grid",
        title: { en: "Company overview", tr: "Şirket görünümü" },
        meta: { en: "All teams", tr: "Tüm ekipler" },
        body: {
          kind: "dashboard",
          stats: [
            {
              label: { en: "Open deals", tr: "Açık fırsat" },
              value: "34",
              delta: "+6",
              tone: "good",
            },
            {
              label: { en: "Pipeline value", tr: "Hat değeri" },
              value: "₺2.41M",
              delta: "+11.2%",
              tone: "good",
            },
            { label: { en: "Tasks due", tr: "Vadesi gelen görev" }, value: "18", delta: "7 today" },
            {
              label: { en: "Overdue invoices", tr: "Geciken fatura" },
              value: "3",
              delta: "₺184K",
              tone: "risk",
            },
          ],
          chart: {
            type: "area",
            values: [42, 48, 45, 58, 63, 59, 71, 78, 74, 86, 92, 104],
            labels: ["Jan", "Apr", "Jul", "Oct"],
            peak: "₺2.41M",
          },
          ranges: [
            { id: "30d", label: "30d", values: [71, 68, 74, 79, 76, 84, 88, 91] },
            {
              id: "12m",
              label: "12m",
              values: [42, 48, 45, 58, 63, 59, 71, 78, 74, 86, 92, 104],
            },
            { id: "all", label: "All", values: [12, 19, 26, 31, 44, 42, 58, 71, 74, 92, 104] },
          ],
          breakdown: [
            { label: { en: "Won this quarter", tr: "Bu çeyrek kazanılan" }, value: 640000 },
            { label: { en: "In negotiation", tr: "Görüşmede" }, value: 910000 },
            { label: { en: "Proposal sent", tr: "Teklif gönderildi" }, value: 520000 },
            { label: { en: "Qualifying", tr: "Nitelendirme" }, value: 340000 },
          ],
          breakdownUnit: " ₺",
          timeline: [
            {
              at: "09:42",
              actor: "B. Aydın",
              text: { en: "moved Kayra Yapı to Negotiation", tr: "Kayra Yapı'yı Görüşme aşamasına aldı" },
            },
            {
              at: "08:15",
              actor: "System",
              text: {
                en: "flagged invoice INV-2287 as 14 days overdue",
                tr: "INV-2287 faturasını 14 gün gecikmiş olarak işaretledi",
              },
            },
            {
              at: "Yesterday",
              actor: "S. Toprak",
              text: { en: "closed Nar Tekstil — ₺310,000", tr: "Nar Tekstil'i kazandı — ₺310.000" },
            },
          ],
        },
      },
      {
        id: "pipeline",
        label: { en: "Pipeline", tr: "Satış hattı" },
        icon: "pipeline",
        badge: "34",
        title: { en: "Sales pipeline", tr: "Satış hattı" },
        meta: { en: "Q3", tr: "3. çeyrek" },
        body: {
          kind: "board",
          columns: [
            {
              title: { en: "Qualifying", tr: "Nitelendirme" },
              cards: [
                { id: "d1", title: "Selen Gıda", meta: "₺140,000 · B. Aydın" },
                { id: "d2", title: "Tuna Enerji", meta: "₺200,000 · S. Toprak" },
              ],
            },
            {
              title: { en: "Proposal", tr: "Teklif" },
              cards: [
                {
                  id: "d3",
                  title: "Bora Lojistik",
                  meta: "₺275,000 · B. Aydın",
                  tag: { en: "Sent", tr: "Gönderildi" },
                  tone: "accent",
                },
                { id: "d4", title: "Mira Ajans", meta: "₺245,000 · E. Kılıç" },
              ],
            },
            {
              title: { en: "Negotiation", tr: "Görüşme" },
              cards: [
                {
                  id: "d5",
                  title: "Kayra Yapı",
                  meta: "₺520,000 · S. Toprak",
                  tag: { en: "Legal", tr: "Hukuk" },
                  tone: "warn",
                },
                { id: "d6", title: "Efe Mühendislik", meta: "₺390,000 · E. Kılıç" },
              ],
            },
            {
              title: { en: "Won", tr: "Kazanıldı" },
              cards: [
                {
                  id: "d7",
                  title: "Nar Tekstil",
                  meta: "₺310,000 · S. Toprak",
                  tag: { en: "Invoiced", tr: "Faturalandı" },
                  tone: "good",
                },
                {
                  id: "d8",
                  title: "Deniz Otomotiv",
                  meta: "₺330,000 · B. Aydın",
                  tag: { en: "Invoiced", tr: "Faturalandı" },
                  tone: "good",
                },
              ],
            },
          ],
        },
      },
      {
        id: "customers",
        label: { en: "Customers", tr: "Müşteriler" },
        icon: "users",
        title: { en: "Accounts", tr: "Hesaplar" },
        meta: { en: "128 records", tr: "128 kayıt" },
        body: {
          kind: "records",
          filters: [
            { id: "all", label: { en: "All", tr: "Tümü" } },
            { id: "active", label: { en: "Active", tr: "Aktif" } },
            { id: "risk", label: { en: "At risk", tr: "Riskli" } },
          ],
          columns: [
            { key: "name", label: { en: "Account", tr: "Hesap" } },
            { key: "owner", label: { en: "Owner", tr: "Sorumlu" }, hideNarrow: true },
            { key: "stage", label: { en: "Stage", tr: "Aşama" } },
            { key: "value", label: { en: "Value", tr: "Değer" }, align: "end" },
          ],
          rows: [
            {
              id: "a1",
              cells: {
                name: "Kayra Yapı",
                owner: "S. Toprak",
                stage: { text: "Negotiation", tone: "warn" },
                value: "₺520,000",
              },
              detail: {
                title: "Kayra Yapı",
                eyebrow: { en: "Construction · Ankara", tr: "İnşaat · Ankara" },
                fields: [
                  { label: { en: "Owner", tr: "Sorumlu" }, value: "S. Toprak" },
                  { label: { en: "Open deals", tr: "Açık fırsat" }, value: "2" },
                  { label: { en: "Lifetime", tr: "Toplam" }, value: "₺1,240,000" },
                  { label: { en: "Last activity", tr: "Son hareket" }, value: "Today, 09:42" },
                  { label: { en: "Payment terms", tr: "Ödeme vadesi" }, value: "Net 45" },
                ],
                note: {
                  en: "Contract is with legal. Renewal sits behind the same account, so the invoice schedule updates the moment the stage does.",
                  tr: "Sözleşme hukukta. Yenileme aynı hesabın altında olduğu için, aşama değiştiği anda fatura planı da güncelleniyor.",
                },
              },
            },
            {
              id: "a2",
              cells: {
                name: "Nar Tekstil",
                owner: "S. Toprak",
                stage: { text: "Won", tone: "good" },
                value: "₺310,000",
              },
              detail: {
                title: "Nar Tekstil",
                eyebrow: { en: "Textiles · İzmir", tr: "Tekstil · İzmir" },
                fields: [
                  { label: { en: "Owner", tr: "Sorumlu" }, value: "S. Toprak" },
                  { label: { en: "Open deals", tr: "Açık fırsat" }, value: "0" },
                  { label: { en: "Lifetime", tr: "Toplam" }, value: "₺310,000" },
                  { label: { en: "Last activity", tr: "Son hareket" }, value: "Yesterday" },
                  { label: { en: "Payment terms", tr: "Ödeme vadesi" }, value: "Net 30" },
                ],
              },
            },
            {
              id: "a3",
              cells: {
                name: "Bora Lojistik",
                owner: "B. Aydın",
                stage: { text: "Proposal", tone: "accent" },
                value: "₺275,000",
              },
              detail: {
                title: "Bora Lojistik",
                eyebrow: { en: "Logistics · Mersin", tr: "Lojistik · Mersin" },
                fields: [
                  { label: { en: "Owner", tr: "Sorumlu" }, value: "B. Aydın" },
                  { label: { en: "Open deals", tr: "Açık fırsat" }, value: "1" },
                  { label: { en: "Lifetime", tr: "Toplam" }, value: "₺95,000" },
                  { label: { en: "Last activity", tr: "Son hareket" }, value: "2 days ago" },
                  { label: { en: "Payment terms", tr: "Ödeme vadesi" }, value: "Net 30" },
                ],
              },
            },
            {
              id: "a4",
              cells: {
                name: "Efe Mühendislik",
                owner: "E. Kılıç",
                stage: { text: "Negotiation", tone: "warn" },
                value: "₺390,000",
              },
              detail: {
                title: "Efe Mühendislik",
                eyebrow: { en: "Engineering · Bursa", tr: "Mühendislik · Bursa" },
                fields: [
                  { label: { en: "Owner", tr: "Sorumlu" }, value: "E. Kılıç" },
                  { label: { en: "Open deals", tr: "Açık fırsat" }, value: "1" },
                  { label: { en: "Lifetime", tr: "Toplam" }, value: "₺612,000" },
                  { label: { en: "Last activity", tr: "Son hareket" }, value: "4 days ago" },
                  { label: { en: "Payment terms", tr: "Ödeme vadesi" }, value: "Net 60" },
                ],
              },
            },
            {
              id: "a5",
              cells: {
                name: "Selen Gıda",
                owner: "B. Aydın",
                stage: { text: "Qualifying", tone: "idle" },
                value: "₺140,000",
              },
              detail: {
                title: "Selen Gıda",
                eyebrow: { en: "Food production · Konya", tr: "Gıda üretimi · Konya" },
                fields: [
                  { label: { en: "Owner", tr: "Sorumlu" }, value: "B. Aydın" },
                  { label: { en: "Open deals", tr: "Açık fırsat" }, value: "1" },
                  { label: { en: "Lifetime", tr: "Toplam" }, value: "—" },
                  { label: { en: "Last activity", tr: "Son hareket" }, value: "Today, 11:05" },
                  { label: { en: "Payment terms", tr: "Ödeme vadesi" }, value: "—" },
                ],
              },
            },
          ],
        },
      },
      {
        id: "invoices",
        label: { en: "Invoices", tr: "Faturalar" },
        icon: "file",
        badge: "3",
        title: { en: "Invoices", tr: "Faturalar" },
        meta: { en: "Receivables", tr: "Alacaklar" },
        body: {
          kind: "records",
          filters: [
            { id: "all", label: { en: "All", tr: "Tümü" } },
            { id: "open", label: { en: "Open", tr: "Açık" } },
            { id: "overdue", label: { en: "Overdue", tr: "Geciken" } },
          ],
          columns: [
            { key: "no", label: { en: "Number", tr: "Numara" } },
            { key: "account", label: { en: "Account", tr: "Hesap" }, hideNarrow: true },
            { key: "status", label: { en: "Status", tr: "Durum" } },
            { key: "amount", label: { en: "Amount", tr: "Tutar" }, align: "end" },
          ],
          rows: [
            {
              id: "i1",
              cells: {
                no: "INV-2287",
                account: "Bora Lojistik",
                status: { text: "14 days overdue", tone: "risk" },
                amount: "₺96,400",
              },
              detail: {
                title: "INV-2287",
                eyebrow: { en: "Overdue", tr: "Gecikmiş" },
                fields: [
                  { label: { en: "Account", tr: "Hesap" }, value: "Bora Lojistik" },
                  { label: { en: "Issued", tr: "Kesim" }, value: "12 June" },
                  { label: { en: "Due", tr: "Vade" }, value: "12 July" },
                  { label: { en: "Reminders", tr: "Hatırlatma" }, value: "2 sent" },
                ],
                note: {
                  en: "The third reminder is queued automatically at 21 days, and the account is flagged on the pipeline board until it clears.",
                  tr: "Üçüncü hatırlatma 21. günde otomatik kuyruğa alınıyor; ödenene kadar hesap satış hattında işaretli kalıyor.",
                },
              },
            },
            {
              id: "i2",
              cells: {
                no: "INV-2291",
                account: "Nar Tekstil",
                status: { text: "Paid", tone: "good" },
                amount: "₺310,000",
              },
              detail: {
                title: "INV-2291",
                eyebrow: { en: "Paid", tr: "Ödendi" },
                fields: [
                  { label: { en: "Account", tr: "Hesap" }, value: "Nar Tekstil" },
                  { label: { en: "Issued", tr: "Kesim" }, value: "28 June" },
                  { label: { en: "Paid", tr: "Ödeme" }, value: "3 July" },
                  { label: { en: "Method", tr: "Yöntem" }, value: "Transfer" },
                ],
              },
            },
            {
              id: "i3",
              cells: {
                no: "INV-2294",
                account: "Deniz Otomotiv",
                status: { text: "Sent", tone: "accent" },
                amount: "₺330,000",
              },
              detail: {
                title: "INV-2294",
                eyebrow: { en: "Awaiting payment", tr: "Ödeme bekliyor" },
                fields: [
                  { label: { en: "Account", tr: "Hesap" }, value: "Deniz Otomotiv" },
                  { label: { en: "Issued", tr: "Kesim" }, value: "2 July" },
                  { label: { en: "Due", tr: "Vade" }, value: "1 August" },
                  { label: { en: "Reminders", tr: "Hatırlatma" }, value: "None" },
                ],
              },
            },
            {
              id: "i4",
              cells: {
                no: "INV-2295",
                account: "Efe Mühendislik",
                status: { text: "Draft", tone: "idle" },
                amount: "₺390,000",
              },
              detail: {
                title: "INV-2295",
                eyebrow: { en: "Draft", tr: "Taslak" },
                fields: [
                  { label: { en: "Account", tr: "Hesap" }, value: "Efe Mühendislik" },
                  { label: { en: "Created", tr: "Oluşturma" }, value: "Today" },
                  { label: { en: "Due", tr: "Vade" }, value: "Net 60" },
                  { label: { en: "Approver", tr: "Onaylayan" }, value: "Finance lead" },
                ],
              },
            },
          ],
        },
      },
      {
        id: "team",
        label: { en: "Team", tr: "Ekip" },
        icon: "shield",
        title: { en: "Team and permissions", tr: "Ekip ve yetkiler" },
        meta: { en: "9 seats", tr: "9 kullanıcı" },
        body: {
          kind: "records",
          columns: [
            { key: "person", label: { en: "Person", tr: "Kişi" } },
            { key: "role", label: { en: "Role", tr: "Rol" } },
            { key: "scope", label: { en: "Scope", tr: "Kapsam" }, hideNarrow: true },
            { key: "open", label: { en: "Open tasks", tr: "Açık görev" }, align: "end" },
          ],
          rows: [
            {
              id: "t1",
              cells: {
                person: "S. Toprak",
                role: { text: "Sales lead", tone: "accent" },
                scope: "All accounts",
                open: "6",
              },
              detail: {
                title: "S. Toprak",
                eyebrow: { en: "Sales lead", tr: "Satış sorumlusu" },
                fields: [
                  { label: { en: "Accounts", tr: "Hesap" }, value: "All" },
                  { label: { en: "Invoices", tr: "Fatura" }, value: "Read only" },
                  { label: { en: "Team", tr: "Ekip" }, value: "Read only" },
                  { label: { en: "Reports", tr: "Rapor" }, value: "Full" },
                ],
                note: {
                  en: "Permissions resolve per row, not per page. A sales lead opens the invoice list and sees the accounts they own, with the amounts, and nothing else.",
                  tr: "Yetkiler sayfa başına değil satır başına çözülüyor. Satış sorumlusu fatura listesini açtığında kendi hesaplarını ve tutarlarını görüyor, başka bir şeyi değil.",
                },
              },
            },
            {
              id: "t2",
              cells: {
                person: "B. Aydın",
                role: { text: "Account manager", tone: "idle" },
                scope: "Own accounts",
                open: "9",
              },
              detail: {
                title: "B. Aydın",
                eyebrow: { en: "Account manager", tr: "Müşteri yöneticisi" },
                fields: [
                  { label: { en: "Accounts", tr: "Hesap" }, value: "Own only" },
                  { label: { en: "Invoices", tr: "Fatura" }, value: "None" },
                  { label: { en: "Team", tr: "Ekip" }, value: "None" },
                  { label: { en: "Reports", tr: "Rapor" }, value: "Own only" },
                ],
              },
            },
            {
              id: "t3",
              cells: {
                person: "E. Kılıç",
                role: { text: "Account manager", tone: "idle" },
                scope: "Own accounts",
                open: "3",
              },
              detail: {
                title: "E. Kılıç",
                eyebrow: { en: "Account manager", tr: "Müşteri yöneticisi" },
                fields: [
                  { label: { en: "Accounts", tr: "Hesap" }, value: "Own only" },
                  { label: { en: "Invoices", tr: "Fatura" }, value: "None" },
                  { label: { en: "Team", tr: "Ekip" }, value: "None" },
                  { label: { en: "Reports", tr: "Rapor" }, value: "Own only" },
                ],
              },
            },
            {
              id: "t4",
              cells: {
                person: "M. Uçar",
                role: { text: "Finance", tone: "warn" },
                scope: "Invoices, reports",
                open: "0",
              },
              detail: {
                title: "M. Uçar",
                eyebrow: { en: "Finance", tr: "Finans" },
                fields: [
                  { label: { en: "Accounts", tr: "Hesap" }, value: "Read only" },
                  { label: { en: "Invoices", tr: "Fatura" }, value: "Full" },
                  { label: { en: "Team", tr: "Ekip" }, value: "None" },
                  { label: { en: "Reports", tr: "Rapor" }, value: "Full" },
                ],
              },
            },
          ],
        },
      },
    ],
  },

  /* -------------------------------------------------------------- 02 ulak */
  {
    slug: "ulak",
    name: "Ulak",
    index: "02",
    sector: { en: "AI operations platform", tr: "Yapay zekâ operasyon platformu" },
    accent: "#8B6CFF",
    icon: "spark",
    statement: {
      en: "The work that arrives as a message, handled as a process.",
      tr: "Mesaj olarak gelen işi, süreç olarak yürüt.",
    },
    premise: {
      en: [
        "Most of the work inside a company arrives unstructured: a mail with an attachment, a request in a chat, a document somebody needs read. It gets handled by whoever notices, and nothing about it is measurable afterwards.",
        "This concept puts a model at the front of that queue and a workflow behind it. Requests are classified, documents are read and turned into fields, routine cases complete on their own, and anything above a confidence line stops for a person to approve — with the reasoning and the source attached.",
      ],
      tr: [
        "Bir şirketteki işin çoğu yapısız gelir: ekli bir e-posta, sohbette bir talep, birinin okuması gereken bir belge. Kim fark ederse o hallettiği için, sonrasında ölçülebilir hiçbir yanı kalmaz.",
        "Bu konsept bu kuyruğun önüne bir model, arkasına bir akış koyuyor. Talepler sınıflandırılıyor, belgeler okunup alanlara dönüştürülüyor, rutin işler kendiliğinden tamamlanıyor; güven eşiğinin üstündeki her şey, gerekçesi ve kaynağıyla birlikte bir insanın onayı için duruyor.",
      ],
    },
    proves: {
      en: [
        "Model calls placed inside a real workflow rather than beside one",
        "Document extraction mapped onto typed fields a system can act on",
        "Confidence thresholds, approval steps and human takeover",
        "Every automated decision traceable back to its source",
      ],
      tr: [
        "Model çağrılarının bir akışın yanına değil, içine yerleştirilmesi",
        "Belge okuma sonucunun, sistemin işleyebileceği tipli alanlara eşlenmesi",
        "Güven eşiği, onay adımı ve insana devir",
        "Otomatik verilen her kararın kaynağına kadar izlenebilmesi",
      ],
    },
    system: [
      {
        label: { en: "Intake", tr: "Giriş" },
        detail: {
          en: "Mail, forms and uploads land in one queue with the original preserved.",
          tr: "E-posta, form ve yüklemeler, aslı korunarak tek bir kuyruğa düşer.",
        },
      },
      {
        label: { en: "Extraction", tr: "Okuma" },
        detail: {
          en: "A document becomes typed fields — supplier, total, dates, line items — with a confidence score per field.",
          tr: "Belge tipli alanlara dönüşür — tedarikçi, tutar, tarihler, kalemler — ve her alan bir güven skoru taşır.",
        },
      },
      {
        label: { en: "Rules", tr: "Kurallar" },
        detail: {
          en: "Thresholds decide what completes automatically and what stops for approval.",
          tr: "Eşikler, neyin otomatik tamamlanacağına ve neyin onay için duracağına karar verir.",
        },
      },
      {
        label: { en: "Audit", tr: "Denetim" },
        detail: {
          en: "Model, prompt version, inputs and outcome are recorded against every run.",
          tr: "Her çalışmada model, istem sürümü, girdiler ve sonuç kaydedilir.",
        },
      },
    ],
    domains: ["ai", "automation", "systems"],
    views: [
      {
        id: "assistant",
        label: { en: "Assistant", tr: "Asistan" },
        icon: "spark",
        title: { en: "Operations assistant", tr: "Operasyon asistanı" },
        meta: { en: "Grounded in company data", tr: "Şirket verisine dayalı" },
        body: {
          kind: "thread",
          composer: { en: "Ask about an order, a document or a supplier", tr: "Sipariş, belge veya tedarikçi sor" },
          conversations: [
            {
              id: "c1",
              subject: "PO-4471 — supplier mismatch",
              who: "Procurement",
              meta: { en: "Needs approval", tr: "Onay bekliyor" },
              tone: "warn",
              messages: [
                {
                  from: "customer",
                  at: "10:12",
                  text: {
                    en: "The invoice for PO-4471 came in higher than the order. Can you check before I approve it?",
                    tr: "PO-4471 için gelen fatura, siparişten yüksek. Onaylamadan önce bakabilir misin?",
                  },
                },
                {
                  from: "assistant",
                  at: "10:12",
                  sources: ["PO-4471.pdf", "INV-88213.pdf", "Supplier terms v4"],
                  text: {
                    en: "The invoice totals ₺148,600 against an order of ₺139,000. The difference is a freight line the order did not carry. Supplier terms allow freight to be added below 8% — this is 6.9%, so it is within terms. I have prepared the approval and left it for you.",
                    tr: "Fatura toplamı ₺148.600, sipariş ise ₺139.000. Fark, siparişte olmayan bir navlun kalemi. Tedarikçi şartları %8 altındaki navlun eklemesine izin veriyor — bu %6,9, yani şartlar içinde. Onayı hazırladım, sende bıraktım.",
                  },
                },
                {
                  from: "customer",
                  at: "10:14",
                  text: {
                    en: "Does that supplier do this often?",
                    tr: "Bu tedarikçi bunu sık yapıyor mu?",
                  },
                },
                {
                  from: "assistant",
                  at: "10:14",
                  sources: ["Invoice history · 18 months"],
                  text: {
                    en: "Four times in eighteen months, always freight, always inside terms. I can add a rule that auto-approves freight under 8% for this supplier and routes anything above it to you.",
                    tr: "On sekiz ayda dört kez, her seferinde navlun, her seferinde şartlar içinde. Bu tedarikçi için %8 altındaki navlunu otomatik onaylayan, üstünü sana yönlendiren bir kural ekleyebilirim.",
                  },
                },
              ],
              context: [
                { label: { en: "Order", tr: "Sipariş" }, value: "PO-4471" },
                { label: { en: "Supplier", tr: "Tedarikçi" }, value: "Tuna Enerji" },
                { label: { en: "Variance", tr: "Fark" }, value: "+6.9%" },
                { label: { en: "Confidence", tr: "Güven" }, value: "0.94" },
              ],
            },
            {
              id: "c2",
              subject: "Contract renewal — Kayra Yapı",
              who: "Legal",
              meta: { en: "Answered", tr: "Yanıtlandı" },
              tone: "good",
              messages: [
                {
                  from: "customer",
                  at: "Yesterday",
                  text: {
                    en: "What notice period do we have on the Kayra Yapı contract?",
                    tr: "Kayra Yapı sözleşmesinde ihbar süresi ne kadar?",
                  },
                },
                {
                  from: "assistant",
                  at: "Yesterday",
                  sources: ["Kayra Yapı — MSA, clause 11.2"],
                  text: {
                    en: "Sixty days, and it renews automatically otherwise. The window opens on 3 October. I have put a reminder on the account owner for 20 September.",
                    tr: "Altmış gün; aksi hâlde otomatik yenileniyor. Bildirim penceresi 3 Ekim'de açılıyor. Hesap sorumlusuna 20 Eylül için hatırlatma bıraktım.",
                  },
                },
              ],
              context: [
                { label: { en: "Document", tr: "Belge" }, value: "MSA v2" },
                { label: { en: "Clause", tr: "Madde" }, value: "11.2" },
                { label: { en: "Confidence", tr: "Güven" }, value: "0.98" },
              ],
            },
          ],
        },
      },
      {
        id: "inbox",
        label: { en: "Requests", tr: "Talepler" },
        icon: "message",
        badge: "12",
        title: { en: "Incoming requests", tr: "Gelen talepler" },
        meta: { en: "Classified on arrival", tr: "Girişte sınıflandırılmış" },
        body: {
          kind: "records",
          filters: [
            { id: "all", label: { en: "All", tr: "Tümü" } },
            { id: "auto", label: { en: "Automated", tr: "Otomatik" } },
            { id: "review", label: { en: "Needs review", tr: "İnceleme" } },
          ],
          columns: [
            { key: "subject", label: { en: "Request", tr: "Talep" } },
            { key: "type", label: { en: "Type", tr: "Tür" }, hideNarrow: true },
            { key: "state", label: { en: "State", tr: "Durum" } },
            { key: "conf", label: { en: "Conf.", tr: "Güven" }, align: "end" },
          ],
          rows: [
            {
              id: "r1",
              cells: {
                subject: "INV-88213 — Tuna Enerji",
                type: "Invoice",
                state: { text: "Awaiting approval", tone: "warn" },
                conf: "0.94",
              },
              detail: {
                title: "INV-88213",
                eyebrow: { en: "Extracted from PDF", tr: "PDF'ten okundu" },
                fields: [
                  { label: { en: "Supplier", tr: "Tedarikçi" }, value: "Tuna Enerji" },
                  { label: { en: "Total", tr: "Toplam" }, value: "₺148,600" },
                  { label: { en: "Order", tr: "Sipariş" }, value: "PO-4471" },
                  { label: { en: "Line items", tr: "Kalem" }, value: "7" },
                  { label: { en: "Lowest field", tr: "En düşük alan" }, value: "0.81 — freight" },
                ],
                note: {
                  en: "Every field carries its own score. The document only stops for a person when a field falls under the threshold, not because the whole document did.",
                  tr: "Her alanın kendi skoru var. Belge, tamamı için değil, yalnızca bir alan eşiğin altına düştüğü için insanın önünde duruyor.",
                },
              },
            },
            {
              id: "r2",
              cells: {
                subject: "Delivery note DN-1180",
                type: "Logistics",
                state: { text: "Completed", tone: "good" },
                conf: "0.99",
              },
              detail: {
                title: "DN-1180",
                eyebrow: { en: "Completed automatically", tr: "Otomatik tamamlandı" },
                fields: [
                  { label: { en: "Matched", tr: "Eşleşme" }, value: "PO-4468" },
                  { label: { en: "Quantities", tr: "Miktar" }, value: "Exact" },
                  { label: { en: "Handled in", tr: "Süre" }, value: "4s" },
                  { label: { en: "Reviewed by", tr: "İnceleyen" }, value: "None required" },
                ],
              },
            },
            {
              id: "r3",
              cells: {
                subject: "Refund request — order 30214",
                type: "Customer",
                state: { text: "Escalated", tone: "risk" },
                conf: "0.42",
              },
              detail: {
                title: "Order 30214",
                eyebrow: { en: "Escalated to a person", tr: "Bir kişiye devredildi" },
                fields: [
                  { label: { en: "Reason", tr: "Sebep" }, value: "Outside policy window" },
                  { label: { en: "Assigned", tr: "Atanan" }, value: "Support lead" },
                  { label: { en: "Waiting", tr: "Bekleme" }, value: "22m" },
                ],
                note: {
                  en: "Low confidence is not a failure state. It is the system correctly refusing to decide, which is the only reason the other 99% can be trusted.",
                  tr: "Düşük güven bir hata durumu değil. Sistemin karar vermeyi doğru şekilde reddetmesi — geri kalan %99'a güvenilebilmesinin tek sebebi de bu.",
                },
              },
            },
            {
              id: "r4",
              cells: {
                subject: "Supplier onboarding — Mira Ajans",
                type: "Procurement",
                state: { text: "In workflow", tone: "accent" },
                conf: "0.88",
              },
              detail: {
                title: "Mira Ajans",
                eyebrow: { en: "Step 3 of 5", tr: "5 adımdan 3." },
                fields: [
                  { label: { en: "Documents", tr: "Belge" }, value: "4 of 5 received" },
                  { label: { en: "Missing", tr: "Eksik" }, value: "Tax certificate" },
                  { label: { en: "Chased", tr: "Hatırlatma" }, value: "Twice" },
                ],
              },
            },
          ],
        },
      },
      {
        id: "workflows",
        label: { en: "Automations", tr: "Otomasyonlar" },
        icon: "flow",
        title: { en: "Automation rules", tr: "Otomasyon kuralları" },
        meta: { en: "6 active", tr: "6 aktif" },
        body: {
          kind: "board",
          columns: [
            {
              title: { en: "Trigger", tr: "Tetikleyici" },
              cards: [
                { id: "w1", title: "Invoice received", meta: "Mail, upload, API" },
                { id: "w2", title: "Delivery note received", meta: "Mail" },
                { id: "w3", title: "Refund requested", meta: "Customer portal" },
              ],
            },
            {
              title: { en: "Condition", tr: "Koşul" },
              cards: [
                { id: "w4", title: "Variance under 8%", meta: "Against purchase order" },
                { id: "w5", title: "Quantities match exactly", meta: "Against order lines" },
                {
                  id: "w6",
                  title: "Confidence under 0.70",
                  meta: "Any extracted field",
                  tag: { en: "Stops here", tr: "Burada durur" },
                  tone: "warn",
                },
              ],
            },
            {
              title: { en: "Action", tr: "Eylem" },
              cards: [
                {
                  id: "w7",
                  title: "Approve and post",
                  meta: "Writes to ledger",
                  tag: { en: "Automatic", tr: "Otomatik" },
                  tone: "good",
                },
                {
                  id: "w8",
                  title: "Close and notify",
                  meta: "Notifies requester",
                  tag: { en: "Automatic", tr: "Otomatik" },
                  tone: "good",
                },
                {
                  id: "w9",
                  title: "Route to a person",
                  meta: "With reasoning attached",
                  tag: { en: "Human", tr: "İnsan" },
                  tone: "accent",
                },
              ],
            },
          ],
        },
      },
      {
        id: "sources",
        label: { en: "Knowledge", tr: "Bilgi" },
        icon: "book",
        title: { en: "Grounding sources", tr: "Dayanak kaynakları" },
        meta: { en: "What the assistant may read", tr: "Asistanın okuyabildikleri" },
        body: {
          kind: "records",
          columns: [
            { key: "source", label: { en: "Source", tr: "Kaynak" } },
            { key: "kind", label: { en: "Kind", tr: "Tür" }, hideNarrow: true },
            { key: "access", label: { en: "Access", tr: "Erişim" } },
            { key: "items", label: { en: "Items", tr: "Kayıt" }, align: "end" },
          ],
          rows: [
            {
              id: "s1",
              cells: {
                source: "Supplier contracts",
                kind: "PDF",
                access: { text: "Procurement", tone: "accent" },
                items: "214",
              },
              detail: {
                title: "Supplier contracts",
                eyebrow: { en: "Indexed", tr: "İndekslenmiş" },
                fields: [
                  { label: { en: "Last indexed", tr: "Son indeks" }, value: "Today, 06:00" },
                  { label: { en: "Chunks", tr: "Parça" }, value: "8,410" },
                  { label: { en: "Access", tr: "Erişim" }, value: "Procurement, Legal" },
                ],
                note: {
                  en: "Access is enforced at retrieval, not at display. A question asked by someone without the permission simply does not reach the document.",
                  tr: "Erişim, gösterimde değil getirmede uygulanıyor. Yetkisi olmayan birinin sorusu belgeye hiç ulaşmıyor.",
                },
              },
            },
            {
              id: "s2",
              cells: {
                source: "Purchase orders",
                kind: "Database",
                access: { text: "All staff", tone: "idle" },
                items: "11,902",
              },
              detail: {
                title: "Purchase orders",
                eyebrow: { en: "Live table", tr: "Canlı tablo" },
                fields: [
                  { label: { en: "Sync", tr: "Eşitleme" }, value: "Continuous" },
                  { label: { en: "Access", tr: "Erişim" }, value: "All staff" },
                ],
              },
            },
            {
              id: "s3",
              cells: {
                source: "Policy handbook",
                kind: "Markdown",
                access: { text: "All staff", tone: "idle" },
                items: "62",
              },
              detail: {
                title: "Policy handbook",
                eyebrow: { en: "Indexed", tr: "İndekslenmiş" },
                fields: [
                  { label: { en: "Last indexed", tr: "Son indeks" }, value: "3 days ago" },
                  { label: { en: "Owner", tr: "Sahip" }, value: "Operations" },
                ],
              },
            },
            {
              id: "s4",
              cells: {
                source: "Payroll",
                kind: "Database",
                access: { text: "Excluded", tone: "risk" },
                items: "—",
              },
              detail: {
                title: "Payroll",
                eyebrow: { en: "Deliberately excluded", tr: "Bilerek dışarıda" },
                fields: [
                  { label: { en: "Access", tr: "Erişim" }, value: "None" },
                  { label: { en: "Reason", tr: "Sebep" }, value: "Out of scope" },
                ],
                note: {
                  en: "Deciding what a model may not read is part of the design, and it belongs in the interface where someone can check it.",
                  tr: "Bir modelin neyi okuyamayacağına karar vermek de tasarımın parçası ve birinin kontrol edebileceği şekilde arayüzde durması gerekir.",
                },
              },
            },
          ],
        },
      },
      {
        id: "analytics",
        label: { en: "Analytics", tr: "Analitik" },
        icon: "chart",
        title: { en: "Automation performance", tr: "Otomasyon performansı" },
        meta: { en: "Last 12 weeks", tr: "Son 12 hafta" },
        body: {
          kind: "dashboard",
          stats: [
            {
              label: { en: "Handled automatically", tr: "Otomatik işlenen" },
              value: "82%",
              delta: "+9 pts",
              tone: "good",
            },
            { label: { en: "Median handling", tr: "Ortanca süre" }, value: "6s", delta: "was 4h" },
            { label: { en: "Escalated", tr: "Devredilen" }, value: "18%", delta: "-9 pts" },
            {
              label: { en: "Corrections", tr: "Düzeltme" },
              value: "1.2%",
              delta: "reviewed weekly",
            },
          ],
          chart: {
            type: "bar",
            values: [38, 44, 47, 52, 58, 61, 64, 69, 71, 74, 79, 82],
            labels: ["W1", "W3", "W5", "W7", "W9", "W11"],
            caption: {
              en: "Share of requests completed without a person, by week",
              tr: "Haftalara göre, insana uğramadan tamamlanan talep oranı",
            },
          },
          breakdown: [
            { label: { en: "Invoices", tr: "Faturalar" }, value: 4120 },
            { label: { en: "Delivery notes", tr: "İrsaliyeler" }, value: 2980 },
            { label: { en: "Customer requests", tr: "Müşteri talepleri" }, value: 1640 },
            { label: { en: "Procurement", tr: "Satın alma" }, value: 720 },
          ],
        },
      },
    ],
  },
];
