package com.imperiumcross.backend.nutrition;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * No confía en la respuesta de la IA: exige los campos, limita los valores a rangos razonables,
 * recorta los textos al largo de las columnas de {@code RegistroComida} e
 * {@code IngredienteComida} y redondea a 1 decimal. Una respuesta inválida se trata como un
 * error del proveedor.
 */
final class MealRecognitionSanitizer {

    static final int DISH_NAME_MAX = 120;
    static final int PORTION_MAX = 80;
    static final int TIP_MAX = 400;
    static final int INGREDIENT_NAME_MAX = 80;
    static final int INGREDIENT_PORTION_MAX = 60;
    static final int MAX_INGREDIENTS = 20;

    static final double MAX_CALORIES = 5000;
    static final double MAX_GRAMS = 1000;
    static final double MAX_SODIUM_MG = 20000;

    private MealRecognitionSanitizer() {
    }

    static MealRecognition sanitize(MealRecognition recognition) {
        if (recognition == null) throw invalid("respuesta vacía");
        if (!recognition.food()) return MealRecognition.notFood();

        NutrientValues nutrients = recognition.nutrients();
        if (nutrients == null) throw invalid("faltan los nutrientes");
        if (recognition.ingredients() == null) throw invalid("faltan los ingredientes");
        if (recognition.ingredients().size() > MAX_INGREDIENTS) {
            throw invalid("demasiados ingredientes");
        }

        List<RecognizedIngredient> ingredients = new ArrayList<>();
        for (RecognizedIngredient ingredient : recognition.ingredients()) {
            if (ingredient == null) throw invalid("ingrediente vacío");
            ingredients.add(new RecognizedIngredient(
                    requiredText(ingredient.name(), INGREDIENT_NAME_MAX, "nombre de ingrediente"),
                    requiredText(ingredient.portion(), INGREDIENT_PORTION_MAX, "porción de ingrediente"),
                    bounded(ingredient.calories(), MAX_CALORIES, "calorías de ingrediente")));
        }

        return new MealRecognition(
                true,
                requiredText(recognition.dishName(), DISH_NAME_MAX, "nombre del plato"),
                requiredText(recognition.portion(), PORTION_MAX, "porción"),
                new NutrientValues(
                        bounded(nutrients.calories(), MAX_CALORIES, "calorías"),
                        bounded(nutrients.protein(), MAX_GRAMS, "proteína"),
                        bounded(nutrients.carbs(), MAX_GRAMS, "carbohidratos"),
                        bounded(nutrients.fat(), MAX_GRAMS, "grasas"),
                        bounded(nutrients.fiber(), MAX_GRAMS, "fibra"),
                        bounded(nutrients.sodium(), MAX_SODIUM_MG, "sodio")),
                List.copyOf(ingredients),
                optionalText(recognition.tip(), TIP_MAX));
    }

    private static String requiredText(String value, int maxLength, String field) {
        String text = optionalText(value, maxLength);
        if (text.isEmpty()) throw invalid("falta " + field);
        return text;
    }

    private static String optionalText(String value, int maxLength) {
        if (value == null) return "";
        String text = value.replaceAll("[\\p{Cntrl}\\s]+", " ").trim();
        if (text.length() <= maxLength) return text;
        int end = maxLength;
        if (Character.isHighSurrogate(text.charAt(end - 1))) end--;
        return text.substring(0, end).trim();
    }

    private static double bounded(double value, double max, String field) {
        if (!Double.isFinite(value)) throw invalid(field + " no es un número");
        double clamped = Math.min(Math.max(value, 0), max);
        return BigDecimal.valueOf(clamped).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    private static MealRecognitionUnavailableException invalid(String reason) {
        return new MealRecognitionUnavailableException("Respuesta de IA inválida: " + reason);
    }
}
