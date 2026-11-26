package com.imperiumcross.backend.nutrition;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import com.imperiumcross.backend.nutrition.NutritionRepository.MealStatus;

class NutritionServiceTest {

    private static final int MEMBER_USER = 10;
    private static final int MEMBER_CLIENT = 100;
    private static final int OTHER_USER = 20;
    private static final int OTHER_CLIENT = 200;
    private static final int USER_WITHOUT_CLIENT = 30;

    private FakeNutritionRepository repository;
    private MutableClock clock;
    private MealRecognitionClient recognitionClient;
    private NutritionService service;

    @BeforeEach
    void setUp() {
        repository = new FakeNutritionRepository();
        repository.activeClientsByUser.put(MEMBER_USER, MEMBER_CLIENT);
        repository.activeClientsByUser.put(OTHER_USER, OTHER_CLIENT);
        clock = new MutableClock(ZonedDateTime.of(2026, 11, 26, 13, 15, 30, 0, NutritionService.PERU).toInstant());
        recognitionClient = new SimulatedMealRecognitionClient();
        service = new NutritionService(repository, recognitionClient, clock);
    }

    @Test
    void returnsDefaultDailyGoals() {
        assertEquals(new NutrientValues(2000, 120, 250, 65, 30, 2300), service.findDailyGoals(MEMBER_USER));
    }

    @Test
    void usersWithoutActiveClientGetForbidden() {
        assertStatus(403, () -> service.findDailyGoals(USER_WITHOUT_CLIENT));
        assertStatus(403, () -> service.findSavedMeals(USER_WITHOUT_CLIENT, null));
        assertStatus(403, () -> service.analyze(USER_WITHOUT_CLIENT, MealPhotoValidatorTest.JPEG));
        assertTrue(repository.rows.isEmpty());
    }

    @Test
    void analyzeStoresPendingResultWithPeruOffsetAndStringIds() {
        MealAnalysisResponse analysis = service.analyze(MEMBER_USER, MealPhotoValidatorTest.PNG);

        assertEquals("1", analysis.id());
        assertEquals("Lomo saltado con arroz", analysis.dishName());
        assertEquals("/api/nutricion/comidas/1/imagen", analysis.imageUrl());
        assertEquals("2026-11-26T13:15:30-05:00", analysis.analyzedAt());
        assertEquals(4, analysis.ingredients().size());
        assertFalse(analysis.ingredients().get(0).id().isBlank());

        FakeNutritionRepository.Row row = repository.rows.get(1);
        assertEquals(MealStatus.PENDING, row.status);
        assertEquals(MEMBER_CLIENT, row.clientId);
        assertEquals("simulated", row.provider);
        assertEquals("image/png", row.photo.contentType());
        assertTrue(service.findSavedMeals(MEMBER_USER, null).isEmpty());
    }

    @Test
    void notFoodReturns422AndStoresNothing() {
        service = new NutritionService(repository, fixedClient(MealRecognition.notFood()), clock);

        ResponseStatusException exception = assertStatus(
                422,
                () -> service.analyze(MEMBER_USER, MealPhotoValidatorTest.JPEG));
        assertEquals("No pudimos reconocer la comida", exception.getReason());
        assertTrue(repository.rows.isEmpty());
    }

    @Test
    void invalidAiResponseIsAProviderErrorAndStoresNothing() {
        service = new NutritionService(
                repository,
                fixedClient(new MealRecognition(true, "", "1 plato", null, List.of(), "")),
                clock);

        assertThrows(MealRecognitionUnavailableException.class,
                () -> service.analyze(MEMBER_USER, MealPhotoValidatorTest.JPEG));
        assertTrue(repository.rows.isEmpty());
    }

    @Test
    void providerFailurePropagatesAsUnavailable() {
        MealRecognitionClient failing = new MealRecognitionClient() {
            @Override
            public String providerName() {
                return "test";
            }

            @Override
            public MealRecognition recognize(byte[] image, String contentType) {
                throw new MealRecognitionUnavailableException("429");
            }
        };
        service = new NutritionService(repository, failing, clock);

        assertThrows(MealRecognitionUnavailableException.class,
                () -> service.analyze(MEMBER_USER, MealPhotoValidatorTest.JPEG));
        assertTrue(repository.rows.isEmpty());
    }

    @Test
    void rejectsInvalidPhotosBeforeCallingTheProvider() {
        service = new NutritionService(repository, fixedClient(null), clock);

        assertStatus(400, () -> service.analyze(MEMBER_USER, null));
        assertStatus(400, () -> service.analyze(MEMBER_USER, new byte[0]));
        assertStatus(400, () -> service.analyze(MEMBER_USER, MealPhotoValidatorTest.GIF));

        byte[] tooLarge = new byte[MealPhotoValidator.MAX_BYTES + 1];
        System.arraycopy(MealPhotoValidatorTest.JPEG, 0, tooLarge, 0, MealPhotoValidatorTest.JPEG.length);
        assertStatus(400, () -> service.analyze(MEMBER_USER, tooLarge));
        assertTrue(repository.rows.isEmpty());
    }

    @Test
    void savingMovesPendingToSavedAndAppearsInHistory() {
        MealAnalysisResponse analysis = service.analyze(MEMBER_USER, MealPhotoValidatorTest.JPEG);
        clock.advance(Duration.ofMinutes(2));

        MealResponse meal = service.save(MEMBER_USER, Integer.parseInt(analysis.id()));

        assertEquals(analysis.id(), meal.id());
        assertEquals("2026-11-26T13:17:30-05:00", meal.savedAt());
        assertEquals(List.of(meal), service.findSavedMeals(MEMBER_USER, null));
        assertStatus(404, () -> service.save(MEMBER_USER, Integer.parseInt(analysis.id())));
    }

    @Test
    void membersCannotSaveDeleteOrSeeOthersMeals() {
        int pendingId = Integer.parseInt(service.analyze(OTHER_USER, MealPhotoValidatorTest.JPEG).id());
        assertStatus(404, () -> service.save(MEMBER_USER, pendingId));
        assertStatus(404, () -> service.findPhoto(MEMBER_USER, pendingId));

        service.save(OTHER_USER, pendingId);
        assertStatus(404, () -> service.delete(MEMBER_USER, pendingId));
        assertStatus(404, () -> service.findPhoto(MEMBER_USER, pendingId));
        assertTrue(service.findSavedMeals(MEMBER_USER, null).isEmpty());
        assertEquals(1, service.findSavedMeals(OTHER_USER, null).size());
    }

    @Test
    void deleteIsLogicalAndHidesTheMealAndPhoto() {
        int id = Integer.parseInt(service.analyze(MEMBER_USER, MealPhotoValidatorTest.JPEG).id());
        assertStatus(404, () -> service.delete(MEMBER_USER, id));

        service.save(MEMBER_USER, id);
        service.delete(MEMBER_USER, id);

        assertEquals(MealStatus.DELETED, repository.rows.get(id).status);
        assertTrue(service.findSavedMeals(MEMBER_USER, null).isEmpty());
        assertStatus(404, () -> service.findPhoto(MEMBER_USER, id));
        assertStatus(404, () -> service.delete(MEMBER_USER, id));
    }

    @Test
    void returnsOwnPhotoWithDetectedContentType() {
        int id = Integer.parseInt(service.analyze(MEMBER_USER, MealPhotoValidatorTest.WEBP).id());

        MealPhoto photo = service.findPhoto(MEMBER_USER, id);

        assertEquals("image/webp", photo.contentType());
        assertArrayEquals(MealPhotoValidatorTest.WEBP, photo.content());
    }

    @Test
    void historyIsNewestFirstAndFiltersByPeruLocalDate() {
        clock.set(ZonedDateTime.of(2026, 11, 25, 23, 30, 0, 0, NutritionService.PERU).toInstant());
        int lateNight = saveNewMeal();
        clock.set(ZonedDateTime.of(2026, 11, 26, 0, 10, 0, 0, NutritionService.PERU).toInstant());
        int earlyMorning = saveNewMeal();
        clock.set(ZonedDateTime.of(2026, 11, 26, 12, 0, 0, 0, NutritionService.PERU).toInstant());
        int noon = saveNewMeal();

        assertEquals(
                List.of(String.valueOf(noon), String.valueOf(earlyMorning), String.valueOf(lateNight)),
                ids(service.findSavedMeals(MEMBER_USER, null)));
        assertEquals(
                List.of(String.valueOf(noon), String.valueOf(earlyMorning)),
                ids(service.findSavedMeals(MEMBER_USER, LocalDate.of(2026, 11, 26))));
        assertEquals(
                List.of(String.valueOf(lateNight)),
                ids(service.findSavedMeals(MEMBER_USER, LocalDate.of(2026, 11, 25))));
        // 23:30 EN LIMA ES 04:30 UTC DEL DÍA SIGUIENTE; EL JSON CONSERVA LA HORA LOCAL Y SU OFFSET.
        assertEquals(
                "2026-11-25T23:30:00-05:00",
                service.findSavedMeals(MEMBER_USER, LocalDate.of(2026, 11, 25)).get(0).savedAt());
    }

    @Test
    void pendingAnalysesExpireAfter24Hours() {
        int stale = Integer.parseInt(service.analyze(MEMBER_USER, MealPhotoValidatorTest.JPEG).id());
        clock.advance(Duration.ofHours(24).plusSeconds(1));

        assertStatus(404, () -> service.save(MEMBER_USER, stale));
        assertTrue(repository.rows.containsKey(stale));

        service.analyze(OTHER_USER, MealPhotoValidatorTest.JPEG);
        assertFalse(repository.rows.containsKey(stale));
    }

    @Test
    void cleanupKeepsSavedMeals() {
        int saved = saveNewMeal();
        clock.advance(Duration.ofDays(3));

        service.analyze(MEMBER_USER, MealPhotoValidatorTest.JPEG);

        assertEquals(MealStatus.SAVED, repository.rows.get(saved).status);
    }

    private int saveNewMeal() {
        int id = Integer.parseInt(service.analyze(MEMBER_USER, MealPhotoValidatorTest.JPEG).id());
        service.save(MEMBER_USER, id);
        return id;
    }

    private static List<String> ids(List<MealResponse> meals) {
        return meals.stream().map(MealResponse::id).toList();
    }

    private static MealRecognitionClient fixedClient(MealRecognition result) {
        return new MealRecognitionClient() {
            @Override
            public String providerName() {
                return "test";
            }

            @Override
            public MealRecognition recognize(byte[] image, String contentType) {
                if (result == null) throw new AssertionError("No se debe llamar al proveedor.");
                return result;
            }
        };
    }

    private static ResponseStatusException assertStatus(int status, Runnable action) {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, action::run);
        assertEquals(status, exception.getStatusCode().value());
        return exception;
    }

    private static final class MutableClock extends Clock {
        private Instant instant;

        MutableClock(Instant instant) {
            this.instant = instant;
        }

        void set(Instant instant) {
            this.instant = instant;
        }

        void advance(Duration duration) {
            instant = instant.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return NutritionService.PERU;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
