import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Eye, ReceiptText, RefreshCw, X } from 'lucide-react';
import { money } from '@/lib/supabase';
import { fetchDetalleVenta, fetchVentasEstado, registrarAbono } from './ventasService';
import type { MetodoPagoVenta, VentaEstado } from '@/types/ventas';

export default function HistorialVentas() {
  const queryClient = useQueryClient();
  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null);
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

  const ventaSeleccionada = ventas.find((v) => v.venta_id === selectedVentaId) || null;

  const { data: detalle, isLoading: detalleLoading, isError: detalleError } = useQuery({
    queryKey: ['detalle-venta', selectedVentaId],
    queryFn: () => fetchDetalleVenta(selectedVentaId!),
    enabled: Boolean(selectedVentaId),
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
        queryClient.invalidateQueries({ queryKey: ['detalle-venta', selectedVentaId] }),
        queryClient.invalidateQueries({ queryKey: ['comisiones'] }),
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
            : <div className="divide-y divide-slate-100">{ventas.map((venta) => <div key={venta.venta_id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><p className="font-mono text-xs text-slate-500">{venta.venta_id}</p><p className="text-xs text-slate-500 mt-1">{new Date(venta.fecha_venta).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })} · <span className="font-semibold text-slate-700">{venta.estado}</span></p></div><div className="grid grid-cols-2 sm:flex gap-x-5 gap-y-1 text-xs text-slate-600"><span>Total: <strong className="text-slate-800">{money(venta.total_final)}</strong></span><span>Recaudo: <strong className="text-slate-800">{money(venta.recaudo_neto)}</strong></span><span>Saldo: <strong className="text-amber-700">{money(venta.saldo_pendiente)}</strong></span><span>{venta.cantidad_abonos} abono(s) · {venta.unidades_asignadas} unidad(es)</span></div><button onClick={() => setSelectedVentaId(venta.venta_id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"><Eye size={15} />Detalle</button></div>)}</div>}

      {ventaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto flex items-center justify-center">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl my-8 border border-slate-200">
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Detalle de venta</h3>
                <p className="font-mono text-xs text-slate-500 mt-0.5">{ventaSeleccionada.venta_id}</p>
                <p className="text-xs text-slate-500 mt-1">Estado: <span className="font-semibold text-slate-800">{ventaSeleccionada.estado}</span> · {new Date(ventaSeleccionada.fecha_venta).toLocaleString('es-CO')}</p>
              </div>
              <button onClick={() => { setSelectedVentaId(null); setAbonoOpen(false); }} className="text-slate-400 hover:text-slate-600 p-1" title="Cerrar"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 p-3 bg-slate-50 rounded-xl text-xs">
              <div><p className="text-slate-500">Total venta</p><p className="font-bold text-slate-900 text-sm">{money(ventaSeleccionada.total_final)}</p></div>
              <div><p className="text-slate-500">Descuento</p><p className="font-bold text-slate-900 text-sm">{money(ventaSeleccionada.descuento_total)}</p></div>
              <div><p className="text-slate-500">Recaudo neto</p><p className="font-bold text-emerald-700 text-sm">{money(ventaSeleccionada.recaudo_neto)}</p></div>
              <div><p className="text-slate-500">Saldo pendiente</p><p className="font-bold text-amber-700 text-sm">{money(ventaSeleccionada.saldo_pendiente)}</p></div>
            </div>
            {detalleLoading ? (
              <div className="py-6 text-center text-sm text-slate-500"><RefreshCw size={18} className="animate-spin mx-auto mb-2 text-blue-600" />Cargando detalle...</div>
            ) : detalleError ? (
              <p className="text-sm text-red-700 py-3">No se pudo cargar el detalle de la venta.</p>
            ) : (
              <>
                <h4 className="font-bold text-sm text-slate-900 mb-2">Líneas de venta ({detalle?.lineas.length || 0})</h4>
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                  {detalle?.lineas.map((linea) => (
                    <div key={linea.id} className="flex justify-between items-center text-sm py-2">
                      <div>
                        <p className="font-medium text-slate-800">{linea.marca_snapshot} {linea.modelo_snapshot}</p>
                        <p className="text-xs text-slate-500">{linea.sabor_snapshot} · {linea.cantidad} × {money(linea.precio_unitario)}</p>
                      </div>
                      <strong className="text-slate-900">{money(linea.subtotal_linea ?? linea.cantidad * linea.precio_unitario)}</strong>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-100">
                  <h4 className="font-bold text-sm text-slate-900">Historial de abonos ({detalle?.abonos.length || 0})</h4>
                  {ventaSeleccionada.saldo_pendiente > 0 && !abonoOpen && (
                    <button onClick={abrirAbono} className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors">
                      + Registrar abono
                    </button>
                  )}
                </div>
                {detalle?.abonos.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">Sin abonos registrados aún.</p>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto pr-1">
                    {detalle?.abonos.map((abono) => (
                      <div key={abono.id} className="flex justify-between items-center text-xs py-2 text-slate-600">
                        <div>
                          <p className="font-medium capitalize text-slate-800">{abono.metodo_pago} {abono.referencia ? `· Ref: ${abono.referencia}` : ''}</p>
                          <p className="text-[11px] text-slate-400">{new Date(abono.fecha_abono).toLocaleString('es-CO')}</p>
                        </div>
                        <strong className="text-emerald-700 font-semibold">{money(abono.monto)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {abonoOpen && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-slate-700 uppercase">Nuevo abono (Saldo máximo: {money(ventaSeleccionada.saldo_pendiente)})</p>
                  <button onClick={() => setAbonoOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancelar</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min="1"
                    max={ventaSeleccionada.saldo_pendiente}
                    value={monto}
                    onChange={(event) => setMonto(event.target.value === '' ? '' : Number(event.target.value))}
                    placeholder="Monto a abonar"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={metodo}
                    onChange={(event) => setMetodo(event.target.value as MetodoPagoVenta)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Método de pago *</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
                <input
                  value={referencia}
                  onChange={(event) => setReferencia(event.target.value)}
                  placeholder="Referencia bancaria (opcional)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={notas}
                  onChange={(event) => setNotas(event.target.value)}
                  placeholder="Notas adicionales (opcional)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {(formError || abonoMutation.isError) && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                    {formError || (abonoMutation.error instanceof Error ? abonoMutation.error.message : 'No se pudo registrar el abono.')}
                  </p>
                )}
                <button
                  type="button"
                  onClick={guardarAbono}
                  disabled={abonoMutation.isPending}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {abonoMutation.isPending ? 'Registrando abono...' : 'Confirmar abono'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
