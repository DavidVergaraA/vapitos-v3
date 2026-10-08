import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/AuthContext';
import Layout from '@/shared/Layout';
import Dashboard from '@/modules/dashboard/Dashboard';
import Login from '@/modules/auth/Login';
import CatalogoPage from '@/modules/catalogo/CatalogoPage';
import ProveedoresPage from '@/modules/proveedores/ProveedoresPage';
import ComprasPage from '@/modules/compras/ComprasPage';
import InventarioPage from '@/modules/inventario/InventarioPage';
import VentasPage from '@/modules/ventas/VentasPage';
import FinanzasPage from '@/modules/finanzas/FinanzasPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Cargando sesión...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Cargando sesión...</div>;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'catalogo', element: <CatalogoPage /> },
      { path: 'proveedores', element: <ProveedoresPage /> },
      { path: 'ventas', element: <VentasPage /> },
      { path: 'inventario', element: <InventarioPage /> },
      { path: 'compras', element: <ComprasPage /> },
      { path: 'vendedores', element: <div className="p-4">Vendedores externos (Próximamente)</div> },
      { path: 'garantias', element: <div className="p-4">Garantías (Próximamente)</div> },
      { path: 'caja', element: <div className="p-4">Caja (Próximamente)</div> },
      { path: 'finanzas', element: <FinanzasPage /> },
      { path: 'cierres', element: <div className="p-4">Cierre semanal (Próximamente)</div> },
    ],
  },
], {
  basename: '/vapitos-v3'
});

export function AppRouter() {
  return <RouterProvider router={router} />;
}
