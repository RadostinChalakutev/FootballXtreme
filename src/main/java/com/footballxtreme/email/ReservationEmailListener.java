package com.footballxtreme.email;
import com.footballxtreme.reservation.ReservationEmailEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
@Component
public class ReservationEmailListener {
    private final EmailService email;
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ReservationEmailListener.class);
    public ReservationEmailListener(EmailService email) { this.email=email; }
    @TransactionalEventListener
    public void send(ReservationEmailEvent event) {
        try {
            if (event.cancelled()) email.sendReservationCancellation(event.reservation());
            else email.sendReservationConfirmation(event.reservation());
        } catch (Exception e) { log.error("Reservation {} email delivery failed",event.reservation().getId()); }
    }
}
