package com.imperiumcross.backend.clients;

import java.util.List;
import java.util.Objects;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.imperiumcross.backend.training.TrainingAssignmentService;

@Service
public class InscriptionService {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final TrainingAssignmentService trainingAssignmentService;
    private final MembershipQueryService membershipQueryService;

    public InscriptionService(
            JdbcTemplate jdbcTemplate,
            PasswordEncoder passwordEncoder,
            TrainingAssignmentService trainingAssignmentService,
            MembershipQueryService membershipQueryService) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.trainingAssignmentService = trainingAssignmentService;
        this.membershipQueryService = membershipQueryService;
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public void register(InscriptionRequest request) {
        try {
            List<Integer> planIds = jdbcTemplate.query("""
                    SELECT id_plan
                    FROM dbo.PlanMembresia
                    WHERE estado = 1 AND nombre_plan COLLATE Latin1_General_CI_AI LIKE ?
                    """,
                    (rs, rowNum) -> rs.getInt("id_plan"),
                    "Plan " + request.plan() + "%");
            if (planIds.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El plan elegido no está disponible.");
            }

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
                    request.nombres().trim(),
                    request.apellidos().trim(),
                    request.dni().trim(),
                    request.telefono().trim(),
                    request.correo().trim(),
                    passwordEncoder.encode(request.contrasena()),
                    roleId);

            Integer clientId = jdbcTemplate.queryForObject("""
                    INSERT INTO dbo.Cliente (id_usuario, objetivo)
                    OUTPUT INSERTED.id_cliente
                    VALUES (?, ?)
                    """, Integer.class,
                    Objects.requireNonNull(userId),
                    request.objetivo().trim());

            trainingAssignmentService.assignForObjective(
                    Objects.requireNonNull(clientId),
                    request.objetivo());
            membershipQueryService.create(
                    new MembershipRequest(clientId, planIds.get(0), request.metodoPago()));
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El DNI o correo ya está registrado.",
                    exception);
        }
    }
}