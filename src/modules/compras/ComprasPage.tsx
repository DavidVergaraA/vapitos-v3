import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Filter, Truck, PackageCheck, 
  Calendar, RefreshCw, AlertCircle, Trash2, CheckCircle2, Clock
} from 'lucide-react';
import { fetchCompras, registrarCompra, recibirCompra } from './comprasService';
import { fetchProveedores } from '@/modules/proveedores/proveedorService';
import { fetchProductos } from '@/modules/catalogo/catalogService';
import type { Compra, ItemCompraInput, RecibirCompraItem } from '@/types/compras';
import { money } from '@/lib/supabase';

export default function ComprasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<'all' | 'recibida' | 'pendiente'>('all');

  // Modal new purchase
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProveedorId, setSelectedProveedorId] = useState('');
  const [fechaCompra, setFechaCompra] = useState(() => new Date().toISOString().slice(0, 10));
  const [referencia, setReferencia] = useState('');
  const [notas, setNotas] = useState('');
  const [items, setItems] = useState<ItemCompraInput[]>([]);

  // Item being added
  const [curProductoId, setCurProductoId] = useState('');
  const [curVarianteId, setCurVarianteId] = useState('');
  const [curCantidad, setCurCantidad] = useState<number | ''>('');
  const [curCosto, setCurCosto] = useState<number | ''>('');
  const [curNotas, setCurNotas] = useState('');
  const [receivingCompra, setReceivingCompra] = useState<Compra | null>(null);
  const [receiptQuantities, setReceiptQuantities] = useState<Record<string, number | ''>>({});
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [compraError, setCompraError] = useState<string | null>(null);

  // Queries
  const { data: compras = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['compras'],
    queryFn: fetchCompras,
  });

  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores'],
    queryFn: fetchProveedores,
  });

  const { data: productos = [] } = useQuery({
    queryKey: ['productos'],
    queryFn: fetchProductos,
  });

  // Active proveedores
  const activeProveedores = useMemo(() => proveedores.filter((p) => p.activo), [proveedores]);

  // Selected product's variants
  const availableVariants = useMemo(() => {
    const prod = productos.find((p) => p.id === curProductoId);
    return (prod?.variantes || []).filter((v) => v.activo);
  }, [productos, curProductoId]);

  const varianteLabels = useMemo(() => {
    const labels = new Map<string, string>();
    for (const producto of productos) {
      for (const variante of producto.variantes || []) {
        labels.set(variante.id, `${producto.marca} ${producto.modelo} · ${variante.sabor}`);
      }
    }
    return labels;
  }, [productos]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: registrarCompra,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      closeModal();
    },
  });

  const receiveMutation = useMutation({
    mutationFn: ({ compraId, items: receiptItems }: { compraId: string; items: RecibirCompraItem[] }) =>
      recibirCompra(compraId, receiptItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-disponible'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-disponible-venta'] });
      queryClient.invalidateQueries({ queryKey: ['resumen-inventario'] });
      setReceivingCompra(null);
      setReceiptError(null);
    },
  });

  const openNewModal = () => {
    setSelectedProveedorId(activeProveedores[0]?.id || '');
    setFechaCompra(new Date().toISOString().slice(0, 10));
    setReferencia('');
    setNotas('');
    setItems([]);
    setCurProductoId('');
    setCurVarianteId('');
    setCurCantidad('');
    setCurCosto('');
    setCurNotas('');
    setCompraError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!curProductoId || !curVarianteId || !curCantidad || curCosto === '') return;
    
    setItems((prev) => [
      ...prev,
      {
        producto_id: curProductoId,
        variante_id: curVarianteId,
        cantidad_pedida: Number(curCantidad),
        costo_unitario: Number(curCosto),
        notas: curNotas.trim() || null,
      },
    ]);

    setCurVarianteId('');
    setCurCantidad('');
    setCurCosto('');
    setCurNotas('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalCalculado = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.cantidad_pedida * it.costo_unitario), 0);
  }, [items]);

  const handleSubmitCompra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProveedorId) {
      setCompraError('Debes seleccionar un proveedor.');
      return;
    }
    if (items.length === 0) {
      setCompraError('Debes agregar al menos un producto a la compra.');
      return;
    }

    setCompraError(null);

    createMutation.mutate({
      proveedor_id: selectedProveedorId,
      fecha_compra: fechaCompra,
      referencia: referencia.trim() || null,
      notas: notas.trim() || null,
      items,
    });
  };

  const openReceiveModal = (compra: Compra) => {
    const initialQuantities = Object.fromEntries((compra.detalles || []).map((detalle) => [
      detalle.id,
      Math.max(0, detalle.cantidad_pedida - (detalle.cantidad_recibida || 0)),
    ]));
    setReceiptQuantities(initialQuantities);
    setReceiptError(null);
    setReceivingCompra(compra);
  };

  const submitReceipt = (event: React.FormEvent) => {
    event.preventDefault();
    if (!receivingCompra) return;

    const requestedItems = (receivingCompra.detalles || []).map((detalle) => {
      const cantidadRecibida = Number(receiptQuantities[detalle.id] || 0);
      const pendiente = detalle.cantidad_pedida - (detalle.cantidad_recibida || 0);
      return { detalle, cantidadRecibida, pendiente };
    });

    if (requestedItems.some(({ cantidadRecibida }) => !Number.isFinite(cantidadRecibida) || cantidadRecibida < 0)) {
      setReceiptError('La cantidad recibida debe ser un número igual o mayor que cero.');
      return;
    }
    if (requestedItems.some(({ cantidadRecibida, pendiente }) => cantidadRecibida > pendiente)) {
      setReceiptError('La cantidad recibida no puede superar la cantidad pendiente.');
      return;
    }

    const receiptItems = requestedItems
      .filter(({ cantidadRecibida }) => cantidadRecibida > 0)
      .map(({ detalle, cantidadRecibida }) => ({
        detalle_compra_id: detalle.id,
        cantidad_recibida: cantidadRecibida,
      }));

    if (receiptItems.length === 0) {
      setReceiptError('Ingresa al menos una cantidad válida para recibir.');
      return;
    }
    receiveMutation.mutate({ compraId: receivingCompra.id, items: receiptItems });
  };

  const filteredCompras = useMemo(() => {
    return compras.filter((c) => {
      const matchSearch = (c.proveedor_nombre || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.notas || '').toLowerCase().includes(search.toLowerCase());

      const isRecibida = c.estado === 'recibida';
      const matchEstado = 
        filterEstado === 'all' ? true :
        filterEstado === 'recibida'
          ? isRecibida
          : c.estado === 'registrada' || c.estado === 'recibida_parcial';

      return matchSearch && matchEstado;
    });
  }, [compras, search, filterEstado]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 tracking-wider uppercase">Abastecimiento</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">Compras e Ingreso</h1>
          <p className="text-slate-500 text-sm mt-1">
            Registro de órdenes a proveedores y recepción de inventario físico.
          </p>
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
            <span>Nueva compra</span>
          </button>
        </div>
      </div>

      {/* Info notice about business rules */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800 flex items-start gap-3">
        <Truck className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
        <div>
          <span className="font-bold">Regla de Negocio:</span> Compra ≠ Pago a proveedor. 
          Al registrar una compra queda asentada la adquisición. Al hacer clic en <strong>Recibir mercancía</strong>, 
          las unidades individuales se generan y pasan a estado <code>disponible</code> para su venta.
        </div>
      </div>

      {/* Filters and search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por proveedor o notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={16} className="text-slate-400" />
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value as typeof filterEstado)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-sm px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendientes de recepción</option>
            <option value="recibida">Recibidas en inventario</option>
          </select>
        </div>
      </div>

      {/* Compras List */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
          Cargando compras...
        </div>
      ) : isError ? (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">No se pudieron cargar las compras. Intenta actualizar la página.</p>
        </div>
      ) : filteredCompras.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Truck size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron compras</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            {search || filterEstado !== 'all' 
              ? 'Prueba modificando tus términos de búsqueda o filtros.' 
              : 'Registra una compra para comenzar a abastecer el inventario.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCompras.map((compra) => {
            const isRecibida = compra.estado === 'recibida';
            const isAnulada = compra.estado === 'anulada';
            const isParcial = compra.estado === 'recibida_parcial';
            const fechaStr = compra.fecha_compra;
            const total = (compra.detalles || []).reduce(
              (sum, detalle) => sum + detalle.cantidad_pedida * detalle.costo_unitario,
              0,
            );

            return (
              <div 
                key={compra.id} 
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">{compra.proveedor_nombre}</span>
                    {isRecibida ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 size={12} /> Recibida
                      </span>
                    ) : isParcial ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        <Clock size={12} /> Recepción parcial
                      </span>
                    ) : isAnulada ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        Anulada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Clock size={12} /> Pendiente de recepción
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    {fechaStr && (
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400" />
                        {new Date(fechaStr).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                    <span className="font-semibold text-slate-700">Total: {money(total)}</span>
                    {compra.referencia && <span>Ref.: {compra.referencia}</span>}
                  </div>

                  {compra.notas && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 px-2 py-1 rounded-lg inline-block border border-slate-100">
                      {compra.notas}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  {!isRecibida && !isAnulada && (
                    <button
                      onClick={() => openReceiveModal(compra)}
                      disabled={receiveMutation.isPending}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
                    >
                      <PackageCheck size={15} />
                      <span>{receiveMutation.isPending ? 'Recibiendo...' : 'Recibir mercancía'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Purchase Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Registrar Nueva Compra</h2>
            <p className="text-xs text-slate-500 mb-4">Ingresa la orden con los productos y costos pactados.</p>

            <form onSubmit={handleSubmitCompra} className="space-y-4">
              {(createMutation.isError || compraError) && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
                  {compraError || 'No se pudo registrar la compra. Verifica los datos e inténtalo de nuevo.'}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Proveedor selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Proveedor *</label>
                <select
                  required
                  value={selectedProveedorId}
                  onChange={(e) => setSelectedProveedorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona un proveedor...</option>
                  {activeProveedores.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de compra *</label>
                  <input
                    required
                    type="date"
                    value={fechaCompra}
                    onChange={(e) => setFechaCompra(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Referencia</label>
                <input
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Factura, remisión u otra referencia"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Add line items section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Agregar productos al pedido
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Producto</label>
                    <select
                      value={curProductoId}
                      onChange={(e) => {
                        setCurProductoId(e.target.value);
                        setCurVarianteId('');
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecciona producto...</option>
                      {productos.filter((p) => p.activo).map((p) => (
                        <option key={p.id} value={p.id}>{p.marca} {p.modelo}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sabor / Variante</label>
                    <select
                      value={curVarianteId}
                      onChange={(e) => setCurVarianteId(e.target.value)}
                      disabled={!curProductoId}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="">Selecciona sabor...</option>
                      {availableVariants.map((v) => (
                        <option key={v.id} value={v.id}>{v.sabor}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={curCantidad}
                      onChange={(e) => setCurCantidad(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Ej. 10"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Costo unitario (COP)</label>
                    <input
                      type="number"
                      min="0"
                      value={curCosto}
                      onChange={(e) => setCurCosto(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Ej. 25000"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Notas de la línea</label>
                  <input
                    type="text"
                    value={curNotas}
                    onChange={(e) => setCurNotas(e.target.value)}
                    placeholder="Opcional"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!curProductoId || !curVarianteId || !curCantidad || curCosto === ''}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  + Agregar línea
                </button>
              </div>

              {/* Items List Preview */}
              {items.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Ítem</th>
                        <th className="p-2">Cant.</th>
                        <th className="p-2">Costo unit.</th>
                        <th className="p-2">Subtotal</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it, idx) => {
                        const prod = productos.find((p) => p.id === it.producto_id);
                        const vari = prod?.variantes?.find((v) => v.id === it.variante_id);
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-medium text-slate-800">
                              {prod?.marca} {prod?.modelo} - {vari?.sabor || it.variante_id}
                            </td>
                            <td className="p-2">{it.cantidad_pedida}</td>
                            <td className="p-2">{money(it.costo_unitario)}</td>
                            <td className="p-2 font-semibold text-slate-900">{money(it.cantidad_pedida * it.costo_unitario)}</td>
                            <td className="p-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                      <tr>
                        <td colSpan={3} className="p-2 text-right">Total estimado:</td>
                        <td className="p-2 text-blue-600 text-sm">{money(totalCalculado)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notas u observaciones</label>
                <textarea
                  rows={2}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Número de factura del proveedor, plazo, etc."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Modal footer */}
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
                  disabled={createMutation.isPending || items.length === 0}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Registrando...' : 'Registrar compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase receipt modal */}
      {receivingCompra && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Recibir mercancía</h2>
            <p className="text-xs text-slate-500 mb-4">Registra únicamente las unidades físicas recibidas en esta entrega.</p>
            <form onSubmit={submitReceipt} className="space-y-3">
              {(receiptError || receiveMutation.isError) && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
                  {receiptError || 'No se pudo registrar la recepción. Verifica los datos e inténtalo de nuevo.'}
                </div>
              )}
              {(receivingCompra.detalles || []).map((detalle) => {
                const recibido = detalle.cantidad_recibida || 0;
                const pendiente = Math.max(0, detalle.cantidad_pedida - recibido);
                return (
                  <div key={detalle.id} className="rounded-xl border border-slate-200 p-3 grid grid-cols-[1fr_7rem] gap-3 items-end">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{varianteLabels.get(detalle.variante_id) || `Variante ${detalle.variante_id.slice(0, 8)}…`}</p>
                      <p className="text-xs text-slate-500">Pedida: {detalle.cantidad_pedida} · Recibida: {recibido} · Pendiente: {pendiente}</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Recibir ahora</label>
                      <input
                        type="number"
                        min="0"
                        max={pendiente}
                        disabled={pendiente === 0}
                        value={receiptQuantities[detalle.id] ?? ''}
                        onChange={(e) => {
                          setReceiptError(null);
                          setReceiptQuantities((previous) => ({
                            ...previous,
                            [detalle.id]: e.target.value === '' ? '' : Number(e.target.value),
                          }));
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => { setReceivingCompra(null); setReceiptError(null); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Cancelar</button>
                <button type="submit" disabled={receiveMutation.isPending} className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50">
                  {receiveMutation.isPending ? 'Recibiendo...' : 'Confirmar recepción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
