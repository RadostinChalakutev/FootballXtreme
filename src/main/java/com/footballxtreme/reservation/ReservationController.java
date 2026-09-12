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

    // =========================================================
    // ВСИЧКИ РЕЗЕРВАЦИИ
    // =========================================================

    @GetMapping
    public List<Reservation> getAllReservations() {

        return reservationService.getAllReservations();
    }

    // =========================================================
    // РЕЗЕРВАЦИИ ЗА ОПРЕДЕЛЕНА ДАТА
    // =========================================================

    @GetMapping("/date/{date}")
    public List<Reservation> getReservationsForDate(
            @PathVariable LocalDate date
    ) {

        return reservationService.getReservationsForDate(date);
    }

    // =========================================================
    // РЕЗЕРВАЦИИ ЗА ИГРИЩЕ + ДАТА
    // =========================================================

    @GetMapping("/pitch/{pitchId}")
    public List<Reservation> getReservationsForPitchAndDate(
            @PathVariable Long pitchId,
            @RequestParam LocalDate date
    ) {

        return reservationService.getReservationsForPitchAndDate(
                pitchId,
                date
        );
    }

    // =========================================================
    // СЪЗДАВАНЕ НА РЕЗЕРВАЦИЯ
    // =========================================================

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

    // =========================================================
    // CANCEL НА РЕЗЕРВАЦИЯ
    // =========================================================

    @PutMapping("/{id}/cancel")
    public Reservation cancelReservation(
            @PathVariable Long id
    ) {

        return reservationService.cancelReservation(id);
    }
    @GetMapping("/search")
    public List<Reservation> searchReservationsByPhone(
            @RequestParam String phone
    ) {

        return reservationService.searchReservationsByPhone(
                phone
        );
    }
}