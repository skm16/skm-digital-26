/**
 * Image optimizer for /public/images
 *
 * Resizes each PNG to a max width of 1800px (still 2x for retina) and writes
 * a WebP at quality 82. Originals are left untouched - run `npm run images`
 * after dropping new screenshots into /public/images.
 */

import { readdir, stat } from 'node:fs/promises';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const IMAGES_DIR = new URL('../public/images/', import.meta.url).pathname.replace(/^\//, '');
const MAX_WIDTH = 1800;
const WEBP_QUALITY = 82;

const fmt = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const files = await readdir(IMAGES_DIR);
const pngs = files.filter((f) => f.toLowerCase().endsWith('.png'));

if (pngs.length === 0) {
  console.log('No PNGs found in /images.');
  process.exit(0);
}

console.log(`Optimizing ${pngs.length} image(s) -> WebP @ q${WEBP_QUALITY}, max ${MAX_WIDTH}px wide\n`);

let totalIn = 0;
let totalOut = 0;

for (const file of pngs) {
  const inputPath = join(IMAGES_DIR, file);
  const outputPath = join(IMAGES_DIR, `${parse(file).name}.webp`);

  const inStat = await stat(inputPath);
  const meta = await sharp(inputPath).metadata();

  const pipeline = sharp(inputPath);
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  await pipeline
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toFile(outputPath);

  const outStat = await stat(outputPath);
  totalIn += inStat.size;
  totalOut += outStat.size;

  const ratio = (1 - outStat.size / inStat.size) * 100;
  console.log(
    `  ${file.padEnd(28)} ${fmt(inStat.size).padStart(9)} -> ${fmt(outStat.size).padStart(9)}  (-${ratio.toFixed(0)}%)`
  );
}

console.log(
  `\nTotal: ${fmt(totalIn)} -> ${fmt(totalOut)}  (-${((1 - totalOut / totalIn) * 100).toFixed(0)}%)`
);
