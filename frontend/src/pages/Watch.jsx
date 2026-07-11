import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import SubscribeButton from '../components/SubscribeButton'
import AddToPlaylist from '../components/AddToPlaylist'

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago'
  if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago'
  return Math.floor(diff / 2592000) + 'mo ago'
}

function formatViews(n) {
  if (!n) return '0'
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

function SideVideoCard({ video, onClick }) {
  const owner = video.ownerDetails || video.owner || {}
  const [cardDuration, setCardDuration] = useState(null)

  return (
    <div
      onClick={() => onClick(video._id)}
      style={{
        display: 'flex', gap: 10, cursor: 'pointer',
        padding: '8px', borderRadius: 8,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
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
        <video
          src={video.videoFile}
          style={{ display: 'none' }}
          preload="metadata"
          onLoadedMetadata={(e) => {
            const secs = Math.floor(e.target.duration)
            if (secs && secs > 0) setCardDuration(secs)
          }}
        />
        {cardDuration && (
          <div style={{
            position: 'absolute', bottom: 4, right: 4,
            background: 'rgba(0,0,0,0.85)',
            color: 'white', fontSize: 10, fontWeight: 600,
            padding: '1px 5px', borderRadius: 3,
            pointerEvents: 'none',
          }}>
            {formatDuration(cardDuration)}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500, color: 'var(--text)',
          lineHeight: 1.4, overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', marginBottom: 4,
        }}>
          {video.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
          @{owner.username || 'unknown'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
          {formatViews(video.views)} views · {timeAgo(video.createdAt)}
        </div>
      </div>
    </div>
  )
}

export default function Watch() {
  const { videoId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [liked, setLiked] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [relatedVideos, setRelatedVideos] = useState([])
  const [showFullDesc, setShowFullDesc] = useState(false)
  const [realDuration, setRealDuration] = useState(null)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)

  useEffect(() => {
    setLoading(true)
    setVideo(null)
    setComments([])
    setRelatedVideos([])
    setShowFullDesc(false)
    setRealDuration(null)
    window.scrollTo(0, 0)
    fetchVideo()
    fetchComments()
  }, [videoId])

  const fetchVideo = async () => {
    try {
      const res = await api.get(`/videos/${videoId}`)
      const v = res.data.data
      setVideo(v)
      setLiked(v.isLiked || false)
      setSubscribed(v.owner?.isSubscribed || false)
      if (v.owner?._id) {
        const relRes = await api.get('/videos', {
          params: {
            userId: v.owner._id, limit: 10,
            sortBy: 'createdAt', sortType: 'desc',
          }
        })
        const data = relRes.data.data
        const all = data.docs || data || []
        setRelatedVideos(all.filter(rv => rv._id !== videoId))
      }
    } catch {
      toast.error('Failed to load video')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/${videoId}`)
      const data = res.data.data
      setComments(data.docs || data || [])
    } catch {}
  }

  const handleLike = async () => {
    if (!user) return toast.error('Sign in to like')
    try {
      await api.post(`/likes/toggle/v/${videoId}`)
      setLiked(p => !p)
      setVideo(v => ({
        ...v,
        likesCount: liked ? v.likesCount - 1 : v.likesCount + 1,
      }))
    } catch {}
  }

  const handleSubscribe = async () => {
    if (!user) return toast.error('Sign in to subscribe')
    if (subscribed) {
      const confirmed = window.confirm(`Unsubscribe from @${video.owner?.username}?`)
      if (!confirmed) return
      setSubscribing(true)
      try {
        await api.post(`/subscriptions/c/${video.owner._id}`)
        setSubscribed(false)
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
      await api.post(`/subscriptions/c/${video.owner._id}`)
      setSubscribed(true)
      toast.success('Subscribed!')
    } catch {
      toast.error('Failed to subscribe')
    } finally {
      setSubscribing(false)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!user) return toast.error('Sign in to comment')
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      const res = await api.post(`/comments/${videoId}`, { content: newComment })
      setComments(p => [res.data.data, ...p])
      setNewComment('')
      toast.success('Comment added!')
    } catch {
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/c/${commentId}`)
      setComments(p => p.filter(c => c._id !== commentId))
      toast.success('Comment deleted')
    } catch {}
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <span className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  )

  if (!video) return (
    <div className="empty-state">
      <div className="empty-icon">📹</div>
      <h3>Video not found</h3>
    </div>
  )

  const owner = video.owner || {}
  const isLongDesc = (video.description || '').length > 200 ||
    (video.description || '').split('\n').length > 3

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: 24, alignItems: 'start',
      }}>

        {/* ── LEFT COLUMN ── */}
        <div>

          {/* Video player */}
          <div style={{
            borderRadius: 12, overflow: 'hidden',
            background: '#000', aspectRatio: '16/9',
            marginBottom: 14,
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}>
            <video
              src={video.videoFile}
              controls autoPlay={false}
              style={{ width: '100%', height: '100%', display: 'block' }}
              poster={video.thumbnail}
              onLoadedMetadata={(e) => {
                const secs = Math.floor(e.target.duration)
                if (secs && secs > 0) setRealDuration(secs)
              }}
            />
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 20, fontWeight: 700,
            lineHeight: 1.4, color: 'var(--text)', marginBottom: 12,
          }}>
            {video.title}
          </h1>

          {/* Channel row */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
            marginBottom: 16, paddingBottom: 16,
            borderBottom: '1px solid var(--border)',
          }}>
            {/* Channel + subscribe */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link to={`/channel/${owner.username}`}>
                <img
                  src={owner.avatar}
                  className="avatar"
                  style={{ width: 44, height: 44, border: '2px solid var(--border)' }}
                  onError={e =>
                    e.target.src = `https://ui-avatars.com/api/?name=${owner.username || 'U'}&background=00c853&color=fff&size=44`
                  }
                />
              </Link>
              <div>
                <Link
                  to={`/channel/${owner.username}`}
                  style={{
                    fontWeight: 600, fontSize: 15,
                    color: 'var(--text)', display: 'block', marginBottom: 2,
                  }}
                >
                  {owner.username}
                </Link>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {formatViews(owner.subscribersCount || 0)} subscribers
                </div>
              </div>
              {user && user._id !== owner._id && (
                <SubscribeButton
                  subscribed={subscribed}
                  subscribing={subscribing}
                  onSubscribe={handleSubscribe}
                  size="sm"
                />
              )}
            </div>

            {/* Like + views + save */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {/* Like */}
              <button
                onClick={handleLike}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 20,
                  background: liked ? 'var(--accent-glow-strong)' : 'var(--bg-3)',
                  color: liked ? 'var(--accent)' : 'var(--text-2)',
                  border: `1px solid ${liked ? 'rgba(0,255,135,0.3)' : 'var(--border)'}`,
                  fontSize: 13, fontWeight: liked ? 700 : 400,
                  cursor: 'pointer', transition: 'all 0.18s',
                }}
              >
                {'♥'} {video.likesCount || 0}
              </button>

              {/* Views */}
              <div style={{
                padding: '7px 14px', borderRadius: 20,
                background: 'var(--bg-3)',
                border: '1px solid var(--border)',
                fontSize: 13, color: 'var(--text-3)',
              }}>
                {formatViews(video.views || 0)} views
              </div>

              {/* Save to playlist */}
              {user && (
                <button
                  onClick={() => setShowPlaylistModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 16px', borderRadius: 20,
                    background: 'var(--bg-3)',
                    color: 'var(--text-2)',
                    border: '1px solid var(--border)',
                    fontSize: 13, cursor: 'pointer',
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--accent-glow)'
                    e.currentTarget.style.color = 'var(--accent)'
                    e.currentTarget.style.borderColor = 'rgba(0,255,135,0.25)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--bg-3)'
                    e.currentTarget.style.color = 'var(--text-2)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                >
                  {'+'} Save
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 10, padding: '14px 16px',
              marginBottom: 28,
              cursor: isLongDesc ? 'pointer' : 'default',
            }}
            onClick={() => isLongDesc && setShowFullDesc(p => !p)}
          >
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>
              {formatViews(video.views || 0)} views · {timeAgo(video.createdAt)}
              {realDuration && (
                <span style={{ marginLeft: 8 }}>· {formatDuration(realDuration)}</span>
              )}
            </div>
            <p style={{
              fontSize: 14, color: 'var(--text-2)',
              lineHeight: 1.7, whiteSpace: 'pre-wrap',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: showFullDesc ? 'unset' : 3,
              WebkitBoxOrient: 'vertical',
            }}>
              {video.description}
            </p>
            {isLongDesc && (
              <div style={{
                fontSize: 13, fontWeight: 600,
                color: 'var(--accent)', marginTop: 8,
              }}>
                {showFullDesc ? 'Show less' : 'Show more'}
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <h2 style={{
              fontSize: 18, fontWeight: 700,
              marginBottom: 20, color: 'var(--text)',
            }}>
              {comments.length} Comment{comments.length !== 1 ? 's' : ''}
            </h2>

            {user ? (
              <form onSubmit={handleComment} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <img
                    src={user.avatar}
                    className="avatar"
                    style={{ width: 36, height: 36, flexShrink: 0 }}
                    onError={e =>
                      e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=00c853&color=fff`
                    }
                  />
                  <div style={{ flex: 1 }}>
                    <input
                      className="input"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      style={{ marginBottom: 8 }}
                    />
                    {newComment && (
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          type="button" className="btn btn-ghost btn-sm"
                          onClick={() => setNewComment('')}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit" className="btn btn-primary btn-sm"
                          disabled={submitting}
                        >
                          {submitting
                            ? <span className="spinner" style={{ width: 13, height: 13 }} />
                            : 'Comment'
                          }
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            ) : (
              <div style={{
                padding: '14px 16px',
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: 8, marginBottom: 24,
                fontSize: 14, color: 'var(--text-3)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span>Sign in to leave a comment</span>
                <button
                  onClick={() => navigate('/login')}
                  className="btn btn-primary btn-sm"
                >
                  Sign In
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {comments.length === 0 ? (
                <p style={{ color: 'var(--text-3)', fontSize: 14 }}>
                  No comments yet — be the first!
                </p>
              ) : (
                comments.map(c => (
                  <div key={c._id} style={{ display: 'flex', gap: 12 }}>
                    <img
                      src={c.owner?.avatar}
                      className="avatar"
                      style={{ width: 34, height: 34, flexShrink: 0 }}
                      onError={e =>
                        e.target.src = `https://ui-avatars.com/api/?name=${c.owner?.username || 'U'}&background=333&color=fff`
                      }
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        gap: 8, marginBottom: 4,
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                          @{c.owner?.username}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                          {timeAgo(c.createdAt)}
                        </span>
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
                        {c.content}
                      </p>
                      {user && c.owner?._id === user._id && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{
                            marginTop: 4, fontSize: 12,
                            color: 'var(--red)', padding: '2px 8px',
                          }}
                          onClick={() => handleDeleteComment(c._id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ position: 'sticky', top: 20 }}>
          {relatedVideos.length > 0 ? (
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 12, paddingLeft: 4,
              }}>
                More from @{owner.username}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {relatedVideos.map(rv => (
                  <SideVideoCard
                    key={rv._id}
                    video={rv}
                    onClick={(id) => navigate(`/watch/${id}`)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              padding: '24px 16px',
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 12, textAlign: 'center',
              color: 'var(--text-3)', fontSize: 13,
            }}>
              No other videos from this channel yet
            </div>
          )}
        </div>

      </div>

      {/* Add to playlist modal */}
      {showPlaylistModal && (
        <AddToPlaylist
          videoId={videoId}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}

    </div>
  )
}
