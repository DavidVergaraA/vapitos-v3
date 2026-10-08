import { supabase, rid } from '@/lib/supabase';
import type { Compra, ItemCompraInput, RegistrarCompraPayload, RecibirCompraItem, RecibirCompraPayload } from '@/types/compras';

export async function fetchCompras(): Promise<Compra[]> {
  const { data: comprasData, error: comprasError } = await supabase
    .from('compras')
    .select('id, proveedor_id, fecha_compra, referencia, estado, notas, creada_por, creado_at, actualizado_at')
    .order('creado_at', { ascending: false });

  if (comprasError) throw new Error(comprasError.message);

  const { data: proveedoresData, error: proveedoresError } = await supabase
    .from('proveedores')
    .select('id, nombre');

  if (proveedoresError) throw new Error(proveedoresError.message);

  const provMap = new Map((proveedoresData || []).map((p) => [p.id, p.nombre]));

  const compraIds = (comprasData || []).map((compra) => compra.id);
  const { data: detallesData, error: detallesError } = compraIds.length === 0
    ? { data: [], error: null }
    : await supabase
      .from('detalle_compras')
      .select('id, compra_id, variante_id, cantidad_pedida, costo_unitario, notas, creado_at')
      .in('compra_id', compraIds);

  if (detallesError) throw new Error(detallesError.message);

  const detalleIds = (detallesData || []).map((detalle) => detalle.id);
  const { data: lotesData, error: lotesError } = detalleIds.length === 0
    ? { data: [], error: null }
    : await supabase
      .from('lotes_inventario')
      .select('detalle_compra_id, cantidad_recibida')
      .in('detalle_compra_id', detalleIds);

  if (lotesError) throw new Error(lotesError.message);

  const recibidoPorDetalle = new Map<string, number>();
  for (const lote of lotesData || []) {
    recibidoPorDetalle.set(
      lote.detalle_compra_id,
      (recibidoPorDetalle.get(lote.detalle_compra_id) || 0) + lote.cantidad_recibida,
    );
  }

  const detallesPorCompra = new Map<string, Compra['detalles']>();
  for (const detalle of detallesData || []) {
    const detalles = detallesPorCompra.get(detalle.compra_id) || [];
    detalles.push({
      ...detalle,
      cantidad_recibida: recibidoPorDetalle.get(detalle.id) || 0,
    });
    detallesPorCompra.set(detalle.compra_id, detalles);
  }

  return (comprasData || []).map((c) => ({
    ...c,
    proveedor_nombre: provMap.get(c.proveedor_id) || 'Proveedor no identificado',
    detalles: detallesPorCompra.get(c.id) || [],
  }));
}

export async function registrarCompra(input: {
  proveedor_id: string;
  fecha_compra: string;
  referencia: string | null;
  notas: string | null;
  items: ItemCompraInput[];
}): Promise<unknown> {
  const payload: RegistrarCompraPayload = {
    p_request_id: rid(),
    p_proveedor_id: input.proveedor_id,
    p_fecha_compra: input.fecha_compra,
    p_referencia: input.referencia,
    p_notas: input.notas,
    p_items: input.items.map((i) => ({
      variante_id: i.variante_id,
      cantidad_pedida: Number(i.cantidad_pedida),
      costo_unitario: Number(i.costo_unitario),
      ...(i.notas ? { notas: i.notas } : {}),
    })),
  };

  const { data, error } = await supabase.rpc('rpc_registrar_compra', payload);
  if (error) {
    throw new Error(error.message || 'Error al registrar la compra');
  }
  return data;
}

export async function recibirCompra(compraId: string, items: RecibirCompraItem[]): Promise<unknown> {
  const payload: RecibirCompraPayload = {
    p_request_id: rid(),
    p_compra_id: compraId,
    p_items: items,
  };

  const { data, error } = await supabase.rpc('rpc_recibir_compra', payload);
  if (error) {
    throw new Error(error.message || 'Error al recibir la compra');
  }
  return data;
}
