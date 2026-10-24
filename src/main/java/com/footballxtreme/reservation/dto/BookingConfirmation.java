package com.footballxtreme.reservation.dto;

import com.footballxtreme.reservation.Reservation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * The public response returned after a successful booking. It intentionally
 * excludes the customer's personal contact data.
 */
public record BookingConfirmation(
        String reference,
        String pitchName,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        Integer durationMinutes,
        BigDecimal totalPrice,
        String currency,
        String paymentMethod
) {
    public static BookingConfirmation from(Reservation reservation) {
        return new BookingConfirmation(
                reservation.getReference(),
                reservation.getPitch().getName(),
                reservation.getDate(),
                reservation.getStartTime(),
                reservation.getStartTime().plusMinutes(reservation.getDurationMinutes()),
                reservation.getDurationMinutes(),
                reservation.getTotalPrice(),
                reservation.getCurrency(),
                reservation.getPaymentMethod() == null
                        ? null
                        : reservation.getPaymentMethod().name()
        );
    }
}
