package com.footballxtreme.settings;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BlockedTimeRepository
        extends JpaRepository<BlockedTime, Long> {

    @Query("""
        SELECT b
        FROM BlockedTime b
        WHERE b.pitch.id = :pitchId
          AND b.date = :date
        """)
    List<BlockedTime> findByPitchAndDate(
            @Param("pitchId") Long pitchId,
            @Param("date") LocalDate date
    );
}