/**
 * The guides' voices.
 *
 * Speech is rendered from the same text the panel shows, so a guide can never
 * say something the page does not also print. The transcript is the source;
 * the voice is a rendering of it.
 *
 * The rendering is a provider. The one this site ships is the browser's own
 * speech synthesis — nothing recorded, nothing downloaded, no key — and it is
 * asked for the best voice the device has for the language: a woman's voice,
 * a natural or neural one where the platform offers it (Microsoft's online
 * voices, Google's, Apple's enhanced ones), the platform's default only as a
 * last resort. Text is spoken a sentence at a time, at an unhurried rate,
 * so the pauses between sentences are real pauses and no engine cuts a long
 * paragraph off halfway. A studio TTS service can replace it by implementing
 * `VoiceProvider` and calling `voiceStore.setProvider` — nothing else changes.
 * No such service is wired up here.
 *
 * Browsers will not speak until the visitor has done something, and they are
 * right to. So the voice is off until it is switched on with a control, and
 * that switch happens inside a click. Everything else — play, pause, replay,
 * mute — is state in a store the interface reads through
 * `useSyncExternalStore`, exactly like the sound and the focus.
 */

export type VoiceState = {
  supported: boolean;
  enabled: boolean;
  speaking: boolean;
  paused: boolean;
  /** Which guide is currently being read, if any. */
  current: string | null;
  /** The voice last used, by name, for the interface and the QA harness. */
  voice: string | null;
  /** Which provider renders the speech. */
  provider: string;
};

export interface VoiceProvider {
  readonly id: string;
  available(): boolean;
  /** Speak `text` in `lang`; call `onStart` once, then `onEnd` or `onError` once. */
  speak(text: string, lang: string, events: { onStart: (voice: string | null) => void; onEnd: () => void; onError: () => void }): void;
  pause(): void;
  resume(): void;
  stop(): void;
  /** Warm whatever the provider needs, from inside a user gesture. */
  prepare(): void;
}

/* ------------------------------------------------------------ the browser */

const FEMALE = /emel|yelda|filiz|seda|aria|jenny|samantha|zira|ava|allison|susan|karen|moira|tessa|serena|libby|sonia|emma|michelle|victoria|joanna|salli|kendra|kimberly|ivy|female|kadın|google (us english|türkçe)|natasha|clara|elsa|amala/i;
const MALE = /ahmet|tolga|cem|david|mark|guy|daniel|alex\b|fred|ryan|christopher|eric|george|james|thomas|brian|matthew|joey|justin|male(?!.*female)|google uk english male|erkek/i;
const NATURAL = /natural|neural|online|premium|enhanced|wavenet|siri/i;

/**
 * The voices the device has, best first for the language — deterministic,
 * ties broken by name, so the same device always picks the same voice.
 *
 * The chain: the language's own voices, a woman's before a man's, natural
 * or neural before plain, online before local, the platform's default a
 * little ahead; and if the device has no voice for the language at all,
 * every other voice by the same rules, so there is still a voice rather
 * than silence. Names are hints, not facts — a platform decides what its
 * voices are called — so nothing here is a promise about how one sounds.
 */
export function rankVoices(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice[] {
  const want = lang.toLowerCase();
  const prefix = want.slice(0, 2);
  const matches = (v: SpeechSynthesisVoice) => {
    const vl = v.lang.toLowerCase().replace("_", "-");
    return vl === want || vl.startsWith(`${prefix}-`) || vl === prefix;
  };
  const score = (v: SpeechSynthesisVoice) => {
    let s = matches(v) ? 100 : 0;
    if (FEMALE.test(v.name)) s += 40;
    if (MALE.test(v.name)) s -= 60;
    if (NATURAL.test(v.name)) s += 20;
    if (!v.localService) s += 6;
    if (v.default) s += 3;
    return s;
  };
  const own = voices.filter(matches);
  const pool = own.length ? own : voices;
  return pool
    .map((v) => [v, score(v)] as const)
    .sort((a, b) => b[1] - a[1] || a[0].name.localeCompare(b[0].name))
    .map(([v]) => v);
}

/** Sentences, and long sentences at their commas, so each utterance is short. */
export function sentences(text: string): string[] {
  const out: string[] = [];
  /* Matched rather than split on a lookbehind: older Safari cannot parse one. */
  const all = text.replace(/\s+/g, " ").trim().match(/[^.!?…]+[.!?…]*/g) ?? [];
  for (const raw of all) {
    const sentence = raw.trim();
    if (sentence.length <= 180) {
      if (sentence) out.push(sentence);
      continue;
    }
    let chunk = "";
    for (const piece of sentence.match(/[^,;:]+[,;:]*/g) ?? []) {
      const part = piece.trim();
      if ((chunk + " " + part).length > 180 && chunk) {
        out.push(chunk);
        chunk = part;
      } else chunk = chunk ? `${chunk} ${part}` : part;
    }
    if (chunk) out.push(chunk);
  }
  return out;
}

function browserProvider(): VoiceProvider {
  let token = 0;
  return {
    id: "browser",
    available: () => typeof window !== "undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function",
    prepare() {
      /* Some engines only populate the voice list after the first call. */
      try {
        window.speechSynthesis.getVoices();
      } catch {
        /* A broken engine is simply no voice. */
      }
    },
    speak(text, lang, events) {
      const synth = window.speechSynthesis;
      synth.cancel();
      const mine = (token += 1);
      let voices: SpeechSynthesisVoice[] = [];
      try {
        voices = synth.getVoices();
      } catch {
        voices = [];
      }
      const voice = rankVoices(voices, lang)[0] ?? null;
      const parts = sentences(text);
      if (!parts.length) {
        events.onEnd();
        return;
      }
      let started = false;
      parts.forEach((part, i) => {
        const utterance = new SpeechSynthesisUtterance(part);
        utterance.lang = voice?.lang ?? lang;
        if (voice) utterance.voice = voice;
        /* Unhurried, a touch warm, never loud. */
        utterance.rate = lang.startsWith("tr") ? 0.95 : 0.97;
        utterance.pitch = 1.04;
        utterance.volume = 0.85;
        utterance.onstart = () => {
          if (mine !== token || started) return;
          started = true;
          events.onStart(voice?.name ?? null);
        };
        utterance.onend = () => {
          if (mine === token && i === parts.length - 1) events.onEnd();
        };
        utterance.onerror = (event) => {
          /* A cancel for the next line is not a failure. */
          if (mine !== token || event.error === "interrupted" || event.error === "canceled") return;
          events.onError();
        };
        synth.speak(utterance);
      });
    },
    pause: () => window.speechSynthesis.pause(),
    resume: () => window.speechSynthesis.resume(),
    stop() {
      token += 1;
      window.speechSynthesis.cancel();
    },
  };
}

/* ------------------------------------------------------------------ store */

let provider: VoiceProvider | null = null;
let lastAsked: { id: string; text: string; at: number } | null = null;
const currentProvider = () => (provider ??= browserProvider());

let state: VoiceState = {
  supported: false,
  enabled: false,
  speaking: false,
  paused: false,
  current: null,
  voice: null,
  provider: "browser",
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const set = (next: Partial<VoiceState>) => {
  state = { ...state, ...next };
  emit();
};

let checked = false;
function check() {
  if (checked) return;
  checked = true;
  state = { ...state, supported: typeof window !== "undefined" && currentProvider().available(), provider: currentProvider().id };
}

export const voiceStore = {
  subscribe(listener: () => void) {
    check();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => state,

  /** Replace the speech renderer — a studio TTS service, say. */
  setProvider(next: VoiceProvider) {
    provider?.stop();
    provider = next;
    lastAsked = null;
    checked = false;
    state = { ...state, speaking: false, paused: false, current: null, voice: null };
    check();
    emit();
  },

  /** Must be called from a user gesture the first time. */
  enable(on: boolean) {
    check();
    if (!state.supported) return;
    if (!on) {
      currentProvider().stop();
      set({ enabled: false, speaking: false, paused: false, current: null });
      return;
    }
    currentProvider().prepare();
    set({ enabled: true });
  },

  speak(id: string, text: string, lang: string) {
    check();
    if (!state.supported || !state.enabled) return;
    /* The same line asked for twice in a breath — a card opening and its
       button both asking — is spoken once. */
    const now = Date.now();
    if (lastAsked && lastAsked.id === id && lastAsked.text === text && now - lastAsked.at < 800 && state.speaking) return;
    lastAsked = { id, text, at: now };
    set({ speaking: true, paused: false, current: id });
    currentProvider().speak(text, lang, {
      onStart: (voice) => set({ speaking: true, paused: false, current: id, voice }),
      onEnd: () => set({ speaking: false, paused: false, current: null }),
      onError: () => set({ speaking: false, paused: false, current: null }),
    });
  },

  pause() {
    if (!state.supported || !state.speaking) return;
    currentProvider().pause();
    set({ paused: true });
  },

  resume() {
    if (!state.supported || !state.speaking) return;
    currentProvider().resume();
    set({ paused: false });
  },

  stop() {
    if (!state.supported) return;
    lastAsked = null;
    currentProvider().stop();
    set({ speaking: false, paused: false, current: null });
  },
};

/* QA: the voice the device would be read in, best first, and the store. */
if (typeof window !== "undefined") {
  (window as unknown as { __archonVoice?: (lang?: string) => unknown }).__archonVoice = (lang = "tr-TR") => ({
    state: voiceStore.get(),
    store: voiceStore,
    ranked: "speechSynthesis" in window ? rankVoices(window.speechSynthesis.getVoices(), lang).map((v) => v.name) : [],
    sentences: sentences("Merhaba, Archon Soft'a hoş geldiniz. Ben size yardımcı olmak için buradayım. Hangi konuda birlikte çalışmak istersiniz?"),
  });
}
