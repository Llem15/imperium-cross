package com.imperiumcross.backend.nutrition;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.Optional;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;

/**
 * Reduce la foto antes de enviarla a la IA: lado mayor de 1280 px y JPEG, usando solo ImageIO.
 * Al volver a codificar se descartan los metadatos (EXIF, ubicación).
 *
 * <p>Primero lee las dimensiones y decodifica con submuestreo, para que una imagen muy grande
 * no ocupe demasiada memoria. Si ImageIO no puede leer la foto (por ejemplo WebP, que el JDK no
 * soporta, o un JPEG CMYK), devuelve vacío y quien llama decide usar la original.
 */
final class MealPhotoResizer {

    static final int MAX_SIDE = 1280;
    static final float JPEG_QUALITY = 0.8f;

    record Photo(byte[] content, String contentType) {
    }

    private MealPhotoResizer() {
    }

    static Optional<Photo> toJpeg(byte[] photo) {
        if (photo == null || photo.length == 0) return Optional.empty();
        try {
            BufferedImage source = decodeSubsampled(photo);
            if (source == null) return Optional.empty();
            return Optional.of(new Photo(encodeJpeg(fit(source)), "image/jpeg"));
        } catch (IOException | RuntimeException exception) {
            return Optional.empty();
        }
    }

    private static BufferedImage decodeSubsampled(byte[] photo) throws IOException {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(photo))) {
            if (input == null) return null;
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) return null;
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0) return null;
                int step = Math.max(1, Math.max(width, height) / MAX_SIDE);
                ImageReadParam param = reader.getDefaultReadParam();
                param.setSourceSubsampling(step, step, 0, 0);
                return reader.read(0, param);
            } finally {
                reader.dispose();
            }
        }
    }

    /** Escala para que el lado mayor no pase de 1280 px y aplana la transparencia sobre blanco. */
    private static BufferedImage fit(BufferedImage source) {
        int width = source.getWidth();
        int height = source.getHeight();
        double scale = Math.min(1.0, (double) MAX_SIDE / Math.max(width, height));
        int targetWidth = Math.max(1, (int) Math.round(width * scale));
        int targetHeight = Math.max(1, (int) Math.round(height * scale));

        BufferedImage target = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = target.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, targetWidth, targetHeight);
            graphics.drawImage(source, 0, 0, targetWidth, targetHeight, null);
        } finally {
            graphics.dispose();
        }
        return target;
    }

    private static byte[] encodeJpeg(BufferedImage image) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        if (!writers.hasNext()) throw new IOException("No hay un codificador JPEG disponible.");
        ImageWriter writer = writers.next();
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (ImageOutputStream stream = ImageIO.createImageOutputStream(output)) {
            writer.setOutput(stream);
            ImageWriteParam param = writer.getDefaultWriteParam();
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(JPEG_QUALITY);
            writer.write(null, new IIOImage(image, null, null), param);
        } finally {
            writer.dispose();
        }
        return output.toByteArray();
    }
}
