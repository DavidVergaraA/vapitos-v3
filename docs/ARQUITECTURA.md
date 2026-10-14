# Arquitectura actual

## Componentes y flujo

- `src/main.tsx` monta React, el proveedor de sesión, React Query y el router.
- `src/app/router.tsx` define rutas de login y áreas protegidas bajo `basename: /vapitos-v3`.
- `src/shared/Layout.tsx` aporta navegación y marco común.
- `src/modules/<modulo>` concentra páginas, servicios y contexto de cada dominio.
- `src/types` contiene payloads y modelos compartidos del frontend.
- `src/lib/supabase.ts` inicializa Supabase, expone configuración validada, idempotency request IDs, formato monetario y wrapper RPC.

La UI usa React Query. Cada mutación debe invalidar las claves de datos que modifica; las lecturas fallidas deben permanecer como errores, nunca transformarse en listas vacías. Las mutaciones de compras, recepción, ventas, abonos y comisiones se delegan a RPC transaccionales. No realizar escrituras financieras o de inventario desde componentes.

## Sesión y seguridad

`AuthProvider` sincroniza `getSession` con `onAuthStateChange`; las rutas privadas se envuelven con `ProtectedRoute`. La revisión detectó que el estado de carga no maneja el rechazo de `getSession` y que `signOut` ignora errores; ver el backlog. En el cliente Supabase, la URL se valida contra el proyecto dev autorizado y la configuración incorrecta apunta a un dominio `.invalid`, nunca a otro proyecto real.

La clave incluida en Vite al compilar es pública y se entrega al navegador; solo debe ser anon/publishable. Nunca incluir `service_role`/secret. RLS es parte indispensable del control de acceso.

## PWA y despliegue

Vite usa `vite-plugin-pwa` con `registerType: autoUpdate`, `base: /vapitos-v3/` y GitHub Actions Pages. El router usa el mismo prefijo. Se añadió un icono SVG local al manifest y al favicon porque los recursos PNG/ICO configurados antes no existían. Una app ya desplegada puede retener un bundle/service worker anterior hasta completar actualización del navegador. El estado publicado no se verificó.

## Límites de la arquitectura

No hay backend Node separado. El frontend habla con Supabase Auth y PostgREST/RPC. La información sensible transaccional, la selección de unidades físicas y los efectos financieros pertenecen al backend. La aplicación no debe intentar recrear la lógica del cierre o de garantías en React.
