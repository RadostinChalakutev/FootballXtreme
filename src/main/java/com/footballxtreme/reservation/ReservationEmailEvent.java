package com.footballxtreme.reservation;
public record ReservationEmailEvent(Reservation reservation, boolean cancelled) {}
