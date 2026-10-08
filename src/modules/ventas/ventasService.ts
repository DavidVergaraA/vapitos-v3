import { rid, supabase } from '@/lib/supabase';
import type {
  InventarioDisponibleVenta,
  ItemVentaInput,
  MetodoPagoVenta,
  RegistrarVentaInput,
  RegistrarVentaPayload,
  RegistrarVentaResponse,
  VentaEstado,
  VendedorExterno,
  AbonoVenta,
  Comision,
  DetalleVenta,
  RegistrarAbonoInput,
  RegistrarAbonoResponse,
} from '@/types/ventas';

function consolidarItems(items: ItemVentaInput[]): ItemVentaInput[] {
  if (items.length === 0) {
    throw new Error('La venta debe incluir al menos una variante.');
  }

  const itemsPorVariante = new Map<string, ItemVentaInput>();

  for (const item of items) {
    if (!item.variante_id || item.cantidad <= 0 || item.precio_unitario < 0) {
      throw new Error('Los ítems de venta deben tener variante, cantidad positiva y precio válido.');
    }

    const existente = itemsPorVariante.get(item.variante_id);
    if (existente && existente.precio_unitario !== item.precio_unitario) {
      throw new Error('Una variante no puede tener precios unitarios distintos en la misma venta.');
    }

    itemsPorVariante.set(item.variante_id, existente
      ? { ...existente, cantidad: existente.cantidad + item.cantidad }
      : { ...item },
    );
  }

  return [...itemsPorVariante.values()];
}

export async function fetchInventarioDisponibleVenta(): Promise<InventarioDisponibleVenta[]> {
  const { data, error } = await supabase
    .from('vw_inventario_disponible')
    .select('unidad_id, codigo_unidad, producto_id, marca, modelo, puffs, variante_id, sabor, lote_id, recibido_at, costo_origen, costo_actual')
    .order('recibido_at', { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []) as InventarioDisponibleVenta[];
}

export async function fetchVendedoresExternosActivos(): Promise<VendedorExterno[]> {
  const { data, error } = await supabase
    .from('vendedores_externos')
    .select('id, nombre, contacto, activo, creado_at, actualizado_at')
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []) as VendedorExterno[];
}

export async function registrarVenta(input: RegistrarVentaInput): Promise<RegistrarVentaResponse> {
  const items = consolidarItems(input.items);
  const subtotal = items.reduce((total, item) => total + item.cantidad * item.precio_unitario, 0);
  const descuentoTotal = input.descuento_total ?? 0;
  const pagoInicial = input.pago_inicial ?? 0;
  const totalFinal = subtotal - descuentoTotal;

  if (descuentoTotal < 0 || descuentoTotal > subtotal) {
    throw new Error('El descuento total no es válido para esta venta.');
  }
  if (pagoInicial < 0 || pagoInicial > totalFinal) {
    throw new Error('El pago inicial no puede superar el total de la venta.');
  }
  if (pagoInicial > 0 && !input.metodo_pago) {
    throw new Error('Selecciona un método de pago para el abono inicial.');
  }
  const payloadBase = {
    p_request_id: rid(),
    p_items: items,
    p_descuento_total: descuentoTotal,
    p_pago_inicial: pagoInicial,
    p_metodo_pago: input.metodo_pago ?? null,
    p_notas: input.notas ?? null,
  };

  let payload: RegistrarVentaPayload;
  if (input.vendedor_externo_id) {
    const destino = input.destino_utilidad_externa;
    const comision = input.comision_manual;
    if (!destino || comision == null || comision < 0) {
      throw new Error('El vendedor externo requiere destino de utilidad y comisión manual válida.');
    }
    payload = {
      ...payloadBase,
      p_vendedor_externo_id: input.vendedor_externo_id,
      p_destino_utilidad_externa: destino,
      p_comision_manual: comision,
    };
  } else {
    if (input.destino_utilidad_externa || input.comision_manual != null) {
      throw new Error('El destino y la comisión requieren un vendedor externo.');
    }
    payload = payloadBase;
  }

  const { data, error } = await supabase.rpc('rpc_registrar_venta', payload);
  if (error) throw new Error(error.message || 'Error al registrar la venta');

  return data as RegistrarVentaResponse;
}

export async function fetchVentasEstado(): Promise<VentaEstado[]> {
  const { data, error } = await supabase
    .from('vw_ventas_estado')
    .select('venta_id, fecha_venta, tipo_venta, vendedor_externo_id, destino_utilidad_externa, subtotal, descuento_total, total_final, recaudo_bruto, reembolso_total, saldo_pendiente, exceso_recaudo_neto, cantidad_abonos, unidades_asignadas, estado, recaudo_neto')
    .order('fecha_venta', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []) as VentaEstado[];
}

export async function fetchDetalleVenta(ventaId: string): Promise<{ lineas: DetalleVenta[]; abonos: AbonoVenta[] }> {
  const { data: lineas, error: lineasError } = await supabase
    .from('detalle_ventas')
    .select('id, venta_id, variante_id, cantidad, precio_unitario, subtotal_linea, marca_snapshot, modelo_snapshot, sabor_snapshot, puffs_snapshot, creado_at')
    .eq('venta_id', ventaId)
    .order('creado_at', { ascending: true });
  if (lineasError) throw new Error(lineasError.message);

  const { data: abonos, error: abonosError } = await supabase
    .from('abonos_ventas')
    .select('id, venta_id, monto, metodo_pago, estado, fecha_abono, referencia, notas, movimiento_caja_id, registrado_por, creado_at')
    .eq('venta_id', ventaId)
    .order('fecha_abono', { ascending: false });
  if (abonosError) throw new Error(abonosError.message);

  return { lineas: (lineas || []) as DetalleVenta[], abonos: (abonos || []) as AbonoVenta[] };
}

export async function registrarAbono(input: RegistrarAbonoInput): Promise<RegistrarAbonoResponse> {
  const { data, error } = await supabase.rpc('rpc_registrar_abono', {
    p_request_id: rid(),
    p_venta_id: input.venta_id,
    p_monto: input.monto,
    p_metodo_pago: input.metodo_pago,
    p_referencia: input.referencia ?? null,
    p_notas: input.notas ?? null,
  });
  if (error) throw new Error(error.message || 'Error al registrar el abono');
  return data as RegistrarAbonoResponse;
}

export async function fetchComisiones(): Promise<Comision[]> {
  const { data, error } = await supabase
    .from('comisiones')
    .select('id, venta_id, vendedor_externo_id, monto_manual, liquidable_at, estado, notas, creada_por, creado_at')
    .order('creado_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Comision[];
}

export async function pagarComision(input: { comision_id: string; monto: number; metodo_pago: MetodoPagoVenta; notas: string }): Promise<unknown> {
  const { data, error } = await supabase.rpc('rpc_pagar_comision', {
    p_request_id: rid(),
    p_comision_id: input.comision_id,
    p_monto: input.monto,
    p_metodo_pago: input.metodo_pago,
    p_notas: input.notas,
  });
  if (error) throw new Error(error.message || 'Error al pagar la comisión');
  return data;
}
