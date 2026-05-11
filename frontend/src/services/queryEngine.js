const ENTITY_MAP = {
  animales: 'animales',
  vacas: 'animales',
  bovinos: 'animales',
  toros: 'animales',
  terneros: 'animales',
  cultivos: 'cultivos',
  siembras: 'cultivos',
  cosechas: 'cultivos',
  lotes: 'lotes',
  terrenos: 'lotes',
  parcelas: 'lotes',
  alertas: 'alertas',
  vacunas: 'alertas',
  eventos: 'animales/eventos',
  pesajes: 'animales/pesajes',
  finanzas: 'estadisticas/finanzas',
  insumos: 'inventario',
  tareas: 'operaciones',
  trabajadores: 'trabajadores',
  nomina: 'nomina',
  contabilidad: 'contabilidad',
  facturas: 'contabilidad/facturas',
  grupos: 'grupos-manejo',
}

const SPECIE_MAP = {
  vacas: 'bovino',
  bovinos: 'bovino',
  toros: 'bovino',
  terneros: 'bovino',
  cerdos: 'porcino',
  porcinos: 'porcino',
  pollos: 'aviar',
  gallinas: 'aviar',
  aves: 'aviar',
  caballos: 'equino',
  equinos: 'equino',
  ovejas: 'ovino',
  cabras: 'caprino',
  perros: 'canino',
  gatos: 'felino',
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
    if (text.includes(key)) return endpoint
  }
  return null
}

function matchSpecie(text) {
  for (const [key, especie] of Object.entries(SPECIE_MAP)) {
    if (text.includes(key)) return especie
  }
  return null
}

function matchAction(text) {
  for (const pattern of PATTERNS) {
    if (pattern.keywords.some(k => text.includes(k))) return pattern.action
  }
  return 'list'
}

function matchMonth(text) {
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  for (const mes of meses) {
    if (text.includes(mes)) return mes
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

  let apiEndpoint = `/${ENTITY_MAP[entity] || entity}/`
  let params = {}
  let displayTemplate = ''

  if (entity === 'animales' && especie) {
    params.especie = especie
    displayTemplate = especie
  }

  if (entity === 'animales' && lower.includes('activo')) {
    params.activo = true
  }

  if ((entity === 'animales' || entity === 'alertas') && lower.includes('vacuna')) {
    apiEndpoint = '/animales/'
    params.tiene_evento_pendiente = 'vacuna'
  }

  if (lower.includes('balance') || lower.includes('mes') || lower.includes('ingreso') || lower.includes('gasto')) {
    apiEndpoint = '/estadisticas/finanzas/ingresos-vs-gastos'
    if (mes) params.mes = mes
    return {
      apiEndpoint,
      params,
      displayTemplate: 'balance_mensual',
      action: 'summary',
    }
  }

  if (lower.includes('resumen') && (lower.includes('finca') || (!entity || entity === 'animales'))) {
    apiEndpoint = '/dashboard/resumen/'
    return {
      apiEndpoint,
      params,
      displayTemplate: 'resumen_finca',
      action: 'summary',
    }
  }

  if (lower.includes('próximo') || lower.includes('proximo') || lower.includes('pendiente') || lower.includes('venc')) {
    apiEndpoint = '/alertas/'
    if (lower.includes('sanitaria') || lower.includes('vacuna') || lower.includes('salud')) {
      params.tipo = 'sanitaria'
    } else if (lower.includes('tarea') || lower.includes('actividad')) {
      params.tipo = 'operacional'
    }
    return {
      apiEndpoint,
      params,
      displayTemplate: 'alertas_pendientes',
      action: 'upcoming',
    }
  }

  if ((lower.includes('quien no') || lower.includes('quién no') || lower.includes('sin')) && lower.includes('peso')) {
    apiEndpoint = '/animales/sin-pesaje/'
    return {
      apiEndpoint,
      params,
      displayTemplate: 'sin_pesaje',
      action: 'missing',
    }
  }

  if ((lower.includes('quien no') || lower.includes('quién no') || lower.includes('sin')) && lower.includes('evento')) {
    apiEndpoint = '/animales/sin-evento/'
    return {
      apiEndpoint,
      params,
      displayTemplate: 'sin_evento',
      action: 'missing',
    }
  }

  return { apiEndpoint, params, displayTemplate, action }
}

export function getFallbackMessage(text) {
  const lower = text.toLowerCase()
  if (lower.includes('animal') || lower.includes('vaca') || lower.includes('bovino') || lower.includes('cerdo') || lower.includes('especie')) {
    return 'No tengo esa información aún, pero puedes consultarlo en el módulo de Animales'
  }
  if (lower.includes('cultivo') || lower.includes('siembra') || lower.includes('cosecha')) {
    return 'No tengo esa información aún, pero puedes consultarlo en el módulo de Cultivos'
  }
  if (lower.includes('lote') || lower.includes('mapa') || lower.includes('terreno')) {
    return 'No tengo esa información aún, pero puedes consultarlo en el módulo de Lotes y Mapas'
  }
  if (lower.includes('contab') || lower.includes('factura') || lower.includes('balance') || lower.includes('gasto') || lower.includes('ingreso')) {
    return 'No tengo esa información aún, pero puedes consultarlo en el módulo de Contabilidad'
  }
  if (lower.includes('trabajador') || lower.includes('empleado') || lower.includes('nomina')) {
    return 'No tengo esa información aún, pero puedes consultarlo en el módulo de Trabajadores o Nómina'
  }
  if (lower.includes('alertas') || lower.includes('vacuna') || lower.includes('evento')) {
    return 'No tengo esa información aún, pero puedes consultarlo en el módulo de Alertas'
  }
  return 'No tengo esa información aún, pero puedes consultarlo en el módulo correspondiente desde el menú lateral'
}
