package com.footballxtreme.settings;

import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@Service
public class WorkingHoursService {

    private final WorkingHoursRepository workingHoursRepository;

    public WorkingHoursService(WorkingHoursRepository workingHoursRepository) {
        this.workingHoursRepository = workingHoursRepository;
    }

    public List<WorkingHours> getAllWorkingHours() {
        return workingHoursRepository.findAll();
    }

    public WorkingHours getWorkingHours(DayOfWeek dayOfWeek) {
        return workingHoursRepository.findByDayOfWeek(dayOfWeek)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Working hours not configured for " + dayOfWeek
                        )
                );
    }

    public WorkingHours createWorkingHours(
            DayOfWeek dayOfWeek,
            LocalTime openingTime,
            LocalTime closingTime,
            boolean closed
    ) {

        if (dayOfWeek == null) {
            throw new IllegalArgumentException("Day of week cannot be null.");
        }

        if (workingHoursRepository.findByDayOfWeek(dayOfWeek).isPresent()) {
            throw new IllegalArgumentException(
                    "Working hours already exist for " + dayOfWeek
            );
        }

        if (!closed) {
            validateTimes(openingTime, closingTime);
        }

        WorkingHours workingHours = new WorkingHours(
                dayOfWeek,
                openingTime,
                closingTime,
                closed
        );

        return workingHoursRepository.save(workingHours);
    }

    public WorkingHours updateWorkingHours(
            Long id,
            LocalTime openingTime,
            LocalTime closingTime,
            boolean closed
    ) {

        WorkingHours workingHours = workingHoursRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Working hours not found.")
                );

        if (!closed) {
            validateTimes(openingTime, closingTime);
        }

        workingHours.setOpeningTime(openingTime);
        workingHours.setClosingTime(closingTime);
        workingHours.setClosed(closed);

        return workingHoursRepository.save(workingHours);
    }

    private void validateTimes(
            LocalTime openingTime,
            LocalTime closingTime
    ) {

        if (openingTime == null || closingTime == null) {
            throw new IllegalArgumentException(
                    "Opening and closing time are required."
            );
        }

        if (!openingTime.isBefore(closingTime)) {
            throw new IllegalArgumentException(
                    "Opening time must be before closing time."
            );
        }
    }
}