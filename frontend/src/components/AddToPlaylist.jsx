import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function AddToPlaylist({ videoId, onClose }) {
  const { user } = useAuth()
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [videoInPlaylists, setVideoInPlaylists] = useState({})
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchPlaylists()
  }, [user])

  const fetchPlaylists = async () => {
    try {
      const res = await api.get(`/playlists/user/${user._id}`)
      const data = res.data.data || []
      setPlaylists(data)

      // check which playlists already contain this video
      const states = {}
      await Promise.all(
        data.map(async (pl) => {
          try {
            const detail = await api.get(`/playlists/${pl._id}`)
            const videos = detail.data.data?.videos || []
            states[pl._id] = videos.some(v => v._id === videoId)
          } catch {
            states[pl._id] = false
          }
        })
      )
      setVideoInPlaylists(states)
    } catch {
      toast.error('Failed to load playlists')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (playlistId) => {
    const isIn = videoInPlaylists[playlistId]
    setActionLoading(p => ({ ...p, [playlistId]: true }))
    try {
      if (isIn) {
        await api.patch(`/playlists/remove/${videoId}/${playlistId}`)
        setVideoInPlaylists(p => ({ ...p, [playlistId]: false }))
        toast.success('Removed from playlist')
      } else {
        await api.patch(`/playlists/add/${videoId}/${playlistId}`)
        setVideoInPlaylists(p => ({ ...p, [playlistId]: true }))
        toast.success('Added to playlist!')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update playlist')
    } finally {
      setActionLoading(p => ({ ...p, [playlistId]: false }))
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return toast.error('Name is required')
    setCreating(true)
    try {
      const res = await api.post('/playlists', {
        name: newName,
        description: newDesc || 'No description',
      })
      const created = res.data.data

      // add video to new playlist automatically
      await api.patch(`/playlists/add/${videoId}/${created._id}`)

      setPlaylists(p => [{ ...created, totalVideos: 1 }, ...p])
      setVideoInPlaylists(p => ({ ...p, [created._id]: true }))
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
      toast.success('Playlist created and video added!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create playlist')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>

        {/* Header */}
        <div className="modal-header">
          <h2 style={{ fontSize: 18 }}>Save to Playlist</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-2)', fontSize: 20,
              cursor: 'pointer', padding: '0 4px',
              lineHeight: 1,
            }}
          >
            {'✕'}
          </button>
        </div>

        {/* Create new playlist */}
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            style={{
              width: '100%', padding: '10px 14px', marginBottom: 16,
              background: 'var(--accent-glow)',
              border: '1px dashed rgba(0,255,135,0.3)',
              borderRadius: 8,
              color: 'var(--accent)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.18s',
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
            Create new playlist
          </button>
        ) : (
          <form onSubmit={handleCreate} style={{
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: 10, padding: 16, marginBottom: 16,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
              New Playlist
            </div>
            <div className="input-group">
              <label>Name</label>
              <input
                className="input" type="text"
                placeholder="My Playlist"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus required
              />
            </div>
            <div className="input-group">
              <label>
                Description{' '}
                <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                className="input" type="text"
                placeholder="What is this playlist about?"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button" className="btn btn-ghost btn-sm"
                onClick={() => { setShowCreate(false); setNewName(''); setNewDesc('') }}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button
                type="submit" className="btn btn-primary btn-sm"
                disabled={creating}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {creating
                  ? <span className="spinner" style={{ width: 13, height: 13 }} />
                  : 'Create & Add'
                }
              </button>
            </div>
          </form>
        )}

        {/* Section label */}
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
        }}>
          Your Playlists
        </div>

        {/* Playlist list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <span className="spinner" />
          </div>
        ) : playlists.length === 0 ? (
          <div style={{
            padding: '20px 0', textAlign: 'center',
            color: 'var(--text-3)', fontSize: 13,
          }}>
            No playlists yet — create one above
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            maxHeight: 300, overflowY: 'auto',
            paddingRight: 4,
          }}>
            {playlists.map(pl => {
              const isIn = videoInPlaylists[pl._id]
              const isLoading = actionLoading[pl._id]

              return (
                <div
                  key={pl._id}
                  onClick={() => !isLoading && handleToggle(pl._id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    background: isIn ? 'var(--accent-glow)' : 'var(--bg-3)',
                    border: `1px solid ${isIn ? 'rgba(0,255,135,0.25)' : 'var(--border)'}`,
                    borderRadius: 8,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.18s',
                    opacity: isLoading ? 0.7 : 1,
                  }}
                  onMouseEnter={e => {
                    if (!isLoading) e.currentTarget.style.borderColor = 'var(--accent)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = isIn
                      ? 'rgba(0,255,135,0.25)'
                      : 'var(--border)'
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: 20, height: 20, borderRadius: 5,
                    border: `2px solid ${isIn ? 'var(--accent)' : 'var(--border-light)'}`,
                    background: isIn ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.18s',
                  }}>
                    {isLoading ? (
                      <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                    ) : isIn ? (
                      <span style={{ color: 'var(--text-on-accent)', fontSize: 11, fontWeight: 800, lineHeight: 1 }}>
                        {'✓'}
                      </span>
                    ) : null}
                  </div>

                  {/* Playlist icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 6,
                    background: isIn ? 'rgba(0,255,135,0.15)' : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                    color: isIn ? 'var(--accent)' : 'var(--text-3)',
                  }}>
                    {'≡'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: isIn ? 600 : 500,
                      color: isIn ? 'var(--accent)' : 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {pl.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {pl.totalVideos || 0} videos
                      {isIn && (
                        <span style={{ color: 'var(--accent)', marginLeft: 6 }}>
                          · click to remove
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Done */}
        <button
          onClick={onClose}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
        >
          Done
        </button>
      </div>
    </div>
  )
}