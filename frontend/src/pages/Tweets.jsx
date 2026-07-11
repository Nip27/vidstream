import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago'
  if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago'
  return Math.floor(diff / 2592000) + 'mo ago'
}

function TweetCard({ tweet, currentUser, onDelete, onUpdate, onLike }) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(tweet.content)
  const isOwner = currentUser && tweet.ownerDetails?._id === currentUser._id

  const handleUpdate = async () => {
    await onUpdate(tweet._id, editContent)
    setEditing(false)
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link to={`/channel/${tweet.ownerDetails?.username}`}>
          <img
            src={tweet.ownerDetails?.avatar}
            className="avatar"
            style={{ width: 44, height: 44, flexShrink: 0 }}
            onError={e => e.target.src = `https://ui-avatars.com/api/?name=${tweet.ownerDetails?.username || 'U'}&background=444&color=fff`}
          />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link
                to={`/channel/${tweet.ownerDetails?.username}`}
                style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}
              >
                {tweet.ownerDetails?.fullName}
              </Link>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                @{tweet.ownerDetails?.username}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>·</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {timeAgo(tweet.createdAt)}
              </span>
            </div>
          </div>

          {editing ? (
            <div>
              <textarea
                className="input"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                style={{ minHeight: 80, marginBottom: 8 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={handleUpdate}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text)', marginBottom: 12 }}>
              {tweet.content}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{
                color: tweet.isLiked ? 'var(--accent)' : 'var(--text-3)',
                padding: '4px 10px',
              }}
              onClick={() => onLike(tweet._id, tweet.isLiked)}
            >
              ♥ {tweet.likesCount || 0}
            </button>

            {isOwner && !editing && (
              <>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--text-3)', padding: '4px 10px', fontSize: 12 }}
                  onClick={() => setEditing(true)}
                >Edit</button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--red)', padding: '4px 10px', fontSize: 12 }}
                  onClick={() => onDelete(tweet._id)}
                >Delete</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Tweets() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('feed')
  const [feedTweets, setFeedTweets] = useState([])
  const [myTweets, setMyTweets] = useState([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (!user) return setLoading(false)
    fetchAll()
  }, [user])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [feedRes, myRes] = await Promise.all([
        api.get('/tweets/feed'),
        api.get(`/tweets/user/${user._id}`),
      ])
      setFeedTweets(feedRes.data.data || [])
      setMyTweets(myRes.data.data || [])
    } catch {
      toast.error('Failed to load tweets')
    } finally {
      setLoading(false)
    }
  }

  const postTweet = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setPosting(true)
    try {
      const res = await api.post('/tweets', { content })
      const newTweet = {
        ...res.data.data,
        ownerDetails: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
          fullName: user.fullName,
        },
        likesCount: 0,
        isLiked: false,
      }
      setMyTweets(p => [newTweet, ...p])
      setFeedTweets(p => [newTweet, ...p])
      setContent('')
      toast.success('Posted!')
    } catch {
      toast.error('Failed to post')
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async (tweetId) => {
    if (!confirm('Delete this post?')) return
    try {
      await api.delete(`/tweets/${tweetId}`)
      setMyTweets(p => p.filter(t => t._id !== tweetId))
      setFeedTweets(p => p.filter(t => t._id !== tweetId))
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleUpdate = async (tweetId, newContent) => {
    try {
      const res = await api.patch(`/tweets/${tweetId}`, { content: newContent })
      const updated = res.data.data
      setMyTweets(p => p.map(t => t._id === tweetId ? { ...t, ...updated } : t))
      setFeedTweets(p => p.map(t => t._id === tweetId ? { ...t, ...updated } : t))
      toast.success('Updated!')
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleLike = async (tweetId, isLiked) => {
    try {
      await api.post(`/likes/toggle/t/${tweetId}`)
      const update = (tweets) => tweets.map(t =>
        t._id === tweetId
          ? { ...t, isLiked: !isLiked, likesCount: isLiked ? t.likesCount - 1 : t.likesCount + 1 }
          : t
      )
      setFeedTweets(update)
      setMyTweets(update)
    } catch {}
  }

  const tweets = activeTab === 'feed' ? feedTweets : myTweets

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <span className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  )

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="page-header">
        <h1>Community ✦</h1>
        <p>Posts from channels you follow</p>
      </div>

      {/* Compose box */}
      {user && (
        <div style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
          marginBottom: 24,
        }}>
          <form onSubmit={postTweet}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <img
                src={user.avatar}
                className="avatar"
                style={{ width: 40, height: 40, marginTop: 2, flexShrink: 0 }}
                onError={e => e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=f97316&color=fff`}
              />
              <div style={{ flex: 1 }}>
                <textarea
                  className="input"
                  placeholder="Share something with your community..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  style={{ minHeight: 80, resize: 'none', marginBottom: 10 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{content.length} chars</span>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={posting || !content.trim()}
                  >
                    {posting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 4,
        marginBottom: 20,
      }}>
        {[
          { key: 'feed', label: `Following (${feedTweets.length})` },
          { key: 'mine', label: `My Posts (${myTweets.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="btn"
            style={{
              flex: 1, justifyContent: 'center',
              background: activeTab === tab.key ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--text-2)',
              border: 'none',
              fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tweets list */}
      {tweets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✦</div>
          <h3>
            {activeTab === 'feed'
              ? 'No posts from people you follow'
              : 'You have no posts yet'
            }
          </h3>
          <p>
            {activeTab === 'feed'
              ? 'Subscribe to channels to see their posts here'
              : 'Share something with your community!'
            }
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tweets.map((t, i) => (
            <div key={t._id} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
              <TweetCard
                tweet={t}
                currentUser={user}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onLike={handleLike}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}