package com.footballxtreme.settings;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/working-hours")
public class WorkingHoursController {

    private final WorkingHoursService workingHoursService;

    public WorkingHoursController(WorkingHoursService workingHoursService) {
        this.workingHoursService = workingHoursService;
    }

    @GetMapping
    public List<WorkingHours> getAllWorkingHours() {
        return workingHoursService.getAllWorkingHours();
    }

    @GetMapping("/{dayOfWeek}")
    public WorkingHours getWorkingHours(
            @PathVariable DayOfWeek dayOfWeek
    ) {
        return workingHoursService.getWorkingHours(dayOfWeek);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorkingHours createWorkingHours(
            @RequestParam DayOfWeek dayOfWeek,
            @RequestParam LocalTime openingTime,
            @RequestParam LocalTime closingTime,
            @RequestParam(defaultValue = "false") boolean closed
    ) {
        return workingHoursService.createWorkingHours(
                dayOfWeek,
                openingTime,
                closingTime,
                closed
        );
    }

    @PutMapping("/{id}")
    public WorkingHours updateWorkingHours(
            @PathVariable Long id,
            @RequestParam LocalTime openingTime,
            @RequestParam LocalTime closingTime,
            @RequestParam(defaultValue = "false") boolean closed
    ) {
        return workingHoursService.updateWorkingHours(
                id,
                openingTime,
                closingTime,
                closed
        );
    }
}