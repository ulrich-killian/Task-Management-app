                                     Task Management API

A robust backend service for managing personal and assigned tasks, simulating productivity tools like Todoist or Trello. Built with Node.js, Express, and PostgreSQL, this API features strict JWT-based authorization and complex status workflows.

                                     Tech Stack


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

