/**
 * The privacy notice, both languages.
 *
 * Plain statements of what this site and the world collect and why. The
 * Turkish is written against the Personal Data Protection Law (KVKK) — the
 * controller, the purposes, the legal bases in article 5, the processors
 * the data passes through, the retention, and the rights in article 11 —
 * and the English says the same things for a reader abroad.
 */

type Section = { id: string; title: string; body: string[]; items?: string[] };

type PrivacyCopy = {
  updated: string;
  lead: string;
  accent: string;
  standfirst: string;
  controller: string;
  sectionsLabel: string;
  sectionsAside: string;
  contact: string;
  email: string;
  sections: Section[];
};

export const PRIVACY: Record<"en" | "tr", PrivacyCopy> = {
  en: {
    updated: "Updated September 2026",
    lead: "Your details, and what",
    accent: "happens to them.",
    standfirst:
      "This site asks for personal details in exactly two places: the contact form, and the project brief a visitor gives at one of the offices in Archon World. This page says what is collected, why, where it goes and for how long — and what you can ask of us.",
    controller: "Data controller: Archon Soft, Ankara, Türkiye. Questions and requests: info@archonsoft.tr.",
    sectionsLabel: "The notice",
    sectionsAside: "Nine points",
    contact: "For any question about this notice or your data, write to",
    email: "info@archonsoft.tr",
    sections: [
      {
        id: "what",
        title: "What we collect",
        body: ["Only what you type into a form, and the little that is needed to answer it."],
        items: [
          "Contact form: name, email, company (optional), the kind of project, a budget range (optional), your message.",
          "Archon World brief: name, email, company, phone and WhatsApp number (all but name and email optional), the department and service you chose, a description of the project, budget and timeline (optional), notes (optional), and your consent.",
          "With a brief we also keep the language you were reading in, whether you were on a phone or a desktop, and the path you took through the world to the office — so we know what you were looking at when you wrote to us.",
          "Technical: the time of the request and a coarse network address, used only to limit abuse of the forms.",
        ],
      },
      {
        id: "why",
        title: "Why",
        body: ["To read your request and reply to it, to prepare a proposal if you ask for one, and to keep the forms from being abused. Nothing you give us is used for advertising, profiling or sale."],
      },
      {
        id: "basis",
        title: "Legal basis",
        body: [
          "Your explicit consent, given by the checkbox under the brief; and, where you ask us for a proposal, the steps needed before a contract. You can withdraw consent at any time by writing to us; we then stop processing and delete what we hold, unless a legal duty requires otherwise.",
        ],
      },
      {
        id: "where",
        title: "Where it goes",
        body: ["A request travels through a few services that act only on our instructions. None of them may use it for anything else."],
        items: [
          "Vercel — hosts the site and runs the server that receives the form.",
          "Resend — delivers the request to our inbox by email.",
          "Google Firebase (Firestore) — keeps a record of briefs from Archon World so that none is lost if an email fails.",
          "Meta WhatsApp Business — sends us a short notification that a brief arrived.",
          "Some of these providers process data outside Türkiye. That transfer rests on your explicit consent, given with the brief.",
        ],
      },
      {
        id: "how-long",
        title: "How long",
        body: [
          "For as long as the conversation about your request is open, and up to two years after our last exchange, so we can pick it up again if you come back. Then it is deleted. Records needed to meet a legal obligation are kept for the period that obligation requires.",
        ],
      },
      {
        id: "rights",
        title: "Your rights",
        body: ["Under article 11 of the Personal Data Protection Law (KVKK) and comparable law elsewhere, you can ask us at any time:"],
        items: [
          "whether we hold data about you, and to see it;",
          "to correct it, or to delete it;",
          "to know whom it was passed to, and to have them told of a correction or deletion;",
          "to object to a result produced solely by automated means;",
          "for compensation if you suffered a loss from unlawful processing.",
          "Write to info@archonsoft.tr. We answer within thirty days, free of charge.",
        ],
      },
      {
        id: "cookies",
        title: "Cookies and storage",
        body: [
          "The site sets no tracking cookies and runs no analytics that identify you. Archon World remembers a few preferences in your browser's own storage — your language, whether you have met the host, which panels you have opened — and none of that leaves your device.",
        ],
      },
      {
        id: "security",
        title: "Security",
        body: [
          "Forms are received over an encrypted connection by our own server code; credentials for every service live on the server and never in the page you load. Access to the inbox and the records is limited to the studio.",
        ],
      },
      {
        id: "changes",
        title: "Changes",
        body: ["When this notice changes, the date at the top changes with it. What you consented to is the version that was current when you gave consent."],
      },
    ],
  },
  tr: {
    updated: "Eylül 2026'da güncellendi",
    lead: "Bilgileriniz, ve",
    accent: "onlara ne olduğu.",
    standfirst:
      "Bu site kişisel bilgi tam olarak iki yerde ister: iletişim formunda ve Archon Dünyası'ndaki ofislerden birinde verilen proje talebinde. Bu sayfa neyin toplandığını, neden toplandığını, nereye gittiğini ve ne kadar saklandığını — ve bizden neler isteyebileceğinizi — söyler.",
    controller: "Veri sorumlusu: Archon Soft, Ankara. Soru ve talepler için: info@archonsoft.tr.",
    sectionsLabel: "Aydınlatma metni",
    sectionsAside: "Dokuz madde",
    contact: "Bu metin ya da verileriniz hakkında her soru için yazın:",
    email: "info@archonsoft.tr",
    sections: [
      {
        id: "what",
        title: "Neyi topluyoruz",
        body: ["Yalnızca bir forma yazdığınızı ve ona yanıt vermek için gereken çok azını."],
        items: [
          "İletişim formu: ad, e-posta, şirket (isteğe bağlı), proje türü, bütçe aralığı (isteğe bağlı), mesajınız.",
          "Archon Dünyası proje talebi: ad, e-posta, şirket, telefon ve WhatsApp numarası (ad ve e-posta dışında hepsi isteğe bağlı), seçtiğiniz bölüm ve hizmet, proje açıklaması, bütçe ve teslim süresi (isteğe bağlı), notlar (isteğe bağlı) ve onayınız.",
          "Talebin yanında okuduğunuz dili, telefonda mı masaüstünde mi olduğunuzu ve dünyada ofise kadar izlediğiniz yolu da tutuyoruz — bize yazdığınızda neye baktığınızı bilmek için.",
          "Teknik: talebin zamanı ve yalnızca formların kötüye kullanımını sınırlamak için kullanılan kaba bir ağ adresi.",
        ],
      },
      {
        id: "why",
        title: "Neden",
        body: ["Talebinizi okuyup yanıtlamak, isterseniz bir teklif hazırlamak ve formların kötüye kullanılmasını önlemek için. Verdiğiniz hiçbir bilgi reklam, profilleme ya da satış için kullanılmaz."],
      },
      {
        id: "basis",
        title: "Hukuki dayanak",
        body: [
          "6698 sayılı KVKK'nın 5. maddesi uyarınca, talep formunun altındaki kutuyla verdiğiniz açık rızanız; teklif istediğiniz durumda ise sözleşmenin kurulması öncesindeki adımlar. Rızanızı istediğiniz zaman bize yazarak geri alabilirsiniz; bunun üzerine işlemeyi durdurur ve yasal bir yükümlülük gerektirmiyorsa elimizdekini sileriz.",
        ],
      },
      {
        id: "where",
        title: "Nereye gidiyor",
        body: ["Bir talep, yalnızca bizim talimatımızla çalışan birkaç hizmetten geçer. Hiçbiri veriyi başka bir amaçla kullanamaz."],
        items: [
          "Vercel — siteyi barındırır ve formu alan sunucuyu çalıştırır.",
          "Resend — talebi e-posta ile gelen kutumuza iletir.",
          "Google Firebase (Firestore) — bir e-posta başarısız olursa hiçbir talep kaybolmasın diye Archon Dünyası taleplerinin kaydını tutar.",
          "Meta WhatsApp Business — bir talebin geldiğine dair bize kısa bir bildirim gönderir.",
          "Bu sağlayıcıların bir kısmı veriyi Türkiye dışında işler. Bu aktarım, KVKK m.9 kapsamında talep ile birlikte verdiğiniz açık rızaya dayanır.",
        ],
      },
      {
        id: "how-long",
        title: "Ne kadar",
        body: [
          "Talebinizle ilgili görüşme açık olduğu sürece ve geri dönmeniz hâlinde kaldığımız yerden devam edebilmek için son yazışmadan sonra en fazla iki yıl. Sonra silinir. Yasal bir yükümlülük için gereken kayıtlar, o yükümlülüğün gerektirdiği süre boyunca saklanır.",
        ],
      },
      {
        id: "rights",
        title: "Haklarınız",
        body: ["KVKK'nın 11. maddesi uyarınca bize her zaman başvurup şunları isteyebilirsiniz:"],
        items: [
          "hakkınızda veri işlenip işlenmediğini öğrenmek ve işlenmişse buna ilişkin bilgi talep etmek;",
          "işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenmek;",
          "eksik ya da yanlış işlenmişse düzeltilmesini, şartları oluşmuşsa silinmesini ya da yok edilmesini istemek;",
          "aktarıldığı üçüncü kişileri öğrenmek ve düzeltme/silme işlemlerinin onlara da bildirilmesini istemek;",
          "münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonuca itiraz etmek;",
          "kanuna aykırı işleme nedeniyle zarara uğrarsanız zararın giderilmesini talep etmek.",
          "Başvurunuzu info@archonsoft.tr adresine yazın. En geç otuz gün içinde, ücretsiz yanıtlarız.",
        ],
      },
      {
        id: "cookies",
        title: "Çerezler ve depolama",
        body: [
          "Site izleme çerezi kullanmaz ve sizi tanımlayan bir analitik çalıştırmaz. Archon Dünyası birkaç tercihi — dilinizi, rehberle tanışmış olduğunuzu, hangi panelleri açtığınızı — tarayıcınızın kendi depolamasında tutar ve bunların hiçbiri cihazınızdan çıkmaz.",
        ],
      },
      {
        id: "security",
        title: "Güvenlik",
        body: [
          "Formlar şifreli bağlantı üzerinden kendi sunucu kodumuz tarafından alınır; her hizmetin kimlik bilgileri sunucuda durur, yüklediğiniz sayfada asla bulunmaz. Gelen kutusuna ve kayıtlara erişim stüdyo ile sınırlıdır.",
        ],
      },
      {
        id: "changes",
        title: "Değişiklikler",
        body: ["Bu metin değiştiğinde en üstteki tarih de değişir. Rıza verdiğiniz sürüm, rızayı verdiğiniz anda yürürlükte olan sürümdür."],
      },
    ],
  },
};
