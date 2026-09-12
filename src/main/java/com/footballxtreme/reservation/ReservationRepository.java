package com.footballxtreme.reservation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    @Query("""
        SELECT r
        FROM Reservation r
        WHERE r.pitch.id = :pitchId
          AND r.date = :date
          AND r.status = :status
        """)
    List<Reservation> findActiveReservationsForPitchAndDate(
            @Param("pitchId") Long pitchId,
            @Param("date") LocalDate date,
            @Param("status") ReservationStatus status
    );

    List<Reservation> findByDateOrderByStartTimeAsc(LocalDate date);

    List<Reservation> findByDateAndStatusOrderByStartTimeAsc(
            LocalDate date,
            ReservationStatus status
    );
    List<Reservation> findByCustomerPhoneContainingIgnoreCaseOrderByDateDescStartTimeDesc(
            String customerPhone
    );
}