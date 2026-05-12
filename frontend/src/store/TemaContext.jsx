import { createContext, useContext, useState, useEffect } from 'react'

const TemaContext = createContext(null)

const TEMA_PREDETERMINADO = {
  primaryColor: 'green',
  customColor: '',
  layout: 'sidebar',
  compacto: false,
  fontSize: 'md',
  animaciones: true,
  fondo: 'default',
}

export function TemaProvider({ children }) {
  const [tema, setTema] = useState(() => {
    try {
      const saved = localStorage.getItem('agrop_tema')
      return saved ? { ...TEMA_PREDETERMINADO, ...JSON.parse(saved) } : TEMA_PREDETERMINADO
    } catch { return TEMA_PREDETERMINADO }
  })

  useEffect(() => {
    localStorage.setItem('agrop_tema', JSON.stringify(tema))
    const primary = tema.customColor || `var(--mantine-color-${tema.primaryColor}-6)`
    document.documentElement.style.setProperty('--app-primary', primary)
    if (tema.fontSize) {
      document.documentElement.style.setProperty('--app-font-size', tema.fontSize === 'sm' ? '14px' : tema.fontSize === 'lg' ? '18px' : '16px')
    }
    document.documentElement.style.setProperty('--app-animations', tema.animaciones ? 'all 0.3s ease' : 'none')
  }, [tema])

  const actualizarTema = (changes) => setTema(prev => ({ ...prev, ...changes }))

  return <TemaContext.Provider value={{ tema, actualizarTema }}>{children}</TemaContext.Provider>
}

export const useTema = () => {
  const ctx = useContext(TemaContext)
  if (!ctx) throw new Error('useTema must be used within TemaProvider')
  return ctx
}
