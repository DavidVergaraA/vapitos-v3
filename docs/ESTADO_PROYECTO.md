# Estado actual del proyecto

Actualizado: 2026-10-14. Alcance de verificación: código local y metadatos de solo lectura del proyecto Supabase dev `covpkfyhvgbgnftsinek`.

## Resumen

El repositorio contiene una SPA React + TypeScript + Vite con autenticación Supabase y módulos de catálogo, proveedores, compras/recepción, inventario, ventas/historial/abonos, caja/comisiones, garantías, cierres y dashboard. La presencia de pantallas no significa que todos los flujos se hayan probado en ejecución.

## Corregido durante esta auditoría

- Catálogo consulta `variantes_producto`, nombre real observado en desarrollo.
- Guardado de vendedores no hace escritura directa de fallback.
- Errores de caja ya no se convierten en lista vacía.
- Lectura de cierres se alinea con `cierres_semanales`, columnas reales y firma real de `rpc_cerrar_semana`.
- Lectura de garantías une `garantias` con `garantia_unidades` y sus columnas reales.
- Cliente Supabase falla cerrado si falta configuración o si la URL no coincide con el proyecto dev autorizado.
- Eliminada la vista previa ficticia de distribución 40/30/30 en React; la distribución la calcula la RPC con configuración vigente.
- README sustituido por guía actual de instalación/seguridad/despliegue.

## Matriz por módulo

| Módulo | Estado local | Qué falta validar |
|---|---|---|
| Auth/rutas | Mejorado: recupera fallos de sesión/login/signOut sin spinner infinito | Runtime y RLS con sesión real. |
| Catálogo | Corregido nombre de tabla/RPCs existentes | Runtime de consulta y alta; reproducir mensaje de producto reportado. |
| Proveedores | RPC y payload de creación local coinciden con función observada | Reproducir mensaje: el código actual envía null en modo nuevo; fallo no explicado en esta versión. |
| Compras/recepción | Implementación con contratos locales de RPC | Flujo completo autorizado en datos de prueba. |
| Inventario | Consume `vw_inventario_disponible` | Verificar lectura tras una recepción real de desarrollo. |
| Ventas/abonos | Usa RPC/vistas documentadas | Venta, abono y restricciones financieras en sesión autorizada. |
| Caja/comisiones | Movimientos propagan errores; estado/saldo usan `vw_comisiones_estado`; pago va por RPC | RLS y flujo de pago parcial en sesión de prueba. |
| Garantías | Lectura alineada con tablas y vínculo actuales | RLS y flujo de registro/resolución; no se ejecutó mutación. |
| Cierres | Lectura/firma corregidas; preview ficticio quitado | Verificar configuración y cálculos solo con revisión, no cerrar semanas reales. |
| Dashboard | Presenta métricas derivadas en cliente | Filtros temporales, estados de error, labels y consistencia de KPIs. |
| Infra/PWA | Ruta base coincide; env cerrada a URL de otro proyecto; icono y manifest generados | Build pasó con permiso ampliado; verificar artefacto/SW publicado. |

## Errores conocidos y clasificación

- `public.variantes`: causa demostrada del error de schema cache en la versión local; el frontend consultaba un nombre ausente y el proyecto dev tiene `variantes_producto`.
- “Proveedor no encontrado” / “Producto no encontrado”: no se demuestra como fallo de creación con el código actual. Las RPC observadas crean con ID null; solo lanzan esos mensajes cuando reciben un ID no existente al editar. La interfaz limpia el ID para “Nuevo”. Proyecto, build publicado, selección de edición o respuesta observada quedan por determinar.
- Build final: pasó al ejecutar con permiso ampliado luego de que el sandbox devolviera `EPERM` al resolver `index.html`; se generaron `dist/sw.js` y Workbox. Vite mostró el aviso no bloqueante de bundle JS de 697.28 kB (>500 kB).
- No hay tests ni lint configurados en `package.json`; no existe script `test`.

## Seguridad y operación

No se modificó Supabase, SQL, migraciones, RLS, datos ni configuración remota. No hubo consultas a la base antigua de producción. No se desplegó ni se hizo commit/push. `.env.local` está ignorado; su contenido no se inspeccionó ni se mostró.
