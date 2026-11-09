package com.imperiumcross.backend.scheduling;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/reservas")
@Validated
public class TrainingReservationController {

    private final TrainingReservationQueryService reservationQueryService;

    public TrainingReservationController(TrainingReservationQueryService reservationQueryService) {
        this.reservationQueryService = reservationQueryService;
    }

    @GetMapping
    public List<TrainingReservationSummary> findAll() {
        return reservationQueryService.findAll();
    }

    @GetMapping("/disponibilidad/{idMembresia}")
    public TrainingReservationAvailability findAvailability(
            @PathVariable @Positive int idMembresia) {
        return reservationQueryService.findAvailability(idMembresia);
    }

    @GetMapping("/{idReserva}/disponibilidad-cambio")
    public TrainingReservationAvailability findChangeAvailability(
            @PathVariable @Positive int idReserva) {
        return reservationQueryService.findChangeAvailability(idReserva);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TrainingReservationSummary create(@Valid @RequestBody TrainingReservationRequest request) {
        return reservationQueryService.create(request);
    }

    @PutMapping("/{idReserva}")
    public TrainingReservationSummary changeSchedule(
            @PathVariable @Positive int idReserva,
            @Valid @RequestBody TrainingReservationChangeRequest request) {
        return reservationQueryService.changeSchedule(idReserva, request);
    }

    @DeleteMapping("/{idReserva}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable @Positive int idReserva) {
        reservationQueryService.cancel(idReserva);
    }
}
