package com.imperiumcross.backend.users;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserRequest(
        @NotBlank @Size(max = 30) @Pattern(regexp = "^[\\p{L}]+( [\\p{L}]+)*$") String nombres,
        @NotBlank @Size(max = 30) @Pattern(regexp = "^[\\p{L}]+( [\\p{L}]+)*$") String apellidos,
        @NotBlank @Pattern(regexp = "\\d{8}") String dni,
        @Pattern(regexp = "\\d{9}") String telefono,
        @NotBlank @Email @Size(max = 50) String correo,
        @Min(1) @Max(3) int idRol,
        boolean activo,
        @Size(max = 8000000) String foto) {
}