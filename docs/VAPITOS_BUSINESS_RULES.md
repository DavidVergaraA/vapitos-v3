# VAPITOS V3 — BUSINESS RULES

## 1. Alcance

Vapitos V3 es un sistema interno de inventario, compras, ventas, pagos, garantías, devoluciones, comisiones, finanzas, cierres y distribución entre socios.

Incluye:
- autenticación
- catálogo
- productos/variantes
- proveedores
- compras
- inventario
- ventas
- pagos
- reembolsos
- garantías
- devoluciones
- vendedores externos
- comisiones
- finanzas
- cierres
- socios
- distribuciones
- auditoría

Fuera del MVP:
- CRM
- clientes
- fidelización
- ecommerce
- domicilios
- nómina
- contabilidad completa
- facturación electrónica
- gastos operativos generales
- login de vendedores externos
- crédito a clientes
- pagos parciales a proveedores

## 2. Ventas

Una venta puede contener múltiples productos y cantidades.

Ejemplo:
Producto A × 2
Producto B × 1
Producto C × 4

Cada unidad física debe ser trazable a su costo.

No vender más unidades de las disponibles.

No permitir stock negativo.

## 3. Cliente final

Las ventas son anónimas.

No almacenar nombre, teléfono, documento, correo, dirección ni perfil del comprador.

No crear una tabla `clientes` para resolver una necesidad que no existe.

## 4. Descuentos

El descuento es global.

Conceptualmente:

`subtotal = suma de líneas`

`total_final = subtotal - descuento`

No repartir automáticamente el descuento entre líneas salvo que el backend lo exija.

## 5. Pagos

Métodos:
- efectivo
- transferencia bancaria

Una venta puede tener múltiples abonos.

Mostrar:
- total
- pagado
- saldo

No sobrepagar.

No existe crédito normal.

## 6. Correcciones

No editar silenciosamente información financiera histórica.

Conservar:
- original
- ajuste
- usuario
- fecha
- motivo cuando corresponda

## 7. Reembolsos

El reembolso es independiente de la devolución física.

Puede existir reembolso sin devolución física.

Nunca borrar la venta original para reembolsar.

## 8. Productos defectuosos

Si un vape tiene un defecto pero todavía puede venderse:

- usar el flujo normal de venta;
- reducir el precio si es necesario;
- no crear producto reacondicionado;
- no crear estado `recuperable`;
- no crear contabilidad especial de recuperación.

## 9. Compras

Compra != pago a proveedor.

Las compras registran:
- proveedor
- productos
- cantidades
- costos
- recepción

No existe pago parcial a proveedores en el MVP.

## 10. Inventario

Estados:
- disponible
- vendida
- en_garantia
- no_recuperable
- salida_garantia
- retirada

No usar `recuperable` ni `revender`.

## 11. Garantías

Resoluciones:
- reemplazo
- reembolso
- sin cobertura
- reparación
- otra

Destinos de unidad defectuosa:
- desechar
- conservar
- entregada

Reglas:
- desechar → reconocer pérdida por costo;
- entregada → reconocer pérdida por costo;
- conservar → no reconocer automáticamente pérdida.

La venta original no se elimina.

## 12. Reemplazos

Una unidad de reemplazo debe:
- existir;
- estar disponible;
- corresponder a la variante;
- salir del inventario normal;
- pasar a salida de garantía;
- conservar trazabilidad;
- reconocer el costo.

## 13. Devoluciones físicas

Estados:
- recibida
- no requerida
- cancelada

Una devolución recibida requiere que la unidad esté asignada a esa venta.

Debe:
- registrar devolución;
- liberar asignación;
- cambiar estado;
- registrar movimiento de inventario;
- mantener auditoría.

No permitir dos devoluciones recibidas de la misma unidad para la misma venta.

Devolución física != reembolso automático.

## 14. Vendedores externos

Existen internamente.

No tienen:
- login
- acceso
- dashboard
- permisos

## 15. Comisiones

La comisión:
- es manual;
- es un monto fijo por toda la venta;
- no es por unidad;
- corresponde a la venta final después del descuento;
- solo se liquida cuando la venta está completamente pagada.

Ejemplo:

Venta final = $100.000
Comisión = $8.000

NO convertirla en $8.000 × cantidad.

## 16. Socios

Hay dos socios.

Ambos tienen permisos equivalentes.

## 17. Cierres

Periodo fijo:
Lunes → Domingo

Cierre manual.

Mostrar por separado:
- ventas
- recaudo
- reembolsos
- cartera
- costos
- comisiones
- impacto de garantías
- resultado
- distribuible

Ventas != recaudo.

## 18. Costos

Si una unidad fue devuelta y su asignación quedó liberada, el cálculo del costo debe respetar esa liberación.

No corregir esto manualmente desde React.

## 19. Distribución

Configuración inicial:
- 40% reinversión
- 30% socio 1
- 30% socio 2

Los porcentajes son configurables por periodos.

Los cierres históricos conservan snapshot.

## 20. Resultado negativo

Si el resultado es negativo:

`distribuible = 0`

No distribuir una utilidad negativa.

## 21. Capital

La recuperación/reinversión de capital es un checklist operativo.

No crear automáticamente un movimiento financiero si el backend no lo define.

## 22. Caja

El MVP mantiene saldo agregado.

No crear cajas separadas por método de pago sin una regla explícita del backend.

## 23. Principio general

La integridad de datos, seguridad y reglas financieras tienen prioridad sobre la UI.

Una pantalla bonita con lógica incorrecta no se considera terminada.
