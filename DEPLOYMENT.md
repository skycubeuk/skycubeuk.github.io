# Deploying the WY Chow Lab Website to GitHub Pages

This guide covers two stages:
1. **Test deployment** — live at `https://skycubeuk.github.io/` (your personal account, free, no custom domain)
2. **Production deployment** — move to `wychowlab.org` once you're happy with the site

Once set up, the site will **automatically rebuild and redeploy every time you push a change to GitHub**.

---

## What you need

- A [GitHub](https://github.com) account (username: `skycubeuk`)
- [Git](https://git-scm.com/downloads) installed on your computer
- The [GitHub CLI](https://cli.github.com/) (`gh`) — optional but makes things easier

---

## Stage 1 — Test deployment at skycubeuk.github.io

### Step 1 — Create the GitHub repository

The repo must be named exactly `skycubeuk.github.io` — this is GitHub's special "personal site" name that serves at the root URL.

#### Option A: Using the GitHub CLI (easiest)

```bash
cd /home/zabouth/wychowlab-web-v2
gh repo create skycubeuk/skycubeuk.github.io --public --source=. --remote=origin --push
```

This creates the repo, links it, and pushes everything in one command.

#### Option B: Using the GitHub website

1. Go to [https://github.com/new](https://github.com/new)
2. Set the owner to `skycubeuk` (your personal account)
3. Name the repository **`skycubeuk.github.io`** (exactly this — it's a special name)
4. Set it to **Public**
5. **Do not** tick "Add a README", ".gitignore", or "licence" — the repo already has these
6. Click **Create repository**

Then link and push:

```bash
cd /home/zabouth/wychowlab-web-v2
git remote add origin https://github.com/skycubeuk/skycubeuk.github.io.git
git push -u origin main
```

---

### Step 2 — Enable GitHub Pages

1. Go to `https://github.com/skycubeuk/skycubeuk.github.io`
2. Click **Settings** (top tab)
3. Click **Pages** (left sidebar, under "Code and automation")
4. Under **Build and deployment → Source**, select **GitHub Actions**
   > ⚠️ Select "GitHub Actions" — NOT "Deploy from a branch". The workflow uses the modern Pages deployment method.
5. No further settings needed — click **Save** if prompted

---

### Step 3 — Watch the first deploy

After you push to `main`, GitHub Actions automatically:

1. Installs dependencies
2. Builds the site (`npm run build`)
3. Deploys the built files

Watch progress at:
`https://github.com/skycubeuk/skycubeuk.github.io/actions`

The first deploy takes ~2–3 minutes. Once the action shows a green ✅, your site is live at:

**`https://skycubeuk.github.io/`**

---

## Stage 2 — Production deployment to wychowlab.org

Once you've reviewed the test site and are happy to go live, follow these additional steps.

### Step 4 — Point the site to wychowlab.org

In `astro.config.mjs`, update `site`:

```js
site: 'https://www.wychowlab.org',
```

Add a `CNAME` file to `public/` containing just:

```
wychowlab.org
```

Commit and push:

```bash
git add astro.config.mjs public/CNAME
git commit -m "Switch to production domain wychowlab.org"
git push
```

### Step 5 — Update DNS records

In your domain registrar (wherever you manage wychowlab.org), set:

| Type | Name | Value |
|------|------|-------|
| `A` | `@` | `185.199.108.153` |
| `A` | `@` | `185.199.109.153` |
| `A` | `@` | `185.199.110.153` |
| `A` | `@` | `185.199.111.153` |
| `CNAME` | `www` | `skycubeuk.github.io` |

Then in GitHub → **Settings → Pages → Custom domain**, type `wychowlab.org` and tick **Enforce HTTPS**.

DNS changes can take up to 24 hours to propagate.

> **Note:** If you want to transfer the repo to the `wychowlab` organisation instead, go to **Settings → Danger Zone → Transfer** and update the `repo:` line in `public/admin/config.yml` accordingly.

---

## Step 6 — Set up the Decap CMS editor (for browser-based editing)

This lets non-technical team members edit content at `/admin` without touching code.

### 6a — Create a GitHub OAuth App

1. Go to [https://github.com/settings/developers](https://github.com/settings/developers)
2. Click **OAuth Apps → New OAuth App**
3. Fill in:
   - **Application name:** `WY Chow Lab CMS`
   - **Homepage URL:** `https://skycubeuk.github.io` (or `https://wychowlab.org` for production)
   - **Authorization callback URL:** `https://sveltia-cms-auth.vercel.app/callback`
4. Click **Register application**
5. Note your **Client ID** and generate a **Client Secret**

### 6b — Deploy the OAuth proxy (one-click, free)

1. Go to [https://github.com/sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth)
2. Click **Deploy to Vercel** (free Vercel account required)
3. Set these environment variables during setup:
   - `GITHUB_CLIENT_ID` — your Client ID from step 6a
   - `GITHUB_CLIENT_SECRET` — your Client Secret from step 6a
4. Deploy — Vercel gives you a URL like `https://my-auth.vercel.app`

### 6c — Update the CMS config

Edit `public/admin/config.yml` and update the `base_url` line:

```yaml
backend:
  name: github
  repo: skycubeuk/skycubeuk.github.io
  branch: main
  base_url: https://my-auth.vercel.app    # ← update this with your Vercel URL
```

Then commit and push:

```bash
git add public/admin/config.yml
git commit -m "Update CMS config with OAuth proxy URL"
git push
```

### 6d — Grant access to editors

Anyone who needs to edit the site must:
1. Have a GitHub account
2. Be added as a **collaborator** on the repository (Settings → Collaborators)

They can then visit `/admin`, log in with GitHub, and edit content directly.

---

## Day-to-day editing workflow

```
Editor visits /admin
        ↓
Logs in with GitHub
        ↓
Edits content in the web form (no code needed)
        ↓
Clicks "Publish"
        ↓
Decap CMS commits the change to GitHub automatically
        ↓
GitHub Actions rebuilds the site (~2 minutes)
        ↓
Updated site is live
```

---

## Troubleshooting

**Build fails on GitHub Actions**
- Go to the Actions tab and click the failed run to see the error log

**Site shows "There isn't a GitHub Pages site here"**
- Make sure you selected **"GitHub Actions"** as the source (not "Deploy from a branch")
- Check the Actions tab — the first deploy may still be running

**Custom domain shows "not secure"**
- HTTPS can take up to 24 hours after DNS propagates — check back later

**CMS login doesn't work**
- Double-check the `base_url` in `public/admin/config.yml` matches your Vercel deployment URL exactly
- Make sure the GitHub OAuth App callback URL matches exactly

**Site not updating after a push**
- Check the Actions tab — the build may still be in progress

