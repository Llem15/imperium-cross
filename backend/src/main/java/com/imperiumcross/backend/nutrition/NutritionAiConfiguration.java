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
 *   <li>{@code GEMINI_READ_TIMEOUT_SECONDS}: espera máxima de la respuesta de Gemini, entre 5 y
 *       300 segundos (por defecto 60).</li>
 * </ul>
 *
 * Si se pide Gemini pero falta la key o el modelo, la aplicación arranca igual con el simulado
 * y registra una advertencia. La key nunca se escribe en los logs.
 */
@Configuration
public class NutritionAiConfiguration {

    static final Duration GEMINI_CONNECT_TIMEOUT = Duration.ofSeconds(30);
    static final Duration DEFAULT_GEMINI_READ_TIMEOUT = Duration.ofSeconds(60);
    static final Duration MIN_GEMINI_READ_TIMEOUT = Duration.ofSeconds(5);
    static final Duration MAX_GEMINI_READ_TIMEOUT = Duration.ofSeconds(300);

    private static final Logger log = LoggerFactory.getLogger(NutritionAiConfiguration.class);

    @Bean
    MealRecognitionClient mealRecognitionClient(
            @Value("${NUTRITION_AI_PROVIDER:simulated}") String provider,
            @Value("${GEMINI_API_KEY:}") String apiKey,
            @Value("${GEMINI_MODEL:}") String model,
            @Value("${GEMINI_READ_TIMEOUT_SECONDS:}") String readTimeoutSeconds) {
        return select(provider, apiKey, model, geminiRestClientBuilder(readTimeout(readTimeoutSeconds)));
    }

    /** Interpreta {@code GEMINI_READ_TIMEOUT_SECONDS}; si falta o no es válido, usa 60 s. */
    static Duration readTimeout(String seconds) {
        if (seconds == null || seconds.isBlank()) return DEFAULT_GEMINI_READ_TIMEOUT;
        try {
            Duration value = Duration.ofSeconds(Long.parseLong(seconds.trim()));
            if (value.compareTo(MIN_GEMINI_READ_TIMEOUT) >= 0 && value.compareTo(MAX_GEMINI_READ_TIMEOUT) <= 0) {
                return value;
            }
        } catch (NumberFormatException ignored) {
            // SE REGISTRA ABAJO.
        }
        log.warn("GEMINI_READ_TIMEOUT_SECONDS debe ser un entero entre {} y {}; se usarán {} s.",
                MIN_GEMINI_READ_TIMEOUT.toSeconds(),
                MAX_GEMINI_READ_TIMEOUT.toSeconds(),
                DEFAULT_GEMINI_READ_TIMEOUT.toSeconds());
        return DEFAULT_GEMINI_READ_TIMEOUT;
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

    static RestClient.Builder geminiRestClientBuilder(Duration readTimeout) {
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(geminiHttpClient());
        // EN EL CLIENTE HTTP DEL JDK, ESTE LÍMITE CUBRE LA ESPERA DE LA RESPUESTA COMPLETA.
        requestFactory.setReadTimeout(readTimeout);
        return RestClient.builder().requestFactory(requestFactory);
    }

    static HttpClient geminiHttpClient() {
        // HTTP/1.1 FORZADO POR SIMPLICIDAD; GEMINI LO ACEPTA SIN PROBLEMAS.
        return HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(GEMINI_CONNECT_TIMEOUT)
                .build();
    }
}
