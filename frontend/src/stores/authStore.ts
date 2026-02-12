import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

interface User {
    id: string
    email: string
    name: string
    nickname: string
    phone?: string
    city?: string
    state?: string
    avatarUrl?: string
    bio?: string
}

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (data: RegisterData) => Promise<void>
    logout: () => void
    updateUser: (data: Partial<User>) => void
    checkAuth: () => Promise<void>
}

interface RegisterData {
    email: string
    password: string
    name: string
    nickname: string
    phone?: string
    city?: string
    state?: string
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,

            login: async (email: string, password: string) => {
                set({ isLoading: true })
                try {
                    const response = await api.post('/auth/login', { email, password })
                    const { user, token } = response.data.data

                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false
                    })
                } catch (error) {
                    set({ isLoading: false })
                    throw error
                }
            },

            register: async (data: RegisterData) => {
                set({ isLoading: true })
                try {
                    const response = await api.post('/auth/register', data)
                    const { user, token } = response.data.data

                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false
                    })
                } catch (error) {
                    set({ isLoading: false })
                    throw error
                }
            },

            logout: () => {
                delete api.defaults.headers.common['Authorization']
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false
                })
            },

            updateUser: (data: Partial<User>) => {
                const currentUser = get().user
                if (currentUser) {
                    set({ user: { ...currentUser, ...data } })
                }
            },

            checkAuth: async () => {
                const { token } = get()
                if (!token) {
                    set({ isAuthenticated: false })
                    return
                }

                try {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
                    const response = await api.get('/users/me')
                    set({ user: response.data.data, isAuthenticated: true })
                } catch {
                    set({ user: null, token: null, isAuthenticated: false })
                }
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token })
        }
    )
)
