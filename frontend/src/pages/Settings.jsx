import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
  })
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [changingPass, setChangingPass] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)

  const saveDetails = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.patch('/users/update-account', form)
      updateUser(res.data.data)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setChangingPass(true)
    try {
      await api.post('/users/change-password', passwords)
      setPasswords({ oldPassword: '', newPassword: '' })
      toast.success('Password changed!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Wrong password')
    } finally {
      setChangingPass(false)
    }
  }

  const uploadAvatar = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarUploading(true)
    const fd = new FormData()
    fd.append('avatar', file)
    try {
      const res = await api.patch('/users/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      updateUser(res.data.data)
      toast.success('Avatar updated!')
    } catch {
      toast.error('Failed to update avatar')
    } finally {
      setAvatarUploading(false)
    }
  }

  const uploadCover = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCoverUploading(true)
    const fd = new FormData()
    fd.append('coverImage', file)
    try {
      const res = await api.patch('/users/cover-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      updateUser(res.data.data)
      toast.success('Cover image updated!')
    } catch {
      toast.error('Failed to update cover image')
    } finally {
      setCoverUploading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account</p>
      </div>

      {/* ── Profile images card ── */}
      <section style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        marginBottom: 24,
      }}>

        {/* Cover image area */}
        <label htmlFor="cover-upload" style={{ cursor: 'pointer', display: 'block', position: 'relative' }}>
          <div style={{
            height: 140,
            background: user?.coverImage
              ? `url(${user.coverImage}) center/cover no-repeat`
              : 'linear-gradient(135deg, #0d2018 0%, #1a3a28 50%, #0d2018 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* dark overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              <div style={{
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
              }}>
                {coverUploading ? 'Uploading...' : 'Click to change cover'}
              </div>
            </div>
          </div>
          <input
            id="cover-upload"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={uploadCover}
          />
        </label>

        {/* Avatar overlapping cover */}
        <div style={{ padding: '0 20px 20px', position: 'relative' }}>
          <div style={{ marginTop: -44, marginBottom: 12, display: 'inline-block' }}>
            <label htmlFor="avatar-upload" style={{ cursor: 'pointer', display: 'block' }}>
              <div style={{
                width: 80, height: 80,
                borderRadius: '50%',
                border: '4px solid var(--bg-2)',
                overflow: 'hidden',
                background: 'var(--bg-3)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                position: 'relative',
              }}>
                {avatarUploading ? (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--bg-3)',
                  }}>
                    <span className="spinner" />
                  </div>
                ) : (
                  <img
                    src={user?.avatar}
                    alt={user?.username}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    onError={e =>
                      e.target.src = `https://ui-avatars.com/api/?name=${user?.username || 'U'}&background=00c853&color=fff&size=80`
                    }
                  />
                )}

                {/* Hover overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  fontSize: 20,
                  color: 'white',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                >
                  {'📷'}
                </div>
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={uploadAvatar}
              />
            </label>
          </div>

          {/* Name + hint */}
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
              {user?.fullName}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>
              @{user?.username}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              Click avatar or cover to update
            </div>
          </div>
        </div>
      </section>

      {/* ── Account details ── */}
      <section style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        marginBottom: 24,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
          Account Details
        </h2>
        <form onSubmit={saveDetails} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label>Full Name</label>
            <input
              className="input"
              type="text"
              value={form.fullName}
              onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
              required
            />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div className="input-group">
            <label>Username</label>
            <input
              className="input"
              type="text"
              value={user?.username || ''}
              disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ alignSelf: 'flex-start' }}
          >
            {saving ? <span className="spinner" /> : 'Save Changes'}
          </button>
        </form>
      </section>

      {/* ── Change password ── */}
      <section style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
          Change Password
        </h2>
        <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label>Current Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={passwords.oldPassword}
              onChange={e => setPasswords(p => ({ ...p, oldPassword: e.target.value }))}
              required
            />
          </div>
          <div className="input-group">
            <label>New Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={passwords.newPassword}
              onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={changingPass}
            style={{ alignSelf: 'flex-start' }}
          >
            {changingPass ? <span className="spinner" /> : 'Update Password'}
          </button>
        </form>
      </section>
    </div>
  )
}