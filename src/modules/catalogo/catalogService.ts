import { supabase, rid } from '@/lib/supabase';
import type { 
  Producto, 
  Variante, 
  ProductoConVariantes, 
  GuardarProductoPayload, 
  GuardarVariantePayload 
} from '@/types/catalog';

export async function fetchProductos(): Promise<ProductoConVariantes[]> {
  const { data: productos, error: prodError } = await supabase
    .from('productos')
    .select('*')
    .order('marca', { ascending: true });

  if (prodError) throw new Error(prodError.message);

  const { data: variantes, error: varError } = await supabase
    .from('variantes')
    .select('*')
    .order('sabor', { ascending: true });

  if (varError) throw new Error(varError.message);

  const variantesByProd = (variantes || []).reduce<Record<string, Variante[]>>((acc, v) => {
    if (!acc[v.producto_id]) acc[v.producto_id] = [];
    acc[v.producto_id].push(v);
    return acc;
  }, {});

  return (productos || []).map((p) => ({
    ...p,
    variantes: variantesByProd[p.id] || [],
  }));
}

export async function guardarProducto(producto: Omit<GuardarProductoPayload, 'p_request_id'>): Promise<void> {
  const payload: GuardarProductoPayload = {
    ...producto,
    p_request_id: rid(),
  };

  const { error } = await supabase.rpc('rpc_guardar_producto', payload);
  if (error) {
    throw new Error(error.message || 'Error al guardar el producto');
  }
}

export async function guardarVariante(variante: Omit<GuardarVariantePayload, 'p_request_id'>): Promise<void> {
  const payload: GuardarVariantePayload = {
    ...variante,
    p_request_id: rid(),
  };

  const { error } = await supabase.rpc('rpc_guardar_variante', payload);
  if (error) {
    throw new Error(error.message || 'Error al guardar la variante');
  }
}
