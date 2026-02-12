import axios from 'axios'

// Em produção (servido pela WebApi): usa URL relativa /api/v1
// Em dev: usa localhost para falha segura se VITE_API_URL não for definido
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '/api/v1' : 'http://localhost:5011/api/v1'),
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export { api }
