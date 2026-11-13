package com.imperiumcross.backend.training;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.time.Duration;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/api/ejercicios/{id}/imagen")
    public ResponseEntity<byte[]> exerciseImage(@PathVariable @Positive int id) {
        RoutineQueryService.ExerciseImage image = routineQueryService.findExerciseImage(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.type()))
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)))
                .body(image.data());
    }

    @PostMapping("/api/ejercicios")
    @ResponseStatus(HttpStatus.CREATED)
    public ExerciseSummary createExercise(@Valid @RequestBody ExerciseRequest request) {
        return routineQueryService.createExercise(request);
    }

    @GetMapping("/api/rutinas")
    public List<RoutineSummary> findRoutines() {
        return routineQueryService.findAll();
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
            @Valid @RequestBody RoutineRequest request) {
        routineQueryService.update(id, request);
    }

    @DeleteMapping("/api/rutinas/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable @Positive int id) {
        routineQueryService.deactivate(id);
    }
}
