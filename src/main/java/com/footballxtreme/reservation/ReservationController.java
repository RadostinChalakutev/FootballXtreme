package com.footballxtreme.reservation;

import com.footballxtreme.reservation.dto.CreateReservationRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(
            ReservationService reservationService
    ) {
        this.reservationService = reservationService;
    }


    // ==========================================
    // ALL RESERVATIONS
    // ==========================================

    @GetMapping
    public List<Reservation> getAllReservations() {

        return reservationService.getAllReservations();

    }


    // ==========================================
    // RESERVATIONS FOR DATE
    // ==========================================

    @GetMapping("/date/{date}")
    public List<Reservation> getReservationsForDate(
            @PathVariable LocalDate date
    ) {

        return reservationService
                .getReservationsForDate(date);

    }


    // ==========================================
    // RESERVATIONS FOR PITCH + DATE
    // ==========================================

    @GetMapping("/pitch/{pitchId}")
    public List<Reservation> getReservationsForPitchAndDate(
            @PathVariable Long pitchId,
            @RequestParam LocalDate date
    ) {

        return reservationService
                .getReservationsForPitchAndDate(
                        pitchId,
                        date
                );

    }


    // ==========================================
    // CREATE RESERVATION
    // ==========================================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Reservation createReservation(
            @Valid @RequestBody CreateReservationRequest request
    ) {

        return reservationService.createReservation(
                request.getPitchId(),
                request.getDate(),
                request.getStartTime(),
                request.getDurationMinutes(),
                request.getCustomerName(),
                request.getCustomerEmail(),
                request.getCustomerPhone()
        );

    }


    // ==========================================
    // UPDATE RESERVATION
    // ==========================================

    @PutMapping("/{id}")
    public Reservation updateReservation(
            @PathVariable Long id,
            @Valid @RequestBody CreateReservationRequest request
    ) {

        return reservationService.updateReservation(
                id,
                request.getPitchId(),
                request.getDate(),
                request.getStartTime(),
                request.getDurationMinutes(),
                request.getCustomerName(),
                request.getCustomerEmail(),
                request.getCustomerPhone()
        );

    }


    // ==========================================
    // CANCEL RESERVATION
    // ==========================================

    @PutMapping("/{id}/cancel")
    public Reservation cancelReservation(
            @PathVariable Long id
    ) {

        return reservationService.cancelReservation(id);

    }


    // ==========================================
    // DELETE RESERVATION
    // ==========================================

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReservation(
            @PathVariable Long id
    ) {

        reservationService.deleteReservation(id);

    }

}