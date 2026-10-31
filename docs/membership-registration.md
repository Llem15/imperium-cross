# Inscripción de membresías

## Flujo público

Los tres botones «Elegir plan» abren un modal sobre la misma landing, con fondo oscurecido y el plan elegido conservado. No hay navegación a otra página, cambio de URL ni pestañas nuevas. El nombre, precio y características se reutilizan desde `app/landing-content.ts`.

1. **Tus datos:** nombres, apellidos, correo, celular peruano, DNI de ocho dígitos y objetivo obligatorios. Los mensajes se vinculan a sus controles; no se permite avanzar con errores y el foco vuelve al primer campo inválido.
2. **Elige tu plan:** permite cambiar el plan y elegir Tarjeta, Yape o Efectivo. «Atrás» conserva los datos, el plan y el método seleccionados.

Todo el estado es local al componente React. No se usan localStorage, sessionStorage, cookies, parámetros de URL para datos personales ni servicios externos para recibirlos. Recargar o cerrar el modal descarta los valores; no hay persistencia, envío de correo ni creación de membresías.

## Referencia visual y decisiones

Se inspeccionaron los frames `67:114`, `67:115`, `67:166` y `67:189` del [diseño oficial](https://www.figma.com/design/5EPZT22l83oUzSrBw33zgt/Imperium-Cross?node-id=1-5). Se reutilizan sus SVG de progreso, radios y confirmación en `public/registration/`, Inter, colores, controles, dimensiones de tarjeta y botones.

La captura adicional del usuario especifica el formulario como overlay sobre la landing. Se usa un `dialog` nativo con fondo oscurecido, cierre mediante botón, Escape o clic fuera de la tarjeta, foco contenido y retorno al botón de origen. Se bloquea el scroll del fondo y el contenido del modal puede desplazarse en pantallas pequeñas. En móvil se reducen márgenes y padding manteniendo el orden y los campos. Los mensajes de validación o indisponibilidad pueden ampliar la tarjeta para no ocultar contenido.

## Confirmaciones visuales del frontend

El flujo permite recorrer las pantallas finales de Figma como prototipo de frontend. Tarjeta o Yape muestran «¡Pago Exitoso!» dentro del mismo modal; Efectivo muestra «Tu registro fue Guardado». Se conserva el plan seleccionado y su precio.

Los textos visibles de confirmación y correo se conservan por decisión del usuario para reproducir el recorrido visual. No son respuestas verificadas de un servidor: no hay persistencia, cargos, activación de membresías ni envío de correos. No se solicitan números de tarjeta, códigos bancarios ni datos de Yape. Antes de utilizar el sistema con usuarios reales, esos mensajes deberán depender de operaciones confirmadas en el servidor.

`RegistrationConfirmation` recibe un `RegistrationPreview`, no una respuesta de backend. La vigencia `08/10/2026` y el código `#4821` son ejemplos fijos de Figma centralizados en `confirmationExample`; no se calculan ni se interpretan como credenciales reales.

## Organización del frontend

- `registration-dialog.tsx`: tarjetas de planes y ciclo del modal, teclado, foco y bloqueo del scroll.
- `registration-form.tsx`: composición de los pasos y foco del encabezado.
- `registration-steps.tsx`: presentación de datos personales, selección de plan y pago.
- `use-registration.ts`: estado en memoria, transiciones y aplicación de validaciones.
- `registration-model.ts`: tipos, catálogos y funciones de validación sin dependencias de la interfaz.
- `registration-confirmation.tsx`: vista previa final; no confirma operaciones reales.

Los estilos utilizan utilidades de Tailwind y los tokens de `app/globals.css`. No se mantiene una hoja CSS independiente para el formulario.


## Verificación

Además de ESLint, TypeScript, build y `git diff --check`, se prueba la entrada desde los tres planes, campos vacíos e inválidos, cambio de plan, ida y vuelta entre pasos, las dos variantes de confirmación visual y la ausencia de transmisiones de datos. Se revisan etiquetas, foco, imágenes y desbordamiento a 320, 390, 768, 1024 y 1440 px.


