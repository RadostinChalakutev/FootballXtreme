package com.footballxtreme.pitch;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "pitches")
public class Pitch {

    public static final BigDecimal DEFAULT_HOURLY_RATE = new BigDecimal("70.00");
    public static final String DEFAULT_FORMAT = "5v5";
    public static final String DEFAULT_SURFACE = "Premium изкуствена трева";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private boolean active = true;

    @Column(length = 500)
    private String description;

    @Column(length = 32)
    private String format = DEFAULT_FORMAT;

    @Column(length = 120)
    private String surface = DEFAULT_SURFACE;

    @Column
    private boolean hasLighting = true;

    @Column(precision = 10, scale = 2)
    private BigDecimal hourlyRate = DEFAULT_HOURLY_RATE;

    @Column(length = 500)
    private String amenities;

    @Column(length = 160)
    private String location;

    @Column(length = 24)
    private String accent = "lime";

    public Pitch() {
    }

    public Pitch(String name) {
        this.name = name;
        this.active = true;
    }

    @PrePersist
    @PreUpdate
    private void applyDefaults() {
        if (format == null || format.isBlank()) {
            format = DEFAULT_FORMAT;
        }

        if (surface == null || surface.isBlank()) {
            surface = DEFAULT_SURFACE;
        }

        if (hourlyRate == null || hourlyRate.signum() < 0) {
            hourlyRate = DEFAULT_HOURLY_RATE;
        }

        if (accent == null || accent.isBlank()) {
            accent = "lime";
        }
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getFormat() {
        return format == null || format.isBlank() ? DEFAULT_FORMAT : format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getSurface() {
        return surface == null || surface.isBlank() ? DEFAULT_SURFACE : surface;
    }

    public void setSurface(String surface) {
        this.surface = surface;
    }

    public boolean isHasLighting() {
        return hasLighting;
    }

    public void setHasLighting(boolean hasLighting) {
        this.hasLighting = hasLighting;
    }

    public BigDecimal getHourlyRate() {
        return hourlyRate == null ? DEFAULT_HOURLY_RATE : hourlyRate;
    }

    public void setHourlyRate(BigDecimal hourlyRate) {
        this.hourlyRate = hourlyRate;
    }

    public String getAmenities() {
        return amenities;
    }

    public void setAmenities(String amenities) {
        this.amenities = amenities;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getAccent() {
        return accent == null || accent.isBlank() ? "lime" : accent;
    }

    public void setAccent(String accent) {
        this.accent = accent;
    }
}
