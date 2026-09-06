package com.footballxtreme.reservation;

import com.footballxtreme.pitch.Pitch;
import com.footballxtreme.pitch.PitchRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final PitchRepository pitchRepository;

    public ReservationService(
            ReservationRepository reservationRepository,
            PitchRepository pitchRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.pitchRepository = pitchRepository;
    }

    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    public Reservation createReservation(
            Long pitchId,
            LocalDate date,
            LocalTime startTime,
            Integer durationMinutes,
            String customerName,
            String customerEmail,
            String customerPhone
    ) {

        if (durationMinutes < 60) {
            throw new IllegalArgumentException(
                    "Minimum reservation duration is 60 minutes."
            );
        }

        if (durationMinutes != 60 && durationMinutes != 90) {
            throw new IllegalArgumentException(
                    "Reservation duration must be 60 or 90 minutes."
            );
        }

        Pitch pitch = pitchRepository.findById(pitchId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Pitch not found.")
                );

        if (!pitch.isActive()) {
            throw new IllegalArgumentException(
                    "This pitch is not available."
            );
        }

        LocalTime endTime = startTime.plusMinutes(durationMinutes);

        if (startTime.isBefore(LocalTime.of(9, 0))) {
            throw new IllegalArgumentException(
                    "Reservations cannot start before 09:00."
            );
        }

        if (endTime.isAfter(LocalTime.of(23, 0))) {
            throw new IllegalArgumentException(
                    "Reservation cannot end after 23:00."
            );
        }
        List<Reservation> existingReservations =
                reservationRepository.findActiveReservationsForPitchAndDate(
                        pitchId,
                        date,
                        ReservationStatus.CONFIRMED
                );

        for (Reservation existing : existingReservations) {

            LocalTime existingStart = existing.getStartTime();

            LocalTime existingEnd =
                    existingStart.plusMinutes(existing.getDurationMinutes());

            boolean overlaps =
                    startTime.isBefore(existingEnd)
                            && endTime.isAfter(existingStart);

            if (overlaps) {
                throw new IllegalArgumentException(
                        "This pitch is already reserved for the selected time."
                );
            }
        }

        Reservation reservation = new Reservation();

        reservation.setPitch(pitch);
        reservation.setDate(date);
        reservation.setStartTime(startTime);
        reservation.setDurationMinutes(durationMinutes);
        reservation.setCustomerName(customerName);
        reservation.setCustomerEmail(customerEmail);
        reservation.setCustomerPhone(customerPhone);
        reservation.setStatus(ReservationStatus.CONFIRMED);

        return reservationRepository.save(reservation);
    }
}