// Generates optimized responsive images from assets/ (originals + rendered PDFs) into public/.
// Run: npm run media   (rendered PDF pngs come from scripts/render-pdf.swift on macOS)
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const out = (p) => decodeURIComponent(new URL(`../public/${p}`, import.meta.url).pathname);
const src = (p) => decodeURIComponent(new URL(`../assets/${p}`, import.meta.url).pathname);
await mkdir(out('img'), { recursive: true });
await mkdir(out('certs'), { recursive: true });

async function variants(input, base, widths, opts = {}) {
  let pipeline = () => {
    let p = sharp(input, { failOn: 'none' }).rotate();
    if (opts.crop) p = p.extract(opts.crop);
    return p;
  };
  const meta = await pipeline().toBuffer().then((b) => sharp(b).metadata());
  for (const w of widths) {
    if (w > meta.width) continue; // never upscale
    for (const [fmt, o] of [['avif', { quality: 55, effort: 6 }], ['webp', { quality: 78 }]]) {
      await pipeline().resize({ width: w })[fmt](o).toFile(`${base}-${w}.${fmt}`);
    }
  }
  return meta;
}

// Portrait (source is 800x800: no upscaling, 400 + 800 covers 1x/2x for a 400px slot)
await variants(src('originals/portrait.jpg'), out('img/portrait'), [400, 800]);
await sharp(src('originals/portrait.jpg')).resize(800).jpeg({ quality: 82, mozjpeg: true }).toFile(out('img/portrait.jpg'));

// Video poster
await variants(src('work/poster.png'), out('media/intro-poster'), [480, 960]);

// Certificates: thumb 480 + full 1800 (lightbox), both avif + webp
const certs = [
  ['udacity-android-nanodegree', src('work/nd.png')],
  ['microsoft-github-copilot', src('work/ms.png'), { crop: { left: 170, top: 770, width: 3310, height: 1710 } }],
  // Launchpad photo: crop away the folded corners / table edge, no rotation needed (<0.3 deg tilt)
  ['mal-study-group-leader', src('originals/study group leader.jpg'), { crop: { left: 130, top: 40, width: 3220, height: 2200 } }],
];
for (const [name, file, opts] of certs) await variants(file, out(`certs/${name}`), [480, 1800], opts);
console.log('done');
