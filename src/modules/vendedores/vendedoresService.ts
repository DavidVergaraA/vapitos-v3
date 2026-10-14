import { supabase, rid } from '@/lib/supabase';
import type { VendedorExterno } from '@/types/ventas';

export async function fetchTodosVendedores(): Promise<VendedorExterno[]> {
  const { data, error } = await supabase
    .from('vendedores_externos')
    .select('id, nombre, contacto, activo, creado_at, actualizado_at')
    .order('nombre', { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []) as VendedorExterno[];
}

export async function guardarVendedorExterno(input: {
  id?: string;
  nombre: string;
  contacto?: string | null;
  activo?: boolean;
}): Promise<unknown> {
  // Primero intentamos vía rpc_guardar_vendedor_externo
  const { data, error } = await supabase.rpc('rpc_guardar_vendedor_externo', {
    p_request_id: rid(),
    p_id: input.id ?? null,
    p_nombre: input.nombre.trim(),
    p_contacto: input.contacto ? input.contacto.trim() : null,
    p_activo: input.activo ?? true,
  });

  if (error) {
    // Si la RPC no existe o tiene otra firma, intentamos upsert directo si RLS lo permite
    const { data: upsertData, error: upsertError } = await supabase
      .from('vendedores_externos')
      .upsert({
        ...(input.id ? { id: input.id } : {}),
        nombre: input.nombre.trim(),
        contacto: input.contacto ? input.contacto.trim() : null,
        activo: input.activo ?? true,
      })
      .select()
      .single();

    if (upsertError) {
      throw new Error(error.message || upsertError.message);
    }
    return upsertData;
  }

  return data;
}
