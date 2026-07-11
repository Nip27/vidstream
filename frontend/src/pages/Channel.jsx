import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import VideoCard from '../components/VideoCard'
import SubscribeButton from '../components/SubscribeButton'
import toast from 'react-hot-toast'

export default function Channel() {
  const { username } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [channel, setChannel] = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscribed, setSubscribed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    setLoading(true)
    setChannel(null)
    setVideos([])
    fetchChannel()
  }, [username])

  const fetchChannel = async () => {
    try {
      const res = await api.get(`/users/c/${username}`)
      const ch = res.data.data
      setChannel(ch)
      setSubscribed(ch.isSubscribed || false)
      const videoRes = await api.get('/videos', {
        params: {
          userId: ch._id, limit: 20,
          sortBy: 'createdAt', sortType: 'desc',
        }
      })
      const data = videoRes.data.data
      setVideos(data.docs || data || [])
    } catch {
      toast.error('Failed to load channel')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!user) return toast.error('Sign in to subscribe')

    if (subscribed) {
      const confirmed = window.confirm(
        `Unsubscribe from @${channel.username}?`
      )
      if (!confirmed) return
      setSubscribing(true)
      try {
        await api.post(`/subscriptions/c/${channel._id}`)
        setSubscribed(false)
        setChannel(c => ({ ...c, subscribersCount: c.subscribersCount - 1 }))
        toast.success('Unsubscribed')
      } catch {
        toast.error('Failed to unsubscribe')
      } finally {
        setSubscribing(false)
      }
      return
    }

    setSubscribing(true)
    try {
      await api.post(`/subscriptions/c/${channel._id}`)
      setSubscribed(true)
      setChannel(c => ({ ...c, subscribersCount: c.subscribersCount + 1 }))
      toast.success('Subscribed!')
    } catch {
      toast.error('Failed to subscribe')
    } finally {
      setSubscribing(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <span className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  )

  if (!channel) return (
    <div className="empty-state">
      <div className="empty-icon">◎</div>
      <h3>Channel not found</h3>
    </div>
  )

  const isOwn = user && user.username === channel.username

  return (
    <div>

      {/* Cover image */}
      <div style={{
        height: 200,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: channel.coverImage
          ? `url(${channel.coverImage}) center/cover no-repeat`
          : 'linear-gradient(135deg, #0d2018 0%, #1a3a28 50%, #0d2018 100%)',
        position: 'relative',
        border: '1px solid var(--border)',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }} />
      </div>

      {/* Channel info bar */}
      <div style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderTop: 'none',
        borderBottomLeftRadius: 'var(--radius-lg)',
        borderBottomRightRadius: 'var(--radius-lg)',
        padding: '0 28px 24px',
        marginBottom: 36,
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>

          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <div style={{
              width: 88, height: 88,
              borderRadius: '50%',
              border: '4px solid var(--bg-2)',
              overflow: 'hidden',
              marginTop: -44,
              flexShrink: 0,
              background: 'var(--bg-3)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              position: 'relative',
              zIndex: 2,
            }}>
              <img
                src={channel.avatar}
                alt={channel.username}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e =>
                  e.target.src = `https://ui-avatars.com/api/?name=${channel.username}&background=00c853&color=fff&size=88`
                }
              />
            </div>

            <div style={{ paddingBottom: 4 }}>
              <h1 style={{ fontSize: 22, marginBottom: 4, color: 'var(--text)' }}>
                {channel.fullName}
              </h1>
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 16, fontSize: 13,
                color: 'var(--text-3)', flexWrap: 'wrap',
              }}>
                <span>@{channel.username}</span>
                <span>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                    {channel.subscribersCount || 0}
                  </span>
                  {' subscribers'}
                </span>
                <span>
                  <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>
                    {channel.channelsSubscribedToCount || 0}
                  </span>
                  {' subscriptions'}
                </span>
                <span>
                  <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>
                    {videos.length}
                  </span>
                  {' videos'}
                </span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div style={{ paddingBottom: 4 }}>
            {isOwn ? (
              <button
                onClick={() => navigate('/settings')}
                className="btn btn-secondary btn-sm"
              >
                {'⚙'} Edit Channel
              </button>
            ) : user ? (
              <SubscribeButton
                subscribed={subscribed}
                subscribing={subscribing}
                onSubscribe={handleSubscribe}
                size="md"
              />
            ) : (
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '9px 24px', borderRadius: 20,
                  fontSize: 14, fontWeight: 700,
                  background: 'var(--accent)',
                  color: 'var(--text-on-accent)',
                  border: 'none', cursor: 'pointer',
                  transition: 'opacity 0.18s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Sign in to Subscribe
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12, marginBottom: 32,
      }}>
        {[
          { label: 'Subscribers', value: channel.subscribersCount || 0, icon: '◉' },
          { label: 'Videos', value: videos.length, icon: '▶' },
          { label: 'Subscriptions', value: channel.channelsSubscribedToCount || 0, icon: '✦' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--accent-glow)',
              border: '1px solid rgba(0,255,135,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: 'var(--accent)', flexShrink: 0,
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22, fontWeight: 800,
                color: 'var(--text)', lineHeight: 1, marginBottom: 4,
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Videos heading */}
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
            ({videos.length})
          </span>
        </h2>
        {isOwn && (
          <button
            onClick={() => navigate('/upload')}
            className="btn btn-primary btn-sm"
          >
            + Upload
          </button>
        )}
      </div>

      {/* Videos grid */}
      {videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📹</div>
          <h3>No videos yet</h3>
          <p>
            {isOwn
              ? 'Upload your first video to get started'
              : `${channel.fullName} has not uploaded any videos yet`
            }
          </p>
          {isOwn && (
            <button
              onClick={() => navigate('/upload')}
              className="btn btn-primary"
              style={{ marginTop: 16 }}
            >
              Upload Now
            </button>
          )}
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((v, i) => (
            <div
              key={v._id}
              className="fade-up"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <VideoCard video={v} />
            </div>
          ))}
        </div>
      )}

    </div>
  )
}