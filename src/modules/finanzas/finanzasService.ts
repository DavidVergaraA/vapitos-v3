import { supabase } from '@/lib/supabase';

export interface MovimientoCaja {
  id: string;
  monto: number;
  tipo_movimiento?: string;
  metodo_pago?: string;
  referencia?: string | null;
  notas?: string | null;
  creado_at: string;
}

export async function fetchMovimientosCaja(): Promise<MovimientoCaja[]> {
  const { data, error } = await supabase
    .from('movimientos_caja')
    .select('*')
    .order('creado_at', { ascending: false })
    .limit(50);

  if (error) {
    // Si la tabla no tiene acceso directo de lectura bajo el rol actual, devolvemos array vacío sin quebrar la pantalla
    return [];
  }

  return (data || []) as MovimientoCaja[];
}
