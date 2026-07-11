import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Watch from './pages/Watch'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Settings from './pages/Settings'
import LikedVideos from './pages/LikedVideos'
import Subscriptions from './pages/Subscriptions'
import Playlists from './pages/Playlists'
import PlaylistDetail from './pages/PlaylistDetail'
import Tweets from './pages/Tweets'
import Channel from './pages/Channel'

function AppLayout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  )
}

function ProfileRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={`/channel/${user.username}`} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<AppLayout><Home /></AppLayout>} />
      <Route path="/watch/:videoId" element={<AppLayout><Watch /></AppLayout>} />
      <Route path="/channel/:username" element={<AppLayout><Channel /></AppLayout>} />
      <Route path="/playlist/:playlistId" element={<AppLayout><PlaylistDetail /></AppLayout>} />
      <Route path="/dashboard" element={<AppLayout><ProtectedRoute><Dashboard /></ProtectedRoute></AppLayout>} />
      <Route path="/upload" element={<AppLayout><ProtectedRoute><Upload /></ProtectedRoute></AppLayout>} />
      <Route path="/settings" element={<AppLayout><ProtectedRoute><Settings /></ProtectedRoute></AppLayout>} />
      <Route path="/liked" element={<AppLayout><ProtectedRoute><LikedVideos /></ProtectedRoute></AppLayout>} />
      <Route path="/subscriptions" element={<AppLayout><ProtectedRoute><Subscriptions /></ProtectedRoute></AppLayout>} />
      <Route path="/playlists" element={<AppLayout><ProtectedRoute><Playlists /></ProtectedRoute></AppLayout>} />
      <Route path="/tweets" element={<AppLayout><ProtectedRoute><Tweets /></ProtectedRoute></AppLayout>} />
      <Route path="/profile" element={<AppLayout><ProtectedRoute><ProfileRedirect /></ProtectedRoute></AppLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#f5f5f5',
              border: '1px solid #2a2a2a',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#f97316', secondary: '#0a0a0a' } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
