"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";
import { Contact, MATERIAL } from "@/components/world/pieces/Kit";
import { DataSurface, Mount, paintPanel } from "@/components/world/pieces/Surface";
import { discovery } from "@/components/world/systems/discovery";
import { focusStore, interactables } from "@/components/world/systems/focus";
import type { PreparedDisplay } from "@/lib/worldPayload";

/**
 * A display, and the thing it is mounted in.
 *
 * Seven housings, because the work is not all the same and a world where every
 * screen is the same rectangle on the same post is a grid with a camera in
 * front of it. A wall display is cut into the wall. A terminal is a console
 * you walk up to and lean over. A billboard is carried on masts and read from
 * two hundred metres. The screen is the same component in all of them; what
 * changes is the architecture holding it, which is what makes each one feel
 * like part of the building rather than furniture placed in it.
 */

/** How close you must be, per housing. A billboard is read from a long way. */
const REACH: Record<PreparedDisplay["form"], number> = {
  wall: 7,
  terminal: 3.2,
  billboard: 46,
  vertical: 7.5,
  kiosk: 3,
  array: 8,
  immersive: 14,
};

/** Whether this panel has been opened at some point this session. */
function useSeen(id: string): boolean {
  return useSyncExternalStore(
    discovery.subscribe,
    () => discovery.has(id),
    () => false,
  );
}

export function useFocused(id: string): boolean {
  return useSyncExternalStore(
    focusStore.subscribe,
    () => focusStore.get()?.id === id,
    () => false,
  );
}

export function Display({
  display,
  texture,
  onOpen,
}: {
  display: PreparedDisplay;
  texture: THREE.Texture;
  onOpen: (display: PreparedDisplay) => void;
}) {
  const focused = useFocused(display.id);
  const seen = useSeen(display.id);
  const paint = useMemo(() => paintPanel(display.content), [display.content]);
  const [w] = display.size;
  /* Filled in by the mount; called by the walking loop. */
  const near = useRef<((nearness: number) => void) | null>(null);

  useEffect(
    () =>
      interactables.add({
        id: display.id,
        at: display.at,
        reach: REACH[display.form],
        label: display.content.title,
        action: display.action,
        activate: () => onOpen(display),
        onNear: (nearness) => near.current?.(nearness),
      }),
    [display, onOpen],
  );

  /* Resolution follows physical size: a kiosk the size of a laptop does not
     need the pixels a fifteen-metre billboard does, and a world that gives
     every panel a 1024px canvas spends most of its texture memory on things
     nobody stands closer than eight metres to. */
  const resolution = w > 20 ? 1536 : w > 10 ? 1280 : w > 4 ? 1024 : 768;

  const screen = (
    <>
      <Backlight size={display.size} texture={texture} />
      <Mount
        size={display.size}
        texture={texture}
        accent={display.content.accent}
        lit={focused}
        seen={seen}
        publish={near}
      />
      <DataSurface
        paint={paint}
        size={display.size}
        resolution={resolution}
        pulse={display.zone === "hub" && display.form === "vertical" ? (display.at[0] % 5) * 1.3 : null}
      />
    </>
  );

  return (
    <group position={display.at} rotation={[0, display.turn, 0]} name={`display:${display.id}`}>
      {display.form === "wall" ? <WallHousing size={display.size}>{screen}</WallHousing> : null}
      {display.form === "array" ? <ArrayHousing size={display.size}>{screen}</ArrayHousing> : null}
      {display.form === "immersive" ? (
        <ImmersiveHousing size={display.size} accent={display.content.accent}>
          {screen}
        </ImmersiveHousing>
      ) : null}
      {display.form === "billboard" ? (
        <BillboardHousing size={display.size} at={display.at} texture={texture}>
          {screen}
        </BillboardHousing>
      ) : null}
      {display.form === "vertical" ? (
        <VerticalHousing size={display.size} at={display.at} texture={texture}>
          {screen}
        </VerticalHousing>
      ) : null}
      {display.form === "terminal" ? (
        <ConsoleHousing size={display.size} at={display.at} texture={texture} tall>
          {screen}
        </ConsoleHousing>
      ) : null}
      {display.form === "kiosk" ? (
        <ConsoleHousing size={display.size} at={display.at} texture={texture}>
          {screen}
        </ConsoleHousing>
      ) : null}
    </group>
  );
}

/* ------------------------------------------------------------ backlight */

/**
 * The white LED behind a panel.
 *
 * Two planes and no lights: a soft radial halo on the air behind the glass,
 * a thin white line of light around the panel's perimeter where it leaks
 * past the frame. It is what makes a panel read as a lit thing from across
 * a plaza, and it costs two draws.
 */
function Backlight({ size, texture }: { size: [number, number]; texture: THREE.Texture }) {
  const [w, h] = size;
  return (
    <group>
      <mesh position={[0, 0, -0.16]}>
        <planeGeometry args={[w * 1.6, h * 1.9]} />
        <meshBasicMaterial map={texture} color="#ffffff" transparent opacity={0.32} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[w + 0.14, h + 0.14]} />
        <meshBasicMaterial color="#f4f8ff" transparent opacity={0.55} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------- housings */

/** Dark glass: the housings are translucent, so a screen stands in the
 *  world rather than in front of a wall. */
function GlassBody() {
  return <meshPhysicalMaterial color="#0c1730" transparent opacity={0.55} roughness={0.18} metalness={0.45} envMapIntensity={1.2} depthWrite={false} />;
}
/** Brushed metal, for the frame that carries the glass. */
function Frame() {
  return <meshStandardMaterial color="#aeb8c4" roughness={0.35} metalness={0.85} />;
}
/** Dark stone, for what stands on the deck. */
function Stone() {
  return <meshStandardMaterial color="#141f38" roughness={0.45} metalness={0.4} />;
}

/** A — cut into a wall, with a reveal all the way round. */
function WallHousing({ size, children }: { size: [number, number]; children: React.ReactNode }) {
  const [w, h] = size;
  return (
    <group>
      <mesh position={[0, 0, -0.34]}>
        <boxGeometry args={[w + 1.1, h + 1.1, 0.5]} />
        <Stone />
      </mesh>
      <mesh position={[0, 0, -0.12]}>
        <boxGeometry args={[w + 0.42, h + 0.42, 0.24]} />
        <meshLambertMaterial color={MATERIAL.recess} />
      </mesh>
      {children}
    </group>
  );
}

/** F — one cell of a larger installation. Nothing but a hairline frame. */
function ArrayHousing({ size, children }: { size: [number, number]; children: React.ReactNode }) {
  const [w, h] = size;
  return (
    <group>
      <mesh position={[0, 0, -0.16]}>
        <boxGeometry args={[w + 0.3, h + 0.3, 0.28]} />
        <Stone />
      </mesh>
      {children}
    </group>
  );
}

/** G — a full-height wall of screen, with a light trough at its foot. */
function ImmersiveHousing({
  size,
  accent,
  children,
}: {
  size: [number, number];
  accent: string;
  children: React.ReactNode;
}) {
  const [w, h] = size;
  return (
    <group>
      <mesh position={[0, 0, -0.5]}>
        <boxGeometry args={[w + 2.4, h + 2.6, 0.5]} />
        <GlassBody />
      </mesh>
      {/* Head and foot, so the wall is built rather than extruded. */}
      <mesh position={[0, h / 2 + 1.1, -0.28]}>
        <boxGeometry args={[w + 3, 0.3, 1.1]} />
        <Frame />
      </mesh>
      <mesh position={[0, -h / 2 - 1.05, -0.28]}>
        <boxGeometry args={[w + 3, 0.5, 1.5]} />
        <Stone />
      </mesh>
      {/* The product's colour, once, as a reveal down the leading edge. */}
      <mesh position={[-w / 2 - 1.05, 0, 0.02]}>
        <boxGeometry args={[0.1, h * 0.8, 0.06]} />
        <meshLambertMaterial color={accent} />
      </mesh>
      {children}
    </group>
  );
}

/** C — carried on masts, with a walkway under it. */
function BillboardHousing({
  size,
  at,
  texture,
  children,
}: {
  size: [number, number];
  at: [number, number, number];
  texture: THREE.Texture;
  children: React.ReactNode;
}) {
  const [w, h] = size;
  const foot = -at[1];
  return (
    <group>
      <mesh position={[0, 0, -0.7]}>
        <boxGeometry args={[w + 1.6, h + 1.6, 0.5]} />
        <GlassBody />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[(w / 2 - 2.5) * side, foot / 2 + h / 2 - 0.2, -1.4]}>
            <boxGeometry args={[1.3, Math.abs(foot) + h, 1.3]} />
            <Frame />
          </mesh>
          <Contact
            texture={texture}
            at={[(w / 2 - 2.5) * side, foot + 0.03, -1.4]}
            size={[6, 6]}
            opacity={1}
          />
        </group>
      ))}
      {/* Maintenance walkway. A billboard nobody could service is a poster. */}
      <mesh position={[0, -h / 2 - 0.75, 0.6]}>
        <boxGeometry args={[w + 1, 0.16, 1.6]} />
        <meshStandardMaterial color={MATERIAL.metal} roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0, -h / 2 - 0.2, 1.3]}>
        <boxGeometry args={[w + 1, 0.06, 0.06]} />
        <meshStandardMaterial color={MATERIAL.metal} roughness={0.34} metalness={0.66} />
      </mesh>
      {children}
    </group>
  );
}

/** D — a tall exhibition screen on a plinth, with a hood over it. */
function VerticalHousing({
  size,
  at,
  texture,
  children,
}: {
  size: [number, number];
  at: [number, number, number];
  texture: THREE.Texture;
  children: React.ReactNode;
}) {
  const [w, h] = size;
  const foot = -at[1];
  return (
    <group>
      <mesh position={[0, 0, -0.36]}>
        <boxGeometry args={[w + 0.9, h + 1.4, 0.44]} />
        <GlassBody />
      </mesh>
      <mesh position={[0, foot + (h / 2 + at[1]) / 2 - h / 4, -0.36]}>
        <boxGeometry args={[w + 0.9, at[1] - h / 2 - foot, 0.44]} />
        <Stone />
      </mesh>
      <mesh position={[0, h / 2 + 0.8, -0.1]}>
        <boxGeometry args={[w + 1.2, 0.3, 1]} />
        <Frame />
      </mesh>
      <Contact texture={texture} at={[0, foot + 0.03, -0.3]} size={[w + 4, 5]} opacity={1} />
      {children}
    </group>
  );
}

/**
 * B and E — a console you walk up to.
 *
 * Canted back so it is read from standing height rather than square on, which
 * is the single detail that makes a terminal feel like equipment instead of a
 * screen glued to a box.
 */
function ConsoleHousing({
  size,
  at,
  texture,
  tall = false,
  children,
}: {
  size: [number, number];
  at: [number, number, number];
  texture: THREE.Texture;
  tall?: boolean;
  children: React.ReactNode;
}) {
  const [w, h] = size;
  const foot = -at[1];
  const cant = tall ? -0.34 : -0.42;
  return (
    <group>
      {/* Pedestal */}
      <mesh position={[0, foot / 2 - 0.05, -0.18]}>
        <boxGeometry args={[w * 0.72, Math.abs(foot), 0.6]} />
        <Stone />
      </mesh>
      <mesh position={[0, foot + 0.06, -0.18]}>
        <boxGeometry args={[w * 1.05, 0.12, 0.9]} />
        <Stone />
      </mesh>
      <Contact texture={texture} at={[0, foot + 0.03, -0.18]} size={[w * 3.4, 3.2]} opacity={1} />
      {/* The canted head. */}
      <group rotation={[cant, 0, 0]}>
        <mesh position={[0, 0, -0.13]}>
          <boxGeometry args={[w + 0.34, h + 0.34, 0.2]} />
          <Stone />
        </mesh>
        {children}
      </group>
    </group>
  );
}
