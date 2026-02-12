import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useState, useEffect } from 'react'
import {
    Menu, X, Home, User, Repeat, Search, Bell, LogOut,
    BookOpen, ChevronDown, MessageCircle
} from 'lucide-react'
import api from '../services/api'

export default function Layout() {
    const { user, isAuthenticated, logout, checkAuth } = useAuthStore()
    const navigate = useNavigate()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [unreadNotifications, setUnreadNotifications] = useState(0)
    const [unreadMessages, setUnreadMessages] = useState(0)

    useEffect(() => {
        checkAuth()
    }, [checkAuth])

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications()
        }
    }, [isAuthenticated])

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications?unreadOnly=true')
            setUnreadNotifications(response.data.data.unreadCount)
        } catch (error) {
            console.error('Error fetching notifications:', error)
        }
    }

    const fetchUnreadMessages = async () => {
        try {
            const response = await api.get('/chat/conversations')
            setUnreadMessages(response.data.unreadCount || 0)
        } catch (error) {
            console.error('Error fetching messages:', error)
        }
    }

    useEffect(() => {
        if (isAuthenticated) {
            fetchUnreadMessages()
            const interval = setInterval(fetchUnreadMessages, 10000)
            return () => clearInterval(interval)
        }
    }, [isAuthenticated])

    const handleLogout = () => {
        logout()
        navigate('/')
        setUserMenuOpen(false)
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                                <Repeat className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-bold text-xl text-gray-900 hidden sm:block">
                                TrocadorFigurinhas
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-6">
                            <Link to="/" className="text-gray-600 hover:text-primary-600 flex items-center gap-2">
                                <Home className="w-4 h-4" />
                                Início
                            </Link>
                            {isAuthenticated && (
                                <>
                                    <Link to="/my-collection" className="text-gray-600 hover:text-primary-600 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" />
                                        Minha Coleção
                                    </Link>
                                    <Link to="/find-matches" className="text-gray-600 hover:text-primary-600 flex items-center gap-2">
                                        <Search className="w-4 h-4" />
                                        Encontrar Trocas
                                    </Link>
                                    <Link to="/trades" className="text-gray-600 hover:text-primary-600 flex items-center gap-2">
                                        <Repeat className="w-4 h-4" />
                                        Minhas Trocas
                                    </Link>
                                </>
                            )}
                        </nav>

                        {/* Right side */}
                        <div className="flex items-center space-x-4">
                            {isAuthenticated ? (
                                <>
                                    {/* Messages */}
                                    <Link to="/chat" className="relative p-2 text-gray-600 hover:text-primary-600">
                                        <MessageCircle className="w-5 h-5" />
                                        {unreadMessages > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-xs text-white flex items-center justify-center">
                                                {unreadMessages > 9 ? '9+' : unreadMessages}
                                            </span>
                                        )}
                                    </Link>

                                    {/* Notifications */}
                                    <button className="relative p-2 text-gray-600 hover:text-primary-600">
                                        <Bell className="w-5 h-5" />
                                        {unreadNotifications > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                                                {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                            </span>
                                        )}
                                    </button>

                                    {/* User Menu */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                                            className="flex items-center space-x-2 text-gray-600 hover:text-primary-600"
                                        >
                                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                                {user?.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                                                ) : (
                                                    <User className="w-4 h-4 text-primary-600" />
                                                )}
                                            </div>
                                            <span className="hidden sm:block font-medium">{user?.nickname}</span>
                                            <ChevronDown className="w-4 h-4" />
                                        </button>

                                        {userMenuOpen && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 animate-fadeIn">
                                                <Link
                                                    to="/profile"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                                                >
                                                    <User className="w-4 h-4 inline mr-2" />
                                                    Meu Perfil
                                                </Link>
                                                <hr className="my-1" />
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                                                >
                                                    <LogOut className="w-4 h-4 inline mr-2" />
                                                    Sair
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Link to="/login" className="btn-secondary text-sm">
                                        Entrar
                                    </Link>
                                    <Link to="/register" className="btn-primary text-sm">
                                        Cadastrar
                                    </Link>
                                </div>
                            )}

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 text-gray-600"
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-100 bg-white animate-fadeIn">
                        <div className="px-4 py-3 space-y-2">
                            <Link
                                to="/"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
                            >
                                <Home className="w-4 h-4 inline mr-2" />
                                Início
                            </Link>
                            {isAuthenticated && (
                                <>
                                    <Link
                                        to="/my-collection"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
                                    >
                                        <BookOpen className="w-4 h-4 inline mr-2" />
                                        Minha Coleção
                                    </Link>
                                    <Link
                                        to="/find-matches"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
                                    >
                                        <Search className="w-4 h-4 inline mr-2" />
                                        Encontrar Trocas
                                    </Link>
                                    <Link
                                        to="/trades"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
                                    >
                                        <Repeat className="w-4 h-4 inline mr-2" />
                                        Minhas Trocas
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-2 mb-4 md:mb-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                                <Repeat className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-white">TrocadorFigurinhas</span>
                        </div>
                        <p className="text-sm">
                            © {new Date().getFullYear()} TrocadorFigurinhas. Projeto criado para fins educacionais.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
