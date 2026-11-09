package com.imperiumcross.backend.scheduling;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.Test;

class TrainingReservationRulesTest {

    @Test
    void createsOnlyFullHourSlotsInsideTrainerShift() {
        assertEquals(
                List.of(LocalTime.of(8, 30), LocalTime.of(9, 30)),
                TrainingReservationRules.slots(
                        LocalTime.of(8, 30),
                        LocalTime.of(10, 30)));
        assertEquals(
                List.of(),
                TrainingReservationRules.slots(
                        LocalTime.of(8, 0),
                        LocalTime.of(8, 59)));
    }

    @Test
    void createsWeeklyOccurrencesForSelectedDay() {
        assertEquals(
                List.of(
                        LocalDate.of(2026, 11, 9),
                        LocalDate.of(2026, 11, 16),
                        LocalDate.of(2026, 11, 23)),
                TrainingReservationRules.occurrences(
                        LocalDate.of(2026, 11, 8),
                        LocalDate.of(2026, 11, 23),
                        1));
    }

    @Test
    void detectsOverlappingButNotAdjacentSessions() {
        LocalDate date = LocalDate.of(2026, 11, 9);
        assertTrue(TrainingReservationRules.overlaps(
                date,
                LocalTime.of(9, 30),
                date,
                LocalTime.of(9, 0)));
        assertFalse(TrainingReservationRules.overlaps(
                date,
                LocalTime.of(10, 0),
                date,
                LocalTime.of(9, 0)));
    }

    @Test
    void allowsTodayOnlyWhenSelectedSessionHasNotStarted() {
        LocalDate today = LocalDate.of(2026, 11, 9);
        assertEquals(
                List.of(today),
                TrainingReservationRules.futureOccurrences(
                        today,
                        today,
                        1,
                        LocalDateTime.of(today, LocalTime.of(8, 0)),
                        LocalTime.of(9, 0)));
        assertEquals(
                List.of(),
                TrainingReservationRules.futureOccurrences(
                        today,
                        today,
                        1,
                        LocalDateTime.of(today, LocalTime.of(9, 0)),
                        LocalTime.of(9, 0)));
    }

    @Test
    void enforcesScheduleChangePeriodsForMembershipPlans() {
        LocalDate changed = LocalDate.of(2026, 11, 1);
        assertFalse(TrainingReservationRules.canChangeSchedule(
                changed,
                LocalDate.of(2026, 11, 15),
                15));
        assertTrue(TrainingReservationRules.canChangeSchedule(
                changed,
                LocalDate.of(2026, 11, 16),
                15));
        assertTrue(TrainingReservationRules.canChangeSchedule(
                changed,
                LocalDate.of(2026, 11, 8),
                7));
        assertFalse(TrainingReservationRules.canChangeSchedule(
                changed,
                LocalDate.of(2026, 11, 30),
                0));
    }
}
