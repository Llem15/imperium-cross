package com.imperiumcross.backend.nutrition;

import java.util.List;

/**
 * Resultado del proveedor de IA. Si {@code food} es falso, el resto de campos se ignora.
 * Los valores no son confiables hasta pasar por {@link MealRecognitionSanitizer}.
 */
public record MealRecognition(
        boolean food,
        String dishName,
        String portion,
        NutrientValues nutrients,
        List<RecognizedIngredient> ingredients,
        String tip) {

    public static MealRecognition notFood() {
        return new MealRecognition(false, null, null, null, List.of(), null);
    }
}
