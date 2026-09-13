import * as THREE from "three";

/**
 * A person, in one draw.
 *
 * The figures used to be built as a tree of sixty-odd small meshes — a thigh,
 * a knee, a shoe, an eyelid — each its own draw call, so the office floors
 * and the plaza cost more in people than in architecture. Here the same
 * figure, part for part, is baked into one skinned geometry: every primitive
 * is placed in the pose it was authored in and rides a bone named exactly
 * like the group it used to sit in (`legL`, `shinR`, `foreR`, `head`, `lidL`,
 * `lipLower`…), so every line of animation that turned those groups turns
 * the bones instead, unchanged. Skinning is rigid — one bone per vertex —
 * because the parts are rigid.
 *
 * Colour, roughness, metalness and glow travel per vertex, so a whole person
 * shares one material with every other person: one shader, compiled once.
 * Open shells (a coat, a skirt, a bob) are baked with their inside faces
 * rather than drawn double-sided.
 *
 * Three tiers of detail share one buffer: the parts are sorted by tier, and
 * each tier is a draw range over the same index — the silhouette, then what
 * reads at a walk, then the face and the fingers — so switching a tier is
 * swapping which range is drawn, with nothing uploaded. Buffers are cached
 * by what the person looks like, so the twelve dressings of the crowd are
 * built once however many times they are worn.
 */

export type HairStyle = "short" | "cropped" | "long" | "bun" | "curly" | "ponytail" | "bob";

export type PersonSpec = {
  frame: { height: number; shoulders: number; build: number; hair: HairStyle | string };
  wardrobe: {
    cloth: string;
    cloth2: string;
    shirt: string;
    accent: string;
    accessory: "tablet" | "badge" | "folio" | "bag" | "headphones" | "none";
    coat: boolean;
    skirt?: boolean;
    sneakers?: boolean;
    scarf?: boolean;
  };
  skin: string;
  hair: string;
  /** Pre-tinted colours are resolved by the caller; this is what gets baked. */
  skinLit: string;
  shirtLit: string;
  clothLit: string;
  iris: string;
};

/* ------------------------------------------------------------------ bones */

type V3 = [number, number, number];

type BoneDef = { name: string; parent: number; at: V3; turn?: V3; scale?: V3 };

const BONE = {
  body: 0,
  legL: 1,
  shinL: 2,
  legR: 3,
  shinR: 4,
  armL: 5,
  foreL: 6,
  armR: 7,
  foreR: 8,
  head: 9,
  face: 10,
  eyeL: 11,
  eyeR: 12,
  gazeL: 13,
  gazeR: 14,
  lidL: 15,
  lidR: 16,
  browL: 17,
  browR: 18,
  mouth: 19,
  lipLower: 20,
} as const;
type BoneName = keyof typeof BONE;

function boneDefs(sh: number): BoneDef[] {
  return [
    { name: "body", parent: -1, at: [0, 0, 0] },
    { name: "legL", parent: BONE.body, at: [-0.1, 0.96, 0] },
    { name: "shinL", parent: BONE.legL, at: [0, -0.44, 0] },
    { name: "legR", parent: BONE.body, at: [0.1, 0.96, 0] },
    { name: "shinR", parent: BONE.legR, at: [0, -0.44, 0] },
    { name: "armL", parent: BONE.body, at: [-(sh + 0.04), 1.45, 0] },
    { name: "foreL", parent: BONE.armL, at: [0, -0.32, 0] },
    { name: "armR", parent: BONE.body, at: [sh + 0.04, 1.45, 0] },
    { name: "foreR", parent: BONE.armR, at: [0, -0.32, 0] },
    { name: "head", parent: BONE.body, at: [0, 1.7, 0] },
    { name: "face", parent: BONE.head, at: [0, 0, 0] },
    { name: "eyeL", parent: BONE.face, at: [-0.038, 0.014, 0.092] },
    { name: "eyeR", parent: BONE.face, at: [0.038, 0.014, 0.092] },
    { name: "gazeL", parent: BONE.eyeL, at: [0, 0, 0] },
    { name: "gazeR", parent: BONE.eyeR, at: [0, 0, 0] },
    { name: "lidL", parent: BONE.eyeL, at: [0, 0, 0], turn: [-0.35, 0, 0] },
    { name: "lidR", parent: BONE.eyeR, at: [0, 0, 0], turn: [-0.35, 0, 0] },
    { name: "browL", parent: BONE.eyeL, at: [0, 0.026, 0.007], turn: [0.2, 0, 0.14] },
    { name: "browR", parent: BONE.eyeR, at: [0, 0.026, 0.007], turn: [0.2, 0, -0.14] },
    { name: "mouth", parent: BONE.face, at: [0, -0.058, 0.098] },
    { name: "lipLower", parent: BONE.mouth, at: [0, -0.004, 0.001], scale: [0.9, 1, 1] },
  ];
}

const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();

function compose(at: V3 = [0, 0, 0], turn: V3 = [0, 0, 0], scale: V3 = [1, 1, 1], out = new THREE.Matrix4()) {
  _p.set(at[0], at[1], at[2]);
  _q.setFromEuler(_e.set(turn[0], turn[1], turn[2]));
  _s.set(scale[0], scale[1], scale[2]);
  return out.compose(_p, _q, _s);
}

/* ------------------------------------------------------------------ parts */

type Surface = { colour: string; rough: number; metal: number; emit: number };
const lambert = (colour: string): Surface => ({ colour, rough: 0.92, metal: 0, emit: 0 });
const standard = (colour: string, rough: number, metal = 0): Surface => ({ colour, rough, metal, emit: 0 });
/** What used to be an unlit, translucent glow: its colour over what it lay on, lit from within. */
const glow = (colour: string, opacity: number, over: string): Surface => ({
  colour: "#" + new THREE.Color(over).lerp(new THREE.Color(colour), opacity).getHexString(),
  rough: 0.4,
  metal: 0,
  emit: 0.85,
});

type PartDef = {
  bone: number;
  geometry: THREE.BufferGeometry;
  /** In the bone's own frame. */
  matrix: THREE.Matrix4;
  surface: Surface;
  lod: number;
  double: boolean;
};

type Place = { at?: V3; turn?: V3; scale?: V3; lod?: number };

class Builder {
  parts: PartDef[] = [];
  private bone: number = BONE.body;
  private frame = new THREE.Matrix4();
  private lod = 0;

  on(bone: BoneName, fn: () => void, lod = 0) {
    const saved = { bone: this.bone, frame: this.frame, lod: this.lod };
    this.bone = BONE[bone];
    this.frame = new THREE.Matrix4();
    this.lod = Math.max(saved.lod, lod);
    fn();
    Object.assign(this, saved);
  }

  group(place: Place, fn: () => void) {
    const saved = { frame: this.frame, lod: this.lod };
    this.frame = this.frame.clone().multiply(compose(place.at, place.turn, place.scale));
    this.lod = Math.max(this.lod, place.lod ?? 0);
    fn();
    Object.assign(this, saved);
  }

  add(geometry: THREE.BufferGeometry, surface: Surface, place: Place & { double?: boolean } = {}) {
    this.parts.push({
      bone: this.bone,
      geometry,
      matrix: this.frame.clone().multiply(compose(place.at, place.turn, place.scale)),
      surface,
      lod: Math.max(this.lod, place.lod ?? 0),
      double: place.double ?? false,
    });
  }
}

const Sphere = (r: number, w: number, h: number, ...rest: number[]) => new THREE.SphereGeometry(r, w, h, ...rest);
const Capsule = (r: number, l: number, c: number, s: number) => new THREE.CapsuleGeometry(r, l, c, s);
const Box = (x: number, y: number, z: number) => new THREE.BoxGeometry(x, y, z);
const Cylinder = (a: number, b: number, h: number, s: number, hs = 1, open = false) => new THREE.CylinderGeometry(a, b, h, s, hs, open);
const Plane = (w: number, h: number) => new THREE.PlaneGeometry(w, h);
const Circle = (r: number, s: number) => new THREE.CircleGeometry(r, s);
const Torus = (r: number, t: number, a: number, b: number, arc?: number) => new THREE.TorusGeometry(r, t, a, b, arc);

function describe(spec: PersonSpec): PartDef[] {
  const { frame, wardrobe: w, skinLit, shirtLit, clothLit, hair, iris, skin } = spec;
  const b = frame.build;
  const sh = frame.shoulders;
  const faceLine = "#" + new THREE.Color(skin).multiplyScalar(0.62).getHexString();
  const lipColour = "#" + new THREE.Color(skin).lerp(new THREE.Color("#a0524a"), 0.45).getHexString();
  const jacketY = w.coat ? 1.08 : 1.22;
  const jacketH = w.coat ? 0.78 : 0.42;
  const jacketD = 0.26 * b;
  const P = new Builder();

  /* Legs: thigh and calf with a knee between, hinged at the hip and the knee. */
  for (const side of [-1, 1]) {
    const leg = side < 0 ? "legL" : "legR";
    const shin = side < 0 ? "shinL" : "shinR";
    const trouser = lambert(w.skirt ? skinLit : w.cloth2);
    P.on(leg, () => P.add(Capsule(0.082 * b, 0.34, 4, 8), trouser, { at: [0, -0.21, 0] }));
    P.on(shin, () => {
      P.add(Sphere(0.07 * b, 8, 8), trouser, { lod: 1 });
      P.add(Capsule(0.065 * b, 0.36, 4, 8), trouser, { at: [0, -0.22, 0] });
      if (!w.skirt) P.add(Cylinder(0.068 * b, 0.068 * b, 0.02, 10), lambert("#10141f"), { at: [0, -0.405, 0], lod: 2 });
      /* Shoes ride on the shin: an upper, a sole, a heel. */
      P.add(Capsule(0.052, 0.17, 4, 8), standard(w.sneakers ? "#e6e1d8" : "#14161c", w.sneakers ? 0.8 : 0.45, 0.1), {
        at: [0, -0.465, 0.045],
        scale: [1, 0.8, 1],
        lod: 1,
      });
      P.add(Box(0.11, 0.022, 0.29), standard(w.sneakers ? "#f4f1ea" : "#0b0d12", 0.7), { at: [0, -0.505, 0.04], lod: 1 });
      P.add(Box(0.1, 0.03, 0.06), standard(w.sneakers ? "#d8d3ca" : "#0b0d12", 0.7), { at: [0, -0.49, -0.07], lod: 2 });
    });
  }

  P.on("body", () => {
    if (w.skirt) {
      P.add(Cylinder(0.17 * b, 0.26 * b, 0.42, 16, 1, true), standard(w.cloth, 0.95), { at: [0, 0.78, 0], double: true });
      /* The hem, a little irregular, lying round the skirt's edge. */
      P.add(Torus(0.258 * b, 0.012, 6, 18), standard(w.cloth, 0.95), { at: [0, 0.575, 0], turn: [Math.PI / 2 + 0.04, 0, 0.03], lod: 1 });
    }
    /* Hips; the torso, waist to chest, wider at the top. */
    P.add(Box(0.32 * b, 0.16, 0.2), lambert(w.cloth2), { at: [0, 0.98, 0] });
    P.add(Capsule(0.15 * b, 0.16, 4, 10), lambert(shirtLit), { at: [0, 1.16, 0] });
    P.add(Capsule(0.16 * b, sh * 1.4, 4, 10), lambert(clothLit), { at: [0, 1.34, 0], turn: [0, 0, Math.PI / 2] });
    /* The jacket or coat, open at the front so the shirt shows. */
    P.add(
      Cylinder(sh * 0.9 + 0.05, w.coat ? sh * 0.9 + 0.09 : sh * 0.9 + 0.03, jacketH, 14, 1, true),
      standard(clothLit, 0.92),
      { at: [0, jacketY, -0.02], scale: [1, 1, 0.62], double: true },
    );
    P.add(Circle(sh * 0.9 + 0.05, 14), standard(clothLit, 0.92), { at: [0, jacketY + jacketH / 2, -0.02], turn: [-Math.PI / 2, 0, 0], scale: [1, 0.62, 1] });
    P.add(Plane(0.1, 0.34), lambert(shirtLit), { at: [0, 1.24, 0.1 * b + 0.02], lod: 1 });
    /* Seams: the two front edges, and the hem. */
    for (const side of [-1, 1]) {
      P.add(Plane(0.006, jacketH - 0.02), lambert(w.cloth2), { at: [side * 0.06, jacketY, jacketD / 2 - 0.03 + 0.002], lod: 2 });
    }
    P.add(Plane(sh * 2 + 0.1, 0.012), lambert(w.cloth2), { at: [0, jacketY - jacketH / 2 + 0.006, jacketD / 2 - 0.03 + 0.002], lod: 2 });
    /* Lapels. */
    for (const side of [-1, 1]) {
      P.add(Box(0.06, 0.16, 0.012), standard(w.cloth2, 0.92), {
        at: [side * 0.055, jacketY + jacketH / 2 - 0.1, jacketD / 2 - 0.03 + 0.004],
        turn: [0.08, side * -0.28, side * 0.16],
        lod: 1,
      });
    }
    if (w.coat) {
      for (const side of [-1, 1]) {
        P.add(Box(0.1, 0.03, 0.14), standard(clothLit, 0.92), { at: [side * (sh + 0.01), 1.45, -0.02], turn: [0, 0, side * -0.25], lod: 1 });
      }
    }
    P.add(Cylinder(0.165 * b, 0.165 * b, 0.03, 12), standard("#1a1a20", 0.6), { at: [0, 1.055, 0], lod: 1 });
    for (const side of [-1, 1]) {
      P.add(Box(0.07, 0.09, 0.012), lambert(w.coat ? w.cloth2 : shirtLit), { at: [side * 0.07, 1.47, 0.09 * b], turn: [0.35, 0, side * -0.55], lod: 1 });
    }
    P.add(Box(sh * 2 + 0.04, 0.05, 0.16), lambert(clothLit), { at: [0, 1.47, 0], lod: 1 });
    P.add(Cylinder(0.05, 0.06, 0.1, 10), lambert(skinLit), { at: [0, 1.53, 0], lod: 1 });

    /* What they wear across the body. */
    if (w.accessory === "badge") {
      P.group({ lod: 1 }, () => {
        P.add(Box(0.003, 0.24, 0.003), lambert(w.accent), { at: [0, 1.36, 0.13 * b] });
        P.add(Plane(0.08, 0.11), glow(w.accent, 0.8, shirtLit), { at: [0, 1.2, 0.14 * b] });
        P.add(Plane(0.064, 0.07), lambert("#2a2530"), { at: [0, 1.19, 0.14 * b + 0.002], lod: 2 });
        P.add(Plane(0.064, 0.012), glow("#ffffff", 0.75, "#2a2530"), { at: [0, 1.235, 0.14 * b + 0.003], lod: 2 });
      });
    }
    if (w.accessory === "bag") {
      P.group({ lod: 1 }, () => {
        P.add(Box(0.02, 0.5, 0.02), lambert(w.cloth2), { at: [0.06, 1.28, 0], turn: [0, 0, -0.5] });
        P.add(Box(0.1, 0.2, 0.22), standard(w.accent, 0.7, 0.05), { at: [-0.2 * b, 0.98, -0.02], turn: [0, 0, 0.1] });
      });
    }
    if (w.accessory === "headphones") {
      P.add(Torus(0.1, 0.02, 8, 18, Math.PI * 1.4), standard("#1a1c22", 0.5, 0.4), { at: [0, 1.5, 0.03], turn: [Math.PI / 2 + 0.3, 0, 0], lod: 1 });
    }
    if ((w.coat && w.accessory === "folio") || w.scarf) {
      P.add(Torus(0.1, 0.045, 8, 16), standard(w.accent, 0.95), { at: [0, 1.5, 0.02], turn: [Math.PI / 2, 0, 0], lod: 1 });
    }
  });

  /* Arms. */
  for (const side of [-1, 1]) {
    const arm = side < 0 ? "armL" : "armR";
    const fore = side < 0 ? "foreL" : "foreR";
    P.on(arm, () => {
      P.add(Sphere(0.07 * b, 8, 8), lambert(clothLit), { lod: 1 });
      P.add(Capsule(0.055 * b, 0.22, 4, 8), lambert(clothLit), { at: [0, -0.17, 0] });
    });
    P.on(fore, () => {
      P.add(Capsule(0.05 * b, 0.2, 4, 8), lambert(w.coat ? clothLit : shirtLit), { at: [0, -0.14, 0] });
      P.add(Cylinder(0.053 * b, 0.05 * b, 0.03, 10), lambert(w.coat ? w.accent : w.cloth2), { at: [0, -0.245, 0], lod: 1 });
      /* The hand: a palm, and — close up — four fingers and a thumb. */
      P.group({ at: [0, -0.3, 0], lod: 1 }, () => {
        P.add(Sphere(0.05, 8, 8), lambert(skinLit), { scale: [0.85, 1.1, 0.55] });
        for (let i = 0; i < 4; i += 1) {
          P.add(Capsule(0.008, 0.03, 2, 5), lambert(skinLit), { at: [-0.024 + i * 0.016, -0.045, 0.004], turn: [0.25, 0, 0], lod: 2 });
        }
        P.add(Capsule(0.008, 0.024, 2, 5), lambert(skinLit), { at: [side * 0.036, -0.015, 0.018], turn: [0.6, 0, side * 0.9], lod: 2 });
      });
      if (w.accessory === "tablet" && side > 0) {
        P.group({ at: [0.02, -0.3, 0.1], turn: [-0.5, 0, 0], lod: 1 }, () => {
          P.add(Box(0.2, 0.28, 0.012), standard("#0c1220", 0.3, 0.5));
          P.add(Plane(0.17, 0.24), glow(w.accent, 0.55, "#0c1220"), { at: [0, 0, 0.008] });
          [0.07, 0.02, -0.03, -0.08].forEach((y, i) => {
            P.add(Plane(0.1 - (i % 2) * 0.03, 0.008), glow("#eaf4ff", 0.7, w.accent), { at: [-0.02 + (i % 2) * 0.01, y, 0.01], lod: 2 });
          });
        });
      }
      if (w.accessory === "folio" && side < 0) {
        P.group({ at: [-0.02, -0.16, 0.02], turn: [0, 0, 0.1], lod: 1 }, () => {
          P.add(Box(0.05, 0.34, 0.26), standard("#f1e9dc", 0.7));
          P.add(Box(0.004, 0.34, 0.26), lambert(w.accent), { at: [-0.026, 0, 0], lod: 2 });
          P.add(Box(0.054, 0.02, 0.27), lambert(w.accent), { at: [0, 0.02, 0], lod: 2 });
        });
      }
    });
  }

  /* Head: a skull, a jaw, cheeks, a chin, ears. */
  const skinSurface = standard(skinLit, 0.72);
  P.on("head", () => {
    P.add(Sphere(0.108, 16, 14), skinSurface, { scale: [1, 1.12, 1.02] });
    P.add(Sphere(0.104, 12, 10), skinSurface, { at: [0, 0.03, -0.012], scale: [0.98, 0.98, 1.06], lod: 1 });
    P.add(Sphere(0.1, 12, 8), skinSurface, { at: [0, -0.07, 0.018], scale: [0.8, 0.58, 0.82], lod: 1 });
    P.add(Sphere(0.032, 8, 8), skinSurface, { at: [0, -0.115, 0.055], scale: [0.8, 0.6, 0.7], lod: 2 });
    for (const side of [-1, 1]) {
      P.add(Sphere(0.036, 8, 8), skinSurface, { at: [side * 0.055, -0.03, 0.062], scale: [1, 0.8, 0.7], lod: 2 });
      P.add(Sphere(0.024, 8, 8), skinSurface, { at: [side * 0.106, -0.005, -0.005], scale: [0.6, 1.2, 0.8], lod: 1 });
    }
    hairParts(P, frame.hair as HairStyle, hair);
  });

  /* The face, close up: sockets, eyes that blink and look, brows that rise,
     a nose, lips that smile and speak. */
  P.on(
    "face",
    () => {
      for (const side of [-1, 1]) {
        const L = side < 0;
        P.on(L ? "eyeL" : "eyeR", () => {
          P.add(Sphere(0.017, 8, 8), standard(faceLine, 0.8), { at: [0, 0, -0.006], scale: [1.5, 1.1, 0.5] });
          P.add(Sphere(0.0165, 10, 8), standard("#f1ede6", 0.25), { scale: [1, 0.78, 0.55] });
          P.add(Box(0.03, 0.004, 0.006), standard(faceLine, 0.8), { at: [0, -0.011, 0.006], turn: [0.5, 0, 0] });
        });
        P.on(L ? "gazeL" : "gazeR", () => {
          P.add(Sphere(0.0078, 10, 8), standard(iris, 0.3), { at: [0, 0, 0.0085], scale: [1, 1, 0.3] });
          P.add(Sphere(0.0036, 8, 6), standard("#0c0a0c", 0.4), { at: [0, 0, 0.0104], scale: [1, 1, 0.3] });
          P.add(Sphere(0.0014, 6, 6), { colour: "#ffffff", rough: 0.2, metal: 0, emit: 1 }, { at: [side * 0.003, 0.003, 0.0118] });
        });
        P.on(L ? "lidL" : "lidR", () => {
          P.add(Sphere(0.0175, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), standard(skinLit, 0.72), { scale: [1.06, 0.84, 0.6] });
        });
        P.on(L ? "browL" : "browR", () => P.add(Box(0.034, 0.006, 0.009), standard(hair, 0.9)));
      }
      P.add(Box(0.014, 0.036, 0.014), standard(skinLit, 0.7), { at: [0, -0.005, 0.104], turn: [0.28, 0, 0] });
      P.add(Sphere(0.011, 8, 8), standard(skinLit, 0.7), { at: [0, -0.028, 0.114], scale: [1.15, 0.9, 1] });
      P.on("mouth", () => P.add(Box(0.034, 0.005, 0.008), standard(lipColour, 0.55), { at: [0, 0.003, 0], turn: [0.2, 0, 0] }));
      P.on("lipLower", () => P.add(Box(0.034, 0.007, 0.009), standard(lipColour, 0.5)));
    },
    2,
  );

  return P.parts;
}

/** Hair, as layered masses: a cap over the skull, and what the style adds. */
function hairParts(P: Builder, style: HairStyle, colour: string) {
  const s = standard(colour, 0.88);
  P.add(Sphere(0.11, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), s, { at: [0, 0.042, -0.012], scale: [1.04, 1.08, 1.05] });
  if (style === "short") {
    P.add(Sphere(0.062, 10, 8), s, { at: [0.02, 0.078, 0.07], turn: [0.4, 0, -0.25], scale: [1, 0.5, 0.7], lod: 1 });
    for (const side of [-1, 1]) P.add(Sphere(0.04, 8, 8), s, { at: [side * 0.1, 0, 0.01], scale: [0.45, 1.1, 0.8], lod: 1 });
  } else if (style === "cropped") {
    P.add(Sphere(0.09, 10, 8), s, { at: [0, 0.07, 0.03], scale: [1, 0.45, 0.9], lod: 1 });
  } else if (style === "long") {
    P.add(Capsule(0.08, 0.2, 4, 10), s, { at: [0, -0.09, -0.06], scale: [1.1, 1, 0.8] });
    for (const side of [-1, 1]) P.add(Capsule(0.026, 0.16, 4, 8), s, { at: [side * 0.1, -0.05, -0.005], turn: [0, 0, side * 0.06], lod: 1 });
    P.add(Sphere(0.06, 8, 8), s, { at: [-0.03, 0.08, 0.075], turn: [0.5, 0, 0.3], scale: [1, 0.45, 0.6], lod: 1 });
  } else if (style === "bun") {
    P.add(Sphere(0.048, 10, 8), s, { at: [0, 0.09, -0.11] });
    P.add(Sphere(0.06, 8, 8), s, { at: [0, 0.065, -0.07], scale: [1, 0.5, 1], lod: 1 });
    P.add(Sphere(0.055, 8, 8), s, { at: [0.025, 0.085, 0.07], turn: [0.4, 0, -0.2], scale: [1, 0.4, 0.6], lod: 1 });
  } else if (style === "curly") {
    const curls: V3[] = [[-0.06, 0.09, 0.02], [0.06, 0.09, 0.02], [0, 0.11, -0.03], [-0.07, 0.05, -0.06], [0.07, 0.05, -0.06], [0, 0.085, 0.075]];
    curls.forEach((at, i) => P.add(Sphere(0.052, 8, 8), s, { at, scale: [1, 0.9, 1], lod: i > 2 ? 1 : 0 }));
  } else if (style === "ponytail") {
    P.add(Capsule(0.032, 0.22, 4, 8), s, { at: [0, 0.03, -0.11], turn: [0.9, 0, 0] });
    P.add(Sphere(0.035, 8, 8), s, { at: [0, 0.07, -0.09] });
    P.add(Sphere(0.056, 8, 8), s, { at: [0.02, 0.085, 0.072], turn: [0.5, 0, -0.35], scale: [1, 0.4, 0.6], lod: 1 });
  } else if (style === "bob") {
    P.add(Cylinder(0.105, 0.115, 0.14, 14, 1, true), s, { at: [0, -0.02, -0.02], scale: [1.12, 1, 1.08], double: true });
    P.add(Sphere(0.062, 8, 8), s, { at: [0, 0.082, 0.07], turn: [0.45, 0, 0], scale: [1.05, 0.4, 0.6], lod: 1 });
  }
}

/* ------------------------------------------------------------------ bake */

export type PersonShape = {
  bones: BoneDef[];
  inverses: THREE.Matrix4[];
  /** Tier 0, 1, 2: one buffer, three draw ranges. */
  tiers: [THREE.BufferGeometry, THREE.BufferGeometry, THREE.BufferGeometry];
};

const NORMAL = new THREE.Matrix3();
const V = new THREE.Vector3();

function bake(spec: PersonSpec): PersonShape {
  const bones = boneDefs(spec.frame.shoulders);
  const rest: THREE.Matrix4[] = [];
  for (const def of bones) {
    const local = compose(def.at, def.turn, def.scale);
    rest.push(def.parent < 0 ? local : rest[def.parent]!.clone().multiply(local));
  }
  const inverses = rest.map((m) => m.clone().invert());

  const parts = describe(spec).sort((a, b) => a.lod - b.lod);
  let vertices = 0;
  let indices = 0;
  for (const part of parts) {
    const count = part.geometry.attributes.position!.count;
    const index = part.geometry.index ? part.geometry.index.count : count;
    vertices += count * (part.double ? 2 : 1);
    indices += index * (part.double ? 2 : 1);
  }
  const position = new Float32Array(vertices * 3);
  const normal = new Float32Array(vertices * 3);
  const colour = new Float32Array(vertices * 3);
  const pbr = new Uint8Array(vertices * 3);
  const skinIndex = new Uint8Array(vertices * 4);
  const skinWeight = new Uint8Array(vertices * 4);
  const index = vertices > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);
  const ends = [0, 0, 0];

  let v = 0;
  let i = 0;
  const c = new THREE.Color();
  const world = new THREE.Matrix4();
  for (const part of parts) {
    world.multiplyMatrices(rest[part.bone]!, part.matrix);
    NORMAL.getNormalMatrix(world);
    c.set(part.surface.colour);
    const src = part.geometry;
    const pos = src.attributes.position!;
    const nor = src.attributes.normal!;
    const idx = src.index;
    const count = pos.count;
    const passes = part.double ? 2 : 1;
    for (let pass = 0; pass < passes; pass += 1) {
      const base = v;
      const flip = pass === 1 ? -1 : 1;
      for (let k = 0; k < count; k += 1) {
        V.fromBufferAttribute(pos, k).applyMatrix4(world);
        position[v * 3] = V.x;
        position[v * 3 + 1] = V.y;
        position[v * 3 + 2] = V.z;
        V.fromBufferAttribute(nor, k).applyMatrix3(NORMAL).normalize().multiplyScalar(flip);
        normal[v * 3] = V.x;
        normal[v * 3 + 1] = V.y;
        normal[v * 3 + 2] = V.z;
        colour[v * 3] = c.r;
        colour[v * 3 + 1] = c.g;
        colour[v * 3 + 2] = c.b;
        pbr[v * 3] = Math.round(part.surface.rough * 255);
        pbr[v * 3 + 1] = Math.round(part.surface.metal * 255);
        pbr[v * 3 + 2] = Math.round(part.surface.emit * 255);
        skinIndex[v * 4] = part.bone;
        skinWeight[v * 4] = 255;
        v += 1;
      }
      const n = idx ? idx.count : count;
      for (let k = 0; k < n; k += 3) {
        const a = idx ? idx.getX(k) : k;
        const b2 = idx ? idx.getX(k + 1) : k + 1;
        const c2 = idx ? idx.getX(k + 2) : k + 2;
        index[i] = base + a;
        index[i + 1] = base + (pass === 1 ? c2 : b2);
        index[i + 2] = base + (pass === 1 ? b2 : c2);
        i += 3;
      }
    }
    src.dispose();
    for (let tier = part.lod; tier < 3; tier += 1) ends[tier] = i;
  }

  const attributes = {
    position: new THREE.BufferAttribute(position, 3),
    normal: new THREE.BufferAttribute(normal, 3),
    color: new THREE.BufferAttribute(colour, 3),
    pbr: new THREE.BufferAttribute(pbr, 3, true),
    skinIndex: new THREE.BufferAttribute(skinIndex, 4),
    skinWeight: new THREE.BufferAttribute(skinWeight, 4, true),
  };
  const indexAttribute = new THREE.BufferAttribute(index, 1);
  const tiers = [0, 1, 2].map((tier) => {
    const g = new THREE.BufferGeometry();
    for (const [name, attribute] of Object.entries(attributes)) g.setAttribute(name, attribute);
    g.setIndex(indexAttribute);
    g.setDrawRange(0, ends[tier]!);
    /* The skinned mesh carries its own bounds; this keeps a stray call to
       the geometry's from walking the vertices. */
    g.boundingSphere = BOUNDS.clone();
    return g;
  }) as PersonShape["tiers"];
  return { bones, inverses, tiers };
}

/** Generous enough for a raised arm or a seated pose, in the person's own frame. */
const BOUNDS = new THREE.Sphere(new THREE.Vector3(0, 0.95, 0), 1.45);

const shapes = new Map<string, PersonShape>();

export function personShape(spec: PersonSpec): PersonShape {
  const key = JSON.stringify(spec);
  let shape = shapes.get(key);
  if (!shape) {
    shape = bake(spec);
    shapes.set(key, shape);
  }
  return shape;
}

/* --------------------------------------------------------------- material */

let material: THREE.MeshStandardMaterial | null = null;

/**
 * The one material every person is drawn with: standard shading, colour
 * from the vertex, and roughness, metalness and glow from a second vertex
 * attribute.
 */
export function personMaterial() {
  if (material) return material;
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });
  /* Cloth and skin were lit without the environment's reflection; a little
     of it keeps them in the scene without making them glossy. */
  m.envMapIntensity = 0.55;
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec3 pbr;\nvarying vec3 vPbr;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPbr = pbr;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vPbr;")
      .replace("vec3 totalEmissiveRadiance = emissive;", "vec3 totalEmissiveRadiance = vColor.rgb * vPbr.z * 1.6;")
      .replace("#include <roughnessmap_fragment>", "float roughnessFactor = vPbr.x;")
      .replace("#include <metalnessmap_fragment>", "float metalnessFactor = vPbr.y;");
  };
  m.customProgramCacheKey = () => "archon-person-1";
  material = m;
  return m;
}

/* --------------------------------------------------------------- instance */

export type PersonRig = {
  root: THREE.Group;
  mesh: THREE.SkinnedMesh;
  face: THREE.Object3D;
  tier: number;
  setTier: (tier: number) => void;
  dispose: () => void;
};

const IDENTITY = new THREE.Matrix4();

export function createPerson(spec: PersonSpec, k: number): PersonRig {
  const shape = personShape(spec);
  const root = new THREE.Group();
  root.name = "npc";
  root.scale.setScalar(k);
  const bones = shape.bones.map((def) => {
    const bone = new THREE.Bone();
    bone.name = def.name;
    bone.position.set(...def.at);
    if (def.turn) bone.rotation.set(...def.turn);
    if (def.scale) bone.scale.set(...def.scale);
    return bone;
  });
  shape.bones.forEach((def, n) => {
    if (def.parent >= 0) bones[def.parent]!.add(bones[n]!);
  });
  root.add(bones[0]!);
  const skeleton = new THREE.Skeleton(bones, shape.inverses);
  const mesh = new THREE.SkinnedMesh(shape.tiers[2], personMaterial());
  mesh.bind(skeleton, IDENTITY);
  mesh.boundingSphere = BOUNDS.clone();
  root.add(mesh);
  const face = bones[BONE.face]!;
  const rig: PersonRig = {
    root,
    mesh,
    face,
    tier: 2,
    setTier(tier) {
      if (tier === rig.tier) return;
      rig.tier = tier;
      root.visible = tier >= 0;
      if (tier >= 0) mesh.geometry = shape.tiers[Math.min(2, tier)]!;
      /* Nothing draws a bone; the flag tells the face animation to rest. */
      face.visible = tier >= 2;
    },
    dispose() {
      skeleton.dispose();
    },
  };
  root.userData.person = rig;
  return rig;
}

/** The rig inside a figure's group, if it has one. */
export function rigIn(fig: THREE.Object3D | null | undefined): PersonRig | null {
  if (!fig) return null;
  if (fig.userData.person) return fig.userData.person as PersonRig;
  for (const child of fig.children) if (child.userData.person) return child.userData.person as PersonRig;
  return null;
}
