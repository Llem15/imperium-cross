# Inscripción de membresías

## Flujo público

Los tres botones «Elegir plan» abren un modal sobre la misma landing, con fondo oscurecido y el plan elegido conservado. No hay navegación a otra página, cambio de URL ni pestañas nuevas. El nombre, precio y características se reutilizan desde `app/landing-content.ts`.

1. **Tus datos:** nombres, apellidos, correo, celular peruano, DNI de ocho dígitos y objetivo obligatorios. Los mensajes se vinculan a sus controles; no se permite avanzar con errores y el foco vuelve al primer campo inválido.
2. **Elige tu plan:** permite cambiar el plan y elegir Tarjeta, Yape o Efectivo. «Atrás» conserva los datos, el plan y el método seleccionados.

Todo el estado es local al componente React. No se usan localStorage, sessionStorage, cookies, parámetros de URL para datos personales ni servicios externos para recibirlos. Recargar o cerrar el modal descarta los valores; no hay persistencia, envío de correo ni creación de membresías.

## Referencia visual y decisiones

Se inspeccionaron los frames `67:114`, `67:115`, `67:166` y `67:189` del [diseño oficial](https://www.figma.com/design/5EPZT22l83oUzSrBw33zgt/Imperium-Cross?node-id=1-5). Se reutilizan sus SVG de progreso, radios y confirmación en `public/registration/`, Inter, colores, controles, dimensiones de tarjeta y botones.

La captura adicional del usuario especifica el formulario como overlay sobre la landing. Se usa un `dialog` nativo con fondo oscurecido, cierre mediante botón, Escape o clic fuera de la tarjeta, foco contenido y retorno al botón de origen. Se bloquea el scroll del fondo y el contenido del modal puede desplazarse en pantallas pequeñas. En móvil se reducen márgenes y padding manteniendo el orden y los campos. Los mensajes de validación o indisponibilidad pueden ampliar la tarjeta para no ocultar contenido.

Figma muestra un selector de objetivo pero no enumera opciones. Se utiliza un catálogo inicial de demostración: mejorar condición física, ganar fuerza, mejorar resistencia y otro; queda sujeto a definición funcional posterior.

## Límites reales y confirmaciones

«Pagar» informa que Tarjeta/Yape no están integrados y que no se realizó ningún cargo ni se activó una membresía. No se solicitan números de tarjeta, códigos bancarios ni datos de Yape.

En efectivo, «Continuar» explica que todavía no se puede guardar la inscripción. No se muestra «Tu registro fue guardado». Una implementación futura deberá persistir primero la solicitud, mantener la membresía pendiente y activarla solo después de que recepción confirme el pago.

`RegistrationConfirmation` prepara las dos pantallas de Figma, pero no está conectada al formulario ni a una ruta de éxito. Requiere un resultado de backend con identificador de inscripción; el caso activo requiere además referencia de pago, vigencia y código de asistencia. Sin ese resultado no renderiza una confirmación. No se inventan fechas, identificadores, pagos o correos enviados; ese texto solo corresponde a respuestas reales del backend. Los tipos y las comprobaciones del componente no sustituyen autorización, persistencia ni verificación de pagos en el servidor.

Pendiente: API de inscripción, validación y autorización en servidor, PostgreSQL, confirmación de caja y proveedor real para Tarjeta/Yape. No se introducen en esta tarea.

## Verificación

Además de ESLint, TypeScript, build y `git diff --check`, se prueba la entrada desde los tres planes, campos vacíos e inválidos, cambio de plan, ida y vuelta entre pasos, métodos de pago, ausencia de confirmaciones falsas y de transmisiones de datos. Se revisan etiquetas, foco, imágenes y desbordamiento a 320, 390, 768, 1024 y 1440 px. Las vistas de confirmación solo pueden revisarse con fixtures locales de prueba, fuera de las rutas públicas.

La batería se ejecutó en desarrollo y producción con Chrome aislado para los tres planes y las cinco resoluciones: sin errores de ejecución, consola o hidratación, ni datos personales transmitidos o almacenados. Se verificaron Escape, cierre por botón y fondo, foco cíclico, retorno al botón de origen y descarte de datos al cerrar. Los seis SVG responden HTTP 200. Se revisaron capturas del modal y fixtures locales de ambas confirmaciones; no se probaron registros ni pagos reales porque no existen esos servicios.
