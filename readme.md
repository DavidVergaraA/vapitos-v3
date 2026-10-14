# Vapitos V3

Aplicación web privada para operación interna del inventario, compras, ventas y controles financieros de Vapitos. El repositorio contiene el frontend React; Auth, tablas, vistas y operaciones transaccionales viven en Supabase/PostgreSQL.

## Arquitectura y módulos

La interfaz está en `src/modules`, los servicios Supabase junto a cada módulo, los contratos TypeScript en `src/types`, la navegación en `src/app/router.tsx` y la caché en `src/app/query-client.ts`. React Query carga datos y coordina invalidaciones; las operaciones de negocio deben pasar por RPC. El frontend no debe escribir directamente en tablas financieras ni manipular unidades de inventario.

Consulta [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md), [docs/CONTRATOS_BACKEND.md](docs/CONTRATOS_BACKEND.md), [docs/ESTADO_PROYECTO.md](docs/ESTADO_PROYECTO.md), [docs/BACKLOG_VAPITOS_V3.md](docs/BACKLOG_VAPITOS_V3.md), [docs/PLAN_DE_PRUEBAS.md](docs/PLAN_DE_PRUEBAS.md) y [docs/CONTEXTO_PARA_IA.md](docs/CONTEXTO_PARA_IA.md) para retomar el estado detallado. Los documentos `VAPITOS_*` conservan decisiones e historia del diseño; no reemplazan las verificaciones actuales.

## Requisitos y desarrollo en Windows

- Node.js 20 o superior y npm.
- Clonar el repositorio y ejecutar `npm install`.
- Crear `.env.local` en la raíz con la URL y la clave pública (anon/publishable) del proyecto autorizado:

```dotenv
VITE_SUPABASE_URL=https://covpkfyhvgbgnftsinek.supabase.co
VITE_SUPABASE_ANON_KEY=REEMPLAZAR_POR_LA_CLAVE_PUBLICA
```

No usar `service_role` ni una secret key en el navegador. `.env.local` está excluido de Git. El cliente deshabilita el acceso remoto si la URL no coincide exactamente con el proyecto de desarrollo autorizado o falta la clave.

Comandos disponibles:

```powershell
npm run dev
npm run typecheck
npm run build
npm run preview
```

No existe script `test` ni suite de pruebas detectada en el estado auditado.

## Despliegue

`.github/workflows/deploy.yml` compila en GitHub Actions y publica `dist` en GitHub Pages al actualizar `main` o por ejecución manual. Configura `VITE_SUPABASE_URL` como variable de Actions y `VITE_SUPABASE_ANON_KEY` como secret; revisa que la URL sea exactamente la autorizada antes de ejecutar el workflow. La base de Vite y el `basename` del router están en `/vapitos-v3/`; la URL esperada es `https://davidvergaraa.github.io/vapitos-v3/`.

El estado actual de las variables remotas de GitHub, del artefacto publicado y del service worker del navegador no se puede determinar solo con este repositorio. No se ha desplegado desde esta sesión.

## Supabase y seguridad

El proyecto de desarrollo autorizado para inspección es `covpkfyhvgbgnftsinek`. En esta auditoría solo se leyeron metadatos de esquema/funciones; no se insertaron datos, no se ejecutaron RPC de negocio ni migraciones. La base antigua de producción quedó fuera de alcance. RLS debe permanecer activo. Los contratos confirmados y sus límites están en [docs/CONTRATOS_BACKEND.md](docs/CONTRATOS_BACKEND.md).

La compilación del frontend no prueba permisos RLS ni el flujo transaccional real. Ejecuta primero el plan de pruebas y usa datos de prueba autorizados únicamente en el proyecto de desarrollo.
