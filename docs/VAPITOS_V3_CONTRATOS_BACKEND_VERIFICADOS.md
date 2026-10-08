# VAPITOS V3 — CONTINUACIÓN DE PROGRAMACIÓN (CONTRATOS BACKEND VERIFICADOS)

## OBJETIVO

Continúa el desarrollo del proyecto `vapitos-v3`.

NO reinicies el proyecto.
NO reconstruyas la arquitectura.
NO hagas otra auditoría general.
NO inventes contratos de Supabase.
NO modifiques Supabase en esta tarea.
NO implementes Ventas todavía.

La información de este documento contiene contratos que fueron verificados directamente contra el proyecto Supabase de DESARROLLO:

`covpkfyhvgbgnftsinek`

---

# 1. ESTADO ACTUAL

La aplicación ya tiene una arquitectura modular con:

- React
- TypeScript
- Vite
- Supabase
- React Router
- TanStack Query
- Tailwind
- PWA
- Auth
- Catálogo
- Proveedores
- Compras
- Inventario

La auditoría anterior encontró que:

- `npm run typecheck` pasa.
- `npm run build` pasa.
- La PWA compila correctamente.
- El build tiene una advertencia no bloqueante por tamaño del bundle (~606 kB).
- Se corrigieron errores que ocultaban errores técnicos de Supabase en Compras e Inventario.

Ahora ya se verificaron directamente los contratos reales de Supabase para Compras e Inventario.

---

# 2. CONTRATO REAL: rpc_registrar_compra

Firma real:

```sql
rpc_registrar_compra(
    p_request_id uuid,
    p_proveedor_id uuid,
    p_items jsonb,
    p_fecha_compra date DEFAULT CURRENT_DATE,
    p_referencia text DEFAULT NULL,
    p_notas text DEFAULT NULL
)
RETURNS jsonb
```

El frontend DEBE enviar exactamente esos parámetros.

## Estructura real de `p_items`

Cada elemento debe tener:

```json
{
  "variante_id": "UUID",
  "cantidad_pedida": 10,
  "costo_unitario": 7000,
  "notas": "opcional"
}
```

### IMPORTANTE

NO utilizar:

```json
{
  "producto_id": "...",
  "cantidad": 10
}
```

El backend NO espera esos nombres.

Los nombres correctos son:

- `variante_id`
- `cantidad_pedida`
- `costo_unitario`
- `notas`

`producto_id` NO forma parte del payload de esta RPC.

La RPC devuelve `jsonb`.

El frontend no debería declarar esta operación como `Promise<void>` si puede tipar correctamente la respuesta.

---

# 3. CONTRATO REAL: rpc_recibir_compra

Firma real:

```sql
rpc_recibir_compra(
    p_request_id uuid,
    p_compra_id uuid,
    p_items jsonb
)
RETURNS jsonb
```

El frontend DEBE enviar:

```json
{
  "p_request_id": "UUID",
  "p_compra_id": "UUID",
  "p_items": [
    {
      "detalle_compra_id": "UUID",
      "cantidad_recibida": 5
    }
  ]
}
```

## Recepción parcial

La RPC soporta recepción parcial.

Ejemplo:

Compra:
- cantidad pedida = 10

Primera recepción:
- cantidad recibida = 4

Resultado:
- estado `recibida_parcial`

Después:

- cantidad recibida acumulada = 10
- estado `recibida`

La RPC es responsable de:

1. validar las líneas;
2. crear `lotes_inventario`;
3. crear `unidades_inventario`;
4. crear `movimientos_inventario`;
5. actualizar el estado de la compra.

El frontend NO debe insertar directamente lotes, unidades ni movimientos.

---

# 4. DISCREPANCIA ENCONTRADA EN EL FRONTEND

La implementación anterior asumía incorrectamente algo parecido a:

```ts
rpc_registrar_compra({
  p_request_id,
  p_compra_id,
  p_proveedor_id,
  p_notas,
  p_items: [
    {
      producto_id,
      variante_id,
      cantidad,
      costo_unitario
    }
  ]
})
```

Eso NO coincide con el backend real.

Debe corregirse para usar:

```ts
rpc_registrar_compra({
  p_request_id,
  p_proveedor_id,
  p_items: [
    {
      variante_id,
      cantidad_pedida,
      costo_unitario,
      notas
    }
  ],
  p_fecha_compra,
  p_referencia,
  p_notas
})
```

Observa especialmente:

- NO existe `p_compra_id` en `rpc_registrar_compra`.
- `cantidad` debe ser `cantidad_pedida`.
- `producto_id` no forma parte de `p_items`.
- existen `p_fecha_compra` y `p_referencia`.

---

# 5. DISCREPANCIA EN RECEPCIÓN

La implementación anterior no estaba enviando `p_items` a `rpc_recibir_compra`.

Eso debe corregirse.

La llamada correcta es conceptualmente:

```ts
rpc_recibir_compra({
  p_request_id,
  p_compra_id,
  p_items: [
    {
      detalle_compra_id,
      cantidad_recibida
    }
  ]
})
```

NO llames la RPC solo con:

```ts
{
  p_request_id,
  p_compra_id
}
```

porque falta `p_items`.

---

# 6. INVENTARIO REAL

## Tabla real de unidades

La tabla NO se llama `unidades`.

La tabla real es:

```text
unidades_inventario
```

Columnas verificadas:

```text
id
codigo_unidad
lote_id
costo_origen
costo_actual
estado
recibida_at
salida_at
notas
creado_at
actualizado_at
```

## Estados actuales válidos

```text
disponible
vendida
en_garantia
no_recuperable
salida_garantia
retirada
```

NO reintroducir:

```text
recuperable
revender
costo_recuperado
```

Estos conceptos fueron eliminados del diseño actual.

---

# 7. LOTES REALES

Existe la tabla:

```text
lotes_inventario
```

Columnas verificadas:

```text
id
detalle_compra_id
recibido_at
cantidad_recibida
costo_unitario
creado_at
```

Relación conceptual:

```text
compra
  ↓
detalle_compra
  ↓
lote_inventario
  ↓
unidades_inventario
```

Cada recepción crea el lote correspondiente y sus unidades físicas mediante la RPC.

---

# 8. MOVIMIENTOS DE INVENTARIO

Existe:

```text
movimientos_inventario
```

Columnas verificadas:

```text
id
unidad_id
estado_anterior
estado_nuevo
operacion_tipo
operacion_id
motivo
actor_id
creado_at
```

Los movimientos deben ser generados por las operaciones de backend correspondientes.

El frontend NO debe insertar movimientos directamente.

Esto permite mantener trazabilidad de:

```text
unidad
→ estado anterior
→ estado nuevo
→ operación
→ operación relacionada
→ motivo
→ actor
→ fecha
```

---

# 9. VISTA REAL: vw_inventario_disponible

Existe la vista:

```text
vw_inventario_disponible
```

La definición verificada devuelve:

```text
unidad_id
codigo_unidad
producto_id
marca
modelo
puffs
variante_id
sabor
lote_id
recibido_at
costo_origen
costo_actual
```

La vista filtra:

```sql
WHERE u.estado = 'disponible'
```

Por lo tanto esta vista representa SOLO unidades disponibles.

No usarla como si representara todos los estados del inventario.

---

# 10. TABLA DE COMPRAS REAL

Existe:

```text
compras
```

Columnas verificadas:

```text
id
proveedor_id
fecha_compra
referencia
estado
notas
creada_por
creado_at
actualizado_at
```

Estados observados en la lógica de recepción:

```text
registrada
recibida_parcial
recibida
anulada
```

La RPC de recepción no permite recibir una compra anulada.

---

# 11. DETALLE DE COMPRAS REAL

Existe:

```text
detalle_compras
```

Columnas verificadas:

```text
id
compra_id
variante_id
cantidad_pedida
costo_unitario
notas
creado_at
```

No asumir `cantidad`.

El nombre correcto es:

```text
cantidad_pedida
```

---

# 12. CAMBIOS QUE CODEX DEBE HACER AHORA

Modificar únicamente el frontend necesario.

## Archivo principal de compras

Revisar:

```text
src/modules/compras/comprasService.ts
```

y:

```text
src/modules/compras/ComprasPage.tsx
```

Corregir:

- payload de `rpc_registrar_compra`;
- nombres de campos;
- `p_fecha_compra`;
- `p_referencia`;
- `p_notas`;
- estructura de `p_items`;
- recepción parcial;
- payload de `rpc_recibir_compra`;
- manejo de la respuesta JSONB.

---

## Archivo principal de inventario

Revisar:

```text
src/modules/inventario/inventarioService.ts
```

y:

```text
src/modules/inventario/InventarioPage.tsx
```

Corregir cualquier referencia incorrecta a:

```text
unidades
```

cuando realmente corresponda:

```text
unidades_inventario
```

Respetar las columnas reales.

Si se utiliza:

```text
vw_inventario_disponible
```

utilizar solamente las columnas verificadas de esa vista.

No asumir que la vista contiene unidades no disponibles.

---

# 13. TIPADO TYPESCRIPT

Revisar los tipos relacionados con Compras e Inventario.

Eliminar casts innecesarios como:

```ts
payload as unknown as Record<string, unknown>
```

cuando sea posible tipar correctamente.

No utilizar `any` si se puede evitar.

No inventar un tipo de respuesta diferente al `jsonb` real.

---

# 14. REGLA DE SEGURIDAD

NO hacer:

```text
INSERT INTO lotes_inventario
INSERT INTO unidades_inventario
INSERT INTO movimientos_inventario
```

desde el frontend.

La recepción debe utilizar:

```text
rpc_recibir_compra
```

y el backend se encarga de crear:

```text
lotes
unidades
movimientos
```

---

# 15. NO MODIFICAR SUPABASE

Esta tarea es de frontend.

NO:

- crear migraciones;
- modificar RPCs;
- modificar tablas;
- modificar RLS;
- borrar funciones;
- crear columnas;
- cambiar estados.

Los contratos anteriores fueron verificados directamente contra el Supabase de desarrollo y deben tratarse como fuente de verdad.

---

# 16. VALIDACIÓN OBLIGATORIA

Después de implementar los cambios:

```bash
npm run typecheck
npm run build
```

Si existen tests:

```bash
npm test
```

o el comando equivalente disponible en `package.json`.

No declarar que algo está "verificado" si no se ejecutó.

---

# 17. NO IMPLEMENTAR VENTAS TODAVÍA

En esta tarea NO comenzar:

- Ventas
- Pagos
- Comisiones
- Garantías
- Devoluciones
- Finanzas
- Cierre semanal
- Distribuciones

Primero cerrar correctamente Compras e Inventario.

---

# 18. CRITERIO DE FINALIZACIÓN

Esta tarea termina cuando:

1. Compras utiliza el contrato REAL de `rpc_registrar_compra`.
2. Recepción utiliza el contrato REAL de `rpc_recibir_compra`.
3. Recepción parcial funciona en frontend.
4. Inventario utiliza las relaciones reales.
5. No se usan nombres de columnas inventados.
6. No se insertan unidades/lotes/movimientos directamente desde frontend.
7. TypeScript pasa.
8. Build pasa.
9. Se reportan claramente los archivos modificados.
10. Se reportan los comandos ejecutados y sus resultados.
11. Se listan los pendientes reales de Fase 3/4.

NO decir simplemente "terminado".
Entregar evidencia concreta de lo realizado.
