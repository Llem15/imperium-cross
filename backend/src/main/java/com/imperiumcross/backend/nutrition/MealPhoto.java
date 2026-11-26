package com.imperiumcross.backend.nutrition;

/** Foto guardada de una comida y su tipo MIME detectado por los bytes iniciales. */
public record MealPhoto(byte[] content, String contentType) {
}
