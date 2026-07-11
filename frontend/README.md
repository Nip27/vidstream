# ChaiTube Frontend

A React.js frontend for the chai-backend project — a YouTube-like video platform.

## Tech Stack

- React 18 + Vite
- React Router v6
- Axios (API calls)
- React Hot Toast (notifications)
- Pure CSS (no UI library)

## Pages

| Route | Page | Auth Required |
|---|---|---|
| `/` | Home — browse all videos | No |
| `/watch/:videoId` | Video player + comments | No |
| `/channel/:username` | Channel profile | No |
| `/login` | Sign in | No |
| `/register` | Create account | No |
| `/dashboard` | Channel stats + manage videos | Yes |
| `/upload` | Upload a video | Yes |
| `/liked` | Liked videos | Yes |
| `/subscriptions` | Subscribed channels | Yes |
| `/playlists` | Your playlists | Yes |
| `/tweets` | Community posts | Yes |
| `/settings` | Update profile, avatar, password | Yes |

## Setup

### 1. Make sure the backend is running

```bash
# In your chai-backend folder
npm run dev
# Server runs on http://localhost:8000
```

### 2. Install dependencies

```bash
cd chai-frontend
npm install
```

### 3. Run the frontend

```bash
npm run dev
# Frontend runs on http://localhost:5173
```

The Vite proxy in `vite.config.js` forwards all `/api` requests to `http://localhost:8000` automatically — no CORS issues.

## Project Structure

```
src/
├── components/
│   ├── Sidebar.jsx        ← Navigation sidebar
│   ├── VideoCard.jsx      ← Reusable video card
│   └── ProtectedRoute.jsx ← Auth guard
├── context/
│   └── AuthContext.jsx    ← Global auth state
├── pages/
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Watch.jsx
│   ├── Dashboard.jsx
│   ├── Upload.jsx
│   ├── Settings.jsx
│   ├── LikedVideos.jsx
│   ├── Subscriptions.jsx
│   ├── Playlists.jsx
│   ├── PlaylistDetail.jsx
│   ├── Tweets.jsx
│   └── Channel.jsx
├── utils/
│   └── api.js             ← Axios instance with interceptors
├── App.jsx                ← Routes
├── main.jsx               ← Entry point
└── index.css              ← Global styles + design system
```

## How Auth Works

1. User logs in → backend returns `accessToken` + `refreshToken`
2. `accessToken` stored in `localStorage`
3. Axios interceptor attaches it as `Authorization: Bearer <token>` on every request
4. If a 401 is received, user is redirected to `/login` automatically
5. `AuthContext` exposes `user`, `login`, `logout`, `register` to all components
