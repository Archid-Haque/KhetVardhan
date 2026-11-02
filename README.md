# KhetVardhan Field Intelligence

KhetVardhan brings field records, observations and operator-led drone inspection planning into one agricultural workspace. The homepage is public; dashboard, fields, observations, satellite and missions require an account. Account identity, password hashes, fields, observation records and mission plans persist in PostgreSQL. Satellite-provider ingestion, AI diagnosis, weather feeds and drone flight control are integration points, not active services yet.

## Stack

- React 19, Vite 8 and Leaflet/Cesium field maps
- Express API with PostgreSQL
- PostgreSQL schema in `server/schema.sql`
- Password hashing with bcrypt and 12-hour, HTTP-only session cookies
- Input validation with Zod, authentication rate limits and Helmet security headers

## Local setup

1. Install Node.js 22+ and PostgreSQL 16+.
2. Create a database and copy `server/.env.example` to `server/.env`.
3. Set `DATABASE_URL` and replace `JWT_SECRET` with at least 32 random characters. Copy root `.env.example` to `.env` only if the API runs on a different local port.
4. Install packages with `npm install`.
5. Create the schema with `npm run db:migrate`.
6. In one terminal run `npm run server`; in another run `npm run dev`. The API process can also serve the built frontend from `dist/` for a single-origin deployment.
7. Visit `http://localhost:5173` and create an account.

Vite proxies `/api` to `http://localhost:3001`. Set `VITE_API_PROXY` for a different local API host. In production, serve the API under the same site origin at `/api`, enable HTTPS, set `NODE_ENV=production`, and configure `CLIENT_ORIGIN` to the frontend origin.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/fields`, `POST /api/fields`, `PATCH /api/fields/:id`, `DELETE /api/fields/:id`
- `GET /api/missions`, `POST /api/missions`, `PATCH /api/missions/:id/status`
- `GET /api/observations`, `POST /api/observations`
- `GET /api/health`

Every field and mission is scoped to its signed-in owner. Drone mission plans are saved as drafts and move through review statuses; they do not arm or control an aircraft. Connect and validate the autopilot, aircraft failsafes, local flight rules and human approval workflow before enabling flight actions.

## Production integrations still required

Configure an imagery provider and processing pipeline before showing live vegetation indices or health alerts. Add source attribution, observation timestamps and confidence/provenance to each derived insight. A production launch also needs a weather provider, monitoring, backups, secret management, email verification, password recovery, audit logging, deployment-appropriate CSRF protection, and a verified drone command gateway before flight actions.
