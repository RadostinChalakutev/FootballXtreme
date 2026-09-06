package com.footballxtreme.reservation;

import com.footballxtreme.reservation.dto.CreateReservationRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

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
}