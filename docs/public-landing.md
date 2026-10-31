# Landing pública: alcance y decisiones

## Referencia visual

Implementación basada en el frame `8:284` de la página «Prototipo» del [archivo de Figma](https://www.figma.com/design/5EPZT22l83oUzSrBw33zgt/Imperium-Cross?node-id=8-284), de 1440 × 6806 px. Se conservan secciones, Inter, colores, degradado rojo, bordes, radios e imágenes originales, descargadas en `public/landing/`. Los recortes usan contenedores posicionados; las imágenes con `fill` no reciben dimensiones en su estilo.

No se identificó una variante móvil de la landing. La adaptación conserva el contenido y el orden: navegación desplegable por debajo de 1024 px, dos columnas de beneficios e instalaciones en tablet/móvil, una columna de planes, entrenadores y testimonios por debajo de 768 px. El menú se cierra al elegir una sección y con Escape. El foco es visible y existe un enlace para saltar al contenido. Se respeta la preferencia de movimiento reducido.

Se corrigen tildes evidentes sin cambiar el significado. Los estados de foco y hover se derivan del rojo del diseño; no estaban definidos como variantes en Figma.

## Proyecto de demostración y contacto

Dirección, coordenadas, teléfono, correo y URLs se centralizan en `app/landing-content.ts`. La ubicación de referencia proporcionada es Prol. 28 de Julio 581, Lurigancho-Chosica, Lima, Perú; coordenadas `-11.9391165, -76.6966084`.

El mapa es un iframe de Google Maps con URL de inserción, carga diferida, título accesible y dimensiones responsive. Reemplaza la captura estática. «Cómo llegar» abre el enlace de ubicación proporcionado, incluso si el navegador bloquea el iframe. No utiliza API keys, SDK ni servicios de pago. La visualización depende de Google y de la conexión del visitante.

Los enlaces de teléfono, correo y WhatsApp utilizan protocolos válidos. Son accesos externos: abrirlos no confirma recepción ni envía automáticamente mensajes. El teléfono de Figma coincide con el destino del [WhatsApp publicado en Linktree](https://linktr.ee/imperiumcross), comprobado durante la revisión. Se conserva el correo de Figma como dato de prueba por indicación del usuario.

## Planes, formularios y redes

«Elegir plan» inicia la [inscripción en dos pasos](membership-registration.md) conservando el plan elegido. No redirige a WhatsApp ni crea socios, reservas, pagos o suscripciones reales.

Los formularios de datos y selección de plan/método de pago funcionan como interfaz local. A petición del usuario, el flujo muestra también las confirmaciones visuales de Figma dentro del mismo modal, sin ejecutar registros, cargos ni correos. La validación en servidor, persistencia y confirmación real de pagos requieren una tarea posterior con backend.

TikTok utiliza el perfil enlazado en el Linktree de referencia. Facebook e Instagram conservan sus iconos con estado «enlace pendiente», sin enlaces falsos ni controles inactivos que aparenten funcionar. No se verificaron URLs oficiales para esas redes.

## Organización y validación

- `app/page.tsx`: composición de las secciones como componente de servidor.
- `app/landing-content.ts`: contenido, enlaces y metadatos de recorte de imágenes.
- `app/landing-shell.tsx`: encabezado y pie de página.
- `app/landing-sections.tsx`: secciones de contenido de la landing.
- `app/landing-ui.tsx`: imágenes, acciones y estructura de sección reutilizadas.
- `app/ui-styles.ts`: variantes compartidas de botones.
- `app/landing-contact.tsx`: datos de contacto, mapa y redes reutilizados.
- `app/landing-navigation.tsx`: única interacción local de cliente para el menú móvil.
- `app/globals.css`: tokens de Tailwind CSS 4 y reglas globales de accesibilidad; la distribución y adaptación responsive usan utilidades en los componentes.
- `app/layout.tsx`: idioma, metadatos e Inter mediante `next/font`.
- `app/icon.png`: logo original de Imperium Cross como icono global de las pestañas; reemplaza el favicon genérico de Next.js mediante la convención de metadatos de App Router.

Verificaciones requeridas antes de publicar: `npm run lint`, `npm run typecheck`, `npm run build` y `git diff --check`. Revisar además la ejecución e hidratación, imágenes, anclas, menú móvil, enlaces, mapa y capturas a 320, 390, 768, 1024 y 1440 px. No basta con compilar.

El aviso conocido del lockfile externo no requiere modificar archivos fuera del repositorio. No se incorporan dependencias, autenticación ni base de datos.

### Revisión realizada

Se probó la ejecución de desarrollo en Chrome aislado a 320, 390, 768, 1024 y 1440 px: sin excepciones, mensajes relevantes de consola, errores de hidratación, imágenes rotas ni desbordamiento horizontal. Se verificaron anclas, consulta de los tres planes, apertura/cierre del menú y Escape con retorno del foco al desplegable.

Se revisaron capturas reales de escritorio y móvil, incluido el iframe dentro del viewport. Google Maps respondió HTTP 200 y mostró el marcador en las coordenadas indicadas. Las capturas de página completa pueden omitir el contenido de iframes externos fuera del viewport; por eso el mapa se comprobó también en capturas específicas de la sección visible.

No se enviaron mensajes, correos ni formularios a servicios externos. La comprobación de esos enlaces valida sus destinos y parámetros, no la recepción de una consulta por el negocio. Las verificaciones no sustituyen pruebas en dispositivos físicos o con lectores de pantalla.
