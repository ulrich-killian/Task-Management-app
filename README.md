                                     Task Management API

A robust backend service for managing personal and assigned tasks, simulating productivity tools like Todoist or Trello. Built with Node.js, Express, and PostgreSQL, this API features strict JWT-based authorization and complex status workflows.

 
##  Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL (with `pg` driver) |
| Auth | JWT (JSON Web Tokens) + Bcrypt.js |
| Security | Express-Rate-Limit |

---


| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/register` | Public | Register a new user. Body: `{ username, email, password }`. Returns 201 with JWT. |
| `POST` | `/api/login` | Public | Authenticate user. Body: `{ email, password }`. Returns JWT or 401. |

### Events

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/events` | Public | List events. Supports date filtering (`?start=&end=`) and pagination (`?limit=10&offset=0`). |
| `GET` | `/api/events/:id` | Public | Fetch a single event with real-time booking summary. |
| `POST` | `/api/events` |  Required | Create event. Body: `{ title, description, date, total_seats }`. Date must be in the future. |
| `PUT` | `/api/events/:id` |  Owner only | Update event. Cannot reduce seat capacity below current bookings. |
| `DELETE` | `/api/events/:id` |  Owner only | Delete event. Blocked if active bookings exist. |

### Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/events/:id/book` |  Required | Reserve seats. Body: `{ seats }`. Atomic transaction; returns 409 if seats unavailable. |
| `GET` | `/api/bookings` |  Required | List the authenticated user's bookings. |
| `DELETE` | `/api/bookings/:id` |  Owner only | Cancel booking and restore seats to the event. |




## 🏗 Architecture & Design

- **Service Layer Pattern** — Business logic is decoupled from routes into dedicated services, keeping complex rules (especially around seat management) isolated and testable.
- **Concurrency Control** — PostgreSQL Row-Level Locking (`FOR UPDATE`) is applied during booking and update flows to prevent race conditions and overbooking.
- **Atomic Operations** — Seat allocations and cancellations are wrapped in SQL transactions. If any step fails, the system rolls back to maintain a consistent state.
- **Rate Limiting** — API endpoints are protected against brute-force and DoS attacks.
- **Input Validation** — Strict enforcement of future-event dating, email format, password strength, and positive seat counts.

---

## ⚙️ Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL v14+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ulrich-killian/Task-Management-app
cd event-booking-api

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgres://user:password@localhost:5432/eventbooking
JWT_SECRET=your_strong_secret_key_here
JWT_EXPIRY=7d
PORT=3000
NODE_ENV=development
```

### Database Setup

```bash
# Run migrations
npm run migrate
```

### Running the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:3000`.

> All protected routes require the header: `Authorization: Bearer <token>`

