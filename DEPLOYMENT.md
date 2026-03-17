# Deploying the WY Chow Lab Website to GitHub Pages

This guide walks you through deploying the site for the first time. Once set up, the site will **automatically rebuild and redeploy every time you push a change to GitHub**.

---

## What you need

- A [GitHub](https://github.com) account
- [Git](https://git-scm.com/downloads) installed on your computer
- The [GitHub CLI](https://cli.github.com/) (`gh`) — optional but makes things easier

---

## Step 1 — Create the GitHub repository

### Option A: Using the GitHub CLI (easiest)

```bash
cd /home/zabouth/wychowlab-web-v2
gh repo create wychowlab/wychowlab-web-v2 --public --source=. --remote=origin --push
```

This creates the repo, links it, and pushes everything in one command.

### Option B: Using the GitHub website

1. Go to [https://github.com/new](https://github.com/new)
2. Set the owner to your organisation (e.g. `wychowlab`) or your personal account
3. Name the repository `wychowlab-web-v2`
4. Set it to **Public**
5. **Do not** tick "Add a README", ".gitignore", or "licence" — the repo already has these
6. Click **Create repository**

Then in your terminal, link and push the local repo:

```bash
cd /home/zabouth/wychowlab-web-v2

# Replace YOUR-ORG-OR-USERNAME with your GitHub username or organisation
git remote add origin https://github.com/YOUR-ORG-OR-USERNAME/wychowlab-web-v2.git
git push -u origin main
```

---

## Step 2 — Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top tab)
3. Click **Pages** (left sidebar, under "Code and automation")
4. Under **Build and deployment → Source**, select **Deploy from a branch**
5. Under **Branch**, select `gh-pages` and keep the folder as `/ (root)`
6. Click **Save**

> **Note:** The `gh-pages` branch is created automatically by GitHub Actions after the first push. If it doesn't appear yet, wait a minute and refresh.

---

## Step 3 — Wait for the first deploy

After you push to `main`, GitHub Actions will:

1. Install dependencies
2. Build the site
3. Push the built files to the `gh-pages` branch

You can watch the progress at:
`https://github.com/YOUR-ORG-OR-USERNAME/wychowlab-web-v2/actions`

The first deploy usually takes 2–3 minutes. Once the action shows a green ✅, your site is live.

---

## Step 4 — Set up the custom domain (wychowlab.org)

The repo already contains a `CNAME` file set to `wychowlab.org`.

In your domain registrar (wherever you bought wychowlab.org), update the DNS records:

| Type | Name | Value |
|------|------|-------|
| `A` | `@` | `185.199.108.153` |
| `A` | `@` | `185.199.109.153` |
| `A` | `@` | `185.199.110.153` |
| `A` | `@` | `185.199.111.153` |
| `CNAME` | `www` | `YOUR-ORG-OR-USERNAME.github.io` |

Then in GitHub:
1. Go to **Settings → Pages**
2. Under **Custom domain**, type `wychowlab.org`
3. Tick **Enforce HTTPS**

DNS changes can take up to 24 hours to propagate.

---

## Step 5 — Set up the Decap CMS editor (for browser-based editing)

This lets non-technical team members edit content at `https://wychowlab.org/admin` without touching code.

### 5a — Create a GitHub OAuth App

1. Go to [https://github.com/settings/developers](https://github.com/settings/developers)
2. Click **OAuth Apps → New OAuth App**
3. Fill in:
   - **Application name:** `WY Chow Lab CMS`
   - **Homepage URL:** `https://wychowlab.org`
   - **Authorization callback URL:** `https://sveltia-cms-auth.vercel.app/callback`
4. Click **Register application**
5. Note your **Client ID** and generate a **Client Secret**

### 5b — Deploy the OAuth proxy (one-click, free)

1. Go to [https://github.com/sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth)
2. Click **Deploy to Vercel** (free Vercel account required)
3. Set these environment variables during setup:
   - `GITHUB_CLIENT_ID` — your Client ID from step 5a
   - `GITHUB_CLIENT_SECRET` — your Client Secret from step 5a
4. Deploy — Vercel gives you a URL like `https://my-auth.vercel.app`

### 5c — Update the CMS config

Edit `public/admin/config.yml` and update the `base_url` line:

```yaml
backend:
  name: github
  repo: YOUR-ORG-OR-USERNAME/wychowlab-web-v2   # ← update this
  branch: main
  base_url: https://my-auth.vercel.app            # ← update this
```

Then commit and push:

```bash
git add public/admin/config.yml
git commit -m "Update CMS config with OAuth proxy URL"
git push
```

### 5d — Grant access to editors

Anyone who needs to edit the site must:
1. Have a GitHub account
2. Be added as a **collaborator** on the repository (Settings → Collaborators)

They can then go to `https://wychowlab.org/admin`, log in with GitHub, and edit content directly.

---

## Day-to-day: How the editing workflow works

```
Editor visits wychowlab.org/admin
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
Updated site is live at wychowlab.org
```

---

## Troubleshooting

**Build fails on GitHub Actions**
- Go to the Actions tab and click the failed run to see the error log

**Custom domain shows "not secure"**
- HTTPS can take up to 24 hours after DNS propagates — check back later

**CMS login doesn't work**
- Double-check the `base_url` in `public/admin/config.yml` matches your Vercel deployment URL
- Make sure the GitHub OAuth callback URL matches exactly

**Site not updating after a push**
- Check the Actions tab — the build may still be in progress
