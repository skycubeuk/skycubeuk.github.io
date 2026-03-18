# Changelog

All notable changes to the WY Chow Lab website are documented here.

---

## [Unreleased]

Changes that are live on GitHub Pages (`https://skycubeuk.github.io`) but not yet deployed to the production domain (`wychowlab.org`).

---

## 2026-03-18 — Migration to GitHub Pages + OAuth proxy

Replaced Netlify hosting and Netlify Identity with GitHub Pages and a self-hosted GitHub OAuth proxy.

### 🚀 Added
- **GitHub Actions workflow** (`.github/workflows/deploy.yml`) — builds the site with Node 22 and deploys to GitHub Pages on every push to `main`
- **GitHub OAuth proxy** (`proxy/`) — stateless Express/TypeScript service that handles the GitHub OAuth flow for Decap CMS; runs on a VPS at `cms.skycube.me.uk` via Docker + Traefik
- **Editorial workflow** — enabled `publish_mode: editorial_workflow` in `public/admin/config.yml`; CMS edits now create a pull request rather than committing directly to `main`

### ✏️ Changed
- **CMS backend** — switched from Netlify Identity + Git Gateway to GitHub OAuth (`backend.name: github`, `base_url: https://cms.skycube.me.uk`)
- **CMS URLs** — `site_url`/`display_url`/`logo_url` updated to `https://skycubeuk.github.io`
- **`astro.config.mjs`** — `site` updated to `https://skycubeuk.github.io`
- **Editor login** — editors now log in with their GitHub account instead of an email/password set via Netlify invite

### 🗑️ Removed
- **`netlify.toml`** — Netlify build configuration no longer needed

---

## 2026-03-17 — Initial rebuild (v2.0)

Complete rebuild of the site from Jekyll to **Astro v6 + Tailwind CSS v4 + Decap CMS**, initially deployed on Netlify (later migrated to GitHub Pages — see entry above).

### 🚀 Added
- **New site framework** — Astro v6 static site generator replacing the old Jekyll/Ruby stack
- **Tailwind CSS v4** — modern utility-first styling with custom lab purple `#552D62` brand colour
- **Decap CMS** at `/admin` — web-based editor for posts, projects, people, and publications
- **Netlify Identity + Git Gateway** — initial CMS authentication (later replaced by GitHub OAuth proxy)
- **Netlify hosting** — initial deployment target (later replaced by GitHub Pages)
- **All content migrated** from old Jekyll site:
  - 22 news posts (Markdown)
  - 5 research projects (Markdown)
  - 17 people entries (YAML)
  - 16 publications (YAML, converted from BibTeX)
- **Sitemap** auto-generated via `@astrojs/sitemap`
- **`netlify.toml`** — initial build configuration (later removed)
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
- `public/CNAME` — GitHub Pages custom domain file; not used initially (will be re-added when switching to `wychowlab.org`)

---

## How to add entries to this file

When making changes to the site code, add a new entry under `[Unreleased]` using these categories:

- **🚀 Added** — new features or pages
- **✏️ Changed** — updates to existing content or behaviour
- **🐛 Fixed** — bug fixes
- **🗑️ Removed** — deleted files or features

When the site goes live on `wychowlab.org`, move the `[Unreleased]` section to a dated release (e.g. `## 2026-04-01 — Launch on wychowlab.org`).
