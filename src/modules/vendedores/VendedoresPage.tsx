import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, RefreshCw, AlertCircle, CheckCircle2, Search, X, UserCheck, UserX } from 'lucide-react';
import { fetchTodosVendedores, guardarVendedorExterno } from './vendedoresService';
import type { VendedorExterno } from '@/types/ventas';

export default function VendedoresPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [activo, setActivo] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const {
    data: vendedores = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['todos-vendedores-externos'],
    queryFn: fetchTodosVendedores,
  });

  const mutation = useMutation({
    mutationFn: guardarVendedorExterno,
    onSuccess: async () => {
      setMensajeExito('Vendedor guardado correctamente.');
      setModalOpen(false);
      setNombre('');
      setContacto('');
      setActivo(true);
      setFormError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['todos-vendedores-externos'] }),
        queryClient.invalidateQueries({ queryKey: ['vendedores-externos-activos'] }),
      ]);
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Error al guardar el vendedor.');
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return vendedores;
    const q = search.toLowerCase();
    return vendedores.filter(
      (v) => v.nombre.toLowerCase().includes(q) || (v.contacto && v.contacto.toLowerCase().includes(q))
    );
  }, [vendedores, search]);

  const abrirNuevo = () => {
    setNombre('');
    setContacto('');
    setActivo(true);
    setFormError(null);
    setModalOpen(true);
  };

  const guardar = () => {
    if (!nombre.trim()) {
      setFormError('El nombre del vendedor es obligatorio.');
      return;
    }
    setFormError(null);
    mutation.mutate({
      nombre,
      contacto: contacto.trim() || null,
      activo,
    });
  };

  const toggleEstado = (vendedor: VendedorExterno) => {
    mutation.mutate({
      id: vendedor.id,
      nombre: vendedor.nombre,
      contacto: vendedor.contacto,
      activo: !vendedor.activo,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 tracking-wider uppercase">Fuerza de ventas</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">Vendedores externos</h1>
          <p className="text-slate-500 text-sm mt-1">
            Registro interno de socios y vendedores autorizados para comisiones (sin acceso al sistema).
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            title="Actualizar lista"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={abrirNuevo}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={18} />
            Nuevo vendedor
          </button>
        </div>
      </div>

      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-800 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span className="text-sm font-semibold">{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)} className="text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o contacto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 shadow-sm">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
          Cargando vendedores...
        </div>
      ) : isError ? (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-red-700 flex items-center gap-3 shadow-sm">
          <AlertCircle size={20} className="flex-shrink-0" />
          <div>
            <p className="text-sm font-bold">Error al cargar vendedores</p>
            <p className="text-xs mt-1">No se pudo consultar la tabla de vendedores externos.</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
          <Users size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron vendedores</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            {search ? 'Intenta modificar el término de búsqueda.' : 'Crea el primer vendedor externo para asociarlo a ventas.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((v) => (
              <div key={v.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{v.nombre}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      v.activo
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {v.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {v.contacto && <p className="text-xs text-slate-500 mt-0.5">Contacto: {v.contacto}</p>}
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {v.id}</p>
                </div>

                <button
                  onClick={() => toggleEstado(v)}
                  disabled={mutation.isPending}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors self-start sm:self-auto ${
                    v.activo
                      ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                  title={v.activo ? 'Desactivar vendedor' : 'Activar vendedor'}
                >
                  {v.activo ? (
                    <>
                      <UserX size={14} />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <UserCheck size={14} />
                      Activar
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Crear Vendedor */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Nuevo vendedor externo</h3>
                <p className="text-xs text-slate-500 mt-0.5">Solo para control interno de comisiones.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre completo *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Carlos Morales"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono / Contacto (opcional)</label>
              <input
                type="text"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="Ej. +57 300 123 4567"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="check-activo"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="check-activo" className="text-xs font-medium text-slate-700">
                Vendedor activo (disponible en selección de ventas)
              </label>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {formError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardar}
                disabled={mutation.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {mutation.isPending ? 'Guardando...' : 'Crear vendedor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
