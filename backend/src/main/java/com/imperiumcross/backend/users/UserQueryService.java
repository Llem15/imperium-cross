package com.imperiumcross.backend.users;

import java.security.SecureRandom;
import java.sql.Types;
import java.util.Base64;
import java.util.List;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlParameterValue;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserQueryService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Set<String> ALLOWED_PHOTO_TYPES =
            Set.of("image/png", "image/jpeg", "image/webp", "image/gif");
    private static final int MAX_PHOTO_BYTES = 5 * 1024 * 1024;

    private static final String STAFF_ROLES =
            "(SELECT id_rol FROM dbo.Rol WHERE nombre_rol <> 'Cliente')";

    private static final String FIND_ALL_SQL = """
            SELECT u.id_usuario,
                   u.nombres,
                   u.apellidos,
                   u.dni,
                   u.telefono,
                   u.correo,
                   u.id_rol,
                   r.nombre_rol,
                   u.estado,
                   CASE WHEN u.foto IS NULL THEN 0 ELSE 1 END AS tiene_foto
            FROM dbo.Usuario u
            INNER JOIN dbo.Rol r ON r.id_rol = u.id_rol
            WHERE r.nombre_rol <> 'Cliente'
            ORDER BY u.id_rol, u.apellidos, u.nombres
            """;

    public record UserPhoto(byte[] data, String type) {
    }

    private record ParsedPhoto(byte[] data, String type) {
    }

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    public UserQueryService(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserSummary> findAll() {
        return jdbcTemplate.query(FIND_ALL_SQL, (rs, rowNum) -> new UserSummary(
                rs.getInt("id_usuario"),
                rs.getString("nombres"),
                rs.getString("apellidos"),
                rs.getString("dni").trim(),
                rs.getString("telefono") == null ? null : rs.getString("telefono").trim(),
                rs.getString("correo"),
                rs.getInt("id_rol"),
                rs.getString("nombre_rol"),
                rs.getBoolean("estado"),
                rs.getBoolean("tiene_foto")));
    }

    @Transactional
    public void create(UserRequest user) {
        try {
            ParsedPhoto photo = parsePhoto(user.foto());
            jdbcTemplate.update("""
                    INSERT INTO dbo.Usuario
                        (nombres, apellidos, dni, telefono, correo, contrasena, id_rol, estado, foto, tipo_foto)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    user.nombres().trim(),
                    user.apellidos().trim(),
                    user.dni().trim(),
                    new SqlParameterValue(Types.VARCHAR, normalizePhone(user.telefono())),
                    user.correo().trim(),
                    passwordEncoder.encode(generateUnusablePassword()),
                    user.idRol(),
                    user.activo(),
                    new SqlParameterValue(Types.VARBINARY, photo.data()),
                    new SqlParameterValue(Types.VARCHAR, photo.type()));
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "El DNI o correo ya está registrado.", exception);
        }
    }

    @Transactional
    public void update(int userId, UserRequest user) {
        try {
            int updated = jdbcTemplate.update("""
                    UPDATE dbo.Usuario
                    SET nombres = ?, apellidos = ?, dni = ?, telefono = ?, correo = ?,
                        id_rol = ?, estado = ?
                    WHERE id_usuario = ? AND id_rol IN
                    """ + STAFF_ROLES,
                    user.nombres().trim(),
                    user.apellidos().trim(),
                    user.dni().trim(),
                    new SqlParameterValue(Types.VARCHAR, normalizePhone(user.telefono())),
                    user.correo().trim(),
                    user.idRol(),
                    user.activo(),
                    userId);
            if (updated == 0) throw notFound();

            if (user.foto() != null) {
                ParsedPhoto photo = parsePhoto(user.foto());
                jdbcTemplate.update(
                        "UPDATE dbo.Usuario SET foto = ?, tipo_foto = ? WHERE id_usuario = ?",
                        new SqlParameterValue(Types.VARBINARY, photo.data()),
                        new SqlParameterValue(Types.VARCHAR, photo.type()),
                        userId);
            }
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "El DNI o correo ya está registrado.", exception);
        }
    }

    @Transactional
    public void deactivate(int userId) {
        int updated = jdbcTemplate.update(
                "UPDATE dbo.Usuario SET estado = 0 WHERE id_usuario = ? AND id_rol IN "
                        + STAFF_ROLES,
                userId);
        if (updated == 0) throw notFound();
    }

    public UserPhoto findPhoto(int userId) {
        List<UserPhoto> rows = jdbcTemplate.query(
                "SELECT foto, tipo_foto FROM dbo.Usuario WHERE id_usuario = ? AND foto IS NOT NULL",
                (rs, rowNum) -> new UserPhoto(rs.getBytes("foto"), rs.getString("tipo_foto")),
                userId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no tiene foto.");
        }
        return rows.get(0);
    }

    private static ParsedPhoto parsePhoto(String raw) {
        if (raw == null || raw.isBlank()) return new ParsedPhoto(null, null);
        String value = raw.trim();
        int separator = value.indexOf(";base64,");
        if (!value.startsWith("data:") || separator < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "La foto no tiene un formato válido.");
        }
        String type = value.substring(5, separator);
        if (!ALLOWED_PHOTO_TYPES.contains(type)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "La foto debe ser PNG, JPG, WebP o GIF.");
        }
        byte[] data;
        try {
            data = Base64.getDecoder().decode(value.substring(separator + 8));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "La foto no se pudo leer.", exception);
        }
        if (data.length > MAX_PHOTO_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La foto supera los 5 MB.");
        }
        return new ParsedPhoto(data, type);
    }

    private static String normalizePhone(String phone) {
        return phone == null || phone.isBlank() ? null : phone.trim();
    }

    private static String generateUnusablePassword() {
        byte[] randomSecret = new byte[32];
        SECURE_RANDOM.nextBytes(randomSecret);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomSecret);
    }

    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el usuario.");
    }
}