package com.imperiumcross.backend.security;

import java.util.List;
import java.util.Locale;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {

    private static final String FIND_USER_SQL = """
            SELECT u.id_usuario, u.correo, u.contrasena, u.estado, r.nombre_rol
            FROM dbo.Usuario u
            INNER JOIN dbo.Rol r ON r.id_rol = u.id_rol
            WHERE LOWER(u.correo) = LOWER(?)
            """;

    private final JdbcTemplate jdbcTemplate;

    public DatabaseUserDetailsService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        if (email == null || email.isBlank()) {
            throw new UsernameNotFoundException("Credenciales inválidas.");
        }

        List<DatabaseUserPrincipal> users = jdbcTemplate.query(
                FIND_USER_SQL,
                (rs, rowNum) -> new DatabaseUserPrincipal(
                        rs.getInt("id_usuario"),
                        rs.getString("correo").trim().toLowerCase(Locale.ROOT),
                        rs.getString("contrasena"),
                        toAuthority(rs.getString("nombre_rol")),
                        rs.getBoolean("estado")),
                email.trim());

        if (users.isEmpty()) {
            throw new UsernameNotFoundException("Credenciales inválidas.");
        }
        return users.get(0);
    }

    private static String toAuthority(String databaseRole) {
        if (databaseRole == null) {
            throw new UsernameNotFoundException("Credenciales inválidas.");
        }
        return switch (databaseRole.trim().toLowerCase(Locale.ROOT)) {
            case "administrador" -> "ROLE_ADMIN";
            case "recepcion", "recepcionista", "recepción" -> "ROLE_RECEPTION";
            case "entrenador" -> "ROLE_TRAINER";
            case "cliente", "socio" -> "ROLE_MEMBER";
            default -> throw new UsernameNotFoundException("Credenciales inválidas.");
        };
    }
}
