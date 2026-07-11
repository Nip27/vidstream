import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', color: color || 'var(--text)' }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/videos'),
    ]).then(([s, v]) => {
      setStats(s.data.data)
      setVideos(v.data.data || [])
    }).catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const togglePublish = async (videoId, current) => {
    try {
      await api.patch(`/videos/toggle/publish/${videoId}`)
      setVideos(p => p.map(v => v._id === videoId ? { ...v, isPublished: !current } : v))
      toast.success(current ? 'Set to private' : 'Published!')
    } catch {
      toast.error('Failed to update')
    }
  }

  const deleteVideo = async (videoId) => {
    if (!confirm('Delete this video?')) return
    try {
      await api.delete(`/videos/${videoId}`)
      setVideos(p => p.filter(v => v._id !== videoId))
      toast.success('Video deleted')
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
          <h1>Dashboard</h1>
          <p>Your channel overview</p>
        </div>
        <Link to="/upload" className="btn btn-primary">+ Upload Video</Link>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 40 }}>
        <StatCard icon="◉" label="Total Subscribers" value={stats?.totalSubscribers || 0} color="var(--accent)" />
        <StatCard icon="▶" label="Total Videos" value={stats?.totalVideos || 0} />
        <StatCard icon="👁" label="Total Views" value={stats?.totalViews || 0} />
        <StatCard icon="♥" label="Total Likes" value={stats?.totalLikes || 0} color="var(--red)" />
      </div>

      {/* Videos table */}
      <div>
        <h2 style={{ fontSize: 20, marginBottom: 20 }}>Your Videos</h2>
        {videos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📹</div>
            <h3>No videos yet</h3>
            <p style={{ marginBottom: 16 }}>Upload your first video to get started</p>
            <Link to="/upload" className="btn btn-primary">Upload Now</Link>
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            {videos.map((v, i) => (
              <div key={v._id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 20px',
                borderBottom: i < videos.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background var(--transition)',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Thumbnail */}
                <div style={{
                  width: 96, height: 54,
                  borderRadius: 6,
                  overflow: 'hidden',
                  background: 'var(--bg-3)',
                  flexShrink: 0,
                }}>
                  <img src={v.thumbnail} alt={v.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => e.target.style.display = 'none'} />
                </div>

                {/* Title + date */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600, fontSize: 14,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: 4,
                  }}>{v.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {v.views || 0} views · {v.likesCount || 0} likes
                  </div>
                </div>

                {/* Status */}
                <span className={`badge ${v.isPublished ? 'badge-green' : 'badge-orange'}`}>
                  {v.isPublished ? 'Published' : 'Private'}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/watch/${v._id}`} className="btn btn-ghost btn-sm">View</Link>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => togglePublish(v._id, v.isPublished)}
                  >
                    {v.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteVideo(v._id)}
                  >Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
