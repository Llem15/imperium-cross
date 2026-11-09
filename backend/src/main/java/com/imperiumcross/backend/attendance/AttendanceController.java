package com.imperiumcross.backend.attendance;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/asistencias")
@Validated
public class AttendanceController {

    private final AttendanceQueryService attendanceQueryService;

    public AttendanceController(AttendanceQueryService attendanceQueryService) {
        this.attendanceQueryService = attendanceQueryService;
    }

    @GetMapping
    public List<AttendanceSummary> findByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return attendanceQueryService.findByDate(fecha);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AttendanceSummary register(@Valid @RequestBody AttendanceRequest request) {
        return attendanceQueryService.register(request);
    }
}
