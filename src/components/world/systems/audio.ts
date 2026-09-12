/**
 * Sound, made rather than loaded.
 *
 * A room tone and two interface sounds, synthesised in the browser. Nothing is
 * downloaded: a convincing ambience for a large concrete interior is filtered
 * noise with a slow swell on it, and shipping a megabyte of loop to say that
 * would be a poor trade in a world with a transfer budget.
 *
 * Nothing starts until a person asks for it. Browsers require a gesture before
 * audio may play and they are right to — a site that makes noise at you is a
 * site you close.
 */

type Rig = {
  ctx: AudioContext;
  bed: GainNode;
  master: GainNode;
};

let rig: Rig | null = null;
let enabled = false;
const listeners = new Set<() => void>();

export const soundStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => enabled,
};

function build(): Rig | null {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  const ctx = new Ctor();

  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  /* Two seconds of noise, looped. Longer than any ear can hear repeating and
     short enough to be built in a frame. */
  const frames = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < frames; i += 1) {
    /* Brown-ish noise. White noise is a hiss; integrating it gives the low
       rumble a big room actually has. */
    last = (last + Math.random() * 2 - 1) * 0.5;
    data[i] = last * 0.6;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const shelf = ctx.createBiquadFilter();
  shelf.type = "lowpass";
  shelf.frequency.value = 320;
  shelf.Q.value = 0.4;

  const bed = ctx.createGain();
  bed.gain.value = 0.5;

  /* A very slow swell, so the room breathes rather than hums. */
  const swell = ctx.createOscillator();
  swell.frequency.value = 0.05;
  const swellDepth = ctx.createGain();
  swellDepth.gain.value = 0.16;
  swell.connect(swellDepth).connect(bed.gain);
  swell.start();

  source.connect(shelf).connect(bed).connect(master);
  source.start();

  /* Water: the same noise through a band around 900Hz, quieter, with its
     own slower swell out of phase with the wind — the sea under the decks. */
  const water = ctx.createBufferSource();
  water.buffer = buffer;
  water.loop = true;
  water.playbackRate.value = 1.31;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 900;
  band.Q.value = 0.7;
  const waterGain = ctx.createGain();
  waterGain.gain.value = 0.16;
  const lap = ctx.createOscillator();
  lap.frequency.value = 0.11;
  const lapDepth = ctx.createGain();
  lapDepth.gain.value = 0.07;
  lap.connect(lapDepth).connect(waterGain.gain);
  lap.start();
  water.connect(band).connect(waterGain).connect(master);
  water.start();

  /* The architecture: a very low hum, two detuned sines, barely there. */
  const hum = ctx.createGain();
  hum.gain.value = 0.045;
  for (const f of [55, 55.7]) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    osc.connect(hum);
    osc.start();
  }
  hum.connect(master);

  return { ctx, bed, master };
}

export async function toggleSound(): Promise<boolean> {
  if (!rig) rig = build();
  if (!rig) return false;
  if (rig.ctx.state === "suspended") await rig.ctx.resume();

  enabled = !enabled;
  const now = rig.ctx.currentTime;
  rig.master.gain.cancelScheduledValues(now);
  rig.master.gain.setValueAtTime(rig.master.gain.value, now);
  rig.master.gain.linearRampToValueAtTime(enabled ? 0.16 : 0, now + 0.7);
  listeners.forEach((listener) => listener());
  return enabled;
}

/** A short, dry click. Used when something becomes readable, and when it opens. */
export function blip(pitch = 660, length = 0.07, level = 0.06) {
  if (!enabled || !rig) return;
  const { ctx, master } = rig;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = pitch;
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(level, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
  osc.connect(gain).connect(master);
  osc.start(now);
  osc.stop(now + length + 0.02);
}

export function stopSound() {
  if (!rig || !enabled) return;
  enabled = false;
  const now = rig.ctx.currentTime;
  rig.master.gain.cancelScheduledValues(now);
  rig.master.gain.linearRampToValueAtTime(0, now + 0.3);
  listeners.forEach((listener) => listener());
}
