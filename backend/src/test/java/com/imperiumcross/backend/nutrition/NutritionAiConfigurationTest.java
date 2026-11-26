package com.imperiumcross.backend.nutrition;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

import java.time.Duration;

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
    void connectTimeoutIs30Seconds() {
        assertEquals(Duration.ofSeconds(30), NutritionAiConfiguration.GEMINI_CONNECT_TIMEOUT);
    }

    @Test
    void readTimeoutDefaultsTo60SecondsAndCanBeConfigured() {
        assertEquals(Duration.ofSeconds(60), NutritionAiConfiguration.readTimeout(null));
        assertEquals(Duration.ofSeconds(60), NutritionAiConfiguration.readTimeout(""));
        assertEquals(Duration.ofSeconds(120), NutritionAiConfiguration.readTimeout(" 120 "));
        assertEquals(Duration.ofSeconds(5), NutritionAiConfiguration.readTimeout("5"));
        assertEquals(Duration.ofSeconds(300), NutritionAiConfiguration.readTimeout("300"));
    }

    @Test
    void invalidReadTimeoutFallsBackTo60Seconds() {
        assertEquals(Duration.ofSeconds(60), NutritionAiConfiguration.readTimeout("abc"));
        assertEquals(Duration.ofSeconds(60), NutritionAiConfiguration.readTimeout("4"));
        assertEquals(Duration.ofSeconds(60), NutritionAiConfiguration.readTimeout("301"));
        assertEquals(Duration.ofSeconds(60), NutritionAiConfiguration.readTimeout("-10"));
        assertEquals(Duration.ofSeconds(60), NutritionAiConfiguration.readTimeout("1.5"));
    }

    @Test
    void geminiHttpClientForcesHttp11And30sConnectTimeout() {
        java.net.http.HttpClient httpClient = NutritionAiConfiguration.geminiHttpClient();
        assertEquals(java.net.http.HttpClient.Version.HTTP_1_1, httpClient.version());
        assertEquals(java.util.Optional.of(Duration.ofSeconds(30)), httpClient.connectTimeout());

        assertInstanceOf(
                GeminiMealRecognitionClient.class,
                NutritionAiConfiguration.select(
                        "gemini",
                        TEST_KEY,
                        "modelo-de-prueba",
                        NutritionAiConfiguration.geminiRestClientBuilder(Duration.ofSeconds(60))));
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
