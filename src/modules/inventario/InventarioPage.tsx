import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Boxes, Search, RefreshCw, AlertCircle, X } from 'lucide-react';
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
  const totalVariantes = new Set(unidades.map((unidad) => unidad.variante_id)).size;

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

      {!isLoading && !isError && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Unidades disponibles</p>
            <p className="mt-1 text-2xl font-black text-blue-900">{total}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Variantes en stock</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{totalVariantes}</p>
          </div>
          <div className="col-span-2 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800 sm:col-span-1">
            <Boxes size={20} className="shrink-0" />
            <span className="text-sm">Cada fila representa una unidad física trazable.</span>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xl">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto, sabor, código, lote o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-10 text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label="Limpiar búsqueda">
                <X size={16} />
              </button>
            )}
          </div>
          <p className="shrink-0 text-xs text-slate-500">{isLoading ? 'Cargando…' : `${filtered.length} de ${total} unidad(es)`}</p>
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
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm text-left">
              <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
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
          <div className="divide-y divide-slate-100 md:hidden">
            {filtered.map((unidad) => {
              const fechaIngreso = unidad.recibido_at
                ? new Date(unidad.recibido_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—';
              return (
                <article key={unidad.unidad_id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold text-blue-700">{unidad.codigo_unidad}</p>
                      <h2 className="mt-1 break-words text-sm font-bold text-slate-900">{unidad.marca} {unidad.modelo}</h2>
                      <p className="mt-0.5 text-sm text-slate-600">{unidad.sabor}</p>
                    </div>
                    {unidad.puffs != null && <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{unidad.puffs} puffs</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2"><p className="text-slate-400">Costo origen</p><p className="mt-0.5 font-semibold text-slate-700">{money(unidad.costo_origen)}</p></div>
                    <div className="rounded-lg bg-slate-50 p-2"><p className="text-slate-400">Costo actual</p><p className="mt-0.5 font-semibold text-slate-700">{money(unidad.costo_actual)}</p></div>
                  </div>
                  <div className="space-y-1 text-[10px] text-slate-400">
                    <p>Lote: <span className="font-mono text-slate-500">{unidad.lote_id}</span> · Recibido: {fechaIngreso}</p>
                    <details>
                      <summary className="cursor-pointer text-blue-600">Ver identificadores</summary>
                      <p className="mt-1 break-all">Unidad: {unidad.unidad_id}</p>
                      <p className="break-all">Producto: {unidad.producto_id}</p>
                      <p className="break-all">Variante: {unidad.variante_id}</p>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
            Mostrando {filtered.length} de {unidades.length} unidades
          </div>
        </div>
      )}

    </div>
  );
}
