package com.imperiumcross.backend.clients;

import java.time.LocalDate;

public record ClientSummary(
        int idCliente,
        int idUsuario,
        String nombres,
        String apellidos,
        String dni,
        String telefono,
        String correo,
        LocalDate fechaNacimiento,
        LocalDate fechaRegistro,
        boolean estadoCliente,
        boolean estadoUsuario,
        Integer idMembresia,
        Integer idPlan,
        String nombrePlan,
        LocalDate fechaInicioMembresia,
        LocalDate fechaFinMembresia,
        String estadoMembresia,
        String objetivo,
        Integer idRutina,
        String nombreRutina,
        Integer idEntrenador,
        String nombreEntrenador,
        boolean tieneFoto) {
}
