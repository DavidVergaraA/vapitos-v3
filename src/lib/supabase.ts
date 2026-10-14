import { createClient } from '@supabase/supabase-js';

const expectedProjectUrl = 'https://covpkfyhvgbgnftsinek.supabase.co';
export const url = import.meta.env.VITE_SUPABASE_URL?.trim();
export const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
export const configured = url === expectedProjectUrl && Boolean(key);

// Fail closed: missing or unexpected build-time configuration must never route requests
// to a real Supabase project. GitHub Pages and local builds must supply the authorized URL.
export const supabase = createClient(
  configured ? expectedProjectUrl : 'https://not-configured.invalid',
  configured ? key! : 'missing-key',
);

export const rid = () => crypto.randomUUID();
export const money = (n: unknown) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(Number(n || 0));

export async function rpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data;
}
