# Deployment Guide — WY Chow Lab Website

## Current status

| Item | Status | Details |
|------|--------|---------|
| GitHub repo | ✅ Live | `skycubeuk/skycubeuk.github.io` |
| Netlify hosting | ✅ Live | Auto-deploys on every push to `main` |
| Preview URL | ✅ Live | https://jovial-profiterole-aed202.netlify.app |
| Netlify Identity | ✅ Enabled | Invite-only registration |
| Git Gateway | ✅ Enabled | CMS can commit to GitHub |
| CMS editor | ✅ Working | https://jovial-profiterole-aed202.netlify.app/admin |
| Custom domain | ⏳ Pending | Switch to `wychowlab.org` when ready |

---

## Inviting new editors

Anyone you want to give CMS access to needs an invite:

1. Go to: https://app.netlify.com/projects/jovial-profiterole-aed202/configuration/identity
2. Click **Invite users**
3. Enter their email address — they'll receive a link to set a password
4. Once they've set a password they can log in at `/admin` — no GitHub account needed

> **Note:** After clicking the invite link, a popup will appear on the homepage asking them to set a password. If they don't see it, ask them to try the link again in a fresh browser tab.

---

## Day-to-day editing

Editors visit **https://jovial-profiterole-aed202.netlify.app/admin**, log in with email + password, and edit content through web forms. No coding required.

```
Editor visits /admin → logs in → edits content → clicks Publish
        ↓
Decap CMS commits the change to GitHub automatically
        ↓
Netlify detects the new commit and rebuilds the site (~2 minutes)
        ↓
Updated site is live
```

---

## Switching to the production domain (wychowlab.org)

When you're happy with the preview site and ready to go live on `wychowlab.org`:

### Step 1 — Add the domain in Netlify

1. Go to https://app.netlify.com/projects/jovial-profiterole-aed202/domain-management
2. Click **Add a domain**
3. Enter `wychowlab.org` and follow the verification steps
4. Tick **Force HTTPS** once the domain is verified

### Step 2 — Update DNS records

In your domain registrar (wherever you manage `wychowlab.org`), set:

| Type | Name | Value |
|------|------|-------|
| `A` | `@` | `75.2.60.5` |
| `CNAME` | `www` | `jovial-profiterole-aed202.netlify.app` |

DNS changes can take up to 24 hours to propagate.

### Step 3 — Update the site config

In `astro.config.mjs`, change the `site` line:
```js
site: 'https://www.wychowlab.org',
```

In `public/admin/config.yml`, update the URL lines:
```yaml
site_url: https://www.wychowlab.org
display_url: https://www.wychowlab.org
logo_url: https://www.wychowlab.org/img/logo.png
```

Commit and push — Netlify rebuilds automatically with the new URLs.

---

## Making code changes

The site rebuilds automatically whenever you push to `main`. For local development:

```bash
# Install dependencies (first time only)
npm install

# Start local dev server at http://localhost:4321
npm run dev

# Build and check for errors before pushing
npm run build
```

---

## Troubleshooting

**Build fails on Netlify**
Go to https://app.netlify.com/projects/jovial-profiterole-aed202/deploys and click the failed deploy to see the full build log.

**CMS invite email link doesn't show a password form**
The Netlify Identity widget must be loaded on the page. Make sure the deploy is complete before clicking the link. Try opening the link in a fresh browser tab (not an email preview pane).

**CMS shows "Error: Failed to persist entry"**
Check that Git Gateway is enabled:
https://app.netlify.com/projects/jovial-profiterole-aed202/configuration/identity
→ scroll to **Services → Git Gateway**

**CMS shows "No entries" for People or Publications**
These collections use `.yaml` files. The config has `extension: yaml` and `format: yaml` set — if this is ever reset, that's the fix.

**Custom domain shows "not secure"**
HTTPS provisioning can take up to 24 hours after DNS propagates — check back later.

**Site not updating after a push or CMS edit**
Check the Deploys tab — the build may still be in progress (usually takes ~2 minutes).
