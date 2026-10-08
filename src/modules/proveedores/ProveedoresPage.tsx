import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Filter, Edit, Store, 
  CheckCircle2, XCircle, RefreshCw, AlertCircle, Phone, FileText 
} from 'lucide-react';
import { fetchProveedores, guardarProveedor } from './proveedorService';
import type { Proveedor } from '@/types/proveedores';
import { rid } from '@/lib/supabase';

export default function ProveedoresPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterActivo, setFilterActivo] = useState<'all' | 'true' | 'false'>('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);

  // Form state
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [notas, setNotas] = useState('');
  const [activo, setActivo] = useState(true);

  // Query
  const { data: proveedores = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['proveedores'],
    queryFn: fetchProveedores,
  });

  // Mutation
  const mutation = useMutation({
    mutationFn: guardarProveedor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      closeModal();
    },
  });

  const openNewModal = () => {
    setEditingProveedor(null);
    setNombre('');
    setContacto('');
    setNotas('');
    setActivo(true);
    setModalOpen(true);
  };

  const openEditModal = (p: Proveedor) => {
    setEditingProveedor(p);
    setNombre(p.nombre);
    setContacto(p.contacto || '');
    setNotas(p.notas || '');
    setActivo(p.activo);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProveedor(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      p_proveedor_id: editingProveedor ? editingProveedor.id : rid(),
      p_nombre: nombre.trim(),
      p_contacto: contacto.trim() || null,
      p_notas: notas.trim() || null,
      p_activo: activo,
    });
  };

  const filteredProveedores = useMemo(() => {
    return proveedores.filter((p) => {
      const matchSearch = 
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (p.contacto && p.contacto.toLowerCase().includes(search.toLowerCase())) ||
        (p.notas && p.notas.toLowerCase().includes(search.toLowerCase()));

      const matchActivo = 
        filterActivo === 'all' ? true :
        filterActivo === 'true' ? p.activo : !p.activo;

      return matchSearch && matchActivo;
    });
  }, [proveedores, search, filterActivo]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 tracking-wider uppercase">Proveedores de mercancía</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">Directorio de Proveedores</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión de contactos y abastecimiento de vapes y accesorios.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            title="Actualizar datos"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Nuevo proveedor</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
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
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={16} className="text-slate-400" />
          <select
            value={filterActivo}
            onChange={(e) => setFilterActivo(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-sm px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="true">Solo activos</option>
            <option value="false">Solo inactivos</option>
          </select>
        </div>
      </div>

      {/* Main content */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
          Cargando proveedores...
        </div>
      ) : isError ? (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">Error al cargar proveedores: {(error as Error)?.message}</p>
        </div>
      ) : filteredProveedores.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Store size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron proveedores</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            {search || filterActivo !== 'all' 
              ? 'Prueba modificando tus términos de búsqueda o filtros.' 
              : 'Registra un proveedor para poder asociar compras e ingresos de mercancía.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProveedores.map((p) => (
            <div 
              key={p.id} 
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{p.nombre}</h3>
                  <div className="flex items-center gap-1.5">
                    {p.activo ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 size={12} /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        <XCircle size={12} /> Inactivo
                      </span>
                    )}
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Editar proveedor"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>

                {p.contacto && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                    <Phone size={14} className="text-slate-400 flex-shrink-0" />
                    <span>{p.contacto}</span>
                  </div>
                )}

                {p.notas && (
                  <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                    <FileText size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                    <p className="line-clamp-3">{p.notas}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              {mutation.isError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
                  {(mutation.error as Error)?.message || 'Error al guardar el proveedor'}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del proveedor *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Distribuidor Vape Latam"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contacto / Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  placeholder="Ej. +57 300 123 4567 / info@proveedor.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notas / Condiciones comerciales</label>
                <textarea
                  rows={3}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Días de despacho, condiciones, referencias..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="activo" className="text-sm font-medium text-slate-700">
                  Proveedor activo
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {mutation.isPending ? 'Guardando...' : 'Guardar proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
