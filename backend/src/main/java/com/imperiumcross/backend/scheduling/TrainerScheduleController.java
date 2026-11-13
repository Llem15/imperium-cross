package com.imperiumcross.backend.scheduling;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/horarios/entrenadores")
@Validated
public class TrainerScheduleController {

    private final TrainerScheduleQueryService trainerScheduleQueryService;

    public TrainerScheduleController(TrainerScheduleQueryService trainerScheduleQueryService) {
        this.trainerScheduleQueryService = trainerScheduleQueryService;
    }

    @GetMapping
    public List<TrainerScheduleSummary> findSchedules() {
        return trainerScheduleQueryService.findAll();
    }

    @PutMapping("/{idEntrenador}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void replaceSchedule(
            @PathVariable @Positive int idEntrenador,
            @Valid @RequestBody TrainerScheduleRequest request) {
        trainerScheduleQueryService.replaceSchedule(idEntrenador, request);
    }
}
