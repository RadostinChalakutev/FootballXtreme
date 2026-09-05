# ⚽ FootballXtreme

Modern football pitch reservation and management system.

FootballXtreme is a web-based application designed to make booking and managing football pitches simple, fast, and modern.

The initial version is designed for a single football facility, with the architecture prepared for future expansion.

---

## 🎯 Project Goal

The main goal of FootballXtreme is to create a professional football pitch reservation system that can eventually be offered as a commercial product to football facilities.

The first version will focus on one location and provide everything needed to manage its football pitches and reservations.

---

## 🏟️ Initial Scope

The application will initially support:

* One football facility/location
* Three football pitches by default
* Dynamic pitch management
* Customer reservations
* Administrator management
* Configurable working hours
* Blocked dates and time periods
* Multiple reservation durations
* Responsive and modern football-themed interface

Pitches must **not be hardcoded**.

Administrators will be able to:

* Add pitches
* Remove pitches
* Rename pitches
* Activate/deactivate pitches

---

## 📅 Reservation System

Customers will be able to:

1. Select a date
2. Select a football pitch
3. Select a starting time
4. Select the reservation duration
5. Enter their contact information
6. Confirm the reservation

### Reservation durations

The minimum reservation duration is:

**60 minutes**

Supported durations will initially include:

* 60 minutes
* 90 minutes
* 120 minutes

The system must automatically prevent overlapping reservations.

---

## 🕘 Working Hours

Default working hours:

**09:00 – 23:00**

The administrator will be able to configure:

* Opening time
* Closing time
* Individual blocked days
* Individual blocked time periods
* Pitch-specific blocked periods

The system must automatically calculate the latest possible starting time based on the selected reservation duration.

Example:

| Duration | Latest Start |
| -------- | -----------: |
| 60 min   |        22:00 |
| 90 min   |        21:30 |
| 120 min  |        21:00 |

---

## 👤 Customers

Customers will **not need to create an account**.

To make a reservation they will provide:

* Name
* Phone number
* Email address

Payment will initially be:

**Payment on site**

Online payments will be considered for a future version.

---

## 🔐 User Roles

The system will initially support two roles:

### CUSTOMER

Customers can:

* View available pitches
* View available time slots
* Create reservations

Customers do not need to log in.

### ADMIN

Administrators can log in and manage the system.

Admins can:

* Manage pitches
* Manage reservations
* Manage working hours
* Block dates
* Block time periods
* View customers
* Manage system settings
* View reservation statistics

---

## 🎨 Design Goals

FootballXtreme must have a strong and recognizable **football-themed visual identity**.

The design should be:

* Modern
* Dark
* Sport-oriented
* Clean
* Professional
* Responsive
* Mobile-friendly

The interface should use football-inspired visual elements without becoming cluttered.

The booking process should be particularly simple on mobile devices.

---

## 🌍 Internationalization

The application must be designed for multiple languages from the beginning.

Initial language:

🇧🇬 Bulgarian

Future languages may include:

🇬🇧 English
🇩🇪 German
🇪🇸 Spanish
🇫🇷 French

User-facing text should not be hardcoded directly inside UI components.

The application should use translation keys so additional languages can be added without rewriting the interface.

---

## 🧱 Technology Stack

### Backend

* Java 21
* Spring Boot
* Spring Web
* Spring Data JPA
* Spring Security
* Maven

### Database

* PostgreSQL

### Frontend

* React
* JavaScript / TypeScript
* Modern CSS

### Development & Deployment

* Git
* GitHub
* Docker
* Docker Compose

Additional technologies may be introduced when they provide a clear benefit.

---

## 🗃️ Core Data Model

The initial database is expected to contain entities similar to:

```text
User
  │
  └── Role

Pitch

Reservation
  │
  ├── Customer information
  ├── Pitch
  ├── Start time
  ├── End time
  └── Status

WorkingHours

BlockedPeriod
```

The exact database structure will be designed before implementation.

---

## 🔌 Backend API

The backend will expose REST APIs for the frontend.

Examples:

```text
GET    /api/pitches
POST   /api/pitches
PUT    /api/pitches/{id}
DELETE /api/pitches/{id}

GET    /api/reservations
POST   /api/reservations
PUT    /api/reservations/{id}
DELETE /api/reservations/{id}

GET    /api/availability
```

The final API structure may change during development.

---

## 🚀 Development Roadmap

### Phase 1 — Project Setup

* [ ] Create project
* [ ] Configure Java 21
* [ ] Configure Spring Boot
* [ ] Configure Maven
* [ ] Configure PostgreSQL
* [ ] Create initial README
* [ ] Initialize Git repository

### Phase 2 — Backend Foundation

* [ ] Database configuration
* [ ] Entity models
* [ ] Repositories
* [ ] Services
* [ ] REST controllers
* [ ] Validation
* [ ] Error handling

### Phase 3 — Authentication

* [ ] Admin login
* [ ] Password hashing
* [ ] Spring Security
* [ ] Role-based authorization
* [ ] CUSTOMER role
* [ ] ADMIN role

### Phase 4 — Pitch Management

* [ ] Create pitch
* [ ] Edit pitch
* [ ] Delete/deactivate pitch
* [ ] Rename pitch
* [ ] View pitches

### Phase 5 — Reservation System

* [ ] Date selection
* [ ] Pitch selection
* [ ] Time selection
* [ ] Duration selection
* [ ] Availability calculation
* [ ] Overlap prevention
* [ ] Reservation creation
* [ ] Reservation cancellation
* [ ] Reservation status

### Phase 6 — Working Hours

* [ ] Default 09:00–23:00 schedule
* [ ] Configurable working hours
* [ ] Block entire days
* [ ] Block specific periods
* [ ] Pitch-specific blocking
* [ ] Automatic availability calculation

### Phase 7 — Frontend

* [ ] React setup
* [ ] FootballXtreme design system
* [ ] Landing page
* [ ] Booking page
* [ ] Calendar
* [ ] Pitch selection
* [ ] Time slot selection
* [ ] Reservation form
* [ ] Confirmation screen
* [ ] Responsive design

### Phase 8 — Admin Dashboard

* [ ] Dashboard
* [ ] Reservation calendar
* [ ] Reservation management
* [ ] Pitch management
* [ ] Working hours management
* [ ] Blocked periods
* [ ] Customer overview
* [ ] Statistics

### Phase 9 — Internationalization

* [ ] Bulgarian
* [ ] English
* [ ] Language selector
* [ ] Translation system
* [ ] Date/time localization

### Phase 10 — Production

* [ ] Docker
* [ ] Docker Compose
* [ ] Production configuration
* [ ] Database backups
* [ ] Security review
* [ ] Logging
* [ ] Error monitoring
* [ ] Deployment

---

## 💼 Future Commercial Version

FootballXtreme should be developed with future commercialization in mind.

The initial MVP will support one location, but the architecture should avoid unnecessary assumptions that would prevent future expansion.

Possible future features:

* Multiple football facilities
* Multiple locations
* Facility accounts
* Subscription plans
* Online payments
* Email notifications
* SMS notifications
* QR reservation confirmation
* Customer accounts
* Promo codes
* Advanced analytics
* Custom branding
* White-label version
* Multi-tenant architecture

These features are **not part of the initial MVP**.

---

## 📌 MVP Definition

The MVP will be considered complete when a customer can:

```text
Open website
      ↓
Select date
      ↓
Select pitch
      ↓
Select duration
      ↓
See available times
      ↓
Enter name + phone + email
      ↓
Confirm reservation
      ↓
Receive confirmation
```

And an administrator can:

```text
Login
  ↓
View reservations
  ↓
Manage pitches
  ↓
Manage working hours
  ↓
Block dates/times
  ↓
Manage reservations
```

---

## 🧠 Development Principle

FootballXtreme will be developed incrementally.

We will prioritize:

1. Correct functionality
2. Clean architecture
3. Security
4. Good user experience
5. Modern design
6. Maintainability
7. Future scalability

New features should not be added simply because they are possible.

Every feature should have a clear purpose and should improve the product.

---

## 📈 Versioning

Current version:

**v0.1.0 — Project Initialization**

Future versions will be documented here.

---

## ⚽ FootballXtreme

**Book your pitch. Build your game.**
