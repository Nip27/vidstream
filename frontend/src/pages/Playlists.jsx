import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Playlists() {
  const { user } = useAuth()
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!user) return setLoading(false)
    api.get(`/playlists/user/${user._id}`)
      .then(res => setPlaylists(res.data.data || []))
      .catch(() => toast.error('Failed to load playlists'))
      .finally(() => setLoading(false))
  }, [user])

  const createPlaylist = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await api.post('/playlists', form)
      setPlaylists(p => [res.data.data, ...p])
      setForm({ name: '', description: '' })
      setShowModal(false)
      toast.success('Playlist created!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create')
    } finally {
      setCreating(false)
    }
  }

  const deletePlaylist = async (id) => {
    if (!confirm('Delete this playlist?')) return
    try {
      await api.delete(`/playlists/${id}`)
      setPlaylists(p => p.filter(pl => pl._id !== id))
      toast.success('Playlist deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <span className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  )

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Playlists</h1>
          <p>Organise your favourite videos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">≡</div>
          <h3>No playlists yet</h3>
          <p style={{ marginBottom: 16 }}>Create your first playlist to organise videos</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Create Playlist
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {playlists.map((pl, i) => (
            <div key={pl._id} className="card fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
              {/* Thumbnail placeholder */}
              <div style={{
                aspectRatio: '16/9',
                background: 'linear-gradient(135deg, var(--bg-3), var(--border))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32,
              }}>≡</div>
              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: 15, marginBottom: 4 }}>{pl.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {pl.description}
                </p>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14 }}>
                  {pl.totalVideos || 0} videos · {pl.totalViews || 0} views
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/playlist/${pl._id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                    View
                  </Link>
                  <button className="btn btn-danger btn-sm" onClick={() => deletePlaylist(pl._id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>New Playlist</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={createPlaylist} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label>Name</label>
                <input className="input" type="text" placeholder="My Playlist"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea className="input" placeholder="What's this playlist about?"
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  required style={{ minHeight: 80 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <span className="spinner" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
