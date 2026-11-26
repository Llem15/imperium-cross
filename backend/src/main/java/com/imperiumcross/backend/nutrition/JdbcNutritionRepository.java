package com.imperiumcross.backend.nutrition;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * Todo el SQL de la sección nutricional. Usa las tablas propuestas en
 * {@code docs/nutricion-bd-propuesta.sql}; si se ajustan nombres de tablas o columnas, basta con
 * cambiar este archivo.
 */
@Repository
public class JdbcNutritionRepository implements NutritionRepository {

    private static final String MEAL_COLUMNS = """
            r.id_registro_comida, r.nombre_plato, r.porcion, r.calorias, r.proteinas_g,
            r.carbohidratos_g, r.grasas_g, r.fibra_g, r.sodio_mg, r.consejo,
            r.fecha_analisis, r.fecha_registro
            """;

    private final JdbcTemplate jdbcTemplate;

    public JdbcNutritionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<Integer> findActiveClientId(int userId) {
        List<Integer> ids = jdbcTemplate.query("""
                SELECT TOP (1) c.id_cliente
                FROM dbo.Cliente c
                INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
                WHERE c.id_usuario = ? AND c.estado = 1 AND u.estado = 1
                ORDER BY c.id_cliente
                """,
                (rs, rowNum) -> rs.getInt("id_cliente"),
                userId);
        return ids.stream().findFirst();
    }

    @Override
    public int deletePendingAnalysesBefore(LocalDateTime cutoff) {
        // ÚNICO DELETE FÍSICO: LIMPIA ANÁLISIS NO GUARDADOS. LOS INGREDIENTES SE BORRAN EN CASCADA.
        return jdbcTemplate.update("""
                DELETE FROM dbo.RegistroComida
                WHERE estado = 'Pendiente' AND fecha_analisis < ?
                """,
                Timestamp.valueOf(cutoff));
    }

    @Override
    @Transactional
    public int insertPendingAnalysis(NewMeal meal) {
        MealRecognition recognition = meal.recognition();
        NutrientValues nutrients = recognition.nutrients();
        Integer mealId = jdbcTemplate.queryForObject("""
                INSERT INTO dbo.RegistroComida
                    (id_cliente, nombre_plato, porcion, calorias, proteinas_g, carbohidratos_g,
                     grasas_g, fibra_g, sodio_mg, consejo, imagen, tipo_imagen, proveedor_ia,
                     estado, fecha_analisis)
                OUTPUT INSERTED.id_registro_comida
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', ?)
                """,
                Integer.class,
                meal.clientId(),
                recognition.dishName(),
                recognition.portion(),
                decimal(nutrients.calories()),
                decimal(nutrients.protein()),
                decimal(nutrients.carbs()),
                decimal(nutrients.fat()),
                decimal(nutrients.fiber()),
                decimal(nutrients.sodium()),
                recognition.tip() == null || recognition.tip().isBlank() ? null : recognition.tip(),
                meal.image(),
                meal.imageContentType(),
                meal.provider(),
                Timestamp.valueOf(meal.analyzedAt()));
        if (mealId == null) {
            throw new IllegalStateException("SQL Server no devolvió el identificador del registro de comida.");
        }

        List<RecognizedIngredient> ingredients = recognition.ingredients();
        for (int index = 0; index < ingredients.size(); index++) {
            RecognizedIngredient ingredient = ingredients.get(index);
            jdbcTemplate.update("""
                    INSERT INTO dbo.IngredienteComida
                        (id_registro_comida, nombre, porcion, calorias, orden)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    mealId,
                    ingredient.name(),
                    ingredient.portion(),
                    decimal(ingredient.calories()),
                    index + 1);
        }
        return mealId;
    }

    @Override
    public Optional<StoredMeal> findMeal(int clientId, int mealId, MealStatus status) {
        List<StoredMeal> meals = jdbcTemplate.query(
                "SELECT " + MEAL_COLUMNS + """
                FROM dbo.RegistroComida r
                WHERE r.id_registro_comida = ? AND r.id_cliente = ? AND r.estado = ?
                """,
                (rs, rowNum) -> mapMeal(rs, List.of()),
                mealId,
                clientId,
                status.databaseValue());
        if (meals.isEmpty()) return Optional.empty();

        List<StoredIngredient> ingredients = jdbcTemplate.query("""
                SELECT id_ingrediente_comida, nombre, porcion, calorias
                FROM dbo.IngredienteComida
                WHERE id_registro_comida = ?
                ORDER BY orden, id_ingrediente_comida
                """,
                (rs, rowNum) -> mapIngredient(rs),
                mealId);
        return Optional.of(withIngredients(meals.get(0), ingredients));
    }

    @Override
    public List<StoredMeal> findSavedMeals(
            int clientId,
            LocalDateTime fromInclusive,
            LocalDateTime toExclusive) {
        String filter = """
                WHERE r.id_cliente = ? AND r.estado = 'Guardado'
                """ + (fromInclusive == null ? "" : """
                  AND r.fecha_registro >= ? AND r.fecha_registro < ?
                """);
        Object[] arguments = fromInclusive == null
                ? new Object[] {clientId}
                : new Object[] {clientId, Timestamp.valueOf(fromInclusive), Timestamp.valueOf(toExclusive)};

        List<StoredMeal> meals = jdbcTemplate.query(
                "SELECT " + MEAL_COLUMNS + "FROM dbo.RegistroComida r\n" + filter
                        + "ORDER BY r.fecha_registro DESC, r.id_registro_comida DESC",
                (rs, rowNum) -> mapMeal(rs, List.of()),
                arguments);
        if (meals.isEmpty()) return List.of();

        Map<Integer, List<StoredIngredient>> ingredientsByMeal = new HashMap<>();
        jdbcTemplate.query(
                """
                SELECT i.id_registro_comida, i.id_ingrediente_comida, i.nombre, i.porcion, i.calorias
                FROM dbo.IngredienteComida i
                INNER JOIN dbo.RegistroComida r ON r.id_registro_comida = i.id_registro_comida
                """ + filter + "ORDER BY i.id_registro_comida, i.orden, i.id_ingrediente_comida",
                (RowCallbackHandler) rs -> ingredientsByMeal
                        .computeIfAbsent(rs.getInt("id_registro_comida"), ignored -> new ArrayList<>())
                        .add(mapIngredient(rs)),
                arguments);

        return meals.stream()
                .map(meal -> withIngredients(meal, ingredientsByMeal.getOrDefault(meal.id(), List.of())))
                .toList();
    }

    @Override
    public boolean markSaved(int clientId, int mealId, LocalDateTime savedAt, LocalDateTime notBefore) {
        return jdbcTemplate.update("""
                UPDATE dbo.RegistroComida
                SET estado = 'Guardado', fecha_registro = ?
                WHERE id_registro_comida = ?
                  AND id_cliente = ?
                  AND estado = 'Pendiente'
                  AND fecha_analisis >= ?
                """,
                Timestamp.valueOf(savedAt),
                mealId,
                clientId,
                Timestamp.valueOf(notBefore)) == 1;
    }

    @Override
    public boolean markDeleted(int clientId, int mealId) {
        return jdbcTemplate.update("""
                UPDATE dbo.RegistroComida
                SET estado = 'Eliminado'
                WHERE id_registro_comida = ? AND id_cliente = ? AND estado = 'Guardado'
                """,
                mealId,
                clientId) == 1;
    }

    @Override
    public Optional<MealPhoto> findPhoto(int clientId, int mealId) {
        List<MealPhoto> photos = jdbcTemplate.query("""
                SELECT imagen, tipo_imagen
                FROM dbo.RegistroComida
                WHERE id_registro_comida = ?
                  AND id_cliente = ?
                  AND estado IN ('Pendiente', 'Guardado')
                  AND imagen IS NOT NULL
                  AND tipo_imagen IS NOT NULL
                """,
                (rs, rowNum) -> new MealPhoto(rs.getBytes("imagen"), rs.getString("tipo_imagen")),
                mealId,
                clientId);
        return photos.stream().findFirst();
    }

    private static StoredMeal mapMeal(ResultSet rs, List<StoredIngredient> ingredients) throws SQLException {
        Timestamp savedAt = rs.getTimestamp("fecha_registro");
        return new StoredMeal(
                rs.getInt("id_registro_comida"),
                rs.getString("nombre_plato"),
                rs.getString("porcion"),
                new NutrientValues(
                        rs.getDouble("calorias"),
                        rs.getDouble("proteinas_g"),
                        rs.getDouble("carbohidratos_g"),
                        rs.getDouble("grasas_g"),
                        rs.getDouble("fibra_g"),
                        rs.getDouble("sodio_mg")),
                rs.getString("consejo"),
                rs.getTimestamp("fecha_analisis").toLocalDateTime(),
                savedAt == null ? null : savedAt.toLocalDateTime(),
                ingredients);
    }

    private static StoredIngredient mapIngredient(ResultSet rs) throws SQLException {
        return new StoredIngredient(
                rs.getInt("id_ingrediente_comida"),
                rs.getString("nombre"),
                rs.getString("porcion"),
                rs.getDouble("calorias"));
    }

    private static StoredMeal withIngredients(StoredMeal meal, List<StoredIngredient> ingredients) {
        return new StoredMeal(
                meal.id(),
                meal.dishName(),
                meal.portion(),
                meal.nutrients(),
                meal.tip(),
                meal.analyzedAt(),
                meal.savedAt(),
                List.copyOf(ingredients));
    }

    private static BigDecimal decimal(double value) {
        return BigDecimal.valueOf(value);
    }
}
