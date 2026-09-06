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

    @GetMapping
    public List<Pitch> getAllPitches() {
        return pitchService.getAllPitches();
    }
    @GetMapping("/admin")
    public List<Pitch> getAllPitchesForAdmin() {
        return pitchService.getAllPitchesForAdmin();
    }

    @GetMapping("/{id}")
    public Pitch getPitchById(@PathVariable Long id) {
        return pitchService.getPitchById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Pitch createPitch(@RequestBody CreatePitchRequest request) {
        return pitchService.createPitch(request.getName());
    }

    @PutMapping("/{id}")
    public Pitch updatePitch(
            @PathVariable Long id,
            @RequestParam String name
    ) {
        return pitchService.updatePitch(id, name);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePitch(@PathVariable Long id) {
        pitchService.deletePitch(id);
    }
}