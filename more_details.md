Now I have the complete picture. Here's the full walkthrough:

---

# Emergency Response Platform — Complete Technical Guide

## What This Is

An AI-powered backend that connects people needing emergency resources (blood, transport, medicines, food, shelter) with nearby registered volunteers. It works through both a **React Native mobile app** and **SMS** — the key differentiator being that someone with no internet can text their emergency and still get matched.

---

## Project Structure

```
app/
├── main.py                          # FastAPI app, CORS, rate limiting, lifespan
├── core/
│   ├── config.py                    # All env vars (DeepInfra, SMS Gate, MongoDB, JWT, matching)
│   ├── database.py                  # Motor async MongoDB + 2dsphere + compound indexes
│   ├── security.py                  # JWT create/verify (HS256)
│   └── middleware.py                # Rate limiting (60 req/min per IP)
├── models/
│   └── models.py                    # 7 enums + 6 DB models (incl RegistrationSource)
├── schemas/
│   └── schemas.py                   # All request/response DTOs (16 schemas)
├── repositories/
│   └── repositories.py              # 5 repo classes (User, Request, Notification, OTP, SMSSession)
├── services/
│   ├── auth_service.py              # OTP send/verify + JWT
│   ├── ai_parser.py                 # DeepInfra LLM → structured JSON
│   ├── geocoder.py                  # Nominatim geocode + reverse geocode
│   ├── matching.py                  # MongoDB $near geospatial + haversine
│   ├── sms_service.py               # SMS Gate API (send OTP/notifications)
│   ├── notification_service.py     # Dispatch SMS + distance to volunteers
│   ├── distance.py                  # Haversine distance + volunteer location updates
│   ├── scheduler.py                 # Background radius expansion (5→10→15→20 km)
│   └── ws_manager.py               # WebSocket connection manager (NEW)
├── api/
│   ├── deps.py                     # JWT auth dependency injection
│   └── v1/
│       ├── router.py                # Aggregated v1 router + WS router
│       ├── auth.py                  # /auth/* (send-otp, verify, register/app, register/sms, me)
│       ├── requests.py              # CRUD + accept + cancel emergency requests
│       ├── volunteers.py            # Register + profile + live location
│       ├── sms.py                   # Webhook + YES/NO + registration flow
│       ├── tracking.py              # Location updates + distance queries
│       ├── notifications.py         # List notifications for volunteer
│       └── websocket.py             # WS /ws/volunteer (NEW)
└── utils/
    └── geo.py                       # Haversine distance utility
```

---

## The MongoDB Collections (6 total)

### `users`
```json
{
  "_id": "ObjectId",
  "name": "Rajesh Kumar",
  "phone": "+919876543210",          // unique, used as auth identifier
  "resources": ["blood", "transport"],
  "blood_group": "B-",
  "location": { "type": "Point", "coordinates": [77.4126, 23.2599] },
  "location_name": "AIIMS Bhopal",
  "is_volunteer": true,
  "registration_source": "app",      // NEW: "app" or "sms"
  "created_at": "...",
  "updated_at": "..."
}
```
**Indexes**: `phone` (unique), `location` (2dsphere), `resources`, `registration_source`

### `requests`
```json
{
  "_id": "ObjectId",
  "requester_id": "ObjectId or null",  // null for SMS users
  "requester_phone": "+919876543210",
  "source": "app",                       // "app" or "sms"
  "resource": "blood",
  "blood_group": "B-",
  "urgency": "critical",
  "location_name": "AIIMS Bhopal",
  "location": { "type": "Point", "coordinates": [77.4126, 23.2599] },
  "raw_message": null,
  "status": "open",                      // open→matched→assigned→completed|cancelled
  "assigned_volunteer": null,
  "current_radius_km": 5.0,
  "created_at": "...",
  "updated_at": "..."
}
```
**Indexes**: `location` (2dsphere), `status+resource` (compound), `requester_phone`, `created_at`

### `notifications`, `otps`, `sms_sessions`
Same as before. `notifications` tracks SMS sent to volunteers. `otps` stores hashed OTPs with 5-min TTL. `sms_sessions` tracks multi-step SMS registration conversations.

---

## Complete API Reference

All REST endpoints are prefixed with `/api/v1`. WebSocket is at root `/ws/volunteer`.

### Authentication (OTP-based, merged with registration)

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| `POST` | `/api/v1/auth/register/app` | No | **Start app registration** — sends OTP |
| `POST` | `/api/v1/auth/register/app/verify` | No | **Verify OTP + complete registration** |
| `POST` | `/api/v1/auth/register/sms` | No | **Direct SMS registration** — no OTP needed |
| `POST` | `/api/v1/auth/send-otp` | No | Send OTP to existing user (login-only) |
| `POST` | `/api/v1/auth/verify-otp` | No | Verify OTP, get JWT (login-only) |
| `GET` | `/api/v1/auth/me` | Yes | Get current user profile |

### Registration Flows (Detailed)

**App Registration** (2 calls instead of 3+):

```
Step 1: POST /api/v1/auth/register/app
{
  "phone": "+919876543210",
  "name": "Rajesh",
  "resources": ["blood", "transport"],
  "blood_group": "B-",
  "location_name": "AIIMS Bhopal"
  // latitude/longitude also accepted
}
→ Response: { "message": "OTP sent to your phone...", "phone": "+919876543210", "requires_verification": true }
→ Backend: Creates user record, stores pending data, sends OTP via SMS

Step 2: POST /api/v1/auth/register/app/verify
{
  "phone": "+919876543210",
  "otp": "123456"
  // Can also override name, resources, blood_group, location here
}
→ Response: { "access_token": "eyJ...", "token_type": "bearer", "user": { ... } }
→ Backend: Verifies OTP, applies pending data, returns JWT
```

**SMS Direct Registration** (for admin/bulk):

```
POST /api/v1/auth/register/sms
{
  "phone": "+919876543210",
  "name": "Rajesh",
  "resources": ["blood", "transport"],
  "blood_group": "B-",
  "location_name": "AIIMS Bhopal"
}
→ Response: { "access_token": "eyJ...", "token_type": "bearer", "user": { "registration_source": "sms", ... } }
→ No OTP needed — SMS is the auth channel itself
```

**Login-only** (existing user, already registered):

```
POST /api/v1/auth/send-otp  { "phone": "+919876543210" }
POST /api/v1/auth/verify-otp { "phone": "+919876543210", "otp": "123456" }
→ Returns JWT + user profile
```

### Emergency Requests

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| `POST` | `/requests/` | Yes | Create emergency request |
| `GET` | `/requests/` | Yes | List your requests |
| `GET` | `/requests/{id}` | Yes | Get request details |
| `POST` | `/requests/{id}/accept` | Yes | Volunteer accepts request |
| `PATCH` | `/requests/{id}/status?status=completed` | Yes | Update request status |

### Volunteers

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| `POST` | `/volunteers/register` | Yes | Register as volunteer (upgrade existing user) |
| `GET` | `/volunteers/me` | Yes | Get volunteer profile |
| `PATCH` | `/volunteers/me` | Yes | Update volunteer profile |
| `PUT` | `/volunteers/me/location?lat=X&lng=Y` | Yes | Update live location |

### SMS Webhook

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| `POST` | `/sms/incoming` | No | Webhook for incoming SMS from SMS Gate |

**SMS Commands:**
| SMS Text | What happens |
|----------|---------------|
| `REGISTER` | Starts volunteer registration conversation |
| `Need B- blood urgently near AIIMS` | Creates emergency request via AI parsing |
| `YES 665f...` | Volunteer accepts request |
| `NO 665f...` | Volunteer declines request |

### Distance Tracking

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| `POST` | `/tracking/location` | Yes | Update volunteer location |
| `GET` | `/tracking/{request_id}/distance` | Yes | Get current distance to request |

### Notifications

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| `GET` | `/notifications/` | Yes | List notifications for current user |

### WebSocket (NEW)

| Protocol | Endpoint | Auth? | Description |
|----------|----------|-------|-------------|
| `WS` | `/ws/volunteer?token=<jwt>` | JWT in query param | Real-time push for volunteers |

---

## WebSocket Real-Time Updates

This is the new real-time layer. Volunteers connect to the WebSocket and receive new emergency requests instantly, without polling.

### Connection

```typescript
const token = await SecureStore.getItemAsync('access_token');
const ws = new WebSocket(`wss://your-api.com/ws/volunteer?token=${token}`);

ws.onopen = () => console.log('Connected!');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data.type can be:
  //   "connected"     — connection established
  //   "new_request"   — new emergency request matched to this volunteer
  //   "request_update" — status change on a request
  //   "pong"          — heartbeat response
  //   "error"         — invalid message
};
```

### Messages the server sends to volunteers:

**New request pushed to matched volunteers:**
```json
{
  "type": "new_request",
  "data": {
    "_id": "665f...",
    "requester_phone": "+919876543210",
    "source": "app",
    "resource": "blood",
    "blood_group": "B-",
    "urgency": "critical",
    "location_name": "AIIMS Bhopal",
    "location": { "type": "Point", "coordinates": [77.4126, 23.2599] },
    "status": "matched",
    "current_radius_km": 5.0,
    "created_at": "..."
  }
}
```

**Request status update (assigned, completed, etc.):**
```json
{
  "type": "request_update",
  "request_id": "665f...",
  "status": "assigned"
}
```

**Connection confirmation:**
```json
{ "type": "connected", "phone": "+919876543210", "message": "WebSocket connection established" }
```

**The client can send:**
```json
{ "type": "ping" }  → server responds with { "type": "pong" }
```

### When WebSocket pushes trigger:

1. **`new_request`** — Sent to matched volunteers when:
   - A request is created (app or SMS) and initial 5km matching finds volunteers
   - Radius expansion finds new volunteers (scheduler runs every 5 min)

2. **`request_update`** — Sent when:
   - A volunteer accepts a request (status → `assigned`)

---

## DeepInfra AI Parser (Replaced OpenRouter)

The AI parser is now powered by **DeepInfra** with an OpenAI-compatible API. Config:

```env
DEEPINFRA_API_KEY=your-key-here
DEEPINFRA_MODEL=meta-llama/Meta-Llama-3.1-8B-Instruct
DEEPINFRA_BASE_URL=https://api.deepinfra.com/v1/openai
```

You can change `DEEPINFRA_MODEL` to any model DeepInfra supports — it's fully configurable. The API endpoint (`/v1/openai/chat/completions`) is OpenAI-compatible, so any provider that uses the OpenAI format will work.

The system prompt is also configurable via `AI_SYSTEM_PROMPT` in `.env`.

---

## `registration_source` Field

Every user now has a `registration_source` field:

| Value | How they registered |
|-------|-------------------|
| `"app"` | Registered through the mobile app (`/register/app` or `/send-otp` + `/verify-otp`) |
| `"sms"` | Registered through SMS conversation or direct `/register/sms` endpoint |

This is stored in the `users` collection and returned in every `UserResponse`:

```json
{
  "_id": "665f...",
  "name": "Rajesh",
  "phone": "+919876543210",
  "resources": ["blood", "transport"],
  "blood_group": "B-",
  "location": { "type": "Point", "coordinates": [77.4126, 23.2599] },
  "location_name": "AIIMS Bhopal",
  "is_volunteer": true,
  "registration_source": "app",
  "created_at": "...",
  "updated_at": "..."
}
```

---

## How to Set Up & Run

```bash
# 1. Create .env from example
cp .env.example .env
# Edit .env with your MongoDB URL, DeepInfra key, SMS Gate credentials

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the server
uvicorn app.main:app --reload --port 8000

# 4. Open interactive docs
# http://localhost:8000/docs
```

### Required Environment Variables

| Variable | Where to get it |
|----------|-----------------|
| `MONGODB_URL` | MongoDB Atlas connection string |
| `DATABASE_NAME` | Database name (default: `emergency_response`) |
| `DEEPINFRA_API_KEY` | https://deepinfra.com/ — sign up, add credits, get key |
| `DEEPINFRA_MODEL` | Any model from https://deepinfra.com/models (default: `meta-llama/Meta-Llama-3.1-8B-Instruct`) |
| `SMS_GATE_USERNAME` | SMS Gate Android app → Home tab |
| `SMS_GATE_PASSWORD` | SMS Gate Android app → Home tab |
| `SMS_GATE_SIGNING_KEY` | SMS Gate Android app → Settings → Webhooks → Signing Key |
| `SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |

### SMS Gate Webhook Setup

```bash
curl -X POST -u "username:password" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-backend-url/api/v1/sms/incoming", "event": "sms:received"}' \
  https://api.sms-gate.app/3rdparty/v1/webhooks
```

### MongoDB

Auto-creates the `emergency_response` database and all collections + indexes on first startup. No manual setup needed.

---

## Frontend Integration Notes (React Native)

### Auth Flow (2-step registration)

```
Step 1: User enters phone + profile data → POST /register/app → OTP sent
Step 2: User enters OTP → POST /register/app/verify → JWT + full profile returned
```

### WebSocket for Real-Time

```typescript
import { WebSocket } from 'react-native';

function connectWebSocket(token: string) {
  const ws = new WebSocket(`wss://your-api.com/ws/volunteer?token=${token}`);

  ws.onopen = () => {
    // Send periodic pings to keep connection alive
    setInterval(() => ws.send(JSON.stringify({ type: 'ping' })), 30000);
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
      case 'new_request':
        // Show notification / add to request feed
        showEmergencyNotification(data.data);
        break;
      case 'request_update':
        updateRequestStatus(data.request_id, data.status);
        break;
      case 'connected':
        console.log('WS connected:', data.phone);
        break;
    }
  };

  ws.onerror = (e) => console.error('WS error:', e);
  ws.onclose = () => {
    // Reconnect after 5 seconds
    setTimeout(() => connectWebSocket(token), 5000);
  };
}
```

### Key Map Note

MongoDB stores coordinates as `[longitude, latitude]` per GeoJSON spec.
Leaflet/React Native Maps uses `[latitude, longitude]`.
**Always swap the order when going between API and map!**

```typescript
// API → Map
const mapCoords = [apiCoords[1], apiCoords[0]]; // [lat, lng]

// Map → API
const apiCoords = [mapCoords[1], mapCoords[0]]; // [lng, lat]
```

### Request Lifecycle (for frontend state management)

```
REQUEST CREATED (source: "app" or "sms")
       │
       ▼
    status: "open"
       │
       ▼ (matching engine finds volunteers within 5km)
    status: "matched"  ← volunteers get SMS + WebSocket push
       │
       ▼ (volunteer accepts via app or SMS "YES <id>")
    status: "assigned"  ← requester gets SMS with volunteer contact
       │
       ▼ (requester marks complete or cancels)
    status: "completed" or "cancelled"
```

### Polling vs WebSocket

- **Preferred**: WebSocket for real-time updates (new requests, status changes)
- **Fallback**: Poll `GET /api/v1/notifications/` every 30 seconds
- **Distance tracking**: Poll `GET /api/v1/tracking/{request_id}/distance` every 5-10 seconds after volunteer accepts