# Contratos backend utilizados y verificación

Fecha de inspección en vivo: 2026-10-14. Destino confirmado antes de consulta: proyecto de desarrollo `covpkfyhvgbgnftsinek`. Se consultó metadato de esquema y definiciones de funciones; no se leyó información de negocio ni se ejecutaron RPC, DML o DDL. La base antigua de producción no fue consultada.

Los dos documentos `VAPITOS_V3_CONTRATOS_BACKEND_VERIFICADOS.md` y `VAPITOS_V3_CONTRATOS_VENTAS_VERIFICADOS.md` son la fuente local para contratos previamente verificados. Esta nota añade las comprobaciones de metadatos que faltaban y no debe interpretarse como prueba de runtime/RLS.

## Contratos confirmados

| Dominio | Lectura/escritura | Fuente/contrato |
|---|---|---|
| Proveedores | `proveedores` columnas `id,nombre,contacto,notas,activo,creado_at,actualizado_at`; `rpc_guardar_proveedor(p_request_id uuid,p_proveedor_id uuid,p_nombre text,p_contacto text,p_notas text,p_activo boolean) returns jsonb` | Metadatos y cuerpo de función leídos en proyecto dev. Inserta si el ID es null; actualiza y lanza `Proveedor no encontrado` si el ID no coincide. Éxito JSON `{proveedor_id}`. |
| Catálogo | `productos`; variantes en **`variantes_producto`**, columnas `id,producto_id,sabor,atributos,activo,creado_at,actualizado_at` | Metadatos en proyecto dev. No existe relación llamada `public.variantes` en la consulta de columnas observada. |
| Producto | `rpc_guardar_producto(p_request_id uuid,p_producto_id uuid,p_marca text,p_modelo text,p_categoria text,p_puffs integer,p_descripcion text,p_activo boolean) returns jsonb` | Metadatos y función dev. Crea cuando ID null; el error “Producto no encontrado” solo procede de actualización de ID no existente. Respuesta `{producto_id}`. |
| Variante | `rpc_guardar_variante(p_request_id uuid,p_variante_id uuid,p_producto_id uuid,p_sabor text,p_atributos jsonb,p_activo boolean) returns jsonb` | Metadatos y función dev. Respuesta `{variante_id}`. La función valida que el producto exista y esté activo. |
| Vendedor interno | `vendedores_externos(id,nombre,contacto,activo,creado_at,actualizado_at)` y `rpc_guardar_vendedor_externo(p_request_id uuid,p_vendedor_id uuid,p_nombre text,p_contacto text,p_activo boolean) returns jsonb` | Metadatos dev. Nunca fallback de escritura directa a tabla. |
| Compras/recepción | `rpc_registrar_compra`, `rpc_recibir_compra`, `compras`, `detalle_compras`, `lotes_inventario` | Ver firmas y payloads exactos en `VAPITOS_V3_CONTRATOS_BACKEND_VERIFICADOS.md`. |
| Inventario | `vw_inventario_disponible` con `unidad_id,codigo_unidad,producto_id,marca,modelo,puffs,variante_id,sabor,lote_id,recibido_at,costo_origen,costo_actual` | Documento local anterior + columnas del proyecto dev. Fuente de unidades disponibles. |
| Ventas e historial | `rpc_registrar_venta`, `vw_ventas_estado`, `detalle_ventas`, `abonos_ventas` | Ver payloads/columnas exactas en `VAPITOS_V3_CONTRATOS_VENTAS_VERIFICADOS.md`. |
| Abonos | `rpc_registrar_abono(p_request_id uuid,p_venta_id uuid,p_monto numeric,p_metodo_pago text,p_referencia text,p_notas text) returns jsonb` | Documento ventas local y metadatos dev. |
| Comisiones | `vw_comisiones_estado` y `rpc_pagar_comision(p_request_id uuid,p_comision_id uuid,p_monto numeric,p_metodo_pago text,p_notas text) returns jsonb` | La vista deriva estado de recaudo neto, ajustes aprobados y pagos. La RPC impide pagar antes de recaudar completamente la venta y limita el monto al saldo; pagos parciales están permitidos. Finanzas y dashboard ya consumen la vista y muestran saldo calculado. |
| Caja | `movimientos_caja(id,tipo_movimiento,direccion,monto,metodo_pago,fecha_movimiento,motivo,registrado_por,creado_at,referencia_tipo,referencia_id)` | Columnas comprobadas en proyecto dev. La lectura no prueba acceso RLS para la sesión del usuario. |
| Garantías | `garantias(id,venta_origen_id,motivo,estado,resolucion,abierta_at,resuelta_at,registrada_por,notas,creado_at)`; `garantia_unidades(garantia_id,unidad_id,tipo_participacion,destino_final,notas,creado_at)` | Metadatos dev; `rpc_registrar_garantia(p_request_id uuid,p_venta_id uuid,p_unidad_id uuid,p_motivo text,p_notas text) returns jsonb`; `rpc_resolver_garantia(p_request_id uuid,p_garantia_id uuid,p_resolucion text,p_destino_defectuosa text,p_motivo_resolucion text,p_unidad_reemplazo_id uuid) returns jsonb`. |
| Cierres | `cierres_semanales` y `rpc_cerrar_semana(p_request_id uuid,p_fecha_inicio date,p_notas text) returns jsonb` | Metadatos y cuerpo de función dev. `fecha_fin` se calcula como inicio + 6; debe iniciar lunes. La función escribe snapshot/distribuciones: jamás ejecutada durante esta auditoría. |

## Desajustes encontrados

- El servicio de catálogo solicitaba `public.variantes`, que no se encuentra en metadatos de tablas/columnas; el nombre real del proyecto dev es `variantes_producto`.
- El frontend de garantías consultaba columnas que no existen en `garantias`; el vínculo de unidad se encuentra en `garantia_unidades`.
- El frontend de cierres consultaba `cierres` y nombres de columnas no reales, y enviaba `p_fecha_fin`, parámetro que no pertenece a la RPC real.
- El servicio de caja convertía cualquier error de lectura en `[]`, ocultando permisos, red o schema. Se corrigió para propagar error.
- El guardado de vendedor intentaba un `upsert` directo como fallback a un RPC fallido. Se eliminó: la ruta soportada es el RPC.

## No verificado

La inspección de metadatos no prueba grants/RLS para cada sesión, si las variables remotas de GitHub Actions están bien configuradas, el proyecto realmente usado por el sitio publicado, ni el comportamiento de errores del usuario observado. No se ejecutaron escrituras de prueba. Contratos de reembolsos/correcciones/distribuciones, ajustes de caja, configuración de distribución y devoluciones no se deben inferir de nombres de objetos.
