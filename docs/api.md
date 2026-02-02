# Mini-Fleet-Monitor Backend API

Base URL: `http://localhost:3000`

## Authentication

All `/api/*` endpoints require a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens are obtained via the login endpoint and expire after 1 hour.

---

## Endpoints

### Health Check

```
GET /health
```

No authentication required.

**Response (200):**

```json
{
  "status": "healthy",
  "timestamp": "2026-02-02T12:34:56.789Z"
}
```

**Response (503):**

```json
{
  "status": "unhealthy",
  "timestamp": "2026-02-02T12:34:56.789Z"
}
```

---

### Login

```
POST /auth/login
```

No authentication required.

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@example.com"
  }
}
```

**Errors:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Email and password are required" }` |
| 401 | `{ "error": "Invalid credentials" }` |
| 500 | `{ "error": "Internal server error" }` |

---

### Get All Robots

```
GET /api/robots
```

Returns all robots with their current positions. Results are cached in Redis.

**Response (200):**

```json
[
  {
    "id": 1,
    "name": "Robot-Alpha",
    "status": "idle",
    "lat": 52.520008,
    "lon": 13.404954,
    "updated_at": "2026-02-02T12:34:56.789Z"
  }
]
```

**Errors:**

| Status | Body |
|--------|------|
| 401 | `{ "error": "Invalid authorization header format. Use: Bearer <token>" }` |
| 500 | `{ "error": "Failed to fetch robots" }` |

---

### Get Robot by ID

```
GET /api/robots/:id
```

**URL Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | Robot ID |

**Response (200):**

```json
{
  "id": 1,
  "name": "Robot-Alpha",
  "status": "idle",
  "lat": 52.520008,
  "lon": 13.404954,
  "updated_at": "2026-02-02T12:34:56.789Z"
}
```

**Errors:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid robot ID" }` |
| 401 | `{ "error": "Invalid authorization header format. Use: Bearer <token>" }` |
| 404 | `{ "error": "Robot not found" }` |
| 500 | `{ "error": "Failed to fetch robot" }` |

---

### Move Robot

```
POST /api/robots/:id/move
```

Moves a robot to a new random position within Leipzig city bounds. Invalidates the Redis cache and broadcasts the update to WebSocket clients via Pub/Sub.

**URL Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | Robot ID |

**Response (200):**

```json
{
  "id": 1,
  "name": "Robot-Alpha",
  "status": "moving",
  "lat": 52.521234,
  "lon": 13.405678,
  "updated_at": "2026-02-02T12:35:00.000Z"
}
```

**Movement Bounds (Leipzig):**

- Latitude: 51.280 -- 51.420
- Longitude: 12.280 -- 12.500

**Errors:**

| Status | Body |
|--------|------|
| 400 | `{ "error": "Invalid robot ID" }` |
| 401 | `{ "error": "Invalid authorization header format. Use: Bearer <token>" }` |
| 404 | `{ "error": "Robot not found" }` |
| 500 | `{ "error": "Failed to move robot" }` |

---

## WebSocket

```
ws://localhost:3000/ws
```

Real-time robot position updates via Redis Pub/Sub.

### Authentication

Connect with a JWT token using one of:

- Query parameter: `ws://localhost:3000/ws?token=<jwt_token>`
- Header: `Authorization: Bearer <jwt_token>`

Invalid tokens close the connection with code `1008`.

### Messages

**On connection:**

```json
{
  "type": "connected",
  "messages": "WebSocket connection established",
  "userId": 1,
  "timestamp": "2026-02-02T12:34:56.789Z"
}
```

**Position update (broadcast):**

```json
{
  "type": "position_update",
  "timestamp": "2026-02-02T12:34:56.789Z",
  "robots": [
    {
      "id": 1,
      "name": "Robot-Alpha",
      "status": "moving",
      "lat": 52.521234,
      "lon": 13.405678,
      "updated_at": "2026-02-02T12:35:00.000Z"
    }
  ]
}
```

**Ping/Pong keep-alive:**

Send: `{ "type": "ping" }`

Receive:

```json
{
  "type": "pong",
  "timestamp": "2026-02-02T12:34:56.789Z"
}
```

---

## Data Models

### User

| Field | Type | Notes |
|-------|------|-------|
| id | integer | Primary key |
| email | string | Unique |
| password_hash | string | bcrypt hashed |
| created_at | timestamp | |

### Robot

| Field | Type | Notes |
|-------|------|-------|
| id | integer | Primary key |
| name | string | |
| status | string | `idle` or `moving` |
| lat | decimal(10,8) | Latitude |
| lon | decimal(11,8) | Longitude |
| updated_at | timestamp | |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | -- | JWT signing secret |
| `DATABASE_URL` | Yes | -- | PostgreSQL connection string |
| `NODE_ENV` | No | `development` | Node environment |
| `PORT` | No | `3000` | Server port |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection URL |
| `DB_POOL_MIN` | No | `2` | Min DB pool connections |
| `DB_POOL_MAX` | No | `20` | Max DB pool connections |
