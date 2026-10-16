package com.footballxtreme.pitch;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PitchRepository extends JpaRepository<Pitch, Long> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from Pitch p where p.id = :id")
    java.util.Optional<Pitch> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);

    List<Pitch> findByActiveTrue();
}