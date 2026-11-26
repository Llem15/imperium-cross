package com.imperiumcross.backend.nutrition;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.json.JsonMapper;

/** Usa MockRestServiceServer: ninguna prueba llama a internet. */
class GeminiMealRecognitionClientTest {

    // VALOR FALSO SOLO PARA PRUEBAS; NO ES UNA API KEY REAL.
    private static final String TEST_KEY = "clave-falsa-de-prueba";
    private static final String MODEL = "modelo-de-prueba";
    private static final String ENDPOINT =
            "https://generativelanguage.googleapis.com/v1beta/models/modelo-de-prueba:generateContent";

    private static final String VALID_MEAL = """
            {
              "esComida": true,
              "nombrePlato": "Ají de gallina",
              "porcion": "1 plato (380 g)",
              "calorias": 640.25,
              "proteinas": 32,
              "carbohidratos": 58.4,
              "grasas": 29,
              "fibra": 3.2,
              "sodio": 980,
              "ingredientes": [
                {"nombre": "Gallina deshilachada", "porcion": "120 g", "calorias": 220},
                {"nombre": "Arroz blanco", "porcion": "150 g", "calorias": 195}
              ],
              "consejo": "Acompáñalo con ensalada para sumar fibra."
            }
            """;

    private static final String NOT_FOOD = """
            {
              "esComida": false,
              "nombrePlato": "",
              "porcion": "",
              "calorias": 0,
              "proteinas": 0,
              "carbohidratos": 0,
              "grasas": 0,
              "fibra": 0,
              "sodio": 0,
              "ingredientes": [],
              "consejo": ""
            }
            """;

    private final JsonMapper jsonMapper = JsonMapper.builder().build();
    private MockRestServiceServer server;
    private GeminiMealRecognitionClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        client = new GeminiMealRecognitionClient(builder, TEST_KEY, MODEL);
    }

    @Test
    void sendsImageAndSchemaWithKeyOnlyInHeader() {
        byte[] image = MealPhotoValidatorTest.JPEG;
        server.expect(requestTo(ENDPOINT))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("x-goog-api-key", TEST_KEY))
                .andExpect(jsonPath("$.contents[0].parts[0].text").value(GeminiMealRecognitionClient.PROMPT))
                .andExpect(jsonPath("$.contents[0].parts[1].inline_data.mime_type").value("image/jpeg"))
                .andExpect(jsonPath("$.contents[0].parts[1].inline_data.data")
                        .value(Base64.getEncoder().encodeToString(image)))
                .andExpect(jsonPath("$.generationConfig.responseMimeType").value("application/json"))
                .andExpect(jsonPath("$.generationConfig.responseSchema.properties.esComida.type").value("BOOLEAN"))
                .andExpect(jsonPath("$.generationConfig.responseSchema.required[0]").value("esComida"))
                .andExpect(jsonPath("$.generationConfig.thinkingConfig.thinkingLevel").value("LOW"))
                .andExpect(jsonPath("$.generationConfig.temperature").doesNotExist())
                .andRespond(withSuccess(geminiResponse(VALID_MEAL, "STOP"), MediaType.APPLICATION_JSON));

        MealRecognition result = client.recognize(image, "image/jpeg");

        server.verify();
        assertTrue(result.food());
        assertEquals("Ají de gallina", result.dishName());
        assertEquals(new NutrientValues(640.25, 32, 58.4, 29, 3.2, 980), result.nutrients());
        assertEquals(
                List.of(
                        new RecognizedIngredient("Gallina deshilachada", "120 g", 220),
                        new RecognizedIngredient("Arroz blanco", "150 g", 195)),
                result.ingredients());
        assertEquals("Acompáñalo con ensalada para sumar fibra.", result.tip());
    }

    @Test
    void validResponseIsThenSanitizedByTheService() {
        MealRecognition sanitized = MealRecognitionSanitizer.sanitize(
                client.parseResponse(geminiResponse(VALID_MEAL, "STOP")));
        assertEquals(640.3, sanitized.nutrients().calories());
    }

    @Test
    void recognizesNotFood() {
        server.expect(requestTo(ENDPOINT))
                .andRespond(withSuccess(geminiResponse(NOT_FOOD, "STOP"), MediaType.APPLICATION_JSON));

        assertFalse(client.recognize(MealPhotoValidatorTest.PNG, "image/png").food());
    }

    @Test
    void safetyBlocksAreTreatedAsNotFood() {
        // REINTENTAR NO SOLUCIONA UN BLOQUEO: EL SERVICIO LO CONVIERTE EN 422.
        assertFalse(client.parseResponse(geminiResponse("", "SAFETY")).food());
        assertFalse(client.parseResponse(geminiResponse("", "IMAGE_SAFETY")).food());
        assertFalse(client.parseResponse("""
                {"promptFeedback": {"blockReason": "SAFETY"}}
                """).food());
        assertFalse(client.parseResponse("""
                {"candidates": [], "promptFeedback": {"blockReason": "PROHIBITED_CONTENT"}}
                """).food());
    }

    @Test
    void safetyBlockReachesTheMemberAs422() {
        server.expect(requestTo(ENDPOINT)).andRespond(withSuccess("""
                {"promptFeedback": {"blockReason": "SAFETY"}}
                """, MediaType.APPLICATION_JSON));
        FakeNutritionRepository repository = new FakeNutritionRepository();
        repository.activeClientsByUser.put(1, 1);
        NutritionService service = new NutritionService(repository, client);

        org.springframework.web.server.ResponseStatusException exception = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> service.analyze(1, MealPhotoValidatorTest.JPEG));

        assertEquals(422, exception.getStatusCode().value());
        assertEquals("No pudimos reconocer la comida", exception.getReason());
        assertTrue(repository.rows.isEmpty());
    }

    @Test
    void rejectsInvalidResponses() {
        String missingSodium = VALID_MEAL.replace("\"sodio\": 980,", "");
        String missingIngredientCalories = VALID_MEAL.replace(
                "{\"nombre\": \"Arroz blanco\", \"porcion\": \"150 g\", \"calorias\": 195}",
                "{\"nombre\": \"Arroz blanco\", \"porcion\": \"150 g\"}");
        String missingFoodFlag = VALID_MEAL.replace("\"esComida\": true,", "");

        assertInvalid(geminiResponse(missingSodium, "STOP"));
        assertInvalid(geminiResponse(missingIngredientCalories, "STOP"));
        assertInvalid(geminiResponse(missingFoodFlag, "STOP"));
        assertInvalid(geminiResponse("esto no es JSON", "STOP"));
        assertInvalid(geminiResponse(VALID_MEAL.substring(0, 80), "MAX_TOKENS"));
        assertInvalid(geminiResponse(VALID_MEAL, "RECITATION"));
        assertInvalid("""
                {"promptFeedback": {"blockReason": "OTHER"}}
                """);
        assertInvalid("{\"candidates\": []}");
        assertInvalid("");
        assertInvalid("<html>error</html>");
    }

    @Test
    void rateLimitBecomesUnavailableWithoutLeakingTheKey() {
        server.expect(requestTo(ENDPOINT))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("""
                                {"error": {"code": 429, "message": "Resource has been exhausted (e.g. check quota).",
                                 "status": "RESOURCE_EXHAUSTED"}}
                                """));

        MealRecognitionUnavailableException exception = assertThrows(
                MealRecognitionUnavailableException.class,
                () -> client.recognize(MealPhotoValidatorTest.JPEG, "image/jpeg"));

        assertEquals("Gemini respondió HTTP 429", exception.getMessage());
        assertFalse(exception.getMessage().contains(TEST_KEY));
        assertNull(exception.getCause());
    }

    @Test
    void timeoutReportsRootCauseWithoutUrlOrKey() {
        server.expect(requestTo(ENDPOINT)).andRespond(request -> {
            throw new SocketTimeoutException("Read timed out");
        });

        MealRecognitionUnavailableException exception = assertThrows(
                MealRecognitionUnavailableException.class,
                () -> client.recognize(MealPhotoValidatorTest.JPEG, "image/jpeg"));

        assertEquals("No se pudo contactar a Gemini: SocketTimeoutException: Read timed out", exception.getMessage());
        assertFalse(exception.getMessage().contains("googleapis"));
        assertNull(exception.getCause());
    }

    @Test
    void rootCauseDescriptionRemovesUrlsAndTheKey() {
        Exception exception = new RuntimeException("envoltura", new IOException(
                "fallo en https://generativelanguage.googleapis.com/v1beta/models/x:generateContent?key="
                        + TEST_KEY + " con la key " + TEST_KEY + "\n" + "x".repeat(400)));

        String description = client.describeRootCause(exception);

        assertTrue(description.startsWith("IOException: fallo en [url] con la key [oculto] x"));
        assertFalse(description.contains(TEST_KEY));
        assertFalse(description.contains("googleapis"));
        assertTrue(description.length() < 260);
        assertEquals("HttpConnectTimeoutException: HTTP connect timed out",
                client.describeRootCause(new java.net.http.HttpConnectTimeoutException("HTTP connect timed out")));
    }

    @Test
    void serverErrorBecomesUnavailable() {
        server.expect(requestTo(ENDPOINT)).andRespond(withServerError());

        MealRecognitionUnavailableException exception = assertThrows(
                MealRecognitionUnavailableException.class,
                () -> client.recognize(MealPhotoValidatorTest.JPEG, "image/jpeg"));
        assertEquals("Gemini respondió HTTP 500", exception.getMessage());
    }

    @Test
    void acceptsModelIdsCopiedWithPrefixAndRejectsUnsafeOnes() {
        assertEquals("gemini-x-flash", GeminiMealRecognitionClient.normalizeModel(" models/gemini-x-flash "));
        assertNull(GeminiMealRecognitionClient.normalizeModel("../otro"));
        assertNull(GeminiMealRecognitionClient.normalizeModel("modelo?key=abc"));
        assertNull(GeminiMealRecognitionClient.normalizeModel(""));
        assertNull(GeminiMealRecognitionClient.normalizeModel(null));
    }

    private void assertInvalid(String responseBody) {
        assertThrows(MealRecognitionUnavailableException.class, () -> client.parseResponse(responseBody));
    }

    /** Arma una respuesta con el formato de generateContent cuyo texto es el JSON del modelo. */
    private String geminiResponse(String modelText, String finishReason) {
        return jsonMapper.writeValueAsString(Map.of(
                "candidates", List.of(Map.of(
                        "content", Map.of(
                                "role", "model",
                                "parts", List.of(Map.of("text", modelText))),
                        "finishReason", finishReason,
                        "index", 0)),
                "usageMetadata", Map.of("promptTokenCount", 1290, "candidatesTokenCount", 180),
                "modelVersion", MODEL));
    }
}
