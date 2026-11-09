package com.imperiumcross.backend.scheduling;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

final class TrainingReservationRules {

    private static final int SESSION_MINUTES = 60;

    private TrainingReservationRules() {
    }

    static List<LocalTime> slots(LocalTime start, LocalTime end) {
        List<LocalTime> result = new ArrayList<>();
        LocalTime slot = start;
        while (Duration.between(slot, end).toMinutes() >= SESSION_MINUTES) {
            result.add(slot);
            if (slot.getHour() * 60 + slot.getMinute() + SESSION_MINUTES >= 24 * 60) {
                break;
            }
            slot = slot.plusMinutes(SESSION_MINUTES);
        }
        return result;
    }

    static List<LocalDate> occurrences(LocalDate start, LocalDate end, int dayOfWeek) {
        List<LocalDate> result = new ArrayList<>();
        LocalDate date = start;
        int daysUntilTarget = Math.floorMod(dayOfWeek - date.getDayOfWeek().getValue(), 7);
        date = date.plusDays(daysUntilTarget);
        while (!date.isAfter(end)) {
            result.add(date);
            date = date.plusWeeks(1);
        }
        return result;
    }

    static List<LocalDate> futureOccurrences(
            LocalDate start,
            LocalDate end,
            int dayOfWeek,
            LocalDateTime now,
            LocalTime startTime) {
        return occurrences(start, end, dayOfWeek).stream()
                .filter(date -> date.atTime(startTime).isAfter(now))
                .toList();
    }

    static boolean canChangeSchedule(LocalDate lastChange, LocalDate today, int periodDays) {
        return periodDays > 0 && !today.isBefore(lastChange.plusDays(periodDays));
    }

    static boolean overlaps(
            LocalDate candidateDate,
            LocalTime candidateStart,
            LocalDate existingDate,
            LocalTime existingStart) {
        LocalDateTime candidate = candidateDate.atTime(candidateStart);
        LocalDateTime existing = existingDate.atTime(existingStart);
        LocalDateTime candidateEnd = candidate.plusMinutes(SESSION_MINUTES);
        LocalDateTime existingEnd = existing.plusMinutes(SESSION_MINUTES);
        return candidate.isBefore(existingEnd) && existing.isBefore(candidateEnd);
    }
}
