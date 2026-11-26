package com.imperiumcross.backend.nutrition;

/** Coincide con {@code DetectedIngredient} del frontend. */
public record MealIngredientResponse(
        String id,
        String name,
        String portion,
        double calories) {
}
