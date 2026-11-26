package com.imperiumcross.backend.nutrition;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;

import com.imperiumcross.backend.security.DatabaseUserDetailsPasswordService;
import com.imperiumcross.backend.security.DatabaseUserDetailsService;
import com.imperiumcross.backend.security.DatabaseUserPrincipal;
import com.imperiumcross.backend.security.LegacyAwareBcryptPasswordEncoder;
import com.imperiumcross.backend.security.SecurityConfiguration;

/**
 * MockMvc con la SecurityConfiguration real y HTTP Basic, sin base de datos: los usuarios y los
 * registros viven en memoria.
 */
@WebMvcTest(controllers = NutritionController.class)
@Import({SecurityConfiguration.class, NutritionSecurityTest.TestBeans.class})
class NutritionSecurityTest {

    // CONTRASEÑA FALSA SOLO PARA PRUEBAS.
    private static final String PASSWORD = "clave-de-prueba";
    private static final String UNAVAILABLE = NutritionController.UNAVAILABLE_MESSAGE;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FakeNutritionRepository repository;

    @Autowired
    private SwitchableRecognitionClient recognitionClient;

    @BeforeEach
    void resetState() {
        repository.rows.clear();
        recognitionClient.delegate = new SimulatedMealRecognitionClient();
    }

    @Test
    void requestsWithoutCredentialsGet401() throws Exception {
        mockMvc.perform(get("/api/nutricion/metas"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().exists(HttpHeaders.WWW_AUTHENTICATE));
        mockMvc.perform(multipart("/api/nutricion/analisis").file(photo(MealPhotoValidatorTest.JPEG)))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/nutricion/metas").header(HttpHeaders.AUTHORIZATION, basic("socio@test", "otra")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rolesOtherThanMemberGet403() throws Exception {
        for (String user : new String[] {"admin@test", "recepcion@test", "entrenador@test"}) {
            mockMvc.perform(as(get("/api/nutricion/metas"), user)).andExpect(status().isForbidden());
            mockMvc.perform(as(get("/api/nutricion/comidas"), user)).andExpect(status().isForbidden());
            mockMvc.perform(as(multipart("/api/nutricion/analisis").file(photo(MealPhotoValidatorTest.JPEG)), user))
                    .andExpect(status().isForbidden());
            mockMvc.perform(as(delete("/api/nutricion/comidas/1"), user)).andExpect(status().isForbidden());
        }
        assertEquals(0, repository.rows.size());
    }

    @Test
    void memberWithoutActiveClientGets403WithMessage() throws Exception {
        expectProblem(
                mockMvc.perform(as(get("/api/nutricion/metas"), "sincliente@test")),
                403,
                "La sección nutricional solo está disponible para socios activos.");
    }

    @Test
    void memberCanCompleteTheWholeFlow() throws Exception {
        mockMvc.perform(as(get("/api/nutricion/metas"), "socio@test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.calories").value(2000));

        String id = analyze("socio@test");
        mockMvc.perform(as(get("/api/nutricion/comidas/" + id + "/imagen"), "socio@test"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "image/jpeg"))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "private"))
                .andExpect(content().bytes(MealPhotoValidatorTest.JPEG));

        mockMvc.perform(as(post("/api/nutricion/analisis/" + id + "/guardar"), "socio@test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.savedAt").isString());
        mockMvc.perform(as(get("/api/nutricion/comidas"), "socio@test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].imageUrl").value("/api/nutricion/comidas/" + id + "/imagen"));

        mockMvc.perform(as(delete("/api/nutricion/comidas/" + id), "socio@test"))
                .andExpect(status().isNoContent());
        mockMvc.perform(as(get("/api/nutricion/comidas"), "socio@test"))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void error400ReachesTheClientWithItsMessage() throws Exception {
        expectProblem(
                mockMvc.perform(as(multipart("/api/nutricion/analisis").file(photo(MealPhotoValidatorTest.GIF)), "socio@test")),
                400,
                "La foto debe ser una imagen JPEG, PNG o WebP.");
        expectProblem(
                mockMvc.perform(as(multipart("/api/nutricion/analisis"), "socio@test")),
                400,
                "Selecciona una foto de tu comida.");
        expectProblem(
                mockMvc.perform(as(post("/api/nutricion/analisis/0/guardar"), "socio@test")),
                400,
                "La solicitud tiene un identificador o una fecha inválida.");
        expectProblem(
                mockMvc.perform(as(get("/api/nutricion/comidas/abc/imagen"), "socio@test")),
                400,
                "La solicitud tiene un identificador o una fecha inválida.");
        expectProblem(
                mockMvc.perform(as(get("/api/nutricion/comidas").param("fecha", "26-11-2026"), "socio@test")),
                400,
                "La solicitud tiene un identificador o una fecha inválida.");
    }

    @Test
    void error404HidesOtherMembersRecords() throws Exception {
        String othersId = analyze("otro@test");

        expectProblem(
                mockMvc.perform(as(post("/api/nutricion/analisis/" + othersId + "/guardar"), "socio@test")),
                404,
                "El análisis ya no está disponible.");
        expectProblem(
                mockMvc.perform(as(get("/api/nutricion/comidas/" + othersId + "/imagen"), "socio@test")),
                404,
                "No se encontró la foto.");

        mockMvc.perform(as(post("/api/nutricion/analisis/" + othersId + "/guardar"), "otro@test"))
                .andExpect(status().isOk());
        expectProblem(
                mockMvc.perform(as(delete("/api/nutricion/comidas/" + othersId), "socio@test")),
                404,
                "La comida ya no existe.");
    }

    @Test
    void error422WhenThePhotoIsNotFood() throws Exception {
        recognitionClient.delegate = fixed(MealRecognition.notFood());

        expectProblem(
                mockMvc.perform(as(multipart("/api/nutricion/analisis").file(photo(MealPhotoValidatorTest.JPEG)), "socio@test")),
                422,
                "No pudimos reconocer la comida");
        assertEquals(0, repository.rows.size());
    }

    @Test
    void error503WhenTheProviderFailsWithoutInternalDetails() throws Exception {
        recognitionClient.delegate = new MealRecognitionClient() {
            @Override
            public String providerName() {
                return "test";
            }

            @Override
            public MealRecognition recognize(byte[] image, String contentType) {
                throw new MealRecognitionUnavailableException("Gemini respondió HTTP 429");
            }
        };

        MvcResult result = expectProblem(
                mockMvc.perform(as(multipart("/api/nutricion/analisis").file(photo(MealPhotoValidatorTest.JPEG)), "socio@test")),
                503,
                UNAVAILABLE);
        assertFalse(result.getResponse().getContentAsString(StandardCharsets.UTF_8).contains("429"));
        assertEquals(0, repository.rows.size());
    }

    /** Código y mensaje en el cuerpo, escritos por el controller: sin sendError ni reenvío a /error. */
    private static MvcResult expectProblem(ResultActions actions, int status, String detail) throws Exception {
        MvcResult result = actions
                .andExpect(status().is(status))
                .andExpect(jsonPath("$.status").value(status))
                .andExpect(jsonPath("$.detail").value(detail))
                .andReturn();
        assertNull(result.getResponse().getErrorMessage(), "La respuesta no debe usar sendError.");
        assertNull(result.getResponse().getForwardedUrl(), "La respuesta no debe reenviarse a /error.");
        return result;
    }

    private String analyze(String user) throws Exception {
        String body = mockMvc.perform(as(multipart("/api/nutricion/analisis").file(photo(MealPhotoValidatorTest.JPEG)), user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isString())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);
        return com.jayway.jsonpath.JsonPath.read(body, "$.id");
    }

    private static MockMultipartFile photo(byte[] content) {
        return new MockMultipartFile("foto", "foto.jpg", "image/jpeg", content);
    }

    private static <B extends AbstractMockHttpServletRequestBuilder<B>> B as(B request, String user) {
        return request.header(HttpHeaders.AUTHORIZATION, basic(user, PASSWORD));
    }

    private static String basic(String user, String password) {
        String token = user + ":" + password;
        return "Basic " + Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
    }

    private static MealRecognitionClient fixed(MealRecognition result) {
        return new MealRecognitionClient() {
            @Override
            public String providerName() {
                return "test";
            }

            @Override
            public MealRecognition recognize(byte[] image, String contentType) {
                return result;
            }
        };
    }

    static final class SwitchableRecognitionClient implements MealRecognitionClient {
        volatile MealRecognitionClient delegate = new SimulatedMealRecognitionClient();

        @Override
        public String providerName() {
            return delegate.providerName();
        }

        @Override
        public MealRecognition recognize(byte[] image, String contentType) {
            return delegate.recognize(image, contentType);
        }
    }

    @TestConfiguration
    @EnableWebSecurity
    static class TestBeans {

        private static final String PASSWORD_HASH = new LegacyAwareBcryptPasswordEncoder().encode(PASSWORD);

        /** correo → (id_usuario, rol). Los socios 10 y 20 tienen cliente activo; el 30 no. */
        private static final Map<String, Object[]> USERS = Map.of(
                "socio@test", new Object[] {10, "ROLE_MEMBER"},
                "otro@test", new Object[] {20, "ROLE_MEMBER"},
                "sincliente@test", new Object[] {30, "ROLE_MEMBER"},
                "admin@test", new Object[] {1, "ROLE_ADMIN"},
                "recepcion@test", new Object[] {2, "ROLE_RECEPTION"},
                "entrenador@test", new Object[] {3, "ROLE_TRAINER"});

        @Bean
        DatabaseUserDetailsService databaseUserDetailsService() {
            return new DatabaseUserDetailsService(null) {
                @Override
                public UserDetails loadUserByUsername(String email) {
                    Object[] user = USERS.get(email);
                    if (user == null) throw new UsernameNotFoundException("Credenciales inválidas.");
                    return new DatabaseUserPrincipal((int) user[0], email, PASSWORD_HASH, (String) user[1], true);
                }
            };
        }

        @Bean
        DatabaseUserDetailsPasswordService databaseUserDetailsPasswordService() {
            return new DatabaseUserDetailsPasswordService(null) {
                @Override
                public UserDetails updatePassword(UserDetails user, String newEncodedPassword) {
                    return user;
                }
            };
        }

        @Bean
        FakeNutritionRepository nutritionRepository() {
            FakeNutritionRepository repository = new FakeNutritionRepository();
            repository.activeClientsByUser.put(10, 100);
            repository.activeClientsByUser.put(20, 200);
            return repository;
        }

        @Bean
        SwitchableRecognitionClient recognitionClient() {
            return new SwitchableRecognitionClient();
        }

        @Bean
        NutritionService nutritionService(FakeNutritionRepository repository, SwitchableRecognitionClient client) {
            return new NutritionService(repository, client);
        }
    }
}
