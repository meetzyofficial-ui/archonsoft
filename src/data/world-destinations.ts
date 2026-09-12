import type { Localized } from "@/lib/i18n";
import { PROJECTS } from "@/data/projects";
import { GALLERY, type ZoneId } from "@/data/world-map";

const category = (slug: string): Localized =>
  PROJECTS.find((one) => one.slug === slug)?.category ?? { en: "", tr: "" };

/**
 * Where the world can take you in one step.
 *
 * The single source of truth for navigation: the left rail, the number keys,
 * the wayfinding installation by the entrance, and the arrival positions the
 * explorer is set down at. Every position is a standing point read off the
 * plan — on a deck, clear of colliders, displays, guides and consoles — and
 * every facing turns the arrival toward what the place is for.
 *
 * `yaw` follows the walking loop's convention: 0 faces north (−z), positive
 * turns west.
 */
export type Destination = {
  id: string;
  number: number;
  name: Localized;
  subtitle: Localized;
  description: Localized;
  zone: ZoneId;
  /** Feet position: x, floor height, z. */
  at: [number, number, number];
  yaw: number;
  key: string;
};

const face = (from: [number, number], to: [number, number]) => Math.atan2(-(to[0] - from[0]), -(to[1] - from[1]));

export const WORLD_DESTINATIONS: Destination[] = [
  {
    id: "hub",
    number: 1,
    key: "1",
    name: { en: "Archon Hub", tr: "Archon Hub" },
    subtitle: { en: "The gate and the plaza", tr: "Kapı ve meydan" },
    description: {
      en: "The centre of the world: the Archon mark at the size of architecture, and the way to every district.",
      tr: "Dünyanın merkezi: mimari ölçekte Archon markası ve her bölgeye giden yol.",
    },
    zone: "hub",
    at: [0, 0, 16],
    yaw: 0,
  },
  {
    id: "dppano",
    number: 2,
    key: "2",
    name: { en: "DP Pano", tr: "DP Pano" },
    subtitle: category("dppano"),
    description: {
      en: "The hall of screens: DP Pano's real boards, and the people who built it.",
      tr: "Ekranlar koridoru: DP Pano'nun gerçek ekranları ve onu yapan ekip.",
    },
    zone: "boards",
    at: [40, 0, -66],
    yaw: face([40, -66], [62, -66]),
  },
  {
    id: "meetzy",
    number: 3,
    key: "3",
    name: { en: "Meetzy", tr: "Meetzy" },
    subtitle: category("meetzy"),
    description: {
      en: "Meetzy's station on the west side of the shipped hall.",
      tr: "Yayın holünün batısında Meetzy istasyonu.",
    },
    zone: "shipped",
    at: [-2, 0, -36],
    yaw: face([-2, -36], [-14, -44]),
  },
  {
    id: "erden",
    number: 4,
    key: "4",
    name: { en: "Erden Davetiye", tr: "Erden Davetiye" },
    subtitle: category("erden"),
    description: {
      en: "Erden Davetiye's station on the east side of the shipped hall.",
      tr: "Yayın holünün doğusunda Erden Davetiye istasyonu.",
    },
    zone: "shipped",
    at: [2, 0, -36],
    yaw: face([2, -36], [14, -44]),
  },
  {
    id: "gallery",
    number: 5,
    key: "5",
    name: { en: "Gallery", tr: "Galeri" },
    subtitle: { en: "The walkway above the hub", tr: "Meydanın üstündeki geçit" },
    description: {
      en: "Nine metres up: the whole plaza in one look, and the museum hanging over the water.",
      tr: "Dokuz metre yukarıda: tüm meydan tek bakışta ve suyun üzerinde asılı müze.",
    },
    zone: "gallery",
    at: [-24.5, GALLERY, 2],
    yaw: 0,
  },
  {
    id: "systems",
    number: 6,
    key: "6",
    name: { en: "Systems", tr: "Sistemler" },
    subtitle: { en: "What runs behind an interface", tr: "Bir arayüzün arkasında ne çalışır" },
    description: {
      en: "The systems island: the layers a product is made of, on one wall of panels.",
      tr: "Sistemler adası: bir ürünün katmanları, tek bir panel duvarında.",
    },
    zone: "systems",
    at: [-40, 0, 0],
    yaw: face([-40, 0], [-73, 0]),
  },
];

export const destinationByKey = (key: string) => WORLD_DESTINATIONS.find((one) => one.key === key);
export const destinationById = (id: string) => WORLD_DESTINATIONS.find((one) => one.id === id);
