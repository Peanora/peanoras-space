import { createUsernameLogin } from './handler.mjs';

function defaultKey(variable) {
  try { return JSON.parse(Deno.env.get(variable) ?? '{}').default ?? ''; } catch { return ''; }
}

Deno.serve(createUsernameLogin({
  url: Deno.env.get('SUPABASE_URL') ?? '',
  publicKey: defaultKey('SUPABASE_PUBLISHABLE_KEYS') || Deno.env.get('SUPABASE_ANON_KEY') || '',
  adminKey: defaultKey('SUPABASE_SECRET_KEYS') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
}));
