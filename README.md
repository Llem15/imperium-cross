# Imperium Cross

Sistema web de gestión y seguimiento de entrenamientos destinado a un único gimnasio. El proyecto se encuentra en su etapa inicial de configuración; las funcionalidades y pantallas aún no están implementadas.

## Stack tecnológico

Versiones instaladas actualmente, registradas en `package-lock.json`:

- Next.js 16.4.3 con App Router y Turbopack.
- React y React DOM 19.3.0.
- TypeScript 5.9.3 con tipado estricto.
- Tailwind CSS 4.3.3 y `@tailwindcss/turbopack` 4.3.3.
- ESLint 9.39.5 y `eslint-config-next` 16.4.3.
- npm para gestionar dependencias.

## Instalación y desarrollo

Requisitos: Node.js 20.9 o superior y npm. En el entorno inicial se utilizan Node.js 24.18.0 y npm 12.2.0.

Desde la raíz del proyecto, instalar las dependencias según el archivo de bloqueo:

```powershell
npm.cmd ci
```

Iniciar el servidor de desarrollo:

```powershell
npm.cmd run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

Los comandos usan `npm.cmd` y `npx.cmd` para funcionar en PowerShell cuando la política de ejecución bloquea los scripts `.ps1`. En otras terminales se puede usar `npm` y `npx`.

## Verificaciones y producción

```powershell
npm.cmd run lint
npx.cmd --no-install tsc --noEmit --incremental false
npm.cmd run build
```

Después de una compilación correcta, iniciar el servidor de producción:

```powershell
npm.cmd run start
```

## Diseño oficial

El diseño de referencia es [Imperium Cross en Figma](https://www.figma.com/design/5EPZT22l83oUzSrBw33zgt/Imperium-Cross?node-id=1-5). Consultar el diseño correspondiente antes de implementar cada pantalla.

## Flujo de desarrollo

Mantener `main` estable y trabajar en ramas independientes por tarea. El alcance del sistema es un único gimnasio, sin arquitectura multiempresa.
