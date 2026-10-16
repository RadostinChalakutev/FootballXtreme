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
    private final org.springframework.context.ApplicationEventPublisher events;
    private final com.footballxtreme.settings.WorkingHoursService workingHours;
    private final java.time.Clock clock;

    public ReservationService(
            ReservationRepository reservationRepository,
            PitchRepository pitchRepository,
            BlockedTimeRepository blockedTimeRepository,
            org.springframework.context.ApplicationEventPublisher events,
            com.footballxtreme.settings.WorkingHoursService workingHours,
            java.time.Clock clock
    ) {
        this.reservationRepository = reservationRepository;
        this.pitchRepository = pitchRepository;
        this.blockedTimeRepository = blockedTimeRepository;
        this.events = events;
        this.workingHours = workingHours;
        this.clock = clock;
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
    public List<Reservation> searchReservationsByPhone(
            String phone
    ) {

        String normalizedPhone =
                normalizePhone(phone);

        if (normalizedPhone.isBlank()) {
            return List.of();
        }

        return reservationRepository
                .findByCustomerPhoneContainingIgnoreCaseOrderByDateDescStartTimeDesc(
                        normalizedPhone
                );
    }

    @org.springframework.transaction.annotation.Transactional
    public Reservation createReservation(
            Long pitchId,
            LocalDate date,
            LocalTime startTime,
            Integer durationMinutes,
            String customerName,
            String customerEmail,
            String customerPhone
    ) {

        if (pitchId == null || date == null || startTime == null)
            throw new IllegalArgumentException("Pitch, date and start time are required.");
        if (!java.time.LocalDateTime.of(date,startTime).isAfter(java.time.LocalDateTime.now(clock)))
            throw new IllegalArgumentException("Reservations must start in the future.");
        if (startTime.getSecond() != 0 || startTime.getNano() != 0 || startTime.getMinute() % 30 != 0)
            throw new IllegalArgumentException("Start time must be on a half-hour boundary.");
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
                pitchRepository.findByIdForUpdate(pitchId)
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

        var hours = workingHours.getWorkingHours(date.getDayOfWeek());
        if (hours.isClosed() || !endTime.isAfter(startTime) || startTime.isBefore(hours.getOpeningTime()) || endTime.isAfter(hours.getClosingTime()))
            throw new IllegalArgumentException("Selected time is outside working hours.");

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

                throw new BookingConflictException(
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

                throw new BookingConflictException(
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
                normalizePhone(customerPhone)
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

        events.publishEvent(new ReservationEmailEvent(savedReservation, false));

        return savedReservation;
    }

    // =========================================================
    // CANCEL RESERVATION
    // =========================================================

    @org.springframework.transaction.annotation.Transactional
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

        events.publishEvent(new ReservationEmailEvent(savedReservation, true));

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
    private String normalizePhone(String phone) {

        if (phone == null) {
            return "";
        }

        String normalized = phone
                .replaceAll("[^0-9+]", "");

        if (normalized.startsWith("+359")) {
            normalized = "0" +
                    normalized.substring(4);
        }

        if (normalized.startsWith("00359")) {
            normalized = "0" +
                    normalized.substring(5);
        }

        return normalized;
    }

}