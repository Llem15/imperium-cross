package com.imperiumcross.backend.nutrition;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Optional;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;

class MealPhotoResizerTest {

    static byte[] image(String format, int width, int height, int type) throws IOException {
        BufferedImage image = new BufferedImage(width, height, type);
        for (int x = 0; x < width; x += 7) {
            for (int y = 0; y < height; y += 7) {
                image.setRGB(x, y, new Color(x % 256, y % 256, 120).getRGB());
            }
        }
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        assertTrue(ImageIO.write(image, format, output), "No se pudo crear la imagen de prueba.");
        return output.toByteArray();
    }

    private static BufferedImage decode(byte[] content) throws IOException {
        return ImageIO.read(new ByteArrayInputStream(content));
    }

    @Test
    void reducesLargeLandscapePngToJpegWith1280LongestSide() throws IOException {
        byte[] png = image("png", 3000, 2000, BufferedImage.TYPE_INT_RGB);

        MealPhotoResizer.Photo result = MealPhotoResizer.toJpeg(png).orElseThrow();

        assertEquals("image/jpeg", result.contentType());
        assertEquals(Optional.of("image/jpeg"), MealPhotoValidator.detectContentType(result.content()));
        BufferedImage decoded = decode(result.content());
        assertEquals(1280, decoded.getWidth());
        assertEquals(853, decoded.getHeight());
    }

    @Test
    void reducesPortraitJpeg() throws IOException {
        byte[] jpeg = image("jpeg", 1500, 4000, BufferedImage.TYPE_INT_RGB);

        BufferedImage decoded = decode(MealPhotoResizer.toJpeg(jpeg).orElseThrow().content());

        assertEquals(480, decoded.getWidth());
        assertEquals(1280, decoded.getHeight());
    }

    @Test
    void keepsSmallImagesSizeButConvertsTransparentPngToJpeg() throws IOException {
        byte[] png = image("png", 800, 600, BufferedImage.TYPE_INT_ARGB);

        MealPhotoResizer.Photo result = MealPhotoResizer.toJpeg(png).orElseThrow();

        BufferedImage decoded = decode(result.content());
        assertEquals(800, decoded.getWidth());
        assertEquals(600, decoded.getHeight());
        assertEquals("image/jpeg", result.contentType());
    }

    @Test
    void returnsEmptyWhenImageIoCannotDecode() {
        assertEquals(Optional.empty(), MealPhotoResizer.toJpeg(MealPhotoValidatorTest.WEBP));
        assertEquals(Optional.empty(), MealPhotoResizer.toJpeg(MealPhotoValidatorTest.JPEG));
        assertEquals(Optional.empty(), MealPhotoResizer.toJpeg(new byte[0]));
        assertEquals(Optional.empty(), MealPhotoResizer.toJpeg(null));
    }
}
