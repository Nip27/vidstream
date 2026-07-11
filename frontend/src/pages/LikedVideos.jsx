import { useState, useEffect } from 'react'
import api from '../utils/api'
import VideoCard from '../components/VideoCard'
import toast from 'react-hot-toast'

export default function LikedVideos() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/likes/videos')
      .then(res => {
        const data = res.data.data || []
        setVideos(data.map(item => item.likedVideo || item))
      })
      .catch(() => toast.error('Failed to load liked videos'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <span className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <h1>Liked Videos</h1>
        <p>{videos.length} video{videos.length !== 1 ? 's' : ''} you liked</p>
      </div>

      {videos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">♥</div>
          <h3>No liked videos yet</h3>
          <p>Videos you like will appear here</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((v, i) => v && (
            <div key={v._id} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
              <VideoCard video={v} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
