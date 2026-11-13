package com.imperiumcross.backend.training;

import jakarta.validation.constraints.Positive;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
public class ClientRoutineController {

    private final ClientRoutineService clientRoutineService;

    public ClientRoutineController(ClientRoutineService clientRoutineService) {
        this.clientRoutineService = clientRoutineService;
    }

    @GetMapping("/api/clientes/{id}/rutina")
    public ClientRoutine findByClient(@PathVariable @Positive int id) {
        return clientRoutineService.findByClient(id);
    }
}