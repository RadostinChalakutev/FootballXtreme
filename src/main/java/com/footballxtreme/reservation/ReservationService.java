package com.footballxtreme.reservation;

import com.footballxtreme.pitch.Pitch;
import com.footballxtreme.pitch.PitchRepository;
import com.footballxtreme.settings.BlockedTime;
import com.footballxtreme.settings.BlockedTimeRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final PitchRepository pitchRepository;
    private final BlockedTimeRepository blockedTimeRepository;

    public ReservationService(
            ReservationRepository reservationRepository,
            PitchRepository pitchRepository,
            BlockedTimeRepository blockedTimeRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.pitchRepository = pitchRepository;
        this.blockedTimeRepository = blockedTimeRepository;
    }


    // ==========================================
    // ALL RESERVATIONS
    // ==========================================

    public List<Reservation> getAllReservations() {

        return reservationRepository.findAll();

    }


    // ==========================================
    // RESERVATIONS FOR DATE
    // ==========================================

    public List<Reservation> getReservationsForDate(
            LocalDate date
    ) {

        return reservationRepository.findActiveReservationsForDate(
                date,
                ReservationStatus.CONFIRMED
        );

    }


    // ==========================================
    // RESERVATIONS FOR PITCH + DATE
    // ==========================================

    public List<Reservation> getReservationsForPitchAndDate(
            Long pitchId,
            LocalDate date
    ) {

        return reservationRepository
                .findActiveReservationsForPitchAndDate(
                        pitchId,
                        date,
                        ReservationStatus.CONFIRMED
                );

    }


    // ==========================================
    // CREATE RESERVATION
    // ==========================================

    public Reservation createReservation(
            Long pitchId,
            LocalDate date,
            LocalTime startTime,
            Integer durationMinutes,
            String customerName,
            String customerEmail,
            String customerPhone
    ) {

        validateReservationData(
                startTime,
                durationMinutes
        );


        Pitch pitch =
                pitchRepository.findById(pitchId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Pitch not found."
                                )
                        );


        if (!pitch.isActive()) {

            throw new IllegalArgumentException(
                    "This pitch is not available."
            );

        }


        LocalTime endTime =
                startTime.plusMinutes(
                        durationMinutes
                );


        checkBlockedTime(
                pitchId,
                date,
                startTime,
                endTime
        );


        checkReservationConflict(
                pitchId,
                date,
                startTime,
                endTime,
                null
        );


        Reservation reservation =
                new Reservation();


        reservation.setPitch(pitch);
        reservation.setDate(date);
        reservation.setStartTime(startTime);
        reservation.setDurationMinutes(durationMinutes);
        reservation.setCustomerName(customerName);
        reservation.setCustomerEmail(customerEmail);
        reservation.setCustomerPhone(customerPhone);
        reservation.setStatus(
                ReservationStatus.CONFIRMED
        );


        return reservationRepository.save(
                reservation
        );

    }


    // ==========================================
    // UPDATE RESERVATION
    // ==========================================

    public Reservation updateReservation(
            Long id,
            Long pitchId,
            LocalDate date,
            LocalTime startTime,
            Integer durationMinutes,
            String customerName,
            String customerEmail,
            String customerPhone
    ) {

        validateReservationData(
                startTime,
                durationMinutes
        );


        Reservation reservation =
                reservationRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Reservation not found."
                                )
                        );


        if (
                reservation.getStatus()
                        == ReservationStatus.CANCELLED
        ) {

            throw new IllegalArgumentException(
                    "Cancelled reservation cannot be edited."
            );

        }


        Pitch pitch =
                pitchRepository.findById(pitchId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Pitch not found."
                                )
                        );


        if (!pitch.isActive()) {

            throw new IllegalArgumentException(
                    "This pitch is not available."
            );

        }


        LocalTime endTime =
                startTime.plusMinutes(
                        durationMinutes
                );


        checkBlockedTime(
                pitchId,
                date,
                startTime,
                endTime
        );


        /*
         * Проверяваме за друга резервация,
         * като изключваме текущата.
         */

        checkReservationConflict(
                pitchId,
                date,
                startTime,
                endTime,
                id
        );


        reservation.setPitch(pitch);
        reservation.setDate(date);
        reservation.setStartTime(startTime);
        reservation.setDurationMinutes(
                durationMinutes
        );
        reservation.setCustomerName(
                customerName
        );
        reservation.setCustomerEmail(
                customerEmail
        );
        reservation.setCustomerPhone(
                customerPhone
        );


        return reservationRepository.save(
                reservation
        );

    }


    // ==========================================
    // CANCEL RESERVATION
    // ==========================================

    public Reservation cancelReservation(
            Long id
    ) {

        Reservation reservation =
                reservationRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Reservation not found."
                                )
                        );


        if (
                reservation.getStatus()
                        == ReservationStatus.CANCELLED
        ) {

            throw new IllegalArgumentException(
                    "Reservation is already cancelled."
            );

        }


        reservation.setStatus(
                ReservationStatus.CANCELLED
        );


        return reservationRepository.save(
                reservation
        );

    }


    // ==========================================
    // DELETE RESERVATION
    // ==========================================

    public void deleteReservation(
            Long id
    ) {

        Reservation reservation =
                reservationRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Reservation not found."
                                )
                        );


        reservationRepository.delete(
                reservation
        );

    }


    // ==========================================
    // VALIDATION
    // ==========================================

    private void validateReservationData(
            LocalTime startTime,
            Integer durationMinutes
    ) {

        if (startTime == null) {

            throw new IllegalArgumentException(
                    "Start time is required."
            );

        }


        if (durationMinutes == null) {

            throw new IllegalArgumentException(
                    "Duration is required."
            );

        }


        if (durationMinutes < 60) {

            throw new IllegalArgumentException(
                    "Minimum reservation duration is 60 minutes."
            );

        }


        if (
                durationMinutes != 60
                        && durationMinutes != 90
        ) {

            throw new IllegalArgumentException(
                    "Reservation duration must be 60 or 90 minutes."
            );

        }


        LocalTime endTime =
                startTime.plusMinutes(
                        durationMinutes
                );


        if (
                startTime.isBefore(
                        LocalTime.of(9, 0)
                )
        ) {

            throw new IllegalArgumentException(
                    "Reservations cannot start before 09:00."
            );

        }


        if (
                endTime.isAfter(
                        LocalTime.of(23, 0)
                )
        ) {

            throw new IllegalArgumentException(
                    "Reservation cannot end after 23:00."
            );

        }

    }


    // ==========================================
    // BLOCKED TIME CHECK
    // ==========================================

    private void checkBlockedTime(
            Long pitchId,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime
    ) {

        List<BlockedTime> blockedTimes =
                blockedTimeRepository.findByPitchAndDate(
                        pitchId,
                        date
                );


        for (BlockedTime blocked : blockedTimes) {

            boolean overlaps =
                    startTime.isBefore(
                            blocked.getEndTime()
                    )
                            &&
                            endTime.isAfter(
                                    blocked.getStartTime()
                            );


            if (overlaps) {

                throw new IllegalArgumentException(
                        "This pitch is blocked for the selected time."
                );

            }

        }

    }


    // ==========================================
    // RESERVATION CONFLICT CHECK
    // ==========================================

    private void checkReservationConflict(
            Long pitchId,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime,
            Long excludedReservationId
    ) {

        List<Reservation> reservations =
                reservationRepository
                        .findActiveReservationsForPitchAndDate(
                                pitchId,
                                date,
                                ReservationStatus.CONFIRMED
                        );


        for (
                Reservation existing
                : reservations
        ) {

            /*
             * При редактиране не сравняваме
             * резервацията със самата себе си.
             */

            if (
                    excludedReservationId != null
                            &&
                            existing.getId()
                                    .equals(
                                            excludedReservationId
                                    )
            ) {

                continue;

            }


            LocalTime existingStart =
                    existing.getStartTime();


            LocalTime existingEnd =
                    existingStart.plusMinutes(
                            existing.getDurationMinutes()
                    );


            boolean overlaps =
                    startTime.isBefore(
                            existingEnd
                    )
                            &&
                            endTime.isAfter(
                                    existingStart
                            );


            if (overlaps) {

                throw new IllegalArgumentException(
                        "This pitch is already reserved for the selected time."
                );

            }

        }

    }

}