import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/modules/auth/AuthContext';
import { 
  Boxes, LayoutDashboard, ShoppingCart, Truck, 
  Package, Store, Users, ShieldCheck, Wallet, 
  ChartNoAxesCombined, CalendarCheck, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Resumen', to: '/', icon: LayoutDashboard },
  { name: 'Ventas', to: '/ventas', icon: ShoppingCart },
  { name: 'Inventario', to: '/inventario', icon: Boxes },
  { name: 'Compras', to: '/compras', icon: Truck },
  { name: 'Catálogo', to: '/catalogo', icon: Package },
  { name: 'Proveedores', to: '/proveedores', icon: Store },
  { name: 'Vendedores externos', to: '/vendedores', icon: Users },
  { name: 'Garantías', to: '/garantias', icon: ShieldCheck },
  { name: 'Caja', to: '/caja', icon: Wallet },
  { name: 'Finanzas', to: '/finanzas', icon: ChartNoAxesCombined },
  { name: 'Cierre semanal', to: '/cierres', icon: CalendarCheck },
];

export default function Layout() {
  const { signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2 text-blue-600 font-bold">
          <Boxes size={24} />
          <span className="text-slate-800">Vapitos <i className="text-blue-600">V3</i></span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -mr-2 text-slate-500">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-slate-200 w-64 flex-shrink-0 flex-col h-screen sticky top-0 transition-transform md:translate-x-0 z-10",
        mobileMenuOpen ? "fixed inset-y-0 left-0 translate-x-0 shadow-2xl" : "fixed -translate-x-full md:relative md:flex"
      )}>
        <div className="p-6 hidden md:flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Boxes size={24} />
          </div>
          <div>
            <div className="font-black text-slate-800 leading-none">vapitos <i className="text-blue-600">v3</i></div>
            <div className="text-[10px] font-bold text-slate-400 tracking-wider mt-1">CONTROL DEL NEGOCIO</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
        <footer className="bg-white border-t border-slate-200 p-4 text-center text-xs text-slate-400">
          Vapitos V3 · Datos protegidos por Supabase RLS
        </footer>
      </main>
      
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-0 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
