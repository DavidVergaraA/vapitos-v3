import { Boxes, ShoppingCart, Wallet, ChartNoAxesCombined } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold text-blue-600 tracking-wider uppercase">Operación y control</p>
        <h1 className="text-3xl font-black text-slate-900 mt-1">Resumen general</h1>
        <p className="text-slate-500 mt-2">Estado de la operación y movimientos recientes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Inventario disponible', icon: Boxes, color: 'text-blue-600', bg: 'bg-blue-100' },
          { title: 'Ventas', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { title: 'Saldo de caja', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-100' },
          { title: 'Finanzas', icon: ChartNoAxesCombined, color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon size={20} />
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">...</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Fase 1 completada</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          El esqueleto del sistema está configurado con Tailwind CSS, React Router y TanStack Query.
        </p>
      </div>
    </div>
  );
}
