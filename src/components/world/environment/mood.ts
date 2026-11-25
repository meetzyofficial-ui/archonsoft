import * as THREE from "three";
import type { ZoneId } from "@/data/world-map";

/**
 * The mood of a district.
 *
 * The brief for this world is that the environment changes with the place:
 * the hub sits over a cosmic ocean, the labs over something more energetic,
 * the archive over a darker void. Rather than a material per district, every
 * district declares a handful of colours and the frame loop eases the live
 * values toward whichever set the visitor is standing in. The ocean, the fog,
 * the sky and the lights all read from the same eased values, so the whole
 * world changes together and nothing ever snaps.
 *
 * Kept outside React on purpose — it is written and read sixty times a second
 * by the render loop and never needs to render anything.
 */

export type Mood = {
  oceanDeep: THREE.Color;
  oceanShallow: THREE.Color;
  energy: THREE.Color;
  fog: THREE.Color;
  fogDensity: number;
  /** Nebula tint overhead. */
  sky: THREE.Color;
  /** Overall light level, 0.6–1.2. */
  light: number;
  /** The key light's colour: warm at the hub, cooler in the hall of screens. */
  key: THREE.Color;
};

type MoodSpec = {
  oceanDeep: string;
  oceanShallow: string;
  energy: string;
  fog: string;
  fogDensity: number;
  sky: string;
  light: number;
  /** The colour of the key light in this district. */
  key: string;
};

/* The studio's own ground is the logo's: near-black, brushed steel, and its
   orange as the only light. Product districts keep a trace of their own. */
const MOODS: Record<ZoneId | "between", MoodSpec> = {
  hub: { oceanDeep: "#0b0a0a", oceanShallow: "#55504c", energy: "#ff7300", fog: "#120f0d", fogDensity: 0.0036, sky: "#6b625b", light: 1.12, key: "#fff0e2" },
  gallery: { oceanDeep: "#0d0c0c", oceanShallow: "#625c57", energy: "#ff8a2a", fog: "#141110", fogDensity: 0.0034, sky: "#756b63", light: 1.08, key: "#ffe6d2" },
  shipped: { oceanDeep: "#0d0b0a", oceanShallow: "#5e5650", energy: "#ff7a10", fog: "#14100d", fogDensity: 0.0036, sky: "#75685d", light: 1.16, key: "#ffe9d6" },
  boards: { oceanDeep: "#0b0d12", oceanShallow: "#4a5566", energy: "#7fa8e8", fog: "#0f1115", fogDensity: 0.004, sky: "#5a6270", light: 0.98, key: "#e9edf2" },
  labs: { oceanDeep: "#0d0b0a", oceanShallow: "#54504d", energy: "#ff8a2a", fog: "#12100f", fogDensity: 0.0046, sky: "#67605a", light: 0.96, key: "#ffe3cc" },
  systems: { oceanDeep: "#0b0b0c", oceanShallow: "#5c5f63", energy: "#d5d8db", fog: "#0f0f10", fogDensity: 0.0046, sky: "#6a6d70", light: 0.92, key: "#f0f0f0" },
  archive: { oceanDeep: "#070606", oceanShallow: "#2d2926", energy: "#c75a08", fog: "#090807", fogDensity: 0.0056, sky: "#38322d", light: 0.74, key: "#e8d6c6" },
  aracimgo: { oceanDeep: "#05241f", oceanShallow: "#137a64", energy: "#3ddc97", fog: "#071a1a", fogDensity: 0.0042, sky: "#15545a", light: 0.96, key: "#eef8f2" },
  oyundal: { oceanDeep: "#0c0a2a", oceanShallow: "#3a30c0", energy: "#c8f031", fog: "#0e0c22", fogDensity: 0.0042, sky: "#4238a8", light: 1.12, key: "#fff4e2" },
  between: { oceanDeep: "#0b0a0a", oceanShallow: "#544e4a", energy: "#ff7300", fog: "#120f0d", fogDensity: 0.0038, sky: "#665d56", light: 0.96, key: "#fff0e2" },
};

const toMood = (spec: MoodSpec): Mood => ({
  key: new THREE.Color(spec.key),
  oceanDeep: new THREE.Color(spec.oceanDeep),
  oceanShallow: new THREE.Color(spec.oceanShallow),
  energy: new THREE.Color(spec.energy),
  fog: new THREE.Color(spec.fog),
  fogDensity: spec.fogDensity,
  sky: new THREE.Color(spec.sky),
  light: spec.light,
});

const targets = Object.fromEntries(
  Object.entries(MOODS).map(([id, spec]) => [id, toMood(spec)]),
) as Record<string, Mood>;

const current = toMood(MOODS.hub);
let targetId: string = "hub";

export const moodStore = {
  /** The live, eased values. Read from the frame loop; never mutate. */
  current,
  set(zone: string) {
    targetId = zone in targets ? zone : "between";
  },
  /** Ease toward the target. Called once a frame from the environment. */
  step(delta: number) {
    const target = targets[targetId] ?? targets.between!;
    const k = 1 - Math.exp(-1.6 * delta);
    current.oceanDeep.lerp(target.oceanDeep, k);
    current.oceanShallow.lerp(target.oceanShallow, k);
    current.energy.lerp(target.energy, k);
    current.fog.lerp(target.fog, k);
    current.sky.lerp(target.sky, k);
    current.key.lerp(target.key, k);
    current.fogDensity += (target.fogDensity - current.fogDensity) * k;
    current.light += (target.light - current.light) * k;
    /* A passing event's colour, laid over the sky and the fog this frame. */
    if (tintAmount > 0) {
      current.sky.lerp(tintColour, tintAmount);
      tintAmount = 0;
    }
  },
  /** Colour the sky a little, for this frame only — a comet, a flare. */
  tint(amount: number, colour: string) {
    tintAmount = amount;
    tintColour.set(colour);
  },
};

let tintAmount = 0;
const tintColour = new THREE.Color();
