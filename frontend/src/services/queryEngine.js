const QUERY_HANDLERS = [
  {
    pattern: /cuantos\s*(animales|vacas|bovinos)/i,
    handler: async (api) => {
      const { data } = await api.get('/animales/', { params: { especie: 'bovino' } })
      return { text: `Tienes ${data.length} bovinos registrados.`, data }
    }
  },
  {
    pattern: /cuantos\s*(cerdos|porcinos)/i,
    handler: async (api) => {
      const { data } = await api.get('/animales/', { params: { especie: 'porcino' } })
      return { text: `Tienes ${data.length} porcinos registrados.`, data }
    }
  },
  {
    pattern: /cuantos\s*(caballos|equinos)/i,
    handler: async (api) => {
      const { data } = await api.get('/animales/', { params: { especie: 'equino' } })
      return { text: `Tienes ${data.length} equinos registrados.`, data }
    }
  },
  {
    pattern: /cuantos\s*(ovejas|ovinos)/i,
    handler: async (api) => {
      const { data } = await api.get('/animales/', { params: { especie: 'ovino' } })
      return { text: `Tienes ${data.length} ovinos registrados.`, data }
    }
  },
  {
    pattern: /cuantos\s*(pollos|aves|gallinas)/i,
    handler: async (api) => {
      const { data } = await api.get('/animales/', { params: { especie: 'aviar' } })
      return { text: `Tienes ${data.length} aves registradas.`, data }
    }
  },
  {
    pattern: /cuantos\s*(animales|total)/i,
    handler: async (api) => {
      const { data } = await api.get('/animales/')
      return { text: `Tienes ${data.length} animales en total.`, data }
    }
  },
  {
    pattern: /cuantas\s*alertas/i,
    handler: async (api) => {
      const { data } = await api.get('/alertas/', { params: { leida: false } })
      return { text: `Tienes ${data.length} alertas sin leer.`, data }
    }
  },
  {
    pattern: /balance\s*(del\s*)?(mes|m[eé]s)?/i,
    handler: async (api) => {
      const { data } = await api.get('/estadisticas/finanzas/ingresos-vs-gastos')
      const balance = (data?.ingresos || 0) - (data?.gastos || 0)
      return { text: `El balance del mes es $${balance.toLocaleString('es-CO')}`, data }
    }
  },
  {
    pattern: /resumen\s*(de\s*)?(la\s*)?finca/i,
    handler: async (api) => {
      const { data } = await api.get('/estadisticas/dashboard')
      return { text: `Resumen: ${data.total_animales} animales, ${data.total_siembras_activas} cultivos activos, ${data.total_bovinos} bovinos.`, data }
    }
  },
  {
    pattern: /pr[oó]ximas\s*vacunas|vacunaci[oó]n/i,
    handler: async (api) => {
      const { data } = await api.get('/plan-actividades/', { params: { tipo: 'vacunacion', estado: 'programado' } })
      return { text: `Hay ${data.length} vacunaciones programadas.`, data }
    }
  },
  {
    pattern: /cultivos\s*(activos)?/i,
    handler: async (api) => {
      const { data } = await api.get('/cultivos/', { params: { estado: 'activo' } })
      return { text: `Tienes ${data.length} cultivos activos.`, data }
    }
  },
  {
    pattern: /(list[ao]|muestra|dime)\s*(de\s*)?(los\s*)?(animales|vacas|bovinos)/i,
    handler: async (api) => {
      const { data } = await api.get('/animales/', { params: { especie: 'bovino' } })
      const items = data.slice(0, 10).map(a => `• ${a.codigo}${a.nombre ? ' - ' + a.nombre : ''}${a.raza ? ' (' + a.raza + ')' : ''}`).join('\n')
      return { text: `Últimos ${Math.min(data.length, 10)} bovinos:\n${items}${data.length > 10 ? `\n... y ${data.length - 10} más` : ''}`, data }
    }
  },
  {
    pattern: /pr[oó]ximas\s*(actividades|tareas|eventos)/i,
    handler: async (api) => {
      const { data } = await api.get('/plan-actividades/', { params: { estado: 'programado' } })
      const items = data.slice(0, 10).map(a => `• ${a.titulo || a.nombre || 'Actividad'}: ${a.fecha_programada || ''}`).join('\n')
      return { text: `Próximas actividades (${data.length}):\n${items}${data.length > 10 ? `\n... y ${data.length - 10} más` : ''}`, data }
    }
  },
  {
    pattern: /(eventos|pesajes)\s*(pendientes|recientes)/i,
    handler: async (api) => {
      const { data } = await api.get('/animales/eventos/', { params: { estado: 'pendiente' } })
      return { text: `Tienes ${data.length} eventos pendientes.`, data }
    }
  },
  {
    pattern: /gastos\s*(del\s*)?(mes|m[eé]s)?/i,
    handler: async (api) => {
      const { data } = await api.get('/estadisticas/finanzas/ingresos-vs-gastos')
      return { text: `Los gastos del mes son $${(data?.gastos || 0).toLocaleString('es-CO')}`, data }
    }
  },
  {
    pattern: /ingresos\s*(del\s*)?(mes|m[eé]s)?/i,
    handler: async (api) => {
      const { data } = await api.get('/estadisticas/finanzas/ingresos-vs-gastos')
      return { text: `Los ingresos del mes son $${(data?.ingresos || 0).toLocaleString('es-CO')}`, data }
    }
  },
  {
    pattern: /(stock|inventario|insumos)/i,
    handler: async (api) => {
      const { data } = await api.get('/inventario/')
      return { text: `Tienes ${data.length} items en inventario.`, data }
    }
  },
  {
    pattern: /(trabajadores|empleados)/i,
    handler: async (api) => {
      const { data } = await api.get('/trabajadores/')
      return { text: `Tienes ${data.length} trabajadores registrados.`, data }
    }
  },
  {
    pattern: /(lotes|terrenos|parcelas)\s*(activos)?/i,
    handler: async (api) => {
      const { data } = await api.get('/lotes/')
      return { text: `Tienes ${data.length} lotes registrados.`, data }
    }
  },
  {
    pattern: /(operaciones|tareas)\s*(del\s*)?(d[ií]a|hoy)?/i,
    handler: async (api) => {
      const { data } = await api.get('/operaciones/')
      const items = data.slice(0, 10).map(o => `• ${o.titulo || o.nombre || 'Tarea'}`).join('\n')
      return { text: `Operaciones (${data.length}):\n${items}${data.length > 10 ? `\n... y ${data.length - 10} más` : ''}`, data }
    }
  },
]

const ENTITY_MAP = {
  animales: 'animales',
  vacas: 'animales',
  vaca: 'animales',
  bovinos: 'animales',
  bovino: 'animales',
  toros: 'animales',
  toro: 'animales',
  terneros: 'animales',
  ternero: 'animales',
  cultivos: 'cultivos',
  cultivo: 'cultivos',
  siembras: 'cultivos',
  siembra: 'cultivos',
  cosechas: 'cultivos',
  cosecha: 'cultivos',
  lotes: 'lotes',
  lote: 'lotes',
  terrenos: 'lotes',
  terreno: 'lotes',
  parcelas: 'lotes',
  parcela: 'lotes',
  alertas: 'alertas',
  alerta: 'alertas',
  vacunas: 'alertas',
  vacuna: 'alertas',
  eventos: 'animales/eventos',
  evento: 'animales/eventos',
  pesajes: 'animales/pesajes',
  pesaje: 'animales/pesajes',
  finanzas: 'estadisticas/finanzas',
  insumos: 'inventario',
  inventario: 'inventario',
  tareas: 'operaciones',
  tarea: 'operaciones',
  operaciones: 'operaciones',
  trabajadores: 'trabajadores',
  empleados: 'trabajadores',
  nomina: 'nomina',
  contabilidad: 'contabilidad',
  facturas: 'contabilidad/facturas',
  grupos: 'grupos-manejo',
  dashboard: 'estadisticas/dashboard',
  planeacion: 'plan-actividades',
  trazabilidad: 'trazabilidad',
  bioseguridad: 'bioseguridad',
  certificaciones: 'certificaciones',
  equipos: 'equipos',
  maquinaria: 'equipos',
  farmacia: 'farmacia',
  agua: 'agua',
  alimentacion: 'alimentacion',
  suelos: 'suelos',
  sensores: 'sensores',
  forestal: 'forestal',
}

const SPECIE_MAP = {
  vacas: 'bovino',
  vaca: 'bovino',
  bovinos: 'bovino',
  bovino: 'bovino',
  toros: 'bovino',
  toro: 'bovino',
  terneros: 'bovino',
  ternero: 'bovino',
  cerdos: 'porcino',
  cerdo: 'porcino',
  porcinos: 'porcino',
  porcino: 'porcino',
  pollos: 'aviar',
  pollo: 'aviar',
  gallinas: 'aviar',
  gallina: 'aviar',
  aves: 'aviar',
  caballos: 'equino',
  caballo: 'equino',
  equinos: 'equino',
  equino: 'equino',
  ovejas: 'ovino',
  oveja: 'ovino',
  cabras: 'caprino',
  cabra: 'caprino',
  perros: 'canino',
  perro: 'canino',
  gatos: 'felino',
  gato: 'felino',
}

const PATTERNS = [
  {
    keywords: ['cuántos', 'cuantas', 'cuantos', 'cuantas', 'total', 'cantidad'],
    action: 'count',
  },
  {
    keywords: ['lista', 'listado', 'muestra', 'dime', 'cuales', 'cuáles', 'quien', 'quién'],
    action: 'list',
  },
  {
    keywords: ['resumen', 'balance', 'general'],
    action: 'summary',
  },
  {
    keywords: ['últimos', 'ultimos', 'recientes', 'primeros'],
    action: 'recent',
  },
  {
    keywords: ['próximos', 'proximos', 'siguientes', 'pendientes'],
    action: 'upcoming',
  },
  {
    keywords: ['quien no', 'quién no', 'sin', 'falta'],
    action: 'missing',
  },
  {
    keywords: ['qué', 'que', 'cual', 'cuál'],
    action: 'describe',
  },
]

function matchEntity(text) {
  for (const [key, endpoint] of Object.entries(ENTITY_MAP)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i')
    if (regex.test(text)) return endpoint
  }
  return null
}

function matchSpecie(text) {
  for (const [key, especie] of Object.entries(SPECIE_MAP)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i')
    if (regex.test(text)) return especie
  }
  return null
}

function matchAction(text) {
  for (const pattern of PATTERNS) {
    if (pattern.keywords.some(k => {
      const regex = new RegExp(`\\b${k}\\b`, 'i')
      return regex.test(text)
    })) return pattern.action
  }
  return 'list'
}

function matchMonth(text) {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  for (const mes of meses) {
    const regex = new RegExp(`\\b${mes}\\b`, 'i')
    if (regex.test(text)) return mes
  }
  return null
}

export function parseQuery(text) {
  const lower = text.toLowerCase().trim()
  const action = matchAction(lower)
  const entity = matchEntity(lower)
  const especie = matchSpecie(lower)
  const mes = matchMonth(lower)

  if (!entity) return null

  let apiEndpoint = `/${entity}/`
  let params = {}

  if (entity === 'animales' && especie) {
    params.especie = especie
  }

  if (entity === 'animales' && /activo/i.test(lower)) {
    params.activo = true
  }

  if ((entity === 'animales' || entity === 'alertas') && /vacuna/i.test(lower)) {
    apiEndpoint = '/animales/'
    params.tiene_evento_pendiente = 'vacuna'
  }

  if (/balance|mes|ingreso|gasto/i.test(lower)) {
    apiEndpoint = '/estadisticas/finanzas/ingresos-vs-gastos'
    if (mes) params.mes = mes
    return { apiEndpoint, params, displayTemplate: 'balance_mensual', action: 'summary' }
  }

  if (/resumen/i.test(lower) && (/finca/i.test(lower) || !entity || entity === 'animales')) {
    apiEndpoint = '/dashboard/resumen/'
    return { apiEndpoint, params, displayTemplate: 'resumen_finca', action: 'summary' }
  }

  if (/pr[oó]xim[oó]|pendiente|venc/i.test(lower)) {
    apiEndpoint = '/alertas/'
    if (/sanitaria|vacuna|salud/i.test(lower)) {
      params.tipo = 'sanitaria'
    } else if (/tarea|actividad/i.test(lower)) {
      params.tipo = 'operacional'
    }
    return { apiEndpoint, params, displayTemplate: 'alertas_pendientes', action: 'upcoming' }
  }

  if (/(quien no|qui[eé]n no|sin)/i.test(lower) && /peso/i.test(lower)) {
    apiEndpoint = '/animales/sin-pesaje/'
    return { apiEndpoint, params, displayTemplate: 'sin_pesaje', action: 'missing' }
  }

  if (/(quien no|qui[eé]n no|sin)/i.test(lower) && /evento/i.test(lower)) {
    apiEndpoint = '/animales/sin-evento/'
    return { apiEndpoint, params, displayTemplate: 'sin_evento', action: 'missing' }
  }

  return { apiEndpoint, params, displayTemplate: entity, action }
}

export async function executeQuery(text, apiClient) {
  const trimmed = text.trim()
  if (!trimmed) return { text: 'Por favor escribe una pregunta.' }

  for (const { pattern, handler } of QUERY_HANDLERS) {
    if (pattern.test(trimmed)) {
      try {
        return await handler(apiClient)
      } catch (err) {
        return { text: 'Ocurrió un error al consultar los datos. Verifica tu conexión e intenta de nuevo.', error: err }
      }
    }
  }

  const parsed = parseQuery(trimmed)

  if (!parsed) {
    return { text: getFallbackMessage(trimmed) }
  }

  try {
    const { data } = await apiClient.get(parsed.apiEndpoint, { params: parsed.params })
    return { text: formatGenericResult(data, parsed), data }
  } catch (err) {
    return { text: 'Ocurrió un error al consultar los datos. Verifica tu conexión e intenta de nuevo.', error: err }
  }
}

function formatGenericResult(data, parsed) {
  if (!data) return 'No se encontraron resultados.'

  if (Array.isArray(data)) {
    if (data.length === 0) return 'No se encontraron resultados.'

    if (parsed.action === 'count') {
      return `Total: ${data.length} registros.`
    }

    const items = data.slice(0, 10).map(item => {
      const name = item.nombre || item.codigo || item.titulo || `ID ${item.id}`
      return `• ${name}`
    }).join('\n')

    return `${items}${data.length > 10 ? `\n... y ${data.length - 10} más` : ''}`
  }

  if (typeof data === 'object') {
    const parts = Object.entries(data)
      .filter(([, v]) => v !== null && v !== undefined)
      .slice(0, 10)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
    return parts.join('\n')
  }

  return String(data)
}

export function getFallbackMessage(text) {
  const lower = text.toLowerCase()
  if (/animal|vaca|bovino|cerdo|especie|porcino|equino|ovino|caprino|aviar|canino|felino/.test(lower)) {
    return 'No tengo esa información aún, pero puedes consultarlo en el módulo de Animales'
  }
  if (/cultivo|siembra|cosecha/.test(lower)) {
    return 'No tengo esa información aún, pero puedes consultarlo en el módulo de Cultivos'
  }
  if (/lote|mapa|terreno|parcela/.test(lower)) {
    return 'No tengo esa información aún, pero puedes consultarlo en el módulo de Lotes y Mapas'
  }
  if (/contab|factura|balance|gasto|ingreso|finanza|nomina|n[oó]mina/.test(lower)) {
    return 'No tengo esa información aún, pero puedes consultarlo en el módulo de Contabilidad'
  }
  if (/trabajador|empleado/.test(lower)) {
    return 'No tengo esa información aún, pero puedes consultarlo en el módulo de Trabajadores o Nómina'
  }
  if (/alertas|vacuna|evento|sanitario/.test(lower)) {
    return 'No tengo esa información aún, pero puedes consultarlo en el módulo de Alertas'
  }
  if (/inventario|insumo|stock|farmacia|medicina/.test(lower)) {
    return 'No tengo esa información aún, pero puedes consultarlo en el módulo de Inventario o Farmacia'
  }
  if (/operacion|tarea|actividad/.test(lower)) {
    return 'No tengo esa información aún, pero puedes consultarlo en el módulo de Operaciones'
  }
  if (/equipo|maquinaria|tractor/.test(lower)) {
    return 'No tengo esa información aún, pero puedes consultarlo en el módulo de Equipos y Maquinaria'
  }
  if (/agua|riego/.test(lower)) {
    return 'No tengo esa información aún, pero puedes consultarlo en el módulo de Agua'
  }
  if (/suelo|analisis|an[aá]lisis/.test(lower)) {
    return 'No tengo esa información aún, pero puedes consultarlo en el módulo de Suelos'
  }
  return 'No tengo esa información aún, pero puedes consultarlo en el módulo correspondiente desde el menú lateral'
}
