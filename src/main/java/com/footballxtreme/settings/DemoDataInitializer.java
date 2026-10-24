package com.footballxtreme.settings;

import com.footballxtreme.pitch.Pitch;
import com.footballxtreme.pitch.PitchRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;

/**
 * Opt-in sample data for a buyer or recruiter to evaluate the complete booking
 * journey without entering records by hand. It is disabled in every production
 * configuration and never replaces existing venue data.
 */
@Component
@ConditionalOnProperty(prefix = "app.demo-data", name = "enabled", havingValue = "true")
public class DemoDataInitializer implements ApplicationRunner {

    private final PitchRepository pitchRepository;
    private final WorkingHoursRepository workingHoursRepository;

    public DemoDataInitializer(
            PitchRepository pitchRepository,
            WorkingHoursRepository workingHoursRepository
    ) {
        this.pitchRepository = pitchRepository;
        this.workingHoursRepository = workingHoursRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        initializeWorkingHours();

        if (pitchRepository.count() == 0) {
            pitchRepository.save(createPitch(
                    "Терен 01 · North",
                    "Гъвкав терен за бързи мачове, тренировки и вечерни лиги.",
                    "5v5",
                    "Premium изкуствена трева",
                    "Осветление, Съблекални, Паркинг",
                    new BigDecimal("72.00"),
                    "lime"
            ));
            pitchRepository.save(createPitch(
                    "Терен 02 · Central",
                    "По-широк терен за пълни състави и организирани отбори.",
                    "6v6",
                    "FIFA Quality Pro изкуствена трева",
                    "Осветление, Душове, Паркинг",
                    new BigDecimal("84.00"),
                    "blue"
            ));
            pitchRepository.save(createPitch(
                    "Терен 03 · Night",
                    "Терен с фокус върху късните часове и турнирни формати.",
                    "7v7",
                    "Хибридна настилка",
                    "Осветление, Трибуна, Рефреш зона",
                    new BigDecimal("96.00"),
                    "violet"
            ));
        }
    }

    private void initializeWorkingHours() {
        for (DayOfWeek day : DayOfWeek.values()) {
            if (workingHoursRepository.findByDayOfWeek(day).isEmpty()) {
                workingHoursRepository.save(new WorkingHours(
                        day,
                        LocalTime.of(9, 0),
                        LocalTime.of(23, 0),
                        false
                ));
            }
        }
    }

    private Pitch createPitch(
            String name,
            String description,
            String format,
            String surface,
            String amenities,
            BigDecimal hourlyRate,
            String accent
    ) {
        Pitch pitch = new Pitch(name);
        pitch.setDescription(description);
        pitch.setFormat(format);
        pitch.setSurface(surface);
        pitch.setAmenities(amenities);
        pitch.setHourlyRate(hourlyRate);
        pitch.setHasLighting(true);
        pitch.setLocation("FootballXtreme Demo Arena · София");
        pitch.setAccent(accent);
        return pitch;
    }
}
