package com.imperiumcross.backend.nutrition;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * Elige el proveedor de reconocimiento de comidas según variables de entorno:
 *
 * <ul>
 *   <li>{@code NUTRITION_AI_PROVIDER}: {@code gemini} o {@code simulated} (por defecto).</li>
 *   <li>{@code GEMINI_API_KEY}: API key de Gemini; no tiene valor por defecto.</li>
 *   <li>{@code GEMINI_MODEL}: ID exacto del modelo copiado desde AI Studio; no tiene valor por
 *       defecto.</li>
 * </ul>
 *
 * Si se pide Gemini pero falta la key o el modelo, la aplicación arranca igual con el simulado
 * y registra una advertencia. La key nunca se escribe en los logs.
 */
@Configuration
public class NutritionAiConfiguration {

    static final Duration GEMINI_TIMEOUT = Duration.ofSeconds(30);

    private static final Logger log = LoggerFactory.getLogger(NutritionAiConfiguration.class);

    @Bean
    MealRecognitionClient mealRecognitionClient(
            @Value("${NUTRITION_AI_PROVIDER:simulated}") String provider,
            @Value("${GEMINI_API_KEY:}") String apiKey,
            @Value("${GEMINI_MODEL:}") String model) {
        return select(provider, apiKey, model, geminiRestClientBuilder());
    }

    static MealRecognitionClient select(
            String provider,
            String apiKey,
            String model,
            RestClient.Builder geminiBuilder) {
        String normalizedProvider = provider == null ? "" : provider.trim().toLowerCase(Locale.ROOT);

        if (normalizedProvider.isEmpty() || SimulatedMealRecognitionClient.PROVIDER.equals(normalizedProvider)) {
            log.info("Análisis nutricional: usando el proveedor simulado.");
            return new SimulatedMealRecognitionClient();
        }
        if (!GeminiMealRecognitionClient.PROVIDER.equals(normalizedProvider)) {
            log.warn("NUTRITION_AI_PROVIDER no reconocido; se usará el proveedor simulado. "
                    + "Valores permitidos: gemini o simulated.");
            return new SimulatedMealRecognitionClient();
        }
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("NUTRITION_AI_PROVIDER=gemini pero falta GEMINI_API_KEY; se usará el proveedor simulado.");
            return new SimulatedMealRecognitionClient();
        }
        if (model == null || model.isBlank()) {
            log.warn("NUTRITION_AI_PROVIDER=gemini pero falta GEMINI_MODEL; se usará el proveedor simulado. "
                    + "Copia el ID del modelo desde Google AI Studio.");
            return new SimulatedMealRecognitionClient();
        }
        if (GeminiMealRecognitionClient.normalizeModel(model) == null) {
            log.warn("GEMINI_MODEL no tiene un formato válido; se usará el proveedor simulado.");
            return new SimulatedMealRecognitionClient();
        }

        GeminiMealRecognitionClient client = new GeminiMealRecognitionClient(geminiBuilder, apiKey, model);
        log.info("Análisis nutricional: usando Gemini con el modelo {}.", client.model());
        return client;
    }

    static RestClient.Builder geminiRestClientBuilder() {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(GEMINI_TIMEOUT)
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(GEMINI_TIMEOUT);
        return RestClient.builder().requestFactory(requestFactory);
    }
}
