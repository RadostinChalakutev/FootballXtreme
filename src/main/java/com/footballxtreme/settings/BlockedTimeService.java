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
    private final com.footballxtreme.reservation.ReservationRepository reservations;

    public BlockedTimeService(
            BlockedTimeRepository blockedTimeRepository,
            PitchRepository pitchRepository,
            com.footballxtreme.reservation.ReservationRepository reservations
    ) {
        this.blockedTimeRepository = blockedTimeRepository;
        this.pitchRepository = pitchRepository;
        this.reservations = reservations;
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

    @org.springframework.transaction.annotation.Transactional
    public BlockedTime createBlockedTime(
            Long pitchId,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime,
            String reason
    ) {

        if (date == null || startTime == null || endTime == null) {
            throw new IllegalArgumentException(
                    "Start time and end time are required."
            );
        }

        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException(
                    "Start time must be before end time."
            );
        }

        Pitch pitch = pitchRepository.findByIdForUpdate(pitchId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Pitch not found.")
                );

        for (var reservation : reservations.findActiveReservationsForPitchAndDate(pitchId,date,com.footballxtreme.reservation.ReservationStatus.CONFIRMED)) {
            if (startTime.isBefore(reservation.getStartTime().plusMinutes(reservation.getDurationMinutes())) && endTime.isAfter(reservation.getStartTime()))
                throw new com.footballxtreme.reservation.BookingConflictException("Cannot block an existing reservation.");
        }
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

    @org.springframework.transaction.annotation.Transactional
    public BlockedTime updateBlockedTime(
            Long id,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime,
            String reason
    ) {

        if (date == null || startTime == null || endTime == null) {
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
        pitchRepository.findByIdForUpdate(pitchId).orElseThrow();

        for (var reservation : reservations.findActiveReservationsForPitchAndDate(pitchId,date,com.footballxtreme.reservation.ReservationStatus.CONFIRMED)) {
            if (startTime.isBefore(reservation.getStartTime().plusMinutes(reservation.getDurationMinutes())) && endTime.isAfter(reservation.getStartTime()))
                throw new com.footballxtreme.reservation.BookingConflictException("Cannot block an existing reservation.");
        }
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