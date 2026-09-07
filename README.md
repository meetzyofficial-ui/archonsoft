# Archon Soft

The site for Archon Soft — a one-person product and technology studio in Ankara.

Two products are live: **Meetzy**, a social app for finding someone to go to
things with, and **Erden Davetiye**, a storefront and the admin system behind
it. Ten more are **Archon Labs** concepts: complete product prototypes designed
and built here, running as real React interfaces on the page, and labelled as
concepts on every surface they appear on.

---

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript strict |
| Styling | Tailwind CSS v4, CSS-first tokens in `src/app/globals.css` |
| Motion | CSS transitions driven by `data-` attributes, one rAF loop per scroll-linked scene, Lenis for momentum scroll |
| Fonts | Space Grotesk (display, self-hosted), Geist + Geist Mono (`geist` package) |
| Languages | English and Turkish, every route under `/[locale]` |
| Images | Real product screenshots via `next/image`; a small set of generated SVG diagrams where no screen exists |
| Prototypes | The Archon Labs concepts are React components built on one interface kit, not screenshots |

No animation library. First load is ~104 kB shared JS.

## Running it

```bash
npm install
npm run dev            # http://localhost:3000 → redirects to /en
npm run verify         # typecheck + lint + production build
npm run assets         # rebuild src/assets from the raw handoff in _incoming/
```

## Brand

Everything comes from the supplied kit (`_incoming/brand-raw`, gitignored), not
from invention:

- **Ink** `#0B0F1A` · **White** `#FFFFFF` · **Blue** `#4F86FF` · **Violet** `#7A5CFF`
- The mark is an arch with an illuminated keystone. The blue-to-violet gradient
  is used **only** in that keystone, exactly as the brand book prescribes.
- The wordmark face is Space Grotesk, set live rather than shipped as paths.

One discipline runs through the whole design: **Archon is monochrome and the
products bring the colour.** The blue only ever appears at hairline scale —
indices, active states, focus rings, one rule at a time. Everything with real
colour on the site is a real product screen. Each project chapter also carries
its *own* product colour on its marks, so Meetzy's red and Erden's gold never
fight each other or the frame.

## Three words

`src/components/ui/Provenance.tsx`.

Everything on the site is one of three things, and a visitor has to be able to
tell which at a glance, without reading:

| | |
|---|---|
| **SHIPPED** | Real production work, live and in use. Meetzy and Erden Davetiye. |
| **ARCHON LABS** | A concept product designed and built here. Never client work. |
| **CAPABILITY** | An area of engineering demonstrated by something on this site. |

One component renders all three, SHIPPED is the only one that ever takes the
accent, and the footer defines them on every page. The rule they exist to
enforce is in `src/data/labs/stories.ts`: a concept never borrows credit from
real work. It may say it explores the same problem space, or that a capability
it shows was already proven at a smaller scale in a shipped product — never
that the shipped product contains any of it.

## Archon Labs

`src/components/labs/`, `src/data/labs/`.

Two shipped products is an honest answer to what has been *released* and a poor
answer to what can be *built*. There are two ways out of that. One is to invent
eight more clients. The other is to build eight more products and say plainly
that they are concepts — which is the one taken here, and it turns out to be
the more convincing answer anyway, because a visitor can open them.

Ten concepts, each a coherent product with its own name, sector, accent and
five-or-so screens: **Divan** (business OS), **Ulak** (AI operations),
**Kervan** (marketplace), **Vesile** (events), **Tezgah** (commerce),
**Vardiya** (AI support), **Ölçek** (analytics), **Atölye** (internal
operations), **Kütük** (knowledge), **Eşik** (client portal). The names are
Turkish on purpose: a divan is the council a state is run from, a kervan is a
trade caravan, a tezgah is the counter a shop is worked from.

How it is put together:

- **One kit, seven archetypes.** `kit.tsx` holds the window chrome, tab rail,
  tables, charts, pills, panels and phone frame. `LabSurface.tsx` renders a
  view from one of seven shapes every real product screen falls into —
  dashboard, records, board, thread, catalog, search, mobile. A concept is
  therefore *data*, and the ten of them are genuinely the same software.
- **The sidebar is the interaction.** It is a real vertical tab list with arrow
  keys and roving tabindex, and moving through it changes the screen. Rows
  open, ranges redraw the series, conversations switch, a basket counts.
- **One window at a time.** The home page and `/labs` mount a single surface
  and swap it when you choose another concept, so ten prototypes cost about
  what one costs.
- **Its own colour tokens.** `.lab-window` declares a complete palette rather
  than inheriting the band it lands in, so a concept can take an accent of its
  own without leaking product colour into the Archon frame, and a light band
  never turns a dark product interface inside out.
- **No landmarks, no faces, no photography.** Nothing inside a prototype
  registers as a `header`, `nav` or `aside` on the page that contains it — a
  screen reader finds one banner and one navigation here, both Archon's.
  Records carry initials, never faces; catalogue plates are drawn placeholders
  that say so.
- **The screens a demo skips.** `extra-views.ts` adds command palettes, and
  the empty, loading and failed states. Anyone can draw a chart with data in
  it; the state before the data arrives and the state when the request fails
  are where the engineering shows, so several concepts have them.

Each concept carries a five-beat story — problem, product, system, experience,
capability — written to be read in fifteen seconds, and a **promise**: one
second-person line naming the business problem it answers. The promise is what
leads wherever a concept is introduced, because "Business operating system" is
a category and *"your business should not need five tools to know what is
happening"* is a reason to keep reading.

A concept's own page is laid out as a product launch rather than a case study:
the label, the name at full display scale, the promise, and then the running
product taking the width of the page.

## Opening a product

`src/components/labs/SystemStack.tsx`.

The site claims repeatedly that Archon does not stop at the frontend. That
claim is normally made with a box-and-arrow diagram nobody reads, so here it is
an object instead: the interface is the top plane of a stack and the six layers
that carry it — application, API, data, automation, analytics, production — are
separated underneath it in space.

The planes are `aria-hidden` decoration; the column beside them is the content
and reads as an ordinary list with or without the scene. That split is what
lets the drawing be as dimensional as it likes at no accessibility cost.
Mechanically it is one rotated container and seven `translateZ` values, and a
concept overrides a layer's description only where it has something specific to
say, so the diagram never becomes seventy sentences of filler.

Every surface says `CONCEPT` in the window chrome, `SAMPLE DATA` in the header
and a full sentence underneath. The page `<title>` says it before anything
else, so a search result cannot arrive looking like delivered work.

## The signature: the assembly

`src/components/product/ExplodedScreen.tsx`.

A product screen is never presented as a finished picture. It arrives as an
exploded assembly — horizontal strata cut from the real screenshot, separated in
space with dimension lines and readouts between them, then drawn together into
the working interface.

The idea is the mark's own: an arch built from stacked stone that only stands
once the keystone is set. Mechanically it is cheap — every band paints the same
decoded bitmap through `background-position`, so one image serves all of them,
and scroll only writes a transform. No canvas, no WebGL.

## Structure

```
src/
  app/[locale]/     every route; the root layout lives here so <html lang> is real
    work/[slug]     the two shipped case studies
    labs/[slug]     the ten concepts
    capabilities/   the six stages, then the capability matrix, then the layers
    process/        six stages, in full
  app/api/          contact delivery
  components/
    chrome/         header, mobile nav, language switch, footer, cursor, entrance
    lab/            three working experiments
    labs/           the concept system: Icon, kit, LabSurface, LabsExplorer
    motion/         Reveal, SplitReveal, ScrollLit, Magnetic
    product/        ExplodedScreen, ProductBoard, ProductPlane
    sections/       page-level bands
    system/         the diagram set
    ui/             actions, chapter heads, page masthead
  data/
    labs/           types + the ten concepts, in three files
    matrix.ts       problem to proof, one dataset behind two presentations
    process.ts      the six stages and the twelve layers
    projects, screens, capabilities, lab, practice
  i18n/             the dictionary; en and tr side by side
  lib/              site config, i18n helpers, hooks, contact contract, OG
scripts/            asset preparation and the QA harnesses
```

The home page is one argument in seven moves, and the rhythm alternates on
purpose — real product, system, capability, concept:

1. The two products that shipped · 2. Why one studio rather than three ·
3. The thirteen kinds of software someone might be asking for · 4. The ten
concepts · 5. A chooser that resolves the visitor's own situation ·
6. Process · 7. The way in.

Proof comes first, before any capability claim. The concepts arrive only after
the real work has been shown, so their labelling has somewhere honest to sit.
And every claim ends at a visual object rather than a paragraph — the band that
used to state the studio's position in prose now states it and then draws it:
the eight steps from problem to live as one row, and the product opened to show
the layers under it.

`src/data/categories.ts` holds the thirteen categories behind move 3. Their
descriptions are written in a buyer's terms rather than an engineer's, and the
contact form's project types are the same thirteen words, so somebody who found
themselves in the map finds the same word on the form. They are
deliberately not the eight `DOMAINS` the work is organised by internally:
somebody arriving to ask for "internal tools" should not have to learn a
studio's taxonomy to find themselves in it. Each one resolves to a real screen
from a shipped product or to the running prototype of a concept, opened on the
screen that makes the point.

`/capabilities` carries the **capability matrix**: nine rows running from a
problem someone actually has, through the product type and the system it needs,
to something on this site that can be opened. `src/data/matrix.ts` is the
single source for both that table and the chooser on the home page, so the two
can never disagree.

### Languages

`middleware.ts` sends anything without a prefix to `/en`. Every page exists at
`/en/...` and `/tr/...`, so the switcher is two plain links to the same page —
it works without JavaScript, it is crawlable, and it never dumps you back on the
home page. `tr` is typed against the shape of `en` in `src/i18n/dictionary.ts`,
so a string cannot be added in one language and forgotten in the other; the
build fails instead. Project copy carries its own `{ en, tr }` pairs on the data.

### Assets

`npm run assets` rebuilds `src/assets/work/**` from the raw handoff. It does two
things beyond renaming:

1. **Privacy.** Meetzy is a social product and the captures carry real users.
   Screens showing faces are not used at all; screens carrying names in list
   rows get a coarse mosaic over those rows — deliberate, not a lazy blur — and
   the site says so wherever they appear.
2. **Framing.** The Erden captures are mobile Safari, so the browser chrome is
   cropped off and the product is composed as a plane.

The source screenshots are **942px wide** (they arrived through WhatsApp, which
recompresses). Nothing in the layout enlarges them past device scale, because a
soft screenshot undoes the argument it is making. Higher-resolution originals
are the single biggest available improvement.

## Content rules

Held to deliberately:

- No invented metrics, clients, testimonials, partnerships, awards or dates.
- **No technology stacks are listed anywhere**, for the studio or the projects.
  None was confirmed, and guessing one is exactly the kind of claim this site
  does not make. `Project` has no `stack` field to tempt anyone.
- Only stated facts appear: one person, Ankara, about two years, Meetzy live for
  about three months with around 2,000 signups, Erden Davetiye live with an
  integrated admin.
- **Archon Labs concepts are never presented as client work**, and a concept
  never sits unlabelled beside a shipped product — in the matrix, in the
  chooser, in the layer list or anywhere else. `proof.kind` is `shipped` or
  `concept`, and the two render differently everywhere.
- Sample data inside a prototype belongs to the fictional company inside that
  prototype. No figure in there describes Archon.
- The three Lab experiments are real and run on the page; they live in a band
  of their own on `/labs`, apart from the concepts. The Lab *notes* are stated
  positions and say so.
- **The technology section names layers, not vendors.** Which database or which
  host is a per-project decision, and printing a fixed list would be a claim
  about expertise nobody confirmed. The one named stack is this site's own,
  because you can check it.
- Social links render only when `SOCIALS` has real entries, and the contact
  address only when `NEXT_PUBLIC_CONTACT_EMAIL` is set — no mailbox exists yet,
  so the site shows none and routes people to the form.

## Contact form

`src/app/api/contact/route.ts` is the single integration point. Validation
returns error *keys*, not sentences, so the same rules run on a server that has
no idea which language the visitor is reading. With no mail provider configured
it answers 503 and the UI says so plainly; a submission is never reported as
successful unless one actually happened.

```bash
cp .env.example .env.local
```

## QA harnesses

Run against a production build (`npm run build && npx next start -p 3210`).
Every script honours `ARCHON_BASE`.

```bash
npm run qa:release       # release audit: every route in both languages —
                         # status, title, description, canonical, hreflang,
                         # lang, h1 count, og:image, the hero preload, the
                         # concept labelling, sitemap, robots, 404, console
                         # errors, failed requests and oversized assets
npm run qa:form          # the contact form end to end: honeypot, empty
                         # submit, bad email, the API round trip, and that no
                         # success is ever claimed that did not happen
npm run qa               # 17 routes x 4 viewports: overflow, console errors,
                         # dead links, missing alt text, plus screenshots
npm run qa:interactions  # nav, tabs, product boards, the assembly, the
                         # concept surfaces and the explorer, the category
                         # map, the system stack, the chooser, lab
                         # experiments, the language switch, form states,
                         # keyboard, reduced motion, no-JS
npm run qa:perf          # LCP / CLS / long tasks on a throttled connection
node scripts/contrast.mjs   # WCAG AA audit of every rendered text run
node scripts/fold.mjs       # hero fits the viewport at six sizes
node scripts/frames.mjs en .stage-track stage 5   # scroll choreography, frame by frame
```

## Two things the release audit caught

Both were invisible in every screenshot and every design review, and both broke
real journeys. They are written down because the same mistakes are easy to
reintroduce.

**Every locale-less URL answered 404.** `src/middleware.ts` sends anything
without a locale prefix to `/en`, and its matcher excluded static files with
`.*\..*`. Written in a TypeScript string as `"\."`, the backslash collapses and
the pattern becomes `.*.*` — which matches everything, so the negative
lookahead excluded every non-empty path and the middleware only ever ran on
`/`. `archonsoft.tr/contact` and every other prefix-less link returned 404. The
matcher now escapes the dot as `\.`, and there is a check for it in the
release audit.

**The designed 404 page never rendered.** The root layout lives under
`[locale]`, so a path matching no route never enters that subtree and Next
served its own bare page instead — white, unbranded, English, with no way back.
`src/app/[locale]/[...rest]/page.tsx` is a catch-all that calls `notFound()`
and pulls those paths into the locale tree, where `not-found.tsx` answers them.
More specific segments always win over a catch-all, so no real route is
shadowed. The 404 body lives in `NotFoundBody.tsx` so the two boundaries that
can render it cannot drift.

One consequence worth knowing: the 404 is delivered as an empty shell that
hydrates, so with scripting off it is blank. Fixing that properly means moving
the root layout out of `[locale]`, which would cost the per-locale `<html lang>`
this site is built on. The status code is correct either way.

## One performance note worth keeping

The hero screen is painted through `background-image`, because the assembly
cuts one decoded bitmap into bands. A background image is invisible to the
browser's preload scanner — it is only discovered once the stylesheet has
parsed and the element has been laid out — so the largest thing in the hero was
the last thing requested, and it took largest-contentful-paint with it. The
home page therefore emits an explicit high-priority preload for that URL.

It is a one-line fix and it is worth 1.4 seconds on a throttled connection.
Whenever this pattern is reused, the preload has to come with it.

## Mobile

Audited separately rather than as a narrowed desktop, because three things
break in the translation and none of them show up on a laptop:

- The category map is a column of thirteen names on a wide screen. On a phone
  that would put the panel it controls a screen away from the control, so below
  `lg` it becomes wrapped chips and the two stay in view together.
- The Labs explorer had the same fault for the same reason. It now has a single
  DOM order — name and promise, then the index, then the running product — and
  grid placement moves the index into its own column only on wide screens. A
  rail sitting a screen away from the thing it changes is not a control.
- The system stack is a rotated deck whose painted box is far larger than its
  element, so on a narrow screen it climbed over the paragraph above it. The
  scene clips and the deck scales down under 40rem.
- The first viewport has to carry proof, not just a headline. The badge, the
  product name and the three verified facts sit above the phone so they survive
  every viewport height the fold harness tests.

## Accessibility

Semantic landmarks, a skip link, visible focus rings, real tab lists for the
capabilities index, the chooser and every concept sidebar (arrow keys,
Home/End, roving tabindex), a focus-trapped
mobile overlay with Escape and scroll lock, labelled and error-annotated form
fields, and full `prefers-reduced-motion` support. Every motion primitive rests
in its final state under `.no-js` — including the product boards and the
assembly, which both collapse to plain readable layouts in CSS rather than in
the component.
