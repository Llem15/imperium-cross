package com.imperiumcross.backend.nutrition;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Elige el proveedor de reconocimiento de comidas. Por ahora siempre usa el simulado; la
 * selección por {@code NUTRITION_AI_PROVIDER} y el cliente Gemini se agregan en la fase 3.
 */
@Configuration
public class NutritionAiConfiguration {

    @Bean
    MealRecognitionClient mealRecognitionClient() {
        return new SimulatedMealRecognitionClient();
    }
}
