import { supabase } from '@/lib/supabase';

export interface MovimientoCaja {
  id: string;
  monto: number;
  tipo_movimiento: string;
  direccion: string;
  metodo_pago: string;
  fecha_movimiento: string;
  motivo: string;
  referencia_tipo: string | null;
  referencia_id: string | null;
  creado_at: string;
}

export async function fetchMovimientosCaja(): Promise<MovimientoCaja[]> {
  const { data, error } = await supabase
    .from('movimientos_caja')
    .select('id, tipo_movimiento, direccion, monto, metodo_pago, fecha_movimiento, motivo, referencia_tipo, referencia_id, creado_at')
    .order('fecha_movimiento', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error al consultar movimientos de caja:', error);
    throw new Error(error.message);
  }

  return data || [];
}

export async function fetchSaldoTransferencias(): Promise<number> {
  const pageSize = 500;
  let from = 0;
  let saldo = 0;

  while (true) {
    const { data, error } = await supabase
      .from('movimientos_caja')
      .select('direccion, monto')
      .eq('metodo_pago', 'transferencia')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error al consultar saldo por transferencias:', error);
      throw new Error(error.message);
    }

    const movimientos = data || [];
    for (const movimiento of movimientos) {
      if (movimiento.direccion === 'entrada') saldo += movimiento.monto;
      else if (movimiento.direccion === 'salida') saldo -= movimiento.monto;
      else throw new Error('Se encontró un movimiento de transferencia con dirección no reconocida.');
    }

    if (movimientos.length < pageSize) return saldo;
    from += pageSize;
  }
}
