# Frontend interno

Prototipo para un único gimnasio. Incluye las páginas internas de los cuatro perfiles del diseño. 

El recuento corresponde a los archivos `page.tsx` de `app/(interno)`: 5 páginas de administrador, 4 de recepción, 4 de entrenador y 4 de socio. `/login` es una ruta de acceso adicional; la landing pública tampoco forma parte del recuento interno.

## Acceso y navegación

`/login` acepta usuario o correo y una contraseña pública de prueba. Rechaza combinaciones incorrectas y lleva a la página inicial del perfil correspondiente. Las cuentas se muestran en el desplegable «Cuentas de demostración» del login:

| Perfil        | Usuario              | Contraseña de prueba |
| ------------- | -------------------- | -------------------- |
| Administrador | `lin.admin`          | `Imperium-demo`      |
| Recepción     | `milagros.recepcion` | `Imperium-demo`      |
| Entrenador    | `pedro.entrenador`   | `Imperium-demo`      |
| Socio         | `melani.cliente`     | `Imperium-demo`      |

Estas cadenas son fixtures públicos, no secretos ni credenciales reales. No introducir cuentas personales. No se guardan contraseñas, cookies, tokens ni sesiones. Los registros de personal creados desde Usuarios no crean cuentas de acceso. La cabecera permite salir al login; no permite saltar directamente entre perfiles.

Las rutas siguen abiertas y pueden visitarse por URL: el formulario organiza el recorrido de demostración y no proporciona seguridad. La autenticación y los permisos deberán implementarse en servidor en otra etapa.

| Perfil        | Rutas y contenido                                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Administrador | `/admin`: resumen; `/admin/usuarios`: personal; `/admin/clientes`: socios y entrenador asignado; `/admin/membresias`: planes; `/admin/productos`: inventario.                            |
| Recepción     | `/recepcion/clientes`: socios; `/recepcion/membresias`: matrículas, renovaciones y registros de pago; `/recepcion/asistencia`: ingresos; `/recepcion/productos`: catálogo y venta local. |
| Entrenador    | `/entrenador/clientes`: socios asignados; `/entrenador/ejercicios`: biblioteca; `/entrenador/rutinas`: creación y asignación; `/entrenador/seguimiento`: notas.                          |
| Socio         | `/socio/mi-rutina`: ejercicios y notas; `/socio/perfil`: datos, membresía y asistencia; `/socio/productos`: consulta; `/socio/pagos`: renovación e historial.                            |

## Organización y estado

Los grupos `(acceso)` e `(interno)` organizan rutas y layouts. `DashboardShell` selecciona el menú por el prefijo de la ruta y señala el enlace activo. No deriva permisos de esa selección.

- `components/dashboard/`: shell, tablas, búsqueda, estados, formularios y acciones compartidas.
- `components/ui/dialog.tsx`: diálogo nativo con Escape, cierre exterior, foco inicial, retorno al origen y bloqueo del scroll de fondo.
- `features/access/`: formulario de acceso ficticio.
- `features/administration/`, `features/members/`, `features/products/` y `features/training/`: páginas e interacciones por funcionalidad.
- `features/demo/`: contexto React que comparte el escenario entre páginas y perfiles. Está en el layout raíz para conservar cambios al salir al login y entrar con otra cuenta de prueba.
- `mocks/`: entidades tipadas y datos iniciales relacionados mediante IDs.


## Interacciones

Administración permite crear, consultar, editar y eliminar personal, clientes y productos del escenario. Los planes se crean, editan y activan o desactivan; no se eliminan. Los planes inactivos no están disponibles para nuevas matrículas. La asignación del entrenador se realiza desde la edición del cliente.

Recepción prepara registros pendientes o pagados de prueba y renovaciones. La asistencia comprueba membresía activa, pendiente o vencida y evita duplicar un ingreso en la misma fecha de prueba. La venta controla unidades disponibles, calcula el total y actualiza el stock local al confirmarse.

El entrenador consulta sus clientes, administra ejercicios, crea rutinas con series, repeticiones y descanso, y las asigna a sus socios. Las notas se crean o editan con fecha y texto. La rutina y el progreso del socio reflejan esos cambios al navegar sin recargar.

El socio consulta su perfil, asistencia, catálogo e historial. La renovación actualiza solo el escenario local. Los comprobantes descargables son archivos de texto marcados como ejemplos sin validez fiscal.

Los importes se guardan en céntimos. La fecha del escenario es `2026-12-07`, independiente del reloj del equipo. Los ingresos mensuales y la actividad inicial del dashboard son agregados ilustrativos; los contadores de socios se derivan del estado compartido.

## Referencia y adaptaciones

Referencia: [Imperium Cross en Figma](https://www.figma.com/design/5EPZT22l83oUzSrBw33zgt/Imperium-Cross?node-id=1-5).

Se consultaron las páginas de administración `39:270`, `67:345`, `39:598`, `39:722`; recepción `36:80`, `42:1011`, `73:369`, `73:598`; entrenamiento `36:109`, `74:962`, `74:1350`, `74:1584`; socio `36:135`, `76:1885`, `78:2172`, `344:21`; login `88:188` y sus grupos de contenido. Se revisaron también los formularios y detalles de esas entidades. Los recursos originales se sirven desde `public/dashboard/`; los logos se reutilizan desde `public/landing/`. No hay URLs temporales de Figma en ejecución.

Se conservan Inter, degradado rojo, sidebar de 233 px y cabecera de 121 px. Los recortes de imágenes se expresan en contenedores dimensionados; `Image` con `fill` no recibe `style.width`. Los ejercicios animados se sirven sin optimización.


## Verificaciones

Ejecutar `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run build` y `git diff --check`. Revisar en navegador las rutas, credenciales correctas e incorrectas, menús por perfil, búsquedas, operaciones locales, asignaciones y notas compartidas, membresías, asistencia, stock, descargas, diálogos y navegación móvil. Comprobar también la landing y su inscripción.

En la revisión previa se comprobaron las rutas de login y las páginas internas en Chrome aislado a 320, 390, 768, 1024 y 1440 px, sin errores de ejecución, hidratación, imágenes rotas ni desbordamiento de página. Se verificaron cuentas válidas e inválidas, edición y eliminación de personal, creación de planes y productos, estado compartido entre perfiles, asignación de rutinas, notas, asistencia duplicada y pendiente, matrícula y stock. También se revisaron diálogos móviles, carga de imagen local, comprobante descargable y las 45 combinaciones del recorrido público de inscripción, sin transmisiones de datos de formularios. Se inspeccionaron capturas de escritorio y móvil. No se probaron dispositivos físicos ni lectores de pantalla.

En el cierre del PR se repitieron las 18 rutas actuales (login y 17 páginas internas) a 390 y 1440 px: 36 combinaciones. Se comprobaron nuevamente las cuatro cuentas, credenciales incorrectas, salida al login, operaciones locales de administración, rutinas y notas compartidas entre perfiles, matrículas, asistencia y stock. La inscripción pública pasó sus 45 combinaciones de plan, método y anchura con los textos manuales conservados. No se detectaron errores de ejecución, hidratación, recursos fallidos ni transmisiones de formularios. Se verificó también que el icono global servido desde `app/icon.png` coincide con el logo original de Imperium Cross en landing, login y panel. Las comprobaciones previas de tablet y de los demás diálogos no se repitieron porque su implementación no cambió.
