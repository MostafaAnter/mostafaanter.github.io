// Generates the favicon / app-icon set. Run: npm run icons
// Two tiers (chosen by testing legibility at 16 px on light AND dark browser tabs):
//   - tab icons (16/32/48, favicon.ico, favicon.svg): bold "M" on an Android-green tile
//   - larger icons (apple-touch, android-chrome, maskable) and the nav logo: "MA" monogram on the green tile
import sharp from 'sharp';
import { writeFile, unlink } from 'node:fs/promises';
const out = (f) => new URL(`../public/${f}`, import.meta.url).pathname;
const G = '#3ddc84', D = '#0b0f14';
const stroke = (d, w) => `<path d="${d}" fill="none" stroke="${D}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const M_GLYPH = stroke('M13 47V17l19 21 19-21v30', 7);
const MA_GLYPH = `<g transform="translate(32 32) scale(.9) translate(-32 -32) translate(-1 0)">${stroke('M8 47V17l10 14 10-14v30', 5.5)}${stroke('M36 47l11-30 11 30M40.5 38h13', 5.5)}</g>`;
const tile = (glyph, r = 14) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="${r}" fill="${G}"/>${glyph}</svg>`;
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${G}"/><g transform="translate(32 32) scale(.72) translate(-32 -32)">${MA_GLYPH}</g></svg>`;
const png = (svg, size) => sharp(Buffer.from(svg), { density: 800 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

await writeFile(out('favicon.svg'), tile(M_GLYPH));
await writeFile(out('favicon-16x16.png'), await png(tile(M_GLYPH, 4), 16));
await writeFile(out('favicon-32x32.png'), await png(tile(M_GLYPH, 7), 32));
await writeFile(out('apple-touch-icon.png'), await png(tile(MA_GLYPH, 0), 180));   // iOS rounds the corners itself
await writeFile(out('android-chrome-192x192.png'), await png(tile(MA_GLYPH), 192));
await writeFile(out('android-chrome-512x512.png'), await png(tile(MA_GLYPH), 512));
await writeFile(out('maskable-512x512.png'), await png(maskable, 512));
const frames = [[16, await png(tile(M_GLYPH, 4), 16)], [32, await png(tile(M_GLYPH, 7), 32)], [48, await png(tile(M_GLYPH, 10), 48)]];
const head = Buffer.alloc(6 + 16 * frames.length); head.writeUInt16LE(1, 2); head.writeUInt16LE(frames.length, 4);
let offset = head.length;
frames.forEach(([s, buf], i) => { const o = 6 + 16 * i; head[o] = s; head[o + 1] = s; head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6); head.writeUInt32LE(buf.length, o + 8); head.writeUInt32LE(offset, o + 12); offset += buf.length; });
await writeFile(out('favicon.ico'), Buffer.concat([head, ...frames.map(([, b]) => b)]));
await unlink(out('og-logo.tmp')).catch(() => {});
console.log('icons done');
