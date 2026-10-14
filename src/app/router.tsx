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
import GarantiasPage from '@/modules/garantias/GarantiasPage';
import CierresPage from '@/modules/cierres/CierresPage';
import VendedoresPage from '@/modules/vendedores/VendedoresPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading, authError } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Cargando sesión...</div>;
  if (authError) return <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4"><div role="alert" className="max-w-lg rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">No se pudo verificar la sesión: {authError}. Comprueba la conexión y vuelve a cargar.</div></div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading, authError } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Cargando sesión...</div>;
  if (authError) return <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4"><div role="alert" className="max-w-lg rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">No se pudo verificar la sesión: {authError}. Comprueba la conexión y vuelve a cargar.</div></div>;
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
      { path: 'vendedores', element: <VendedoresPage /> },
      { path: 'garantias', element: <GarantiasPage /> },
      { path: 'caja', element: <FinanzasPage /> },
      { path: 'finanzas', element: <FinanzasPage /> },
      { path: 'cierres', element: <CierresPage /> },
    ],
  },
], {
  basename: '/vapitos-v3'
});

export function AppRouter() {
  return <RouterProvider router={router} />;
}
