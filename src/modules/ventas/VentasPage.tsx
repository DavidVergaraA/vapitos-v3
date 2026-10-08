import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle, CheckCircle2, CreditCard, Package, Plus,
  RefreshCw, ShoppingCart, Trash2, UserRound,
} from 'lucide-react';
import { money } from '@/lib/supabase';
import {
  fetchInventarioDisponibleVenta,
  fetchVendedoresExternosActivos,
  registrarVenta,
} from './ventasService';
import HistorialVentas from './HistorialVentas';
import type { DestinoUtilidadExterna, ItemVentaInput, MetodoPagoVenta, RegistrarVentaResponse } from '@/types/ventas';

interface LineaCarrito extends ItemVentaInput {
  producto: string;
  sabor: string;
}

const numberOrZero = (value: number | '') => value === '' ? 0 : value;

export default function VentasPage() {
  const queryClient = useQueryClient();
  const [productoId, setProductoId] = useState('');
  const [varianteId, setVarianteId] = useState('');
  const [cantidad, setCantidad] = useState<number | ''>(1);
  const [precioUnitario, setPrecioUnitario] = useState<number | ''>('');
  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [descuento, setDescuento] = useState<number | ''>('');
  const [abonoInicial, setAbonoInicial] = useState<number | ''>('');
  const [metodoPago, setMetodoPago] = useState<MetodoPagoVenta | ''>('');
  const [vendedorExternoId, setVendedorExternoId] = useState('');
  const [destinoUtilidad, setDestinoUtilidad] = useState<DestinoUtilidadExterna | ''>('');
  const [comisionManual, setComisionManual] = useState<number | ''>('');
  const [notas, setNotas] = useState('');
  const [lineError, setLineError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [ventaRegistrada, setVentaRegistrada] = useState<RegistrarVentaResponse | null>(null);

  const {
    data: inventario = [],
    isLoading: inventarioLoading,
    isError: inventarioError,
    refetch: refetchInventario,
    isFetching: inventarioFetching,
  } = useQuery({
    queryKey: ['inventario-disponible-venta'],
    queryFn: fetchInventarioDisponibleVenta,
  });

  const { data: vendedores = [], isError: vendedoresError } = useQuery({
    queryKey: ['vendedores-externos-activos'],
    queryFn: fetchVendedoresExternosActivos,
  });

  const variantesDisponibles = useMemo(() => {
    const agrupadas = new Map<string, {
      variante_id: string;
      producto_id: string;
      producto: string;
      sabor: string;
      disponibles: number;
    }>();

    for (const unidad of inventario) {
      const existente = agrupadas.get(unidad.variante_id);
      agrupadas.set(unidad.variante_id, existente
        ? { ...existente, disponibles: existente.disponibles + 1 }
        : {
          variante_id: unidad.variante_id,
          producto_id: unidad.producto_id,
          producto: `${unidad.marca} ${unidad.modelo}`,
          sabor: unidad.sabor,
          disponibles: 1,
        },
      );
    }

    return [...agrupadas.values()].sort((a, b) =>
      a.producto.localeCompare(b.producto) || a.sabor.localeCompare(b.sabor),
    );
  }, [inventario]);

  const productosDisponibles = useMemo(() => {
    const vistos = new Map<string, string>();
    for (const variante of variantesDisponibles) vistos.set(variante.producto_id, variante.producto);
    return [...vistos.entries()].map(([id, nombre]) => ({ id, nombre }));
  }, [variantesDisponibles]);

  const variantesDelProducto = useMemo(
    () => variantesDisponibles.filter((variante) => variante.producto_id === productoId),
    [variantesDisponibles, productoId],
  );

  const varianteSeleccionada = useMemo(
    () => variantesDisponibles.find((variante) => variante.variante_id === varianteId),
    [variantesDisponibles, varianteId],
  );

  const subtotal = useMemo(
    () => carrito.reduce((total, linea) => total + linea.cantidad * linea.precio_unitario, 0),
    [carrito],
  );
  const descuentoTotal = numberOrZero(descuento);
  const totalFinal = Math.max(0, subtotal - descuentoTotal);
  const abono = numberOrZero(abonoInicial);

  const ventaMutation = useMutation({
    mutationFn: registrarVenta,
    onSuccess: async (respuesta) => {
      setVentaRegistrada(respuesta);
      setConfirmationOpen(false);
      setCarrito([]);
      setDescuento('');
      setAbonoInicial('');
      setMetodoPago('');
      setVendedorExternoId('');
      setDestinoUtilidad('');
      setComisionManual('');
      setNotas('');
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ['ventas-estado'] });
      await queryClient.invalidateQueries({ queryKey: ['inventario-disponible-venta'] });
    },
  });

  const resetSeleccion = () => {
    setProductoId('');
    setVarianteId('');
    setCantidad(1);
    setPrecioUnitario('');
  };

  const agregarLinea = () => {
    const cantidadSolicitada = numberOrZero(cantidad);
    const precio = numberOrZero(precioUnitario);
    if (!varianteSeleccionada || cantidadSolicitada <= 0 || precio < 0) {
      setLineError('Selecciona una variante e indica una cantidad y un precio válidos.');
      return;
    }

    const cantidadEnCarrito = carrito.find((linea) => linea.variante_id === varianteId)?.cantidad || 0;
    if (cantidadSolicitada + cantidadEnCarrito > varianteSeleccionada.disponibles) {
      setLineError(`Solo hay ${varianteSeleccionada.disponibles} unidades disponibles de esta variante.`);
      return;
    }

    setCarrito((actual) => {
      const existente = actual.find((linea) => linea.variante_id === varianteId);
      if (!existente) {
        return [...actual, {
          variante_id: varianteId,
          cantidad: cantidadSolicitada,
          precio_unitario: precio,
          producto: varianteSeleccionada.producto,
          sabor: varianteSeleccionada.sabor,
        }];
      }
      return actual.map((linea) => linea.variante_id === varianteId
        ? { ...linea, cantidad: linea.cantidad + cantidadSolicitada, precio_unitario: precio }
        : linea,
      );
    });
    setLineError(null);
    resetSeleccion();
  };

  const quitarLinea = (variante: string) => {
    setCarrito((actual) => actual.filter((linea) => linea.variante_id !== variante));
  };

  const validarFormulario = () => {
    if (carrito.length === 0) return 'Agrega al menos una línea al carrito.';
    if (descuentoTotal < 0 || descuentoTotal > subtotal) return 'El descuento debe estar entre cero y el subtotal.';
    if (abono < 0 || abono > totalFinal) return 'El abono no puede ser negativo ni superar el total final.';
    if (abono > 0 && !metodoPago) return 'Selecciona el método de pago del abono inicial.';
    if (!vendedorExternoId && (destinoUtilidad || comisionManual !== '')) return 'La comisión y su destino requieren un vendedor externo.';
    if (vendedorExternoId && (!destinoUtilidad || comisionManual === '' || numberOrZero(comisionManual) < 0)) {
      return 'Selecciona el destino e indica una comisión manual válida.';
    }
    return null;
  };

  const abrirConfirmacion = () => {
    const error = validarFormulario();
    setFormError(error);
    if (!error) setConfirmationOpen(true);
  };

  const confirmarVenta = () => {
    const error = validarFormulario();
    setFormError(error);
    if (error) return;

    ventaMutation.mutate({
      items: carrito.map(({ variante_id, cantidad: cantidadLinea, precio_unitario }) => ({
        variante_id,
        cantidad: cantidadLinea,
        precio_unitario,
      })),
      descuento_total: descuentoTotal,
      pago_inicial: abono,
      metodo_pago: abono > 0 ? metodoPago || null : null,
      vendedor_externo_id: vendedorExternoId || null,
      destino_utilidad_externa: vendedorExternoId ? destinoUtilidad || null : null,
      comision_manual: vendedorExternoId ? numberOrZero(comisionManual) : null,
      notas: notas.trim() || null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 tracking-wider uppercase">Punto de venta</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">Nueva venta</h1>
          <p className="text-slate-500 text-sm mt-1">Selecciona variantes disponibles; el backend asignará las unidades físicas.</p>
        </div>
        <button onClick={() => refetchInventario()} disabled={inventarioFetching} className="self-start sm:self-auto p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm" title="Actualizar inventario disponible">
          <RefreshCw size={18} className={inventarioFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {ventaRegistrada && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-emerald-800">
          <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm"><p className="font-bold">Venta registrada correctamente.</p><p className="mt-1">Total: {money(ventaRegistrada.total_final)} · {ventaRegistrada.lineas} línea(s).</p></div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_24rem] gap-6 items-start">
        <section className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4"><Package size={18} className="text-blue-600" /><h2 className="font-bold text-slate-900">Inventario disponible</h2></div>
            {inventarioLoading ? (
              <div className="py-8 text-center text-sm text-slate-500"><RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />Cargando inventario...</div>
            ) : inventarioError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex gap-3 text-sm"><AlertCircle size={18} className="flex-shrink-0" />No se pudo cargar el inventario disponible. Intenta actualizar la página.</div>
            ) : variantesDisponibles.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">No hay unidades disponibles para vender.</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-slate-700 mb-1">Producto</label><select value={productoId} onChange={(event) => { setProductoId(event.target.value); setVarianteId(''); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Selecciona un producto...</option>{productosDisponibles.map((producto) => <option key={producto.id} value={producto.id}>{producto.nombre}</option>)}</select></div>
                  <div><label className="block text-xs font-semibold text-slate-700 mb-1">Sabor / variante</label><select value={varianteId} disabled={!productoId} onChange={(event) => setVarianteId(event.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"><option value="">Selecciona una variante...</option>{variantesDelProducto.map((variante) => <option key={variante.variante_id} value={variante.variante_id}>{variante.sabor} · {variante.disponibles} disponibles</option>)}</select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad</label><input type="number" min="1" max={varianteSeleccionada?.disponibles} value={cantidad} onChange={(event) => setCantidad(event.target.value === '' ? '' : Number(event.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-xs font-semibold text-slate-700 mb-1">Precio unitario (COP)</label><input type="number" min="0" value={precioUnitario} onChange={(event) => setPrecioUnitario(event.target.value === '' ? '' : Number(event.target.value))} placeholder="Ej. 30000" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                {varianteSeleccionada && <p className="text-xs text-slate-500">Disponibles: <strong>{varianteSeleccionada.disponibles}</strong> unidades de {varianteSeleccionada.producto} · {varianteSeleccionada.sabor}.</p>}
                {lineError && <p className="text-sm text-red-600">{lineError}</p>}
                <button type="button" onClick={agregarLinea} disabled={!varianteSeleccionada} className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"><Plus size={17} />Agregar al carrito</button>
              </div>
            )}
          </div>

          {!inventarioLoading && !inventarioError && variantesDisponibles.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-bold text-slate-900">Variantes disponibles</h2></div>
              <div className="divide-y divide-slate-100">{variantesDisponibles.map((variante) => <div key={variante.variante_id} className="px-5 py-3 flex items-center justify-between gap-3 text-sm"><div><p className="font-semibold text-slate-800">{variante.producto}</p><p className="text-xs text-slate-500">{variante.sabor}</p></div><span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-1">{variante.disponibles} disponibles</span></div>)}</div>
            </div>
          )}
        </section>

        <aside className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm xl:sticky xl:top-6 space-y-5">
          <div className="flex items-center gap-2"><ShoppingCart size={18} className="text-blue-600" /><h2 className="font-bold text-slate-900">Carrito</h2></div>
          {carrito.length === 0 ? <p className="text-sm text-slate-500 py-4 text-center">Tu carrito está vacío.</p> : <div className="space-y-3">{carrito.map((linea) => <div key={linea.variante_id} className="border-b border-slate-100 pb-3 last:border-0"><div className="flex justify-between gap-3"><div><p className="text-sm font-semibold text-slate-800">{linea.producto}</p><p className="text-xs text-slate-500">{linea.sabor} · {linea.cantidad} × {money(linea.precio_unitario)}</p></div><button type="button" onClick={() => quitarLinea(linea.variante_id)} className="text-red-500 hover:text-red-700 p-1" aria-label="Quitar línea"><Trash2 size={16} /></button></div><p className="text-sm font-bold text-slate-800 mt-1">{money(linea.cantidad * linea.precio_unitario)}</p></div>)}</div>}

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div><label className="block text-xs font-semibold text-slate-700 mb-1">Descuento total</label><input type="number" min="0" max={subtotal} value={descuento} onChange={(event) => setDescuento(event.target.value === '' ? '' : Number(event.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div className="rounded-xl bg-slate-50 p-3 space-y-1 text-sm"><div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="flex justify-between text-slate-600"><span>Descuento</span><span>- {money(descuentoTotal)}</span></div><div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-200"><span>Total final</span><span>{money(totalFinal)}</span></div></div>
            <div><label className="block text-xs font-semibold text-slate-700 mb-1">Abono inicial opcional</label><input type="number" min="0" max={totalFinal} value={abonoInicial} onChange={(event) => { const next = event.target.value === '' ? '' : Number(event.target.value); setAbonoInicial(next); if (next === '' || next === 0) setMetodoPago(''); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            {abono > 0 && <div><label className="block text-xs font-semibold text-slate-700 mb-1">Método de pago *</label><select value={metodoPago} onChange={(event) => setMetodoPago(event.target.value as MetodoPagoVenta)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Selecciona...</option><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option></select></div>}
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100"><div className="flex items-center gap-2"><UserRound size={16} className="text-slate-500" /><h3 className="text-sm font-bold text-slate-800">Vendedor externo (opcional)</h3></div><select value={vendedorExternoId} onChange={(event) => { setVendedorExternoId(event.target.value); setDestinoUtilidad(''); setComisionManual(''); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Sin vendedor externo</option>{vendedores.map((vendedor) => <option key={vendedor.id} value={vendedor.id}>{vendedor.nombre}</option>)}</select>{vendedoresError && <p className="text-xs text-amber-700">No se pudieron cargar los vendedores externos. Puedes continuar sin seleccionar uno.</p>}{vendedorExternoId && <><div><label className="block text-xs font-semibold text-slate-700 mb-1">Destino de utilidad *</label><select value={destinoUtilidad} onChange={(event) => setDestinoUtilidad(event.target.value as DestinoUtilidadExterna)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Selecciona...</option><option value="reinversion">Reinversión</option><option value="resultado_distribuible">Resultado distribuible</option></select></div><div><label className="block text-xs font-semibold text-slate-700 mb-1">Comisión manual (COP) *</label><input type="number" min="0" value={comisionManual} onChange={(event) => setComisionManual(event.target.value === '' ? '' : Number(event.target.value))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div></>}</div>

          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Notas</label><textarea rows={2} value={notas} onChange={(event) => setNotas(event.target.value)} placeholder="Opcional" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          {formError && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">{formError}</div>}
          {ventaMutation.isError && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">No se pudo registrar la venta. Verifica los datos e inténtalo de nuevo.</div>}
          <button type="button" onClick={abrirConfirmacion} disabled={carrito.length === 0 || ventaMutation.isPending} className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"><CreditCard size={17} />Registrar venta</button>
        </aside>
      </div>

      {confirmationOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"><div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200"><h2 className="text-xl font-bold text-slate-900">Confirmar venta</h2><p className="text-sm text-slate-500 mt-2">Se registrarán {carrito.reduce((total, linea) => total + linea.cantidad, 0)} unidad(es) por un total de <strong className="text-slate-800">{money(totalFinal)}</strong>.</p>{abono > 0 && <p className="text-sm text-slate-500 mt-2">Abono inicial: {money(abono)} por {metodoPago}.</p>}<div className="flex justify-end gap-2 mt-6"><button type="button" onClick={() => setConfirmationOpen(false)} disabled={ventaMutation.isPending} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancelar</button><button type="button" onClick={confirmarVenta} disabled={ventaMutation.isPending} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50">{ventaMutation.isPending ? 'Registrando...' : 'Confirmar y registrar'}</button></div></div></div>}
      <HistorialVentas />
    </div>
  );
}
