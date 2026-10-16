package com.footballxtreme.reservation.dto;
import com.footballxtreme.reservation.Reservation;
import java.time.*;
public record AvailabilitySlot(Long pitchId, LocalDate date, LocalTime startTime, Integer durationMinutes) {
    public static AvailabilitySlot from(Reservation r) { return new AvailabilitySlot(r.getPitch().getId(),r.getDate(),r.getStartTime(),r.getDurationMinutes()); }
}
