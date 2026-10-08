# VAPITOS V3 — BACKEND CONTEXT

## Propósito

Este documento es el contrato de integración para un agente que construye el frontend de Vapitos V3 sin acceso directo a Supabase.

**Regla absoluta:** si una tabla, columna, relación, RPC, parámetro o comportamiento no está documentado o respaldado por las migraciones del repositorio, NO debe inventarse.

El frontend se adapta al backend real.

## Backend

- Plataforma: Supabase
- Base de datos: PostgreSQL
- Auth: Supabase Auth
- Seguridad: RLS + grants + RPC
- Proyecto de desarrollo: `covpkfyhvgbgnftsinek`
- Arquitectura: React → Supabase Auth → PostgreSQL/RPC/RLS
- No existe backend Node/Express/Nest separado en el MVP.

Nunca exponer service role keys en el navegador.

## Acceso

Hay dos socios internos: `socio_1` y `socio_2`, con permisos equivalentes.

Los vendedores externos son registros internos y NO tienen login, dashboard ni acceso al sistema.

Las ventas son anónimas para el comprador final.

## Migraciones V3 conocidas

1. 0001_vapitos_v3_foundation
2. 0002_harden_set_updated_at
3. 0003_integrity_security_read_models
4. 0004_transactional_business_rpcs
5. 0005_catalog_and_weekly_closure
6. 0006_warranty_and_returns
7. 0007_physical_return_workflow_v2
8. 0008_financial_views_and_commission_adjustments
9. 0009_closure_adjustments_and_debts
10. 0010_restrict_platform_rls_helper_rpc
11. 0011_move_privileged_rpcs_to_private_schema
12. 0012_grant_invoker_rpc_wrappers
13. 0013_index_foreign_keys
14. 0014_sale_price_corrections
15. 0015_payment_corrections_and_cash_adjustments
16. 0016_pause_weekly_close_pending_financial_rule
17. 0017_enable_weekly_close_confirmed_formula
18. 0018_canonical_business_cleanup
19. 0019_remove_legacy_recovery_references
20. 0020_harden_warranty_impact_view
21. 0021_link_return_inventory_movements

**0022 NO fue aplicada.** Fue preparada como corrección para dos puntos: costos de cierre y pérdida de garantías con destino `conservar`.

## RPC conocidas

### Catálogo
- `rpc_guardar_producto`
- `rpc_guardar_variante`
- `rpc_guardar_proveedor`
- `rpc_guardar_vendedor_externo`

### Compras/inventario
- `rpc_registrar_compra`
- `rpc_recibir_compra`

### Ventas/cartera
- `rpc_registrar_venta`
- `rpc_registrar_abono`
- `rpc_corregir_abono`
- `rpc_corregir_venta`
- `rpc_ejecutar_reembolso`

### Caja
- `rpc_ajuste_caja`

### Comisiones
- `rpc_pagar_comision`
- `rpc_solicitar_ajuste_comision`
- `rpc_resolver_ajuste_comision`

### Garantías/devoluciones
- `rpc_registrar_garantia`
- `rpc_resolver_garantia`
- `rpc_registrar_devolucion_fisica_v2`

### Distribuciones
- `rpc_pagar_distribucion`
- `rpc_guardar_configuracion_distribucion`

### Cierres
- `rpc_cerrar_semana`
- `rpc_registrar_ajuste_cierre`
- `rpc_guardar_checklist_capital`

**No inventar firmas de estas RPC.** Si el repositorio contiene las firmas SQL, usarlas como fuente exacta.

## Lecturas vs escrituras

Las lecturas pueden usar vistas/tablas autorizadas por RLS.

Las operaciones sensibles deben utilizar las RPC correspondientes.

No hacer desde React una cadena de INSERT/UPDATE para reemplazar una operación transaccional.

## Idempotencia

Las operaciones críticas utilizan idempotencia. Respetar el request ID cuando la RPC lo requiera.

No reintentar ciegamente una operación crítica con un nuevo request ID si el resultado anterior es desconocido.

## Entidades de negocio conocidas

El backend contiene entidades relacionadas con:

- productos
- variantes
- proveedores
- compras
- detalle de compras
- inventario
- unidades físicas
- ventas
- detalle de ventas
- asignaciones de unidades a ventas
- abonos
- reembolsos
- movimientos de caja
- vendedores externos
- comisiones
- ajustes de comisiones
- garantías
- unidades de garantía
- impactos de garantía
- devoluciones físicas
- socios
- cierres
- ajustes de cierre
- distribuciones
- configuración de distribución
- checklist de capital
- autenticación/perfiles

**No inventar columnas exactas.** Para nombres/tipos/FK exactos, consultar las migraciones del repositorio o generar tipos desde Supabase cuando sea posible.

## Inventario

Estados válidos:

- `disponible`
- `vendida`
- `en_garantia`
- `no_recuperable`
- `salida_garantia`
- `retirada`

No utilizar `recuperable` ni `revender`.

## Ventas

Una venta puede contener múltiples productos y cantidades. Las unidades físicas son trazables y se asignan individualmente.

La venta tiene conceptualmente subtotal, descuento y total final, además de fecha, estado, vendedor externo opcional, notas y auditoría.

No existe cliente final como entidad de negocio.

## Pagos

Métodos MVP:

- efectivo
- transferencia

Una venta puede tener múltiples abonos.

No se permiten sobrepagos ni crédito normal.

Las correcciones conservan el original y registran el ajuste.

## Devoluciones físicas

RPC: `rpc_registrar_devolucion_fisica_v2`

Estados:

- `recibida`
- `no_requerida`
- `cancelada`

Destinos permitidos:

- `disponible`
- `retirada`
- `no_recuperable`

Una devolución recibida valida la asignación activa de esa unidad a esa venta, registra la devolución, libera la asignación, cambia el estado y registra el movimiento de inventario vinculado.

Una devolución física no significa automáticamente reembolso financiero.

## Garantías

Resoluciones:

- `reemplazo`
- `reembolso`
- `sin_cobertura`
- `reparacion`
- `otra`

Destino de unidad defectuosa:

- `desechar`
- `conservar`
- `entregada`

Impactos económicos:

- `costo_reemplazo`
- `perdida_no_recuperable`

Regla:
- `desechar` → pérdida por costo.
- `entregada` → pérdida por costo.
- `conservar` → NO pérdida automática.

No existe recuperación económica formal de una unidad defectuosa.

## Reemplazos

La unidad de reemplazo debe existir, estar disponible y corresponder a la variante. Pasa a `salida_garantia` y se reconoce su costo.

## Vendedores y comisiones

Los vendedores externos no tienen acceso.

La comisión:
- se introduce manualmente;
- es fija para toda la venta;
- no es por unidad;
- se define sobre la venta final después del descuento;
- solo es liquidable cuando la venta está completamente pagada.

## Compras

Una compra registra adquisición/recepción de inventario.

Compra != pago a proveedor.

El MVP no implementa pagos parciales a proveedores.

## Cierres

Periodo: lunes a domingo.

Se separan:
- ventas
- recaudo
- reembolsos
- cartera
- costos
- comisiones
- impacto de garantías
- resultado
- distribuible
- distribución

No convertir silenciosamente el cierre en una contabilidad basada exclusivamente en caja.

Cuando una asignación de unidad fue liberada por devolución, el costo del cierre debe respetar esa semántica; el campo `liberada_at` es relevante para distinguir asignaciones activas.

## Distribución

Configuración inicial:
- 40% reinversión
- 30% socio 1
- 30% socio 2

Es configurable por periodos de vigencia.

Los cierres históricos conservan snapshot de los porcentajes.

## Auditoría

No borrar silenciosamente ventas, pagos, comisiones, cierres o movimientos financieros.

Las correcciones son compensatorias/auditadas y deben conservar original, ajuste, usuario y fecha.

## Tipos

Preferir tipos generados desde Supabase:

PostgreSQL → Supabase generated types → TypeScript → UI

UUID siempre es `string`.

## Información no disponible

Este documento no es un volcado exhaustivo del catálogo PostgreSQL. La ausencia de una columna aquí NO significa que no exista.

Nunca inventar la estructura faltante.
