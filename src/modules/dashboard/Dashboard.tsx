import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Boxes, ShoppingCart, Wallet, AlertCircle,
  TrendingUp, ArrowRight, ShieldAlert,
  CalendarCheck, Clock, RefreshCw,
} from 'lucide-react';
import { money } from '@/lib/supabase';
import { fetchVentasEstado, fetchComisiones } from '@/modules/ventas/ventasService';
import { fetchInventarioDisponible } from '@/modules/inventario/inventarioService';
import { fetchGarantias } from '@/modules/garantias/garantiasService';
import { fetchCierres } from '@/modules/cierres/cierresService';

export default function Dashboard() {
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
    data: inventario = [],
    isLoading: inventarioLoading,
    isError: inventarioError,
    refetch: refetchInventario,
    isFetching: inventarioFetching,
  } = useQuery({
    queryKey: ['inventario-disponible'],
    queryFn: fetchInventarioDisponible,
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
    data: garantias = [],
    isLoading: garantiasLoading,
    isError: garantiasError,
    refetch: refetchGarantias,
    isFetching: garantiasFetching,
  } = useQuery({
    queryKey: ['garantias'],
    queryFn: fetchGarantias,
  });

  const {
    data: cierres = [],
    isLoading: cierresLoading,
    isError: cierresError,
    refetch: refetchCierres,
    isFetching: cierresFetching,
  } = useQuery({
    queryKey: ['cierres-semanales'],
    queryFn: fetchCierres,
  });

  // Calculate real metrics
  const metricas = useMemo(() => {
    const totalVentas = ventas.reduce((acc, v) => acc + (v.total_final || 0), 0);
    const recaudoNeto = ventas.reduce((acc, v) => acc + (v.recaudo_neto || 0), 0);
    const carteraPendiente = ventas.reduce((acc, v) => acc + (v.saldo_pendiente || 0), 0);

    const unidadesDisponibles = inventario.length;
    const costoInventario = inventario.reduce((acc, u) => acc + (u.costo_actual || 0), 0);

    const comisionesLiquidables = comisiones
      .filter((c) => c.estado_calculado === 'liquidable')
      .reduce((acc, c) => acc + (c.saldo_comision || 0), 0);

    const garantiasAbiertas = garantias.filter(
      (g) => !g.resolucion || g.estado === 'abierta' || g.estado === 'pendiente'
    ).length;

    const ultimoCierre = cierres[0] || null;

    return {
      totalVentas,
      recaudoNeto,
      carteraPendiente,
      unidadesDisponibles,
      costoInventario,
      comisionesLiquidables,
      garantiasAbiertas,
      ultimoCierre,
    };
  }, [ventas, inventario, comisiones, garantias, cierres]);

  const recargarTodo = () => {
    void Promise.all([
      refetchVentas(),
      refetchInventario(),
      refetchComisiones(),
      refetchGarantias(),
      refetchCierres(),
    ]);
  };

  const ultimasVentas = useMemo(() => ventas.slice(0, 5), [ventas]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 tracking-wider uppercase">Operación y control</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">Panel de control</h1>
          <p className="text-slate-500 text-sm mt-1">
            Resumen en tiempo real conectado al backend de Supabase.
          </p>
        </div>
        <button
          onClick={recargarTodo}
          disabled={ventasFetching || inventarioFetching || comisionesFetching || garantiasFetching || cierresFetching}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          title="Actualizar métricas"
        >
          <RefreshCw size={16} className={ventasFetching || inventarioFetching || comisionesFetching || garantiasFetching || cierresFetching ? 'animate-spin' : ''} />
          Actualizar datos
        </button>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ventas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ventas totales</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart size={16} />
            </div>
          </div>
          <div className="mt-3">
            {ventasLoading ? (
              <span className="text-lg font-bold text-slate-400">Cargando...</span>
            ) : ventasError ? (
              <span className="text-xs font-semibold text-red-600">Error al consultar</span>
            ) : (
              <p className="text-xl md:text-2xl font-black text-slate-900">{money(metricas.totalVentas)}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">{ventas.length} venta(s) registradas</p>
          </div>
        </div>

        {/* Recaudo Neto */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Recaudo neto</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <div className="mt-3">
            {ventasLoading ? (
              <span className="text-lg font-bold text-slate-400">Cargando...</span>
            ) : ventasError ? (
              <span className="text-xs font-semibold text-red-600">Error al consultar</span>
            ) : (
              <p className="text-xl md:text-2xl font-black text-emerald-700">{money(metricas.recaudoNeto)}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Efectivo/bancos ingresado</p>
          </div>
        </div>

        {/* Cartera Pendiente */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600">Cartera pendiente</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="mt-3">
            {ventasLoading ? (
              <span className="text-lg font-bold text-slate-400">Cargando...</span>
            ) : ventasError ? (
              <span className="text-xs font-semibold text-red-600">Error al consultar</span>
            ) : (
              <p className="text-xl md:text-2xl font-black text-amber-700">{money(metricas.carteraPendiente)}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">Saldos pendientes de cobro</p>
          </div>
        </div>

        {/* Inventario Disponible */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600">Inventario disponible</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Boxes size={16} />
            </div>
          </div>
          <div className="mt-3">
            {inventarioLoading ? (
              <span className="text-lg font-bold text-slate-400">Cargando...</span>
            ) : inventarioError ? (
              <span className="text-xs font-semibold text-red-600">Error al consultar</span>
            ) : (
              <p className="text-xl md:text-2xl font-black text-slate-900">{metricas.unidadesDisponibles} uds</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Costo: {inventarioLoading || inventarioError ? '—' : money(metricas.costoInventario)}
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Comisiones liquidables */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Comisiones liquidables</span>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {comisionesLoading ? '…' : comisionesError ? 'No disponible' : money(metricas.comisionesLiquidables)}
            </p>
          </div>
          <Link
            to="/finanzas"
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            title="Ir a finanzas"
          >
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* Garantías abiertas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Garantías abiertas</span>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {garantiasLoading ? '…' : garantiasError ? 'No disponible' : `${metricas.garantiasAbiertas} caso(s)`}
            </p>
          </div>
          <Link
            to="/garantias"
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            title="Ir a garantías"
          >
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* Estado último cierre */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Último cierre semanal</span>
            <p className="text-sm font-bold text-slate-800 mt-1">
              {cierresLoading ? '…' : cierresError ? 'No disponible' : metricas.ultimoCierre ? `Semana ${new Date(metricas.ultimoCierre.fecha_fin).toLocaleDateString('es-CO')}` : 'Sin cierres previos'}
            </p>
          </div>
          <Link
            to="/cierres"
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            title="Ir a cierres"
          >
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* Quick Actions & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 text-base">Accesos rápidos</h2>
          <div className="space-y-2">
            <Link
              to="/ventas"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700">Nueva venta</p>
                  <p className="text-[11px] text-slate-400">Punto de venta y abonos</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600" />
            </Link>

            <Link
              to="/compras"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Boxes size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700">Registrar compra</p>
                  <p className="text-[11px] text-slate-400">Recepción y lotes</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-emerald-600" />
            </Link>

            <Link
              to="/inventario"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-purple-50/50 hover:border-purple-200 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-purple-700">Inventario disponible</p>
                  <p className="text-[11px] text-slate-400">Trazabilidad por unidad física</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-purple-600" />
            </Link>

            <Link
              to="/finanzas"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-amber-50/50 hover:border-amber-200 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Wallet size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-amber-700">Finanzas y comisiones</p>
                  <p className="text-[11px] text-slate-400">Liquidación y recaudo</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-amber-600" />
            </Link>
          </div>
        </div>

        {/* Recent Sales Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-base">Ventas recientes</h2>
            <Link to="/ventas" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Ver todas ({ventas.length}) <ArrowRight size={14} />
            </Link>
          </div>

          {ventasLoading ? (
            <div className="py-10 text-center text-sm text-slate-500">Cargando ventas recientes...</div>
          ) : ultimasVentas.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">Aún no se han registrado ventas.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ultimasVentas.map((v) => (
                <div key={v.venta_id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-700">{v.venta_id.slice(0, 8)}...</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                        {v.estado}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(v.fecha_venta).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} · {v.unidades_asignadas} ud(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{money(v.total_final)}</p>
                    <p className="text-[11px] text-emerald-700">Recaudo: {money(v.recaudo_neto)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
