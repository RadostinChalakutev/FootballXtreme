package com.footballxtreme.pitch;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PitchService {

    private final PitchRepository pitchRepository;

    public PitchService(PitchRepository pitchRepository) {
        this.pitchRepository = pitchRepository;
    }


    // ==========================================
    // ACTIVE PITCHES
    // ==========================================

    public List<Pitch> getAllPitches() {
        return pitchRepository.findByActiveTrue();
    }


    // ==========================================
    // ALL PITCHES - ADMIN
    // ==========================================

    public List<Pitch> getAllPitchesForAdmin() {
        return pitchRepository.findAll();
    }


    // ==========================================
    // GET BY ID
    // ==========================================

    public Pitch getPitchById(Long id) {

        return pitchRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Pitch not found."
                        )
                );
    }


    // ==========================================
    // CREATE
    // ==========================================

    public Pitch createPitch(String name) {

        validateName(name);

        Pitch pitch =
                new Pitch(name.trim());

        return pitchRepository.save(pitch);
    }


    // ==========================================
    // UPDATE NAME
    // ==========================================

    public Pitch updatePitch(
            Long id,
            String name
    ) {

        validateName(name);

        Pitch pitch =
                getPitchById(id);

        pitch.setName(
                name.trim()
        );

        return pitchRepository.save(
                pitch
        );
    }


    // ==========================================
    // DEACTIVATE
    // ==========================================

    public Pitch deactivatePitch(
            Long id
    ) {

        Pitch pitch =
                getPitchById(id);

        pitch.setActive(false);

        return pitchRepository.save(
                pitch
        );
    }


    // ==========================================
    // ACTIVATE
    // ==========================================

    public Pitch activatePitch(
            Long id
    ) {

        Pitch pitch =
                getPitchById(id);

        pitch.setActive(true);

        return pitchRepository.save(
                pitch
        );
    }


    // ==========================================
    // VALIDATE NAME
    // ==========================================

    private void validateName(
            String name
    ) {

        if (
                name == null
                        ||
                        name.trim().isEmpty()
        ) {

            throw new IllegalArgumentException(
                    "Pitch name cannot be empty."
            );

        }

    }

}