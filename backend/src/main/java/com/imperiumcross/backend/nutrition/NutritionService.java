package com.imperiumcross.backend.nutrition;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.imperiumcross.backend.nutrition.NutritionRepository.MealStatus;
import com.imperiumcross.backend.nutrition.NutritionRepository.NewMeal;
import com.imperiumcross.backend.nutrition.NutritionRepository.StoredMeal;

/** Reglas de negocio de la sección nutricional del socio. */
@Service
public class NutritionService {

    static final ZoneId PERU = ZoneId.of("America/Lima");
    static final Duration PENDING_TTL = Duration.ofHours(24);
    static final String NOT_RECOGNIZED_MESSAGE = "No pudimos reconocer la comida";

    /** Metas diarias por defecto, iguales a {@code mockDailyGoals} del frontend. */
    static final NutrientValues DEFAULT_DAILY_GOALS = new NutrientValues(2000, 120, 250, 65, 30, 2300);

    private static final HttpStatusCode UNPROCESSABLE = HttpStatusCode.valueOf(422);

    private final NutritionRepository repository;
    private final MealRecognitionClient recognitionClient;
    private final Clock clock;

    @Autowired
    public NutritionService(NutritionRepository repository, MealRecognitionClient recognitionClient) {
        this(repository, recognitionClient, Clock.system(PERU));
    }

    NutritionService(NutritionRepository repository, MealRecognitionClient recognitionClient, Clock clock) {
        this.repository = repository;
        this.recognitionClient = recognitionClient;
        this.clock = clock.withZone(PERU);
    }

    public NutrientValues findDailyGoals(int userId) {
        requireClientId(userId);
        return DEFAULT_DAILY_GOALS;
    }

    public List<MealResponse> findSavedMeals(int userId, LocalDate date) {
        int clientId = requireClientId(userId);
        List<StoredMeal> meals = date == null
                ? repository.findSavedMeals(clientId, null, null)
                : repository.findSavedMeals(
                        clientId,
                        date.atStartOfDay(),
                        date.plusDays(1).atStartOfDay());
        return meals.stream().map(NutritionService::toMeal).toList();
    }

    public MealAnalysisResponse analyze(int userId, byte[] photo) {
        int clientId = requireClientId(userId);
        repository.deletePendingAnalysesBefore(now().minus(PENDING_TTL));

        String contentType = validatePhoto(photo);
        MealRecognition recognition = MealRecognitionSanitizer.sanitize(
                recognitionClient.recognize(photo, contentType));
        if (!recognition.food()) {
            throw new ResponseStatusException(UNPROCESSABLE, NOT_RECOGNIZED_MESSAGE);
        }

        int mealId = repository.insertPendingAnalysis(new NewMeal(
                clientId,
                recognition,
                photo,
                contentType,
                recognitionClient.providerName(),
                now()));
        return repository.findMeal(clientId, mealId, MealStatus.PENDING)
                .map(NutritionService::toAnalysis)
                .orElseThrow(() -> new IllegalStateException("No se pudo leer el análisis recién guardado."));
    }

    @Transactional
    public MealResponse save(int userId, int analysisId) {
        int clientId = requireClientId(userId);
        LocalDateTime now = now();
        if (!repository.markSaved(clientId, analysisId, now, now.minus(PENDING_TTL))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El análisis ya no está disponible.");
        }
        return repository.findMeal(clientId, analysisId, MealStatus.SAVED)
                .map(NutritionService::toMeal)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "El análisis ya no está disponible."));
    }

    public void delete(int userId, int mealId) {
        int clientId = requireClientId(userId);
        if (!repository.markDeleted(clientId, mealId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "La comida ya no existe.");
        }
    }

    public MealPhoto findPhoto(int userId, int mealId) {
        int clientId = requireClientId(userId);
        return repository.findPhoto(clientId, mealId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró la foto."));
    }

    private int requireClientId(int userId) {
        return repository.findActiveClientId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "La sección nutricional solo está disponible para socios activos."));
    }

    private static String validatePhoto(byte[] photo) {
        if (photo == null || photo.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona una foto de tu comida.");
        }
        if (photo.length > MealPhotoValidator.MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La foto supera los 5 MB.");
        }
        return MealPhotoValidator.detectContentType(photo)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La foto debe ser una imagen JPEG, PNG o WebP."));
    }

    private LocalDateTime now() {
        // DATETIME2(0) NO GUARDA FRACCIONES DE SEGUNDO.
        return LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS);
    }

    private static MealAnalysisResponse toAnalysis(StoredMeal meal) {
        return new MealAnalysisResponse(
                String.valueOf(meal.id()),
                meal.dishName(),
                meal.portion(),
                imageUrl(meal.id()),
                isoDateTime(meal.analyzedAt()),
                meal.nutrients(),
                ingredients(meal),
                meal.tip() == null ? "" : meal.tip());
    }

    private static MealResponse toMeal(StoredMeal meal) {
        return new MealResponse(
                String.valueOf(meal.id()),
                meal.dishName(),
                meal.portion(),
                imageUrl(meal.id()),
                isoDateTime(meal.analyzedAt()),
                meal.nutrients(),
                ingredients(meal),
                meal.tip() == null ? "" : meal.tip(),
                isoDateTime(meal.savedAt()));
    }

    private static List<MealIngredientResponse> ingredients(StoredMeal meal) {
        return meal.ingredients().stream()
                .map(ingredient -> new MealIngredientResponse(
                        String.valueOf(ingredient.id()),
                        ingredient.name(),
                        ingredient.portion(),
                        ingredient.calories()))
                .toList();
    }

    static String imageUrl(int mealId) {
        return "/api/nutricion/comidas/" + mealId + "/imagen";
    }

    private static String isoDateTime(LocalDateTime peruDateTime) {
        if (peruDateTime == null) return null;
        return peruDateTime.atZone(PERU).toOffsetDateTime().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }
}
