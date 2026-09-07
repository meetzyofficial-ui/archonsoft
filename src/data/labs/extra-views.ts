import type { LabView } from "@/data/labs/types";

/**
 * The screens a demo normally skips.
 *
 * A command palette, and the empty, loading and error states, are the two
 * things a fake dashboard never has — which is precisely why they are worth
 * building. Anyone can draw a chart with data in it. The state a product is in
 * before the data arrives, and the state it is in when the request fails, are
 * where the engineering actually shows.
 *
 * Not every concept gets them. A product with nothing particular to say in a
 * settings panel does not get a settings panel.
 */
export const EXTRA_VIEWS: Record<string, LabView[]> = {
  divan: [
    {
      id: "command",
      label: { en: "Command", tr: "Komut" },
      icon: "search",
      badge: "⌘K",
      title: { en: "Command palette", tr: "Komut paleti" },
      meta: { en: "Everything, from the keyboard", tr: "Her şey, klavyeden" },
      body: {
        kind: "command",
        placeholder: { en: "Search accounts, deals, invoices or run a command", tr: "Hesap, fırsat, fatura ara veya bir komut çalıştır" },
        hint: {
          en: "A system somebody works in all day is measured by how fast it gets out of the way.",
          tr: "Birinin bütün gün içinde çalıştığı bir sistem, ne kadar hızlı yoldan çekildiğiyle ölçülür.",
        },
        groups: [
          {
            label: { en: "Jump to", tr: "Git" },
            items: [
              { icon: "users", label: { en: "Kayra Yapı", tr: "Kayra Yapı" }, meta: "Account · Negotiation" },
              { icon: "file", label: { en: "INV-2287", tr: "INV-2287" }, meta: "Invoice · 14 days overdue" },
              { icon: "pipeline", label: { en: "Q3 pipeline", tr: "3. çeyrek hattı" }, meta: "Board" },
            ],
          },
          {
            label: { en: "Actions", tr: "Eylemler" },
            items: [
              { icon: "plus", label: { en: "New deal", tr: "Yeni fırsat" }, shortcut: "D" },
              { icon: "card", label: { en: "Raise an invoice", tr: "Fatura kes" }, shortcut: "I" },
              { icon: "download", label: { en: "Export this quarter", tr: "Bu çeyreği dışa aktar" }, shortcut: "E" },
              { icon: "shield", label: { en: "Change a permission", tr: "Yetki değiştir" }, meta: "Admin only" },
            ],
          },
        ],
      },
    },
  ],

  olcek: [
    {
      id: "command",
      label: { en: "Query", tr: "Sorgu" },
      icon: "search",
      badge: "⌘K",
      title: { en: "Ask the data", tr: "Veriye sor" },
      meta: { en: "Saved queries and events", tr: "Kayıtlı sorgular ve olaylar" },
      body: {
        kind: "command",
        placeholder: { en: "Find an event, a funnel or a saved report", tr: "Bir olay, huni veya kayıtlı rapor bul" },
        hint: {
          en: "Every one of these is a query over the raw events, which is why a new question does not need a new table.",
          tr: "Bunların her biri ham olaylar üzerinde bir sorgu; yeni bir sorunun yeni bir tablo gerektirmemesinin sebebi bu.",
        },
        groups: [
          {
            label: { en: "Events", tr: "Olaylar" },
            items: [
              { icon: "database", label: { en: "signup_completed", tr: "signup_completed" }, meta: "612 / 24h" },
              { icon: "database", label: { en: "verification_failed", tr: "verification_failed" }, meta: "1,284 / 24h · rising" },
              { icon: "database", label: { en: "item_saved", tr: "item_saved" }, meta: "9,410 / 24h" },
            ],
          },
          {
            label: { en: "Saved", tr: "Kayıtlı" },
            items: [
              { icon: "filter", label: { en: "Sign-up to first action", tr: "Kayıttan ilk eyleme" }, meta: "Funnel · 5 steps" },
              { icon: "users", label: { en: "Week 4 retention", tr: "4. hafta elde tutma" }, meta: "Cohort" },
              { icon: "download", label: { en: "Weekly report to the team", tr: "Ekibe haftalık rapor" }, shortcut: "R" },
            ],
          },
        ],
      },
    },
  ],

  tezgah: [
    {
      id: "states",
      label: { en: "States", tr: "Durumlar" },
      icon: "layers",
      title: { en: "The states nobody demos", tr: "Kimsenin göstermediği durumlar" },
      meta: { en: "Empty, loading, failed", tr: "Boş, yükleniyor, başarısız" },
      body: {
        kind: "states",
        cases: [
          {
            id: "empty",
            kind: "empty",
            label: { en: "Empty", tr: "Boş" },
            title: { en: "No orders yet", tr: "Henüz sipariş yok" },
            body: {
              en: "The first day of a shop is a real screen and it has to say something useful, not sit blank waiting for data.",
              tr: "Bir dükkânın ilk günü de gerçek bir ekrandır; veri bekleyip boş durmak yerine işe yarar bir şey söylemesi gerekir.",
            },
            action: { en: "Add your first product", tr: "İlk ürününü ekle" },
          },
          {
            id: "loading",
            kind: "loading",
            label: { en: "Loading", tr: "Yükleniyor" },
            title: { en: "Loading orders", tr: "Siparişler yükleniyor" },
            body: {
              en: "A skeleton in the shape of the content that is coming, so the page does not jump when it arrives.",
              tr: "Gelecek içeriğin biçiminde bir iskelet; böylece içerik geldiğinde sayfa zıplamıyor.",
            },
          },
          {
            id: "error",
            kind: "error",
            label: { en: "Failed", tr: "Başarısız" },
            title: { en: "Could not reach the payment provider", tr: "Ödeme sağlayıcısına ulaşılamadı" },
            body: {
              en: "It says what failed, what it means for the order, and what happens next. Nothing was lost and nothing was charged twice.",
              tr: "Neyin başarısız olduğunu, bunun sipariş için ne demek olduğunu ve sırada ne olduğunu söylüyor. Hiçbir şey kaybolmadı, hiçbir şey iki kez tahsil edilmedi.",
            },
            action: { en: "Retry the charge", tr: "Tahsilatı tekrar dene" },
          },
        ],
      },
    },
  ],

  vardiya: [
    {
      id: "states",
      label: { en: "States", tr: "Durumlar" },
      icon: "layers",
      title: { en: "When the assistant cannot answer", tr: "Asistan cevap veremediğinde" },
      meta: { en: "Empty, thinking, refused", tr: "Boş, düşünüyor, reddetti" },
      body: {
        kind: "states",
        cases: [
          {
            id: "empty",
            kind: "empty",
            label: { en: "Inbox zero", tr: "Kutu boş" },
            title: { en: "Nothing waiting", tr: "Bekleyen yok" },
            body: {
              en: "Everything that arrived today was answered or handed to a person. This is a state a support desk should be able to reach.",
              tr: "Bugün gelen her şey ya cevaplandı ya da bir kişiye devredildi. Bir destek masasının ulaşabilmesi gereken bir durum bu.",
            },
          },
          {
            id: "loading",
            kind: "loading",
            label: { en: "Retrieving", tr: "Getiriyor" },
            title: { en: "Reading the order and the policy", tr: "Sipariş ve politika okunuyor" },
            body: {
              en: "The wait is shown as what it is actually doing, not as a spinner. Retrieval first, generation second.",
              tr: "Bekleme, bir dönen simge olarak değil, gerçekte ne yaptığı olarak gösteriliyor. Önce getirme, sonra üretme.",
            },
          },
          {
            id: "refused",
            kind: "error",
            label: { en: "Refused", tr: "Reddetti" },
            title: { en: "No citable source", tr: "Gösterilecek kaynak yok" },
            body: {
              en: "The assistant found nothing it could point at, so it wrote nothing and passed the conversation to a person with the context attached.",
              tr: "Asistan gösterebileceği bir şey bulamadı; bu yüzden hiçbir şey yazmadı ve görüşmeyi bağlamıyla birlikte bir kişiye aktardı.",
            },
            action: { en: "Open the escalation", tr: "Devir kaydını aç" },
          },
        ],
      },
    },
  ],

  esik: [
    {
      id: "settings",
      label: { en: "Account", tr: "Hesap" },
      icon: "settings",
      title: { en: "Account and access", tr: "Hesap ve erişim" },
      meta: { en: "Customer view", tr: "Müşteri görünümü" },
      body: {
        kind: "settings",
        groups: [
          {
            label: { en: "Notifications", tr: "Bildirimler" },
            rows: [
              {
                label: { en: "Project milestones", tr: "Proje kilometre taşları" },
                detail: { en: "When a stage completes or a date moves", tr: "Bir aşama bittiğinde veya bir tarih kaydığında" },
                control: "toggle",
                value: "on",
                on: true,
              },
              {
                label: { en: "Invoices", tr: "Faturalar" },
                detail: { en: "Issued, due in seven days, and paid", tr: "Kesildiğinde, vadeye yedi gün kaldığında ve ödendiğinde" },
                control: "toggle",
                value: "on",
                on: true,
              },
              {
                label: { en: "Everything else", tr: "Diğer her şey" },
                detail: { en: "Off by default, because most of it is noise", tr: "Varsayılan olarak kapalı; çoğu gürültü olduğu için" },
                control: "toggle",
                value: "off",
                on: false,
              },
            ],
          },
          {
            label: { en: "People on this account", tr: "Bu hesaptaki kişiler" },
            rows: [
              {
                label: { en: "You", tr: "Sen" },
                detail: { en: "Approve, pay, message", tr: "Onaylama, ödeme, mesaj" },
                control: "select",
                value: "Owner",
              },
              {
                label: { en: "Site manager", tr: "Şantiye sorumlusu" },
                detail: { en: "Sees projects and messages, not invoices", tr: "Projeleri ve mesajları görür, faturaları görmez" },
                control: "select",
                value: "Limited",
              },
              {
                label: { en: "Accounts", tr: "Muhasebe" },
                detail: { en: "Sees invoices only", tr: "Yalnızca faturaları görür" },
                control: "select",
                value: "Billing",
              },
            ],
          },
        ],
      },
    },
  ],

  atolye: [
    {
      id: "settings",
      label: { en: "Rules", tr: "Kurallar" },
      icon: "settings",
      title: { en: "Operating rules", tr: "İşleyiş kuralları" },
      meta: { en: "Set by the business", tr: "İşletme tarafından belirlenir" },
      body: {
        kind: "settings",
        groups: [
          {
            label: { en: "Thresholds", tr: "Eşikler" },
            rows: [
              {
                label: { en: "Approval required above", tr: "Üstünde onay gerekir" },
                detail: { en: "Any purchase a crew raises from the field", tr: "Bir ekibin sahadan açtığı her satın alma" },
                control: "text",
                value: "₺5,000",
              },
              {
                label: { en: "Block a job when stock is short", tr: "Stok yetmediğinde işi bloke et" },
                detail: { en: "Rather than letting it start and fail on site", tr: "Başlayıp sahada tıkanmasına izin vermek yerine" },
                control: "toggle",
                value: "on",
                on: true,
              },
              {
                label: { en: "Auto-reorder at the reorder point", tr: "Sipariş noktasında otomatik sipariş" },
                detail: { en: "Off here, because the supplier is chosen per order", tr: "Burada kapalı; tedarikçi sipariş başına seçildiği için" },
                control: "toggle",
                value: "off",
                on: false,
              },
            ],
          },
          {
            label: { en: "Field client", tr: "Saha istemcisi" },
            rows: [
              {
                label: { en: "Work offline", tr: "Çevrimdışı çalış" },
                detail: { en: "Write locally, reconcile when there is signal", tr: "Yerelde yaz, şebeke gelince mutabık kal" },
                control: "toggle",
                value: "on",
                on: true,
              },
              {
                label: { en: "Photos required to sign off", tr: "Kapanış için fotoğraf zorunlu" },
                detail: { en: "Minimum of two, before a job can be closed", tr: "Bir iş kapatılmadan önce en az iki adet" },
                control: "toggle",
                value: "on",
                on: true,
              },
            ],
          },
        ],
      },
    },
  ],
};
