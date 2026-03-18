import express, { type Request, type Response } from 'express';
import { randomBytes } from 'node:crypto';
import { log } from './logger.js';

const app = express();

// Trust the first proxy (Traefik) so req.ip reflects the real client IP
// rather than the container's internal address.
app.set('trust proxy', 1);

const {
  GITHUB_CLIENT_ID: CLIENT_ID,
  GITHUB_CLIENT_SECRET: CLIENT_SECRET,
  GITHUB_REPO,
  ALLOWED_ORIGIN,
  PORT = '3000',
} = process.env;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing required env vars: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET');
  process.exit(1);
}

if (!GITHUB_REPO) {
  console.error('Missing required env var: GITHUB_REPO (e.g. skycubeuk/skycubeuk.github.io)');
  process.exit(1);
}

if (!ALLOWED_ORIGIN) {
  console.warn('Warning: ALLOWED_ORIGIN env var not set. Defaulting to https://skycubeuk.github.io');
}

const CMS_ORIGIN = ALLOWED_ORIGIN ?? 'https://skycubeuk.github.io';

// Validate PORT at startup so a bad value fails loudly.
const port = Number(PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Invalid PORT value: "${PORT}" — must be an integer between 1 and 65535`);
  process.exit(1);
}

// In-memory CSRF state store (state → timestamp). Entries expire after 10 minutes.
const pendingStates = new Map<string, number>();
const STATE_TTL_MS = 10 * 60 * 1000;
// Hard cap prevents memory exhaustion if /auth is flooded without matching /callback calls.
const MAX_PENDING_STATES = 500;

function pruneExpiredStates(): void {
  const now = Date.now();
  for (const [key, ts] of pendingStates) {
    if (now - ts > STATE_TTL_MS) pendingStates.delete(key);
  }
}

/**
 * Serialises `value` as JSON safe for embedding directly inside a <script> block.
 *
 * JSON.stringify does NOT escape '<', '>', or '&', so a string containing
 * "</script>" would break out of the script tag and allow XSS. Replacing with
 * their Unicode escapes produces valid JSON that is inert in HTML context.
 */
function safeJsonForHtml(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

/**
 * GET /auth
 * Decap CMS redirects the user here to begin the GitHub OAuth flow.
 * Query params forwarded by Decap: site_id, scope
 */
app.get('/auth', (_req: Request, res: Response) => {
  pruneExpiredStates();

  if (pendingStates.size >= MAX_PENDING_STATES) {
    log('auth_rejected', { ip: _req.ip ?? 'unknown', reason: 'too_many_pending' });
    res.status(429).send('Too many pending authorisations. Try again later.');
    return;
  }

  const state = randomBytes(16).toString('hex');
  pendingStates.set(state, Date.now());

  log('auth_start', { ip: _req.ip ?? 'unknown' });

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: 'public_repo',
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

/**
 * GET /callback
 * GitHub redirects here after the user authorises the OAuth App.
 * Exchanges the temporary code for an access token, then passes
 * it back to the Decap CMS opener window via postMessage.
 */
app.get('/callback', async (req: Request, res: Response) => {
  pruneExpiredStates();

  const ip = req.ip ?? 'unknown';
  const { code, state, error, error_description } = req.query as Record<string, string | undefined>;

  if (error) {
    log('auth_error', { ip, error: String(error), error_description: String(error_description ?? '') });
    return sendMessage(res, 'error', String(error_description ?? error));
  }

  if (!state || !pendingStates.has(state)) {
    log('auth_failure', { ip, reason: 'invalid_or_expired_state' });
    return sendMessage(res, 'error', 'Invalid or expired state parameter.');
  }
  pendingStates.delete(state);

  if (!code) {
    log('auth_failure', { ip, reason: 'no_code' });
    return sendMessage(res, 'error', 'No code returned by GitHub.');
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      }),
    });

    if (!tokenRes.ok) {
      log('token_exchange_error', { ip, message: `GitHub token endpoint returned ${tokenRes.status}` });
      return sendMessage(res, 'error', `GitHub token endpoint returned ${tokenRes.status}`);
    }

    const data = (await tokenRes.json()) as { access_token?: string; error?: string; error_description?: string };

    if (data.error || !data.access_token) {
      log('token_exchange_error', { ip, message: data.error_description ?? data.error ?? 'Token exchange failed' });
      return sendMessage(res, 'error', data.error_description ?? data.error ?? 'Token exchange failed');
    }

    const token = data.access_token;

    // Resolve the GitHub username and verify repo write access.
    // Both calls use the user's own token — no machine credentials needed.
    let github_username: string;
    let hasPush: boolean;
    try {
      const ghHeaders = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'User-Agent': 'decap-oauth-proxy/1.0',
      };

      const [userRes, repoRes] = await Promise.all([
        fetch('https://api.github.com/user', { headers: ghHeaders }),
        fetch(`https://api.github.com/repos/${GITHUB_REPO}`, { headers: ghHeaders }),
      ]);

      if (!userRes.ok || !repoRes.ok) {
        throw new Error(`GitHub API returned user=${userRes.status} repo=${repoRes.status}`);
      }

      const userData = (await userRes.json()) as { login?: string };
      const repoData = (await repoRes.json()) as { permissions?: { push?: boolean } };

      github_username = (userData.login ?? 'unknown').toLowerCase();
      hasPush = repoData.permissions?.push === true;
    } catch (err) {
      console.error('GitHub access check error:', err);
      log('token_exchange_error', { ip, message: 'GitHub access check failed' });
      return sendMessage(res, 'error', 'Could not verify GitHub access. Please try again.');
    }

    if (!hasPush) {
      log('auth_blocked', { ip, github_username });
      return sendMessage(res, 'error', 'Your GitHub account is not authorised to access this CMS.');
    }

    log('auth_success', { ip, github_username });
    return sendMessage(res, 'success', JSON.stringify({ token, provider: 'github' }));
  } catch (err) {
    console.error('Token exchange error:', err);
    log('token_exchange_error', { ip, message: 'Internal error during token exchange' });
    return sendMessage(res, 'error', 'Internal error during token exchange.');
  }
});

/**
 * Sends the result back to the Decap CMS popup window via postMessage.
 * Format expected by Decap: "authorization:github:success:{...}" or "authorization:github:error:..."
 */
function sendMessage(res: Response, status: 'success' | 'error', content: string): void {
  const message = `authorization:github:${status}:${content}`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Restrict the page to only what it needs: one inline script, no external resources.
  res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'");
  res.send(`<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Authenticating…</title></head>
  <body>
    <script>
      (function () {
        var ALLOWED_ORIGIN = ${safeJsonForHtml(CMS_ORIGIN)};
        function onMessage(e) {
          // Only accept the handshake from the expected CMS origin.
          if (e.origin === ALLOWED_ORIGIN && e.data === 'authorizing:github') {
            window.removeEventListener('message', onMessage);
            window.opener.postMessage(${safeJsonForHtml(message)}, ALLOWED_ORIGIN);
          }
        }
        window.addEventListener('message', onMessage);
        // Announce readiness only to the known CMS origin (not '*').
        window.opener.postMessage('authorizing:github', ALLOWED_ORIGIN);
      })();
    </script>
  </body>
</html>`);
}

// Redirect root and any unknown route to the main site — hides the proxy's existence.
app.use((_req: Request, res: Response) => {
  res.redirect(301, 'https://skycubeuk.github.io');
});

app.listen(port, () => {
  console.log(`OAuth proxy listening on port ${port}`);
});
