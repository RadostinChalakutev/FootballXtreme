package com.footballxtreme.reservation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface ReservationRepository
        extends JpaRepository<Reservation, Long> {

    /*
     * Всички активни резервации за конкретно игрище
     * и конкретна дата.
     */
    @Query("""
        SELECT r
        FROM Reservation r
        WHERE r.pitch.id = :pitchId
          AND r.date = :date
          AND r.status = :status
        ORDER BY r.startTime
        """)
    List<Reservation> findActiveReservationsForPitchAndDate(
            @Param("pitchId") Long pitchId,
            @Param("date") LocalDate date,
            @Param("status") ReservationStatus status
    );


    /*
     * Всички резервации за конкретна дата.
     *
     * Ще използваме това за календара.
     */
    @Query("""
        SELECT r
        FROM Reservation r
        WHERE r.date = :date
        ORDER BY r.startTime
        """)
    List<Reservation> findByDate(
            @Param("date") LocalDate date
    );


    /*
     * Всички активни резервации за конкретна дата.
     *
     * CANCELLED няма да бъдат върнати.
     */
    @Query("""
        SELECT r
        FROM Reservation r
        WHERE r.date = :date
          AND r.status = :status
        ORDER BY r.startTime
        """)
    List<Reservation> findActiveReservationsForDate(
            @Param("date") LocalDate date,
            @Param("status") ReservationStatus status
    );


    /*
     * Проверка дали има застъпване
     * за конкретно игрище и дата.
     *
     * Пример:
     *
     * Съществува:
     * 18:00 - 19:30
     *
     * Не може:
     * 19:00 - 20:00
     *
     * Може:
     * 19:30 - 21:00
     */
    @Query("""
        SELECT r
        FROM Reservation r
        WHERE r.pitch.id = :pitchId
          AND r.date = :date
          AND r.status = :status
          AND r.startTime < :endTime
          AND FUNCTION('TIME', r.startTime) IS NOT NULL
        """)
    List<Reservation> findPotentialConflicts(
            @Param("pitchId") Long pitchId,
            @Param("date") LocalDate date,
            @Param("endTime") LocalTime endTime,
            @Param("status") ReservationStatus status
    );


    /*
     * Всички резервации за конкретно игрище
     * и дата, включително CANCELLED.
     *
     * Полезно за Admin календара.
     */
    List<Reservation> findByPitchIdAndDateOrderByStartTime(
            Long pitchId,
            LocalDate date
    );
}