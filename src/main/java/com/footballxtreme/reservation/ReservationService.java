package com.footballxtreme.reservation;

import com.footballxtreme.email.EmailService;
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
    private final EmailService emailService;

    public ReservationService(
            ReservationRepository reservationRepository,
            PitchRepository pitchRepository,
            BlockedTimeRepository blockedTimeRepository,
            EmailService emailService
    ) {
        this.reservationRepository = reservationRepository;
        this.pitchRepository = pitchRepository;
        this.blockedTimeRepository = blockedTimeRepository;
        this.emailService = emailService;
    }

    // =========================================================
    // GET ALL RESERVATIONS
    // =========================================================

    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    // =========================================================
    // GET RESERVATIONS FOR SPECIFIC DATE
    // =========================================================

    public List<Reservation> getReservationsForDate(LocalDate date) {

        return reservationRepository
                .findByDateAndStatusOrderByStartTimeAsc(
                        date,
                        ReservationStatus.CONFIRMED
                );
    }

    // =========================================================
    // CREATE RESERVATION
    // =========================================================

    public Reservation createReservation(
            Long pitchId,
            LocalDate date,
            LocalTime startTime,
            Integer durationMinutes,
            String customerName,
            String customerEmail,
            String customerPhone
    ) {

        if (durationMinutes == null) {
            throw new IllegalArgumentException(
                    "Reservation duration is required."
            );
        }

        if (durationMinutes < 60) {
            throw new IllegalArgumentException(
                    "Minimum reservation duration is 60 minutes."
            );
        }

        if (durationMinutes != 60 &&
                durationMinutes != 90) {

            throw new IllegalArgumentException(
                    "Reservation duration must be 60 or 90 minutes."
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

        // -----------------------------------------------------
        // WORKING HOURS
        // -----------------------------------------------------

        if (startTime.isBefore(
                LocalTime.of(9, 0)
        )) {

            throw new IllegalArgumentException(
                    "Reservations cannot start before 09:00."
            );
        }

        if (endTime.isAfter(
                LocalTime.of(23, 0)
        )) {

            throw new IllegalArgumentException(
                    "Reservation cannot end after 23:00."
            );
        }

        // -----------------------------------------------------
        // EXISTING RESERVATIONS
        // -----------------------------------------------------

        List<Reservation> existingReservations =
                reservationRepository
                        .findActiveReservationsForPitchAndDate(
                                pitchId,
                                date,
                                ReservationStatus.CONFIRMED
                        );

        // -----------------------------------------------------
        // BLOCKED TIMES
        // -----------------------------------------------------

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

        // -----------------------------------------------------
        // RESERVATION OVERLAP CHECK
        // -----------------------------------------------------

        for (Reservation existing :
                existingReservations) {

            LocalTime existingStart =
                    existing.getStartTime();

            LocalTime existingEnd =
                    existingStart.plusMinutes(
                            existing.getDurationMinutes()
                    );

            boolean overlaps =
                    startTime.isBefore(existingEnd)
                            &&
                            endTime.isAfter(existingStart);

            if (overlaps) {

                throw new IllegalArgumentException(
                        "This pitch is already reserved for the selected time."
                );
            }
        }

        // -----------------------------------------------------
        // CREATE
        // -----------------------------------------------------

        Reservation reservation =
                new Reservation();

        reservation.setPitch(pitch);

        reservation.setDate(date);

        reservation.setStartTime(
                startTime
        );

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

        reservation.setStatus(
                ReservationStatus.CONFIRMED
        );

        // -----------------------------------------------------
        // SAVE
        // -----------------------------------------------------

        Reservation savedReservation =
                reservationRepository.save(
                        reservation
                );

        // -----------------------------------------------------
        // SEND CONFIRMATION EMAIL
        // -----------------------------------------------------

        try {

            emailService.sendReservationConfirmation(
                    savedReservation
            );

        } catch (Exception e) {

            /*
             * Резервацията вече е записана.
             * Email проблемът не трябва да проваля
             * самата резервация.
             */

            System.err.println(
                    "Reservation #" +
                            savedReservation.getId() +
                            " was created successfully, " +
                            "but confirmation email could not be sent."
            );

            System.err.println(
                    "Email error: " +
                            e.getMessage()
            );
        }

        return savedReservation;
    }

    // =========================================================
    // CANCEL RESERVATION
    // =========================================================

    public Reservation cancelReservation(Long id) {

        Reservation reservation =
                reservationRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Reservation not found."
                                )
                        );

        if (reservation.getStatus()
                == ReservationStatus.CANCELLED) {

            throw new IllegalArgumentException(
                    "Reservation is already cancelled."
            );
        }

        // -----------------------------------------------------
        // CANCEL
        // -----------------------------------------------------

        reservation.setStatus(
                ReservationStatus.CANCELLED
        );

        // -----------------------------------------------------
        // SAVE
        // -----------------------------------------------------

        Reservation savedReservation =
                reservationRepository.save(
                        reservation
                );

        // -----------------------------------------------------
        // SEND CANCELLATION EMAIL
        // -----------------------------------------------------

        try {

            emailService.sendReservationCancellation(
                    savedReservation
            );

        } catch (Exception e) {

            /*
             * Отмяната вече е записана.
             * Email проблемът не трябва да проваля
             * операцията по отказване.
             */

            System.err.println(
                    "Reservation #" +
                            savedReservation.getId() +
                            " was cancelled successfully, " +
                            "but cancellation email could not be sent."
            );

            System.err.println(
                    "Email error: " +
                            e.getMessage()
            );
        }

        return savedReservation;
    }

    // =========================================================
    // GET RESERVATIONS FOR PITCH AND DATE
    // =========================================================

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
}