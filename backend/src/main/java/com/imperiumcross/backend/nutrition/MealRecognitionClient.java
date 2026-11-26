package com.imperiumcross.backend.nutrition;

/** Reconoce el plato de una foto. Las implementaciones no deben registrar la imagen en los logs. */
public interface MealRecognitionClient {

    /** Nombre corto que se guarda en {@code RegistroComida.proveedor_ia}. */
    String providerName();

    /**
     * @param image bytes de la foto ya validada
     * @param contentType tipo MIME detectado por los bytes iniciales
     * @throws MealRecognitionUnavailableException si el proveedor falla o responde algo inválido
     */
    MealRecognition recognize(byte[] image, String contentType);
}
