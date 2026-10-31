# Imperium Cross

Proyecto de un sistema web de gestión y seguimiento de entrenamientos destinado a un único gimnasio. Incluye una landing pública responsive, login y páginas internas de administrador, recepción, entrenador y socio basadas en el diseño de Figma.

## Stack tecnológico

Versiones instaladas actualmente, registradas en `package-lock.json`:

- Next.js 16.4.3 con App Router y Turbopack.
- React y React DOM 19.3.0.
- TypeScript 5.9.3 con tipado estricto.
- Tailwind CSS 4.3.3 y `@tailwindcss/turbopack` 4.3.3.
- ESLint 9.39.5 y `eslint-config-next` 16.4.3.
- Prettier 3.9.10 y `prettier-plugin-tailwindcss` 0.8.1 para formato y orden de clases.
- npm para gestionar dependencias.

## Instalación y desarrollo

Requisitos: [Node.js 24](https://nodejs.org/en/download) y npm. En el entorno inicial se utilizan Node.js 24.18.0 y npm 12.2.0.
Desde la raíz del proyecto, instalar las dependencias según el archivo de bloqueo:

```powershell
npm.cmd ci
```

Iniciar el servidor de desarrollo:

```powershell
npm.cmd run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

Para recorrer los paneles, abrir [el acceso de demostración](http://localhost:3000/login) y consultar las cuentas disponibles debajo del formulario. Introducir el usuario y la contraseña de prueba del perfil. Las rutas internas también pueden visitarse directamente; este acceso no proporciona autenticación real. Consultar [cuentas, rutas y limitaciones del frontend interno](docs/dashboard-foundation.md).

Los comandos usan `npm.cmd` y `npx.cmd` para funcionar en PowerShell cuando la política de ejecución bloquea los scripts `.ps1`. En otras terminales se puede usar `npm` y `npx`.

## Verificaciones y producción

```powershell
npm.cmd run format:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

Después de una compilación correcta, iniciar el servidor de producción:

```powershell
npm.cmd run start
```

## Diseño oficial

El diseño es [Imperium Cross en Figma](https://www.figma.com/design/5EPZT22l83oUzSrBw33zgt/Imperium-Cross?node-id=1-5). Consultar el diseño correspondiente antes de implementar cada pantalla.

Consultar el [alcance y las decisiones de la landing](docs/public-landing.md), incluidos el mapa y los enlaces, y el [flujo de inscripción de dos pasos](docs/membership-registration.md). El formulario conserva los datos en memoria y permite recorrer las confirmaciones visuales de Figma. La compilación descarga Inter mediante `next/font`; necesita acceso a Google Fonts.

## Flujo de desarrollo

Mantener `main` estable y trabajar en ramas independientes por tarea. El alcance del sistema es un único gimnasio, sin arquitectura multiempresa.

Consultar la [arquitectura inicial](docs/architecture.md) y la [guía de contribución](CONTRIBUTING.md). El CI verifica instalación reproducible, formato, ESLint, tipos y compilación en Pull Requests y cambios en `main`, con Node.js 24.

### Aviso de lockfile externo

Si existe un `package-lock.json` en una carpeta superior fuera del repositorio, Next.js 16.4.3 puede avisar que lo ha ignorado. Es una advertencia de detección de raíz: el archivo externo se descarta y no debe eliminarse ni incorporarse al proyecto. No ampliar `turbopack.root` hacia esa carpeta para silenciarla. En esta versión, declarar la raíz explícitamente no evita la exploración inicial que produce el aviso.
