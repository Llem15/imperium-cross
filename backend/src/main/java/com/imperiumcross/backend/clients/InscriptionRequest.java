package com.imperiumcross.backend.clients;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record InscriptionRequest(
        @NotBlank @Size(max = 30) @Pattern(regexp = "^[\\p{L}]+( [\\p{L}]+)*$") String nombres,
        @NotBlank @Size(max = 30) @Pattern(regexp = "^[\\p{L}]+( [\\p{L}]+)*$") String apellidos,
        @NotBlank @Pattern(regexp = "\\d{8}") String dni,
        @NotBlank @Pattern(regexp = "9\\d{8}") String telefono,
        @NotBlank @Email @Size(max = 50) String correo,
        @NotBlank @Pattern(regexp = "^(?=.*\\p{L})(?=.*\\d).{8,72}$") String contrasena,
        @NotBlank @Size(max = 35) String objetivo,
        @NotBlank @Pattern(regexp = "^(basico|premium|pro)$") String plan,
        @NotBlank @Pattern(regexp = "^(Yape|Tarjeta|Efectivo)$") String metodoPago) {
}