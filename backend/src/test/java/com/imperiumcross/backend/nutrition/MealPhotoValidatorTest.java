package com.imperiumcross.backend.nutrition;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Optional;

import org.junit.jupiter.api.Test;

class MealPhotoValidatorTest {

    static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0x10};
    static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n', 0, 0};
    static final byte[] WEBP = {'R', 'I', 'F', 'F', 0x24, 0, 0, 0, 'W', 'E', 'B', 'P', 'V', 'P', '8', ' '};
    static final byte[] GIF = {'G', 'I', 'F', '8', '9', 'a', 0, 0};

    @Test
    void detectsAllowedFormatsByMagicBytes() {
        assertEquals(Optional.of("image/jpeg"), MealPhotoValidator.detectContentType(JPEG));
        assertEquals(Optional.of("image/png"), MealPhotoValidator.detectContentType(PNG));
        assertEquals(Optional.of("image/webp"), MealPhotoValidator.detectContentType(WEBP));
    }

    @Test
    void rejectsOtherFormatsAndTruncatedFiles() {
        assertEquals(Optional.empty(), MealPhotoValidator.detectContentType(GIF));
        assertEquals(Optional.empty(), MealPhotoValidator.detectContentType("<svg></svg>".getBytes()));
        assertEquals(Optional.empty(), MealPhotoValidator.detectContentType(new byte[] {(byte) 0xFF, (byte) 0xD8}));
        assertEquals(Optional.empty(), MealPhotoValidator.detectContentType(new byte[] {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'A', 'V', 'E'}));
        assertEquals(Optional.empty(), MealPhotoValidator.detectContentType(new byte[0]));
        assertEquals(Optional.empty(), MealPhotoValidator.detectContentType(null));
    }
}
