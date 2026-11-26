package com.imperiumcross.backend.nutrition;

import java.util.List;

/** Coincide con {@code Meal} del frontend: un análisis guardado más {@code savedAt}. */
public record MealResponse(
        String id,
        String dishName,
        String portion,
        String imageUrl,
        String analyzedAt,
        NutrientValues nutrients,
        List<MealIngredientResponse> ingredients,
        String tip,
        String savedAt) {
}
