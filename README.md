# SKM.digital

Marketing site for SKM.digital — independent studio building web platforms, integrations, and custom tools.

## Stack

Pure static HTML/CSS/JS. No framework. Served via the [`serve`](https://www.npmjs.com/package/serve) Node package so it can run on Railway (or anywhere Node runs).

```
.
├── index.html              # The whole site - inline CSS/JS, single page
├── images/                 # Optimized project screenshots (.webp)
├── og-image.png            # 1200x630 social-share card
├── favicon.svg             # Vector favicon
├── favicon-16x16.png       # Legacy favicon fallbacks
├── favicon-32x32.png
├── apple-touch-icon.png    # 180x180 iOS home-screen icon
├── robots.txt              # Allow all + sitemap pointer
├── sitemap.xml             # Single-URL sitemap (homepage)
├── serve.json              # Cache + security headers for serve
├── railway.json            # Railway build/deploy config
├── package.json            # serve dependency + start scripts
└── scripts/
    ├── optimize-images.mjs   # PNG -> WebP (run via `npm run images`)
    └── generate-meta-assets.mjs  # OG card + favicons (run via `npm run meta`)
```

## Local development

```bash
npm install
npm run dev           # http://localhost:3000
```

## Deploy to Railway

### Option A — connect a GitHub repo

1. Push this directory to a GitHub repo.
2. In Railway: **New Project → Deploy from GitHub repo**.
3. Select the repo. Railway auto-detects Node via `package.json`, runs `npm install`, then `npm start`.
4. Set a custom domain: **Settings → Networking → Custom Domain → `skm.digital`**. Add the CNAME record Railway gives you to your DNS provider.

No environment variables required. Railway sets `PORT` automatically; the start script reads it.

### Option B — Railway CLI from this directory

```bash
railway login
railway link              # link to existing project, or `railway init` for new
railway up                # builds and deploys from current directory
```

## Editing content

Everything is in [`index.html`](./index.html). Sections in order:

- `<nav class="top">` — wordmark, availability pill, social links
- `<section class="hero">` — animated headline + subheading + CTA
- `<div class="marquee">` — scrolling capability list
- `<section class="work">` — 4-card project grid (screenshots in `/images`)
- `<section class="what">` — "What I Do" prose
- `<section class="clients">` — direct + agency client lists
- `<section class="kisho">` — featured Kisho long-bet section (auto-scrolling screenshot)
- `<section class="contact">` — email CTA
- `<footer>` — wordmark, socials, copyright

To swap a project screenshot: drop a new image into `/images/`, then update the `src` in the matching `<a class="project">` block.

## Design notes

- Color tokens live in `:root` at the top of the `<style>` block (`--paper`, `--ink`, `--accent`, etc.)
- Fonts pulled from Google Fonts: Fraunces (serif), Geist (sans), JetBrains Mono (mono), Nunito (Kisho brand only)
- Paper-grain texture is an inline SVG data URI on `body::before` with `mix-blend-mode: multiply`
- Screenshot containers use `isolation: isolate` to prevent the grain from bleeding through

## Regenerating assets

Drop new screenshots (PNG or JPG) into `images/`, then:

```bash
npm run images   # resize to 1800px max + convert to WebP @ q82
npm run meta     # regenerate og-image.png, favicons (rerun after brand changes)
```

Both scripts are idempotent and read tokens straight from the design system.

## SEO checklist

Already wired:

- [x] `<title>` and `<meta description>` (keyword-targeted, ~155 chars)
- [x] Canonical URL (`https://skm.digital/`)
- [x] Open Graph + Twitter Card (with 1200x630 og-image)
- [x] Favicon set (SVG + 16/32 PNG + apple-touch-icon)
- [x] `theme-color` and `color-scheme`
- [x] JSON-LD structured data: Person + ProfessionalService + WebSite (Local CT geo)
- [x] `robots.txt` and `sitemap.xml`
- [x] Image `width`/`height` attributes (CLS prevention)
- [x] `loading="lazy"` + `decoding="async"` on all below-fold images
- [x] Google Analytics 4 (gtag) - measurement ID `G-ZZXCKWE96S`

Pre-launch verification (do these once the site is live at the real domain):

- [ ] Run [Lighthouse](https://pagespeed.web.dev/) - target 95+ on all four categories
- [ ] Validate JSON-LD at [Schema Markup Validator](https://validator.schema.org/)
- [ ] Validate OG card preview at [opengraph.xyz](https://www.opengraph.xyz/) or LinkedIn Post Inspector
- [ ] Submit `https://skm.digital/sitemap.xml` to [Google Search Console](https://search.google.com/search-console) and [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [ ] Confirm GA4 is recording sessions in real-time view
- [ ] Test on a real iPhone + Android (sticky-on-scroll behaviors, the auto-scrolling Kisho image)
