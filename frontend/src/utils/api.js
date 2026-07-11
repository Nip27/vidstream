import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1"

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends httpOnly cookies automatically
  timeout: 15000,
})

// ── Request interceptor — attach Bearer token if stored ───────────────────────
// Tokens are primarily sent via httpOnly cookies set by the server.
// The Authorization header is a fallback for non-browser clients (e.g. mobile).
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Track if a refresh is already in progress ──────────────────────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// ── Response interceptor — auto-refresh on 401 ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only attempt refresh on 401 and if this isn't already a retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh-token or login endpoints (avoids infinite loops)
      const isAuthEndpoint =
        originalRequest.url?.includes("/refresh-token") ||
        originalRequest.url?.includes("/login") ||
        originalRequest.url?.includes("/register")

      if (isAuthEndpoint) {
        _redirectToLogin()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Queue this request until the ongoing refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (token) originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await api.post("/users/refresh-token")
        const newAccessToken = res.data?.data?.accessToken

        if (newAccessToken) {
          localStorage.setItem("accessToken", newAccessToken)
          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          processQueue(null, newAccessToken)
        }

        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        _redirectToLogin()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

const _redirectToLogin = () => {
  localStorage.removeItem("accessToken")
  localStorage.removeItem("user")
  // Avoid redirect loop if already on login page
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login"
  }
}

export default api