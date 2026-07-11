import { useState } from 'react'
import { Link } from 'react-router-dom'

function formatViews(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n
}

function formatDuration(secs) {
  if (!secs) return null
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago'
  if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago'
  return Math.floor(diff / 2592000) + 'mo ago'
}

export default function VideoCard({ video }) {
  const owner = video.ownerDetails || video.owner || {}
  const [realDuration, setRealDuration] = useState(null)

  return (
    <Link to={`/watch/${video._id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ cursor: 'pointer' }}>

        {/* Thumbnail */}
        <div style={{
          position: 'relative',
          aspectRatio: '16/9',
          background: 'var(--bg-3)',
          overflow: 'hidden',
        }}>
          <img
            src={video.thumbnail}
            alt={video.title}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.4s ease',
            }}
            onError={e => e.target.style.display = 'none'}
          />

          {/* Hidden video to detect real duration */}
          <video
            src={video.videoFile}
            style={{ display: 'none' }}
            preload="metadata"
            onLoadedMetadata={(e) => {
              const secs = Math.floor(e.target.duration)
              if (secs && secs > 0) setRealDuration(secs)
            }}
          />

          {/* Duration badge — only if real duration detected */}
          {realDuration && (
            <div style={{
              position: 'absolute', bottom: 8, right: 8,
              background: 'rgba(0,0,0,0.82)',
              color: 'white',
              fontSize: 11, fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 4,
              pointerEvents: 'none',
            }}>
              {formatDuration(realDuration)}
            </div>
          )}

          {/* Private badge */}
          {!video.isPublished && (
            <div style={{
              position: 'absolute', top: 8, left: 8,
            }} className="badge badge-orange">
              Private
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '14px' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <img
              src={owner.avatar}
              alt={owner.username}
              className="avatar"
              style={{ width: 32, height: 32, marginTop: 2, flexShrink: 0 }}
              onError={e =>
                e.target.src = `https://ui-avatars.com/api/?name=${owner.username || 'U'}&background=00c853&color=fff&size=32`
              }
            />
            <div style={{ minWidth: 0 }}>
              <h3 style={{
                fontSize: 14, fontWeight: 600,
                lineHeight: 1.4,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                marginBottom: 6,
                color: 'var(--text)',
              }}>
                {video.title}
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                @{owner.username || 'unknown'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                {formatViews(video.views || 0)} views · {timeAgo(video.createdAt)}
              </div>
            </div>
          </div>
        </div>

      </div>
    </Link>
  )
}

