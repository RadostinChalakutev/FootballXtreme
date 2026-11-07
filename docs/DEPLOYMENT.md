# FootballXtreme deployment guide

## Purpose and supported deployment shape

The supplied [Docker Compose file](../docker-compose.yml) is a repeatable single-host runtime for local demos, development and a tightly managed pilot. It builds the Spring Boot application, starts PostgreSQL 17 and places the database on an internal network.

For an internet-facing production installation, place the application behind an HTTPS reverse proxy or platform load balancer. Do not expose PostgreSQL to the public internet.

```text
Browser ── HTTPS ──> reverse proxy / load balancer ──> FootballXtreme app ──> PostgreSQL
                                                       └───────────────> Resend
```

## Prerequisites

- Docker Compose v2 for the reference deployment
- A Resend account, API key and verified sender domain/address
- A secure way to distribute runtime secrets
- A host protected by normal operating-system, firewall and backup controls

## Environment configuration

Copy the template, keep the resulting file private, and replace every placeholder before a real deployment:

```bash
cp .env.example .env
docker compose config
```

PowerShell equivalent:

```powershell
Copy-Item .env.example .env
docker compose config
```

`.env` is intentionally ignored by Git. Spring Boot does not load it when run directly; Docker Compose uses it for interpolation and passes the values to containers.

| Setting | Docker Compose behaviour | Production guidance |
| --- | --- | --- |
| `DB_USERNAME` / `DB_PASSWORD` | Creates the PostgreSQL role and supplies the application credentials. | Use a unique least-privilege credential from a secret manager. |
| `POSTGRES_DB` | Optional database name; defaults to `footballxtreme`. | Use a dedicated database per environment. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Creates the in-memory administrator account at startup. | Use a unique administrator password of 16–72 UTF-8 bytes and limit access to the admin URL. |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Enables transactional confirmation/cancellation email when both are configured. | Use a verified sender and test delivery after every deployment; do not enable public bookings without it. |
| `DDL_AUTO` | Defaults to `validate`; Flyway applies the bundled schema migrations. | Keep `validate`; add reviewed forward-only Flyway migrations for every schema change. |
| `FLYWAY_BASELINE_ON_MIGRATE` | Defaults to `true`, guarded by recognition of the legacy FootballXtreme schema. | Allows the first upgrade of the old Hibernate-managed database. Set `false` after the history table exists. |
| `DEMO_DATA_ENABLED` | Defaults to `true` for an empty local demo database. | Set `false`; it seeds sample pitches and hours and is not for a real venue. |
| `COOKIE_SECURE` | Defaults to `false` for localhost HTTP. | Set `true` when HTTPS is in place. |
| `APP_PORT` | Publishes port 8080 by default. | Bind only through a reverse proxy or trusted platform ingress where possible. |
| `APP_TIME_ZONE` | Defaults to `Europe/Sofia`. | Set the venue's operational time zone explicitly. |

The Compose application container always uses `jdbc:postgresql://db:5432/<database>`; it does not use the `DB_URL` intended for a standalone local process.

## Start and observe

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f app
```

On the first run, PostgreSQL must report healthy before the application is started. The application is available at `http://localhost:8080` unless `APP_PORT` was changed.

For a foreground demo, omit `-d`:

```bash
docker compose up --build
```

To stop the containers while retaining the database volume:

```bash
docker compose down
```

## Upgrading the existing Render database

Older releases used Hibernate `ddl-auto=update`, so an existing database can contain all application tables but no `flyway_schema_history`. This causes the startup error `Found non-empty schema(s) "public" but no schema history table` when Flyway is first introduced.

The application now handles that specific upgrade automatically. A `beforeBaseline` callback requires the original four tables (`pitches`, `working_hours`, `reservations`, `blocked_times`) and their original columns. Only that recognized layout is baselined at version 1. V2 then adds the new fields and V3 ensures the booking lookup indexes exist. Existing pitches, reservations, opening hours and blocks are retained. An unrelated, incomplete or partially upgraded schema is rejected before baseline history is written.

1. Take a database snapshot or backup and confirm that the service's `DB_URL` selects the intended FootballXtreme database.
2. Deploy the latest `master` commit. Keep `DDL_AUTO=validate`. `FLYWAY_BASELINE_ON_MIGRATE` defaults to `true`; if an existing Render environment variable or external configuration explicitly sets it to `false`, enable it for this first upgrade.
3. Check the deployment logs for a successful baseline at version 1 followed by migration to version 3. Open `/actuator/health` and confirm `{"status":"UP"}`, then check the existing bookings in the operator panel.
4. After that first successful upgrade, set `FLYWAY_BASELINE_ON_MIGRATE=false`. Subsequent deploys use the recorded history normally. Empty databases also work with `false` and run V1, V2 and V3 in order.

If the guard reports an unrecognized schema, inspect its structure and the configured database before proceeding. Do not delete tables, clear existing history, enable Hibernate `create`/`create-drop`, or mark V2 as applied without running it. Back up and review any manually added columns before planning a separate upgrade for that schema.

The baseline version must remain `1`: baselining at `2` would skip the new fields required by this application. Flyway's [baseline-on-migrate documentation](https://documentation.red-gate.com/flyway/reference/configuration/flyway-namespace/flyway-baseline-on-migrate-setting) explains why only migrations above the baseline version are executed.

## Initial operational setup

A fresh production database should start with `DEMO_DATA_ENABLED=false`. Before publicly accepting reservations:

1. Sign in at `/admin-login.html` using `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
2. Create every bookable pitch and verify its active status.
3. Open **Работно време** in the administrator panel and configure all seven days, including any closed days.
4. Add a test maintenance block, create a future booking, cancel it and verify both relevant emails from the production sender.
5. Confirm that public endpoints expose no customer data and that an unauthenticated call to an admin endpoint returns `401`.

The application purposefully prevents bookings when hours are missing. The administrator panel includes a working-hours editor, while the authenticated API remains available for integrations.

## Standalone JVM deployment

For a platform that runs the JAR directly:

```bash
mvn clean package -DskipTests
java -jar target/football-xtreme-1.0.0.jar
```

Provide `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `ADMIN_PASSWORD`, `RESEND_API_KEY` and the other runtime settings through the platform's environment/secrets facility. The included Dockerfile uses the same build artifact.

## Production hardening checklist

- Terminate TLS in a correctly configured reverse proxy or managed platform, redirect HTTP to HTTPS and set `COOKIE_SECURE=true`.
- Store database, admin and Resend credentials in a secret manager; never put them in Git, images or client configuration.
- Review and apply forward-only Flyway migrations through the deployment pipeline. Back up the current database before any schema operation and rehearse a restore.
- Define database backup retention, test restores and document the recovery owner.
- Add service logs, uptime checks, alerting and an operational response path. The project exposes a minimal unauthenticated `GET /actuator/health` endpoint, but has no bundled monitoring stack.
- Rate-limit login and booking traffic, add contact ownership verification and introduce idempotency keys before opening bookings broadly.
- Add a durable outbox/retry/monitoring strategy for notification delivery. A booking remains confirmed if email delivery fails.
- Run concurrency and load tests against the exact PostgreSQL and hosting topology used in production.
- Complete accessibility, mobile-browser and privacy/retention reviews for the target market.
- Use a staging environment and perform a venue-specific acceptance test before every paid rollout.

## Data and recovery

The `postgres_data` Docker volume persists across `docker compose down`. It is not a backup. Back up PostgreSQL using a controlled, encrypted process outside the application host or to protected storage, and test the restoration procedure against a non-production environment.

Before rebuilding or moving a host, record the application image/version, environment configuration location, database backup reference and the expected rollback procedure. Avoid using ad-hoc copies of the live database volume as a recovery strategy.

## Updates and rollback

1. Test the target revision and configuration in staging.
2. Back up and validate the database restore path.
3. Build/pull the target application image and restart only the application service.
4. Validate public booking, admin authentication, CSRF-protected mutation and email delivery.
5. If rollback is required, restore the prior application image and use the pre-defined database rollback/restore plan. Do not assume a schema change is reversible without a tested migration.

For a complete list of code-level release caveats, see [RELEASE_READINESS.md](../RELEASE_READINESS.md).
