package com.footballxtreme.pitch;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PitchService {

    private final PitchRepository pitchRepository;

    public PitchService(PitchRepository pitchRepository) {
        this.pitchRepository = pitchRepository;
    }

    public List<Pitch> getAllPitches() {
        return pitchRepository.findByActiveTrue();
    }

    public List<Pitch> getAllPitchesForAdmin() {
        return pitchRepository.findAll();
    }

    public Pitch getPitchById(Long id) {
        return pitchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pitch not found"));
    }

    public Pitch createPitch(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Pitch name cannot be empty");
        }

        Pitch pitch = new Pitch(name.trim());

        return pitchRepository.save(pitch);
    }

    public Pitch updatePitch(Long id, String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Pitch name cannot be empty");
        }

        Pitch pitch = getPitchById(id);
        pitch.setName(name.trim());

        return pitchRepository.save(pitch);
    }

    public void deletePitch(Long id) {
        Pitch pitch = getPitchById(id);
        pitch.setActive(false);

        pitchRepository.save(pitch);
    }
}