import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import SubscribeButton from '../components/SubscribeButton'
import toast from 'react-hot-toast'

export default function Subscriptions() {
  const { user } = useAuth()
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return setLoading(false)
    api.get(`/subscriptions/u/${user._id}`)
      .then(res => {
        const data = res.data.data || []
        setChannels(data.map(item => item.subscribedChannel || item))
      })
      .catch(() => toast.error('Failed to load subscriptions'))
      .finally(() => setLoading(false))
  }, [user])

  const unsubscribe = async (channelId, username) => {
    const confirmed = window.confirm(`Unsubscribe from @${username}?`)
    if (!confirmed) return
    try {
      await api.post(`/subscriptions/c/${channelId}`)
      setChannels(p => p.filter(c => c._id !== channelId))
      toast.success('Unsubscribed')
    } catch {
      toast.error('Failed to unsubscribe')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <span className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1>Subscriptions</h1>
        <p>{channels.length} channel{channels.length !== 1 ? 's' : ''} you follow</p>
      </div>

      {channels.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◉</div>
          <h3>No subscriptions yet</h3>
          <p>Subscribe to channels to see them here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {channels.map((ch, i) => ch && (
            <div
              key={ch._id}
              className="fade-up card"
              style={{
                display: 'flex', alignItems: 'center',
                gap: 16, padding: '16px 20px',
                animationDelay: `${i * 0.04}s`,
              }}
            >
              <Link to={`/channel/${ch.username}`}>
                <img
                  src={ch.avatar}
                  className="avatar"
                  style={{ width: 56, height: 56 }}
                  onError={e =>
                    e.target.src = `https://ui-avatars.com/api/?name=${ch.username}&background=00c853&color=fff`
                  }
                />
              </Link>

              <div style={{ flex: 1 }}>
                <Link
                  to={`/channel/${ch.username}`}
                  style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}
                >
                  {ch.fullName}
                </Link>
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                  @{ch.username}
                </div>
                {ch.latestVideo && (
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
                    Latest:{' '}
                    <Link
                      to={`/watch/${ch.latestVideo._id}`}
                      style={{ color: 'var(--accent)' }}
                    >
                      {ch.latestVideo.title}
                    </Link>
                  </div>
                )}
              </div>

              <SubscribeButton
                subscribed={true}
                subscribing={false}
                onSubscribe={() => unsubscribe(ch._id, ch.username)}
                size="sm"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
