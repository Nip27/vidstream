import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/', icon: '⊞', label: 'Home' },
  { to: '/liked', icon: '♥', label: 'Liked Videos' },
  { to: '/subscriptions', icon: '◉', label: 'Subscriptions' },
  { to: '/playlists', icon: '≡', label: 'Playlists' },
  { to: '/tweets', icon: '✦', label: 'Community' },
]

const accountItems = [
  { to: '/dashboard', icon: '◈', label: 'Dashboard' },
  { to: '/upload', icon: '+', label: 'Upload Video' },
  { to: '/profile', icon: '◎', label: 'My Channel' },
  { to: '/settings', icon: '⚙', label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'dark'
  )

  useState(() => {
    const saved = localStorage.getItem('theme') || 'dark'
    document.documentElement.setAttribute('data-theme', saved)
  })

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const navLinkStyle = ({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '9px 12px', borderRadius: 7,
    color: isActive ? 'var(--accent)' : 'var(--text-2)',
    background: isActive ? 'var(--accent-glow)' : 'transparent',
    fontSize: 13, fontWeight: isActive ? 600 : 400,
    marginBottom: 2, transition: 'all 0.18s',
    textDecoration: 'none',
    border: isActive ? '1px solid rgba(0,255,135,0.12)' : '1px solid transparent',
  })

  return (
    <aside style={{
      position: 'fixed',
      left: 0, top: 0, bottom: 0,
      width: 240,
      background: 'var(--bg-2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
      overflowY: 'auto',
    }}>

      {/* ── Logo + theme toggle ── */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Logo row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          {/* Logo mark + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 32, height: 32,
              background: 'var(--accent)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15,
              color: 'var(--text-on-accent)',
              flexShrink: 0,
              fontWeight: 700,
            }}>
              {'▶'}
            </div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: '-0.02em',
              color: 'var(--text)',
            }}>
              VidStream
            </span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: 34, height: 34,
              borderRadius: '50%',
              background: theme === 'dark' ? 'var(--bg-3)' : 'var(--accent-glow)',
              border: '1px solid var(--border)',
              color: theme === 'dark' ? '#fbbf24' : '#00a651',
              fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 11,
          color: 'var(--text-3)',
          paddingLeft: 2,
          letterSpacing: '0.02em',
        }}>
          Stream · Share · Discover
        </div>
      </div>

      {/* ── Nav links ── */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>

        {/* Main nav */}
        <div style={{ marginBottom: 24 }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={navLinkStyle}
            >
              <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Account nav */}
        {user && (
          <div>
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              padding: '0 12px',
              marginBottom: 6,
            }}>
              My Account
            </div>
            {accountItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                style={navLinkStyle}
              >
                <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* ── User footer ── */}
      {user ? (
        <div style={{
          padding: '14px',
          borderTop: '1px solid var(--border)',
        }}>
          {/* User info card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
            padding: '8px 10px',
            background: 'var(--bg-3)',
            borderRadius: 8,
            border: '1px solid var(--border)',
            cursor: 'pointer',
          }}
            onClick={() => navigate('/profile')}
          >
            <img
              src={user.avatar}
              className="avatar"
              style={{ width: 34, height: 34, flexShrink: 0 }}
              onError={e =>
                e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=00c853&color=fff&size=34`
              }
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'var(--text)',
              }}>
                {user.fullName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                @{user.username}
              </div>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm"
            style={{
              width: '100%',
              justifyContent: 'center',
              color: 'var(--red)',
              fontSize: 12,
              border: '1px solid rgba(255,77,77,0.15)',
            }}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div style={{
          padding: '14px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <NavLink
            to="/login"
            className="btn btn-secondary btn-sm"
            style={{ justifyContent: 'center' }}
          >
            Sign In
          </NavLink>
          <NavLink
            to="/register"
            className="btn btn-primary btn-sm"
            style={{ justifyContent: 'center' }}
          >
            Sign Up
          </NavLink>
        </div>
      )}

    </aside>
  )
}