# Changelog

All notable changes to `decap-oauth-proxy` are documented here.

## [1.0.0] — 2025-03

Initial release.

### Features

- **GitHub OAuth flow** — handles `/auth` → GitHub → `/callback` → Decap CMS postMessage handshake
- **CSRF protection** — 16-byte random state tokens, 10-minute TTL, pruned on every request
- **Rate limiting** — `/auth` returns HTTP 429 when the pending-state map reaches 500 entries
- **Repo-permission access control** — after token exchange, verifies the user has `push` access to `GITHUB_REPO` using their own token; denies login with a clear error message if not
- **Configurable OAuth scope** — `GITHUB_SCOPE` env var (default `public_repo`; use `repo` for private repos)
- **XSS-safe callback page** — `<`, `>`, and `&` are Unicode-escaped when embedding values in `<script>` blocks; HTML text is separately escaped with `escapeHtml()`
- **postMessage origin pinning** — tokens are only sent to `ALLOWED_ORIGIN`; wildcard `'*'` is never used
- **Error UX** — blocked or errored logins render a styled error card with a "Close this window" button instead of a blank white popup
- **Structured audit log** — JSONL written to a Docker volume; logs `auth_start`, `auth_success`, `auth_blocked`, `auth_failure`, `auth_error`, `token_exchange_error`, `auth_rejected`; `LOG_LEVEL=off` disables the file
- **Health check** — `GET /health` returns `{"status":"ok"}`
- **Graceful shutdown** — `SIGTERM` handler closes the log write-stream before exiting
- **Non-root Docker** — multi-stage build; final image runs as the built-in `node` user
- **Startup validation** — all required env vars (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REPO`, `ALLOWED_ORIGIN`) are checked at startup; invalid `PORT` values exit with a clear error
- **Traefik trust** — `trust proxy = 1` for correct `req.ip` behind a reverse proxy

### Infrastructure

- Docker Compose with a named volume (`proxy-logs`) for log persistence
- `.env.example` documenting all env vars
