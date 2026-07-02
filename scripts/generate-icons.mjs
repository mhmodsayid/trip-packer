/**
 * Generate PWA icon PNGs from SVG artwork.
 * Usage: node scripts/generate-icons.mjs
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const assetsDir = join(__dirname, "..", "assets");

const THEME = "#2563eb";
const WHITE = "#ffffff";

function iconSvg(size, { maskable = false } = {}) {
  const pad = maskable ? size * 0.18 : size * 0.1;
  const s = size - pad * 2;
  const cx = size / 2;
  const bodyW = s * 0.52;
  const bodyH = s * 0.42;
  const bodyX = cx - bodyW / 2;
  const bodyY = pad + s * 0.28;
  const r = s * 0.06;
  const handleW = s * 0.22;
  const handleH = s * 0.14;
  const handleX = cx - handleW / 2;
  const handleY = bodyY - handleH * 0.85;
  const checkX = cx - s * 0.14;
  const checkY = bodyY + bodyH * 0.38;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${THEME}"/>
  <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="${r}" fill="${WHITE}"/>
  <rect x="${bodyX + bodyW * 0.08}" y="${bodyY + bodyH * 0.42}" width="${bodyW * 0.84}" height="${s * 0.025}" rx="${s * 0.012}" fill="${THEME}" opacity="0.35"/>
  <path d="M ${handleX} ${bodyY} V ${handleY + handleH * 0.35} Q ${cx} ${handleY} ${handleX + handleW} ${handleY + handleH * 0.35} V ${bodyY}" fill="none" stroke="${WHITE}" stroke-width="${s * 0.045}" stroke-linecap="round"/>
  <path d="M ${checkX - s * 0.08} ${checkY} L ${checkX} ${checkY + s * 0.1} L ${checkX + s * 0.16} ${checkY - s * 0.12}" fill="none" stroke="${THEME}" stroke-width="${s * 0.055}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

async function writePng(filename, size, options) {
  const svg = iconSvg(size, options);
  const outPath = join(publicDir, filename);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`Wrote ${outPath}`);
}

mkdirSync(publicDir, { recursive: true });
mkdirSync(assetsDir, { recursive: true });

const masterSvg = iconSvg(512);
writeFileSync(join(assetsDir, "app-icon.svg"), masterSvg);
console.log(`Wrote ${join(assetsDir, "app-icon.svg")}`);

await writePng("icon-192.png", 192);
await writePng("icon-512.png", 512);
await writePng("icon-512-maskable.png", 512, { maskable: true });
await writePng("apple-touch-icon.png", 180);
await writePng("favicon-32.png", 32);

console.log("Done.");
