# Copilot Instructions — WY Chow Lab Website

## Commands

```sh
npm run dev      # Dev server at http://localhost:4321
npm run build    # Production build (also validates content schemas)
npm run preview  # Preview production build locally
```

There are no tests or linters configured. Run `npm run build` to catch type/schema errors before pushing.

## Architecture

Static site built with **Astro v6**, **Tailwind CSS v4**, deployed to **Netlify** on every push to `main`. Content is also editable via **Decap CMS** at `/admin` (Netlify Identity + Git Gateway).

### Content Collections (`src/content/`)

All content lives in Astro Content Collections defined in `src/content.config.ts`. The schemas are the source of truth for valid fields.

| Collection | Format | Key fields |
|---|---|---|
| `posts` | Markdown | `date`, `shortnews` (bool), `icon`, `displayimage` (optional) |
| `projects` | Markdown | `title`, `excerpt`, `status` (`active`/`inactive`), `people` (array of person IDs) |
| `people` | YAML | `id`, `displayName`, `role`, `order` (sort order) |
| `publications` | YAML | `title`, `authors`, `journal`, `year`, `doi`, `isCover` |
| `settings` | YAML | Single file: `src/content/settings/general.yaml` |

**People IDs** are the YAML filename without extension (e.g. `ying`, `phd2024_beth`). These are used in `projects[].people` to link people to projects. The `id` field inside the YAML must match the filename.

**Post filenames** follow `YYYY-MM-DD-slug.md` — Decap CMS enforces this, but manual files should too.

**`shortnews: true`** posts render without a heading on both the list and detail pages, and suppress the "Read more →" link. Short news items are self-contained in their body text.

### Routing

One `.astro` file per route in `src/pages/`. Dynamic routes use `getStaticPaths` with the Astro v5 Content Layer API:
- `src/pages/posts/[...slug].astro` — individual posts; `p.id` is the slug
- `src/pages/projects/[...slug].astro` — individual projects; resolves linked people via a `peopleById` lookup map

Content is rendered with `render()` imported from `astro:content` (not the legacy `entry.render()` method):
```ts
import { getCollection, render } from 'astro:content';
const { Content } = await render(entry);
```

Rendered markdown always uses this Tailwind Typography class string: `prose prose-lg max-w-none prose-a:text-[#552d62] prose-headings:text-gray-900`.

### Layouts

- `src/layouts/Base.astro` — full HTML shell with nav, footer, Netlify Identity widget, and mobile menu
- `src/layouts/Post.astro` — wraps Base for news post pages

### Components

All four components in `src/components/` accept explicit props (no slot-based composition). `PersonCard.astro` has three display variants controlled by a `variant` prop: `'full'` (detailed with bio + social links), `'card'` (compact grid tile), `'mini'` (inline name + bio text).

**Icon map** — the mapping from icon name strings (e.g. `'graduation-cap'`) to emoji is duplicated in both `NewsItem.astro` and `src/pages/posts/[...slug].astro`. When adding a new icon, update both files **and** add the option to `public/admin/config.yml`.

### Data sorting conventions

Pages always sort collections the same way:
- **People**: ascending by `order` field
- **Posts**: descending by `date`
- **Projects**: descending by `lastUpdated`

The `peopleById` lookup pattern (`Object.fromEntries(allPeople.map(p => [p.data.id, p.data]))`) is used on both the home page and project detail pages to resolve person IDs to data objects.

People role values: `faculty`, `postdoc`, `student`, `collab`, `ugrad-alum`, `alum`. Alumni filtering uses `['alum', 'ugrad-alum']` together.

### Images

Static images live in `public/img/` with subfolders `people/`, `posts/`, and `covers/`. Image paths in content are stored as absolute paths from the public root (e.g. `/img/people/ying.png`).

## Styling

Tailwind v4 is configured via the **Vite plugin** (`@tailwindcss/vite`) — there is no `tailwind.config.js`. All theme customisation is in `src/styles/global.css` using `@theme {}` blocks.

- **Brand colour**: `lab-*` scale (e.g. `bg-[#552d62]` is `lab-700`, the primary purple). Hardcoded hex values in components match this palette.
- **Gray palette**: Overridden to hue-less `oklch` values to avoid Tailwind v4's default blue-tinted grays.
- **Typography**: Inter font via Google Fonts. `@tailwindcss/typography` is available for prose content.
- The global CSS is imported once in `Base.astro`.

## TypeScript

Extends `astro/tsconfigs/strict` — strict mode is enforced. Type annotations are expected on component props interfaces and `GetStaticPaths`.

## CMS Config

`public/admin/config.yml` defines all Decap CMS collections and must stay in sync with `src/content.config.ts`. When adding a new field to a content schema:
1. Add it to the Zod schema in `src/content.config.ts`
2. Add the corresponding widget to `public/admin/config.yml`

The CMS `media_folder` is `public/img` and `public_folder` is `/img`. When switching to the production domain (`wychowlab.org`), update both `site_url`/`display_url`/`logo_url` in `public/admin/config.yml` **and** `site` in `astro.config.mjs`.
