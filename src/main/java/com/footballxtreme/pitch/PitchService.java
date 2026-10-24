package com.footballxtreme.pitch;

import com.footballxtreme.pitch.dto.CreatePitchRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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

    public Pitch createPitch(CreatePitchRequest request) {

        if (request == null) {
            throw new IllegalArgumentException("Pitch details are required.");
        }

        return createPitch(
                request.getName(),
                request.getDescription(),
                request.getFormat(),
                request.getSurface(),
                request.getHasLighting(),
                request.getHourlyRate(),
                request.getAmenities(),
                request.getLocation(),
                request.getAccent()
        );
    }

    public Pitch createPitch(String name) {
        return createPitch(name, null, null, null, null, null, null, null, null);
    }

    private Pitch createPitch(
            String name,
            String description,
            String format,
            String surface,
            Boolean hasLighting,
            BigDecimal hourlyRate,
            String amenities,
            String location,
            String accent
    ) {

        validateName(name);

        Pitch pitch = new Pitch(name.trim());
        pitch.setDescription(trimToNull(description));
        pitch.setFormat(defaultIfBlank(format, Pitch.DEFAULT_FORMAT));
        pitch.setSurface(defaultIfBlank(surface, Pitch.DEFAULT_SURFACE));
        pitch.setHasLighting(hasLighting == null || hasLighting);
        pitch.setHourlyRate(hourlyRate == null ? Pitch.DEFAULT_HOURLY_RATE : hourlyRate);
        pitch.setAmenities(trimToNull(amenities));
        pitch.setLocation(trimToNull(location));
        pitch.setAccent(defaultIfBlank(accent, "lime"));

        return pitchRepository.save(pitch);
    }


    // ==========================================
    // UPDATE NAME
    // ==========================================

    @org.springframework.transaction.annotation.Transactional
    public Pitch updatePitch(
            Long id,
            String name
    ) {

        validateName(name);

        Pitch pitch =
                pitchRepository.findByIdForUpdate(id).orElseThrow(() -> new IllegalArgumentException("Pitch not found."));

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

    @org.springframework.transaction.annotation.Transactional
    public Pitch deactivatePitch(
            Long id
    ) {

        Pitch pitch =
                pitchRepository.findByIdForUpdate(id).orElseThrow(() -> new IllegalArgumentException("Pitch not found."));

        pitch.setActive(false);

        return pitchRepository.save(
                pitch
        );
    }


    // ==========================================
    // ACTIVATE
    // ==========================================

    @org.springframework.transaction.annotation.Transactional
    public Pitch activatePitch(
            Long id
    ) {

        Pitch pitch =
                pitchRepository.findByIdForUpdate(id).orElseThrow(() -> new IllegalArgumentException("Pitch not found."));

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

    private String defaultIfBlank(String value, String fallback) {
        String normalized = trimToNull(value);
        return normalized == null ? fallback : normalized;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

}
