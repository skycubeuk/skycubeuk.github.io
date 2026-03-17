# Deploying the WY Chow Lab Website

This guide covers two stages:
1. **Test deployment** — live at `https://wychowlab.netlify.app` (free Netlify hosting)
2. **Production** — add your custom domain `wychowlab.org` when ready

Once set up, the site **automatically rebuilds and redeploys every time you push to GitHub**.

---

## What you need

- A [GitHub](https://github.com) account
- A [Netlify](https://netlify.com) account (free — sign up with your GitHub account)

---

## Step 1 — Push the code to GitHub

If you haven't already, create the GitHub repo and push:

```bash
cd /home/zabouth/wychowlab-web-v2
gh repo create skycubeuk/wychowlab-web --public --source=. --remote=origin --push
```

> You can name the repo anything — `wychowlab-web` is used here.

---

## Step 2 — Deploy to Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com) and log in
2. Click **Add new site → Import an existing project**
3. Choose **GitHub** and authorise Netlify
4. Select your `wychowlab-web` repository
5. Build settings are detected automatically from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Click **Deploy site**

Netlify will build and deploy the site. Your site is live at a URL like:
**`https://wychowlab.netlify.app`** (or a random name — you can rename it in Site Settings)

To rename the site:
- Go to **Site configuration → Site details → Change site name**
- Set it to `wychowlab` → URL becomes `https://wychowlab.netlify.app`

---

## Step 3 — Enable Netlify Identity (for CMS login)

1. In your Netlify dashboard, go to **Identity** (top nav)
2. Click **Enable Identity**
3. Under **Registration**, select **Invite only** (so only people you invite can log in)
4. Scroll to **Services → Git Gateway** and click **Enable Git Gateway**

---

## Step 4 — Invite editors

1. Go to **Identity → Invite users**
2. Enter the email address of anyone who needs to edit content
3. They'll receive an email to set a password — no GitHub account needed

---

## Step 5 — Access the CMS

Anyone you've invited can log in at:
**`https://wychowlab.netlify.app/admin`**

They log in with their email and password (set when they accepted the invite), then edit content through a web form. No code, no GitHub, no technical knowledge required.

---

## Step 6 — Add custom domain wychowlab.org (when ready)

1. In Netlify → **Domain management → Add a domain** → enter `wychowlab.org`
2. In your domain registrar, update DNS:

| Type | Name | Value |
|------|------|-------|
| `CNAME` | `www` | `wychowlab.netlify.app` |
| `A` | `@` | `75.2.60.5` |

3. Back in Netlify → **Domain management → Verify DNS configuration**
4. Tick **Force HTTPS**
5. Update `astro.config.mjs`: `site: 'https://www.wychowlab.org'`
6. Update `public/admin/config.yml`: change `site_url` and `display_url` to `https://www.wychowlab.org`
7. Commit and push — Netlify rebuilds automatically

---

## Day-to-day editing workflow

```
Editor visits /admin
        ↓
Logs in with email + password
        ↓
Edits content in the web form (no code needed)
        ↓
Clicks "Publish"
        ↓
Netlify commits the change to GitHub automatically
        ↓
Netlify rebuilds the site (~1-2 minutes)
        ↓
Updated site is live
```

---

## Troubleshooting

**Build fails on Netlify**
- Go to **Deploys** tab and click the failed deploy to see the build log

**CMS shows "Error: Failed to persist entry"**
- Make sure Git Gateway is enabled: Identity → Services → Git Gateway

**CMS login page doesn't appear**
- Make sure Netlify Identity is enabled on your site

**Custom domain shows "not secure"**
- HTTPS can take up to 24 hours after DNS propagates — check back later

**Site not updating after a push**
- Check the Deploys tab — the build may still be in progress
