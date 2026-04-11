# EcoCycle — Server

Express + MongoDB + Redis backend for the EcoCycle gamified waste classification platform.

## Quick Start

```bash
cp .env.example .env
# Fill in MONGO_URI, REDIS_URL, JWT_SECRET, GEMINI_API_KEY (and optional GEMINI_MODEL)

npm install
npm run seed   # optional — demo users (see ../DEMO_ACCOUNTS.md)
npm run dev
```

## API Reference

### Auth
| Method | Path | Body | Auth |
|--------|------|------|------|
| POST | /api/auth/register | `{ username, email, password }` | — |
| POST | /api/auth/login | `{ email, password }` | — |
| GET | /api/auth/me | — | Bearer |

### Submissions
| Method | Path | Notes |
|--------|------|-------|
| POST | /api/submissions | multipart/form-data: `image` file. Header: `Idempotency-Key` |
| GET | /api/submissions | Own submissions list |
| GET | /api/submissions/:id | Submission detail |
| POST | /api/submissions/:id/redeem | Redeem points |

### Disputes (Moderator+)
| Method | Path | Notes |
|--------|------|-------|
| GET | /api/disputes/queue | Paginated IN_DISPUTE queue |
| POST | /api/disputes/:id/resolve | `{ category, outcome }` |

### Social
| Method | Path |
|--------|------|
| POST | /api/social/follow/:userId |
| DELETE | /api/social/follow/:userId |
| GET | /api/social/feed |
| GET | /api/social/profile/:username |
| PATCH | /api/social/privacy |
| GET | /api/social/followers |
| GET | /api/social/following |

### Leaderboard
| Method | Path |
|--------|------|
| GET | /api/leaderboard?limit=20 |

### Admin (Administrator only)
| Method | Path |
|--------|------|
| GET | /api/admin/audit |
| PATCH | /api/admin/users/:id/role |
| GET | /api/admin/config |
| PATCH | /api/admin/config |
| GET | /api/admin/users |
| GET | /api/admin/stats |
| GET | /api/health |

## Socket.IO Events

Connect to `http://localhost:5000`.

| Emit (client → server) | Description |
|------------------------|-------------|
| `subscribe:leaderboard` | Join leaderboard room |
| `subscribe:feed` (userId) | Join personal feed room |
| `unsubscribe:leaderboard` | Leave leaderboard room |
| `unsubscribe:feed` (userId) | Leave feed room |

| Listen (server → client) | Description |
|--------------------------|-------------|
| `leaderboard:update` | Top 20 users array |
| `feed:new` | New submission from followed user |

## Classifiers

Set `CLASSIFIER=gemini` (default), `yolo`, or `mock` in `.env`.

- **gemini** — Uses `@google/generative-ai` with model `GEMINI_MODEL` (default `gemini-2.0-flash`). Requires `GEMINI_API_KEY`.
- **yolo** — Calls the Python service in [`../yolo-garbage-service`](../yolo-garbage-service/README.md) at `YOLO_API_URL` (e.g. `http://localhost:8000/predict`).
- **mock** — Deterministic fake results for local dev (no API key needed).

## Roles

`citizen` → `moderator` → `administrator` (hierarchical).  
Assign via `PATCH /api/admin/users/:id/role` (admin only).

## State Machine

```
PENDING → CLASSIFIED → AWAITING_REWARD → REWARDED → REDEEMED
PENDING → IN_DISPUTE → RESOLVED_AUTO   → AWAITING_REWARD
                     → RESOLVED_MANUAL → AWAITING_REWARD
PENDING → FLAGGED (fraud, no reward)
```
