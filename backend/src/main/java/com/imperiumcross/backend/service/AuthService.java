package com.imperiumcross.backend.service;

import com.imperiumcross.backend.model.Usuario;
import com.imperiumcross.backend.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Optional<Usuario> autenticar(String correo, String contrasena) {
        Optional<Usuario> encontrado = usuarioRepository.findByCorreo(correo);
        if (encontrado.isEmpty()) {
            return Optional.empty();
        }

        Usuario usuario = encontrado.get();
        String guardada = usuario.getContrasena();
        if (guardada == null) {
            return Optional.empty();
        }

        if (guardada.startsWith("$2")) {
            return passwordEncoder.matches(contrasena, guardada) ? Optional.of(usuario) : Optional.empty();
        }

        if (guardada.equals(contrasena)) {
            usuario.setContrasena(passwordEncoder.encode(contrasena));
            usuarioRepository.save(usuario);
            return Optional.of(usuario);
        }

        return Optional.empty();
    }
}