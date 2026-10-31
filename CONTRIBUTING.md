# Guía de contribución

## Desarrollo

Mantener `main` estable y trabajar mediante ramas por tarea. Consultar la documentación de la versión instalada en `node_modules/next/dist/docs/` antes de modificar código de Next.js.

Usar TypeScript estricto, evitar `any` innecesario y seguir las convenciones de Next.js y React. Separar presentación, reglas de negocio y acceso a datos. Añadir módulos y componentes compartidos cuando exista una necesidad real. No introducir microservicios ni soporte multiempresa.

Respetar el [diseño oficial de Figma](https://www.figma.com/design/5EPZT22l83oUzSrBw33zgt/Imperium-Cross). Consultar la pantalla correspondiente antes de implementarla e informar de diseños inaccesibles o interacciones sin especificar. No inventar funcionalidades sin aprobación.

Limitar los cambios al alcance solicitado. Explicar y solicitar autorización antes de instalar dependencias. Mantener secretos fuera del código, documentación e historial; proteger lógica sensible y datos mediante autorización en servidor.

## Formato y estilos del frontend

Usar dos espacios, UTF-8 y finales de línea LF según `.editorconfig`. Prettier aplica el formato de `.prettierrc` con 100 caracteres como referencia flexible. Ejecutar `npm run format` para formatear y `npm run format:check` para comprobar sin modificar archivos. Los textos y las cadenas de clases pueden superar ese ancho cuando el formateador no los divide.

El plugin oficial `prettier-plugin-tailwindcss` ordena las clases de los atributos JSX y utiliza `app/globals.css` como entrada de Tailwind CSS 4, incluidos los tokens del proyecto. Se conservan los saltos de línea de las clases para facilitar la lectura. Mantener los bloques separados y los nombres explícitos; el formateador no sustituye estas decisiones.

El archivo `.prettierignore` excluye dependencias, archivos generados, el lockfile y recursos estáticos. No modificar esos archivos para satisfacer el formato. ESLint conserva su configuración y comprueba la calidad del código; Prettier se ocupa del formato.

Usar utilidades de Tailwind CSS 4 para distribución, responsive, tipografía y estados. Centralizar colores, radios y dimensiones reutilizados en `@theme` de `app/globals.css`. Conservar CSS global para tokens, estilos base y preferencias de accesibilidad. Los recortes específicos de imágenes se mantienen como datos tipados, no como estilos de distribución duplicados.

Separar composición, presentación, estado y validaciones cuando ayude a entender una funcionalidad. Evitar tanto componentes con responsabilidades mezcladas como archivos para cada elemento HTML. Comparar la interfaz antes y después de una refactorización, incluyendo móvil, teclado y ejecución real; compilar no sustituye esa revisión.

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
npm run format:check
git diff --check
```

En PowerShell, usar `npm.cmd` si la política de ejecución bloquea `npm.ps1`. El script `typecheck` genera primero los tipos de rutas de Next.js y luego verifica TypeScript sin emitir archivos. El build necesita acceso a Google Fonts para descargar Inter mediante `next/font`.

Ejecutar también las pruebas pertinentes cuando existan. No publicar cambios con verificaciones fallidas sin explicar y resolver el problema. Revisar el diff y confirmar que no contiene secretos ni archivos generados.

## Pull Requests

Publicar la rama de trabajo y abrir un PR hacia `main`. Evitar PR duplicados. Describir el problema, los cambios, las validaciones y los pendientes; incluir capturas cuando haya cambios visuales. Mantener el alcance acotado y resolver observaciones de revisión.

El CI ejecuta instalación reproducible, Prettier, ESLint, TypeScript y build en los PR y en los cambios de `main`. Antes de fusionar, comprobar que las verificaciones pasen y obtener la aprobación correspondiente. La configuración inicial no activa por sí sola reglas de protección de ramas en GitHub.
