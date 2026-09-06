package com.footballxtreme.settings;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/blocked-times")
public class BlockedTimeController {

    private final BlockedTimeService blockedTimeService;

    public BlockedTimeController(BlockedTimeService blockedTimeService) {
        this.blockedTimeService = blockedTimeService;
    }

    @GetMapping
    public List<BlockedTime> getAllBlockedTimes() {
        return blockedTimeService.getAllBlockedTimes();
    }

    @GetMapping("/pitch/{pitchId}")
    public List<BlockedTime> getBlockedTimes(
            @PathVariable Long pitchId,
            @RequestParam LocalDate date
    ) {
        return blockedTimeService.getBlockedTimes(
                pitchId,
                date
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BlockedTime createBlockedTime(
            @RequestParam Long pitchId,
            @RequestParam LocalDate date,
            @RequestParam LocalTime startTime,
            @RequestParam LocalTime endTime,
            @RequestParam(required = false) String reason
    ) {
        return blockedTimeService.createBlockedTime(
                pitchId,
                date,
                startTime,
                endTime,
                reason
        );
    }
    @PutMapping("/{id}")
    public BlockedTime updateBlockedTime(
            @PathVariable Long id,
            @RequestParam LocalDate date,
            @RequestParam LocalTime startTime,
            @RequestParam LocalTime endTime,
            @RequestParam(required = false) String reason
    ) {
        return blockedTimeService.updateBlockedTime(
                id,
                date,
                startTime,
                endTime,
                reason
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBlockedTime(
            @PathVariable Long id
    ) {
        blockedTimeService.deleteBlockedTime(id);
    }
}