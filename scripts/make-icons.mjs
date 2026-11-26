// Generates the favicon / app-icon set from the logo mark. Run: npm run icons
import sharp from 'sharp';
import { writeFile, unlink } from 'node:fs/promises';
const out = (f) => new URL(`../public/${f}`, import.meta.url).pathname;
// Monogram: the "M" chevron mark in Android green on the site's near-black. Works on light and dark tabs because the tile is opaque.
const mark = (radius, scale = 1) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="${radius}" fill="#0b0f14"/><path d="M12 46V18l20 20 20-20v28" fill="none" stroke="#3ddc84" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" transform="translate(${32 - 32 * scale} ${32 - 32 * scale}) scale(${scale})"/></svg>`);
const png = (size, radius = 14, scale = 1) => sharp(mark(radius, scale), { density: 800 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
await writeFile(out('favicon-16x16.png'), await png(16, 4));
await writeFile(out('favicon-32x32.png'), await png(32, 7));
await writeFile(out('apple-touch-icon.png'), await png(180, 0));              // iOS rounds the corners itself
await writeFile(out('android-chrome-192x192.png'), await png(192));
await writeFile(out('android-chrome-512x512.png'), await png(512));
await writeFile(out('maskable-512x512.png'), await png(512, 0, 0.7));           // safe-zone padding for maskable icons
// favicon.ico with 16, 32 and 48 px PNG frames
const frames = [[16, await png(16, 4)], [32, await png(32, 7)], [48, await png(48, 10)]];
const head = Buffer.alloc(6 + 16 * frames.length); head.writeUInt16LE(1, 2); head.writeUInt16LE(frames.length, 4);
let offset = head.length;
frames.forEach(([s, buf], i) => { const o = 6 + 16 * i; head[o] = s; head[o + 1] = s; head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6); head.writeUInt32LE(buf.length, o + 8); head.writeUInt32LE(offset, o + 12); offset += buf.length; });
await writeFile(out('favicon.ico'), Buffer.concat([head, ...frames.map(([, b]) => b)]));
for (const old of ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png']) await unlink(out(old)).catch(() => {});
console.log('icons done');
