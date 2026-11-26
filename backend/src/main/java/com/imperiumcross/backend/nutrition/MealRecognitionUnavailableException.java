package com.imperiumcross.backend.nutrition;

/**
 * El proveedor de IA no pudo analizar la foto (límite superado, error o respuesta inválida).
 * {@link NutritionController} la convierte en {@code 503} sin exponer el detalle interno.
 */
public class MealRecognitionUnavailableException extends RuntimeException {

    public MealRecognitionUnavailableException(String internalReason) {
        super(internalReason);
    }

    public MealRecognitionUnavailableException(String internalReason, Throwable cause) {
        super(internalReason, cause);
    }
}
