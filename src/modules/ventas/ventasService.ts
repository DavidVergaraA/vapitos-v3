import { rid, supabase } from '@/lib/supabase';
import type {
  InventarioDisponibleVenta,
  ItemVentaInput,
  RegistrarVentaInput,
  RegistrarVentaPayload,
  RegistrarVentaResponse,
  VentaEstado,
  VendedorExterno,
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
