import type { Localized } from "@/lib/i18n";
import type { ZoneId } from "@/data/world-map";

/**
 * The people at each project.
 *
 * Every shipped product in Archon World has a station, and every station has
 * two or three people standing at it who notice the visitor arrive, turn,
 * greet them, and — asked — explain the project in words and out loud. This
 * file is only the staging: who stands where, facing which way, and what they
 * say when somebody walks up. Everything they say *about* the project is
 * resolved on the server from the project's own data (`worldPayload.ts`), so
 * a guide can never describe a product differently from its case study.
 *
 * Adding a project to the world is one entry here and nothing else.
 */

export type ProjectGuide = {
  /** The project's slug in `PROJECTS`. */
  projectId: string;
  zone: ZoneId;
  /** Where the group stands, world metres, at floor level. */
  at: [number, number, number];
  /** The way they face when nobody is there. Radians about Y; 0 faces +z. */
  facing: number;
  npcCount: 2 | 3;
  /** How close the visitor comes before the greeting is spoken. */
  greetAt: number;
  /** The first thing they say. */
  greeting: Localized;
  /** The prompt on the key. */
  ask: Localized;
};

export const PROJECT_GUIDES: ProjectGuide[] = [
  {
    projectId: "dppano",
    zone: "boards",
    at: [49, 0, -66.5],
    facing: -Math.PI / 2,
    npcCount: 3,
    greetAt: 7,
    greeting: {
      en: "Hello. Would you like to hear about DP Pano?",
      tr: "Merhaba. DP Pano'yu keşfetmek ister misin?",
    },
    ask: { en: "Ask about DP Pano", tr: "DP Pano'yu sor" },
  },
  {
    projectId: "meetzy",
    zone: "shipped",
    at: [-5.5, 0, -44],
    facing: Math.PI / 2,
    npcCount: 3,
    greetAt: 6.5,
    greeting: {
      en: "Hi — this is Meetzy. Want to know what it does?",
      tr: "Merhaba — burası Meetzy. Ne yaptığını duymak ister misin?",
    },
    ask: { en: "Ask about Meetzy", tr: "Meetzy'yi sor" },
  },
  {
    projectId: "erden",
    zone: "shipped",
    at: [5.5, 0, -44],
    facing: -Math.PI / 2,
    npcCount: 2,
    greetAt: 6.5,
    greeting: {
      en: "Welcome. Shall we walk you through Erden Davetiye?",
      tr: "Hoş geldin. Erden Davetiye'yi anlatalım mı?",
    },
    ask: { en: "Ask about Erden Davetiye", tr: "Erden Davetiye'yi sor" },
  },
];
