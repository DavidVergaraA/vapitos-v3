# Plan de pruebas

## Estado ejecutado en esta sesión

- `npm run typecheck`: ejecutado tras las correcciones locales; pasó sin diagnósticos.
- `npm run build`: pasó al ejecutar con permiso ampliado luego de que el sandbox devolviera `EPERM: operation not permitted, realpath ... index.html`. Se generaron el bundle, manifest, service worker y Workbox. Advertencia no bloqueante: chunk principal JS de 697.28 kB (>500 kB).
- `git diff --check`: salida de código 0; sin errores de whitespace. Git mostró avisos informativos de normalización LF/CRLF en archivos editados.
- Tests: `package.json` no tiene script `test`; no se detectaron archivos de prueba.
- Supabase: solo metadatos de esquema y definiciones de funciones del proyecto dev autorizado; sin lectura de filas ni escrituras.

## Validaciones estáticas disponibles

```powershell
npm run typecheck
npm run build
git diff --check
```

No hay script lint, test o e2e configurado. `npm install` no se ejecutó; se encontraron `node_modules` y lockfile locales.

## Flujos manuales futuros

Usar solo un ambiente de desarrollo segregado y registros de prueba aprobados. Antes de insertar datos, acordar cómo limpiar o conservar las pruebas; las operaciones transaccionales pueden crear auditoría, lotes, unidades y movimientos vinculados. No ejecutar este flujo durante una revisión sin autorización para datos de prueba.

1. Iniciar sesión como socio autorizado.
2. Crear proveedor, producto, variante; revisar ids resultantes en UI.
3. Registrar compra con más de una variante.
4. Recibir parcialmente; verificar cantidades pendientes y que repetir request no duplica unidades.
5. Leer `vw_inventario_disponible`; revisar código físico, sabor, lote y costo.
6. Crear venta multivariante con abono inicial permitido; comprobar asignaciones desde lectura autorizada.
7. Abonar una parte y comprobar saldo/caja; probar rechazo sobre saldo solo con entorno de prueba.
8. Consultar estado de comisión y pagar solo si existe aprobación explícita para la prueba.
9. Consultar garantías; alta/resolución tiene efectos de inventario y requiere autorización específica.
10. Revisar cálculo de cierre leyendo implementación/configuración; no ejecutar cierre semanal real.

## Criterios de aprobación

No basta con que compilen tipos o componentes. Cada flujo necesita éxito observable, errores de RLS/schema no confundidos con estado vacío, cantidades antes/después consistentes, ausencia de duplicados, y evidencia en las vistas/reportes autorizados. Ninguna prueba de mutación se ejecutó en la presente auditoría.
