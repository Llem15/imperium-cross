package com.imperiumcross.backend.clients;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api")
@Validated
public class MembershipController {

    private final MembershipQueryService membershipQueryService;

    public MembershipController(MembershipQueryService membershipQueryService) {
        this.membershipQueryService = membershipQueryService;
    }

    @GetMapping("/membresias")
    public List<MembershipPaymentSummary> findAll() {
        return membershipQueryService.findAll();
    }

    @PostMapping("/membresias")
    @ResponseStatus(HttpStatus.CREATED)
    public void create(@Valid @RequestBody MembershipRequest request) {
        membershipQueryService.create(request);
    }

    @PutMapping("/membresias/{id}/cambiar-plan")
    @ResponseStatus(HttpStatus.CREATED)
    public void changePlan(
            @PathVariable @Positive int id,
            @Valid @RequestBody MembershipChangeRequest request) {
        membershipQueryService.changePlan(id, request);
    }

    @PostMapping("/membresias/{id}/cancelar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable @Positive int id) {
        membershipQueryService.cancel(id);
    }

    @PostMapping("/pagos/{id}/confirmar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirmPayment(@PathVariable @Positive int id) {
        membershipQueryService.confirmPayment(id);
    }
}
