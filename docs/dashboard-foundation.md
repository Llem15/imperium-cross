# Frontend interno

Prototipo para un único gimnasio. Incluye las páginas internas de los cuatro perfiles del diseño.

El recuento corresponde a los archivos `page.tsx` de `app/(interno)`: 8 páginas de administrador, 4 de recepción, 4 de entrenador y 4 de socio. `/login` es una ruta de acceso adicional; la landing pública tampoco forma parte del recuento interno.

## Acceso y navegación

`/login` acepta usuario o correo y una contraseña pública. Rechaza combinaciones incorrectas y lleva a la página inicial del perfil correspondiente. Las cuentas no se muestran en el login:

| Perfil        | Usuario              | Contraseña      |
| ------------- | -------------------- | --------------- |
| Administrador | `lin.admin`          | `Imperium-demo` |
| Recepción     | `milagros.recepcion` | `Imperium-demo` |
| Entrenador    | `pedro.entrenador`   | `Imperium-demo` |
| Socio         | `melani.cliente`     | `Imperium-demo` |

Estas cadenas son fixtures públicos, no secretos ni credenciales reales. No introducir cuentas personales. No se guardan contraseñas, cookies, tokens ni sesiones. Los registros de personal creados desde Usuarios no crean cuentas de acceso. La cabecera permite salir al login; no permite saltar directamente entre perfiles.

Las rutas siguen abiertas y pueden visitarse por URL: el formulario organiza el recorrido de demostración y no proporciona seguridad. La autenticación y los permisos deberán implementarse en servidor en otra etapa.

| Perfil        | Rutas y contenido                                                                                                                                                                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Administrador | `/admin`: resumen; `/admin/usuarios`: personal; `/admin/clientes`: socios y entrenador asignado; `/admin/membresias`: planes; `/admin/matriculas`: matrículas y pagos; `/admin/horarios`: turnos de entrenadores; `/admin/reservas`: agenda recurrente, cambio de horario y cancelación; `/admin/productos`: inventario. |
| Recepción     | `/recepcion/clientes`: socios; `/recepcion/membresias`: matrículas, renovaciones y registros de pago; `/recepcion/asistencia`: ingresos; `/recepcion/productos`: catálogo y venta local.                                                                                                                                 |
| Entrenador    | `/entrenador/clientes`: socios asignados; `/entrenador/ejercicios`: biblioteca; `/entrenador/rutinas`: creación y asignación; `/entrenador/seguimiento`: notas.                                                                                                                                                          |
| Socio         | `/socio/mi-rutina`: ejercicios y notas; `/socio/perfil`: datos, membresía y asistencia; `/socio/productos`: consulta; `/socio/pagos`: renovación e historial.                                                                                                                                                            |

## Organización y estado

Los grupos `(acceso)` e `(interno)` organizan rutas y layouts. `DashboardShell` selecciona el menú por el prefijo de la ruta y señala el enlace activo. No deriva permisos de esa selección.

- `components/dashboard/`: shell, tablas, búsqueda, estados, formularios y acciones compartidas.
- `components/ui/dialog.tsx`: diálogo nativo con Escape, cierre exterior, foco inicial, retorno al origen y bloqueo del scroll de fondo.
- `features/access/`: formulario de acceso ficticio.
- `features/administration/`, `features/members/`, `features/products/` y `features/training/`: páginas e interacciones por funcionalidad.
- `features/demo/`: contexto React que comparte el escenario entre páginas y perfiles. Está en el layout raíz para conservar cambios al salir al login y entrar con otra cuenta.
- `features/members/api-client-list.tsx`: listado de socios de administración y recepción, alimentado por `GET /api/clientes`; el formulario crea y edita datos personales. Administración puede desactivar sin borrar el historial.
- `features/members/plans-manager.tsx`: catálogo de planes de Administración conectado a SQL Server; permite consultar, crear, editar y desactivar planes sin borrar matrículas ni pagos.
- `features/scheduling/trainer-schedule-manager.tsx`: turnos recurrentes de entrenadores editables desde Administración; muestra usuarios activos con rol Entrenador y permite configurar lunes a sábado.
- `features/scheduling/training-reservation-manager.tsx`: agenda de Administración conectada a `/api/reservas`; crea reservas recurrentes, muestra el entrenador asignado y permite cambiar horario cuando el periodo del plan lo permite o cancelar la recurrencia.
- `features/members/attendance-page.tsx`: asistencia de Recepción conectada a SQL Server; permite consultar por fecha y registrar ingresos solo con membresía activa y pago confirmado, evitando duplicados diarios.
- `features/products/inventory-manager.tsx`: inventario de Administración conectado a SQL Server; permite consultar, crear, editar stock y desactivar productos sin borrar su historial.
- `backend/src/main/java/com/imperiumcross/backend/training/`: endpoints SQL para ejercicios y rutinas; al guardar el objetivo del cliente, busca una rutina activa con ese objetivo y asigna un entrenador por menor carga. Requiere `10_ClienteObjetivoEntrenador.sql` de `C:\Users\Ariana\Documents\INTEGRADORII-BD`.
- `backend/src/main/java/com/imperiumcross/backend/scheduling/`: API de turnos semanales y reservas recurrentes con sesiones fechadas; requiere los scripts 10, 11 y 12 de `C:\Users\Ariana\Documents\INTEGRADORII-BD`. La API comprueba disponibilidad, asigna entrenador al reservar y cambiar el horario, aplica los periodos del plan y conserva las sesiones pasadas al cambiar o cancelar.
- `features/members/membership-management.tsx`: matrículas de recepción conectadas a SQL Server; crea membresías y pagos pendientes, confirma pagos, permite cambiar de plan (inmediato solo si no está pagada o programado al vencimiento si ya está pagada) y cancela registros no pagados anulando su pago. Conserva el historial; la baja de membresías pagadas espera un flujo de reembolso.
- `backend/`: API Java/Spring Boot con Gradle y driver JDBC de SQL Server. Usa `Cliente`, `Usuario`, `Membresia` y `PlanMembresia`; conserva el esquema existente y escucha en localhost mientras no haya autenticación.
- `mocks/`: entidades tipadas y datos iniciales relacionados mediante IDs.

## Interacciones

Administración permite crear, consultar, editar y eliminar personal del escenario. El inventario de productos se consulta y edita mediante la API, y la baja de producto es lógica para preservar futuras ventas. Los clientes se consultan y crean/editan mediante la API. La baja es lógica para preservar pagos y membresías. El catálogo administrativo de planes usa SQL; los cambios de nombre se bloquean cuando el plan ya tiene matrículas para conservar su referencia histórica. El objetivo del cliente y el entrenador de rutina se persisten mediante la API y requieren el script `10_ClienteObjetivoEntrenador.sql` de `C:\Users\Ariana\Documents\INTEGRADORII-BD`.

La pantalla de clientes de recepción consulta y permite crear/editar mediante la API. Matrículas y pagos, disponible para administración y recepción, registra y cambia planes, cancela matrículas no pagadas y confirma pagos en SQL Server. Administración → Membresías gestiona el catálogo SQL, incluidos límites horarios por plan. Administración → Horarios configura turnos recurrentes del personal de lunes a sábado. Administración → Reservas ofrece disponibilidad de sesiones de 60 minutos, crea la recurrencia con entrenador asignado automáticamente, permite cambiarla al cumplirse el periodo del plan (Básico fijo, Premium 15 días, Pro 7 días) y cancela futuras sesiones conservando el historial. La interfaz es administrativa: no debe habilitarse al socio hasta implementar autenticación real y autorización por cliente. El punto de venta todavía opera en el escenario local: no crea ventas en la base ni actualiza el inventario SQL porque falta autenticación para identificar al cajero. La página de rutinas del entrenador consulta y modifica rutinas/ejercicios asignados en SQL; al guardar el objetivo del cliente, la API busca la rutina activa correspondiente y asigna un entrenador según la menor cantidad de asignaciones activas, sin comprobar disponibilidad horaria. La biblioteca de ejercicios, seguimiento y portal del socio continúan con datos de demostración. Los comprobantes de otras pantallas aún son PDF ficticios generados en el navegador.

El entrenador consulta sus clientes, administra ejercicios, crea rutinas con series, repeticiones y descanso, y las asigna a sus socios. Las notas se crean o editan con fecha y texto. La rutina y el progreso del socio reflejan esos cambios al navegar sin recargar.

El socio consulta su perfil, asistencia, catálogo e historial. La renovación actualiza solo el escenario local. Los comprobantes descargables son PDF ficticios generados en el navegador con `jspdf`, sin enviar datos a ningún servidor; la librería, el logo y las fuentes de `public/fonts/` se cargan solo al descargar.

Los importes se guardan en céntimos. La fecha del escenario es `2026-12-07`, independiente del reloj del equipo. Los ingresos mensuales y la actividad inicial del dashboard son agregados ilustrativos; los contadores de socios se derivan del estado compartido.

## Referencia y adaptaciones

Referencia: [Imperium Cross en Figma](https://www.figma.com/design/5EPZT22l83oUzSrBw33zgt/Imperium-Cross?node-id=1-5).

Se consultaron las páginas de administración `39:270`, `67:345`, `39:598`, `39:722`; recepción `36:80`, `42:1011`, `73:369`, `73:598`; entrenamiento `36:109`, `74:962`, `74:1350`, `74:1584`; socio `36:135`, `76:1885`, `78:2172`, `344:21`; login `88:188` y sus grupos de contenido. Se revisaron también los formularios y detalles de esas entidades. Los recursos originales se sirven desde `public/dashboard/`; los logos se reutilizan desde `public/landing/`. No hay URLs temporales de Figma en ejecución.

Se conservan Inter, degradado rojo, sidebar de 233 px y cabecera de 121 px. Los recortes de imágenes se expresan en contenedores dimensionados; `Image` con `fill` no recibe `style.width`. Los ejercicios animados se sirven sin optimización.

## Verificaciones

Ejecutar `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run build` y `git diff --check`. Revisar en navegador las rutas, credenciales correctas e incorrectas, menús por perfil, búsquedas, operaciones locales, asignaciones y notas compartidas, membresías, asistencia, stock, descargas, diálogos y navegación móvil. Comprobar también la landing y su inscripción.

En la revisión previa se comprobaron las rutas de login y las páginas internas en Chrome aislado a 320, 390, 768, 1024 y 1440 px, sin errores de ejecución, hidratación, imágenes rotas ni desbordamiento de página. Se verificaron cuentas válidas e inválidas, edición y eliminación de personal, creación de planes y productos, estado compartido entre perfiles, asignación de rutinas, notas, asistencia duplicada y pendiente, matrícula y stock. También se revisaron diálogos móviles, carga de imagen local, comprobante descargable y las 45 combinaciones del recorrido público de inscripción, sin transmisiones de datos de formularios. Se inspeccionaron capturas de escritorio y móvil. No se probaron dispositivos físicos ni lectores de pantalla.

En una validación anterior se recorrieron 18 rutas (login y 17 páginas internas, antes de agregar `/admin/reservas`) a 390 y 1440 px: 36 combinaciones. Se comprobaron las cuatro cuentas, operaciones locales de administración, rutinas y notas compartidas, matrículas, asistencia y stock. La inscripción pública pasó sus 45 combinaciones de plan, método y anchura. Esa revisión no cubre la nueva agenda de reservas; para cambios posteriores se debe volver a probar la ruta `/admin/reservas` y sus flujos contra SQL Server con los scripts aplicados.
