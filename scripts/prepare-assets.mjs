/**
 * Turns the raw handoff in `_incoming/` into the named, cropped, privacy-safe
 * images the site imports from `src/assets/`.
 *
 * Two jobs beyond renaming:
 *
 * 1. Meetzy is a social product, so several screens carry real users' names and
 *    photographs. Screens showing faces are not used at all. Screens carrying
 *    first names in list rows are pixelated over those rows — a coarse mosaic
 *    rather than a soft blur, so it reads as a deliberate redaction instead of
 *    a mistake — and are only ever placed at device scale in the layout.
 *
 * 2. Erden Davetiye screens are browser captures. The Safari chrome is cropped
 *    off so the product can be composed as a plane rather than a phone photo.
 *
 * Re-runnable: it always rebuilds from `_incoming/`, never from its own output.
 */
import sharp from "sharp";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const RAW_M = path.join(ROOT, "_incoming/meetzy-raw");
const RAW_MS = path.join(ROOT, "_incoming/meetzy-store");
const RAW_E = path.join(ROOT, "_incoming/erden-raw");
const OUT_M = path.join(ROOT, "src/assets/work/meetzy");
const OUT_E = path.join(ROOT, "src/assets/work/erden");
const RAW_D = path.join(ROOT, "_incoming/dppano-raw");
const OUT_D = path.join(ROOT, "src/assets/work/dppano");

const W = 942;
const H = 2048;

/** Source height of the iOS Safari furniture on these captures. */
const SAFARI_TOP = 130;
const SAFARI_BOTTOM = 240;

/**
 * Replaces a rectangle with a coarse mosaic of itself. Reading the region back
 * at 1/14 scale and stretching it up with nearest-neighbour keeps the block
 * grid hard-edged, which is what makes it look intended.
 */
async function redact(image, rects) {
  if (rects.length === 0) return image;
  const base = await image.png().toBuffer();
  const composites = [];

  for (const [left, top, width, height] of rects) {
    // Two passes on purpose: sharp keeps only the last resize in a chain, so
    // the shrink and the nearest-neighbour blow-up cannot share a pipeline.
    const small = await sharp(base)
      .extract({ left, top, width, height })
      .resize(Math.max(2, Math.round(width / 16)), Math.max(2, Math.round(height / 16)), {
        fit: "fill",
      })
      .png()
      .toBuffer();

    const block = await sharp(small)
      .resize(width, height, { fit: "fill", kernel: "nearest" })
      .png()
      .toBuffer();

    composites.push({ input: block, left, top });
  }

  return sharp(base).composite(composites);
}

async function write(pipeline, file) {
  await pipeline.jpeg({ quality: 90, chromaSubsampling: "4:4:4" }).toFile(file);
  const meta = await sharp(file).metadata();
  console.log(`  ${path.basename(file).padEnd(30)} ${meta.width}x${meta.height}`);
}

/** Meetzy — native app captures, status bar kept (it reads as a real device). */
const MEETZY = [
  { src: "WhatsApp Image 2026-09-03 at 21.26.58 (4).jpeg", out: "01-auth.jpg" },
  { src: "WhatsApp Image 2026-09-03 at 21.26.58 (5).jpeg", out: "02-mood.jpg" },
  { src: "WhatsApp Image 2026-09-03 at 21.26.58 (3).jpeg", out: "03-map.jpg" },
  {
    src: "WhatsApp Image 2026-09-03 at 21.26.58.jpeg",
    out: "04-profile-detail.jpg",
    // Crop below the header: the screen's value is the structured profile
    // underneath, and the name at the top is a real person's.
    crop: { left: 0, top: 300, width: W, height: H - 300 },
  },
  {
    src: "WhatsApp Image 2026-09-03 at 21.26.59.jpeg",
    out: "05-nearby.jpg",
    // Host name + avatar, last line of each card in the list.
    redact: [0, 1, 2, 3, 4].map((i) => [58, 764 + i * 258, 340, 62]),
  },
  {
    src: "WhatsApp Image 2026-09-03 at 21.26.59 (5).jpeg",
    out: "06-feed.jpg",
    redact: [0, 1, 2, 3].map((i) => [66, 210 + i * 502, 320, 76]),
  },
  { src: "WhatsApp Image 2026-09-03 at 21.26.59 (4).jpeg", out: "07-memories.jpg" },
];

/**
 * Meetzy — the App Store set, and the product's main images.
 *
 * Designed marketing plates rather than captures: the people in them are
 * stock photography, not Meetzy users, so nothing here is redacted. They
 * arrive at 1290x2796 and are kept at that size — unlike the WhatsApp
 * captures there is real resolution to keep.
 */
const MEETZY_STORE = [
  { src: "01-problem.png", out: "store-01-problem.jpg" },
  { src: "02-plan.png", out: "store-02-plan.jpg" },
  { src: "03-real.png", out: "store-03-real.jpg" },
  { src: "04-join.png", out: "store-04-join.jpg" },
];

/** Erden Davetiye — browser captures, chrome cropped to a clean plane. */
const ERDEN = [
  { src: "WhatsApp Image 2026-09-03 at 21.25.49.jpeg", out: "01-home.jpg" },
  { src: "WhatsApp Image 2026-09-03 at 21.25.50.jpeg", out: "02-categories.jpg" },
  { src: "WhatsApp Image 2026-09-03 at 21.25.50 (1).jpeg", out: "03-collections.jpg" },
  { src: "WhatsApp Image 2026-09-03 at 21.25.50 (2).jpeg", out: "04-styles.jpg" },
  { src: "WhatsApp Image 2026-09-03 at 21.25.50 (3).jpeg", out: "05-products.jpg" },
  { src: "WhatsApp Image 2026-09-03 at 21.25.50 (4).jpeg", out: "06-support.jpg" },
  { src: "WhatsApp Image 2026-09-03 at 21.25.50 (6).jpeg", out: "07-navigation.jpg" },
  { src: "WhatsApp Image 2026-09-03 at 21.25.50 (5).jpeg", out: "08-footer.jpg" },
  {
    src: "WhatsApp Image 2026-09-03 at 21.25.50 (7).jpeg",
    out: "09-admin.jpg",
    // The signed-in account's own address sits at the foot of the drawer.
    // Public business contact details elsewhere are left alone - they are
    // already published on the live site - but this one is not.
    redact: [[45, 1590, 330, 62]],
  },
];

/**
 * DP Pano — browser captures of a live product.
 *
 * The handover also carried three generated illustrations, offered as section
 * breaks. They are not used. Two are photoreal renders of a classroom and the
 * third is stock-shaped clip art, and all three sit at right angles to the way
 * everything else on this site looks — on a page whose argument is that only
 * verified things get published, next to eleven captures of software that
 * actually runs, a drawing of a school is the weakest thing on the page. The
 * originals stay in `_incoming` if that judgement is ever revisited.
 *
 * Nothing is redacted because nothing needs to be: the whole package was
 * produced against demo data, which the person who built it stated in the
 * handover. The only processing is a resize, and the three smaller captures
 * keep their own size rather than being blown up to match the others.
 */
const DPPANO = [
  { src: "01-pano-genel.png", out: "01-board.jpg" },
  { src: "02-pano-ogretmenler-odasi.png", out: "02-staffroom.jpg" },
  { src: "03-pano-kantin.png", out: "03-canteen.jpg" },
  { src: "04-panel-ekranlar.png", out: "04-screens.jpg" },
  { src: "05-panel-duzen-editoru.png", out: "05-layout.jpg" },
  { src: "06-ders-programi-cizelge.png", out: "06-timetable.jpg" },
  { src: "07-ders-programi-cozucu.png", out: "07-solver.jpg" },
  { src: "08-nobet-otomatik-dagitim.png", out: "08-duty.jpg", width: 1400 },
  { src: "09-nobet-cizelgesi-cikti.png", out: "09-duty-print.jpg", width: 1228 },
  { src: "10-kvkk-guvenli-mod.png", out: "10-safe-mode.jpg" },
  { src: "11-yetkili-hesap-yetkileri.png", out: "11-permissions.jpg", width: 1346 },
];

async function run(list, rawDir, outDir, { chrome = false, width = 0, clean = true } = {}) {
  if (clean) await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  for (const item of list) {
    let pipeline = sharp(path.join(rawDir, item.src));

    if (chrome) {
      pipeline = pipeline.extract({
        left: 0,
        top: SAFARI_TOP,
        width: W,
        height: H - SAFARI_TOP - SAFARI_BOTTOM,
      });
    } else if (item.crop) {
      pipeline = pipeline.extract(item.crop);
    }

    if (item.redact) pipeline = await redact(pipeline, item.redact);

    /* DP Pano arrives at up to 2880px across, which is more than twice what
       any layout on this site asks for and four times what the world's
       textures use. Resizing on the way in keeps the repository honest without
       compressing anything the eye will meet: the widest use is a full-bleed
       plate on an 1800px content column. */
    const cap = item.width ?? width;
    if (cap) pipeline = pipeline.resize({ width: cap, withoutEnlargement: true });

    await write(pipeline, path.join(outDir, item.out));
  }
}

console.log("Meetzy →");
await run(MEETZY, RAW_M, OUT_M);
await run(MEETZY_STORE, RAW_MS, OUT_M, { clean: false });
console.log("Erden Davetiye →");
await run(ERDEN, RAW_E, OUT_E, { chrome: true });
console.log("DP Pano →");
await run(DPPANO, RAW_D, OUT_D, { width: 1800 });
console.log("\nDone.");
