package com.footballxtreme.settings;

import com.footballxtreme.pitch.Pitch;
import com.footballxtreme.pitch.PitchRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class BlockedTimeService {

    private final BlockedTimeRepository blockedTimeRepository;
    private final PitchRepository pitchRepository;

    public BlockedTimeService(
            BlockedTimeRepository blockedTimeRepository,
            PitchRepository pitchRepository
    ) {
        this.blockedTimeRepository = blockedTimeRepository;
        this.pitchRepository = pitchRepository;
    }

    public List<BlockedTime> getAllBlockedTimes() {
        return blockedTimeRepository.findAll();
    }

    public List<BlockedTime> getBlockedTimes(
            Long pitchId,
            LocalDate date
    ) {
        return blockedTimeRepository.findByPitchAndDate(
                pitchId,
                date
        );
    }

    public BlockedTime createBlockedTime(
            Long pitchId,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime,
            String reason
    ) {

        if (startTime == null || endTime == null) {
            throw new IllegalArgumentException(
                    "Start time and end time are required."
            );
        }

        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException(
                    "Start time must be before end time."
            );
        }

        Pitch pitch = pitchRepository.findById(pitchId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Pitch not found.")
                );

        List<BlockedTime> existingBlockedTimes =
                blockedTimeRepository.findByPitchAndDate(
                        pitchId,
                        date
                );

        for (BlockedTime existing : existingBlockedTimes) {

            boolean overlaps =
                    startTime.isBefore(existing.getEndTime())
                            && endTime.isAfter(existing.getStartTime());

            if (overlaps) {
                throw new IllegalArgumentException(
                        "This pitch is already blocked for the selected time."
                );
            }
        }

        BlockedTime blockedTime = new BlockedTime();

        blockedTime.setPitch(pitch);
        blockedTime.setDate(date);
        blockedTime.setStartTime(startTime);
        blockedTime.setEndTime(endTime);
        blockedTime.setReason(reason);

        return blockedTimeRepository.save(blockedTime);
    }

    public BlockedTime updateBlockedTime(
            Long id,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime,
            String reason
    ) {

        if (startTime == null || endTime == null) {
            throw new IllegalArgumentException(
                    "Start time and end time are required."
            );
        }

        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException(
                    "Start time must be before end time."
            );
        }

        BlockedTime blockedTime = blockedTimeRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Blocked time not found.")
                );

        Long pitchId = blockedTime.getPitch().getId();

        List<BlockedTime> existingBlockedTimes =
                blockedTimeRepository.findByPitchAndDate(
                        pitchId,
                        date
                );

        for (BlockedTime existing : existingBlockedTimes) {

            if (existing.getId().equals(id)) {
                continue;
            }

            boolean overlaps =
                    startTime.isBefore(existing.getEndTime())
                            && endTime.isAfter(existing.getStartTime());

            if (overlaps) {
                throw new IllegalArgumentException(
                        "This pitch is already blocked for the selected time."
                );
            }
        }

        blockedTime.setDate(date);
        blockedTime.setStartTime(startTime);
        blockedTime.setEndTime(endTime);
        blockedTime.setReason(reason);

        return blockedTimeRepository.save(blockedTime);
    }

    public void deleteBlockedTime(Long id) {
        if (!blockedTimeRepository.existsById(id)) {
            throw new IllegalArgumentException(
                    "Blocked time not found."
            );
        }

        blockedTimeRepository.deleteById(id);
    }
}