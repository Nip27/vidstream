import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  // ── Verify session on mount ─────────────────────────────────────────────────
  // Always validate against the server — do not trust localStorage blindly
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await api.get('/users/current-user')
        const freshUser = res.data.data
        setUser(freshUser)
        // Store only non-sensitive public profile data
        localStorage.setItem('user', JSON.stringify({
          _id: freshUser._id,
          username: freshUser.username,
          fullName: freshUser.fullName,
          avatar: freshUser.avatar,
          coverImage: freshUser.coverImage,
          email: freshUser.email,
        }))
      } catch {
        // Session invalid — clear stale local data
        localStorage.removeItem('user')
        localStorage.removeItem('accessToken')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    verifySession()
  }, [])

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (data) => {
    const res = await api.post('/users/login', data)
    const { user: loggedInUser, accessToken } = res.data.data

    // Store token for Bearer header fallback (httpOnly cookie is the primary auth)
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken)
    }

    // Store only non-sensitive profile data
    const safeUser = {
      _id: loggedInUser._id,
      username: loggedInUser.username,
      fullName: loggedInUser.fullName,
      avatar: loggedInUser.avatar,
      coverImage: loggedInUser.coverImage,
      email: loggedInUser.email,
    }
    localStorage.setItem('user', JSON.stringify(safeUser))
    setUser(safeUser)
    return safeUser
  }, [])

  // ── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    const res = await api.post('/users/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  }, [])

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post('/users/logout')
    } catch {
      // Even if server call fails, clear client-side state
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  // ── Update local user state (e.g. after profile update) ────────────────────
  const updateUser = useCallback((updated) => {
    const safeUser = {
      _id: updated._id,
      username: updated.username,
      fullName: updated.fullName,
      avatar: updated.avatar,
      coverImage: updated.coverImage,
      email: updated.email,
    }
    setUser(safeUser)
    localStorage.setItem('user', JSON.stringify(safeUser))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}