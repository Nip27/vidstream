import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'

function formatDuration(secs) {
  if (!secs) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function Upload() {
  const navigate = useNavigate()
  const [uploadMode, setUploadMode] = useState('file')
  const [form, setForm] = useState({ title: '', description: '' })
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [detectedDuration, setDetectedDuration] = useState(null)
  const [detectingDuration, setDetectingDuration] = useState(false)
  const [urlValid, setUrlValid] = useState(null)

  const handleThumbnail = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setThumbnail(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const detectDurationFromFile = (file) => {
    setDetectingDuration(true)
    setDetectedDuration(null)
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = url
    video.onloadedmetadata = () => {
      const secs = Math.floor(video.duration)
      setDetectedDuration(secs)
      setDetectingDuration(false)
      URL.revokeObjectURL(url)
    }
    video.onerror = () => {
      setDetectingDuration(false)
      URL.revokeObjectURL(url)
    }
  }

  const detectDurationFromUrl = (url) => {
    if (!url.trim()) return
    setDetectingDuration(true)
    setDetectedDuration(null)
    setUrlValid(null)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.crossOrigin = 'anonymous'
    video.src = url
    video.onloadedmetadata = () => {
      const secs = Math.floor(video.duration)
      setDetectedDuration(secs)
      setDetectingDuration(false)
      setUrlValid(true)
    }
    video.onerror = () => {
      setDetectingDuration(false)
      setUrlValid(true)
      setDetectedDuration(null)
    }
    setTimeout(() => {
      setDetectingDuration(false)
      if (!urlValid) setUrlValid(true)
    }, 8000)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setVideoFile(file)
    detectDurationFromFile(file)
  }

  const handleUrlChange = (e) => {
    setVideoUrl(e.target.value)
    setUrlValid(null)
    setDetectedDuration(null)
  }

  const handleUrlBlur = () => {
    if (videoUrl.trim()) detectDurationFromUrl(videoUrl.trim())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (uploadMode === 'file') {
      if (!videoFile) return toast.error('Please select a video file')
      if (!thumbnail) return toast.error('Please select a thumbnail')
      if (!form.title.trim()) return toast.error('Title is required')
    } else {
      if (!videoUrl.trim()) return toast.error('Please enter a video URL')
      if (!form.title.trim()) return toast.error('Title is required')
    }

    setLoading(true)

    try {
      if (uploadMode === 'file') {
        const fd = new FormData()
        fd.append('title', form.title)
        fd.append('description', form.description || '')
        fd.append('videoFile', videoFile)
        fd.append('thumbnail', thumbnail)

        const res = await api.post('/videos', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            setProgress(Math.round((e.loaded * 100) / e.total))
          }
        })
        toast.success('Video uploaded successfully!')
        navigate(`/watch/${res.data.data._id}`)

      } else {
        const fd = new FormData()
        fd.append('title', form.title)
        fd.append('description', form.description || '')
        fd.append('videoUrl', videoUrl.trim())
        fd.append('duration', detectedDuration || 0)
        if (thumbnail) fd.append('thumbnail', thumbnail)

        const res = await api.post('/videos/url', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Video added successfully!')
        navigate(`/watch/${res.data.data._id}`)
      }
    } catch (err) {
      console.error('Upload error:', err)
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="page-header">
        <h1>Upload Video</h1>
        <p>Share your content with the world</p>
      </div>

      {/* Mode toggle */}
      <div style={{
        display: 'flex', gap: 4,
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 4, marginBottom: 24,
      }}>
        {[
          { key: 'file', label: '📁 Upload File' },
          { key: 'url', label: '🔗 Use URL' },
        ].map(mode => (
          <button
            key={mode.key}
            onClick={() => {
              setUploadMode(mode.key)
              setDetectedDuration(null)
              setUrlValid(null)
            }}
            style={{
              flex: 1, padding: '9px',
              borderRadius: 7, border: 'none',
              background: uploadMode === mode.key ? 'var(--accent)' : 'transparent',
              color: uploadMode === mode.key ? 'var(--text-on-accent)' : 'var(--text-2)',
              fontWeight: uploadMode === mode.key ? 700 : 400,
              fontSize: 13, cursor: 'pointer',
              transition: 'all 0.18s',
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* File upload mode */}
        {uploadMode === 'file' && (
          <label style={{ cursor: 'pointer' }}>
            <div style={{
              border: `2px dashed ${videoFile ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '36px 24px', textAlign: 'center',
              background: videoFile ? 'var(--accent-glow)' : 'var(--bg-2)',
              transition: 'all 0.2s',
            }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🎬</div>
              {videoFile ? (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>
                    {videoFile.name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                    {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                    {detectedDuration && (
                      <span style={{ color: 'var(--accent)', marginLeft: 10 }}>
                        · {formatDuration(detectedDuration)}
                      </span>
                    )}
                    {detectingDuration && (
                      <span style={{ color: 'var(--text-3)', marginLeft: 10 }}>
                        · Detecting duration...
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>
                    Click to select video file
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                    MP4, WebM, MOV supported
                  </div>
                </>
              )}
            </div>
            <input
              type="file" accept="video/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>
        )}

        {/* URL mode */}
        {uploadMode === 'url' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="input-group">
              <label>Video URL</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type="url"
                  placeholder="https://drive.google.com/... or any direct video URL"
                  value={videoUrl}
                  onChange={handleUrlChange}
                  onBlur={handleUrlBlur}
                  style={{
                    paddingRight: 40,
                    borderColor: urlValid === true
                      ? 'var(--accent)'
                      : urlValid === false
                        ? 'var(--red)'
                        : 'var(--border)',
                  }}
                />
                <div style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', fontSize: 16,
                }}>
                  {detectingDuration && (
                    <span className="spinner" style={{ width: 14, height: 14 }} />
                  )}
                  {!detectingDuration && urlValid === true && (
                    <span style={{ color: 'var(--accent)' }}>{'✓'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Duration feedback */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px',
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 8, fontSize: 13,
            }}>
              {detectingDuration ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                  <span style={{ color: 'var(--text-3)' }}>Detecting duration...</span>
                </>
              ) : detectedDuration ? (
                <>
                  <span style={{ color: 'var(--accent)' }}>{'✓'}</span>
                  <span style={{ color: 'var(--text)' }}>
                    Duration: <strong>{formatDuration(detectedDuration)}</strong>
                  </span>
                </>
              ) : (
                <span style={{ color: 'var(--text-3)' }}>
                  Paste URL — duration will be detected automatically
                </span>
              )}
            </div>

            {/* Info box */}
            <div style={{
              padding: '10px 14px',
              background: 'var(--accent-glow)',
              border: '1px solid rgba(0,255,135,0.15)',
              borderRadius: 8, fontSize: 12,
              color: 'var(--text-2)', lineHeight: 1.7,
            }}>
              <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: 4 }}>
                Supported URL types:
              </strong>
              {'▸'} Direct MP4 links (storage.googleapis.com/...mp4)<br />
              {'▸'} Google Drive share links (set to Anyone with link)<br />
              {'▸'} Cloudinary video URLs<br />
              {'▸'} Any publicly accessible video URL
            </div>
          </div>
        )}

        {/* Thumbnail */}
        <div className="input-group">
          <label>
            Thumbnail
            {uploadMode === 'url' && (
              <span style={{ color: 'var(--text-3)', fontWeight: 400, marginLeft: 6 }}>
                (optional)
              </span>
            )}
          </label>
          <label style={{ cursor: 'pointer' }}>
            <div style={{
              width: '100%', aspectRatio: '16/9', maxHeight: 180,
              border: `2px dashed ${thumbnail ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              overflow: 'hidden', background: 'var(--bg-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.2s',
            }}>
              {thumbnailPreview ? (
                <img
                  src={thumbnailPreview}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
                  <div style={{ fontSize: 13 }}>Click to upload thumbnail</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>16:9 ratio recommended</div>
                </div>
              )}
            </div>
            <input
              type="file" accept="image/*"
              style={{ display: 'none' }}
              onChange={handleThumbnail}
            />
          </label>
        </div>

        {/* Title */}
        <div className="input-group">
          <label>Title</label>
          <input
            className="input"
            type="text"
            placeholder="Give your video a title"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            required
          />
        </div>

        {/* Description */}
        <div className="input-group">
          <label>Description</label>
          <textarea
            className="input"
            placeholder="Tell viewers about your video"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            style={{ minHeight: 110 }}
          />
        </div>

        {/* Progress bar */}
        {loading && progress > 0 && uploadMode === 'file' && (
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 13, marginBottom: 6,
            }}>
              <span style={{ color: 'var(--text-2)' }}>Uploading to Cloudinary...</span>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{
              height: 5, background: 'var(--bg-3)',
              borderRadius: 3, overflow: 'hidden',
            }}>
              <div style={{
                width: `${progress}%`, height: '100%',
                background: 'var(--accent)', borderRadius: 3,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={loading}
          style={{ justifyContent: 'center' }}
        >
          {loading ? (
            <>
              <span className="spinner" />
              {uploadMode === 'file' ? 'Uploading...' : 'Adding video...'}
            </>
          ) : (
            uploadMode === 'file' ? 'Upload Video' : 'Add Video'
          )}
        </button>
      </form>
    </div>
  )
}
