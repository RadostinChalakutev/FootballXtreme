ALTER TABLE pitches ADD COLUMN description VARCHAR(500);
ALTER TABLE pitches ADD COLUMN format VARCHAR(32);
ALTER TABLE pitches ADD COLUMN surface VARCHAR(120);
ALTER TABLE pitches ADD COLUMN has_lighting BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE pitches ADD COLUMN hourly_rate NUMERIC(10, 2);
ALTER TABLE pitches ADD COLUMN amenities VARCHAR(500);
ALTER TABLE pitches ADD COLUMN location VARCHAR(160);
ALTER TABLE pitches ADD COLUMN accent VARCHAR(24);

ALTER TABLE reservations ADD COLUMN reference VARCHAR(24);
ALTER TABLE reservations ADD COLUMN total_price NUMERIC(10, 2);
ALTER TABLE reservations ADD COLUMN currency VARCHAR(3);
ALTER TABLE reservations ADD COLUMN payment_method VARCHAR(32);
ALTER TABLE reservations ADD COLUMN terms_accepted_at TIMESTAMP;

CREATE UNIQUE INDEX ux_reservations_reference ON reservations (reference);
