# Sports Facility Booking System API

A RESTful backend API for managing sports facilities and bookings. It supports user authentication, role-based access control, facility administration, and member bookings.

## Features

### Authentication and Users

- Register and log in with email and password
- Password hashing with bcryptjs
- JWT bearer-token authentication via the Authorization header only; login still sets an HTTP-only cookie, which is not used for authentication
- Roles: `admin` and `member`
- Protected routes and role-based authorization

### Sports Facilities

- Public facility listing and detail endpoints
- Admin-only create, update, and delete operations
- Facility data includes name, sport type, location, capacity, hourly rate, and active status

### Bookings

- Members can create bookings for facilities
- Members can view, update, and delete their own bookings
- Admins can view, update, and delete any booking
- Bookings include facility, date, start time, duration, and user references

### Booking Rules

- Booking dates cannot be in the past
- A booking can last at most 2 hours
- A member cannot create overlapping bookings
- A facility cannot be booked by multiple users during the same time period

### Security and Documentation

- Helmet security headers
- CORS support
- Request rate limiting
- HTTP parameter pollution protection
- Swagger/OpenAPI documentation at `/api-docs`
- Health check at `/health`

## Technology Stack

- Node.js and Express.js
- MongoDB with Mongoose ODM
- JWT and bcryptjs
- Swagger UI and OpenAPI
- Nodemon for development

## Project Structure

```text
config/          Environment and database configuration
controllers/     Request handlers
middleware/      Authentication and authorization middleware
models/          Mongoose schemas
routes/          Express API routes
server.js        Application entry point
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set `MONGO_URI` and a strong `JWT_SECRET` in `config/config.env`.

3. Start the development server:

   ```bash
   npm run dev
   ```

The API runs on `http://localhost:5000` by default.

## API Routes

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/logout`
- `GET /api/v1/facilities`
- `GET /api/v1/facilities/:id`
- `POST /api/v1/facilities` (admin)
- `PUT /api/v1/facilities/:id` (admin)
- `DELETE /api/v1/facilities/:id` (admin)
- `GET /api/v1/bookings` (member or admin)
- `GET /api/v1/bookings/:id` (member or admin)
- `POST /api/v1/bookings` (member)
- `PUT /api/v1/bookings/:id` (member owner or admin)
- `DELETE /api/v1/bookings/:id` (member owner or admin)

## Frontend (Next.js)

The web app lives in `frontend/` (Next.js 16, React 19, Tailwind 4).

```bash
# 1. Backend (port 5000) – copy config/config.env.example to config/config.env and fill MONGO_URI, JWT_SECRET
npm install
npm run dev

# 2. Frontend (port 3000), in another terminal
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The frontend calls `http://localhost:5000/api/v1` by default; set `NEXT_PUBLIC_API_URL` to change it.

### Booking extras used by the frontend

- `GET /api/v1/facilities/:id/availability?date=YYYY-MM-DD` (public) returns the booked time ranges of a facility on a date, without member details, so the booking form can show free slots.
- "Today" and "now" follow Thailand time (`Asia/Bangkok`, override with `TZ_NAME`). A booking for today must start after the current time.
- Facilities are shown as open 06:00–24:00 in 30-minute steps.

### Accounts

- Public registration (`POST /api/v1/auth/register` and the Register page) always creates a **member**. Any `role` sent in the body is ignored.
- Create an admin from the command line (uses `MONGO_URI` in `config/config.env`; promotes the user if the email already exists):

```bash
npm run create-admin -- "Admin Name" admin@example.com 0811111111 yourpassword
```

### Secrets

`config/config.env` holds `MONGO_URI` and `JWT_SECRET` and is git-ignored. Copy `config/config.env.example` to start. Never `git add -f` it.

## Tests

Tests use Node's built-in test runner. API tests start a throwaway in-memory MongoDB, so they never touch the database in `config/config.env` (the first run downloads a MongoDB binary).

```bash
npm test                # backend: booking-rule unit tests + API tests
cd frontend && npm test # frontend: booking form date/time helpers
```

- `tests/bookingRules.test.js` – booking rules at a fixed time (past dates, 2-hour limit, same-day end, overlap)
- `tests/api.test.js` – auth, roles, facilities, booking 400/409 responses, ownership, availability
- `frontend/tests/time.test.ts` – client-side validation and formatting used by the booking form

## Deploying

- Backend env: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `JWT_COOKIE_EXPIRE`, `FRONTEND_URL` (the deployed frontend URL, used for CORS). Optional `TRUST_PROXY` (proxy hops, default 1 in production) so rate limiting counts each visitor separately behind the host's proxy.
- Frontend env: `NEXT_PUBLIC_API_URL=https://<backend-host>/api/v1`. Set it **before** `next build`; it is baked into the bundle.
- MongoDB Atlas: allow the backend host in Network Access.
- Create the first admin with `npm run create-admin` against the production `MONGO_URI`.
