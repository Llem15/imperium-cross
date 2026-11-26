package com.imperiumcross.backend.nutrition;

import java.util.Optional;

/** Detecta el tipo real de la foto por sus bytes iniciales, sin confiar en el Content-Type. */
final class MealPhotoValidator {

    static final int MAX_BYTES = 5 * 1024 * 1024;

    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG = {
        (byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'
    };
    private static final byte[] RIFF = {'R', 'I', 'F', 'F'};
    private static final byte[] WEBP = {'W', 'E', 'B', 'P'};

    private MealPhotoValidator() {
    }

    static Optional<String> detectContentType(byte[] content) {
        if (content == null) return Optional.empty();
        if (startsWith(content, 0, JPEG)) return Optional.of("image/jpeg");
        if (startsWith(content, 0, PNG)) return Optional.of("image/png");
        if (startsWith(content, 0, RIFF) && startsWith(content, 8, WEBP)) {
            return Optional.of("image/webp");
        }
        return Optional.empty();
    }

    private static boolean startsWith(byte[] content, int offset, byte[] signature) {
        if (content.length < offset + signature.length) return false;
        for (int index = 0; index < signature.length; index++) {
            if (content[offset + index] != signature[index]) return false;
        }
        return true;
    }
}
