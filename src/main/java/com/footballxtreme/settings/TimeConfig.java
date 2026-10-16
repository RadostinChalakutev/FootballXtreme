package com.footballxtreme.settings;
import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import java.time.*;
@Configuration
public class TimeConfig {
    @Bean Clock bookingClock(@Value("${app.time-zone:Europe/Sofia}") String zone) { return Clock.system(ZoneId.of(zone)); }
}
