/**
 * Generates static meta assets used by index.html:
 *   - /og-image.png            (1200x630 social-share card)
 *   - /favicon.svg             (vector favicon)
 *   - /apple-touch-icon.png    (180x180 iOS home-screen icon)
 *   - /favicon-32x32.png       (legacy fallback)
 *   - /favicon-16x16.png       (legacy fallback)
 *
 * Uses Sharp + inline SVG. Fonts fall back to system serif/sans-serif so the
 * output is deterministic across machines (Fraunces is not bundled - the
 * site itself loads it via Google Fonts at runtime).
 */

import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const PROJECT_ROOT = new URL('../', import.meta.url).pathname.replace(/^\//, '');

// Brand tokens copied from index.html :root
const PAPER = '#F0EAE0';
const PAPER_WARM = '#E6DECE';
const INK = '#13100B';
const INK_SOFT = '#473F33';
const INK_QUIET = '#857A6D';
const ACCENT = '#C8401F';
const RULE = '#C2B89F';

// ─────────────────────────────────────────────────────────
// OG image (1200x630)
// ─────────────────────────────────────────────────────────
const ogSvg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="rule" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="0.7" fill="${INK}" opacity="0.06"/>
    </pattern>
  </defs>

  <!-- Paper background -->
  <rect width="1200" height="630" fill="${PAPER}"/>
  <rect width="1200" height="630" fill="url(#rule)"/>

  <!-- Top wordmark -->
  <text x="80" y="100" font-family="Georgia, 'Times New Roman', serif" font-size="36" font-weight="600" fill="${INK}" letter-spacing="-0.5">
    SKM<tspan fill="${ACCENT}">.</tspan>digital
  </text>

  <!-- Top-right meta -->
  <text x="1120" y="100" text-anchor="end" font-family="ui-monospace, 'SF Mono', Menlo, Consolas, monospace" font-size="14" fill="${INK_QUIET}" letter-spacing="2">
    INDEPENDENT STUDIO &#8212; WOODBURY, CT
  </text>

  <!-- Hairline -->
  <line x1="80" y1="135" x2="1120" y2="135" stroke="${RULE}" stroke-width="1"/>

  <!-- Headline -->
  <text x="80" y="290" font-family="Georgia, 'Times New Roman', serif" font-size="120" font-weight="400" fill="${INK}" letter-spacing="-3">
    Building <tspan font-style="italic" font-weight="300">cool</tspan> sh<tspan fill="${ACCENT}">*</tspan>t.
  </text>

  <!-- Subheadline -->
  <text x="80" y="380" font-family="Georgia, 'Times New Roman', serif" font-size="48" font-weight="400" fill="${INK_SOFT}" letter-spacing="-0.5">
    WordPress, Salesforce, custom tools.
  </text>

  <!-- Body -->
  <text x="80" y="465" font-family="-apple-system, 'Segoe UI', sans-serif" font-size="22" fill="${INK_SOFT}">
    For nonprofits, mission-driven companies, and the occasional brewery.
  </text>

  <!-- Bottom hairline -->
  <line x1="80" y1="540" x2="1120" y2="540" stroke="${RULE}" stroke-width="1"/>

  <!-- Bottom labels -->
  <text x="80" y="580" font-family="ui-monospace, 'SF Mono', Menlo, Consolas, monospace" font-size="14" fill="${INK_QUIET}" letter-spacing="2">
    20+ YEARS &#8901; 100+ LAUNCHES
  </text>
  <text x="1120" y="580" text-anchor="end" font-family="ui-monospace, 'SF Mono', Menlo, Consolas, monospace" font-size="14" fill="${INK_QUIET}" letter-spacing="2">
    SKM.DIGITAL
  </text>

  <!-- Accent dot -->
  <circle cx="1100" cy="572" r="6" fill="${ACCENT}"/>
</svg>`;

await sharp(Buffer.from(ogSvg))
  .png({ compressionLevel: 9, palette: false })
  .toFile(`${PROJECT_ROOT}og-image.png`);
console.log('  og-image.png            generated (1200x630)');

// ─────────────────────────────────────────────────────────
// Favicon (SVG + PNG fallbacks)
// ─────────────────────────────────────────────────────────
// Big "S" wordmark with the signature orange dot. Square 64x64 viewbox.
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="10" fill="${PAPER_WARM}"/>
  <text x="32" y="46" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="44" font-weight="600" fill="${INK}">S</text>
  <circle cx="50" cy="48" r="5" fill="${ACCENT}"/>
</svg>`;

await writeFile(`${PROJECT_ROOT}favicon.svg`, faviconSvg);
console.log('  favicon.svg             generated');

// PNG rasterizations from the same SVG
const faviconBuffer = Buffer.from(faviconSvg);

await sharp(faviconBuffer).resize(180, 180).png().toFile(`${PROJECT_ROOT}apple-touch-icon.png`);
console.log('  apple-touch-icon.png    generated (180x180)');

await sharp(faviconBuffer).resize(32, 32).png().toFile(`${PROJECT_ROOT}favicon-32x32.png`);
console.log('  favicon-32x32.png       generated');

await sharp(faviconBuffer).resize(16, 16).png().toFile(`${PROJECT_ROOT}favicon-16x16.png`);
console.log('  favicon-16x16.png       generated');

console.log('\nDone.');
