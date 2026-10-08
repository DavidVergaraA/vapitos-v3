import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { money } from '@/lib/supabase';
import { fetchComisiones, fetchVentasEstado, pagarComision } from '@/modules/ventas/ventasService';
import type { MetodoPagoVenta } from '@/types/ventas';

export default function FinanzasPage() {
  const queryClient = useQueryClient();
  const [comisionId, setComisionId] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<MetodoPagoVenta | ''>('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { data: ventas = [], isLoading: ventasLoading, isError: ventasError, refetch } = useQuery({ queryKey: ['ventas-estado'], queryFn: fetchVentasEstado });
  const { data: comisiones = [], isLoading: comisionesLoading, isError: comisionesError } = useQuery({ queryKey: ['comisiones'], queryFn: fetchComisiones });
  const resumen = useMemo(() => ({
    recaudo: ventas.reduce((total, venta) => total + venta.recaudo_neto, 0),
    saldo: ventas.reduce((total, venta) => total + venta.saldo_pendiente, 0),
    totalVentas: ventas.reduce((total, venta) => total + venta.total_final, 0),
    liquidable: comisiones.filter((comision) => comision.estado === 'liquidable').reduce((total, comision) => total + comision.monto_manual, 0),
  }), [ventas, comisiones]);
  const pagoMutation = useMutation({ mutationFn: pagarComision, onSuccess: async () => { setComisionId(null); setMetodo(''); setNotas(''); setError(null); await queryClient.invalidateQueries({ queryKey: ['comisiones'] }); } });
  const pagar = (monto: number) => { if (!comisionId || !metodo) { setError('Selecciona el método de pago.'); return; } pagoMutation.mutate({ comision_id: comisionId, monto, metodo_pago: metodo, notas: notas.trim() }); };

  return <div className="space-y-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-blue-600 tracking-wider uppercase">Finanzas</p><h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">Recaudo y comisiones</h1></div><button onClick={() => refetch()} className="p-2.5 bg-white border rounded-xl"><RefreshCw size={18} /></button></div>{ventasError || comisionesError ? <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex gap-2"><AlertCircle size={18} />No se pudieron cargar todos los datos financieros.</div> : <><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[['Ventas', resumen.totalVentas], ['Recaudo', resumen.recaudo], ['Saldo pendiente', resumen.saldo], ['Comisiones liquidables', resumen.liquidable]].map(([label, value]) => <div key={String(label)} className="bg-white border rounded-2xl p-4"><p className="text-xs text-slate-500">{label}</p><p className="font-black text-lg text-slate-800 mt-2">{ventasLoading || comisionesLoading ? '…' : money(value)}</p></div>)}</div><div className="bg-white border rounded-2xl overflow-hidden"><div className="p-5 border-b"><h2 className="font-bold">Comisiones</h2></div>{comisionesLoading ? <p className="p-5 text-sm text-slate-500">Cargando comisiones...</p> : comisiones.length === 0 ? <p className="p-5 text-sm text-slate-500">No hay comisiones registradas.</p> : <div className="divide-y">{comisiones.map((comision) => <div key={comision.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="font-mono text-xs text-slate-500">Venta {comision.venta_id}</p><p className="text-sm font-semibold">{money(comision.monto_manual)} · {comision.estado}</p></div>{comision.estado === 'liquidable' && <button onClick={() => { setComisionId(comision.id); setError(null); }} className="px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl">Pagar comisión</button>}</div>)}</div>}</div></>}{comisionId && <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"><div className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-3"><h2 className="font-bold text-lg">Pagar comisión</h2><select value={metodo} onChange={(event) => setMetodo(event.target.value as MetodoPagoVenta)} className="w-full p-2 border rounded-lg"><option value="">Método de pago</option><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option></select><input value={notas} onChange={(event) => setNotas(event.target.value)} placeholder="Notas" className="w-full p-2 border rounded-lg" />{(error || pagoMutation.isError) && <p className="text-sm text-red-700">{error || 'No se pudo pagar la comisión.'}</p>}<div className="flex justify-end gap-2"><button onClick={() => setComisionId(null)} className="px-3 py-2 text-sm">Cancelar</button><button onClick={() => { const comision = comisiones.find((item) => item.id === comisionId); if (comision) pagar(comision.monto_manual); }} disabled={pagoMutation.isPending} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">{pagoMutation.isPending ? 'Pagando...' : 'Confirmar pago'}</button></div></div></div>}</div>;
}
