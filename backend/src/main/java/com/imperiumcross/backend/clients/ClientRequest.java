package com.imperiumcross.backend.clients;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ClientRequest(
        @NotBlank @Size(max = 30) String nombres,
        @NotBlank @Size(max = 30) String apellidos,
        @NotBlank @Pattern(regexp = "\\d{8}") String dni,
        @Pattern(regexp = "\\d{9}") String telefono,
        @NotBlank @Email @Size(max = 50) String correo,
        @Pattern(regexp = "^$|^\\d{4}-\\d{2}-\\d{2}$") String fechaNacimiento,
        @NotBlank @Size(max = 35) String objetivo) {
}
