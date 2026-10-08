export type MetodoPagoVenta = 'efectivo' | 'transferencia';
export type DestinoUtilidadExterna = 'reinversion' | 'resultado_distribuible';

export interface ItemVentaInput {
  variante_id: string;
  cantidad: number;
  precio_unitario: number;
}

export interface RegistrarVentaInput {
  items: ItemVentaInput[];
  descuento_total?: number;
  pago_inicial?: number;
  metodo_pago?: MetodoPagoVenta | null;
  vendedor_externo_id?: string | null;
  destino_utilidad_externa?: DestinoUtilidadExterna | null;
  comision_manual?: number | null;
  notas?: string | null;
}

export interface RegistrarVentaPayload {
  p_request_id: string;
  p_items: ItemVentaInput[];
  p_descuento_total: number;
  p_pago_inicial: number;
  p_metodo_pago: MetodoPagoVenta | null;
  p_vendedor_externo_id?: string;
  p_destino_utilidad_externa?: DestinoUtilidadExterna;
  p_comision_manual?: number;
  p_notas: string | null;
}

export interface RegistrarVentaResponse {
  venta_id: string;
  subtotal: number;
  descuento_total: number;
  total_final: number;
  abono_inicial: number;
  comision_id: string | null;
  lineas: number;
}

export interface InventarioDisponibleVenta {
  unidad_id: string;
  codigo_unidad: string;
  producto_id: string;
  marca: string;
  modelo: string;
  puffs: number | null;
  variante_id: string;
  sabor: string;
  lote_id: string;
  recibido_at: string;
  costo_origen: number;
  costo_actual: number;
}

export interface VendedorExterno {
  id: string;
  nombre: string;
  contacto: string | null;
  activo: boolean;
  creado_at: string;
  actualizado_at: string;
}

export interface VentaEstado {
  venta_id: string;
  fecha_venta: string;
  tipo_venta: string;
  vendedor_externo_id: string | null;
  destino_utilidad_externa: DestinoUtilidadExterna | null;
  subtotal: number;
  descuento_total: number;
  total_final: number;
  recaudo_bruto: number;
  reembolso_total: number;
  saldo_pendiente: number;
  exceso_recaudo_neto: number;
  cantidad_abonos: number;
  unidades_asignadas: number;
  estado: string;
  recaudo_neto: number;
}

export interface DetalleVenta {
  id: string;
  venta_id: string;
  variante_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal_linea: number | null;
  marca_snapshot: string;
  modelo_snapshot: string;
  sabor_snapshot: string;
  puffs_snapshot: number | null;
  creado_at: string;
}

export interface AbonoVenta {
  id: string;
  venta_id: string;
  monto: number;
  metodo_pago: MetodoPagoVenta;
  estado: string;
  fecha_abono: string;
  referencia: string | null;
  notas: string | null;
  movimiento_caja_id: string;
  registrado_por: string | null;
  creado_at: string;
}

export interface RegistrarAbonoInput {
  venta_id: string;
  monto: number;
  metodo_pago: MetodoPagoVenta;
  referencia?: string | null;
  notas?: string | null;
}

export interface RegistrarAbonoResponse {
  abono_id: string;
  venta_id: string;
  monto: number;
}

export interface Comision {
  id: string;
  venta_id: string;
  vendedor_externo_id: string;
  monto_manual: number;
  liquidable_at: string | null;
  estado: 'pendiente_pago_venta' | 'liquidable' | 'pagada';
  notas: string | null;
  creada_por: string | null;
  creado_at: string;
}
