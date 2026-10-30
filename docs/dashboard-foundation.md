# Base del frontend interno

Esta entrega implementa las vistas iniciales de cuatro perfiles de demostración para un único gimnasio. Las rutas pueden abrirse directamente; el selector de perfiles organiza la navegación y no autentica ni autoriza usuarios.

## Rutas y alcance

| Ruta                   | Contenido                                                                   |
| ---------------------- | --------------------------------------------------------------------------- |
| `/login`               | Login visual con selección de Administrador, Recepción, Entrenador o Socio. |
| `/admin`               | Indicadores, ingresos mensuales y actividad reciente de ejemplo.            |
| `/recepcion/clientes`  | Clientes, búsqueda local y consulta de detalle.                             |
| `/entrenador/clientes` | Solo clientes asignados al entrenador de demostración, búsqueda y detalle.  |
| `/socio/mi-rutina`     | Rutina, ejercicios, parámetros y notas de seguimiento consultables.         |

El acceso conserva la composición del frame `88:188` y adapta el selector `99:981` a cuatro perfiles. La contraseña es una representación visual, no un campo editable. La recuperación se presenta sin enlace activo porque sus estados quedan fuera de esta entrega.

## Organización

Los grupos `(acceso)` e `(interno)` separan las rutas y comparten el layout raíz existente. El layout interno compone `DashboardShell`; su configuración depende de la ruta, no de una sesión. La landing y la inscripción conservan sus componentes.

- `components/dashboard/`: shell, sidebar, cabecera, selector de perfiles y elementos de presentación compartidos.
- `components/ui/dialog.tsx`: diálogo nativo utilizado por navegación móvil y detalles, con Escape, cierre exterior, foco inicial, retorno al origen y bloqueo del scroll de fondo.
- `features/access/`: selección de perfil y acceso visual.
- `features/members/`: tabla, búsqueda y consulta de clientes para recepción y entrenador.
- `features/overview/`: métricas, gráfico de barras accesible y actividad del administrador.
- `features/training/`: rutina del socio y detalles de ejercicios y notas.
- `mocks/`: tipos, perfiles, cinco socios, dos ejercicios, una rutina, notas y resumen mensual.

Las páginas componen contenido y mantienen metadatos propios. Los componentes de cliente se limitan a navegación e interacciones. No hay proveedor global de estado porque las consultas no modifican entidades compartidas. No hay servicios HTTP ficticios, tokens, cookies, almacenamiento de credenciales ni persistencia de datos personales.

## Datos e interacciones

Los nombres proceden del contenido ficticio de Figma y los correos utilizan `example.test`. Los IDs son estables. La fecha de referencia es `2026-12-07`; evita que fechas relativas y vencimientos cambien según el dispositivo o la fecha de ejecución. Cuatro socios pertenecen al entrenador de demostración; el quinto permite comprobar que el filtro por asignación funciona.

La rutina y sus notas utilizan los mismos IDs de socio que las consultas del entrenador. Las ocho tarjetas reproducen las posiciones del frame y representan prescripciones de dos ejercicios, sin duplicar sus descripciones. La búsqueda normaliza mayúsculas y tildes, funciona en memoria y contempla resultados vacíos.

Clientes activos, nuevas membresías y próximos vencimientos se derivan de los socios. El ingreso del mes coincide con diciembre de la serie mensual; los importes de ejemplo se almacenan en céntimos. No se crean miles de entidades para reproducir contadores ilustrativos de Figma. El gráfico incluye una tabla equivalente para tecnologías de asistencia.

## Referencia visual y recursos

Referencia: [Imperium Cross en Figma](https://www.figma.com/design/5EPZT22l83oUzSrBw33zgt/Imperium-Cross?node-id=1-5). Frames principales: `88:188`, `99:981`, `8:447`, `36:80`, `36:109` y `36:135`. Detalles: `97:686`, `95:546` y `93:494`.

Los recursos de `public/dashboard/` proceden del contexto de diseño de esos frames. Los logos se reutilizan desde `public/landing/` tras comprobar que los archivos son idénticos. No hay URLs temporales de Figma en el código. Los recortes de ejercicios se conservan como metadatos; las imágenes con `fill` reciben sus dimensiones desde un contenedor.

La ilustración de press de banca es el PNG animado original de Figma. Se sirve sin optimización para conservar su animación; sus fotogramas pueden variar entre capturas.

Se mantienen Inter, degradado rojo, sidebar de 233 px, cabecera de 121 px y dimensiones principales de escritorio. Se añaden tokens internos sin cambiar los valores de la landing. Los datos, fechas e indicadores varían respecto de los ejemplos incoherentes del diseño para mantener relaciones consistentes.

No se proporcionaron frames internos móviles. En tablet y móvil se utiliza un sidebar modal, tarjetas reorganizadas y desplazamiento horizontal contenido dentro de las tablas. Los destinos pendientes del sidebar y las acciones de edición aparecen deshabilitados, sin rutas inexistentes. La cabecera permite cambiar de perfil y regresar al acceso; el icono de notificaciones es decorativo porque su panel no está definido.

La consulta de recepción reutiliza el detalle de socio ya diseñado para el entrenador. Para el remo se aplica el patrón del detalle de ejercicio con texto ficticio específico. Estas adaptaciones no incorporan pantallas nuevas ni operaciones de gestión.

## Verificación y siguientes entregas

Ejecutar formato, ESLint, TypeScript, build y `git diff --check`. Revisar en navegador login, selección y cambio de perfiles, búsquedas, aislamiento de clientes asignados, detalles, Escape, Tab, foco de retorno, sidebar y recursos a 320, 390, 768, 1024 y 1440 px. Comprobar también la landing y el recorrido de inscripción existentes.

La revisión de esta entrega se ejecutó sobre producción local en Chrome aislado: 25 combinaciones de ruta/resolución, 45 recorridos de inscripción pública y capturas de la landing en las cinco anchuras. También se comprobaron Mayús+Tab, cierre por botón y fondo, retorno del foco, cierre del sidebar al pasar a escritorio y búsqueda con tildes. No se detectaron errores de ejecución o hidratación, imágenes rotas, desbordamiento horizontal de página ni transmisiones de datos personales. Las tablas conservan desplazamiento horizontal dentro de su región. No se realizaron pruebas en dispositivos físicos ni con lectores de pantalla.

Quedan pendientes recuperación de contraseña, administración completa, asignaciones editables, membresías y pagos, asistencia, ventas, editor de rutinas, registro de seguimiento, perfil y pagos del socio y NutrIA. No se implementan backend, autenticación real, base de datos, correo ni procesamiento de pagos.
