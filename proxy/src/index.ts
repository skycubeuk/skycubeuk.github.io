import express, { type Request, type Response } from 'express';
import { randomBytes } from 'node:crypto';

const app = express();

const {
  GITHUB_CLIENT_ID: CLIENT_ID,
  GITHUB_CLIENT_SECRET: CLIENT_SECRET,
  PORT = '3000',
} = process.env;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing required env vars: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET');
  process.exit(1);
}

// In-memory CSRF state store (state → timestamp). Entries expire after 10 minutes.
const pendingStates = new Map<string, number>();
const STATE_TTL_MS = 10 * 60 * 1000;

function pruneExpiredStates(): void {
  const now = Date.now();
  for (const [key, ts] of pendingStates) {
    if (now - ts > STATE_TTL_MS) pendingStates.delete(key);
  }
}

/**
 * GET /auth
 * Decap CMS redirects the user here to begin the GitHub OAuth flow.
 * Query params forwarded by Decap: site_id, scope
 */
app.get('/auth', (_req: Request, res: Response) => {
  pruneExpiredStates();

  const state = randomBytes(16).toString('hex');
  pendingStates.set(state, Date.now());

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
  const { code, state, error, error_description } = req.query as Record<string, string | undefined>;

  if (error) {
    return sendMessage(res, 'error', String(error_description ?? error));
  }

  if (!state || !pendingStates.has(state)) {
    return sendMessage(res, 'error', 'Invalid or expired state parameter.');
  }
  pendingStates.delete(state);

  if (!code) {
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
      return sendMessage(res, 'error', `GitHub token endpoint returned ${tokenRes.status}`);
    }

    const data = (await tokenRes.json()) as { access_token?: string; error?: string; error_description?: string };

    if (data.error || !data.access_token) {
      return sendMessage(res, 'error', data.error_description ?? data.error ?? 'Token exchange failed');
    }

    return sendMessage(res, 'success', JSON.stringify({ token: data.access_token, provider: 'github' }));
  } catch (err) {
    console.error('Token exchange error:', err);
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
  res.send(`<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Authenticating…</title></head>
  <body>
    <script>
      (function () {
        function onMessage(e) {
          if (e.data === 'authorizing:github') {
            window.removeEventListener('message', onMessage);
            window.opener.postMessage(${JSON.stringify(message)}, e.origin);
          }
        }
        window.addEventListener('message', onMessage);
        window.opener.postMessage('authorizing:github', '*');
      })();
    </script>
  </body>
</html>`);
}

// Redirect root and any unknown route to the main site — hides the proxy's existence.
app.use((_req: Request, res: Response) => {
  res.redirect(301, 'https://skycubeuk.github.io');
});

app.listen(Number(PORT), () => {
  console.log(`OAuth proxy listening on port ${PORT}`);
});
