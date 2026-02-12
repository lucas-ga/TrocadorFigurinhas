import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage)
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Ocorreu um erro inesperado'
    
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
      toast.error('Sessão expirada. Faça login novamente.')
    } else if (error.response?.status === 403) {
      toast.error('Você não tem permissão para realizar esta ação')
    } else if (error.response?.status >= 500) {
      toast.error('Erro no servidor. Tente novamente mais tarde.')
    } else {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

export default api
