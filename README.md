# WY Chow Lab Website

The website for the **WY Chow Lab** at the University of Warwick — a solid-state NMR research group using magnetic resonance to study biomolecules in the extracellular matrix.

🌐 **Live site:** [https://jovial-profiterole-aed202.netlify.app](https://jovial-profiterole-aed202.netlify.app)

---

## How it works

The site is built with [Astro](https://astro.build) and deployed automatically to [Netlify](https://netlify.com) on every push to `main`. Content is managed through a web-based CMS — no coding required for day-to-day edits.

### Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | [Astro v6](https://astro.build) — static site generator |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| CMS | [Decap CMS](https://decapcms.org) with Netlify Identity |
| Hosting | [Netlify](https://netlify.com) (free tier) |
| Authentication | Netlify Identity + Git Gateway |

### Editing content (non-technical)

All content can be edited at **`/admin`** on the live site:

1. Go to the site URL + `/admin`
2. Log in with your email and password (set when you accepted the invite)
3. Edit people, posts, projects, or publications using the web forms
4. Click **Publish** — changes are committed to GitHub automatically and the site rebuilds within ~2 minutes

No GitHub account, no code editor, no terminal required.

### How deployments work

```
Edit in /admin  ──or──  git push
        ↓                    ↓
Decap CMS commits      Code pushed to
to GitHub              GitHub (main)
        └──────┬────────────┘
               ↓
    Netlify detects new commit
               ↓
    Builds site (npm run build)
               ↓
    Site live in ~2 minutes
```

---

## Content structure

All content lives in `src/content/` as Astro Content Collections:

| Collection | Format | Location |
|------------|--------|----------|
| News posts | Markdown | `src/content/posts/` |
| Research projects | Markdown | `src/content/projects/` |
| People | YAML | `src/content/people/` |
| Publications | YAML | `src/content/publications/` |
| Site settings | YAML | `src/content/settings/` |

Images are in `public/img/` with subfolders `posts/`, `people/`, and `covers/`.

---

## Local development

**Prerequisites:** [Node.js](https://nodejs.org) v22 or higher

```sh
# Install dependencies
npm install

# Start local dev server (http://localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## Project structure

```
wychowlab-web-v2/
├── public/
│   ├── admin/
│   │   ├── index.html          # Decap CMS admin panel
│   │   └── config.yml          # CMS collection definitions
│   └── img/                    # Static images
│       ├── people/             # Profile photos
│       ├── posts/              # Post images
│       └── covers/             # Journal cover images
├── src/
│   ├── components/             # Reusable Astro components
│   │   ├── NewsItem.astro
│   │   ├── PersonCard.astro
│   │   ├── ProjectCard.astro
│   │   └── PublicationItem.astro
│   ├── content/                # All site content (edit via CMS or directly)
│   │   ├── posts/
│   │   ├── projects/
│   │   ├── people/
│   │   ├── publications/
│   │   └── settings/
│   ├── layouts/
│   │   ├── Base.astro          # HTML shell, nav, footer
│   │   └── Post.astro          # Individual post layout
│   ├── pages/                  # One file per route
│   │   ├── index.astro         # Home
│   │   ├── research.astro
│   │   ├── publications.astro
│   │   ├── people.astro
│   │   ├── join.astro
│   │   ├── posts/
│   │   └── projects/
│   └── styles/
│       └── global.css          # Tailwind + custom theme
├── astro.config.mjs
├── netlify.toml                # Netlify build config
└── DEPLOYMENT.md               # Full deployment guide
```

---

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full guide including:
- Deploying to Netlify
- Enabling Netlify Identity for the CMS
- Inviting editors
- Adding a custom domain (wychowlab.org)

---

## Pages

| URL | Description |
|-----|-------------|
| `/` | Home — mission statement, latest news, research cards, people section |
| `/research` | All research projects |
| `/projects/:slug` | Individual project detail with people involved |
| `/publications` | Full publications list with journal covers |
| `/people` | Full people page — faculty, students, collaborators, alumni |
| `/posts` | All news posts archive |
| `/posts/:slug` | Individual post |
| `/join` | Join the lab — opportunities for students and postdocs |
| `/admin` | CMS editor (requires login) |
