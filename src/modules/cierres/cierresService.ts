import { supabase, rid } from '@/lib/supabase';

export interface CierreSemanal {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  total_ventas: number;
  total_recaudo: number;
  total_cartera: number;
  total_costos: number;
  total_comisiones: number;
  total_impacto_garantias: number;
  total_reembolsos: number;
  resultado_negocio: number;
  resumen_snapshot: Record<string, unknown>;
  cerrado_por: string | null;
  cerrado_at: string;
  notas: string | null;
}

export async function fetchCierres(): Promise<CierreSemanal[]> {
  const { data, error } = await supabase
    .from('cierres_semanales')
    .select('id, fecha_inicio, fecha_fin, estado, total_ventas, total_recaudo, total_cartera, total_costos, total_comisiones, total_impacto_garantias, total_reembolsos, resultado_negocio, resumen_snapshot, cerrado_por, cerrado_at, notas')
    .order('fecha_fin', { ascending: false });

  if (error) {
    console.error('Error al consultar cierres semanales:', error);
    throw new Error(error.message);
  }

  return (data || []) as CierreSemanal[];
}

export async function ejecutarCierreSemanal(input: {
  fecha_inicio: string;
  notas?: string;
}): Promise<unknown> {
  const { data, error } = await supabase.rpc('rpc_cerrar_semana', {
    p_request_id: rid(),
    p_fecha_inicio: input.fecha_inicio,
    p_notas: input.notas ?? null,
  });

  if (error) {
    console.error('Error en rpc_cerrar_semana:', error);
    throw new Error(error.message || 'Error al ejecutar el cierre semanal');
  }

  return data;
}
