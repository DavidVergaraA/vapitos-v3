import { supabase, rid } from '@/lib/supabase';

export interface CierreSemanal {
  id: string;
  semana_inicio: string;
  semana_fin: string;
  ventas_totales?: number;
  recaudo_total?: number;
  costos_totales?: number;
  resultado_neto?: number;
  monto_distribuible?: number;
  distribucion_reinversion?: number;
  distribucion_socio_1?: number;
  distribucion_socio_2?: number;
  estado?: string;
  cerrado_por?: string | null;
  cerrado_at?: string;
  notas?: string | null;
}

export async function fetchCierres(): Promise<CierreSemanal[]> {
  const { data, error } = await supabase
    .from('cierres')
    .select('*')
    .order('semana_fin', { ascending: false });

  if (error) {
    // Si la tabla aún no tiene RLS permisivo para lectura directa o está vacía
    return [];
  }

  return (data || []) as CierreSemanal[];
}

export async function ejecutarCierreSemanal(input: {
  fecha_inicio: string;
  fecha_fin: string;
  notas?: string;
}): Promise<unknown> {
  const { data, error } = await supabase.rpc('rpc_cerrar_semana', {
    p_request_id: rid(),
    p_fecha_inicio: input.fecha_inicio,
    p_fecha_fin: input.fecha_fin,
    p_notas: input.notas ?? null,
  });

  if (error) {
    throw new Error(error.message || 'Error al ejecutar el cierre semanal');
  }

  return data;
}
