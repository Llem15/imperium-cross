package com.imperiumcross.backend.nutrition;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Devuelve en orden rotativo los mismos platos de ejemplo que {@code mocks/nutrition.ts},
 * para desarrollar y probar sin API key.
 */
public class SimulatedMealRecognitionClient implements MealRecognitionClient {

    static final String PROVIDER = "simulated";

    private static final List<MealRecognition> SAMPLES = List.of(
            new MealRecognition(
                    true,
                    "Lomo saltado con arroz",
                    "1 plato (420 g)",
                    new NutrientValues(680, 38, 72, 24, 5, 1150),
                    List.of(
                            new RecognizedIngredient("Lomo de res", "150 g", 285),
                            new RecognizedIngredient("Arroz blanco", "150 g", 195),
                            new RecognizedIngredient("Papas fritas", "80 g", 150),
                            new RecognizedIngredient("Cebolla y tomate", "40 g", 50)),
                    "Buena fuente de proteína para recuperar tras el entrenamiento. Si buscas reducir "
                            + "calorías, cambia las papas fritas por ensalada y controla la sal de la "
                            + "salsa de soya."),
            new MealRecognition(
                    true,
                    "Ensalada de pollo a la plancha",
                    "1 bowl (350 g)",
                    new NutrientValues(420, 42, 18, 19, 7, 640),
                    List.of(
                            new RecognizedIngredient("Pechuga de pollo", "160 g", 260),
                            new RecognizedIngredient("Lechuga y espinaca", "90 g", 20),
                            new RecognizedIngredient("Palta", "50 g", 80),
                            new RecognizedIngredient("Aderezo de oliva", "15 ml", 60)),
                    "Plato alto en proteína y fibra, ideal para tu meta. Agrega una porción de quinua "
                            + "o camote si entrenas hoy para recargar energía."),
            new MealRecognition(
                    true,
                    "Avena con plátano y mantequilla de maní",
                    "1 taza (300 g)",
                    new NutrientValues(510, 17, 74, 17, 9, 160),
                    List.of(
                            new RecognizedIngredient("Avena", "60 g", 230),
                            new RecognizedIngredient("Plátano", "1 unidad", 105),
                            new RecognizedIngredient("Mantequilla de maní", "15 g", 90),
                            new RecognizedIngredient("Leche descremada", "200 ml", 85)),
                    "Desayuno con carbohidratos de absorción lenta, perfecto antes de entrenar. Suma "
                            + "claras de huevo o yogur griego para subir la proteína."));

    private final AtomicInteger nextSample = new AtomicInteger();

    @Override
    public String providerName() {
        return PROVIDER;
    }

    @Override
    public MealRecognition recognize(byte[] image, String contentType) {
        int index = Math.floorMod(nextSample.getAndIncrement(), SAMPLES.size());
        return SAMPLES.get(index);
    }
}
