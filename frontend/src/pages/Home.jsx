import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import VideoCard from '../components/VideoCard'

export default function Home() {
  const navigate = useNavigate()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [videoSearch, setVideoSearch] = useState('')
  const [videoQuery, setVideoQuery] = useState('')
  const [channelSearch, setChannelSearch] = useState('')
  const [channelResults, setChannelResults] = useState([])
  const [channelSearching, setChannelSearching] = useState(false)
  const [showChannelResults, setShowChannelResults] = useState(false)
  const [subscribeState, setSubscribeState] = useState({})
  const [subscribeLoading, setSubscribeLoading] = useState({})

  useEffect(() => {
    fetchVideos(1, videoQuery)
  }, [videoQuery])

  const fetchVideos = async (p = 1, q = '') => {
    try {
      setLoading(true)
      const res = await api.get('/videos', {
        params: {
          page: p,
          limit: 12,
          sortBy: 'createdAt',
          sortType: 'desc',
          ...(q ? { query: q } : {}),
        }
      })
      const data = res.data.data
      const docs = data.docs || data || []
      if (p === 1) setVideos(docs)
      else setVideos(prev => [...prev, ...docs])
      setHasMore(data.hasNextPage || false)
    } catch {
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  const handleVideoSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setVideoQuery(videoSearch)
  }

  const clearVideoSearch = () => {
    setVideoSearch('')
    setVideoQuery('')
    setPage(1)
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchVideos(next, videoQuery)
  }

  const handleChannelSearch = async (e) => {
    const val = e.target.value
    setChannelSearch(val)
    if (!val.trim()) {
      setChannelResults([])
      setShowChannelResults(false)
      return
    }
    setChannelSearching(true)
    try {
      const res = await api.get(`/users/search?query=${val}`)
      const users = res.data.data || []
      setChannelResults(users)
      setShowChannelResults(true)
      const states = {}
      await Promise.all(
        users.map(async (u) => {
          try {
            const subRes = await api.get(`/subscriptions/c/${u._id}`)
            const subs = subRes.data.data || []
            const me = JSON.parse(localStorage.getItem('user') || '{}')
            states[u._id] = subs.some(
              s => s.subscriber?._id === me._id || s.subscriber === me._id
            )
          } catch { states[u._id] = false }
        })
      )
      setSubscribeState(states)
    } catch {
      setChannelResults([])
    } finally {
      setChannelSearching(false)
    }
  }

  const handleSubscribe = async (e, channelId) => {
    e.stopPropagation()
    setSubscribeLoading(p => ({ ...p, [channelId]: true }))
    try {
      await api.post(`/subscriptions/c/${channelId}`)
      setSubscribeState(p => ({ ...p, [channelId]: !p[channelId] }))
    } catch {}
    finally {
      setSubscribeLoading(p => ({ ...p, [channelId]: false }))
    }
  }

  return (
    <div>

      {/* ── Search section ── */}
      <div style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 24px 20px',
        marginBottom: 28,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
        }}>

          {/* ── Video search ── */}
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}>
              Search Videos
            </div>
            <form onSubmit={handleVideoSearch} style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  className="input"
                  placeholder="Search all videos..."
                  value={videoSearch}
                  onChange={e => setVideoSearch(e.target.value)}
                  style={{ paddingLeft: 36 }}
                />
                <span style={{
                  position: 'absolute', left: 11, top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 14, color: 'var(--text-3)',
                  pointerEvents: 'none',
                }}>
                  🎬
                </span>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ flexShrink: 0 }}
              >
                Search
              </button>
              {videoQuery && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={clearVideoSearch}
                  style={{ flexShrink: 0 }}
                >
                  Clear
                </button>
              )}
            </form>
            {videoQuery && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Results for:</span>
                <span className="badge badge-green">{videoQuery}</span>
              </div>
            )}
          </div>

          {/* ── Channel search ── */}
          <div style={{ position: 'relative' }}>
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}>
              Search Channels
            </div>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                placeholder="Search channels to subscribe..."
                value={channelSearch}
                onChange={handleChannelSearch}
                onFocus={() => channelResults.length > 0 && setShowChannelResults(true)}
                onBlur={() => setTimeout(() => setShowChannelResults(false), 200)}
                style={{ paddingLeft: 36 }}
              />
              <span style={{
                position: 'absolute', left: 11, top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 14, color: 'var(--text-3)',
                pointerEvents: 'none',
              }}>
                {channelSearching ? '⟳' : '👤'}
              </span>

              {/* Channel results dropdown */}
              {showChannelResults && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)', left: 0, right: 0,
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  zIndex: 100,
                  overflow: 'hidden',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                  maxHeight: 300,
                  overflowY: 'auto',
                }}>
                  {channelResults.length === 0 ? (
                    <div style={{
                      padding: 14,
                      textAlign: 'center',
                      fontSize: 13,
                      color: 'var(--text-3)',
                    }}>
                      No channels found
                    </div>
                  ) : (
                    <>
                      {/* Header */}
                      <div style={{
                        padding: '7px 14px',
                        fontSize: 10, fontWeight: 700,
                        color: 'var(--text-3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        borderBottom: '1px solid var(--border)',
                      }}>
                        {channelResults.length} channel{channelResults.length !== 1 ? 's' : ''}
                      </div>

                      {/* Channel rows */}
                      {channelResults.map(ch => (
                        <div
                          key={ch._id}
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', gap: 10,
                            transition: 'background 0.15s',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Avatar */}
                          <div
                            onClick={() => {
                              navigate(`/channel/${ch.username}`)
                              setShowChannelResults(false)
                              setChannelSearch('')
                            }}
                            style={{ flexShrink: 0 }}
                          >
                            <img
                              src={ch.avatar}
                              className="avatar"
                              style={{ width: 40, height: 40 }}
                              onError={e =>
                                e.target.src = `https://ui-avatars.com/api/?name=${ch.username}&background=00c853&color=fff&size=40`
                              }
                            />
                          </div>

                          {/* Name + username */}
                          <div
                            style={{ flex: 1, minWidth: 0 }}
                            onClick={() => {
                              navigate(`/channel/${ch.username}`)
                              setShowChannelResults(false)
                              setChannelSearch('')
                            }}
                          >
                            <div style={{
                              fontSize: 14, fontWeight: 600,
                              color: 'var(--text)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {ch.fullName}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                              @{ch.username}
                            </div>
                          </div>

                          {/* Subscribe / Subscribed */}
                          {subscribeState[ch._id] ? (
                            <div style={{
                              padding: '5px 12px',
                              borderRadius: 20,
                              fontSize: 12, fontWeight: 600,
                              background: 'var(--bg-3)',
                              color: 'var(--text-3)',
                              border: '1px solid var(--border)',
                              cursor: 'default',
                              userSelect: 'none',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}>
                              {'✓'} Subscribed
                            </div>
                          ) : (
                            <button
                              onClick={e => handleSubscribe(e, ch._id)}
                              disabled={subscribeLoading[ch._id]}
                              style={{
                                padding: '5px 12px',
                                borderRadius: 20,
                                fontSize: 12, fontWeight: 700,
                                background: 'var(--accent-glow)',
                                color: 'var(--accent)',
                                border: '1px solid rgba(0,255,135,0.25)',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                transition: 'all 0.15s',
                              }}
                            >
                              {subscribeLoading[ch._id] ? '...' : '+ Subscribe'}
                            </button>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Video count */}
      {!loading && videos.length > 0 && (
        <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-3)' }}>
          {videos.length} video{videos.length !== 1 ? 's' : ''}
          {videoQuery ? ` found for "${videoQuery}"` : ' available'}
        </div>
      )}

      {/* ── Video grid ── */}
      {loading && page === 1 ? (
        <div className="video-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="skeleton" style={{ aspectRatio: '16/9' }} />
              <div style={{ padding: 14 }}>
                <div className="skeleton" style={{ height: 14, marginBottom: 8, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📹</div>
          <h3>
            {videoQuery ? `No videos found for "${videoQuery}"` : 'No videos yet'}
          </h3>
          <p>
            {videoQuery ? 'Try a different search term' : 'Be the first to upload!'}
          </p>
          {videoQuery && (
            <button
              className="btn btn-secondary"
              onClick={clearVideoSearch}
              style={{ marginTop: 16 }}
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
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

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <button
                className="btn btn-secondary"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

    </div>
  )
}
