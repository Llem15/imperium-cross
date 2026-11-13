package com.imperiumcross.backend.users;

public record UserSummary(
        int idUsuario,
        String nombres,
        String apellidos,
        String dni,
        String telefono,
        String correo,
        int idRol,
        String nombreRol,
        boolean estado,
        boolean tieneFoto) {
}