package com.imperiumcross.backend.nutrition;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Acceso a datos de la sección nutricional. Todo el SQL vive en {@link JdbcNutritionRepository};
 * esta interfaz permite probar el servicio con un repositorio en memoria.
 *
 * <p>Todas las operaciones sobre registros reciben el {@code idCliente} y filtran por él, para que
 * un socio nunca lea ni modifique registros de otro. Las fechas son hora local de Perú.
 */
public interface NutritionRepository {

    /** {@code id_cliente} activo del usuario, si existe. */
    Optional<Integer> findActiveClientId(int userId);

    /** Elimina los análisis {@code Pendiente} analizados antes de {@code cutoff}. */
    int deletePendingAnalysesBefore(LocalDateTime cutoff);

    /** Inserta un análisis {@code Pendiente} con sus ingredientes y devuelve su id. */
    int insertPendingAnalysis(NewMeal meal);

    /** Registro del cliente en el estado indicado, con sus ingredientes. */
    Optional<StoredMeal> findMeal(int clientId, int mealId, MealStatus status);

    /**
     * Comidas {@code Guardado} del cliente, de la más reciente a la más antigua. Si
     * {@code fromInclusive} es nulo, no filtra por fecha.
     */
    List<StoredMeal> findSavedMeals(int clientId, LocalDateTime fromInclusive, LocalDateTime toExclusive);

    /**
     * Pasa un análisis {@code Pendiente} del cliente, analizado desde {@code notBefore}, a
     * {@code Guardado}. Devuelve falso si no existe o no le pertenece.
     */
    boolean markSaved(int clientId, int mealId, LocalDateTime savedAt, LocalDateTime notBefore);

    /** Pasa una comida {@code Guardado} del cliente a {@code Eliminado}. */
    boolean markDeleted(int clientId, int mealId);

    /** Foto de un registro {@code Pendiente} o {@code Guardado} del cliente. */
    Optional<MealPhoto> findPhoto(int clientId, int mealId);

    enum MealStatus {
        PENDING("Pendiente"),
        SAVED("Guardado"),
        DELETED("Eliminado");

        private final String databaseValue;

        MealStatus(String databaseValue) {
            this.databaseValue = databaseValue;
        }

        public String databaseValue() {
            return databaseValue;
        }
    }

    record NewMeal(
            int clientId,
            MealRecognition recognition,
            byte[] image,
            String imageContentType,
            String provider,
            LocalDateTime analyzedAt) {
    }

    record StoredMeal(
            int id,
            String dishName,
            String portion,
            NutrientValues nutrients,
            String tip,
            LocalDateTime analyzedAt,
            LocalDateTime savedAt,
            List<StoredIngredient> ingredients) {
    }

    record StoredIngredient(int id, String name, String portion, double calories) {
    }
}
