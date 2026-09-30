# Checklist de implementación

Incluye login Supabase, navegación, lectura de vistas/tablas, alta de productos/variantes, proveedores, vendedores externos, ajustes de caja y solicitud de cierre semanal mediante RPC.

## Antes de usar operaciones reales
- Confirmar el formato de los elementos JSON `p_items` de `rpc_registrar_venta` y `rpc_registrar_compra` según las funciones privadas actuales.
- Implementar recepción de compras y formularios completos de abonos, reembolsos, garantías, pagos de comisión y distribuciones.
- Probar RLS y RPC con ambos socios y datos controlados.
- Ejecutar `npm install`, `npm run typecheck`, `npm run build` en local.

No se ha modificado Supabase. No se incluye `service_role` ni otra clave secreta.
