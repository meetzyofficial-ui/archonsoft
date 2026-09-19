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

const MOODS: Record<ZoneId | "between", MoodSpec> = {
  /* The hub: the cosmic ocean proper. */
  hub: {
    oceanDeep: "#071a36",
    oceanShallow: "#1b75b8",
    energy: "#4cceff",
    fog: "#0b1634",
    fogDensity: 0.0036,
    sky: "#2a4aa0",
    light: 1,
    key: "#ffe9d5",
  },
  /* Above the hub — the same sea, seen from higher, a little brighter. */
  gallery: {
    oceanDeep: "#0a1c3e",
    oceanShallow: "#2a7cc4",
    energy: "#8b72ff",
    fog: "#0d1436",
    fogDensity: 0.0034,
    sky: "#2d50a8",
    light: 1.08,
    key: "#e6dcff",
  },
  /* Shipped: the brightest water, a luminous digital sea. */
  shipped: {
    oceanDeep: "#0a2850",
    oceanShallow: "#2488d0",
    energy: "#54d9ff",
    fog: "#0b1834",
    fogDensity: 0.0036,
    sky: "#2e5ab0",
    light: 1.06,
    key: "#ffd9c4",
  },
  /* The hall of screens: DP Pano's own blue. */
  boards: {
    oceanDeep: "#081c3e",
    oceanShallow: "#2470c8",
    energy: "#6fcbff",
    fog: "#0a1632",
    fogDensity: 0.0040,
    sky: "#2648a6",
    light: 0.98,
    key: "#dbe9ff",
  },
  /* Labs: energetic, tipping toward violet. */
  labs: {
    oceanDeep: "#141238",
    oceanShallow: "#5a48c8",
    energy: "#b08cff",
    fog: "#120f30",
    fogDensity: 0.0046,
    sky: "#5a3aa8",
    light: 0.94,
    key: "#d9ccff",
  },
  /* Systems: cold cyan, precise. */
  systems: {
    oceanDeep: "#0a1e30",
    oceanShallow: "#1e7a96",
    energy: "#4ff0e0",
    fog: "#0a1826",
    fogDensity: 0.0046,
    sky: "#1e5a78",
    light: 0.9,
    key: "#cfeff5",
  },
  /* Archive: the void. Water almost gone, stars very close. */
  archive: {
    oceanDeep: "#050818",
    oceanShallow: "#182c60",
    energy: "#6a7cff",
    fog: "#06091a",
    fogDensity: 0.0056,
    sky: "#1a2860",
    light: 0.72,
    key: "#c8d0ff",
  },
  /* AracımGo: deep emerald water under a dark-teal sky, a clean white key
     — a workshop under good light. */
  aracimgo: {
    oceanDeep: "#05241f",
    oceanShallow: "#137a64",
    energy: "#3ddc97",
    fog: "#071a1a",
    fogDensity: 0.0042,
    sky: "#15545a",
    light: 0.96,
    key: "#eef8f2",
  },
  /* The bridges between islands: halfway to nowhere. */
  between: {
    oceanDeep: "#071a36",
    oceanShallow: "#1e78bc",
    energy: "#4cceff",
    fog: "#0b1634",
    fogDensity: 0.0038,
    sky: "#28489c",
    light: 0.96,
    key: "#ffe4cc",
  },
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
