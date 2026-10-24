# FootballXtreme — release readiness

This repository is a Spring Boot/Java 25 application with a static JavaScript UI. It is not the separately referenced React ZIP. This change is a security and booking-correctness baseline, not a claim of commercial release readiness.

## Changes

- Public availability returns time slots without customer names, email addresses, phones or reservation IDs. Block reasons are private.
- Cancellation, customer search, full reservation lists and pitch management require the ADMIN role. API authentication failures return 401 instead of a login page disguised as a successful response.
- CSRF is enabled for booking, login, logout and administration; both browser interfaces obtain session tokens.
- Administrator credentials and database secrets come from environment variables. The application refuses a missing or short administrator password.
- A database pessimistic lock on the pitch serializes booking and blocking mutations. Confirmed bookings cannot overlap, and a blocked period cannot cover an existing booking. Pitch activation/deactivation uses the same lock.
- Server-side checks enforce configured working hours, closed days, future starts in Europe/Sofia, supported duration and half-hour boundaries, including rejection of midnight wraparound.
- Availability failures disable booking; stale network responses cannot overwrite the selected date/pitch. The calendar uses configured hours.
- Confirmation emails are attempted after commit, so rolled-back bookings do not send confirmations. Delivery is still best effort, not a durable queue.

## Configure and run

1. Use Java 25, Maven 3.9 and PostgreSQL. Copy the variable names from `.env.example` into the deployment environment. Spring does **not** automatically load `.env` files.
2. Set unique `DB_PASSWORD` and `ADMIN_PASSWORD`, a valid `RESEND_API_KEY`, and a verified `RESEND_FROM_EMAIL`. Never commit real values. The sender must belong to your verified Resend domain.
3. Flyway applies the bundled versioned schema migrations. Keep `DDL_AUTO=validate` in normal development and production, add reviewed forward-only migrations for every schema change, and back up an existing database before rollout.
4. Start with `mvn spring-boot:run` or `java -jar target/football-xtreme-1.0.0.jar`. For local HTTP, set `COOKIE_SECURE=false`; production must use HTTPS and `COOKIE_SECURE=true`.
5. Sign in at `/admin-login.html`, create at least one active pitch and configure all seven days through the **Работно време** section. Missing hours intentionally prevent bookings. The authenticated `/api/working-hours` API remains available for integrations.
6. Run `mvn verify` and `node --test src/test/js/availability.test.cjs`. Tests use a disposable H2 database by default. Set `TEST_DB_URL`, `TEST_DB_USER`, `TEST_DB_PASSWORD` to an **empty disposable PostgreSQL database** to run the same tests against PostgreSQL. Tests create/drop their schema. CI uses a dedicated PostgreSQL 17 service and Java 25.

## Required before a paid pilot

1. **Rotate exposed credentials:** database/mail credentials were committed previously. Removing them here does not remove them from Git history. Rotate at the providers, inspect access logs, and separately plan history cleanup. No provider credentials have been rotated by this change.
2. **Booking abuse:** add verified contact ownership (OTP/email link), per-client and per-venue rate limits, booking horizon/quotas, and idempotency keys. CSRF alone does not prevent spam or deliberate slot exhaustion.
3. **Reliable notifications:** durable outbox, retries, delivery monitoring and a reconciliation screen. An email failure currently leaves the reservation confirmed. Tell customers this clearly in the final product flow.
4. **Product completeness:** define prices, taxes, deposits/refunds, cancellation policy, customer self-service with secure ownership checks, venue/operator workflows, accessibility review and mobile end-to-end tests.
5. **Operations:** encrypted backups with a restore drill, monitoring/alerts, retention/deletion rules, HTTPS deployment, session/login rate limiting and a staging acceptance run. Configure secrets and run an actual email delivery test using your own account.
6. **Load and consistency:** run concurrency/load tests against the deployed PostgreSQL version and multiple app instances. Opening hours are checked at booking time; changing hours does not automatically move/cancel existing bookings. Pitch-level locking trades throughput for correctness and should be measured for large venues.

Do not merge and deploy automatically: an existing deployment needs new environment variables, a Flyway baseline/upgrade plan and working-hours configuration first. No payment collection or production deployment is included here.
