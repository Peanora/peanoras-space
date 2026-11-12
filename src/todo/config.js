export function todoConfig(env = {}) {
  const url = (env.VITE_SUPABASE_URL || '').trim();
  const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.username || parsed.password) return null;
    // Only public browser keys belong in Vite's client bundle.
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return null;
    return { url: parsed.origin, key };
  } catch { return null; }
}
