import { supabase } from '@/lib/supabase';
import type { InventarioDisponible } from '@/types/inventario';

export async function fetchInventarioDisponible(): Promise<InventarioDisponible[]> {
  const { data, error } = await supabase
    .from('vw_inventario_disponible')
    .select('unidad_id, codigo_unidad, producto_id, marca, modelo, puffs, variante_id, sabor, lote_id, recibido_at, costo_origen, costo_actual')
    .order('recibida_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []) as InventarioDisponible[];
}
