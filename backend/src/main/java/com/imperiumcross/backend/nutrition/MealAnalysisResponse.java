package com.imperiumcross.backend.nutrition;

import java.util.List;

/** Coincide con {@code MealAnalysis} del frontend. Las fechas van en ISO 8601 con offset. */
public record MealAnalysisResponse(
        String id,
        String dishName,
        String portion,
        String imageUrl,
        String analyzedAt,
        NutrientValues nutrients,
        List<MealIngredientResponse> ingredients,
        String tip) {
}
