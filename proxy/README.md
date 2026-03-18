# decap-oauth-proxy

A small, self-hosted OAuth proxy that lets [Decap CMS](https://decapcms.org/) authenticate via GitHub OAuth Apps. It works with **any static host** (GitHub Pages, Cloudflare Pages, S3, …) — no Netlify required.

## Features

- **Access control** — only GitHub users with write access to your repository can log in; manage access entirely from the GitHub collaborators UI, no server editing needed
- **Audit log** — every login attempt (success, failure, or block) is recorded to a persistent log file with timestamp and username
- **Works with any static host** — GitHub Pages, Cloudflare Pages, S3, or anything else; the only requirement is that your content repository is on GitHub

---

## Prerequisites

- A VPS (or any server) with Docker + Docker Compose
- A domain name for the proxy (e.g. `cms.example.com`) with DNS pointing to the server
- A TLS-terminating reverse proxy in front of the container (Traefik, Caddy, Nginx — see [Reverse-proxy setup](#reverse-proxy-setup))
- A [GitHub OAuth App](https://github.com/settings/developers) for your site

---

## Quick start

### 1. Create a GitHub OAuth App

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
2. Set **Homepage URL** to your site (e.g. `https://your-site.example.com`)
3. Set **Authorization callback URL** to `https://your-cms-proxy.example.com/callback`
4. Copy the **Client ID** and generate a **Client Secret**

### 2. Configure Decap CMS

In your CMS config file (`public/admin/config.yml` or similar):

```yaml
backend:
  name: github
  repo: owner/repo
  base_url: https://your-cms-proxy.example.com
```

### 3. Clone and configure

```sh
git clone https://github.com/your-org/decap-oauth-proxy
cd decap-oauth-proxy/proxy   # or wherever the proxy folder lives
cp .env.example .env
# Edit .env with your values
```

### 4. Run

```sh
docker compose up -d --build
```

The proxy listens on port `3000`. Point your reverse proxy at it (see below).

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GITHUB_CLIENT_ID` | ✅ | — | OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | ✅ | — | OAuth App Client Secret |
| `GITHUB_REPO` | ✅ | — | `owner/repo` — only collaborators with push access can log in |
| `ALLOWED_ORIGIN` | ✅ | — | Origin of your CMS site, e.g. `https://your-site.example.com` (no trailing slash) |
| `GITHUB_SCOPE` | — | `public_repo` | OAuth scope. Use `repo` for private repositories |
| `PORT` | — | `3000` | HTTP port the server listens on |
| `LOG_LEVEL` | — | `info` | Set to `off` to disable the audit log file |
| `LOG_FILE` | — | `<cwd>/logs/auth.log` | Override the audit log path |

---

## Access control

Access is managed entirely through GitHub — no config files to edit on the server.

- **Grant access**: GitHub → your repo → **Settings → Collaborators → Add people**
- **Revoke access**: GitHub → your repo → **Settings → Collaborators** → remove them

Takes effect on the user's next login attempt.

---

## Audit log

Auth events are written as JSONL to `/app/logs/auth.log` inside the container (mounted as a named Docker volume so it persists across container restarts).

Example entries:

```jsonl
{"timestamp":"2025-01-15T10:23:01.123Z","event":"auth_start","ip":"1.2.3.4"}
{"timestamp":"2025-01-15T10:23:02.456Z","event":"auth_success","ip":"1.2.3.4","github_username":"alice"}
{"timestamp":"2025-01-15T10:24:00.000Z","event":"auth_blocked","ip":"5.6.7.8","github_username":"mallory"}
```

| Event | Meaning |
|---|---|
| `auth_start` | User initiated the OAuth flow |
| `auth_success` | Login succeeded |
| `auth_blocked` | User authenticated with GitHub but lacks repo write access |
| `auth_failure` | Invalid/expired state, missing code, etc. |
| `auth_error` | GitHub returned an error during the OAuth flow |
| `token_exchange_error` | GitHub API or internal error during token exchange |
| `auth_rejected` | `/auth` rate-limited (too many pending states) |

View the live log:

```sh
docker compose exec oauth-proxy tail -f /app/logs/auth.log
```

---

## Reverse-proxy setup

The container exposes port `3000` over plain HTTP. Your reverse proxy handles TLS. Below are minimal examples — adapt hostnames, certificate resolvers, and port numbers to your own setup.

### Traefik (Docker labels)

Add to `docker-compose.yml` under `services.oauth-proxy`:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.oauth-proxy.rule=Host(`cms.example.com`)"
  - "traefik.http.routers.oauth-proxy.entrypoints=websecure"
  - "traefik.http.routers.oauth-proxy.tls=true"
  - "traefik.http.routers.oauth-proxy.tls.certresolver=letsencrypt"
  - "traefik.http.services.oauth-proxy.loadbalancer.server.port=3000"
```

Also remove the `ports:` mapping from `docker-compose.yml` — Traefik reaches the container over the Docker network directly.

### Caddy

```caddy
cms.example.com {
    reverse_proxy localhost:3000
}
```

Caddy automatically provisions and renews a Let's Encrypt certificate.

### Nginx

```nginx
server {
    listen 443 ssl;
    server_name cms.example.com;

    ssl_certificate     /etc/letsencrypt/live/cms.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cms.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

If you're behind Nginx (not Traefik), set `app.set('trust proxy', 1)` is already enabled — no extra config needed.

---

## Updating

```sh
git pull
docker compose up -d --build
```

The named volume `proxy-logs` persists across rebuilds.

---

## Troubleshooting

**Login popup stays open with a white/blank screen**  
The popup now shows a styled error card with a "Close this window" button for all error cases. If you see a plain white screen you may be running an older version — rebuild the image.

**`auth_blocked` in the log but the user should have access**  
Check they have been added as a collaborator (not just an outside contributor) and that they accepted the invitation.

**`token_exchange_error: GitHub access check failed`**  
GitHub API may be temporarily unreachable. The proxy fails closed — the user must try again.

**Port 3000 not accessible**  
Check the container is running (`docker compose ps`) and that your firewall allows traffic from the reverse proxy to the container.
