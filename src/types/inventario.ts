// Estados válidos de inventario según VAPITOS_BACKEND_CONTEXT.md
// No usar: 'recuperable', 'revender'
export type EstadoInventario =
  | 'disponible'
  | 'vendida'
  | 'en_garantia'
  | 'no_recuperable'
  | 'salida_garantia'
  | 'retirada';

export interface UnidadInventario {
  id: string;
  codigo_unidad: string;
  lote_id: string;
  costo_origen: number;
  costo_actual: number;
  estado: EstadoInventario;
  recibida_at: string;
  salida_at: string | null;
  notas: string | null;
  creado_at: string;
  actualizado_at: string;
}

export interface InventarioDisponible {
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

export interface ResumenInventario {
  disponible: number;
  vendida: number;
  en_garantia: number;
  no_recuperable: number;
  salida_garantia: number;
  retirada: number;
}

export interface MovimientoInventario {
  id: string;
  unidad_id: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  operacion_tipo: string;
  operacion_id: string | null;
  motivo: string;
  actor_id: string | null;
  creado_at: string;
}
