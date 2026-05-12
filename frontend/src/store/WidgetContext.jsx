import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import { useAuth } from './AuthContext'

const STORAGE_KEY = 'agrop_widgets'

export const WIDGETS_DISPONIBLES = [
  { id: 'resumen_financiero', title: 'Resumen Financiero', icon: 'IconCoin', defaultWidth: 'full', roles: ['admin', 'contador'] },
  { id: 'salud_hato', title: 'Salud del Hato', icon: 'IconHeart', defaultWidth: 'half', roles: ['admin', 'veterinario'] },
  { id: 'cultivos_activos', title: 'Cultivos Activos', icon: 'IconPlant', defaultWidth: 'half', roles: ['admin', 'agronomo'] },
  { id: 'inventario_critico', title: 'Inventario Crítico', icon: 'IconPackage', defaultWidth: 'half', roles: ['admin', 'contador'] },
  { id: 'proximas_actividades', title: 'Próximas Actividades', icon: 'IconCalendarEvent', defaultWidth: 'half', roles: ['admin', 'capataz'] },
  { id: 'alertas_recientes', title: 'Alertas Recientes', icon: 'IconBell', defaultWidth: 'half', roles: ['admin', 'veterinario', 'capataz', 'agronomo'] },
  { id: 'clima', title: 'Clima', icon: 'IconCloud', defaultWidth: 'half', roles: ['admin', 'agronomo'] },
  { id: 'mapa_rapido', title: 'Mapa de Lotes', icon: 'IconMap', defaultWidth: 'full', roles: ['admin', 'agronomo', 'capataz'] },
  { id: 'actividad_reciente', title: 'Actividad Reciente', icon: 'IconActivity', defaultWidth: 'full', roles: ['admin'] },
  { id: 'equipo_trabajo', title: 'Equipo de Trabajo', icon: 'IconUsers', defaultWidth: 'half', roles: ['admin', 'capataz'] },
  { id: 'produccion', title: 'Producción', icon: 'IconDroplet', defaultWidth: 'half', roles: ['admin', 'veterinario'] },
  { id: 'eficiencia', title: 'Eficiencia', icon: 'IconGauge', defaultWidth: 'half', roles: ['admin'] },
]

const DEFAULT_WIDGETS = {
  admin: ['resumen_financiero', 'salud_hato', 'cultivos_activos', 'alertas_recientes', 'proximas_actividades', 'clima', 'actividad_reciente'],
  veterinario: ['salud_hato', 'alertas_recientes', 'proximas_actividades', 'produccion'],
  capataz: ['proximas_actividades', 'equipo_trabajo', 'mapa_rapido', 'cultivos_activos', 'alertas_recientes'],
  contador: ['resumen_financiero', 'inventario_critico', 'alertas_recientes'],
  agronomo: ['cultivos_activos', 'mapa_rapido', 'clima', 'proximas_actividades', 'alertas_recientes'],
  asistente: ['proximas_actividades', 'alertas_recientes'],
}

function loadFromStorage(role) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.activeWidgets && Array.isArray(parsed.activeWidgets)) {
        return { activeWidgets: parsed.activeWidgets, hiddenWidgets: parsed.hiddenWidgets || [] }
      }
    }
  } catch {}
  return getDefaults(role)
}

function getDefaults(role) {
  return {
    activeWidgets: DEFAULT_WIDGETS[role] || DEFAULT_WIDGETS.admin,
    hiddenWidgets: [],
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

const WidgetContext = createContext(null)

export function WidgetProvider({ children, role: explicitRole }) {
  const { role: authRole } = useAuth()
  const role = explicitRole || authRole || 'admin'

  const [widgets, setWidgets] = useState(() => loadFromStorage(role))

  useEffect(() => {
    saveToStorage(widgets)
  }, [widgets])

  const availableWidgets = useMemo(() => {
    return WIDGETS_DISPONIBLES.filter(w => w.roles.includes(role))
  }, [role])

  const activeWidgets = useMemo(() => {
    return widgets.activeWidgets.filter(id => {
      const def = WIDGETS_DISPONIBLES.find(w => w.id === id)
      if (!def) return false
      if (widgets.hiddenWidgets.includes(id)) return false
      return def.roles.includes(role)
    })
  }, [widgets, role])

  const addWidget = useCallback((widgetId) => {
    setWidgets(prev => {
      if (prev.activeWidgets.includes(widgetId)) return prev
      return { ...prev, activeWidgets: [...prev.activeWidgets, widgetId] }
    })
  }, [])

  const removeWidget = useCallback((widgetId) => {
    setWidgets(prev => {
      if (prev.hiddenWidgets.includes(widgetId)) return prev
      return { ...prev, hiddenWidgets: [...prev.hiddenWidgets, widgetId] }
    })
  }, [])

  const reorderWidgets = useCallback((widgetId, direction) => {
    setWidgets(prev => {
      const idx = prev.activeWidgets.indexOf(widgetId)
      if (idx === -1) return prev
      const newOrder = [...prev.activeWidgets]
      const target = idx + direction
      if (target < 0 || target >= newOrder.length) return prev
      ;[newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]]
      return { ...prev, activeWidgets: newOrder }
    })
  }, [])

  const showWidget = useCallback((widgetId) => {
    setWidgets(prev => ({
      ...prev,
      hiddenWidgets: prev.hiddenWidgets.filter(id => id !== widgetId),
    }))
  }, [])

  const resetDefaults = useCallback(() => {
    setWidgets(getDefaults(role))
  }, [role])

  return (
    <WidgetContext.Provider value={{
      activeWidgets,
      availableWidgets,
      allWidgets: WIDGETS_DISPONIBLES,
      addWidget,
      removeWidget,
      reorderWidgets,
      showWidget,
      resetDefaults,
      hiddenWidgets: widgets.hiddenWidgets,
      isHidden: (id) => widgets.hiddenWidgets.includes(id),
      isActive: (id) => widgets.activeWidgets.includes(id),
    }}>
      {children}
    </WidgetContext.Provider>
  )
}

export function useWidgets() {
  const ctx = useContext(WidgetContext)
  if (!ctx) throw new Error('useWidgets must be used within WidgetProvider')
  return ctx
}
