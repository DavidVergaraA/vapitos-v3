import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Eye, ReceiptText, RefreshCw, X } from 'lucide-react';
import { money } from '@/lib/supabase';
import { fetchDetalleVenta, fetchVentasEstado, registrarAbono } from './ventasService';
import type { MetodoPagoVenta, VentaEstado } from '@/types/ventas';

export default function HistorialVentas() {
  const queryClient = useQueryClient();
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaEstado | null>(null);
  const [abonoOpen, setAbonoOpen] = useState(false);
  const [monto, setMonto] = useState<number | ''>('');
  const [metodo, setMetodo] = useState<MetodoPagoVenta | ''>('');
  const [referencia, setReferencia] = useState('');
  const [notas, setNotas] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: ventas = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['ventas-estado'],
    queryFn: fetchVentasEstado,
  });
  const { data: detalle, isLoading: detalleLoading, isError: detalleError } = useQuery({
    queryKey: ['detalle-venta', ventaSeleccionada?.venta_id],
    queryFn: () => fetchDetalleVenta(ventaSeleccionada!.venta_id),
    enabled: Boolean(ventaSeleccionada),
  });

  const abonoMutation = useMutation({
    mutationFn: registrarAbono,
    onSuccess: async () => {
      setAbonoOpen(false);
      setMonto('');
      setMetodo('');
      setReferencia('');
      setNotas('');
      setFormError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ventas-estado'] }),
        queryClient.invalidateQueries({ queryKey: ['detalle-venta', ventaSeleccionada?.venta_id] }),
      ]);
    },
  });

  const abrirAbono = () => {
    setMonto('');
    setMetodo('');
    setReferencia('');
    setNotas('');
    setFormError(null);
    setAbonoOpen(true);
  };

  const guardarAbono = () => {
    if (!ventaSeleccionada) return;
    const valor = monto === '' ? 0 : monto;
    if (valor <= 0 || valor > ventaSeleccionada.saldo_pendiente) {
      setFormError('El abono debe ser mayor que cero y no superar el saldo pendiente.');
      return;
    }
    if (!metodo) {
      setFormError('Selecciona un método de pago.');
      return;
    }
    setFormError(null);
    abonoMutation.mutate({
      venta_id: ventaSeleccionada.venta_id,
      monto: valor,
      metodo_pago: metodo,
      referencia: referencia.trim() || null,
      notas: notas.trim() || null,
    });
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 flex items-center justify-between gap-3 border-b border-slate-100">
        <div><h2 className="font-bold text-slate-900">Historial de ventas</h2><p className="text-xs text-slate-500 mt-1">Estado financiero real por venta.</p></div>
        <button onClick={() => refetch()} disabled={isFetching} className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg" title="Actualizar historial"><RefreshCw size={17} className={isFetching ? 'animate-spin' : ''} /></button>
      </div>
      {isLoading ? <div className="p-10 text-center text-sm text-slate-500"><RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />Cargando ventas...</div>
        : isError ? <div className="m-5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex gap-3"><AlertCircle size={18} />No se pudo cargar el historial de ventas. Intenta actualizar la página.</div>
          : ventas.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">Aún no hay ventas registradas.</div>
            : <div className="divide-y divide-slate-100">{ventas.map((venta) => <div key={venta.venta_id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><p className="font-mono text-xs text-slate-500">{venta.venta_id}</p><p className="text-xs text-slate-500 mt-1">{new Date(venta.fecha_venta).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })} · {venta.estado}</p></div><div className="grid grid-cols-2 sm:flex gap-x-5 gap-y-1 text-xs text-slate-600"><span>Total: <strong className="text-slate-800">{money(venta.total_final)}</strong></span><span>Recaudo: <strong className="text-slate-800">{money(venta.recaudo_neto)}</strong></span><span>Saldo: <strong className="text-amber-700">{money(venta.saldo_pendiente)}</strong></span><span>{venta.cantidad_abonos} abono(s) · {venta.unidades_asignadas} unidad(es)</span></div><button onClick={() => setVentaSeleccionada(venta)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl"><Eye size={15} />Detalle</button></div>)}</div>}

      {ventaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 p-4 overflow-y-auto flex items-center justify-center">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl my-8">
            <div className="flex justify-between gap-3"><div><h3 className="text-xl font-bold">Detalle de venta</h3><p className="font-mono text-xs text-slate-500">{ventaSeleccionada.venta_id}</p></div><button onClick={() => setVentaSeleccionada(null)}><X size={18} /></button></div>
            <div className="grid grid-cols-2 gap-3 my-5 text-sm"><p>Total: <strong>{money(ventaSeleccionada.total_final)}</strong></p><p>Descuento: <strong>{money(ventaSeleccionada.descuento_total)}</strong></p><p>Recaudo: <strong>{money(ventaSeleccionada.recaudo_neto)}</strong></p><p>Saldo: <strong>{money(ventaSeleccionada.saldo_pendiente)}</strong></p></div>
            {detalleLoading ? <p className="text-sm text-slate-500">Cargando detalle...</p> : detalleError ? <p className="text-sm text-red-700">No se pudo cargar el detalle.</p> : <><h4 className="font-bold text-sm mb-2">Líneas</h4>{detalle?.lineas.map((linea) => <div key={linea.id} className="flex justify-between text-sm border-b py-2"><span>{linea.marca_snapshot} {linea.modelo_snapshot} · {linea.sabor_snapshot} × {linea.cantidad}</span><strong>{money(linea.subtotal_linea ?? linea.cantidad * linea.precio_unitario)}</strong></div>)}<div className="flex justify-between items-center mt-5"><h4 className="font-bold text-sm">Abonos ({detalle?.abonos.length || 0})</h4>{ventaSeleccionada.saldo_pendiente > 0 && <button onClick={abrirAbono} className="text-xs font-semibold text-blue-700">Registrar abono</button>}</div>{detalle?.abonos.map((abono) => <div key={abono.id} className="flex justify-between text-xs py-2 text-slate-600"><span>{abono.metodo_pago} · {new Date(abono.fecha_abono).toLocaleDateString('es-CO')}</span><strong>{money(abono.monto)}</strong></div>)}</>}
            {abonoOpen && <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-3"><input type="number" min="1" max={ventaSeleccionada.saldo_pendiente} value={monto} onChange={(event) => setMonto(event.target.value === '' ? '' : Number(event.target.value))} placeholder="Monto" className="w-full p-2 border rounded-lg" /><select value={metodo} onChange={(event) => setMetodo(event.target.value as MetodoPagoVenta)} className="w-full p-2 border rounded-lg"><option value="">Método de pago</option><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option></select><input value={referencia} onChange={(event) => setReferencia(event.target.value)} placeholder="Referencia opcional" className="w-full p-2 border rounded-lg" />{(formError || abonoMutation.isError) && <p className="text-sm text-red-700">{formError || 'No se pudo registrar el abono.'}</p>}<button onClick={guardarAbono} disabled={abonoMutation.isPending} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">{abonoMutation.isPending ? 'Registrando...' : 'Guardar abono'}</button></div>}
          </div>
        </div>
      )}
    </section>
  );
}
