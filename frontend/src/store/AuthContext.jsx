import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import api from '../services/api.js'

const ROLE_MAP = {
  'dueño': 'admin', 'administrador': 'admin', 'admin': 'admin',
  'veterinario': 'veterinario',
  'capataz': 'capataz',
  'contador': 'contador',
  'asistente': 'asistente',
}

const ROLE_ID_MAP = { 1: 'admin', 2: 'veterinario', 3: 'capataz', 4: 'contador', 5: 'asistente' }

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('agrop_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('agrop_token'))
  const [loading, setLoading] = useState(false)

  const role = useMemo(() => {
    if (!user) return null
    const fromNombre = user.rol?.nombre?.toLowerCase()
    if (fromNombre && ROLE_MAP[fromNombre]) return ROLE_MAP[fromNombre]
    if (user.rol_id && ROLE_ID_MAP[user.rol_id]) return ROLE_ID_MAP[user.rol_id]
    return 'admin'
  }, [user])

  const isAdmin = role === 'admin'

  const [activeRole, setActiveRole] = useState(() => {
    const saved = localStorage.getItem('agrop_active_role')
    return saved || role
  })

  useEffect(() => {
    if (!activeRole || role !== 'admin') {
      setActiveRole(role)
    }
  }, [role])

  useEffect(() => {
    if (activeRole) {
      localStorage.setItem('agrop_active_role', activeRole)
    } else {
      localStorage.removeItem('agrop_active_role')
    }
  }, [activeRole])

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
    localStorage.removeItem('agrop_active_role')
    setToken(null)
    setUser(null)
    setActiveRole(null)
  }, [])

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{
      user, token, isAuthenticated, login, logout, loading,
      role, activeRole, setActiveRole, isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
