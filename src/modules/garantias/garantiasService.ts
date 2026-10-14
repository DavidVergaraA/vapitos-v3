import { supabase } from '@/lib/supabase';

export type ResolucionGarantia = 'reemplazo' | 'reembolso' | 'sin_cobertura' | 'reparacion' | 'otra';
export type DestinoUnidadDefectuosa = 'desechar' | 'conservar' | 'entregada';

export interface Garantia {
  id: string;
  venta_id: string;
  unidad_id: string;
  resolucion: ResolucionGarantia | null;
  destino_unidad_defectuosa: DestinoUnidadDefectuosa | null;
  unidad_reemplazo_id: string | null;
  estado: string;
  notas: string | null;
  creado_at: string;
  actualizado_at?: string;
}

export async function fetchGarantias(): Promise<Garantia[]> {
  const { data, error } = await supabase
    .from('garantias')
    .select('id, venta_id, unidad_id, resolucion, destino_unidad_defectuosa, unidad_reemplazo_id, estado, notas, creado_at')
    .order('creado_at', { ascending: false });

  if (error) {
    // Si la tabla aún no tiene RLS permisivo para lectura o no hay datos, retornamos error controlado
    throw new Error(error.message);
  }

  return (data || []) as Garantia[];
}
