package com.imperiumcross.backend.clients;

import java.sql.Date;
import java.sql.Types;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Objects;
import java.security.SecureRandom;
import java.util.Base64;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.SqlParameterValue;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.imperiumcross.backend.training.TrainingAssignmentService;

@Service
public class ClientQueryService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final String FIND_ALL_SQL = """
            WITH MembresiasOrdenadas AS (
                SELECT m.id_cliente,
                       m.id_membresia,
                       m.id_plan,
                       m.fecha_inicio,
                       m.fecha_fin,
                       m.estado,
                       ROW_NUMBER() OVER (
                           PARTITION BY m.id_cliente
                           ORDER BY m.fecha_inicio DESC, m.id_membresia DESC
                       ) AS orden
                FROM dbo.Membresia m
            )
            SELECT c.id_cliente,
                   u.id_usuario,
                   u.nombres,
                   u.apellidos,
                   u.dni,
                   u.telefono,
                   u.correo,
                   c.fecha_nacimiento,
                   c.fecha_registro,
                   c.estado AS estado_cliente,
                   u.estado AS estado_usuario,
                   m.id_membresia,
                   m.id_plan,
                   p.nombre_plan,
                   m.fecha_inicio,
                   m.fecha_fin,
                   m.estado AS estado_membresia,
                   c.objetivo,
                   asignacion.id_rutina,
                   asignacion.nombre_rutina,
                   asignacion.id_entrenador,
                   asignacion.nombre_entrenador
            FROM dbo.Cliente c
            INNER JOIN dbo.Usuario u ON u.id_usuario = c.id_usuario
            LEFT JOIN MembresiasOrdenadas m
                ON m.id_cliente = c.id_cliente AND m.orden = 1
            LEFT JOIN dbo.PlanMembresia p ON p.id_plan = m.id_plan
            OUTER APPLY (
                SELECT TOP 1 ar.id_rutina,
                             r.nombre_rutina,
                             ar.id_entrenador,
                             CASE
                                 WHEN entrenador.id_usuario IS NULL THEN NULL
                                 ELSE CONCAT(entrenador.nombres, ' ', entrenador.apellidos)
                             END AS nombre_entrenador
                FROM dbo.AsignacionRutina ar
                INNER JOIN dbo.Rutina r ON r.id_rutina = ar.id_rutina
                LEFT JOIN dbo.Usuario entrenador ON entrenador.id_usuario = ar.id_entrenador
                WHERE ar.id_cliente = c.id_cliente AND ar.estado = 1
                ORDER BY ar.fecha_asignacion DESC, ar.id_asignacion DESC
            ) asignacion
            ORDER BY u.apellidos, u.nombres, c.id_cliente
            """;

    private static final RowMapper<ClientSummary> CLIENT_ROW_MAPPER = (rs, rowNum) -> {
        int membershipId = rs.getInt("id_membresia");
        Integer nullableMembershipId = rs.wasNull() ? null : membershipId;
        return new ClientSummary(
                rs.getInt("id_cliente"),
                rs.getInt("id_usuario"),
                rs.getString("nombres"),
                rs.getString("apellidos"),
                rs.getString("dni").trim(),
                rs.getString("telefono") == null ? null : rs.getString("telefono").trim(),
                rs.getString("correo"),
                toLocalDate(rs.getDate("fecha_nacimiento")),
                toLocalDate(rs.getDate("fecha_registro")),
                rs.getBoolean("estado_cliente"),
                rs.getBoolean("estado_usuario"),
                nullableMembershipId,
                nullableInt(rs, "id_plan"),
                rs.getString("nombre_plan"),
                toLocalDate(rs.getDate("fecha_inicio")),
                toLocalDate(rs.getDate("fecha_fin")),
                rs.getString("estado_membresia"),
                rs.getString("objetivo"),
                nullableInt(rs, "id_rutina"),
                rs.getString("nombre_rutina"),
                nullableInt(rs, "id_entrenador"),
                rs.getString("nombre_entrenador"));
    };

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final TrainingAssignmentService trainingAssignmentService;

    public ClientQueryService(
            JdbcTemplate jdbcTemplate,
            PasswordEncoder passwordEncoder,
            TrainingAssignmentService trainingAssignmentService) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.trainingAssignmentService = trainingAssignmentService;
    }

    public List<ClientSummary> findAll() {
        return jdbcTemplate.query(FIND_ALL_SQL, CLIENT_ROW_MAPPER);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void create(ClientRequest client) {
        try {
            Integer roleId = jdbcTemplate.queryForObject(
                    "SELECT id_rol FROM dbo.Rol WHERE nombre_rol = ?",
                    Integer.class,
                    "Cliente");
            if (roleId == null) {
                throw new IllegalStateException("No se encontró el rol Cliente en dbo.Rol.");
            }

            Integer userId = jdbcTemplate.queryForObject("""
                    INSERT INTO dbo.Usuario
                        (nombres, apellidos, dni, telefono, correo, contrasena, id_rol)
                    OUTPUT INSERTED.id_usuario
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, Integer.class,
                    client.nombres().trim(),
                    client.apellidos().trim(),
                    client.dni().trim(),
                    nullableVarchar(normalizePhone(client.telefono())),
                    client.correo().trim(),
                    passwordEncoder.encode(generateUnusablePassword()),
                    roleId);

            Integer clientId = jdbcTemplate.queryForObject("""
                    INSERT INTO dbo.Cliente (id_usuario, fecha_nacimiento, objetivo)
                    OUTPUT INSERTED.id_cliente
                    VALUES (?, ?, ?)
                    """, Integer.class,
                    Objects.requireNonNull(userId),
                    nullableDate(parseBirthDate(client.fechaNacimiento())),
                    client.objetivo().trim());
            trainingAssignmentService.assignForObjective(
                    Objects.requireNonNull(clientId),
                    client.objetivo());
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El DNI o correo ya está registrado.",
                    exception);
        }
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void update(int clientId, ClientRequest client) {
        try {
            int updatedUsers = jdbcTemplate.update("""
                    UPDATE u
                    SET u.nombres = ?, u.apellidos = ?, u.dni = ?, u.telefono = ?, u.correo = ?
                    FROM dbo.Usuario u
                    INNER JOIN dbo.Cliente c ON c.id_usuario = u.id_usuario
                    WHERE c.id_cliente = ?
                    """,
                    client.nombres().trim(),
                    client.apellidos().trim(),
                    client.dni().trim(),
                    nullableVarchar(normalizePhone(client.telefono())),
                    client.correo().trim(),
                    clientId);
            if (updatedUsers == 0) throw notFound();

            jdbcTemplate.update("""
                    UPDATE dbo.Cliente
                    SET fecha_nacimiento = ?, objetivo = ?
                    WHERE id_cliente = ?
                    """,
                    nullableDate(parseBirthDate(client.fechaNacimiento())),
                    client.objetivo().trim(),
                    clientId);
            trainingAssignmentService.assignForObjective(clientId, client.objetivo());
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El DNI o correo ya está registrado.",
                    exception);
        }
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void deactivate(int clientId) {
        int updatedClients = jdbcTemplate.update(
                "UPDATE dbo.Cliente SET estado = 0 WHERE id_cliente = ?",
                clientId);
        if (updatedClients == 0) throw notFound();

        jdbcTemplate.update("""
                UPDATE dbo.Usuario
                SET estado = 0
                WHERE id_usuario = (SELECT id_usuario FROM dbo.Cliente WHERE id_cliente = ?)
                """, clientId);
        jdbcTemplate.update(
                "UPDATE dbo.AsignacionRutina SET estado = 0 WHERE id_cliente = ? AND estado = 1",
                clientId);
        jdbcTemplate.update(
                "UPDATE dbo.AsignacionRutina SET estado = 0 WHERE id_cliente = ? AND estado = 1",
                clientId);
    }

    private static String normalizePhone(String phone) {
        return phone == null || phone.isBlank() ? null : phone.trim();
    }

    private static SqlParameterValue nullableVarchar(String value) {
        return new SqlParameterValue(Types.VARCHAR, value);
    }

    private static SqlParameterValue nullableDate(Date value) {
        return new SqlParameterValue(Types.DATE, value);
    }

    private static String generateUnusablePassword() {
        byte[] randomSecret = new byte[32];
        SECURE_RANDOM.nextBytes(randomSecret);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomSecret);
    }

    private static Date parseBirthDate(String date) {
        if (date == null || date.isBlank()) return null;
        try {
            return Date.valueOf(LocalDate.parse(date));
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La fecha de nacimiento no es válida.",
                    exception);
        }
    }

    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el cliente.");
    }

    private static java.time.LocalDate toLocalDate(Date date) {
        return date == null ? null : date.toLocalDate();
    }

    private static Integer nullableInt(java.sql.ResultSet resultSet, String column)
            throws java.sql.SQLException {
        int value = resultSet.getInt(column);
        return resultSet.wasNull() ? null : value;
    }
}
