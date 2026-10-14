import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, RefreshCw, AlertCircle, Eye, Info, X, ShieldAlert } from 'lucide-react';
import { fetchGarantias, type Garantia } from './garantiasService';

export default function GarantiasPage() {
  const [selectedGarantia, setSelectedGarantia] = useState<Garantia | null>(null);
  const [filter, setFilter] = useState<'todas' | 'pendientes' | 'resueltas'>('todas');
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const {
    data: garantias = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['garantias'],
    queryFn: fetchGarantias,
  });

  const filtered = useMemo(() => {
    if (filter === 'pendientes') {
      return garantias.filter((g) => !g.resolucion || g.estado === 'abierta' || g.estado === 'pendiente');
    }
    if (filter === 'resueltas') {
      return garantias.filter((g) => g.resolucion && g.estado !== 'abierta' && g.estado !== 'pendiente');
    }
    return garantias;
  }, [garantias, filter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 tracking-wider uppercase">Soporte y calidad</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">Garantías y reemplazos</h1>
          <p className="text-slate-500 text-sm mt-1">
            Control de unidades reportadas por defecto, resoluciones y trazabilidad de origen.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setInfoModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Info size={16} className="text-blue-600" />
            Reglas de garantía
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            title="Actualizar garantías"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('todas')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'todas' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Todas ({garantias.length})
        </button>
        <button
          onClick={() => setFilter('pendientes')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'pendientes' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Abiertas / Pendientes
        </button>
        <button
          onClick={() => setFilter('resueltas')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'resueltas' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Resueltas
        </button>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 shadow-sm">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
          Cargando registro de garantías...
        </div>
      ) : isError ? (
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 text-amber-800 flex items-start gap-3 shadow-sm">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="text-sm font-bold">Consulta de garantías</p>
            <p className="text-xs mt-1">
              {error instanceof Error ? error.message : 'No se pudo consultar la tabla de garantías.'}
            </p>
            <p className="text-xs mt-2 text-amber-700">
              Nota: Si el backend aún no ha expuesto permisos RLS o la RPC de garantías para el rol actual, las consultas se reintentarán al actualizar.
            </p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
          <ShieldCheck size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No hay garantías registradas</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            {filter !== 'todas'
              ? 'No hay registros que coincidan con el filtro seleccionado.'
              : 'Cuando se presente una garantía sobre una unidad vendida, se registrará aquí.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((g) => (
              <div key={g.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800">{g.id.slice(0, 8)}...</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      g.estado === 'resuelta'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {g.estado || 'abierta'}
                    </span>
                    {g.resolucion && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                        {g.resolucion}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Venta: <span className="font-mono text-slate-700">{g.venta_id}</span> · Unidad: <span className="font-mono text-slate-700">{g.unidad_id}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Registrada el {new Date(g.creado_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedGarantia(g)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors self-start md:self-auto"
                >
                  <Eye size={15} />
                  Ver detalle
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedGarantia && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto flex items-center justify-center">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl my-8 border border-slate-200">
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Detalle de garantía</h3>
                <p className="font-mono text-xs text-slate-500 mt-0.5">{selectedGarantia.id}</p>
              </div>
              <button
                onClick={() => setSelectedGarantia(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 my-5 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Venta de origen:</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedGarantia.venta_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Unidad defectuosa afectada:</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedGarantia.unidad_id}</span>
                </div>
                {selectedGarantia.unidad_reemplazo_id && (
                  <div>
                    <span className="text-slate-500 block">Unidad entregada como reemplazo:</span>
                    <span className="font-mono font-semibold text-emerald-800">{selectedGarantia.unidad_reemplazo_id}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 border border-slate-200 rounded-xl">
                  <p className="text-slate-500">Resolución</p>
                  <p className="font-bold text-slate-900 capitalize mt-1">{selectedGarantia.resolucion || 'Pendiente'}</p>
                </div>
                <div className="p-3 border border-slate-200 rounded-xl">
                  <p className="text-slate-500">Destino unidad defectuosa</p>
                  <p className="font-bold text-slate-900 capitalize mt-1">{selectedGarantia.destino_unidad_defectuosa || 'No definido'}</p>
                </div>
              </div>

              {selectedGarantia.notas && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1">Notas del caso</p>
                  <p className="text-xs text-slate-600 p-3 bg-slate-50 rounded-xl border border-slate-100">{selectedGarantia.notas}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedGarantia(null)}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal about canonical warranty rules */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto flex items-center justify-center">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl my-8 border border-slate-200">
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Reglas de negocio para garantías</h3>
              </div>
              <button onClick={() => setInfoModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <p>
                <strong>Resoluciones permitidas por backend:</strong> <code className="text-blue-600">reemplazo</code>, <code className="text-blue-600">reembolso</code>, <code className="text-blue-600">sin_cobertura</code>, <code className="text-blue-600">reparacion</code>, <code className="text-blue-600">otra</code>.
              </p>
              <p>
                <strong>Destino de la unidad defectuosa:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><code className="text-slate-800">desechar</code>: Reconoce pérdida económica por costo.</li>
                <li><code className="text-slate-800">entregada</code>: Reconoce pérdida económica por costo.</li>
                <li><code className="text-slate-800">conservar</code>: NO reconoce pérdida automática.</li>
              </ul>
              <p>
                <strong>Reemplazo de unidad:</strong> Requiere que la unidad de reemplazo exista, esté disponible y pertenezca a la misma variante. Pasa a estado <code className="text-slate-800">salida_garantia</code>.
              </p>
              <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-500">
                La ejecución de nuevas garantías se realiza mediante los RPCs transaccionales correspondientes en coordinación con las migraciones 0006 y 0020.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setInfoModalOpen(false)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl font-medium"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
