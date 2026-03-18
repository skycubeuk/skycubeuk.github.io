# Deployment Guide — WY Chow Lab Website

## Current status

| Item | Status | Details |
|------|--------|---------|
| GitHub repo | ✅ Live | `skycubeuk/skycubeuk.github.io` |
| GitHub Pages | ✅ Live | Auto-deploys on every push/merge to `main` |
| Live URL | ✅ Live | https://skycubeuk.github.io |
| GitHub Actions | ✅ Live | `.github/workflows/deploy.yml` (build + deploy) |
| OAuth proxy | ✅ Live | https://cms.skycube.me.uk (Docker + Traefik on VPS) |
| CMS editor | ✅ Working | https://skycubeuk.github.io/admin |
| Custom domain | ⏳ Pending | Switch to `wychowlab.org` when ready |

---

## Giving editors CMS access

The CMS uses GitHub for authentication. Anyone who needs to edit content must:

1. Have a GitHub account
2. Be granted **write access** to the `skycubeuk/skycubeuk.github.io` repository:
   - Go to the repo → **Settings → Collaborators and teams → Add people**
   - Enter their GitHub username and set role to **Write**
   - They'll receive a GitHub invitation email — they must accept it

Once they have write access, they can log in at `https://skycubeuk.github.io/admin` using the **"Login with GitHub"** button.

> **Note:** The CMS runs in editorial workflow mode — edits create a pull request rather than committing directly to `main`. Editors click **Publish** in the CMS to create the PR, and someone with repo access must merge it to make changes live.

---

## Day-to-day editing

Editors visit **https://skycubeuk.github.io/admin**, log in with their GitHub account, and edit content through web forms.

```
Editor visits /admin → logs in with GitHub → edits content → clicks Publish
        ↓
Decap CMS opens a pull request on GitHub
        ↓
A maintainer merges the PR
        ↓
GitHub Actions builds the site (npm run build)
        ↓
GitHub Pages serves the updated site (~1–2 minutes after merge)
```

---

## Switching to the production domain (wychowlab.org)

When you're ready to go live on `wychowlab.org`:

### Step 1 — Add a CNAME file

Create `public/CNAME` containing just the domain (no `https://`):

```
wychowlab.org
```

### Step 2 — Update the site config

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

### Step 3 — Configure the custom domain in GitHub

1. Go to the repo → **Settings → Pages**
2. Under **Custom domain**, enter `wychowlab.org` and click **Save**
3. Tick **Enforce HTTPS** once the certificate is provisioned

### Step 4 — Update DNS records

In your domain registrar (wherever you manage `wychowlab.org`), set:

| Type | Name | Value |
|------|------|-------|
| `A` | `@` | `185.199.108.153` |
| `A` | `@` | `185.199.109.153` |
| `A` | `@` | `185.199.110.153` |
| `A` | `@` | `185.199.111.153` |
| `CNAME` | `www` | `skycubeuk.github.io` |

DNS changes can take up to 24 hours to propagate. GitHub Pages will automatically provision an HTTPS certificate once DNS resolves.

### Step 5 — Commit and push

Commit the `CNAME` file and config changes — GitHub Actions will rebuild and deploy.

---

## OAuth proxy

The CMS authentication is handled by a self-hosted GitHub OAuth proxy in the `proxy/` folder. It runs on a VPS at `cms.skycube.me.uk` using Docker and Traefik for TLS termination.

### What it does

Decap CMS cannot exchange OAuth codes for tokens directly (no server-side secret storage in a static site). The proxy provides two endpoints:

- `GET /auth` — redirects the user to GitHub's OAuth authorisation page
- `GET /callback` — receives the code from GitHub, exchanges it for an access token, and returns it to the CMS popup window via `postMessage`

### Deploying / updating the proxy

```bash
# On the VPS, in the proxy directory
git pull                        # get latest code
docker compose build            # rebuild the image
docker compose up -d            # restart the container
```

### First-time proxy setup on a new VPS

1. Create a GitHub OAuth App:
   - Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
   - Homepage URL: `https://skycubeuk.github.io`
   - Authorization callback URL: `https://cms.skycube.me.uk/callback`
   - Copy the Client ID and generate a Client Secret

2. Copy `.env.example` to `.env` and fill in `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

3. Copy `docker-compose.override.yml.example` to `docker-compose.override.yml` and update the Traefik labels for your domain and certresolver

4. Make sure the `proxy` Docker network exists and Traefik is attached to it:
   ```bash
   docker network create proxy
   ```

5. Start the proxy:
   ```bash
   docker compose up -d
   ```

> **Important:** `ALLOWED_ORIGIN` must exactly match the scheme + host of your live site (e.g. `https://skycubeuk.github.io`). The proxy pins postMessage communication to this origin — mismatched values will break CMS login.

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

**Build fails on GitHub Actions**
Go to the repo → **Actions** tab → click the failed run to see the full build log.

**CMS shows "Login with GitHub" but clicking it does nothing / errors**
Check that the OAuth proxy at `https://cms.skycube.me.uk` is running:
```bash
curl https://cms.skycube.me.uk/auth
# Should redirect (302) to github.com
```
If it's down, SSH to the VPS and run `docker compose up -d` in the `proxy/` directory.

**CMS shows "No entries" for People or Publications**
These collections use `.yaml` files. The config has `extension: yaml` and `format: yaml` set — if this is ever reset, that's the fix.

**CMS edits don't appear on the site after merging a PR**
Check the Actions tab — the build may still be in progress (~1–2 minutes) or may have failed.

**Custom domain shows "not secure"**
HTTPS certificate provisioning can take up to 24 hours after DNS propagates — check back later. Verify DNS is set correctly at https://dnschecker.org.

**Site not updating after a push**
Check the Actions tab — the build may still be running, or may have failed with an error.
