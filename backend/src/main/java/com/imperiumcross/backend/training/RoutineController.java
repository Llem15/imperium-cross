package com.imperiumcross.backend.training;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import com.imperiumcross.backend.security.DatabaseUserPrincipal;

@RestController
@Validated
public class RoutineController {

    private final RoutineQueryService routineQueryService;

    public RoutineController(RoutineQueryService routineQueryService) {
        this.routineQueryService = routineQueryService;
    }

    @GetMapping("/api/ejercicios")
    public List<ExerciseSummary> findExercises() {
        return routineQueryService.findExercises();
    }

    @GetMapping("/api/rutinas")
    public List<RoutineSummary> findRoutines(Authentication authentication) {
        return routineQueryService.findAll(trainerScope(authentication));
    }

    @PostMapping("/api/rutinas")
    @ResponseStatus(HttpStatus.CREATED)
    public void create(@Valid @RequestBody RoutineRequest request) {
        routineQueryService.create(request);
    }

    @PutMapping("/api/rutinas/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void update(
            @PathVariable @Positive int id,
            @Valid @RequestBody RoutineRequest request,
            Authentication authentication) {
        routineQueryService.update(id, request, trainerScope(authentication));
    }

    @DeleteMapping("/api/rutinas/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable @Positive int id, Authentication authentication) {
        routineQueryService.deactivate(id, trainerScope(authentication));
    }

    private static Integer trainerScope(Authentication authentication) {
        boolean administrator = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        if (administrator) return null;

        Object principal = authentication.getPrincipal();
        if (principal instanceof DatabaseUserPrincipal user) {
            return user.userId();
        }
        throw new IllegalStateException("La solicitud autenticada no contiene un usuario de Imperium Cross.");
    }
}
