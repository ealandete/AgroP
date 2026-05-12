import { createContext, useContext, useState, useEffect } from 'react'
import './traducciones.js'

const IDIOMAS = {
  es: { nombre: 'Español', bandera: '🇪🇸' },
  en: { nombre: 'English', bandera: '🇺🇸' },
}
const IdiomaContext = createContext(null)

export function IdiomaProvider({ children }) {
  const [idioma, setIdioma] = useState(() => localStorage.getItem('agrop_idioma') || 'es')

  useEffect(() => {
    localStorage.setItem('agrop_idioma', idioma)
  }, [idioma])

  const t = (key) => {
    const translations = globalThis.TRADUCCIONES
    return translations?.[idioma]?.[key] || translations?.['es']?.[key] || key
  }

  return <IdiomaContext.Provider value={{ idioma, setIdioma, t, IDIOMAS }}>{children}</IdiomaContext.Provider>
}

export const useIdioma = () => useContext(IdiomaContext)
