import { todoConfig } from '../todo/config.js';

export function createAccountApi(client, env = import.meta.env, fetcher = fetch) {
  const config = todoConfig(env);
  async function rpc(name, args) {
    const { data, error } = await client.rpc(name, args);
    if (error) throw error;
    return data;
  }
  return {
    username: () => rpc('get_site_username'),
    isOwner: () => rpc('site_is_owner'),
    setUsername: requested => rpc('set_site_username', { requested }),
    async passwordLogin(username, password) {
      const resp = await fetcher(`${config.url}/functions/v1/username-login`, {
        method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(25000),
        headers: { apikey: config.key, 'content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await resp.json().catch(() => ({}));
      if (!resp.ok) throw { status: resp.status, code: result.code || 'unavailable' };
      if (typeof result.access_token !== 'string' || typeof result.refresh_token !== 'string') throw new Error('Invalid login response');
      return { access_token: result.access_token, refresh_token: result.refresh_token };
    },
  };
}
