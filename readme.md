# Vapitos V3

Frontend React + Vite + TypeScript para el proyecto Supabase `covpkfyhvgbgnftsinek`.

## Ejecutar localmente
1. Instala Node.js 20+.
2. Copia `.env.example` a `.env.local`.
3. En Supabase → Project Settings → API copia la URL y la clave **publishable/anon**. Nunca uses `service_role` en el navegador.
4. Ejecuta `npm install`, luego `npm run dev`.
5. Verifica con `npm run typecheck` y `npm run build`.

## GitHub Pages
El proyecto incluye workflow en `.github/workflows/deploy.yml`. Sube estos archivos a la rama `main`, configura `VITE_SUPABASE_URL` como Actions variable y `VITE_SUPABASE_ANON_KEY` como Actions secret, y en Settings → Pages selecciona GitHub Actions. URL esperada: `https://davidvergaraa.github.io/vapitos-v3/`.

## Seguridad
Las escrituras de negocio se hacen mediante RPC autorizados; no insertar directamente en tablas financieras. RLS debe seguir habilitado. Este paquete no modifica la base de datos ni contiene claves secretas.

## Estado honesto
Esta es una primera entrega funcional de estructura, login, dashboard, vistas de lectura y formularios básicos para catálogo, proveedores, vendedores, ventas, compras, caja y cierre semanal. Antes de registrar operaciones reales, verifica los payloads JSON de los RPC contra las funciones actuales del proyecto y completa pruebas de integración. No se ha ejecutado npm install/build en este entorno.
