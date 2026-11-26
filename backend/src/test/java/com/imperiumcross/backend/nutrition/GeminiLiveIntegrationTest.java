package com.imperiumcross.backend.nutrition;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

/**
 * Prueba OPCIONAL contra la Gemini API real. Se omite salvo que existan {@code GEMINI_API_KEY},
 * {@code GEMINI_MODEL} y {@code GEMINI_TEST_PHOTO} (ruta a una foto de comida JPEG, PNG o WebP).
 *
 * <p>La key y la foto solo se leen en memoria: no se escriben en archivos, logs ni en la salida
 * de la prueba. La foto no forma parte del repositorio.
 */
@EnabledIfEnvironmentVariable(named = "GEMINI_API_KEY", matches = ".+")
@EnabledIfEnvironmentVariable(named = "GEMINI_MODEL", matches = ".+")
class GeminiLiveIntegrationTest {

    @Test
    void recognizesARealFoodPhoto() throws IOException {
        String photoPath = System.getenv("GEMINI_TEST_PHOTO");
        assumeTrue(photoPath != null && !photoPath.isBlank(),
                "Define GEMINI_TEST_PHOTO con la ruta de una foto de comida.");
        Path path = Path.of(photoPath.trim());
        assumeTrue(Files.isRegularFile(path), "GEMINI_TEST_PHOTO no apunta a un archivo.");

        byte[] photo = Files.readAllBytes(path);
        assertTrue(photo.length <= MealPhotoValidator.MAX_BYTES, "La foto de prueba supera los 5 MB.");
        String contentType = MealPhotoValidator.detectContentType(photo)
                .orElseThrow(() -> new AssertionError("La foto de prueba debe ser JPEG, PNG o WebP."));

        MealRecognitionClient client = NutritionAiConfiguration.select(
                "gemini",
                System.getenv("GEMINI_API_KEY"),
                System.getenv("GEMINI_MODEL"),
                NutritionAiConfiguration.geminiRestClientBuilder(
                        NutritionAiConfiguration.readTimeout(System.getenv("GEMINI_READ_TIMEOUT_SECONDS"))));
        assertInstanceOf(GeminiMealRecognitionClient.class, client, "GEMINI_MODEL no tiene un formato válido.");

        // MISMA PREPARACIÓN Y VALIDACIÓN QUE NutritionService.
        MealPhotoResizer.Photo prepared = MealPhotoResizer.toJpeg(photo)
                .orElse(new MealPhotoResizer.Photo(photo, contentType));
        MealRecognition result = MealRecognitionSanitizer.sanitize(
                client.recognize(prepared.content(), prepared.contentType()));

        assertTrue(result.food(), "Gemini no reconoció la foto como comida.");
        assertFalse(result.dishName().isBlank());
        assertFalse(result.portion().isBlank());
        assertTrue(result.nutrients().calories() > 0, "Las calorías deberían ser mayores que 0.");
        assertFalse(result.ingredients().isEmpty(), "Debería detectar al menos un ingrediente.");
        result.ingredients().forEach(ingredient -> assertFalse(ingredient.name().isBlank()));
    }
}
