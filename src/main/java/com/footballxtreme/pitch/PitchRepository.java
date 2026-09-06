package com.footballxtreme.pitch;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PitchRepository extends JpaRepository<Pitch, Long> {

    List<Pitch> findByActiveTrue();
}