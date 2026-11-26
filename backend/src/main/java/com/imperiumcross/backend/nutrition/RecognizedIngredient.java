package com.imperiumcross.backend.nutrition;

/** Ingrediente detectado por el proveedor de IA, antes de guardarse. */
public record RecognizedIngredient(String name, String portion, double calories) {
}
