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
@RequestMapping("/api/planes")
@Validated
public class MembershipPlanController {

    private final MembershipPlanQueryService membershipPlanQueryService;

    public MembershipPlanController(MembershipPlanQueryService membershipPlanQueryService) {
        this.membershipPlanQueryService = membershipPlanQueryService;
    }

    @GetMapping
    public List<MembershipPlanSummary> findPlans() {
        return membershipPlanQueryService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void create(@Valid @RequestBody MembershipPlanRequest request) {
        membershipPlanQueryService.create(request);
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void update(
            @PathVariable @Positive int id,
            @Valid @RequestBody MembershipPlanRequest request) {
        membershipPlanQueryService.update(id, request);
    }
}