import { supabase, rid } from '@/lib/supabase';
import type { Proveedor, GuardarProveedorPayload } from '@/types/proveedores';

export async function fetchProveedores(): Promise<Proveedor[]> {
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function guardarProveedor(proveedor: Omit<GuardarProveedorPayload, 'p_request_id'>): Promise<void> {
  const payload: GuardarProveedorPayload = {
    ...proveedor,
    p_request_id: rid(),
  };

  const { error } = await supabase.rpc('rpc_guardar_proveedor', payload);
  if (error) {
    throw new Error(error.message || 'Error al guardar el proveedor');
  }
}
