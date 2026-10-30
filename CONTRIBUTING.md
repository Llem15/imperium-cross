# Guía de contribución

## Desarrollo

Mantener `main` estable y trabajar mediante ramas por tarea. Leer las instrucciones locales de `AGENTS.md`, si están disponibles, y consultar la documentación de la versión instalada en `node_modules/next/dist/docs/` antes de modificar código de Next.js.

Usar TypeScript estricto, evitar `any` innecesario y seguir las convenciones de Next.js y React. Separar presentación, reglas de negocio y acceso a datos. Añadir módulos y componentes compartidos cuando exista una necesidad real. No introducir microservicios ni soporte multiempresa.

Respetar el [diseño oficial de Figma](https://www.figma.com/design/5EPZT22l83oUzSrBw33zgt/Imperium-Cross). Consultar la pantalla correspondiente antes de implementarla e informar de diseños inaccesibles o interacciones sin especificar. No inventar funcionalidades sin aprobación.

Limitar los cambios al alcance solicitado. Explicar y solicitar autorización antes de instalar dependencias. Mantener secretos fuera del código, documentación e historial; proteger lógica sensible y datos mediante autorización en servidor.

## Ramas y commits

Comprobar `git status` antes de cambiar de rama; consultar si existen cambios pendientes. Crear ramas desde `main` actualizado con nombres como `feat/nombre`, `fix/nombre`, `docs/nombre` o `chore/nombre`. No modificar directamente `main`.

Agrupar cambios relacionados en commits coherentes con Conventional Commits: `tipo: descripción`, con alcance opcional, por ejemplo `fix(auth): validate session permissions`. Usar `feat`, `fix`, `docs`, `chore`, `refactor`, `test` o `ci` según corresponda. No crear commits vacíos ni incluir archivos ajenos a la tarea.

Los agentes automatizados deben contar con autorización explícita antes de crear commits, publicar, fusionar, reescribir historial o eliminar ramas. No cambiar de rama con cambios pendientes sin consultar.

## Verificaciones

Usar Node.js 24 y npm. Instalar con `npm ci` para respetar `package-lock.json`. Ejecutar desde la raíz:

```sh
npm run lint
npm run typecheck
npm run build
git diff --check
```

En PowerShell, usar `npm.cmd` si la política de ejecución bloquea `npm.ps1`. El script `typecheck` genera primero los tipos de rutas de Next.js y luego verifica TypeScript sin emitir archivos. El build necesita acceso a Google Fonts para descargar Inter mediante `next/font`.

Ejecutar también las pruebas pertinentes cuando existan. No publicar cambios con verificaciones fallidas sin explicar y resolver el problema. Revisar el diff y confirmar que no contiene secretos ni archivos generados.

## Pull Requests

Publicar la rama de trabajo y abrir un PR hacia `main`. Evitar PR duplicados. Describir el problema, los cambios, las validaciones y los pendientes; incluir capturas cuando haya cambios visuales. Mantener el alcance acotado y resolver observaciones de revisión.

El CI ejecuta instalación reproducible, ESLint, TypeScript y build en los PR y en los cambios de `main`. Antes de fusionar, comprobar que las verificaciones pasen y obtener la aprobación correspondiente. La configuración inicial no activa por sí sola reglas de protección de ramas en GitHub.
