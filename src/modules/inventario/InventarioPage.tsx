import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Boxes, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchInventarioDisponible } from './inventarioService';
import { money } from '@/lib/supabase';

export default function InventarioPage() {
  const [search, setSearch] = useState('');

  // Queries
  const {
    data: unidades = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['inventario-disponible'],
    queryFn: fetchInventarioDisponible,
  });

  // Filtered list by search
  const filtered = useMemo(() => {
    if (!search.trim()) return unidades;
    const q = search.toLowerCase();
    return unidades.filter((u) =>
      u.unidad_id.toLowerCase().includes(q) ||
      u.codigo_unidad.toLowerCase().includes(q) ||
      u.producto_id.toLowerCase().includes(q) ||
      u.marca.toLowerCase().includes(q) ||
      u.modelo.toLowerCase().includes(q) ||
      u.variante_id.toLowerCase().includes(q) ||
      u.sabor.toLowerCase().includes(q) ||
      u.lote_id.toLowerCase().includes(q)
    );
  }, [unidades, search]);

  const total = unidades.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 tracking-wider uppercase">Inventario físico</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">Unidades disponibles</h1>
          <p className="text-slate-500 text-sm mt-1">
            Unidades listas para vender, con la trazabilidad de producto y lote.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          title="Actualizar inventario disponible"
        >
          <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {!isLoading && !isError && <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800"><Boxes size={20} /><span className="text-sm">Disponibilidad actual: <strong>{total}</strong> unidad(es).</span></div>}

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por producto, sabor, código, lote o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Units Table */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
          Cargando unidades...
        </div>
      ) : isError ? (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle size={20} className="flex-shrink-0" />
          <div>
            <p className="text-sm font-bold">Error al cargar inventario</p>
            <p className="text-xs mt-1 opacity-80">Intenta actualizar la página. Si el problema continúa, contacta a un socio administrador.</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Boxes size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron unidades disponibles</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            {search
              ? 'Prueba modificando la búsqueda.'
              : 'Las unidades aparecen aquí al recibir una compra.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Unidad</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Sabor</th>
                  <th className="px-4 py-3">Puffs</th>
                  <th className="px-4 py-3">Lote</th>
                  <th className="px-4 py-3">Costo origen</th>
                  <th className="px-4 py-3">Costo actual</th>
                  <th className="px-4 py-3">Recepción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const fechaIngreso = u.recibido_at
                    ? new Date(u.recibido_at).toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr key={u.unidad_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3"><p className="font-mono text-[11px] text-slate-700">{u.codigo_unidad}</p><p className="font-mono text-[10px] text-slate-400">{u.unidad_id}</p></td>
                      <td className="px-4 py-3"><p className="font-semibold text-slate-800">{u.marca} {u.modelo}</p><p className="font-mono text-[10px] text-slate-400">{u.producto_id}</p></td>
                      <td className="px-4 py-3"><p className="text-slate-700">{u.sabor}</p><p className="font-mono text-[10px] text-slate-400">{u.variante_id}</p></td>
                      <td className="px-4 py-3 text-slate-600">{u.puffs ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{u.lote_id}</td>
                      <td className="px-4 py-3 text-slate-600">{money(u.costo_origen)}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {money(u.costo_actual)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{fechaIngreso}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            Mostrando {filtered.length} de {unidades.length} unidades
          </div>
        </div>
      )}

    </div>
  );
}
