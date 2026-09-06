package com.footballxtreme.pitch;

import com.footballxtreme.pitch.dto.CreatePitchRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pitches")
public class PitchController {

    private final PitchService pitchService;

    public PitchController(PitchService pitchService) {
        this.pitchService = pitchService;
    }


    // ==========================================
    // ACTIVE PITCHES - PUBLIC
    // ==========================================

    @GetMapping
    public List<Pitch> getAllPitches() {

        return pitchService.getAllPitches();

    }


    // ==========================================
    // ALL PITCHES - ADMIN
    // ==========================================

    @GetMapping("/admin")
    public List<Pitch> getAllPitchesForAdmin() {

        return pitchService.getAllPitchesForAdmin();

    }


    // ==========================================
    // GET PITCH BY ID
    // ==========================================

    @GetMapping("/{id}")
    public Pitch getPitchById(
            @PathVariable Long id
    ) {

        return pitchService.getPitchById(id);

    }


    // ==========================================
    // CREATE PITCH
    // ==========================================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Pitch createPitch(
            @RequestBody CreatePitchRequest request
    ) {

        return pitchService.createPitch(
                request.getName()
        );

    }


    // ==========================================
    // UPDATE PITCH NAME
    // ==========================================

    @PutMapping("/{id}")
    public Pitch updatePitch(
            @PathVariable Long id,
            @RequestParam String name
    ) {

        return pitchService.updatePitch(
                id,
                name
        );

    }


    // ==========================================
    // DEACTIVATE PITCH
    // ==========================================

    @PutMapping("/{id}/deactivate")
    public Pitch deactivatePitch(
            @PathVariable Long id
    ) {

        return pitchService.deactivatePitch(id);

    }


    // ==========================================
    // ACTIVATE PITCH
    // ==========================================

    @PutMapping("/{id}/activate")
    public Pitch activatePitch(
            @PathVariable Long id
    ) {

        return pitchService.activatePitch(id);

    }

}