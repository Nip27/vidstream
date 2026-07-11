# VidStream 🎬

A production-ready, full-stack video streaming platform built as a portfolio project demonstrating REST API design, JWT authentication, MongoDB data modeling, and secure user management.

> **Stack**: Node.js · Express · MongoDB · Mongoose · React · Vite · Cloudinary · JWT

---

## Features

| Feature | Details |
|---------|---------|
| **Authentication** | JWT access + refresh tokens, httpOnly cookies, token rotation |
| **Video Management** | Upload, publish, update, delete, toggle publish status |
| **Comments** | Paginated comments with likes, CRUD with ownership guards |
| **Likes** | Toggle likes on videos, comments, and tweets |
| **Subscriptions** | Subscribe/unsubscribe channels, feed of subscribed content |
| **Playlists** | Create, manage, and share video playlists |
| **Tweets** | Short posts visible in subscriber feeds |
| **Dashboard** | Channel stats — subscribers, total views, total likes |
| **Watch History** | Tracks viewed videos per user |
| **Search** | Full-text search across videos and users |

---

## Architecture

```
VidStream/
├── backend/                    # Node.js + Express REST API
│   ├── src/
│   │   ├── app.js              # Express app (middleware, routes, error handler)
│   │   ├── index.js            # Entry point (DB connect, server start, graceful shutdown)
│   │   ├── constants.js        # App-wide constants (DB_NAME)
│   │   ├── controllers/        # Request handlers (one file per resource)
│   │   │   ├── user.controller.js
│   │   │   ├── video.controller.js
│   │   │   ├── comment.controller.js
│   │   │   ├── like.controller.js
│   │   │   ├── subscription.controller.js
│   │   │   ├── tweet.controller.js
│   │   │   ├── playlist.controller.js
│   │   │   └── dashboard.controller.js
│   │   ├── models/             # Mongoose schemas with indexes and validation
│   │   │   ├── user.model.js
│   │   │   ├── video.model.js
│   │   │   ├── comment.model.js
│   │   │   ├── like.model.js
│   │   │   ├── subscription.model.js
│   │   │   ├── tweet.model.js
│   │   │   └── playlist.model.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js       # verifyJWT + optionalVerifyJWT
│   │   │   ├── multer.middleware.js     # File upload with type/size validation
│   │   │   ├── errorHandler.middleware.js  # Centralized error handling
│   │   │   ├── rateLimiter.middleware.js   # Auth + API rate limiting
│   │   │   └── validate.middleware.js      # Schema-based request validation
│   │   ├── routes/             # Express routers (one file per resource)
│   │   ├── utils/
│   │   │   ├── ApiError.js     # Custom error class
│   │   │   ├── ApiResponse.js  # Consistent response wrapper
│   │   │   ├── asyncHandler.js # Async error propagation
│   │   │   ├── cloudinary.js   # Upload + delete utilities
│   │   │   └── logger.js       # Structured ENV-aware logger
│   │   └── db/index.js         # MongoDB connection
│   └── tests/                  # Jest + Supertest integration tests
│
└── frontend/                   # React + Vite SPA
    ├── src/
    │   ├── App.jsx             # Router + auth provider
    │   ├── context/
    │   │   └── AuthContext.jsx # Auth state, login, logout, register
    │   ├── utils/
    │   │   └── api.js          # Axios instance + token refresh interceptor
    │   ├── components/         # Reusable UI components
    │   ├── pages/              # Page-level components
    │   └── __tests__/          # Vitest + React Testing Library tests
    └── vitest.config.js
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (free tier works)

### Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI, Cloudinary credentials, and JWT secrets

# 3. Generate secure JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 4. Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Set VITE_API_URL to your backend URL

# 3. Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 8000) |
| `NODE_ENV` | No | `development` or `production` |
| `MONGODB_URI` | **Yes** | MongoDB connection string |
| `CORS_ORIGIN` | No | Allowed frontend origin |
| `ACCESS_TOKEN_SECRET` | **Yes** | JWT signing secret (min 32 chars) |
| `ACCESS_TOKEN_EXPIRY` | No | Token lifetime (default: `1d`) |
| `REFRESH_TOKEN_SECRET` | **Yes** | Refresh JWT signing secret |
| `REFRESH_TOKEN_EXPIRY` | No | Refresh lifetime (default: `10d`) |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | **Yes** | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | **Yes** | Cloudinary API secret |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Backend API base URL (e.g. `http://localhost:8000/api/v1`) |

---

## API Reference

### Base URL
```
/api/v1
```

### Authentication

All protected routes require a valid JWT via:
- `Authorization: Bearer <accessToken>` header, OR
- `accessToken` httpOnly cookie (set automatically by login)

### Endpoints

#### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/users/register` | Public | Register (multipart/form-data with avatar) |
| `POST` | `/users/login` | Public | Login — returns accessToken + sets cookies |
| `POST` | `/users/logout` | 🔒 | Logout — clears cookies |
| `POST` | `/users/refresh-token` | Public | Refresh access token |
| `GET` | `/users/current-user` | 🔒 | Get authenticated user profile |
| `PATCH` | `/users/update-account` | 🔒 | Update fullName and email |
| `PATCH` | `/users/avatar` | 🔒 | Update avatar image |
| `PATCH` | `/users/cover-image` | 🔒 | Update cover image |
| `POST` | `/users/change-password` | 🔒 | Change password |
| `GET` | `/users/c/:username` | 🔒 | Get channel profile |
| `GET` | `/users/history` | 🔒 | Get watch history |
| `GET` | `/users/search?query=` | Public | Search users/channels |

#### Videos
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/videos` | Optional | List videos (paginated, searchable) |
| `POST` | `/videos` | 🔒 | Upload video file |
| `POST` | `/videos/url` | 🔒 | Add video by external URL |
| `GET` | `/videos/:videoId` | Optional | Get video details |
| `PATCH` | `/videos/:videoId` | 🔒 Owner | Update video |
| `DELETE` | `/videos/:videoId` | 🔒 Owner | Delete video |
| `PATCH` | `/videos/toggle/publish/:videoId` | 🔒 Owner | Toggle publish status |

#### Comments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/comments/:videoId` | Optional | Get video comments (paginated) |
| `POST` | `/comments/:videoId` | 🔒 | Add comment |
| `PATCH` | `/comments/c/:commentId` | 🔒 Owner | Edit comment |
| `DELETE` | `/comments/c/:commentId` | 🔒 Owner | Delete comment |

#### Likes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/likes/toggle/v/:videoId` | 🔒 | Toggle video like |
| `POST` | `/likes/toggle/c/:commentId` | 🔒 | Toggle comment like |
| `POST` | `/likes/toggle/t/:tweetId` | 🔒 | Toggle tweet like |
| `GET` | `/likes/videos` | 🔒 | Get all liked videos |

#### Subscriptions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/subscriptions/c/:channelId` | 🔒 | Toggle subscription |
| `GET` | `/subscriptions/c/:channelId` | 🔒 | Get channel subscribers |
| `GET` | `/subscriptions/u/:subscriberId` | 🔒 | Get subscribed channels |

#### Playlists
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/playlists` | 🔒 | Create playlist |
| `GET` | `/playlists/user/:userId` | 🔒 | Get user's playlists |
| `GET` | `/playlists/:playlistId` | 🔒 | Get playlist with videos |
| `PATCH` | `/playlists/:playlistId` | 🔒 Owner | Update playlist |
| `DELETE` | `/playlists/:playlistId` | 🔒 Owner | Delete playlist |
| `PATCH` | `/playlists/add/:videoId/:playlistId` | 🔒 Owner | Add video |
| `PATCH` | `/playlists/remove/:videoId/:playlistId` | 🔒 Owner | Remove video |

#### Tweets / Dashboard / Healthcheck
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/tweets` | 🔒 | Create tweet (max 280 chars) |
| `GET` | `/tweets/user/:userId` | 🔒 | Get user tweets |
| `GET` | `/tweets/feed` | 🔒 | Get feed tweets |
| `PATCH` | `/tweets/:tweetId` | 🔒 Owner | Update tweet |
| `DELETE` | `/tweets/:tweetId` | 🔒 Owner | Delete tweet |
| `GET` | `/dashboard/stats` | 🔒 | Channel stats |
| `GET` | `/dashboard/videos` | 🔒 | Channel video list |
| `GET` | `/healthcheck` | Public | Server health |

### Response Format

All responses follow this structure:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Human-readable message",
  "data": { ... }
}
```

Error responses:
```json
{
  "statusCode": 401,
  "success": false,
  "message": "Unauthorized — no token provided",
  "errors": []
}
```

---

## Running Tests

### Backend
```bash
cd backend
npm test                 # Run all tests once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

### Frontend
```bash
cd frontend
npm test                 # Run all tests once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

---

## Deployment

### Backend (Render / Railway)

1. Set all environment variables in your platform dashboard
2. Set `NODE_ENV=production`
3. Start command: `npm start`

### Frontend (Vercel)

1. Set `VITE_API_URL` to your deployed backend URL
2. `vercel.json` is already configured for SPA routing

> ⚠️ **Security**: Always rotate the committed JWT secrets and Cloudinary credentials before deploying. Generate new secrets with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## Security Highlights

- **JWT rotation**: Refresh tokens are rotated on every use (old token invalidated)
- **Rate limiting**: 10 req/15min on auth endpoints, 100 req/15min general
- **Helmet**: Security headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS**: Strict allowlist, not wildcard
- **File validation**: MIME type whitelist + 5MB image / 200MB video limits
- **UUID filenames**: No path traversal possible via file uploads
- **Input validation**: Email format, password strength, content length enforced
- **Compound DB indexes**: Prevents duplicate likes/subscriptions at DB level
- **ReDoS prevention**: User-supplied regex inputs are escaped
- **HTTP semantics**: 401 Unauthenticated, 403 Forbidden, 409 Conflict

---

## Resume Claims Validation

| Claim | Status | Evidence |
|-------|--------|---------|
| REST API Design | ✅ Supported | 9 resource routers, proper HTTP verbs, status codes, consistent response format |
| JWT Authentication | ✅ Supported | Access + refresh tokens, rotation, httpOnly cookies, token refresh interceptor |
| MongoDB Data Modeling | ✅ Supported | 7 schemas with relationships, compound indexes, aggregate pipelines |
| Secure User Management | ✅ Supported | Bcrypt (12 rounds), rate limiting, no credential logging, helmet, CORS |
| Scalable Data Access | ✅ Supported | Mongoose aggregate pagination, compound indexes, optimized lookup pipelines |
| End-to-End Ownership | ✅ Supported | Full-stack: backend API + React SPA + Cloudinary integration + deployment configs |

---

## Tech Stack

**Backend**
- Node.js + Express 4
- MongoDB + Mongoose 8
- JWT (jsonwebtoken)
- Bcrypt
- Multer v2 (file uploads)
- Cloudinary (media storage)
- Helmet (security headers)
- express-rate-limit

**Frontend**
- React 18 + Vite 5
- React Router v6
- Axios (with interceptors)
- react-hot-toast

**Testing**
- Jest + Supertest (backend integration)
- Vitest + React Testing Library (frontend unit)
- MongoDB Memory Server (in-memory DB for tests)
