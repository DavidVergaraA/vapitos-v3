import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck, RefreshCw, AlertCircle, CheckCircle2,
  Lock, PieChart, Info, X,
} from 'lucide-react';
import { money } from '@/lib/supabase';
import { fetchCierres, ejecutarCierreSemanal } from './cierresService';
import { fetchVentasEstado } from '@/modules/ventas/ventasService';

function getLunesYDomingoActual() {
  const ahora = new Date();
  const diaSemana = ahora.getDay(); // 0 es domingo, 1 es lunes...
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(ahora);
  lunes.setDate(ahora.getDate() + diffLunes);
  lunes.setHours(0, 0, 0, 0);

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);

  return { lunes, domingo };
}

export default function CierresPage() {
  const queryClient = useQueryClient();
  const [modalConfirmacionOpen, setModalConfirmacionOpen] = useState(false);
  const [notasCierre, setNotasCierre] = useState('');
  const [errorCierre, setErrorCierre] = useState<string | null>(null);

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

  const {
    data: ventas = [],
    isLoading: ventasLoading,
  } = useQuery({
    queryKey: ['ventas-estado'],
    queryFn: fetchVentasEstado,
  });

  const { lunes, domingo } = useMemo(() => getLunesYDomingoActual(), []);

  // Calculate current week metrics from real sales
  const metricasSemanaActual = useMemo(() => {
    const ventasSemana = ventas.filter((v) => {
      const fecha = new Date(v.fecha_venta);
      return fecha >= lunes && fecha <= domingo;
    });

    const totalVentas = ventasSemana.reduce((acc, v) => acc + (v.total_final || 0), 0);
    const recaudo = ventasSemana.reduce((acc, v) => acc + (v.recaudo_neto || 0), 0);
    const saldo = ventasSemana.reduce((acc, v) => acc + (v.saldo_pendiente || 0), 0);

    // Distribution preview: 40% reinversión, 30% socio 1, 30% socio 2 (si recaudo > 0)
    const reinversion = recaudo > 0 ? recaudo * 0.4 : 0;
    const socio1 = recaudo > 0 ? recaudo * 0.3 : 0;
    const socio2 = recaudo > 0 ? recaudo * 0.3 : 0;

    return {
      cantidadVentas: ventasSemana.length,
      totalVentas,
      recaudo,
      saldo,
      reinversion,
      socio1,
      socio2,
    };
  }, [ventas, lunes, domingo]);

  const cierreMutation = useMutation({
    mutationFn: ejecutarCierreSemanal,
    onSuccess: async () => {
      setModalConfirmacionOpen(false);
      setNotasCierre('');
      setErrorCierre(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cierres-semanales'] }),
        queryClient.invalidateQueries({ queryKey: ['ventas-estado'] }),
      ]);
    },
    onError: (err) => {
      setErrorCierre(err instanceof Error ? err.message : 'Error al procesar el cierre semanal.');
    },
  });

  const formatearFecha = (d: Date | string) => {
    return new Date(d).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const confirmarCierre = () => {
    setErrorCierre(null);
    cierreMutation.mutate({
      fecha_inicio: lunes.toISOString().split('T')[0],
      fecha_fin: domingo.toISOString().split('T')[0],
      notas: notasCierre.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 tracking-wider uppercase">Cierres y distribución</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">Cierre semanal</h1>
          <p className="text-slate-500 text-sm mt-1">
            Consolidación financiera semanal (lunes a domingo) y distribución entre socios.
          </p>
        </div>
        <button
          onClick={() => refetchCierres()}
          disabled={cierresFetching}
          className="self-start sm:self-auto p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          title="Actualizar cierres"
        >
          <RefreshCw size={18} className={cierresFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Semana en curso Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck size={18} className="text-blue-600" />
              <h2 className="font-bold text-slate-900 text-base">Semana en curso</h2>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Abierta
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Periodo: <strong>{formatearFecha(lunes)}</strong> al <strong>{formatearFecha(domingo)}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setErrorCierre(null);
              setModalConfirmacionOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto"
          >
            <Lock size={16} />
            Ejecutar cierre de la semana
          </button>
        </div>

        {/* Live Metrics for the Current Week */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-xs font-semibold text-slate-500">Ventas de la semana</span>
            <p className="text-xl font-black text-slate-900 mt-1">
              {ventasLoading ? '…' : money(metricasSemanaActual.totalVentas)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">{metricasSemanaActual.cantidadVentas} venta(s) registrada(s)</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-xs font-semibold text-emerald-600">Recaudo acumulado</span>
            <p className="text-xl font-black text-emerald-700 mt-1">
              {ventasLoading ? '…' : money(metricasSemanaActual.recaudo)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Ingresos efectivos netos</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-xs font-semibold text-amber-600">Cartera de la semana</span>
            <p className="text-xl font-black text-amber-700 mt-1">
              {ventasLoading ? '…' : money(metricasSemanaActual.saldo)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Saldo pendiente por cobrar</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-xs font-semibold text-blue-600">Distribución estimada</span>
            <p className="text-xl font-black text-blue-700 mt-1">
              {ventasLoading ? '…' : money(metricasSemanaActual.recaudo)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Base de cálculo (recaudo)</p>
          </div>
        </div>

        {/* Distribution Breakdown Preview */}
        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <PieChart size={16} className="text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Esquema de distribución (Configuración vigente: 40% / 30% / 30%)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500">Reinversión de capital (40%)</span>
              <p className="text-base font-bold text-slate-900 mt-1">{money(metricasSemanaActual.reinversion)}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500">Socio 1 (30%)</span>
              <p className="text-base font-bold text-slate-900 mt-1">{money(metricasSemanaActual.socio1)}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500">Socio 2 (30%)</span>
              <p className="text-base font-bold text-slate-900 mt-1">{money(metricasSemanaActual.socio2)}</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info size={13} className="flex-shrink-0 text-blue-500" />
            Regla de negocio: Si el resultado neto es negativo, el monto distribuible se fija en $0 y no se distribuyen pérdidas a socios.
          </p>
        </div>
      </div>

      {/* Historial de Cierres */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Historial de cierres consolidados</h2>
          <p className="text-xs text-slate-500 mt-0.5">Semanas cerradas con snapshot de distribución y costos.</p>
        </div>

        {cierresLoading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />
            Cargando historial de cierres...
          </div>
        ) : cierresError ? (
          <div className="p-5 text-sm text-red-600 bg-red-50 m-4 rounded-xl border border-red-200">
            No se pudo consultar el historial de cierres.
          </div>
        ) : cierres.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Aún no se han ejecutado cierres semanales en el sistema.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {cierres.map((c) => (
              <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      Semana {formatearFecha(c.semana_inicio)} – {formatearFecha(c.semana_fin)}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {c.estado || 'cerrada'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Ventas: {money(c.ventas_totales)} · Recaudo: {money(c.recaudo_total)} · Distribuible: {money(c.monto_distribuible)}
                  </p>
                </div>
                <div className="text-xs text-slate-600">
                  <span>Cerrado el {c.cerrado_at ? formatearFecha(c.cerrado_at) : '—'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal: Confirmación de Cierre */}
      {modalConfirmacionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Confirmar cierre semanal</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Periodo: {formatearFecha(lunes)} – {formatearFecha(domingo)}
                </p>
              </div>
              <button
                onClick={() => setModalConfirmacionOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <p className="font-bold">Acción financiera irreversible</p>
              <p>
                El cierre consolidará las ventas y el recaudo del periodo mediante la RPC transaccional del backend.
              </p>
            </div>

            <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
              <div className="flex justify-between">
                <span>Ventas totales:</span>
                <strong>{money(metricasSemanaActual.totalVentas)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Recaudo neto:</span>
                <strong>{money(metricasSemanaActual.recaudo)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Cartera pendiente:</span>
                <strong>{money(metricasSemanaActual.saldo)}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notas del cierre (opcional)</label>
              <textarea
                rows={2}
                value={notasCierre}
                onChange={(e) => setNotasCierre(e.target.value)}
                placeholder="Observaciones de auditoría o aclaraciones"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {errorCierre && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {errorCierre}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmacionOpen(false)}
                disabled={cierreMutation.isPending}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarCierre}
                disabled={cierreMutation.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {cierreMutation.isPending ? 'Cerrando...' : 'Confirmar y cerrar semana'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
