package com.imperiumcross.backend.nutrition;

/**
 * Nutrientes de una comida o metas diarias. Coincide con {@code Nutrients} de
 * {@code features/nutrition/nutrition-types.ts}: calorías en kcal, sodio en mg y el resto en g.
 */
public record NutrientValues(
        double calories,
        double protein,
        double carbs,
        double fat,
        double fiber,
        double sodium) {
}
