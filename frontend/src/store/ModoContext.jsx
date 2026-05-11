import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const ModoContext = createContext(null)

export function ModoProvider({ children }) {
  const [modoSencillo, setModoSencillo] = useState(() => {
    return localStorage.getItem('agrop_modo_sencillo') === 'true'
  })

  const toggleModoSencillo = useCallback(() => {
    setModoSencillo(prev => {
      const next = !prev
      localStorage.setItem('agrop_modo_sencillo', next.toString())
      return next
    })
  }, [])

  const value = useMemo(() => ({ modoSencillo, toggleModoSencillo }), [modoSencillo, toggleModoSencillo])

  return (
    <ModoContext.Provider value={value}>
      {children}
    </ModoContext.Provider>
  )
}

export function useModo() {
  const ctx = useContext(ModoContext)
  if (!ctx) throw new Error('useModo must be used within ModoProvider')
  return ctx
}
