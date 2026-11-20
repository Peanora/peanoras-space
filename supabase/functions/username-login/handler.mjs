const allowedOrigins = new Set(['https://peanora.cn', 'http://127.0.0.1:5173', 'http://localhost:5173']);
const invalidLogin = { code: 'invalid_login' };

async function readSmallJson(request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return JSON.parse(text + decoder.decode());
    bytes += value.byteLength;
    if (bytes > 4096) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
}

export function createUsernameLogin({ url, publicKey, adminKey, fetcher = fetch }) {
  return async function usernameLogin(request) {
    const origin = request.headers.get('origin');
    const cors = allowedOrigins.has(origin) ? {
      'access-control-allow-origin': origin,
      'access-control-allow-headers': 'apikey, content-type',
      'access-control-allow-methods': 'POST, OPTIONS',
    } : {};
    const headers = { ...cors, 'cache-control': 'no-store', vary: 'Origin' };
    const send = (body, status) => Response.json(body, { status, headers });
    if (!allowedOrigins.has(origin)) return send({ code: 'forbidden' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return send({ code: 'method_not_allowed' }, 405);
    if (!url || !adminKey || !publicKey) return send({ code: 'unavailable' }, 503);

    let payload;
    try { payload = await readSmallJson(request); } catch { return send(invalidLogin, 400); }
    const username = typeof payload?.username === 'string' ? payload.username.trim().toLowerCase() : '';
    const password = payload?.password;
    if (!/^[a-z0-9_]{3,24}$/.test(username) || typeof password !== 'string' || !password || new TextEncoder().encode(password).length > 72) {
      return send(invalidLogin, 400);
    }

    const post = (path, key, body, authorize = false) => fetcher(url + path, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(12000),
      headers: { apikey: key, 'content-type': 'application/json', ...(authorize ? { authorization: `Bearer ${key}` } : {}) },
      body: JSON.stringify(body),
    });
    try {
      const lookup = await post('/rest/v1/rpc/lookup_site_login', adminKey, { requested: username }, adminKey.startsWith('eyJ'));
      if (!lookup.ok) return send({ code: 'unavailable' }, 503);
      const [account] = await lookup.json();
      if (!account?.allowed) return send({ code: 'rate_limited' }, 429);
      // A reserved address takes the same Auth path for an unknown username.
      const email = account.account_email || `${username}@site-login.invalid`;
      const login = await post('/auth/v1/token?grant_type=password', publicKey, { email, password });
      if (!login.ok) {
        if (login.status === 429) return send({ code: 'rate_limited' }, 429);
        return login.status < 500 ? send(invalidLogin, 401) : send({ code: 'unavailable' }, 503);
      }
      const { access_token, refresh_token } = await login.json();
      if (!account.account_email || !access_token || !refresh_token) return send(invalidLogin, 401);
      return send({ access_token, refresh_token }, 200);
    } catch {
      return send({ code: 'unavailable' }, 503);
    }
  };
}
