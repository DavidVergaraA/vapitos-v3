export interface Proveedor {
  id: string;
  nombre: string;
  contacto: string | null;
  notas: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GuardarProveedorPayload {
  p_request_id: string;
  p_proveedor_id: string;
  p_nombre: string;
  p_contacto: string | null;
  p_notas: string | null;
  p_activo: boolean;
}
