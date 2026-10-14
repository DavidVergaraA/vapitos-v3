import { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle, CheckCircle2, DollarSign, Filter,
  RefreshCw, Wallet, X,
} from 'lucide-react';
import { money } from '@/lib/supabase';
import { fetchComisiones, fetchVentasEstado, pagarComision } from '@/modules/ventas/ventasService';
import { fetchMovimientosCaja } from './finanzasService';
import type { MetodoPagoVenta } from '@/types/ventas';

export default function FinanzasPage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'comisiones' | 'caja' | 'resumen'>(() =>
    location.pathname.includes('/caja') ? 'caja' : 'comisiones',
  );

  useEffect(() => {
    if (location.pathname.includes('/caja')) {
      setActiveTab('caja');
    }
  }, [location.pathname]);
  const [comisionFiltro, setComisionFiltro] = useState<'todas' | 'liquidables' | 'pendientes' | 'pagadas'>('todas');
  const [comisionSeleccionada, setComisionSeleccionada] = useState<{ id: string; monto: number; venta_id: string } | null>(null);
  const [metodo, setMetodo] = useState<MetodoPagoVenta | ''>('');
  const [notas, setNotas] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [pagoExitoso, setPagoExitoso] = useState<string | null>(null);

  const {
    data: ventas = [],
    isLoading: ventasLoading,
    isError: ventasError,
    refetch: refetchVentas,
    isFetching: ventasFetching,
  } = useQuery({
    queryKey: ['ventas-estado'],
    queryFn: fetchVentasEstado,
  });

  const {
    data: comisiones = [],
    isLoading: comisionesLoading,
    isError: comisionesError,
    refetch: refetchComisiones,
    isFetching: comisionesFetching,
  } = useQuery({
    queryKey: ['comisiones'],
    queryFn: fetchComisiones,
  });

  const {
    data: movimientosCaja = [],
    isLoading: cajaLoading,
    isError: cajaError,
    refetch: refetchCaja,
  } = useQuery({
    queryKey: ['movimientos-caja'],
    queryFn: fetchMovimientosCaja,
  });

  const resumen = useMemo(() => {
    const totalVentas = ventas.reduce((acc, v) => acc + (v.total_final || 0), 0);
    const recaudo = ventas.reduce((acc, v) => acc + (v.recaudo_neto || 0), 0);
    const saldo = ventas.reduce((acc, v) => acc + (v.saldo_pendiente || 0), 0);
    const reembolsos = ventas.reduce((acc, v) => acc + (v.reembolso_total || 0), 0);

    const comisionesLiquidables = comisiones
      .filter((c) => c.estado_calculado === 'liquidable')
      .reduce((acc, c) => acc + (c.saldo_comision || 0), 0);

    const comisionesPagadas = comisiones
      .filter((c) => c.estado_calculado === 'pagada')
      .reduce((acc, c) => acc + (c.total_pagado || 0), 0);

    const comisionesPendientes = comisiones
      .filter((c) => c.estado_calculado === 'pendiente_pago_venta')
      .reduce((acc, c) => acc + (c.obligacion_actual || 0), 0);

    return {
      totalVentas,
      recaudo,
      saldo,
      reembolsos,
      comisionesLiquidables,
      comisionesPagadas,
      comisionesPendientes,
    };
  }, [ventas, comisiones]);

  const comisionesFiltradas = useMemo(() => {
    if (comisionFiltro === 'liquidables') return comisiones.filter((c) => c.estado_calculado === 'liquidable');
    if (comisionFiltro === 'pendientes') return comisiones.filter((c) => c.estado_calculado === 'pendiente_pago_venta');
    if (comisionFiltro === 'pagadas') return comisiones.filter((c) => c.estado_calculado === 'pagada');
    return comisiones;
  }, [comisiones, comisionFiltro]);

  const pagoMutation = useMutation({
    mutationFn: pagarComision,
    onSuccess: async () => {
      setPagoExitoso(`Comisión pagada con éxito (${money(comisionSeleccionada?.monto)}).`);
      setComisionSeleccionada(null);
      setMetodo('');
      setNotas('');
      setFormError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['comisiones'] }),
        queryClient.invalidateQueries({ queryKey: ['movimientos-caja'] }),
      ]);
    },
  });

  const ejecutarPago = () => {
    if (!comisionSeleccionada) return;
    if (!metodo) {
      setFormError('Selecciona el método de pago (efectivo o transferencia).');
      return;
    }
    setFormError(null);
    pagoMutation.mutate({
      comision_id: comisionSeleccionada.id,
      monto: comisionSeleccionada.monto,
      metodo_pago: metodo,
      notas: notas.trim() || 'Pago de comisión liquidable',
    });
  };

  const recargarTodo = () => {
    refetchVentas();
    refetchComisiones();
    refetchCaja();
  };

  const isRefreshing = ventasFetching || comisionesFetching;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 tracking-wider uppercase">Tesorería y control</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">Finanzas y comisiones</h1>
          <p className="text-slate-500 text-sm mt-1">
            Recaudo neto real, saldos pendientes y liquidación transaccional de comisiones.
          </p>
        </div>
        <button
          onClick={recargarTodo}
          disabled={isRefreshing}
          className="self-start sm:self-auto p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          title="Actualizar datos financieros"
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {pagoExitoso && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-800 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="flex-shrink-0" />
            <span className="text-sm font-semibold">{pagoExitoso}</span>
          </div>
          <button onClick={() => setPagoExitoso(null)} className="text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Financial Metric Cards */}
      {ventasError || comisionesError ? (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl flex gap-3 text-sm">
          <AlertCircle size={20} className="flex-shrink-0" />
          <div>
            <p className="font-bold">Error al cargar datos financieros</p>
            <p className="text-xs mt-0.5">Verifica la conexión a Supabase o recarga la página.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Ventas totales</span>
              <DollarSign size={16} className="text-slate-400" />
            </div>
            <p className="text-xl md:text-2xl font-black text-slate-900 mt-2">
              {ventasLoading ? '…' : money(resumen.totalVentas)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Facturado histórico</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600">Recaudo neto</span>
              <Wallet size={16} className="text-emerald-500" />
            </div>
            <p className="text-xl md:text-2xl font-black text-emerald-700 mt-2">
              {ventasLoading ? '…' : money(resumen.recaudo)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Efectivo/bancos ingresado</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600">Cartera pendiente</span>
              <AlertCircle size={16} className="text-amber-500" />
            </div>
            <p className="text-xl md:text-2xl font-black text-amber-700 mt-2">
              {ventasLoading ? '…' : money(resumen.saldo)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Saldos por cobrar</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-600">Comisiones liquidables</span>
              <CheckCircle2 size={16} className="text-blue-500" />
            </div>
            <p className="text-xl md:text-2xl font-black text-blue-700 mt-2">
              {comisionesLoading ? '…' : money(resumen.comisionesLiquidables)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Listas para pagar</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('comisiones')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
            activeTab === 'comisiones' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Comisiones ({comisiones.length})
        </button>
        <button
          onClick={() => setActiveTab('caja')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
            activeTab === 'caja' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Movimientos de caja ({movimientosCaja.length})
        </button>
      </div>

      {/* Tab: Comisiones */}
      {activeTab === 'comisiones' && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Liquidación de comisiones</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Una comisión se vuelve liquidable únicamente cuando la venta queda 100% recaudada.
              </p>
            </div>
            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <Filter size={14} className="text-slate-400 mr-1" />
              {(['todas', 'liquidables', 'pendientes', 'pagadas'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setComisionFiltro(t)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                    comisionFiltro === t ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {comisionesLoading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />
              Cargando comisiones...
            </div>
          ) : comisionesFiltradas.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No hay comisiones en este estado.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {comisionesFiltradas.map((comision) => {
                const badgeColor =
                  comision.estado_calculado === 'pagada'
                    ? 'bg-slate-100 text-slate-700'
                    : comision.estado_calculado === 'liquidable'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                    : 'bg-amber-50 text-amber-700 border border-amber-200';

                return (
                  <div
                    key={comision.comision_id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">Venta {comision.venta_id.slice(0, 8)}...</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${badgeColor}`}>
                          {comision.estado_calculado.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-base font-bold text-slate-900 mt-1">
                        {money(comision.obligacion_actual)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">Pagado: {money(comision.total_pagado)} · Saldo: {money(comision.saldo_comision)}</p>
                    </div>

                    {comision.estado_calculado === 'liquidable' && comision.saldo_comision > 0 && (
                      <button
                        onClick={() => {
                          setComisionSeleccionada({
                            id: comision.comision_id,
                            monto: comision.saldo_comision,
                            venta_id: comision.venta_id,
                          });
                          setFormError(null);
                        }}
                        className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm self-start sm:self-auto"
                      >
                        Pagar comisión
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Tab: Caja */}
      {activeTab === 'caja' && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Historial de movimientos de caja</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Registros transaccionales de ingresos por abonos y egresos por comisiones/gastos.
            </p>
          </div>

          {cajaLoading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />
              Cargando movimientos de caja...
            </div>
          ) : cajaError ? (
            <div className="p-5 text-sm text-red-700 bg-red-50 m-4 rounded-xl border border-red-200">
              No se pudieron consultar los movimientos de caja. Revisa el acceso de lectura y vuelve a intentarlo.
            </div>
          ) : movimientosCaja.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No hay movimientos de caja registrados.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {movimientosCaja.map((mov) => (
                <div key={mov.id} className="p-4 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-800 capitalize">
                      {mov.tipo_movimiento || 'Movimiento'} · {mov.metodo_pago || 'General'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(mov.fecha_movimiento).toLocaleString('es-CO')} · {mov.direccion} · {mov.motivo}
                    </p>
                  </div>
                  <strong className="text-slate-900 text-base">{money(mov.monto)}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Modal: Pagar comisión */}
      {comisionSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Pagar comisión</h3>
                <p className="text-xs text-slate-500">Venta: {comisionSeleccionada.venta_id.slice(0, 8)}...</p>
              </div>
              <button
                onClick={() => setComisionSeleccionada(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500">Monto acordado</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{money(comisionSeleccionada.monto)}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Método de pago *</label>
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as MetodoPagoVenta)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona método...</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia bancaria</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notas del desembolso</label>
              <input
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. Pagado por Nequi / Comprobante #123"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {(formError || pagoMutation.isError) && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {formError || (pagoMutation.error instanceof Error ? pagoMutation.error.message : 'No se pudo registrar el pago de la comisión.')}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setComisionSeleccionada(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarPago}
                disabled={pagoMutation.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {pagoMutation.isPending ? 'Procesando...' : 'Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
