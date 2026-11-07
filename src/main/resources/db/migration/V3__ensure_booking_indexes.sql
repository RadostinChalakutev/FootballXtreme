-- V1 is baselined rather than executed when upgrading a legacy Hibernate-managed
-- database. Re-declare the performance indexes idempotently so both fresh and
-- upgraded installations have the same operational schema.
CREATE INDEX IF NOT EXISTS idx_reservations_pitch_date
    ON reservations (pitch_id, date);

CREATE INDEX IF NOT EXISTS idx_blocked_times_pitch_date
    ON blocked_times (pitch_id, date);
