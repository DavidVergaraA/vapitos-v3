import { supabase } from '@/lib/supabase';

export type ResolucionGarantia = 'reemplazo' | 'reembolso' | 'sin_cobertura' | 'reparacion' | 'otra';
export type DestinoUnidadDefectuosa = 'desechar' | 'conservar' | 'entregada';

export interface Garantia {
  id: string;
  venta_origen_id: string;
  unidad_defectuosa_id: string | null;
  unidad_reemplazo_id: string | null;
  motivo: string;
  estado: string;
  resolucion: ResolucionGarantia | null;
  destino_unidad_defectuosa: DestinoUnidadDefectuosa | null;
  abierta_at: string;
  resuelta_at: string | null;
  notas: string | null;
  creado_at: string;
}

interface GarantiaRow {
  id: string;
  venta_origen_id: string;
  motivo: string;
  estado: string;
  resolucion: ResolucionGarantia | null;
  abierta_at: string;
  resuelta_at: string | null;
  notas: string | null;
  creado_at: string;
}

interface GarantiaUnidadRow {
  garantia_id: string;
  unidad_id: string;
  tipo_participacion: string;
  destino_final: DestinoUnidadDefectuosa | null;
}

export async function fetchGarantias(): Promise<Garantia[]> {
  const { data: garantias, error } = await supabase
    .from('garantias')
    .select('id, venta_origen_id, motivo, estado, resolucion, abierta_at, resuelta_at, notas, creado_at')
    .order('creado_at', { ascending: false });

  if (error) {
    console.error('Error al consultar garantías:', error);
    throw new Error(error.message);
  }

  const rows = (garantias || []) as GarantiaRow[];
  if (rows.length === 0) return [];

  const { data: unidades, error: unidadesError } = await supabase
    .from('garantia_unidades')
    .select('garantia_id, unidad_id, tipo_participacion, destino_final')
    .in('garantia_id', rows.map((garantia) => garantia.id));

  if (unidadesError) {
    console.error('Error al consultar unidades de garantías:', unidadesError);
    throw new Error(unidadesError.message);
  }

  const unidadesPorGarantia = new Map<string, GarantiaUnidadRow[]>();
  for (const unidad of (unidades || []) as GarantiaUnidadRow[]) {
    const relacionadas = unidadesPorGarantia.get(unidad.garantia_id) || [];
    relacionadas.push(unidad);
    unidadesPorGarantia.set(unidad.garantia_id, relacionadas);
  }

  return rows.map((garantia) => {
    const relacionadas = unidadesPorGarantia.get(garantia.id) || [];
    const defectuosa = relacionadas.find((unidad) => unidad.tipo_participacion === 'defectuosa');
    const reemplazo = relacionadas.find((unidad) => unidad.tipo_participacion === 'reemplazo');
    return {
      ...garantia,
      unidad_defectuosa_id: defectuosa?.unidad_id ?? null,
      unidad_reemplazo_id: reemplazo?.unidad_id ?? null,
      destino_unidad_defectuosa: defectuosa?.destino_final ?? null,
    };
  });
}
