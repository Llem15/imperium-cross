// CÓDIGO DE SECCIÓN NUTRICIONAL
// REDUCE LA FOTO EN EL NAVEGADOR ANTES DE SUBIRLA: LADO MAYOR DE 1280 px, JPEG CALIDAD 0.8.
const MAX_SIDE = 1280;
const JPEG_QUALITY = 0.8;

/** Devuelve la foto reducida en JPEG; si el navegador no puede procesarla, devuelve la original. */
export async function resizePhotoForUpload(file: File): Promise<Blob> {
  try {
    // "from-image" RESPETA LA ORIENTACIÓN EXIF DE LAS FOTOS DEL CELULAR.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    try {
      const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) return file;
      // FONDO BLANCO PARA LAS ZONAS TRANSPARENTES DE UN PNG.
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
      );
      return blob ?? file;
    } finally {
      bitmap.close();
    }
  } catch {
    return file;
  }
}
