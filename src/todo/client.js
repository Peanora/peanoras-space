import { createClient } from '@supabase/supabase-js';
import { todoConfig } from './config.js';

const config = todoConfig(import.meta.env);
let client;
export const todoConfigured = Boolean(config);

export function getTodoClient() {
  if (!config) return null;
  client ??= createClient(config.url, config.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'peanora:todo-auth:v1',
    },
    global: {
      fetch: (input, options = {}) => fetch(input, {
        ...options,
        signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
      }),
    },
  });
  return client;
}
