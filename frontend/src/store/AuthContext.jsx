import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('agrop_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('agrop_token'))
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('agrop_token', data.access_token)
      localStorage.setItem('agrop_user', JSON.stringify(data.usuario))
      setToken(data.access_token)
      setUser(data.usuario)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.response?.data?.detail || 'Error de conexión' }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('agrop_token')
    localStorage.removeItem('agrop_user')
    setToken(null)
    setUser(null)
  }, [])

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
