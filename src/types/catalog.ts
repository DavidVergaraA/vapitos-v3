export interface Producto {
  id: string;
  marca: string;
  modelo: string;
  categoria: string | null;
  puffs: number | null;
  descripcion: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Variante {
  id: string;
  producto_id: string;
  sabor: string;
  atributos: Record<string, unknown>;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductoConVariantes extends Producto {
  variantes?: Variante[];
}

export interface GuardarProductoPayload {
  p_request_id: string;
  p_producto_id: string;
  p_marca: string;
  p_modelo: string;
  p_categoria: string | null;
  p_puffs: number | null;
  p_descripcion: string | null;
  p_activo: boolean;
}

export interface GuardarVariantePayload {
  p_request_id: string;
  p_variante_id: string;
  p_producto_id: string;
  p_sabor: string;
  p_atributos: Record<string, unknown>;
  p_activo: boolean;
}
