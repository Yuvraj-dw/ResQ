Now I have a complete picture. Here's the full walkthrough:

---

# Emergency Response Platform - Complete Guide

## What This Is

A backend platform that connects people needing emergency resources (blood, transport, medicines, food, shelter) with nearby volunteers. Works through both a **React Native mobile app** AND **SMS** - the key differentiator being that someone with no internet can text their emergency and get matched with volunteers.

---

## Architecture Overview

```
   React Native App          SMS (Android Gateway)
         │                          │
         │  REST API                │  Webhook POST
         ▼                          ▼
  ┌─────────────────────────────────────────────┐
  │              FastAPI Backend                 │
  │                                             │
  │  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
  │  │Auth (OTP)│  │ Requests  │  │Volunteers │ │
  │  │  + JWT   │  │   CRUD    │  │ Register  │ │
  │  └──────────┘  └──────────┘  └───────────┘ │
  │                                             │
  │  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
  │  │SMS Webhook│ │ Tracking  │  │Notificatn │ │
  │  │ Incoming  │  │ Distance  │  │  Engine   │ │
  │  └──────────┘  └──────────┘  └───────────┘ │
  │         │                                   │
  │         ▼                                   │
  │  ┌──────────┐                               │
  │  │AI Parser  │ ← OpenRouter LLM             │
  │  │Structured │   (configurable model)       │
  │  │JSON out   │                               │
  │  └──────────┘                               │
  │         │                                   │
  │         ▼                                   │
  │  ┌──────────┐                               │
  │  │Geocoder   │ ← Nominatim                 │
  │  │Text→Coords │   (OpenStreetMap)           │
  │  └──────────┘                               │
  │         │                                   │
  │         ▼                                   │
  │  ┌──────────────────────────────────────┐   │
  │  │        MongoDB Atlas (Motor async)    │   │
  │  │   2dsphere geospatial indexes        │   │
  │  └──────────────────────────────────────┘   │
  │         │                                   │
  │         ▼                                   │
  │  ┌──────────┐                               │
  │  │Matching   │ $near geospatial query      │
  │  │Engine     │ 5→10→15→20 km expansion     │
  │  └──────────┘                               │
  └─────────────────────────────────────────────┘
```

---

## Folder Structure & What Each File Does

```
app/
├── main.py                    # FastAPI app, CORS, MongoDB lifespan, routes
├── core/
│   ├── config.py              # ALL settings from .env (DB, AI, SMS, JWT, matching)
│   ├── database.py            # Motor client, connects/disconnects, creates indexes
│   └── security.py            # JWT token create/verify (HS256)
├── models/
│   └── models.py              # Enums + DB document models (User, Request, etc.)
├── schemas/
│   └── schemas.py             # Pydantic request/response schemas for ALL endpoints
├── repositories/
│   └── repositories.py        # Data access layer - all MongoDB CRUD operations
├── services/
│   ├── auth_service.py        # OTP send/verify + JWT token generation
│   ├── ai_parser.py           # OpenRouter LLM call → structured JSON extraction
│   ├── geocoder.py            # Nominatim geocoding (text→coords) + reverse
│   ├── matching.py            # $near geospatial query + radius expansion
│   ├── sms_service.py         # SMS Gate API: send OTP, notifications, webhook
│   ├── notification_service.py # Dispatch SMS notifications to matched volunteers
│   └── distance.py            # Haversine distance + volunteer location updates
├── api/
│   ├── deps.py                # FastAPI dependencies (get_current_user from JWT)
│   └── v1/
│       ├── router.py          # Aggregates all v1 route prefixes
│       ├── auth.py            # /auth/send-otp, /auth/verify-otp, /auth/me
│       ├── requests.py        # /requests CRUD + accept + status update
│       ├── volunteers.py      # /volunteers register + profile + location
│       ├── sms.py             # /sms/incoming webhook + registration flow
│       ├── tracking.py        # /tracking/location + /tracking/{id}/distance
│       └── notifications.py  # /notifications list for volunteer
└── utils/
    └── geo.py                 # Haversine distance utility
```

---

## The MongoDB Collections

### `users` Collection
Every person in the system - both requesters and volunteers - is a user.

```json
{
  "_id": "ObjectId",
  "name": "Rajesh Kumar",
  "phone": "+919876543210",          // unique, used as auth identifier
  "resources": ["blood", "transport"], // which resources they can provide
  "blood_group": "B-",               // only if blood is in resources
  "location": {
    "type": "Point",
    "coordinates": [77.4126, 23.2599]  // [longitude, latitude]
  },
  "location_name": "AIIMS Bhopal",
  "is_volunteer": true,               // false = requester only
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```
- **`phone`** has a unique index
- **`location`** has a **2dsphere** index (enables `$near` geospatial queries)
- **`resources`** has an index (enables filtering by resource type)

### `requests` Collection
Every emergency request, whether from app or SMS.

```json
{
  "_id": "ObjectId",
  "requester_id": "ObjectId or null",  // null for SMS users
  "requester_phone": "+919876543210",
  "source": "app",                     // "app" or "sms"
  "resource": "blood",                 // blood|transport|medicines|food|shelter
  "blood_group": "B-",                 // null if not blood request
  "urgency": "critical",              // critical|high|medium|low
  "location_name": "AIIMS Bhopal",
  "location": {
    "type": "Point",
    "coordinates": [77.4126, 23.2599]
  },
  "raw_message": "My father urgently needs B- blood near AIIMS Bhopal",
  "status": "open",                   // open→matched→assigned→completed|cancelled
  "assigned_volunteer": null,          // set when volunteer accepts
  "current_radius_km": 5.0,          // tracks matching radius expansion
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

### `notifications` Collection
Tracks SMS notifications sent to volunteers.

### `otps` Collection
Stores OTP hashes for phone-based authentication. 5-minute expiry.

### `sms_sessions` Collection
Tracks multi-step SMS registration conversations (name → resources → blood_group → location).

---

## How Each Flow Works

### Flow 1: App User Authentication (OTP)

```
Frontend                          Backend                        SMS Gate
   │                                │                               │
   │ POST /auth/send-otp            │                               │
   │ {phone: "+919876543210"}       │                               │
   │───────────────────────────────>│                               │
   │                                │ Generate 6-digit OTP          │
   │                                │ Hash & store in MongoDB       │
   │                                │ POST /3rdparty/v1/messages    │
   │                                │ {textMessage: {text: "Your    │
   │                                │  verification code is: 123456"}}│
   │                                │──────────────────────────────>│
   │                                │                               │ → SMS sent to phone
   │ {message: "OTP sent"}         │                               │
   │<───────────────────────────────│                               │
   │                                │                               │
   │ POST /auth/verify-otp          │                               │
   │ {phone: "+919876543210",        │                               │
   │  otp: "123456"}                │                               │
   │───────────────────────────────>│                               │
   │                                │ Verify hash                    │
   │                                │ Check expiry                   │
   │                                │ Create/find user by phone      │
   │                                │ Generate JWT                    │
   │ {access_token, user}           │                               │
   │<───────────────────────────────│                               │
```

**For your friend**: The frontend stores the JWT `access_token` and sends it as `Authorization: Bearer <token>` on all authenticated requests.

### Flow 2: Create Emergency Request (App)

```
Frontend                          Backend
   │                                │
   │ POST /requests                 │
   │ Authorization: Bearer <jwt>   │
   │ {resource: "blood",            │
   │  blood_group: "B-",            │
   │  urgency: "critical",          │
   │  latitude: 23.2599,            │
   │  longitude: 77.4126}           │
   │───────────────────────────────>│
   │                                │ Validate & create request (status: "open")
   │                                │ Background task: find volunteers within 5km
   │                                │   → MongoDB $near geospatial query
   │                                │   → Filter by resource type & blood group
   │                                │   → If found, notify via SMS, set status: "matched"
   │ {request response}             │
   │<───────────────────────────────│
```

**Note**: If `latitude/longitude` aren't provided, the app can send `location_name` instead and the backend geocodes it via Nominatim.

### Flow 3: SMS Emergency Request

```
SMS User                SMS Gate            Backend
   │                        │                   │
   │ "Need B- blood        │                   │
   │  urgently near AIIMS" │                   │
   │──────────────────────>│                   │
   │                        │ POST /sms/incoming
   │                        │ {event: "sms:received",
   │                        │  payload: {sender: "+91...",
   │                        │  message: "Need B- blood..."}}
   │                        │──────────────────>│
   │                        │                   │ 1. AI Parser (OpenRouter):
   │                        │                   │    Input: "Need B- blood urgently near AIIMS"
   │                        │                   │    Output: {resource:"blood", blood_group:"B-",
   │                        │                   │             location_name:"AIIMS", urgency:"critical"}
   │                        │                   │
   │                        │                   │ 2. Validate extracted fields
   │                        │                   │
   │                        │                   │ 3. Geocode "AIIMS" → [77.4126, 23.2599]
   │                        │                   │
   │                        │                   │ 4. Create request in DB (source: "sms")
   │                        │                   │
   │                        │                   │ 5. Match volunteers in 5km radius
   │                        │                   │    → Send SMS to each matched volunteer
   │                        │                   │
   │   "Request received    │                   │ 6. Send confirmation SMS back
   │    for B- blood near   │<──────────────────│
   │    AIIMS..."           │                   │
   │<───────────────────────│                   │
```

### Flow 4: SMS Volunteer Registration

Multi-step conversation stored in `sms_sessions`:

```
User texts "REGISTER"
  → Backend: "Welcome! What is your name?"

User texts "Rajesh"
  → Backend: "Hi Rajesh! What can you help with? Reply: BLOOD, TRANSPORT, MEDICINES, FOOD, SHELTER"

User texts "blood, transport"
  → Backend: "What is your blood group? (A+, A-, B+, B-, AB+, AB-, O+, O-)"

User texts "B-"
  → Backend: "Where are you located? (e.g., 'AIIMS Bhopal')"

User texts "AIIMS Bhopal"
  → Backend geocodes → stores volunteer in DB
  → Backend: "Registration complete! You'll receive emergency alerts nearby."
```

### Flow 5: Volunteer Accepts & Distance Tracking

```
Volunteer App              Backend                          Requester Phone
   │                        │                                     │
   │ POST /requests/{id}/accept                                   │
   │ Authorization: Bearer <jwt>                                  │
   │────────────────────────>│                                     │
   │                        │ 1. Update request status → "assigned"
   │                        │ 2. Mark other notifications expired
   │                        │ 3. Calculate haversine distance
   │                        │ 4. Send SMS to requester:
   │                        │    "Volunteer found! Rajesh (+91...)
   │                        │     is 3.5 km away"
   │                        │────────────────────────────────────>│
   │                        │                                     │
   │ {request_id, status,   │                                     │
   │  volunteer info}        │                                     │
   │<────────────────────────│                                     │
   │                        │                                     │
   │ Periodic location updates:                                      │
   │ POST /tracking/location│                                     │
   │ {latitude, longitude}   │                                     │
   │────────────────────────>│                                     │
   │                        │ Updates volunteer location in DB      │
   │                        │                                     │
   │ GET /tracking/{id}/distance                                   │
   │────────────────────────>│                                     │
   │ {distance_km: 2.1}     │ Returns haversine distance           │
   │<────────────────────────│                                     │
```

---

## Complete API Reference (for your frontend friend)

All endpoints are prefixed with `/api/v1`.

### Authentication

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| `POST` | `/auth/send-otp` | No | Send OTP to phone number |
| `POST` | `/auth/verify-otp` | No | Verify OTP, get JWT token + user data |
| `GET` | `/auth/me` | Yes | Get current user profile |

**Send OTP Request:**
```json
POST /api/v1/auth/send-otp
{ "phone": "+919876543210" }

Response:
{ "message": "OTP sent successfully", "phone": "+919876543210" }
```

**Verify OTP Request:**
```json
POST /api/v1/auth/verify-otp
{ "phone": "+919876543210", "otp": "123456" }

Response:
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": {
    "_id": "665f...",
    "name": "",
    "phone": "+919876543210",
    "resources": [],
    "blood_group": null,
    "location": null,
    "location_name": null,
    "is_volunteer": false,
    "created_at": "2026-...",
    "updated_at": "2026-..."
  }
}
```

After this, **store `access_token`** and send it in the header: `Authorization: Bearer eyJhbGciOi...`

### Emergency Requests

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| `POST` | `/requests/` | Yes | Create emergency request |
| `GET` | `/requests/` | Yes | List your requests |
| `GET` | `/requests/{id}` | Yes | Get request details |
| `POST` | `/requests/{id}/accept` | Yes | Volunteer accepts request |
| `PATCH` | `/requests/{id}/status?status=completed` | Yes | Update request status |

**Create Request:**
```json
POST /api/v1/requests/
Authorization: Bearer <token>
{
  "resource": "blood",           // blood|transport|medicines|food|shelter
  "blood_group": "B-",           // required if resource=blood, else null
  "urgency": "critical",         // critical|high|medium|low (default: high)
  "latitude": 23.2599,           // either lat/lng OR location_name
  "longitude": 77.4126,
  "location_name": "AIIMS Bhopal"  // optional if lat/lng provided
}
```

**Response:**
```json
{
  "_id": "665f...",
  "requester_id": "665f...",
  "requester_phone": "+919876543210",
  "source": "app",
  "resource": "blood",
  "blood_group": "B-",
  "urgency": "critical",
  "location_name": "AIIMS Bhopal",
  "location": { "type": "Point", "coordinates": [77.4126, 23.2599] },
  "raw_message": null,
  "status": "open",                // open→matched→assigned→completed
  "assigned_volunteer": null,
  "current_radius_km": 5.0,
  "created_at": "2026-...",
  "updated_at": "2026-..."
}
```

### Volunteers

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| `POST` | `/volunteers/register` | Yes | Register as volunteer |
| `GET` | `/volunteers/me` | Yes | Get volunteer profile |
| `PATCH` | `/volunteers/me` | Yes | Update volunteer profile |
| `PUT` | `/volunteers/me/location?lat=X&lng=Y` | Yes | Update live location |

**Register as Volunteer:**
```json
POST /api/v1/volunteers/register
Authorization: Bearer <token>
{
  "name": "Rajesh Kumar",
  "phone": "+919876543210",
  "resources": ["blood", "transport"],   // array
  "blood_group": "B-",                   // required if "blood" in resources
  "latitude": 23.2599,
  "longitude": 77.4126,
  "location_name": "AIIMS Bhopal"        // optional with lat/lng
}
```

### Distance Tracking

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| `POST` | `/tracking/location` | Yes | Update volunteer location (periodic) |
| `GET` | `/tracking/{request_id}/distance` | Yes | Get current distance to request |

**Update Location (call every 5-10 seconds):**
```json
POST /api/v1/tracking/location
Authorization: Bearer <token>
{ "latitude": 23.2605, "longitude": 77.4130 }
```

**Get Distance:**
```json
GET /api/v1/tracking/{request_id}/distance
Authorization: Bearer <token>

Response:
{
  "request_id": "665f...",
  "volunteer_phone": "+919876543210",
  "distance_km": 2.3
}
```

### SMS Webhook (no auth, called by SMS Gate)

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| `POST` | `/sms/incoming` | No | Webhook for incoming SMS |

### Notifications

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| `GET` | `/notifications/` | Yes | List notifications for current user |

---

## The Matching Engine (Geospatial)

This is the core of the platform. Here's exactly how it works:

1. **Request created** → stored with `[longitude, latitude]` in `location` field (GeoJSON Point)
2. **MongoDB query** using `$near` with `2dsphere` index:
   ```javascript
   db.users.find({
     location: {
       $near: {
         $geometry: { type: "Point", coordinates: [77.4126, 23.2599] },
         $maxDistance: 5000  // 5km in meters
       }
     },
     resources: { $in: ["blood"] },
     blood_group: "B-",        // only if resource is blood
     is_volunteer: true
   })
   ```
3. **Radius expansion**: If no volunteers found at 5km, expand to 10km, then 15km, then 20km. The `current_radius_km` field on the request tracks this.
4. **Notification**: Each volunteer within radius gets an SMS with request details.
5. **Accept**: First volunteer to accept → request becomes "assigned", all other notifications become "expired".

---

## Setup Instructions

### 1. Prerequisites

- Python 3.10+
- MongoDB Atlas cluster (or local MongoDB)
- OpenRouter API key (for AI parsing)
- SMS Gate app installed on an Android phone

### 2. Clone & Install

```bash
cd "C:\Users\yuvra\Downloads\Personal Proj\Hackathon"
pip install -r requirements.txt
```

### 3. Create `.env` file

```bash
cp .env.example .env
```

Then edit `.env` with your actual values:

| Variable | Where to get it |
|----------|----------------|
| `MONGODB_URL` | MongoDB Atlas connection string |
| `OPENROUTER_API_KEY` | https://openrouter.ai/keys |
| `SMS_GATE_USERNAME` | SMS Gate app → Home tab |
| `SMS_GATE_PASSWORD` | SMS Gate app → Home tab |
| `SMS_GATE_SIGNING_KEY` | SMS Gate app → Settings → Webhooks |
| `SECRET_KEY` | Generate one: `python -c "import secrets; print(secrets.token_hex(32))"` |

### 4. SMS Gate Setup

1. Install **SMS Gateway for Android** from https://github.com/capcom6/android-sms-gateway/releases
2. Open the app, go to **Home tab** → note your username/password
3. For **Cloud mode**: Register your webhook at `https://api.sms-gate.app/3rdparty/v1/webhooks`:
   ```bash
   curl -X POST -u "username:password" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-backend-url/api/v1/sms/incoming", "event": "sms:received"}' \
     https://api.sms-gate.app/3rdparty/v1/webhooks
   ```
4. For **Local mode**: Use ADB port forwarding or ngrok to expose your backend

### 5. MongoDB Atlas Setup

1. Create a free cluster at https://www.mongodb.com/atlas
2. Whitelist your IP address
3. Create a database user
4. Get the connection string: `mongodb+srv://user:pass@cluster.mongodb.net/`
5. Set `MONGODB_URL` in `.env`
6. The `emergency_response` database and all collections/indexes are **auto-created** on first startup

### 6. Run the Server

```bash
uvicorn app.main:app --reload --port 8000
```

The server starts at `http://localhost:8000`. Open `http://localhost:8000/docs` for the interactive Swagger UI.

---

## Frontend Integration Notes (for your friend)

### Authentication Flow for React Native

```typescript
// 1. Send OTP
const sendOTP = async (phone: string) => {
  const res = await fetch('https://your-api/api/v1/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return res.json();
};

// 2. Verify OTP → get JWT
const verifyOTP = async (phone: string, otp: string) => {
  const res = await fetch('https://your-api/api/v1/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  });
  const data = await res.json();
  // Store access_token in AsyncStorage/secure storage
  await SecureStore.setItemAsync('access_token', data.access_token);
  return data;
};

// 3. Authenticated requests
const apiCall = async (endpoint: string, options = {}) => {
  const token = await SecureStore.getItemAsync('access_token');
  return fetch(`https://your-api/api/v1${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};
```

### Key Frontend Screens Needed

1. **OTP Login** → Phone input → OTP input → token stored
2. **Home / Map** → Leaflet map showing nearby requests (use OpenStreetMap tiles)
3. **Create Request** → Select resource type, blood group (if blood), pick location on map, set urgency
4. **Request Detail** → Map with volunteer location, live distance updates
5. **Volunteer Registration** → Select resources, blood group (if blood), set home location
6. **Notifications** → List of incoming emergency requests for volunteers
7. **Profile** → View/edit volunteer status, location, resources

### Polling for Live Distance

The frontend should poll `GET /tracking/{request_id}/distance` every 5-10 seconds after a volunteer accepts, and update the map with the distance. The volunteer's app should send `POST /tracking/location` with current GPS coordinates at the same interval.

### Map Setup (Leaflet + OpenStreetMap)

```tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

<MapContainer center={[23.2599, 77.4126]} zoom={13}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  {/* Request marker */}
  <Marker position={[23.2599, 77.4126]}>
    <Popup>Emergency: B- Blood Needed</Popup>
  </Marker>
  {/* Volunteer marker - update position from /tracking/location */}
  <Marker position={[23.2605, 77.4130]}>
    <Popup>Volunteer: 2.3 km away</Popup>
  </Marker>
</MapContainer>
```

**Important**: MongoDB stores coordinates as `[longitude, latitude]` per GeoJSON spec, but Leaflet uses `[latitude, longitude]`. Always swap the order!

---

## What Still Needs Work

1. **Radius expansion scheduler** - The matching engine finds volunteers at the initial radius, but the periodic 5→10→15→20 km expansion needs a background scheduler (APScheduler or asyncio loop)
2. **SMS accept/decline via SMS** - Currently volunteers accept via app API. Need an SMS endpoint where texting "YES" assigns them
3. **Rate limiting** - No rate limiting on endpoints yet
4. **Error handling improvements** - More specific error messages, logging
5. **Tests** - No test suite yet

The core is solid and all endpoints work. Your friend can start building the React Native frontend right away against this API.