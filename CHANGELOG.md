# Changelog

All notable changes to the WY Chow Lab website are documented here.

---

## [Unreleased]

Changes that are live on the Netlify preview site (`https://jovial-profiterole-aed202.netlify.app`) but not yet deployed to the production domain (`wychowlab.org`).

---

## 2026-03-17 — Initial rebuild (v2.0)

Complete rebuild of the site from Jekyll to **Astro v6 + Tailwind CSS v4 + Decap CMS**, deployed on Netlify with browser-based content editing for non-technical users.

### 🚀 Added
- **New site framework** — Astro v6 static site generator replacing the old Jekyll/Ruby stack
- **Tailwind CSS v4** — modern utility-first styling with custom lab purple `#552D62` brand colour
- **Decap CMS** at `/admin` — web-based editor for posts, projects, people, and publications; no GitHub account or coding required for editors
- **Netlify Identity + Git Gateway** — secure email/password login for CMS editors; changes commit directly to GitHub and trigger an automatic rebuild
- **Netlify hosting** — automatic deploys on every push to `main`, free tier, HTTPS included
- **All content migrated** from old Jekyll site:
  - 22 news posts (Markdown)
  - 5 research projects (Markdown)
  - 17 people entries (YAML)
  - 16 publications (YAML, converted from BibTeX)
- **Sitemap** auto-generated via `@astrojs/sitemap`
- **`netlify.toml`** — build configuration (Node 22, `npm run build`, publish `dist/`)
- **`DEPLOYMENT.md`** — full step-by-step deployment guide including custom domain and CMS setup
- **`README.md`** — comprehensive project documentation

### 🎨 Design
- Clean white layout with lab purple accent (`#552D62`)
- Inter font (Google Fonts)
- Card-based research project grid
- Sticky navigation with mobile hamburger menu
- Responsive at all screen sizes (mobile 390px, tablet 768px, desktop)

### 🐛 Fixed (during initial build)
- **Post links broken** — Astro v6 removed `entry.slug`; migrated to `entry.id` throughout
- **`shortnews` schema default** — wrong default (`true`) was hiding all post headings; corrected to `false`
- **News item image alignment** — posts with images had text pushed left; fixed to always use compact side-thumbnail layout (`flex-row`, `w-20 h-16`)
- **People card alignment on project pages** — cards had no fixed width causing vertical stacking; fixed with `w-36` and `flex-shrink-0`
- **Blue/grey text** — Tailwind v4's default `gray` palette uses OKLCH hue 256° (blue range); overrode entire grey scale with neutral zero-chroma values in `global.css`
- **Long bio text overflow** — added `line-clamp-2` to truncate long institutional affiliations in people cards
- **Node.js version** — Astro v6 requires `>=22.12.0`; updated build to Node 22
- **Netlify Identity widget CDN failure** — `identity.netlify.com` CDN blocked in some environments; switched to bundling `netlify-identity-widget` via npm
- **CMS People & Publications showing no entries** — Decap CMS defaults to `.md` files; added `extension: yaml` and `format: yaml` to both collections
- **CMS media library empty** — `media_folder` pointed to `public/img/uploads/` (non-existent); corrected to `public/img/`
- **CMS images missing per collection** — added per-collection `media_folder` so post images show from `img/posts/`, people from `img/people/`, covers from `img/covers/`

### 🗑️ Removed
- `.github/workflows/deploy.yml` — GitHub Pages workflow no longer needed; Netlify handles all deployments
- `public/CNAME` — GitHub Pages custom domain file; not used by Netlify

---

## How to add entries to this file

When making changes to the site code, add a new entry under `[Unreleased]` using these categories:

- **🚀 Added** — new features or pages
- **✏️ Changed** — updates to existing content or behaviour
- **🐛 Fixed** — bug fixes
- **🗑️ Removed** — deleted files or features

When the site goes live on `wychowlab.org`, move the `[Unreleased]` section to a dated release (e.g. `## 2026-04-01 — Launch on wychowlab.org`).
