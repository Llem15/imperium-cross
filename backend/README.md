# Backend de Imperium Cross

API Java 17 con Spring Boot y Gradle, basada en el proyecto `backend` compartido. Usa Spring MVC, JDBC y el driver JDBC de Microsoft para SQL Server.

## Requisitos

- JDK 17
- Gradle 9.8.2 (o usa el wrapper `gradlew.bat` incluido)
- SQL Server accesible desde el proceso de Spring Boot

## Configuración local en PowerShell

Configura las variables en la terminal o en la configuración de ejecución del IDE. No pongas credenciales en el código ni en variables `NEXT_PUBLIC_*`.

```powershell
$env:DB_URL = "jdbc:sqlserver://localhost:1433;databaseName=Imperiumcross-bd;encrypt=true;trustServerCertificate=true"
$env:DB_USERNAME = "usuario_de_aplicacion"
$env:DB_PASSWORD = "contraseña_local"
$env:APP_CORS_ALLOWED_ORIGINS = "http://localhost:3000"
.\gradlew.bat bootRun
```

La URL de ejemplo presupone SQL Server escuchando en el puerto TCP 1433. Ajusta host, puerto, instancia y autenticación a la instalación local. `trustServerCertificate=true` es solo para desarrollo local; en producción configura TLS con un certificado de confianza. Usa un login dedicado de SQL Server con permisos mínimos, no `sa`.

## Protección de endpoints

La API usa Spring Security con autenticación HTTP Basic: cada solicitud protegida debe incluir una cuenta activa de `dbo.Usuario`, usando su correo y contraseña. El backend obtiene el rol desde `dbo.Rol`; no se añade un endpoint de inicio de sesión ni se crea una sesión web. Usa esta configuración solo sobre `localhost` o detrás de HTTPS; HTTP Basic envía las credenciales en cada solicitud.

Los usuarios semilla existentes pueden tener la contraseña guardada en texto plano, mientras que las cuentas nuevas usan BCrypt. Para permitir la transición, la primera autenticación correcta de una contraseña antigua actualiza `dbo.Usuario.contrasena` a un hash BCrypt. **Este es el único cambio de datos que hace la seguridad**: actualiza una fila existente al iniciar sesión, no crea tablas ni columnas y no requiere ejecutar scripts SQL. Anota este comportamiento al probarlo con la base compartida. No se registran contraseñas en logs.

`GET /actuator/health` es público y solo devuelve el estado. Los demás endpoints no declarados se deniegan.

| Operación | Roles permitidos |
| --- | --- |
| Consultar ejercicios, planes y productos | Administrador, Recepción, Entrenador y Cliente |
| Consultar, crear o editar clientes | Administrador y Recepción |
| Desactivar clientes | Administrador |
| Consultar y gestionar matrículas, pagos y asistencia | Administrador y Recepción |
| Crear, editar o desactivar planes y productos | Administrador |
| Consultar rutinas y ejercicios | Administrador y Entrenador |
| Crear rutinas | Administrador y Entrenador |
| Editar o desactivar rutinas | Administrador; Entrenador solo si la rutina no está asignada a clientes de otros entrenadores |
| Gestionar horarios y reservas | Administrador |

La respuesta para una solicitud sin credenciales válidas es `401`; si la cuenta está autenticada pero su rol no tiene permiso, es `403`. El entrenador solo recibe nombres de clientes asignados a él en `GET /api/rutinas`. Las reservas siguen limitadas a Administración porque sus operaciones aceptan IDs de membresía/reserva sin comprobar propiedad de socio; no se deben habilitar para Cliente hasta implementar esa comprobación.

La interfaz Next.js todavía usa un login de demostración y no envía credenciales HTTP Basic. Por eso, las pantallas conectadas a la API recibirán `401` hasta que se integre una autenticación real en el frontend. Para comprobar esta fase, usa un cliente API como Postman: selecciona **Basic Auth**, introduce el correo y la contraseña de una cuenta de la base, y prueba los roles permitidos y denegados. La configuración no modifica el esquema SQL.

`src/main/resources/application.properties` limita el servidor a `127.0.0.1` por defecto. `SERVER_ADDRESS` permite cambiarlo explícitamente; no expongas la API en una red ni en producción sin TLS.

Para permitir el CRUD de clientes y registrar/confirmar pagos, el usuario SQL de la aplicación necesita lectura de roles/clientes/membresías/planes/pagos y escritura en `Usuario`, `Cliente`, `Membresia` y `Pago`:

```sql
USE [Imperiumcross-bd];
GO
GRANT SELECT ON OBJECT::dbo.Rol TO [ic_app];
GRANT SELECT ON OBJECT::dbo.Usuario TO [ic_app];
GRANT SELECT ON OBJECT::dbo.Cliente TO [ic_app];
GRANT SELECT ON OBJECT::dbo.Membresia TO [ic_app];
GRANT SELECT, INSERT, UPDATE ON OBJECT::dbo.PlanMembresia TO [ic_app];
GRANT SELECT, INSERT, UPDATE, DELETE ON OBJECT::dbo.HorarioEntrenador TO [ic_app];
GRANT SELECT, INSERT, UPDATE ON OBJECT::dbo.ReservaEntrenamiento TO [ic_app];
GRANT SELECT, INSERT, UPDATE ON OBJECT::dbo.SesionEntrenamiento TO [ic_app];
GRANT INSERT ON OBJECT::dbo.Usuario TO [ic_app];
GRANT INSERT ON OBJECT::dbo.Cliente TO [ic_app];
GRANT UPDATE ON OBJECT::dbo.Usuario TO [ic_app];
GRANT UPDATE ON OBJECT::dbo.Cliente TO [ic_app];
GRANT INSERT ON OBJECT::dbo.Membresia TO [ic_app];
GRANT UPDATE ON OBJECT::dbo.Membresia TO [ic_app];
GRANT SELECT ON OBJECT::dbo.Pago TO [ic_app];
GRANT INSERT ON OBJECT::dbo.Pago TO [ic_app];
GRANT UPDATE ON OBJECT::dbo.Pago TO [ic_app];
GRANT SELECT, INSERT ON OBJECT::dbo.Asistencia TO [ic_app];
GRANT SELECT, INSERT, UPDATE ON OBJECT::dbo.Producto TO [ic_app];
GRANT SELECT, INSERT, UPDATE ON OBJECT::dbo.Inventario TO [ic_app];
GRANT SELECT, INSERT, UPDATE, DELETE ON OBJECT::dbo.Rutina TO [ic_app];
GRANT SELECT, INSERT, UPDATE, DELETE ON OBJECT::dbo.DetalleRutina TO [ic_app];
GRANT SELECT ON OBJECT::dbo.Ejercicio TO [ic_app];
GRANT SELECT, INSERT, UPDATE ON OBJECT::dbo.AsignacionRutina TO [ic_app];
GO
```

Ejecuta estos `GRANT` como administrador de SQL Server en SSMS; no cambian tablas ni datos. Los scripts SQL se mantienen en `C:\Users\Ariana\Documents\INTEGRADORII-BD`, fuera del proyecto visual. En SSMS, ejecuta en este orden `10_ClienteObjetivoEntrenador.sql`, `11_AgendaEntrenadores.sql` y `12_ReservasEntrenamiento.sql`, después de crear la base y sus tablas con los scripts anteriores. El paso 10 agrega el objetivo del cliente y el entrenador de rutina; el 11 agrega reglas horarias a los planes y crea `HorarioEntrenador`; el 12 crea las reservas recurrentes, las sesiones fechadas y los índices contra dobles reservas. Estos archivos solo preparan cambios: deben abrirse y ejecutarse explícitamente en SSMS. No asignes `db_owner`.

Por defecto, la API solo escucha en `127.0.0.1`, ya que todavía no tiene autenticación. No cambies `SERVER_ADDRESS` a una interfaz de red ni expongas el servicio hasta implementar autenticación y autorización.

## Comprobación

Con la API en ejecución:

```powershell
Invoke-RestMethod http://localhost:8080/actuator/health
```

`UP` indica que la aplicación y su conexión JDBC están disponibles. El endpoint de salud no expone detalles internos.

## Lectura de clientes

`GET http://localhost:8080/api/clientes` devuelve clientes con sus datos de usuario y la membresía más reciente, si existe. `GET /api/planes` devuelve los planes con descripción, precio, duración, horas de entrenamiento semanales y periodo de cambio de horario. Administración puede crear planes con `POST /api/planes` y editarlos o desactivarlos con `PUT /api/planes/{id}`. Los planes se desactivan en vez de eliminarse; si un plan ya tiene matrículas asociadas, no se puede renombrar. Cambiar precio, duración o reglas de entrenamiento no modifica importes ni fechas guardados en membresías existentes. La pantalla Agregar/Editar cliente solo administra datos personales; las membresías y sus pagos se registran desde Matrículas.

`POST /api/clientes` crea un usuario con rol `Cliente` y su registro de cliente en una transacción. Genera un secreto aleatorio que no se muestra ni se envía, y guarda su hash BCrypt como valor temporal hasta implementar el envío seguro de credenciales. La cuenta creada todavía no puede iniciar sesión. `PUT /api/clientes/{id}` actualiza datos personales. `DELETE /api/clientes/{id}` desactiva usuario y cliente sin borrar su historial. DNI y correo duplicados se rechazan.

`GET /api/membresias` lista membresías con su pago más reciente, `POST /api/membresias` crea una membresía nueva y un pago Pendiente usando el precio oficial del plan, y `POST /api/pagos/{id}/confirmar` marca un pago pendiente como Pagado y activa su membresía dentro de una transacción. Si el inicio es futuro, confirmar el pago deja la membresía como Programada hasta su fecha de inicio.

`PUT /api/membresias/{id}/cambiar-plan` registra un plan nuevo sin borrar el historial. Acepta `idPlan`, `metodoPago` y `vigencia` (`Inmediato` o `AlVencimiento`). El cambio inmediato anula el pago pendiente y cancela el registro anterior antes de crear la nueva membresía y su pago pendiente; no se permite si el pago anterior ya fue Pagado. Para membresías pagadas solo se puede programar el plan nuevo para el día posterior al vencimiento actual. `POST /api/membresias/{id}/cancelar` cancela una membresía no pagada y anula su pago pendiente. Una membresía pagada no puede darse de baja hasta gestionar un reembolso por separado; la API no procesa reembolsos.

`GET /api/asistencias?fecha=YYYY-MM-DD` lista los ingresos de esa fecha. `POST /api/asistencias` recibe `idCliente`, registra la hora del servidor y rechaza clientes inactivos, membresías sin pago confirmado o fuera de vigencia, y segundos ingresos del mismo día. El registro y la validación de duplicados ocurren en una transacción serializable.

`GET /api/productos` devuelve el catálogo junto con el stock y el mínimo de inventario. `POST /api/productos` crea el producto y su fila de inventario dentro de una transacción; `PUT /api/productos/{id}` actualiza ambos y `DELETE /api/productos/{id}` desactiva el producto sin borrarlo. El inventario administrativo está conectado; el punto de venta permanece en demostración porque aún no hay autenticación para identificar con seguridad al usuario que realiza una venta. El esquema actual no almacena imágenes ni movimientos de stock.

`GET /api/ejercicios` lista los ejercicios activos. `GET /api/rutinas` lista rutinas con sus ejercicios y clientes. `POST /api/rutinas` crea una rutina con objetivo y ejercicios; `PUT /api/rutinas/{id}` la actualiza y `DELETE /api/rutinas/{id}` la desactiva. Los detalles admiten series y repeticiones o una duración, para conservar ejercicios por tiempo como la plancha. Al crear un cliente o cambiar su objetivo, se busca la rutina activa de ese objetivo y se asigna un entrenador activo con menos asignaciones vigentes. Si no existe esa rutina o no hay entrenadores activos, la operación se rechaza. Esa asignación de rutina sigue distribuyéndose por carga, no por disponibilidad horaria.

`GET /api/horarios/entrenadores` devuelve entrenadores activos y sus turnos recurrentes. `PUT /api/horarios/entrenadores/{idEntrenador}` reemplaza sus turnos semanales; admite lunes a sábado, rechaza intervalos invertidos y turnos que se superponen, y deja el domingo libre. Administración configura horarios en `/admin/horarios`.

El backend de reservas requiere el script `12_ReservasEntrenamiento.sql`:

- `GET /api/reservas/disponibilidad/{idMembresia}` calcula horarios de 60 minutos disponibles para las ocurrencias futuras que quedan en la membresía. Devuelve también el límite semanal y cuántas reservas recurrentes quedan permitidas.
- `POST /api/reservas` recibe `idMembresia`, `diaSemana` (1=lunes a 6=sábado) y `horaInicio`. El servidor valida membresía pagada/vigente y cliente activo, vuelve a comprobar disponibilidad dentro de una transacción serializable, asigna automáticamente un entrenador con turno libre y crea una ocurrencia fechada por cada semana restante.
- `GET /api/reservas` lista las reservas para administración. `GET /api/reservas/{idReserva}/disponibilidad-cambio` comprueba si el plan permite cambiar y devuelve nuevos horarios libres. `PUT /api/reservas/{idReserva}` cambia el día/hora recurrente, reasigna automáticamente un entrenador y reemplaza solo las sesiones futuras; las sesiones pasadas se conservan. `DELETE /api/reservas/{idReserva}` cancela la recurrencia y sus sesiones futuras.

La creación y el cambio están protegidos contra concurrencia con un bloqueo transaccional de agenda y restricciones únicas en SQL Server. Administración gestiona las reservas desde `/admin/reservas`. El login del frontend sigue siendo demostrativo y no autentica frente al backend: no se debe permitir a socios acceder ni exponer la API hasta añadir autenticación/autorización real; la API sigue ligada a localhost.

El vencimiento se calcula con `fecha_inicio + duracion_dias`; cada renovación o cambio de plan crea un registro nuevo, preservando el historial. Los métodos admitidos son Yape, Tarjeta y Efectivo. Los pagos pendientes se confirman después del cobro presencial/verificado; esta API no procesa cargos bancarios. La gestión conectada está disponible en Matrículas y pagos para recepción y administración. Administración → Membresías gestiona el catálogo SQL de planes.

El frontend consume estos endpoints en clientes de administración/recepción y Matrículas y pagos de administración/recepción. Puede definir `NEXT_PUBLIC_API_BASE_URL` al iniciar Next.js si la API no está en `http://localhost:8080`.

## Alcance actual y siguiente paso

Los endpoints operan sobre las tablas existentes `Rol`, `Usuario`, `Cliente`, `Membresia`, `PlanMembresia`, `Pago`, `Asistencia`, `Producto`, `Inventario`, `Rutina`, `DetalleRutina`, `Ejercicio` y `AsignacionRutina`, más las columnas y tablas añadidas por los scripts 10, 11 y 12. Antes de dar acceso a clientes reales, implementar flujo de invitación/recuperación y autenticación compatible con BCrypt: los usuarios semilla actuales contienen contraseñas de demostración en texto plano, mientras los nuevos se guardan con hash.

La carpeta `INTEGRADORII-BD` contiene el DDL; `01_CrearBd.sql` crea la base `Imperiumcross-bd`. La configuración de ejemplo apunta a esa base. Verifica que la base esté creada y que el usuario de aplicación tenga permisos de lectura antes de iniciar la API.

## Planes oficiales

El catálogo oficial usa Plan Básico (S/ 39.99), Plan Premium (S/ 69.99) y Plan Pro (S/ 99.99), todos por 30 días. El paso `04_datosMembresiasPagos.sql` de la carpeta de scripts SQL mantiene ese catálogo para instalaciones de demostración nuevas.

La autenticación y autorización aún no están implementadas. No expongas la API a usuarios reales hasta añadirlas y validar permisos en el servidor.

-------implementaciones nuevas--------

- Se añadió Spring Security con autenticación HTTP Basic sin estado. Las rutas de API requieren credenciales y permisos según el rol; las solicitudes a rutas no reconocidas se deniegan. El endpoint de salud queda público.
- Los usuarios y roles se validan contra las tablas existentes de la base de datos. Se admiten contraseñas BCrypt y se convierten a BCrypt al iniciar sesión las cuentas semilla que aún tengan contraseña en texto plano. Esta conversión actualiza el registro del usuario; no crea ni modifica tablas.
- Se aplicaron restricciones por rol a las operaciones de usuarios, clientes, membresías, pagos, asistencia, productos, rutinas y horarios. El entrenador solo consulta clientes asignados a él y no puede modificar rutinas asignadas a clientes de otros entrenadores.
- Se configuró CORS para la API y el servidor escucha en `127.0.0.1` por defecto, configurable mediante `SERVER_ADDRESS`. El frontend aún no envía HTTP Basic; la integración y las pruebas con la base de datos real quedan pendientes.

Esta sección resume la implementación vigente. Algunas notas anteriores de este README que dicen que la autenticación no está implementada corresponden al estado previo y se conservaron sin cambios.
