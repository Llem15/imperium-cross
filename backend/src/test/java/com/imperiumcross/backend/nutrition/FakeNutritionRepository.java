package com.imperiumcross.backend.nutrition;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Repositorio en memoria que imita las reglas del SQL de {@link JdbcNutritionRepository}. */
class FakeNutritionRepository implements NutritionRepository {

    final Map<Integer, Integer> activeClientsByUser = new HashMap<>();
    final Map<Integer, Row> rows = new LinkedHashMap<>();
    private int nextMealId = 1;
    private int nextIngredientId = 1;

    static final class Row {
        int clientId;
        MealStatus status;
        StoredMeal meal;
        MealPhoto photo;
        String provider;
    }

    @Override
    public Optional<Integer> findActiveClientId(int userId) {
        return Optional.ofNullable(activeClientsByUser.get(userId));
    }

    @Override
    public int deletePendingAnalysesBefore(LocalDateTime cutoff) {
        int before = rows.size();
        rows.values().removeIf(row ->
                row.status == MealStatus.PENDING && row.meal.analyzedAt().isBefore(cutoff));
        return before - rows.size();
    }

    @Override
    public int insertPendingAnalysis(NewMeal meal) {
        int id = nextMealId++;
        List<StoredIngredient> ingredients = new ArrayList<>();
        for (RecognizedIngredient ingredient : meal.recognition().ingredients()) {
            ingredients.add(new StoredIngredient(
                    nextIngredientId++,
                    ingredient.name(),
                    ingredient.portion(),
                    ingredient.calories()));
        }
        Row row = new Row();
        row.clientId = meal.clientId();
        row.status = MealStatus.PENDING;
        row.provider = meal.provider();
        row.photo = new MealPhoto(meal.image(), meal.imageContentType());
        row.meal = new StoredMeal(
                id,
                meal.recognition().dishName(),
                meal.recognition().portion(),
                meal.recognition().nutrients(),
                meal.recognition().tip(),
                meal.analyzedAt(),
                null,
                List.copyOf(ingredients));
        rows.put(id, row);
        return id;
    }

    @Override
    public Optional<StoredMeal> findMeal(int clientId, int mealId, MealStatus status) {
        Row row = rows.get(mealId);
        if (row == null || row.clientId != clientId || row.status != status) return Optional.empty();
        return Optional.of(row.meal);
    }

    @Override
    public List<StoredMeal> findSavedMeals(int clientId, LocalDateTime fromInclusive, LocalDateTime toExclusive) {
        return rows.values().stream()
                .filter(row -> row.clientId == clientId && row.status == MealStatus.SAVED)
                .filter(row -> fromInclusive == null
                        || (!row.meal.savedAt().isBefore(fromInclusive)
                                && row.meal.savedAt().isBefore(toExclusive)))
                .map(row -> row.meal)
                .sorted(Comparator.comparing(StoredMeal::savedAt)
                        .thenComparing(StoredMeal::id)
                        .reversed())
                .toList();
    }

    @Override
    public boolean markSaved(int clientId, int mealId, LocalDateTime savedAt, LocalDateTime notBefore) {
        Row row = rows.get(mealId);
        if (row == null
                || row.clientId != clientId
                || row.status != MealStatus.PENDING
                || row.meal.analyzedAt().isBefore(notBefore)) {
            return false;
        }
        StoredMeal meal = row.meal;
        row.status = MealStatus.SAVED;
        row.meal = new StoredMeal(
                meal.id(),
                meal.dishName(),
                meal.portion(),
                meal.nutrients(),
                meal.tip(),
                meal.analyzedAt(),
                savedAt,
                meal.ingredients());
        return true;
    }

    @Override
    public boolean markDeleted(int clientId, int mealId) {
        Row row = rows.get(mealId);
        if (row == null || row.clientId != clientId || row.status != MealStatus.SAVED) return false;
        row.status = MealStatus.DELETED;
        return true;
    }

    @Override
    public Optional<MealPhoto> findPhoto(int clientId, int mealId) {
        Row row = rows.get(mealId);
        if (row == null || row.clientId != clientId || row.status == MealStatus.DELETED) {
            return Optional.empty();
        }
        return Optional.of(row.photo);
    }
}
