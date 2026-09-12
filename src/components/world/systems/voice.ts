/**
 * The guides' voices.
 *
 * Speech is synthesised by the browser from the same text the panel shows,
 * so nothing is recorded, nothing is downloaded, and a guide can never say
 * something the page does not also print. The transcript is the source; the
 * voice is a rendering of it.
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
};

let state: VoiceState = {
  supported: false,
  enabled: false,
  speaking: false,
  paused: false,
  current: null,
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
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  state = { ...state, supported };
}

/** Pick a voice for the language. The browser's default for it, or the first match. */
function voiceFor(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const prefix = lang.slice(0, 2).toLowerCase();
  return (
    voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase() && v.default) ??
    voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
    null
  );
}

export const voiceStore = {
  subscribe(listener: () => void) {
    check();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => state,

  /** Must be called from a user gesture the first time. */
  enable(on: boolean) {
    check();
    if (!state.supported) return;
    if (!on) {
      window.speechSynthesis.cancel();
      set({ enabled: false, speaking: false, paused: false, current: null });
      return;
    }
    /* Some engines only populate the voice list after the first call. */
    window.speechSynthesis.getVoices();
    set({ enabled: true });
  },

  speak(id: string, text: string, lang: string) {
    check();
    if (!state.supported || !state.enabled) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const voice = voiceFor(lang);
    if (voice) utterance.voice = voice;
    utterance.rate = 0.98;
    utterance.pitch = 1;
    utterance.onstart = () => set({ speaking: true, paused: false, current: id });
    utterance.onend = () => set({ speaking: false, paused: false, current: null });
    utterance.onerror = () => set({ speaking: false, paused: false, current: null });
    synth.speak(utterance);
    set({ speaking: true, paused: false, current: id });
  },

  pause() {
    if (!state.supported || !state.speaking) return;
    window.speechSynthesis.pause();
    set({ paused: true });
  },

  resume() {
    if (!state.supported || !state.speaking) return;
    window.speechSynthesis.resume();
    set({ paused: false });
  },

  stop() {
    if (!state.supported) return;
    window.speechSynthesis.cancel();
    set({ speaking: false, paused: false, current: null });
  },
};
