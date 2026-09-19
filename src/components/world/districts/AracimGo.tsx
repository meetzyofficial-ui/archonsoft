"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Station } from "@/components/world/districts/Districts";
import { Backlight, Doorway, Glow, Island, LightLine, LightWash, Service } from "@/components/world/pieces/Kit";
import { useMerged, type Part } from "@/components/world/pieces/merge";
import { DataSurface, type SurfacePaint } from "@/components/world/pieces/Surface";
import { body } from "@/components/world/systems/body";
import { qualityStore } from "@/components/world/systems/quality";
import { CORRIDOR, getZone } from "@/data/world-map";
import type { Locale } from "@/lib/i18n";
import type { PreparedInstallation } from "@/lib/worldPayload";

/**
 * AracımGo's service hub.
 *
 * Archon Soft's live product for car workshops, as a place: a hall off the
 * west side of Shipped — the hall of screens' mirror — with a service
 * technology hub at its heart. An elevated glass canopy on brushed posts
 * with emerald light along its edges stands over the product's station; a
 * service bay either side carries a lift with a car drawn in light on it and
 * a diagnostic scan passing along it; each bay has its own small workflow
 * screen with the job on it. The signage over the passage says what the place
 * is in the product's own words, readable from the shipped hall.
 *
 * Built to cost little. Every material below takes one merged geometry, so
 * the canopy, the two bays and their cars are a dozen draws; the whole hub
 * except the sign stops being drawn once the visitor is far enough away that
 * it would be a few pixels (the sign stays: it is what the shipped hall sees).
 */

const CENTRE: [number, number] = [-59, -67];
const STATION_AT: [number, number, number] = [-62, 0, -67];
/* The two bays, north and south of the station, their cars pointing at the door. */
const BAYS = [-59.6, -74.4] as const;
const BAY_X = -62;
/* The canopy: four brushed posts, a slab of glass nine metres up. */
const CANOPY = { minX: -70, maxX: -54, minZ: -76, maxZ: -58, y: 9.2 };

const EMERALD = "#3ddc97";
const TEAL = "#0f7a63";
const CYAN = "#62d8ff";
const METAL = "#b9c3c7";

/** Distances beyond which the hub's detail is not drawn: desktop, then everything else. */
const DETAIL_AT = { desktop: 80, other: 52 };

export function AracimGoHub({
  texture,
  installation,
  locale,
}: {
  texture: THREE.Texture;
  installation?: PreparedInstallation;
  locale: Locale;
}) {
  const accent = getZone("aracimgo").accent;
  const detail = useRef<THREE.Group>(null);
  const scans = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const far = qualityStore.tier === "desktop" ? DETAIL_AT.desktop : DETAIL_AT.other;
    const shown = Math.hypot(body.x - CENTRE[0], body.z - CENTRE[1]) < far;
    if (detail.current && detail.current.visible !== shown) detail.current.visible = shown;
    if (!shown) return;
    /* The diagnostic scan: a plane of light passing nose to tail along each car. */
    const t = clock.elapsedTime;
    scans.current.forEach((scan, i) => {
      if (!scan) return;
      const k = (t * 0.28 + i * 0.5) % 1;
      scan.position.x = BAY_X + 2.3 - k * 4.6;
      (scan.material as THREE.MeshBasicMaterial).opacity = k < 0.9 ? 0.32 : 0;
    });
  });

  /* ---------------------------------------------------------- canopy */
  const posts = useMerged(
    () =>
      [
        [CANOPY.minX, CANOPY.minZ],
        [CANOPY.maxX, CANOPY.minZ],
        [CANOPY.minX, CANOPY.maxZ],
        [CANOPY.maxX, CANOPY.maxZ],
      ].map(([x, z]) => ({ geometry: new THREE.BoxGeometry(0.34, CANOPY.y, 0.34), at: [x!, CANOPY.y / 2, z!] as [number, number, number] })),
    [],
  );
  const beams = useMerged(() => {
    const w = CANOPY.maxX - CANOPY.minX;
    const d = CANOPY.maxZ - CANOPY.minZ;
    const cx = (CANOPY.minX + CANOPY.maxX) / 2;
    const cz = (CANOPY.minZ + CANOPY.maxZ) / 2;
    return [
      { geometry: new THREE.BoxGeometry(w + 0.6, 0.36, 0.4), at: [cx, CANOPY.y, CANOPY.minZ] },
      { geometry: new THREE.BoxGeometry(w + 0.6, 0.36, 0.4), at: [cx, CANOPY.y, CANOPY.maxZ] },
      { geometry: new THREE.BoxGeometry(0.4, 0.36, d), at: [CANOPY.minX, CANOPY.y, cz] },
      { geometry: new THREE.BoxGeometry(0.4, 0.36, d), at: [CANOPY.maxX, CANOPY.y, cz] },
      /* Three ribs across, carrying the glass. */
      ...[-1, 0, 1].map((k): Part => ({ geometry: new THREE.BoxGeometry(w, 0.16, 0.16), at: [cx, CANOPY.y + 0.1, cz + k * (d / 4)] })),
    ];
  }, []);
  /* Emerald LED under every edge of the canopy, and one up each post. */
  const leds = useMerged(() => {
    const w = CANOPY.maxX - CANOPY.minX;
    const d = CANOPY.maxZ - CANOPY.minZ;
    const cx = (CANOPY.minX + CANOPY.maxX) / 2;
    const cz = (CANOPY.minZ + CANOPY.maxZ) / 2;
    const under = CANOPY.y - 0.19;
    const flat: [number, number, number] = [-Math.PI / 2, 0, 0];
    return [
      { geometry: new THREE.PlaneGeometry(w, 0.07), at: [cx, under, CANOPY.minZ + 0.22] as [number, number, number], turn: flat },
      { geometry: new THREE.PlaneGeometry(w, 0.07), at: [cx, under, CANOPY.maxZ - 0.22] as [number, number, number], turn: flat },
      { geometry: new THREE.PlaneGeometry(0.07, d), at: [CANOPY.minX + 0.22, under, cz] as [number, number, number], turn: flat },
      { geometry: new THREE.PlaneGeometry(0.07, d), at: [CANOPY.maxX - 0.22, under, cz] as [number, number, number], turn: flat },
      ...[
        [CANOPY.minX, CANOPY.minZ],
        [CANOPY.maxX, CANOPY.minZ],
        [CANOPY.minX, CANOPY.maxZ],
        [CANOPY.maxX, CANOPY.maxZ],
      ].map(([x, z]): Part => ({
        geometry: new THREE.BoxGeometry(0.04, CANOPY.y - 0.6, 0.36),
        at: [x! + (x! < CENTRE[0] ? 0.18 : -0.18), CANOPY.y / 2, z!],
      })),
    ].map((part) => ({ ...part, turn: part.turn ?? ([0, 0, 0] as [number, number, number]) }));
  }, []);

  /* ------------------------------------------------------------ bays */
  /* The floor marking of each bay: a lit rectangle and a stop line. */
  const bayLines = useMerged(
    () =>
      BAYS.flatMap((z) => {
        const flat: [number, number, number] = [-Math.PI / 2, 0, 0];
        return [
          { geometry: new THREE.PlaneGeometry(6.2, 0.08), at: [BAY_X, 0.03, z - 1.75] as [number, number, number], turn: flat },
          { geometry: new THREE.PlaneGeometry(6.2, 0.08), at: [BAY_X, 0.03, z + 1.75] as [number, number, number], turn: flat },
          { geometry: new THREE.PlaneGeometry(0.08, 3.5), at: [BAY_X - 3.1, 0.03, z] as [number, number, number], turn: flat },
          { geometry: new THREE.PlaneGeometry(0.22, 3.1), at: [BAY_X + 3.1, 0.03, z] as [number, number, number], turn: flat },
        ];
      }),
    [],
  );
  /* The two-post lift in each bay: posts, the beam over, the arms under the car. */
  const lifts = useMerged(
    () =>
      BAYS.flatMap((z) => [
        { geometry: new THREE.BoxGeometry(0.3, 2.6, 0.3), at: [BAY_X, 1.3, z - 1.45] as [number, number, number] },
        { geometry: new THREE.BoxGeometry(0.3, 2.6, 0.3), at: [BAY_X, 1.3, z + 1.45] as [number, number, number] },
        { geometry: new THREE.BoxGeometry(0.26, 0.2, 3.2), at: [BAY_X, 2.66, z] as [number, number, number] },
        { geometry: new THREE.BoxGeometry(3.6, 0.08, 0.16), at: [BAY_X, 0.84, z - 0.62] as [number, number, number] },
        { geometry: new THREE.BoxGeometry(3.6, 0.08, 0.16), at: [BAY_X, 0.84, z + 0.62] as [number, number, number] },
      ]),
    [],
  );
  /* A car in light on each lift: body, cabin and wheels, one volume. */
  const cars = useMerged(
    () =>
      BAYS.flatMap((z) => [
        { geometry: new THREE.BoxGeometry(4.2, 0.5, 1.7), at: [BAY_X, 1.26, z] as [number, number, number] },
        { geometry: new THREE.BoxGeometry(2.1, 0.46, 1.5), at: [BAY_X - 0.25, 1.74, z] as [number, number, number] },
        ...[-1.35, 1.35].flatMap((x) =>
          [-0.82, 0.82].map((dz): Part => ({
            geometry: new THREE.CylinderGeometry(0.34, 0.34, 0.22, 14),
            at: [BAY_X + x, 1.0, z + dz],
            turn: [Math.PI / 2, 0, 0],
          })),
        ),
      ]),
    [],
  );
  /* Its outline, in the small cyan accent: the silhouette is what reads. */
  const outlines = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (const z of BAYS) {
      const bodyEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(4.2, 0.5, 1.7));
      bodyEdges.translate(BAY_X, 1.26, z);
      const cabinEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.1, 0.46, 1.5));
      cabinEdges.translate(BAY_X - 0.25, 1.74, z);
      parts.push(bodyEdges, cabinEdges);
    }
    const positions = parts.flatMap((g) => Array.from(g.getAttribute("position").array as Float32Array));
    parts.forEach((g) => g.dispose());
    const merged = new THREE.BufferGeometry();
    merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return merged;
  }, []);

  /* The workflow screen beside each bay, on a slim post, facing the door. */
  const screenPosts = useMerged(
    () => BAYS.map((z) => ({ geometry: new THREE.BoxGeometry(0.08, 1.2, 0.08), at: [BAY_X + 3.9, 0.6, z] as [number, number, number] })),
    [],
  );

  return (
    <group name="aracimgo">
      <Island at={CENTRE} size={[50, 22]} runner={[50, CORRIDOR]} glass texture={texture} colour={accent} depth={2.6} deck="#07201d" />
      <LightLine at={[CENTRE[0], 0.035, CENTRE[1]]} length={46} axis="x" colour={accent} intensity={0.45} thickness={0.09} />
      {[-1, 1].map((side) => (
        <Service key={side} at={[CENTRE[0], 7.2, CENTRE[1] + side * 9.6]} length={44} colour={accent} />
      ))}
      {/* The way in from Shipped: a portal in the district's own light. */}
      <Doorway at={[-34, 0, -66]} width={CORRIDOR} height={6.4} turn={Math.PI / 2} colour={accent} />
      <LightWash at={[-46, 0.03, -66]} size={[16, 12]} texture={texture} colour={TEAL} intensity={0.16} />

      <Signage locale={locale} />

      {/* The product's station: its plates hang under the canopy. */}
      {installation ? (
        <Station
          installation={installation}
          index={7}
          at={STATION_AT}
          turn={Math.PI / 2}
          texture={texture}
          facing={Math.PI / 2}
          spacing={3}
          photoHeight={3.8}
          height={4.4}
          cull={DETAIL_AT.desktop}
        />
      ) : null}

      <group ref={detail} name="aracimgo:detail">
        {/* The elevated glass canopy. */}
        <mesh geometry={posts}>
          <meshStandardMaterial color={METAL} roughness={0.32} metalness={0.85} />
        </mesh>
        <mesh geometry={beams}>
          <meshStandardMaterial color={METAL} roughness={0.32} metalness={0.85} />
        </mesh>
        <mesh position={[(CANOPY.minX + CANOPY.maxX) / 2, CANOPY.y + 0.2, (CANOPY.minZ + CANOPY.maxZ) / 2]}>
          <boxGeometry args={[CANOPY.maxX - CANOPY.minX, 0.08, CANOPY.maxZ - CANOPY.minZ]} />
          <meshStandardMaterial color="#0e3b36" roughness={0.1} metalness={0.6} transparent opacity={0.28} depthWrite={false} />
        </mesh>
        <mesh geometry={leds}>
          <Glow colour={EMERALD} opacity={0.9} />
        </mesh>

        {/* The bays. */}
        <mesh geometry={bayLines}>
          <Glow colour={EMERALD} opacity={0.75} />
        </mesh>
        <mesh geometry={lifts}>
          <meshStandardMaterial color={METAL} roughness={0.38} metalness={0.8} />
        </mesh>
        <mesh geometry={cars}>
          <meshBasicMaterial color={EMERALD} transparent opacity={0.13} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <lineSegments geometry={outlines}>
          <lineBasicMaterial color={CYAN} transparent opacity={0.7} toneMapped={false} />
        </lineSegments>
        {BAYS.map((z, i) => (
          <mesh
            key={z}
            ref={(node) => {
              scans.current[i] = node;
            }}
            position={[BAY_X, 1.45, z]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <planeGeometry args={[2, 1.4]} />
            <meshBasicMaterial color={CYAN} transparent opacity={0.3} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
          </mesh>
        ))}

        {/* Each bay's workflow screen. */}
        <mesh geometry={screenPosts}>
          <meshStandardMaterial color={METAL} roughness={0.35} metalness={0.85} />
        </mesh>
        {BAYS.map((z, i) => (
          <group key={z} position={[BAY_X + 3.9, 1.75, z]} rotation={[0, Math.PI / 2, 0]}>
            <mesh position={[0, 0, -0.04]}>
              <boxGeometry args={[1.74, 1.04, 0.06]} />
              <meshStandardMaterial color="#071512" roughness={0.2} metalness={0.6} />
            </mesh>
            <DataSurface paint={workflow(BAY_JOBS[i]!, locale)} size={[1.66, 0.96]} resolution={640} />
          </group>
        ))}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------- signage */

/**
 * The sign over the passage from Shipped, both faces: the product's name,
 * large, and what it is, under it. Dark glass in a brushed frame with white
 * LED behind it — the same build as every other sign in the world — so it
 * reads as part of the campus and not as an advertisement hung on it.
 */
const SIGN = { at: [-32, 9.6, -66] as [number, number, number], size: [9.4, 2.6] as [number, number] };

function Signage({ locale }: { locale: Locale }) {
  const paint = useMemo(
    () => paintSign((locale === "tr" ? "Otomotiv · Servis Yönetimi" : "Automotive · Service Management").toLocaleUpperCase(locale)),
    [locale],
  );
  const [w, h] = SIGN.size;
  const frame = useMerged(
    () => [
      { geometry: new THREE.BoxGeometry(0.5, 0.12, w + 0.24), at: [0, h / 2 + 0.06, 0] },
      { geometry: new THREE.BoxGeometry(0.5, 0.12, w + 0.24), at: [0, -h / 2 - 0.06, 0] },
      { geometry: new THREE.BoxGeometry(0.5, h, 0.12), at: [0, 0, w / 2 + 0.06] },
      { geometry: new THREE.BoxGeometry(0.5, h, 0.12), at: [0, 0, -w / 2 - 0.06] },
    ],
    [w, h],
  );
  return (
    <group position={SIGN.at} name="aracimgo:sign">
      <mesh>
        <boxGeometry args={[0.36, h, w]} />
        <meshPhysicalMaterial color="#061210" roughness={0.14} metalness={0.5} envMapIntensity={1.2} />
      </mesh>
      <mesh geometry={frame}>
        <meshStandardMaterial color={METAL} roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Two faces: one to the shipped hall, one back down the hub. */}
      {[1, -1].map((side) => (
        <group key={side} position={[side * 0.19, 0, 0]} rotation={[0, (side * Math.PI) / 2, 0]}>
          <Backlight size={SIGN.size} strength={0.7} halo={false} />
          <DataSurface paint={paint} size={SIGN.size} resolution={1024} />
        </group>
      ))}
    </group>
  );
}

function paintSign(subtitle: string): SurfacePaint {
  return (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const plate = ctx.createLinearGradient(0, 0, 0, h);
    plate.addColorStop(0, "rgba(10,34,30,0.96)");
    plate.addColorStop(1, "rgba(3,14,13,0.94)");
    ctx.fillStyle = plate;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
    ctx.fillStyle = EMERALD;
    ctx.fillRect(0, h - 6, w, 6);

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    /* The name: the largest type in the district, white, with a soft light behind it. */
    const title = Math.round(h * 0.4);
    ctx.font = `700 ${title}px "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif`;
    ctx.shadowColor = "rgba(160,255,220,0.45)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("AracımGo", w / 2, h * 0.56);
    ctx.shadowBlur = 0;
    /* What it is, under it, in the product's emerald. */
    const small = Math.round(h * 0.13);
    ctx.font = `600 ${small}px "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif`;
    ctx.fillStyle = "#8ff0c8";
    ctx.fillText(subtitle, w / 2, h * 0.8);
  };
}

/* ------------------------------------------------------------ workflow */

/* The jobs on the two bays' screens: the sample records the product's own
   plates show, not anyone's car. */
type BayJob = { bay: string; plate: string; job: { en: string; tr: string }; state: { en: string; tr: string }; colour: string };
const BAY_JOBS: BayJob[] = [
  { bay: "01", plate: "06 ABC 123", job: { en: "Oil change", tr: "Yağ değişimi" }, state: { en: "In progress", tr: "Devam ediyor" }, colour: "#f5c86b" },
  { bay: "02", plate: "34 DEF 456", job: { en: "Brake check", tr: "Fren kontrolü" }, state: { en: "Waiting", tr: "Beklemede" }, colour: "#b8c4c9" },
];

function workflow(job: BayJob, locale: Locale): SurfacePaint {
  return (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(6,22,20,0.95)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
    const pad = w * 0.07;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = EMERALD;
    ctx.font = `500 ${Math.round(h * 0.075)}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.fillText(`${locale === "tr" ? "LİFT" : "BAY"} ${job.bay} · ${locale === "tr" ? "İŞ EMRİ" : "WORK ORDER"}`, pad, pad + h * 0.06);
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${Math.round(h * 0.2)}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.fillText(job.plate, pad, h * 0.47);
    ctx.fillStyle = "rgba(230,240,236,0.9)";
    ctx.font = `500 ${Math.round(h * 0.1)}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.fillText(job.job[locale], pad, h * 0.65);
    /* The status, as a pill. */
    const label = job.state[locale].toLocaleUpperCase(locale);
    ctx.font = `600 ${Math.round(h * 0.07)}px ui-monospace, Menlo, Consolas, monospace`;
    const tw = ctx.measureText(label).width + h * 0.12;
    const y = h * 0.74;
    ctx.fillStyle = job.colour;
    ctx.globalAlpha = 0.18;
    ctx.fillRect(pad, y, tw, h * 0.13);
    ctx.globalAlpha = 1;
    ctx.fillText(label, pad + h * 0.06, y + h * 0.093);
  };
}
