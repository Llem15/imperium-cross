# Arquitectura inicial

Imperium Cross es una aplicación para un único gimnasio. Se desarrolla como una sola aplicación con Next.js App Router y funcionalidades organizadas por dominio cuando existe código que lo justifique. La etapa actual es exclusivamente frontend, con datos de demostración y sin persistencia.

La [base interna](dashboard-foundation.md) organiza rutas mediante grupos de acceso y paneles, componentes compartidos en `components/`, funcionalidades en `features/` y fixtures tipados en `mocks/`. Las rutas de los cuatro perfiles están abiertas: la selección de perfil solo navega por la demostración. No se implementan servicios de backend ni seguridad de acceso en esta etapa.

## Responsabilidades y organización

- `app/`: rutas, layouts y composición de pantallas siguiendo las convenciones de Next.js.
- Componentes: nombres en PascalCase, interfaces de props explícitas y responsabilidades acotadas. Mantener los componentes específicos junto a su funcionalidad y extraer componentes compartidos solo cuando exista reutilización real.
- Módulos: agrupar por funcionalidad cuando crezcan las necesidades del proyecto, sin crear carpetas vacías. La organización del código es independiente de las capas de Figma.
- Presentación: mostrar información y gestionar interacciones; usar componentes de servidor por defecto y componentes de cliente cuando requieran estado, eventos o APIs del navegador.
- Lógica de negocio: expresar reglas del gimnasio separadas de la presentación y de los detalles de persistencia.
- Acceso a datos: mantener consultas y credenciales en el servidor. Incorporar límites entre responsabilidades sin añadir capas genéricas ni repositorios abstractos por anticipado.

## Roles previstos

Los siguientes roles son una propuesta de alcance; sus permisos concretos deberán definirse y aprobarse antes de implementar autorización:

| Rol           | Responsabilidad prevista                                        |
| ------------- | --------------------------------------------------------------- |
| Administrador | Administración del gimnasio y de los accesos.                   |
| Entrenador    | Gestión y seguimiento de entrenamientos.                        |
| Recepción     | Operación de recepción y atención a socios.                     |
| Socio         | Consulta de su información y seguimiento de sus entrenamientos. |

## Seguridad y datos

Autenticar y autorizar cada operación protegida en el servidor, incluidos Server Actions y Route Handlers. Validar entradas y comprobar permisos sobre los datos solicitados; ocultar controles en la interfaz no sustituye estas comprobaciones. Enviar al cliente únicamente los datos necesarios y no exponer secretos.

PostgreSQL es la propuesta de base de datos, pendiente de aprobación e implementación. No hay ORM, esquema, migraciones ni conexión configurados. Las credenciales futuras se proporcionarán mediante variables de entorno excluidas de Git.

## Evolución progresiva

Implementar funcionalidades aprobadas en incrementos pequeños, respetando el diseño oficial y priorizando componentes reutilizables y diseño responsive. Añadir pruebas según el riesgo de las reglas de negocio. No introducir microservicios, arquitectura multiempresa ni dependencias o abstracciones sin una necesidad concreta.
