package com.imperiumcross.backend.dto;

public record LoginResponse(
        Integer idUsuario,
        String nombres,
        String apellidos,
        String correo,
        String rol
) {
}