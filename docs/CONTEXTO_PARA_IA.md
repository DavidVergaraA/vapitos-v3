# Contexto para futuras sesiones de IA

## Contexto y límites

Repositorio `C:\Proyectos\vapitos-v3`, frontend React 18 + TypeScript + Vite + Supabase JS + React Query + Tailwind + PWA. El único proyecto Supabase de desarrollo autorizado conocido es `covpkfyhvgbgnftsinek`. La base antigua de producción debe permanecer intocada. No imprimir `.env.local`, no usar service role, no ejecutar migraciones, no hacer DML de prueba sin autorización directa y segregación aprobada. No commit/push/deploy sin solicitud.

## Arquitectura y contratos vigentes

Lee primero `README.md`, `docs/ESTADO_PROYECTO.md`, `docs/BACKLOG_VAPITOS_V3.md`, `docs/ARQUITECTURA.md`, `docs/CONTRATOS_BACKEND.md`, y los históricos `VAPITOS_V3_CONTRATOS_BACKEND_VERIFICADOS.md` + `VAPITOS_V3_CONTRATOS_VENTAS_VERIFICADOS.md`. `src/lib/supabase.ts` limita la URL al proyecto dev y falla cerrado. Las compras/recepciones y ventas deben usar solo RPCs documentadas; inventario se lee de `vw_inventario_disponible`.

## Estado y hallazgos de la última sesión

- Estado inicial Git: rama `main`, árbol limpio.
- Se consultaron únicamente metadatos del proyecto dev exacto; ninguna fila de negocio ni función se ejecutó.
- Confirmado: `variantes_producto` existe; `variantes` no aparece en metadatos. El catálogo local ya fue corregido al nombre real.
- RPC guardar proveedor/producto coinciden con payload local. Mensajes “no encontrado” ocurren en update cuando id no existe; formularios “nuevo” locales mandan null. El error observado no queda reproducido ni explicado.
- Se alinearon cierres y garantías a nombres reales; se eliminó preview hardcodeado 40/30/30.
- Se eliminó upsert directo fallback del vendedor externo; lectura de caja ya no oculta errores.
- El cliente cierra conexión remota si falta config o URL esperada; jamás apunta a un proyecto alterno.
- Typecheck y build finales pasaron. Build necesitó permiso ampliado después de un EPERM del sandbox; chunk JS 697.28 kB advertido. `git diff --check` pasó (solo advertencias de conversión LF/CRLF de Git).
- No se verificó RLS/runtime, el sitio publicado, variables remotas Actions ni service worker desplegado.

## Próximos pasos

1. Terminar esta tarea corriendo typecheck, build, diff-check y revisar diff/estado Git.
2. Validar cambios contra tipos y estados reales, especialmente garantías y cierres.
3. Resolver o documentar assets faltantes de PWA y obtener build limpia en entorno Windows permitido.
4. Revisar variables de GitHub Actions en la UI sin revelar el secreto y confirmar hostname de deployment/SW.
5. Reproducir errores de producto/proveedor con versión actual en proyecto dev solo después de aprobar un dato de prueba y plan de limpieza.

## Instrucción reusable

```text
Retoma Vapitos V3 desde el repositorio actual. Lee README.md y docs/ESTADO_PROYECTO.md, docs/BACKLOG_VAPITOS_V3.md, docs/ARQUITECTURA.md, docs/CONTRATOS_BACKEND.md y los contratos VAPITOS_V3 existentes. Compara esas notas con git status y el código real. Actualiza el backlog con evidencia, distingue errores demostrados de hipótesis y continúa la tarea pendiente de mayor prioridad. No modifiques Supabase, SQL, migraciones o RLS ni ejecutes escrituras de prueba sin autorización explícita. Nunca expongas secretos. Corre npm run typecheck, npm run build y git diff --check; reporta el resultado real, incluyendo fallos del entorno.
```
