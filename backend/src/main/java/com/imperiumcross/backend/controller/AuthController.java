package com.imperiumcross.backend.controller;

import com.imperiumcross.backend.dto.LoginRequest;
import com.imperiumcross.backend.dto.LoginResponse;
import com.imperiumcross.backend.model.Usuario;
import com.imperiumcross.backend.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.correo() == null || request.correo().isBlank()
                || request.contrasena() == null || request.contrasena().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("mensaje", "Ingresa tu usuario y contraseña"));
        }

        Optional<Usuario> autenticado = authService.autenticar(request.correo().trim(), request.contrasena());
        if (autenticado.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("mensaje", "Error, vuelve a intentarlo"));
        }

        Usuario usuario = autenticado.get();
        if (!Boolean.TRUE.equals(usuario.getEstado())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("mensaje", "Cuenta inactiva. Contacta al administrador"));
        }

        return ResponseEntity.ok(new LoginResponse(
                usuario.getIdUsuario(),
                usuario.getNombres(),
                usuario.getApellidos(),
                usuario.getCorreo(),
                usuario.getRol().getNombreRol()
        ));
    }
}