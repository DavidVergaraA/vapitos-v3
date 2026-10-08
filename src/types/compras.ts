export interface DetalleCompra {
  id: string;
  compra_id: string;
  variante_id: string;
  cantidad_pedida: number;
  costo_unitario: number;
  notas: string | null;
  creado_at: string;
  cantidad_recibida?: number;
}

export interface Compra {
  id: string;
  proveedor_id: string;
  fecha_compra: string;
  referencia: string | null;
  estado: 'registrada' | 'recibida_parcial' | 'recibida' | 'anulada';
  notas: string | null;
  creada_por: string | null;
  creado_at: string;
  actualizado_at: string;
  proveedor_nombre?: string;
  detalles?: DetalleCompra[];
}

export interface ItemCompraInput {
  producto_id: string;
  variante_id: string;
  cantidad_pedida: number;
  costo_unitario: number;
  notas?: string | null;
}

export interface RegistrarCompraPayload {
  p_request_id: string;
  p_proveedor_id: string;
  p_fecha_compra: string;
  p_referencia: string | null;
  p_notas: string | null;
  p_items: {
    variante_id: string;
    cantidad_pedida: number;
    costo_unitario: number;
    notas?: string;
  }[];
}

export interface RecibirCompraItem {
  detalle_compra_id: string;
  cantidad_recibida: number;
}

export interface RecibirCompraPayload {
  p_request_id: string;
  p_compra_id: string;
  p_items: RecibirCompraItem[];
}
