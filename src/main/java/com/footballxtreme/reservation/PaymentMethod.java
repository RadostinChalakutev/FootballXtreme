package com.footballxtreme.reservation;

/**
 * A deliberately small first payment model. No card is charged by the
 * application; venues can later add an external payment provider without
 * changing a reservation's commercial total.
 */
public enum PaymentMethod {
    PAY_ON_SITE
}
