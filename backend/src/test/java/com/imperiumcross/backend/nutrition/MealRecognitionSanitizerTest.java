package com.imperiumcross.backend.nutrition;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

class MealRecognitionSanitizerTest {

    private static MealRecognition recognition(
            String dishName,
            NutrientValues nutrients,
            List<RecognizedIngredient> ingredients,
            String tip) {
        return new MealRecognition(true, dishName, "1 plato", nutrients, ingredients, tip);
    }

    private static final NutrientValues VALID = new NutrientValues(500, 30, 60, 15, 5, 800);

    @Test
    void clampsNegativeAndExcessiveValuesAndRoundsToOneDecimal() {
        MealRecognition result = MealRecognitionSanitizer.sanitize(recognition(
                "Ceviche",
                new NutrientValues(9000, -4, 60.26, 15.04, 5.05, 99999),
                List.of(new RecognizedIngredient("Pescado", "150 g", -10)),
                "Buena opción."));

        assertEquals(new NutrientValues(5000, 0, 60.3, 15.0, 5.1, 20000), result.nutrients());
        assertEquals(0, result.ingredients().get(0).calories());
    }

    @Test
    void trimsAndTruncatesTextsToColumnLengths() {
        String longName = "A".repeat(200);
        String longTip = "B".repeat(500);
        MealRecognition result = MealRecognitionSanitizer.sanitize(recognition(
                "  Arroz\n con   pollo  ",
                VALID,
                List.of(new RecognizedIngredient(longName, "C".repeat(90), 100)),
                longTip));

        assertEquals("Arroz con pollo", result.dishName());
        assertEquals(80, result.ingredients().get(0).name().length());
        assertEquals(60, result.ingredients().get(0).portion().length());
        assertEquals(400, result.tip().length());
    }

    @Test
    void notFoodIgnoresTheRestOfTheResponse() {
        MealRecognition result = MealRecognitionSanitizer.sanitize(
                new MealRecognition(false, null, null, null, null, null));
        assertFalse(result.food());
    }

    @Test
    void rejectsMissingFieldsAsProviderErrors() {
        assertThrows(MealRecognitionUnavailableException.class,
                () -> MealRecognitionSanitizer.sanitize(null));
        assertThrows(MealRecognitionUnavailableException.class,
                () -> MealRecognitionSanitizer.sanitize(recognition(" ", VALID, List.of(), "")));
        assertThrows(MealRecognitionUnavailableException.class,
                () -> MealRecognitionSanitizer.sanitize(recognition("Plato", null, List.of(), "")));
        assertThrows(MealRecognitionUnavailableException.class,
                () -> MealRecognitionSanitizer.sanitize(recognition("Plato", VALID, null, "")));
        assertThrows(MealRecognitionUnavailableException.class,
                () -> MealRecognitionSanitizer.sanitize(recognition(
                        "Plato", VALID, Arrays.asList((RecognizedIngredient) null), "")));
        assertThrows(MealRecognitionUnavailableException.class,
                () -> MealRecognitionSanitizer.sanitize(recognition(
                        "Plato", VALID, List.of(new RecognizedIngredient("", "1 g", 1)), "")));
        assertThrows(MealRecognitionUnavailableException.class,
                () -> MealRecognitionSanitizer.sanitize(recognition(
                        "Plato", new NutrientValues(Double.NaN, 1, 1, 1, 1, 1), List.of(), "")));
    }
}
