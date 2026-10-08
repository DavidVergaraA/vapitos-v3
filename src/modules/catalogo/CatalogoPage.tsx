import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Filter, Edit, Package, 
  Layers, CheckCircle2, XCircle, RefreshCw, AlertCircle 
} from 'lucide-react';
import { fetchProductos, guardarProducto, guardarVariante } from './catalogService';
import type { ProductoConVariantes } from '@/types/catalog';
import { rid } from '@/lib/supabase';

export default function CatalogoPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterActivo, setFilterActivo] = useState<'all' | 'true' | 'false'>('all');
  
  // Modals state
  const [productModal, setProductModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductoConVariantes | null>(null);
  const [variantModal, setVariantModal] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Form states
  const [pMarca, setPMarca] = useState('');
  const [pModelo, setPModelo] = useState('');
  const [pCategoria, setPCategoria] = useState('');
  const [pPuffs, setPPuffs] = useState<number | ''>('');
  const [pDescripcion, setPDescripcion] = useState('');
  const [pActivo, setPActivo] = useState(true);

  const [vSabor, setVSabor] = useState('');
  const [vActivo, setVActivo] = useState(true);

  // Query
  const { data: productos = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['productos'],
    queryFn: fetchProductos,
  });

  // Mutations
  const productMutation = useMutation({
    mutationFn: guardarProducto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      closeProductModal();
    },
  });

  const variantMutation = useMutation({
    mutationFn: guardarVariante,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      closeVariantModal();
    },
  });

  const openNewProductModal = () => {
    setEditingProduct(null);
    setPMarca('');
    setPModelo('');
    setPCategoria('');
    setPPuffs('');
    setPDescripcion('');
    setPActivo(true);
    setProductModal(true);
  };

  const openEditProductModal = (p: ProductoConVariantes) => {
    setEditingProduct(p);
    setPMarca(p.marca);
    setPModelo(p.modelo);
    setPCategoria(p.categoria || '');
    setPPuffs(p.puffs !== null ? p.puffs : '');
    setPDescripcion(p.descripcion || '');
    setPActivo(p.activo);
    setProductModal(true);
  };

  const closeProductModal = () => {
    setProductModal(false);
    setEditingProduct(null);
  };

  const openAddVariantModal = (productId: string) => {
    setSelectedProductId(productId);
    setVSabor('');
    setVActivo(true);
    setVariantModal(true);
  };

  const closeVariantModal = () => {
    setVariantModal(false);
    setSelectedProductId(null);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    productMutation.mutate({
      p_producto_id: editingProduct ? editingProduct.id : rid(),
      p_marca: pMarca.trim(),
      p_modelo: pModelo.trim(),
      p_categoria: pCategoria.trim() || null,
      p_puffs: pPuffs !== '' ? Number(pPuffs) : null,
      p_descripcion: pDescripcion.trim() || null,
      p_activo: pActivo,
    });
  };

  const handleSaveVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    variantMutation.mutate({
      p_variante_id: rid(),
      p_producto_id: selectedProductId,
      p_sabor: vSabor.trim(),
      p_atributos: {},
      p_activo: vActivo,
    });
  };

  const filteredProductos = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch = 
        p.marca.toLowerCase().includes(search.toLowerCase()) ||
        p.modelo.toLowerCase().includes(search.toLowerCase()) ||
        (p.categoria && p.categoria.toLowerCase().includes(search.toLowerCase())) ||
        p.variantes?.some((v) => v.sabor.toLowerCase().includes(search.toLowerCase()));

      const matchActivo = 
        filterActivo === 'all' ? true :
        filterActivo === 'true' ? p.activo : !p.activo;

      return matchSearch && matchActivo;
    });
  }, [productos, search, filterActivo]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 tracking-wider uppercase">Catálogo maestro</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">Productos y Variantes</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión del catálogo oficial y sus variantes de sabor.</p>
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
            onClick={openNewProductModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Nuevo producto</span>
          </button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por marca, modelo, sabor..."
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

      {/* Main content list */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
          Cargando catálogo...
        </div>
      ) : isError ? (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">Error al cargar el catálogo: {(error as Error)?.message}</p>
        </div>
      ) : filteredProductos.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Package size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron productos</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            {search || filterActivo !== 'all' 
              ? 'Prueba modificando tus términos de búsqueda o filtros.' 
              : 'Empieza agregando tu primer producto con el botón "Nuevo producto".'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProductos.map((p) => (
            <div 
              key={p.id} 
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{p.marca}</span>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">{p.modelo}</h3>
                  </div>
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
                      onClick={() => openEditProductModal(p)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Editar producto"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-slate-600 mb-3">
                  {p.categoria && (
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700">
                      {p.categoria}
                    </span>
                  )}
                  {p.puffs && (
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                      {p.puffs.toLocaleString()} puffs
                    </span>
                  )}
                </div>

                {p.descripcion && (
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                    {p.descripcion}
                  </p>
                )}

                {/* Variantes section */}
                <div className="border-t border-slate-100 pt-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Layers size={14} /> Sabores / Variantes ({p.variantes?.length || 0})
                    </span>
                    <button
                      onClick={() => openAddVariantModal(p.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                    >
                      + Agregar sabor
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {p.variantes && p.variantes.length > 0 ? (
                      p.variantes.map((v) => (
                        <span 
                          key={v.id}
                          className={`text-xs px-2 py-1 rounded-lg border flex items-center gap-1 ${
                            v.activo 
                              ? 'bg-slate-50 border-slate-200 text-slate-700' 
                              : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                          }`}
                        >
                          {v.sabor}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Sin sabores registrados</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      {productModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              {productMutation.isError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
                  {(productMutation.error as Error)?.message || 'Error al guardar el producto'}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    value={pMarca}
                    onChange={(e) => setPMarca(e.target.value)}
                    placeholder="Ej. Elf Bar"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={pModelo}
                    onChange={(e) => setPModelo(e.target.value)}
                    placeholder="Ej. BC5000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
                  <input
                    type="text"
                    value={pCategoria}
                    onChange={(e) => setPCategoria(e.target.value)}
                    placeholder="Ej. Desechable"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Puffs</label>
                  <input
                    type="number"
                    min="0"
                    value={pPuffs}
                    onChange={(e) => setPPuffs(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ej. 5000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={pDescripcion}
                  onChange={(e) => setPDescripcion(e.target.value)}
                  placeholder="Detalles adicionales del dispositivo..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pActivo"
                  checked={pActivo}
                  onChange={(e) => setPActivo(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="pActivo" className="text-sm font-medium text-slate-700">
                  Producto activo en catálogo
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={productMutation.isPending}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {productMutation.isPending ? 'Guardando...' : 'Guardar producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Variant Modal */}
      {variantModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Agregar Sabor / Variante</h2>
            <form onSubmit={handleSaveVariant} className="space-y-4">
              {variantMutation.isError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
                  {(variantMutation.error as Error)?.message || 'Error al guardar la variante'}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sabor / Nombre *</label>
                <input
                  type="text"
                  required
                  value={vSabor}
                  onChange={(e) => setVSabor(e.target.value)}
                  placeholder="Ej. Watermelon Ice"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vActivo"
                  checked={vActivo}
                  onChange={(e) => setVActivo(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="vActivo" className="text-sm font-medium text-slate-700">
                  Variante activa
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeVariantModal}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={variantMutation.isPending}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {variantMutation.isPending ? 'Guardando...' : 'Guardar variante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
