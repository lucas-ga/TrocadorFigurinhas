import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import MyCollection from './pages/MyCollection'
import FindMatches from './pages/FindMatches'
import Trades from './pages/Trades'
import Profile from './pages/Profile'
import UserProfile from './pages/UserProfile'
import Chat from './pages/Chat'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore()
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="user/:nickname" element={<UserProfile />} />

                    {/* Protected Routes */}
                    <Route path="my-collection" element={
                        <ProtectedRoute><MyCollection /></ProtectedRoute>
                    } />
                    <Route path="find-matches" element={
                        <ProtectedRoute><FindMatches /></ProtectedRoute>
                    } />
                    <Route path="trades" element={
                        <ProtectedRoute><Trades /></ProtectedRoute>
                    } />
                    <Route path="profile" element={
                        <ProtectedRoute><Profile /></ProtectedRoute>
                    } />
                    <Route path="chat" element={
                        <ProtectedRoute><Chat /></ProtectedRoute>
                    } />
                    <Route path="chat/:conversationId" element={
                        <ProtectedRoute><Chat /></ProtectedRoute>
                    } />
                    <Route path="chat/user/:nickname" element={
                        <ProtectedRoute><Chat /></ProtectedRoute>
                    } />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
