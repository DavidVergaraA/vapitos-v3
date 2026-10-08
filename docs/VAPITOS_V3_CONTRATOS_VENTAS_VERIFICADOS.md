# VAPITOS V3 — CONTRATOS DE VENTAS VERIFICADOS

Fuente de verdad: Supabase de DESARROLLO `covpkfyhvgbgnftsinek`.

Este documento fue construido a partir de consultas de solo lectura al esquema real.
NO modificar Supabase, migraciones, RPCs, tablas ni RLS desde el frontend.

## 1. RPC PRINCIPAL: registrar venta

RPC pública disponible:

`rpc_registrar_venta(
  p_request_id uuid,
  p_items jsonb,
  p_descuento_total numeric DEFAULT 0,
  p_pago_inicial numeric DEFAULT 0,
  p_metodo_pago text DEFAULT NULL,
  p_vendedor_externo_id uuid DEFAULT NULL,
  p_destino_utilidad_externa text DEFAULT NULL,
  p_comision_manual numeric DEFAULT NULL,
  p_notas text DEFAULT NULL
) RETURNS jsonb`

El frontend debe llamar a la RPC pública con esos nombres exactos.

### p_items

Debe ser un array no vacío.

Cada elemento:

```ts
{
  variante_id: string,
  cantidad: number,
  precio_unitario: number
}
```

No repetir la misma `variante_id`; consolidar cantidad/precio por variante.

### Reglas verificadas

- `cantidad > 0`
- `precio_unitario >= 0`
- `descuento_total >= 0`
- `descuento_total <= subtotal`
- `pago_inicial >= 0`
- `pago_inicial <= total_final`
- si `pago_inicial > 0`, `p_metodo_pago` es obligatorio
- métodos de pago válidos: `efectivo`, `transferencia`
- si no hay vendedor externo, no enviar destino/comisión
- si hay vendedor externo:
  - vendedor debe estar activo
  - `p_destino_utilidad_externa` debe ser `reinversion` o `resultado_distribuible`
  - `p_comision_manual` es obligatorio y >= 0

### Respuesta

La RPC devuelve JSONB con:

```ts
{
  venta_id: string,
  subtotal: number,
  descuento_total: number,
  total_final: number,
  abono_inicial: number,
  comision_id: string | null,
  lineas: number
}
```

## 2. QUÉ HACE EL BACKEND AL REGISTRAR UNA VENTA

El frontend NO debe hacer INSERT/UPDATE directo sobre inventario.

La RPC:

1. crea `ventas`;
2. crea `detalle_ventas`;
3. busca unidades físicas disponibles para la variante;
4. asigna las unidades a `asignaciones_unidad_venta`;
5. cambia las unidades de `disponible` a `vendida`;
6. crea `movimientos_inventario`;
7. registra el abono inicial si existe;
8. crea la comisión si hay vendedor externo.

La selección física de unidades se realiza por backend usando unidades disponibles, ordenadas por recepción/lote.

## 3. TABLA ventas

Columnas verificadas:

- `id uuid`
- `fecha_venta timestamptz`
- `tipo_venta text`
- `vendedor_externo_id uuid nullable`
- `destino_utilidad_externa text nullable`
- `subtotal numeric`
- `descuento_total numeric`
- `total_final numeric nullable`
- `estado text`
- `garantia_origen_id uuid nullable`
- `creada_por uuid nullable`
- `notas text nullable`
- `creado_at timestamptz`
- `actualizado_at timestamptz`

El frontend no debe insertar directamente en esta tabla para registrar una venta.

## 4. TABLA detalle_ventas

Columnas verificadas:

- `id uuid`
- `venta_id uuid`
- `variante_id uuid`
- `cantidad integer`
- `precio_unitario numeric`
- `subtotal_linea numeric nullable`
- `marca_snapshot text`
- `modelo_snapshot text`
- `sabor_snapshot text`
- `puffs_snapshot integer nullable`
- `creado_at timestamptz`

## 5. ASIGNACIÓN DE UNIDADES

Tabla real:

`asignaciones_unidad_venta`

Columnas:

- `id uuid`
- `detalle_venta_id uuid`
- `unidad_id uuid`
- `costo_unidad_snapshot numeric`
- `asignada_at timestamptz`
- `liberada_at timestamptz nullable`
- `motivo_liberacion text nullable`
- `asignada_por uuid nullable`

El frontend NO debe crear estas asignaciones directamente durante una venta normal.

## 6. COMISIONES

Tabla real:

`comisiones`

Columnas verificadas:

- `id uuid`
- `venta_id uuid`
- `vendedor_externo_id uuid`
- `monto_manual numeric`
- `liquidable_at timestamptz nullable`
- `estado text`
- `notas text nullable`
- `creado_por uuid nullable`
- `creado_at timestamptz`

La comisión es un monto manual para toda la venta.

Estados relevantes según el flujo verificado:

- `pendiente_pago_venta`
- `liquidable`
- `pagada`

La comisión se vuelve liquidable cuando la venta queda totalmente recaudada.

## 7. ABONOS DE VENTA

Tabla real:

`abonos_ventas`

Columnas:

- `id uuid`
- `venta_id uuid`
- `monto numeric`
- `metodo_pago text`
- `estado text`
- `fecha_abono timestamptz`
- `referencia text nullable`
- `notas text nullable`
- `movimiento_caja_id uuid`
- `registrado_por uuid nullable`
- `creado_at timestamptz`

## 8. RPC DE ABONOS

RPC pública:

`rpc_registrar_abono(
  p_request_id uuid,
  p_venta_id uuid,
  p_monto numeric,
  p_metodo_pago text,
  p_referencia text DEFAULT NULL,
  p_notas text DEFAULT NULL
) RETURNS jsonb`

Reglas verificadas:

- monto > 0
- método: `efectivo` o `transferencia`
- no permite superar el saldo pendiente
- descuenta reembolsos ejecutados al calcular recaudo neto
- cuando la venta queda totalmente recaudada, una comisión `pendiente_pago_venta` pasa a `liquidable`

Respuesta:

```ts
{
  abono_id: string,
  venta_id: string,
  monto: number
}
```

## 9. VISTA DE ESTADO DE VENTAS

Vista:

`vw_ventas_estado`

Columnas verificadas:

- `venta_id`
- `fecha_venta`
- `tipo_venta`
- `vendedor_externo_id`
- `destino_utilidad_externa`
- `subtotal`
- `descuento_total`
- `total_final`
- `recaudo_bruto`
- `reembolso_total`
- `saldo_pendiente`
- `exceso_recaudo_neto`
- `cantidad_abonos`
- `unidades_asignadas`
- `estado`
- `recaudo_neto`

Esta vista es apropiada para consultar el estado financiero/resumen de una venta.

## 10. CORRECCIONES DE VENTA

Existe:

`rpc_corregir_venta(
  p_request_id uuid,
  p_venta_id uuid,
  p_cambios_lineas jsonb,
  p_descuento_total numeric,
  p_resolucion_exceso_recaudo text,
  p_motivo text
) RETURNS jsonb`

No implementar este flujo en la primera tarea de Ventas. Debe quedar para una etapa posterior de correcciones/auditoría.

## 11. PAGOS DE COMISIÓN

Existe:

`rpc_pagar_comision(
  p_request_id uuid,
  p_comision_id uuid,
  p_monto numeric,
  p_metodo_pago text,
  p_notas text
) RETURNS jsonb`

No implementar todavía si la tarea actual es únicamente la primera capa de Ventas.

## 12. VENDEDORES EXTERNOS

Tabla:

`vendedores_externos`

Columnas:

- `id uuid`
- `nombre text`
- `contacto text nullable`
- `activo boolean`
- `creado_at timestamptz`
- `actualizado_at timestamptz`

No tienen acceso externo/login. Son registros internos usados por socios.

## 13. INVENTARIO Y VENTAS

La tabla física real sigue siendo:

`unidades_inventario`

Estados relevantes:

- `disponible`
- `vendida`
- `en_garantia`
- `no_recuperable`
- `salida_garantia`
- `retirada`

La RPC `rpc_registrar_venta` solo selecciona unidades con estado `disponible`.

## 14. ALCANCE PARA CODEX

Para la primera tarea de Fase 5:

IMPLEMENTAR SOLO:

- tipos TypeScript de Ventas;
- `ventasService.ts`;
- consultas necesarias para inventario disponible;
- registro de venta mediante `rpc_registrar_venta`;
- consulta de estado de ventas mediante `vw_ventas_estado` si encaja con la arquitectura actual.

NO implementar todavía:

- UI completa de Ventas;
- flujo completo de abonos;
- correcciones de venta;
- garantías;
- caja;
- finanzas;
- cierres.

NO modificar Supabase.

NO inventar contratos.
