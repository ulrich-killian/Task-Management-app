#  Task Management API

> A secure backend for managing personal and assigned tasks, simulating productivity tools like Todoist or Trello.  
> Built with Node.js, Express, and PostgreSQL with strict JWT-based authorization and status workflows.

---

##  Tech Stack

| Layer | Technology |
| :--- | :--- |
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL (Supabase) |
| Auth | JWT + Bcrypt.js |
| Security | Helmet, Express-Rate-Limit, CORS |
| Validation | express-validator |

---

##  Architecture & Design

- **Service Layer Pattern** — Business logic separated from route handlers into dedicated services.
- **JWT Authentication** — Stateless auth via `Authorization: Bearer <token>` header.
- **Ownership Checks** — Users can only access tasks they created or were assigned to.
- **Status Transitions** — Enforced workflow: `todo → in-progress → done`. Cannot reverse from `done`.
- **Atomic Transactions** — Task creation with assignments uses SQL transactions to prevent partial writes.
- **Rate Limiting** — Auth endpoints: 5 requests per 15 min. Global: 100 requests per 15 min.
- **Pagination** — All list endpoints support `?limit=10&offset=0`.

---

## ⚙️ Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL (or a free [Supabase](https://supabase.com) account)

### Installation

```bash
git clone https://github.com/ulrich-killian/Task-Management-app
cd Task-Management-app
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=example
JWT_SECRET=your_strong_secret_here
JWT_EXPIRES_IN=24h
PORT=3000
```

### Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

Server starts at `http://localhost:3000`

---

##  API Endpoints

Base URL: `https://task-management-app-6s3f.onrender.com/`

>  Protected routes require: `Authorization: Bearer <token>`

---

###  Authentication

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/user/register` | Public | Register a new user. Returns `201` with JWT. |
| `POST` | `/api/user/login` | Public | Authenticate user. Returns JWT or `401`. |

#### Register
```
POST /api/user/register
```
```json
{
  "username": "ceo_ulrich",
  "email": "ulrich@citycouncil.com",
  "password": "securepass123"
}
```

**Success `201`:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "ceo_ulrich",
    "email": "ulrich@citycouncil.com",
    "created_at": "2026-05-05T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```
POST /api/user/login
```
```json
{
  "email": "ulrich@citycouncil.com",
  "password": "securepass123"
}
```

**Success `200`:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "ceo_ulrich",
    "email": "ulrich@citycouncil.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

###  Tasks

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | 🔒 Required | List your tasks. Supports filtering and pagination. |
| `GET` | `/api/tasks/:id` | 🔒 Required | Fetch a single task by ID. |
| `POST` | `/api/tasks` | 🔒 Required | Create a new task with optional assignment. |
| `PUT` | `/api/tasks/:id` | 🔒 Owner/Assignee | Update task details or status. |
| `PATCH` | `/api/tasks/:id/complete` | 🔒 Owner/Assignee | Mark task as done. |
| `DELETE` | `/api/tasks/:id` | 🔒 Creator only | Delete a task permanently. |

---

#### Get all tasks
```
GET /api/tasks
GET /api/tasks?status=todo
GET /api/tasks?status=in-progress
GET /api/tasks?due_before=2026-08-01
GET /api/tasks?limit=5&offset=0
```

**Success `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Control Downtown District",
      "description": "Manage all downtown operations",
      "due_date": "2026-08-01T00:00:00.000Z",
      "status": "todo",
      "created_by": 1,
      "created_by_username": "ceo_ulrich",
      "assigned_to": 2,
      "assigned_to_username": "mayor_john",
      "is_overdue": false,
      "created_at": "2026-05-05T10:00:00.000Z"
    }
  ],
  "count": 1,
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

---

#### Get task by ID
```
GET /api/tasks/1
```

**Success `200`:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Control Downtown District",
    "status": "todo",
    "assigned_to_username": "mayor_john",
    "is_overdue": false
  }
}
```

**Errors:**
| Status | Reason |
| :--- | :--- |
| `404` | Task not found or access denied |

---

#### Create a task
```
POST /api/tasks
```
```json
{
  "title": "Control Downtown District",
  "description": "Manage all downtown security, traffic, and public services",
  "due_date": "2026-08-01",
  "assigned_to": 2
}
```

> `assigned_to` is optional. Must be a valid user ID.  
> `due_date` must be a future date.  
> You can assign a task to yourself using your own user ID.  
> Default status is always `todo`.

**Success `201`:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": 1,
    "title": "Control Downtown District",
    "status": "todo",
    "created_by": 1,
    "created_at": "2026-05-05T10:00:00.000Z"
  }
}
```

**Errors:**
| Status | Reason |
| :--- | :--- |
| `400` | Missing title, past due_date, or invalid assigned_to |
| `401` | Not authenticated |

---

#### Update a task
```
PUT /api/tasks/1
```
```json
{
  "title": "Control Downtown & Midtown Districts",
  "description": "Expanded to include midtown",
  "due_date": "2026-09-01",
  "status": "in-progress",
  "assigned_to": 3
}
```

> All fields are optional — only include what you want to change.  
> Only the creator can reassign a task.

**Status transition rules:**
| Current | Can change to |
| :--- | :--- |
| `todo` | `in-progress` |
| `in-progress` | `done`, `todo` |
| `done` |  Cannot change |

**Success `200`:**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "id": 1,
    "title": "Control Downtown & Midtown Districts",
    "status": "in-progress",
    "updated_at": "2026-05-05T11:00:00.000Z"
  }
}
```

**Errors:**
| Status | Reason |
| :--- | :--- |
| `404` | Task not found or access denied |
| `409` | Invalid status transition |

---

#### Mark task as done
```
PATCH /api/tasks/1/complete
```

No body required.

**Success `200`:**
```json
{
  "success": true,
  "message": "Task marked as done",
  "data": {
    "id": 1,
    "status": "done",
    "completed_at": "2026-05-05T12:00:00.000Z"
  }
}
```

**Errors:**
| Status | Reason |
| :--- | :--- |
| `404` | Task not found or access denied |
| `409` | Task is already completed |

---

#### Delete a task
```
DELETE /api/tasks/1
```

Only the **creator** can delete a task.

**Success `200`:**
```json
{
  "success": true,
  "message": "Task deleted successfully",
  "deletedTaskId": 1
}
```

**Errors:**
| Status | Reason |
| :--- | :--- |
| `403` | You are not the creator of this task |
| `404` | Task not found |

---

##  Real World Test Flow

A full end-to-end scenario using a CEO assigning tasks to mayors:

### Step 1 — Register the CEO
```
POST /api/user/register
{ "username": "ceo_ulrich", "email": "ulrich@citycouncil.com", "password": "ceopass123" }
```
Save the returned `token` and your user `id`.

### Step 2 — Register Mayor John
```
POST /api/user/register
{ "username": "mayor_john", "email": "john@citycouncil.com", "password": "mayorpass123" }
```
Save the returned user `id` (e.g. `2`).

### Step 3 — CEO logs in
```
POST /api/user/login
{ "email": "ulrich@citycouncil.com", "password": "ceopass123" }
```

### Step 4 — CEO assigns a task to Mayor John
```
POST /api/tasks
Authorization: Bearer <ceo_token>

{
  "title": "Control Downtown District",
  "description": "Manage all downtown operations",
  "due_date": "2026-08-01",
  "assigned_to": 2
}
```

### Step 5 — Mayor John logs in and views his tasks
```
POST /api/user/login
{ "email": "john@citycouncil.com", "password": "mayorpass123" }

GET /api/tasks
Authorization: Bearer <mayor_john_token>
```

### Step 6 — Mayor John starts working
```
PUT /api/tasks/1
Authorization: Bearer <mayor_john_token>
{ "status": "in-progress" }
```

### Step 7 — Mayor John completes the task
```
PATCH /api/tasks/1/complete
Authorization: Bearer <mayor_john_token>
```

### Step 8 — CEO filters completed tasks
```
GET /api/tasks?status=done
Authorization: Bearer <ceo_token>
```

---

##  Status Workflow

```
[todo] ──→ [in-progress] ──→ [done]
              ↑________|
         (can go back to todo)

[done] →  no further changes allowed
```

---

##  Database Schema

Three relational tables:

- **users** — stores registered users with hashed passwords
- **tasks** — stores tasks with status, due dates, and creator reference
- **assignments** — links tasks to assigned users (many-to-many ready)

---

##  Roadmap

- [ ] Email notifications when a task is assigned
- [ ] Task comments and activity log
- [ ] Team/group support
- [ ] Swagger API documentation [http]( hhttps://task-management-app-6s3f.onrender.com/api-docs)
- [ ] Admin dashboard
