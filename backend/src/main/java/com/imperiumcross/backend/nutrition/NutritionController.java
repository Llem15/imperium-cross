package com.imperiumcross.backend.nutrition;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.Positive;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.imperiumcross.backend.security.DatabaseUserPrincipal;

/**
 * Sección nutricional del socio. El cliente se obtiene siempre del usuario autenticado; nunca de
 * la URL ni del body.
 */
@RestController
@Validated
@RequestMapping("/api/nutricion")
public class NutritionController {

    static final String UNAVAILABLE_MESSAGE =
            "El análisis no está disponible en este momento, intenta más tarde";

    private static final Logger log = LoggerFactory.getLogger(NutritionController.class);

    private final NutritionService nutritionService;

    public NutritionController(NutritionService nutritionService) {
        this.nutritionService = nutritionService;
    }

    @GetMapping("/metas")
    public NutrientValues findDailyGoals(Authentication authentication) {
        return nutritionService.findDailyGoals(userId(authentication));
    }

    @GetMapping("/comidas")
    public List<MealResponse> findMeals(
            @RequestParam(name = "fecha", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            Authentication authentication) {
        return nutritionService.findSavedMeals(userId(authentication), fecha);
    }

    @PostMapping(path = "/analisis", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MealAnalysisResponse analyze(
            @RequestPart("foto") MultipartFile foto,
            Authentication authentication) {
        return nutritionService.analyze(userId(authentication), readPhoto(foto));
    }

    @PostMapping("/analisis/{id}/guardar")
    public MealResponse save(@PathVariable @Positive int id, Authentication authentication) {
        return nutritionService.save(userId(authentication), id);
    }

    @DeleteMapping("/comidas/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable @Positive int id, Authentication authentication) {
        nutritionService.delete(userId(authentication), id);
    }

    @GetMapping("/comidas/{id}/imagen")
    public ResponseEntity<byte[]> findPhoto(@PathVariable @Positive int id, Authentication authentication) {
        MealPhoto photo = nutritionService.findPhoto(userId(authentication), id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.contentType()))
                .cacheControl(CacheControl.empty().cachePrivate())
                .body(photo.content());
    }

    @ExceptionHandler(MealRecognitionUnavailableException.class)
    public ResponseEntity<ProblemDetail> handleUnavailable(MealRecognitionUnavailableException exception) {
        // SOLO SE REGISTRA EL MOTIVO INTERNO; NUNCA LA IMAGEN NI LA API KEY.
        log.warn("Análisis nutricional no disponible: {}", exception.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.SERVICE_UNAVAILABLE,
                UNAVAILABLE_MESSAGE);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(problem);
    }

    /** Responde directamente para que el mensaje en español llegue al frontend. */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ProblemDetail> handleStatus(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode()).body(exception.getBody());
    }

    private static byte[] readPhoto(MultipartFile foto) {
        if (foto.getSize() > MealPhotoValidator.MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La foto supera los 5 MB.");
        }
        try {
            return foto.getBytes();
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer la foto.", exception);
        }
    }

    private static int userId(Authentication authentication) {
        Object principal = authentication == null ? null : authentication.getPrincipal();
        if (principal instanceof DatabaseUserPrincipal user) {
            return user.userId();
        }
        throw new IllegalStateException("La solicitud autenticada no contiene un usuario de Imperium Cross.");
    }
}
