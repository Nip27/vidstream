import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

function formatViews(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago'
  if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago'
  return Math.floor(diff / 2592000) + 'mo ago'
}

function formatDuration(secs) {
  if (!secs) return null
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PlaylistDetail() {
  const { playlistId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState({})

  useEffect(() => {
    fetchPlaylist()
  }, [playlistId])

  const fetchPlaylist = async () => {
    try {
      const res = await api.get(`/playlists/${playlistId}`)
      setPlaylist(res.data.data)
    } catch {
      toast.error('Failed to load playlist')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (videoId, e) => {
    e.preventDefault()
    e.stopPropagation()
    const confirmed = window.confirm('Remove this video from the playlist?')
    if (!confirmed) return
    setRemoving(p => ({ ...p, [videoId]: true }))
    try {
      await api.patch(`/playlists/remove/${videoId}/${playlistId}`)
      setPlaylist(p => ({
        ...p,
        videos: p.videos.filter(v => v._id !== videoId),
        totalVideos: p.totalVideos - 1,
      }))
      toast.success('Video removed from playlist')
    } catch {
      toast.error('Failed to remove video')
    } finally {
      setRemoving(p => ({ ...p, [videoId]: false }))
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <span className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  )

  if (!playlist) return (
    <div className="empty-state">
      <div className="empty-icon">≡</div>
      <h3>Playlist not found</h3>
    </div>
  )

  const isOwner = user && playlist.owner?.username === user.username

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: 28,
        alignItems: 'start',
      }}>

        {/* ── Left: playlist info card (sticky) ── */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            {/* Playlist thumbnail — first video or gradient */}
            <div style={{
              aspectRatio: '16/9',
              background: playlist.videos?.[0]?.thumbnail
                ? `url(${playlist.videos[0].thumbnail}) center/cover`
                : 'linear-gradient(135deg, #0d2018, #1a3a28)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.7) 100%)',
                display: 'flex', alignItems: 'flex-end',
                padding: '16px',
              }}>
                <div style={{
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: 8, padding: '6px 12px',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ color: 'var(--accent)', fontSize: 16 }}>{'≡'}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>
                    {playlist.totalVideos || playlist.videos?.length || 0} videos
                  </span>
                </div>
              </div>
            </div>

            <div style={{ padding: '18px 20px' }}>
              <h1 style={{ fontSize: 20, marginBottom: 8, color: 'var(--text)' }}>
                {playlist.name}
              </h1>
              <p style={{
                fontSize: 13, color: 'var(--text-3)',
                marginBottom: 14, lineHeight: 1.5,
              }}>
                {playlist.description}
              </p>

              {/* Owner */}
              {playlist.owner && (
                <Link
                  to={`/channel/${playlist.owner.username}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    textDecoration: 'none', marginBottom: 14,
                  }}
                >
                  <img
                    src={playlist.owner.avatar}
                    className="avatar"
                    style={{ width: 28, height: 28 }}
                    onError={e =>
                      e.target.src = `https://ui-avatars.com/api/?name=${playlist.owner.username}&background=00c853&color=fff`
                    }
                  />
                  <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
                    @{playlist.owner.username}
                  </span>
                </Link>
              )}

              {/* Stats */}
              <div style={{
                display: 'flex', gap: 16, fontSize: 12,
                color: 'var(--text-3)', marginBottom: 16,
              }}>
                <span>{playlist.totalVideos || playlist.videos?.length || 0} videos</span>
                <span>{formatViews(playlist.totalViews || 0)} total views</span>
              </div>

              {/* Play all */}
              {playlist.videos?.length > 0 && (
                <button
                  onClick={() => navigate(`/watch/${playlist.videos[0]._id}`)}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {'▶'} Play All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: video list ── */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 20,
          }}>
            <h2 style={{ fontSize: 20, color: 'var(--text)' }}>
              Videos
              <span style={{
                color: 'var(--text-3)', fontSize: 14,
                fontWeight: 400, marginLeft: 8,
              }}>
                ({playlist.videos?.length || 0})
              </span>
            </h2>
          </div>

          {!playlist.videos || playlist.videos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📹</div>
              <h3>No videos in this playlist</h3>
              <p>Browse videos and save them to this playlist</p>
              <button
                onClick={() => navigate('/')}
                className="btn btn-primary"
                style={{ marginTop: 16 }}
              >
                Browse Videos
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {playlist.videos.map((video, index) => (
                <Link
                  key={video._id}
                  to={`/watch/${video._id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      display: 'flex', gap: 14, alignItems: 'center',
                      padding: '10px 14px',
                      background: 'var(--bg-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      transition: 'border-color 0.18s, background 0.18s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--border-light)'
                      e.currentTarget.style.background = 'var(--bg-3)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.background = 'var(--bg-2)'
                    }}
                  >
                    {/* Index number */}
                    <div style={{
                      width: 24, flexShrink: 0,
                      fontSize: 13, color: 'var(--text-3)',
                      textAlign: 'center', fontWeight: 600,
                    }}>
                      {index + 1}
                    </div>

                    {/* Thumbnail */}
                    <div style={{
                      width: 120, height: 68, borderRadius: 6,
                      overflow: 'hidden', background: 'var(--bg-3)',
                      flexShrink: 0, position: 'relative',
                    }}>
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => e.target.style.display = 'none'}
                      />
                      {video.duration && (
                        <div style={{
                          position: 'absolute', bottom: 4, right: 4,
                          background: 'rgba(0,0,0,0.85)',
                          color: 'white', fontSize: 10, fontWeight: 600,
                          padding: '1px 5px', borderRadius: 3,
                        }}>
                          {formatDuration(video.duration)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600,
                        color: 'var(--text)', marginBottom: 4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {video.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {formatViews(video.views || 0)} views · {timeAgo(video.createdAt)}
                      </div>
                    </div>

                    {/* Remove button — only for playlist owner */}
                    {isOwner && (
                      <button
                        onClick={(e) => handleRemove(video._id, e)}
                        disabled={removing[video._id]}
                        style={{
                          flexShrink: 0,
                          width: 32, height: 32,
                          borderRadius: '50%',
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          color: 'var(--text-3)',
                          fontSize: 16, fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.18s',
                          lineHeight: 1,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(255,77,77,0.1)'
                          e.currentTarget.style.color = 'var(--red)'
                          e.currentTarget.style.borderColor = 'rgba(255,77,77,0.3)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--text-3)'
                          e.currentTarget.style.borderColor = 'var(--border)'
                        }}
                        title="Remove from playlist"
                      >
                        {removing[video._id]
                          ? <span className="spinner" style={{ width: 12, height: 12 }} />
                          : '✕'
                        }
                      </button>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}