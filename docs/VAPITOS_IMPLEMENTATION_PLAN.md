# VAPITOS V3 — IMPLEMENTATION PLAN

## 1. Objetivo

Construir Vapitos V3 como una PWA mobile-first conectada al backend Supabase existente.

Stack:
- React 19
- TypeScript strict
- Vite
- React Router
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zod
- Supabase JS/Auth
- PostgreSQL/RLS/RPC
- vite-plugin-pwa
- Vitest
- React Testing Library
- Playwright

No crear backend Node separado.

## 2. Antes de programar

Leer completamente:

- `docs/VAPITOS_BACKEND_CONTEXT.md`
- `docs/VAPITOS_BUSINESS_RULES.md`
- `docs/VAPITOS_IMPLEMENTATION_PLAN.md`

Después inspeccionar el repositorio actual.

Identificar:
- arquitectura
- V2 vs V3
- código reutilizable
- dependencias
- rutas
- Supabase
- PWA
- estilos
- variables de entorno

No empezar reescribiendo todo sin auditoría.

## 3. Arquitectura recomendada

```text
src/
  app/
  modules/
    auth/
    dashboard/
    catalogo/
    proveedores/
    compras/
    inventario/
    ventas/
    garantias/
    vendedores/
    finanzas/
    cierres/
    socios/
  shared/
  lib/
    supabase/
  types/
```

Cada dominio debe tener sus propios componentes, queries, comandos, schemas y tipos cuando sea necesario.

## 4. Lecturas

```text
UI
↓
TanStack Query
↓
query del dominio
↓
Supabase
↓
RLS
↓
PostgreSQL
```

## 5. Escrituras

```text
UI
↓
React Hook Form/Zod
↓
command
↓
supabase.rpc()
↓
PostgreSQL
↓
autorización + validación + locks + auditoría
```

No reemplazar RPC transaccionales con INSERT/UPDATE manuales.

## 6. FASE 0 — Auditoría

No modificar inicialmente.

Revisar:
- package.json
- Vite
- TypeScript
- src
- rutas
- componentes
- servicios
- hooks
- Supabase
- PWA
- estilos
- assets
- variables

Resultado:
- qué conservar;
- qué reemplazar;
- problemas;
- incompatibilidades;
- plan;
- riesgos.

## 7. FASE 1 — Fundación

Implementar:
- Supabase;
- Auth;
- sesión persistente;
- guards;
- layout;
- navegación;
- Tailwind;
- sistema visual;
- manejo de errores;
- PWA;
- formatters COP;
- fechas/timezone.

Verificar typecheck/lint/build.

## 8. FASE 2 — Catálogo

Implementar:
- productos;
- variantes;
- proveedores;
- búsqueda;
- filtros;
- edición.

Usar RPC reales.

## 9. FASE 3 — Compras

Implementar:
- nueva compra;
- proveedor;
- productos;
- cantidades;
- costos;
- recepción;
- historial.

Compra y pago al proveedor son conceptos separados.

## 10. FASE 4 — Inventario

Implementar:
- stock;
- unidades;
- lotes;
- costos;
- estados;
- movimientos;
- trazabilidad.

Estados válidos:
- disponible
- vendida
- en_garantia
- no_recuperable
- salida_garantia
- retirada

## 11. FASE 5 — Ventas

Flujo:

Nueva venta
→ seleccionar producto
→ cantidad
→ agregar productos
→ subtotal
→ descuento
→ total
→ confirmar
→ pago opcional

Debe ser rápido en móvil.

Evitar:
- stock insuficiente;
- cantidades inválidas;
- descuento inválido;
- doble submit.

## 12. FASE 6 — Pagos

Implementar:
- historial;
- nuevo abono;
- método;
- fecha;
- monto;
- total pagado;
- saldo.

Métodos:
- efectivo
- transferencia

## 13. FASE 7 — Vendedores y comisiones

Implementar:
- CRUD interno de vendedores;
- asociación a venta;
- comisión manual;
- estado;
- liquidación;
- ajustes.

Recordar: comisión fija por venta completa, no por unidad.

## 14. FASE 8 — Garantías

Implementar:
- listado;
- detalle;
- registro;
- resolución;
- reemplazo;
- reembolso;
- sin cobertura;
- reparación;
- otra.

Destinos:
- desechar
- conservar
- entregada

Regla:
- desechar → pérdida;
- entregada → pérdida;
- conservar → no pérdida automática.

## 15. FASE 9 — Devoluciones

Implementar devolución física con:
- validación de venta;
- validación de unidad;
- validación de asignación;
- bloqueo de duplicados;
- destino;
- movimiento;
- auditoría.

No hacer reembolso automático.

## 16. FASE 10 — Finanzas

Mostrar:
- ventas;
- recaudo;
- reembolsos;
- cartera;
- costos;
- comisiones;
- garantías;
- resultado;
- distribuible.

Nunca confundir ventas con efectivo recibido.

## 17. FASE 11 — Cierres

Semana:
Lunes → Domingo

Flujo:
1. seleccionar semana;
2. revisar métricas;
3. revisar ventas;
4. recaudo;
5. cartera;
6. reembolsos;
7. costos;
8. comisiones;
9. garantías;
10. resultado;
11. distribución;
12. confirmar.

No permitir cierre duplicado.

## 18. FASE 12 — Distribuciones

Mostrar:
- 40% reinversión;
- 30% socio 1;
- 30% socio 2.

Mostrar configuración vigente e histórico.

## 19. FASE 13 — Dashboard

Mostrar información accionable:
- ventas recientes;
- ventas del periodo;
- recaudo;
- cartera;
- inventario;
- stock bajo;
- garantías pendientes;
- comisiones pendientes;
- último cierre;
- resultado.

## 20. UX/UI

Mobile-first.

Prioridad:
móvil > tablet > desktop.

Usar:
- cards;
- sheets;
- dialogs;
- tablas responsive;
- filtros;
- búsqueda;
- badges;
- confirmaciones;
- feedback.

Iconos: Lucide React.

No usar emojis como iconografía principal.

## 21. PWA

Debe incluir:
- manifest;
- service worker;
- iconos;
- instalación.

NO implementar escrituras financieras offline.

Si no hay conexión, informar y no guardar silenciosamente una venta para sincronizar después.

## 22. Timezone

Prestar especial atención a:
- ventas;
- pagos;
- cierres;
- lunes/domingo;
- timestamps;
- UTC/local.

## 23. Errores

No mostrar errores SQL crudos al usuario.

Ejemplos:
- “No hay unidades disponibles.”
- “La venta ya está pagada.”
- “Esta semana ya fue cerrada.”
- “No tienes permisos para realizar esta operación.”

## 24. Tipos

Preferir tipos generados desde Supabase.

UUID = `string`.

Evitar `any`.

## 25. Testing

Frontend:
- `tsc --noEmit`
- lint
- Vitest
- React Testing Library

E2E:
- Playwright

Build:
- `npm run build`

No afirmar éxito sin ejecutar el comando.

## 26. Casos críticos

### Ventas
- una línea;
- múltiples líneas;
- cantidades;
- descuento;
- stock insuficiente.

### Pagos
- parcial;
- completo;
- sobrepago;
- múltiples abonos;
- corrección.

### Garantías
- reemplazo;
- reembolso;
- sin cobertura;
- reparación;
- desechar;
- conservar;
- entregada.

### Devoluciones
- válida;
- duplicada;
- unidad incorrecta.

### Comisiones
- manual;
- venta parcial;
- venta completa;
- ajuste.

### Cierre
- semana correcta;
- duplicado;
- resultado positivo;
- resultado negativo;
- distribución;
- histórico.

## 27. Seguridad

Verificar:
- usuario no autenticado;
- usuario autenticado;
- socio activo;
- RLS;
- RPC;
- rutas protegidas;
- operaciones no autorizadas.

Nunca confiar solamente en la UI.

## 28. No inventar backend

Si falta una operación:

NO:
- inventar RPC;
- inventar tabla;
- hacer INSERT directo como workaround;
- crear una segunda entidad para sustituir la real.

Primero buscar en migraciones/documentación.

Si sigue faltando:
- documentar;
- explicar qué backend hace falta;
- detener esa parte.

## 29. Migraciones

No editar migraciones aplicadas.

Cualquier cambio de BD debe ser una nueva migración.

No ejecutar operaciones destructivas.

No tocar producción.

## 30. Modelos recomendados

### Gemini 3.1 Pro High

Preferir para:
- arquitectura;
- auditoría;
- Supabase;
- RLS;
- RPC;
- garantías;
- cierres;
- inconsistencias;
- QA final.

### Gemini 3.8 Flash High

Preferir para:
- implementación masiva;
- componentes;
- páginas;
- estilos;
- formularios;
- refactors;
- tareas repetitivas.

No usar Flash para improvisar reglas financieras.

## 31. Checkpoint por fase

Después de cada fase:

1. typecheck;
2. lint;
3. tests disponibles;
4. build cuando corresponda;
5. corregir errores;
6. continuar.

No acumular cambios sin verificar.

## 32. Definición de terminado

No basta con que compile.

Debe cumplir:
- backend correcto;
- seguridad;
- reglas de negocio;
- trazabilidad;
- UX;
- responsive;
- PWA;
- errores;
- pruebas;
- documentación.

## 33. Documentación final

Actualizar:
- README.md
- .env.example

README:
- propósito;
- stack;
- instalación;
- variables;
- Supabase;
- arquitectura;
- testing;
- build;
- PWA;
- deployment.

Nunca incluir secretos reales.

## 34. Deployment

Opciones previstas:
- Cloudflare Pages
- GitHub Pages

No fijar `/vapitos/` como base definitiva hasta confirmar la URL.

## 35. Auditoría final

Buscar:
- `any`;
- TODO críticos;
- console.log innecesarios;
- imports muertos;
- mocks;
- datos falsos;
- RPC inexistentes;
- tablas inexistentes;
- código V2;
- estados inválidos;
- errores de timezone;
- problemas responsive;
- problemas PWA;
- credenciales;
- rutas rotas;
- errores TypeScript;
- errores de build.

## 36. Primer mensaje para Antigravity

Después de colocar estos tres archivos en `/docs`, comenzar con:

> Lee completamente:
>
> - docs/VAPITOS_BACKEND_CONTEXT.md
> - docs/VAPITOS_BUSINESS_RULES.md
> - docs/VAPITOS_IMPLEMENTATION_PLAN.md
>
> NO construyas todavía toda la aplicación.
>
> Primero inspecciona el repositorio actual y determina qué existe, qué pertenece a V2, qué puede reutilizarse y qué debe reemplazarse.
>
> No inventes ninguna tabla, columna, RPC, estado ni regla.
>
> Presenta primero una auditoría del repositorio y un plan concreto.
>
> Después comienza por la FASE 1.
>
> Trabaja por fases y verifica cada fase antes de continuar.
