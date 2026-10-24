# FootballXtreme product brief

## Positioning

FootballXtreme is a booking and operations product for independent football facilities. It gives venue operators a branded digital booking front door while keeping the operational rules — pitch availability, opening hours, maintenance blocks and cancellations — in one system of record.

It is positioned as a **single-venue pilot product and vertical-SaaS foundation**. That is the right scope for a credible early commercial engagement: a facility can validate the customer journey and staff workflow without being asked to adopt an unfinished multi-tenant platform.

## The problem it solves

| Venue problem | Product response |
| --- | --- |
| Bookings are collected through calls, chat and notebooks. | Customers can check a pitch and submit a booking through a public browser flow. |
| Staff must remember schedules and maintenance windows. | Opening hours, closed days and pitch-specific blocks are evaluated on every booking. |
| Two people can request the same time at once. | The backend serializes competing pitch changes and rejects overlaps transactionally. |
| Customer and operational data is too widely visible. | Public availability returns only the timing information needed to book; operations remain behind an administrator login. |
| A venue has no credible online booking presence. | The customer flow, operator area, email notifications and configurable venue profile form a presentable pilot experience. |

## Current user journeys

### Customer

1. Opens the venue booking page.
2. Chooses a future date, an active pitch and an eligible start time.
3. Chooses a 60- or 90-minute duration and supplies contact details.
4. Receives a confirmation email after a successful reservation commit.

### Venue operator

1. Signs in through the administrator login.
2. Creates or updates pitches and changes whether they are bookable.
3. Views reservation activity, searches by customer phone, cancels reservations and sets pitch-specific blocks.
4. Configures weekly operating hours through the authenticated API.

## What makes the implementation credible

- **Correctness lives on the server.** The browser helps customers choose a slot, but the server checks future dates, half-hour boundaries, durations, working hours, pitch activation, blocks and reservation overlaps before it confirms anything.
- **Concurrent requests are handled intentionally.** Booking and blocking paths obtain a pessimistic database lock for the pitch, so two requests cannot both accept the same slot.
- **Security has a defined boundary.** Administrative endpoints require an authenticated role; CSRF protects state changes; password hashing uses BCrypt; public availability does not disclose names, phone numbers, email addresses, reservation IDs or block reasons.
- **Email follows the transaction.** Confirmation/cancellation work is triggered after a committed booking transaction, preventing email for a rolled-back booking.
- **The venue can be configured externally.** Contact, language and currency metadata can vary per deployment without hard-coding it into the customer UI.

## Commercial scope

### Suitable now

- A design-partner or paid pilot for one facility.
- A demonstrable portfolio project for a sports-tech or local-business software proposal.
- A foundation for a bespoke venue deployment, where onboarding and operations are delivered with the software.

### Deliberately out of scope today

- Multi-tenant accounts, multi-location reporting and subscription billing.
- Online payments, deposits, refunds, invoices and tax workflows.
- Customer self-service cancellation or ownership verification.
- SMS, WhatsApp and durable notification retry queues.
- Full accessibility, localization and mobile acceptance coverage for a commercial general release.

These boundaries are product decisions, not hidden limitations. They keep the first offer focused while making the next investment areas easy to explain.

## Suggested pilot offer

Use a discovery-led delivery rather than advertising the repository as generic plug-and-play SaaS:

1. **Venue setup:** add the facility profile, pitches, operating policy and verified email sender.
2. **Acceptance demo:** validate booking, blocking, cancellation and emails with the venue's staff.
3. **Pilot operation:** run one facility with defined support, backup and incident responsibilities.
4. **Expansion decision:** prioritize payments, customer verification, multi-venue support or custom branding based on measurable operator feedback.

Pricing, support terms, data-processing terms and the customer cancellation policy should be agreed per client; they are not encoded by this repository.

## Product evolution

| Next capability | Why it matters commercially |
| --- | --- |
| Customer identity verification and idempotency | Reduces spam, no-shows and duplicate requests. |
| Online payments and deposit rules | Converts bookings into a direct revenue channel. |
| Self-service customer portal | Reduces staff workload for changes and cancellations. |
| Backups, monitoring and alerting | Completes the operational foundation beyond the bundled versioned Flyway migrations. |
| Multi-venue tenancy and branded themes | Turns a bespoke installation into a scalable product line. |
| Reporting and utilization analytics | Gives operators a measurable reason to retain the product. |

## Proof points for a portfolio demo

An effective walkthrough shows business value rather than only screens:

1. Create pitches and set their operational status.
2. Block a maintenance window and show it disappear from public availability.
3. Submit two simultaneous requests for the same slot and show only one can succeed.
4. Show the operator reservation search and cancellation flow.
5. Inspect the public availability response to demonstrate that it contains no customer PII.
6. Show a booking confirmation from a verified demo sender.

For deployment requirements and current production caveats, read [DEPLOYMENT.md](DEPLOYMENT.md) and [../RELEASE_READINESS.md](../RELEASE_READINESS.md).
