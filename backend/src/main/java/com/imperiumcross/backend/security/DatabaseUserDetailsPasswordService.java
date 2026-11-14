package com.imperiumcross.backend.security;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsPasswordService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class DatabaseUserDetailsPasswordService implements UserDetailsPasswordService {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseUserDetailsPasswordService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public UserDetails updatePassword(UserDetails user, String newEncodedPassword) {
        if (!(user instanceof DatabaseUserPrincipal principal)) {
            throw new UsernameNotFoundException("No se pudo actualizar la contraseña.");
        }

        int updated = jdbcTemplate.update(
                "UPDATE dbo.Usuario SET contrasena = ? WHERE id_usuario = ? AND estado = 1",
                newEncodedPassword,
                principal.userId());
        if (updated != 1) {
            throw new UsernameNotFoundException("La cuenta ya no está disponible.");
        }
        return principal.withPassword(newEncodedPassword);
    }
}
