import type { DiagramKind } from "@/components/system/Diagram";
import type { Localized } from "@/lib/i18n";

/**
 * Archon Lab.
 *
 * `EXPERIMENTS` are real: each one is a working piece of interface that runs
 * on the Lab page. Nothing here describes something that might exist.
 *
 * `LAB_NOTES` are open questions and stated positions. No shipped artefact is
 * claimed, because none can be verified yet.
 */

export type ExperimentKind = "field" | "composer" | "cadence";

export type Experiment = {
  id: string;
  title: Localized;
  field: Localized;
  note: Localized;
  kind: ExperimentKind;
};

export const EXPERIMENTS: Experiment[] = [
  {
    id: "001",
    title: { en: "Displacement field", tr: "Yer değiştirme alanı" },
    field: { en: "Interaction", tr: "Etkileşim" },
    note: {
      en: "A field of points that yields to the pointer and settles back. A test of how much feedback an interface can give before the feedback becomes the content. Move over it, or drag on a touch screen.",
      tr: "İmlece boyun eğen ve sonra yerine oturan bir nokta alanı. Bir arayüzün, geri bildirim içeriğe dönüşmeden önce ne kadar geri bildirim verebileceğinin testi. Üstünde gez, ya da dokunmatik ekranda sürükle.",
    },
    kind: "field",
  },
  {
    id: "002",
    title: { en: "Generative composition", tr: "Üretken kompozisyon" },
    field: { en: "Interface", tr: "Arayüz" },
    note: {
      en: "A deterministic layout generator: every composition comes from a seed, so the same number always draws the same thing. Press the button and it draws another.",
      tr: "Deterministik bir yerleşim üreteci: her kompozisyon bir tohumdan geliyor, yani aynı sayı her zaman aynı şeyi çiziyor. Butona bas, bir yenisini çizsin.",
    },
    kind: "composer",
  },
  {
    id: "003",
    title: { en: "Scroll cadence", tr: "Kaydırma temposu" },
    field: { en: "Motion", tr: "Hareket" },
    note: {
      en: "Type that reads the velocity of your scroll and answers it. Used to find where motion aids comprehension and where it is only noise — scroll this page and watch the readout.",
      tr: "Kaydırma hızını okuyup ona cevap veren tipografi. Hareketin anlamayı nerede kolaylaştırdığını, nerede sadece gürültü olduğunu bulmak için — sayfayı kaydır ve göstergeyi izle.",
    },
    kind: "cadence",
  },
];

export type LabStatus = "OPEN" | "IN PROGRESS";

export type LabNote = {
  index: string;
  title: Localized;
  position: Localized;
  field: Localized;
  status: LabStatus;
  diagram: DiagramKind;
};

export const LAB_NOTES: LabNote[] = [
  {
    index: "L/01",
    title: {
      en: "How much of a social product can be decided before launch?",
      tr: "Bir sosyal ürünün ne kadarına yayından önce karar verilebilir?",
    },
    position: {
      en: "Almost none of the interesting parts. Meetzy answered questions in its first weeks that no amount of planning would have settled, which is an argument for shipping narrow rather than for planning harder.",
      tr: "İlginç kısımların neredeyse hiçbirine. Meetzy ilk haftalarında, hiçbir planlamanın çözemeyeceği soruları cevapladı; bu, daha çok plan yapmanın değil, dar kapsamda yayına çıkmanın lehine bir argüman.",
    },
    field: { en: "Product", tr: "Ürün" },
    status: "IN PROGRESS",
    diagram: "planes",
  },
  {
    index: "L/02",
    title: {
      en: "What is a millisecond actually worth?",
      tr: "Bir milisaniye gerçekten ne kadar değerli?",
    },
    position: {
      en: "Perceived speed is mostly sequencing, not throughput. Measuring where deliberate delay improves comprehension and where every frame of latency is pure cost.",
      tr: "Algılanan hız çoğunlukla sıralamayla ilgili, verimle değil. Kasıtlı gecikmenin anlamayı nerede iyileştirdiğini, gecikmenin nerede saf maliyet olduğunu ölçüyorum.",
    },
    field: { en: "Performance", tr: "Performans" },
    status: "IN PROGRESS",
    diagram: "cadence",
  },
  {
    index: "L/03",
    title: {
      en: "Can an admin panel be a product rather than a leftover?",
      tr: "Yönetim paneli, artık bir şey değil de ürün olabilir mi?",
    },
    position: {
      en: "The people who use it every day are users too, and they never get a design. Working on patterns that make an operations surface worth opening.",
      tr: "Onu her gün kullananlar da kullanıcı ve hiçbir zaman tasarım almıyorlar. Bir operasyon ekranını açmaya değer kılan desenler üzerinde çalışıyorum.",
    },
    field: { en: "Interface", tr: "Arayüz" },
    status: "OPEN",
    diagram: "stack",
  },
  {
    index: "L/04",
    title: {
      en: "What does an interface owe you when the model is unsure?",
      tr: "Model emin değilken arayüzün sana borcu nedir?",
    },
    position: {
      en: "Confidence is a design problem, not a model problem. Looking for patterns that show uncertainty honestly and make the correction path faster than the accept path.",
      tr: "Güven bir model problemi değil, tasarım problemi. Belirsizliği dürüstçe gösteren ve düzeltme yolunu kabul etme yolundan hızlı yapan desenler arıyorum.",
    },
    field: { en: "Applied intelligence", tr: "Uygulamalı yapay zekâ" },
    status: "OPEN",
    diagram: "nodes",
  },
  {
    index: "L/05",
    title: {
      en: "Can automation stay legible?",
      tr: "Otomasyon okunur kalabilir mi?",
    },
    position: {
      en: "An automated process nobody can inspect is a liability with good margins. Prototyping tooling where every automated decision leaves a trail a non-engineer can audit.",
      tr: "Kimsenin denetleyemediği otomatik bir süreç, kâr marjı yüksek bir risktir. Her otomatik kararın, mühendis olmayan birinin denetleyebileceği bir iz bıraktığı araçlar deniyorum.",
    },
    field: { en: "Automation", tr: "Otomasyon" },
    status: "OPEN",
    diagram: "flow",
  },
];
