package com.imperiumcross.backend.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Verifies current BCrypt hashes and the legacy plain-text seed values documented by this project.
 * Successful legacy authentication is upgraded to BCrypt by DaoAuthenticationProvider.
 */
public final class LegacyAwareBcryptPasswordEncoder implements PasswordEncoder {

    private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

    @Override
    public String encode(CharSequence rawPassword) {
        return bcrypt.encode(rawPassword);
    }

    @Override
    public boolean matches(CharSequence rawPassword, String storedPassword) {
        if (rawPassword == null || rawPassword.length() == 0 || storedPassword == null) {
            return false;
        }

        if (isBcryptHash(storedPassword)) {
            try {
                return bcrypt.matches(rawPassword, storedPassword);
            } catch (IllegalArgumentException exception) {
                return false;
            }
        }

        return MessageDigest.isEqual(
                rawPassword.toString().getBytes(StandardCharsets.UTF_8),
                storedPassword.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public boolean upgradeEncoding(String storedPassword) {
        return !isBcryptHash(storedPassword) || bcrypt.upgradeEncoding(storedPassword);
    }

    private static boolean isBcryptHash(String value) {
        return value != null && (value.startsWith("$2a$")
                || value.startsWith("$2b$")
                || value.startsWith("$2y$"));
    }
}
