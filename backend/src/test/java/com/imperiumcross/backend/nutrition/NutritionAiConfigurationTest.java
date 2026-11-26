package com.imperiumcross.backend.nutrition;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

class NutritionAiConfigurationTest {

    private static final String TEST_KEY = "clave-falsa-de-prueba";

    private static MealRecognitionClient select(String provider, String apiKey, String model) {
        return NutritionAiConfiguration.select(provider, apiKey, model, RestClient.builder());
    }

    @Test
    void usesSimulatedByDefault() {
        assertInstanceOf(SimulatedMealRecognitionClient.class, select("simulated", "", ""));
        assertInstanceOf(SimulatedMealRecognitionClient.class, select("", "", ""));
        assertInstanceOf(SimulatedMealRecognitionClient.class, select(null, null, null));
    }

    @Test
    void usesGeminiWhenKeyAndModelArePresent() {
        MealRecognitionClient client = select(" Gemini ", TEST_KEY, "models/modelo-de-prueba");

        GeminiMealRecognitionClient gemini = assertInstanceOf(GeminiMealRecognitionClient.class, client);
        assertEquals("modelo-de-prueba", gemini.model());
        assertEquals("gemini", gemini.providerName());
    }

    @Test
    void fallsBackToSimulatedWhenGeminiIsNotFullyConfigured() {
        assertInstanceOf(SimulatedMealRecognitionClient.class, select("gemini", "", "modelo-de-prueba"));
        assertInstanceOf(SimulatedMealRecognitionClient.class, select("gemini", "  ", "modelo-de-prueba"));
        assertInstanceOf(SimulatedMealRecognitionClient.class, select("gemini", TEST_KEY, ""));
        assertInstanceOf(SimulatedMealRecognitionClient.class, select("gemini", TEST_KEY, "../otro"));
        assertInstanceOf(SimulatedMealRecognitionClient.class, select("openai", TEST_KEY, "modelo-de-prueba"));
    }
}
