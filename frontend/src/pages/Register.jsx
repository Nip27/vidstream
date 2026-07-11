import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
  })
  const [avatar, setAvatar] = useState(null)
  const [coverImage, setCoverImage] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFile = (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    if (type === 'avatar') {
      setAvatar(file)
      setAvatarPreview(URL.createObjectURL(file))
    } else {
      setCoverImage(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!avatar) return toast.error('Avatar is required')
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('avatar', avatar)
      if (coverImage) fd.append('coverImage', coverImage)

      const result = await register(fd)
      console.log('Registration result:', result)
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      console.error('Registration failed:', err)
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(0,255,135,0.04) 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      <div className="fade-up" style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56,
            background: 'var(--accent)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, margin: '0 auto 16px',
            boxShadow: 'var(--shadow-accent)',
            color: 'var(--text-on-accent)',
          }}>{'▶'}</div>
          <h1 style={{ fontSize: 28, marginBottom: 6 }}>Join VidStream</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Create your account</p>
        </div>

        <div style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 32,
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Avatar upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
              <label htmlFor="avatar-input" style={{ cursor: 'pointer' }}>
                <div style={{
                  width: 64, height: 64,
                  borderRadius: '50%',
                  background: 'var(--bg-3)',
                  border: `2px dashed ${avatar ? 'var(--accent)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}>
                  {avatarPreview
                    ? <img src={avatarPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 24, color: 'var(--text-3)' }}>+</span>
                  }
                </div>
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handleFile(e, 'avatar')}
                />
              </label>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                  Profile Photo
                  {avatar && (
                    <span style={{ color: 'var(--accent)', marginLeft: 8, fontSize: 12 }}>
                      ✓ {avatar.name}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {avatar ? 'Photo selected' : 'Required · Click to upload'}
                </div>
              </div>
            </div>

            {/* Name + username */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="input-group">
                <label>Full Name</label>
                <input
                  className="input" type="text" placeholder="John Doe"
                  value={form.fullName}
                  onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                  required
                />
              </div>
              <div className="input-group">
                <label>Username</label>
                <input
                  className="input" type="text" placeholder="johndoe"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="input-group">
              <label>Email</label>
              <input
                className="input" type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>

            {/* Password */}
            <div className="input-group">
              <label>Password</label>
              <input
                className="input" type="password" placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>

            {/* Cover image */}
            <div className="input-group">
              <label>
                Cover Image
                <span style={{ color: 'var(--text-3)', fontWeight: 400, marginLeft: 6 }}>
                  (optional)
                </span>
              </label>
              <input
                className="input" type="file" accept="image/*"
                style={{ padding: '10px 12px' }}
                onChange={e => handleFile(e, 'cover')}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ justifyContent: 'center', marginTop: 4 }}
            >
              {loading ? <span className="spinner" /> : 'Create Account'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-2)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}