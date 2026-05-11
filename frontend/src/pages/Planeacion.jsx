import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, MultiSelect, NumberInput, Textarea, Badge, ActionIcon,
  Stack, SimpleGrid, Text, Progress, SegmentedControl, Tooltip,
  Divider, Card, ActionIconGroup, Collapse, ScrollArea, Box,
  Center,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPlus, IconEdit, IconCheck, IconX, IconCalendar,
  IconAlertTriangle, IconTemplate, IconTable,
  IconChevronLeft, IconChevronRight, IconCircle,
  IconClock, IconCircleFilled, IconCalendarEvent,
  IconUser, IconGripVertical, IconCalendarDue,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import isoWeek from 'dayjs/plugin/isoWeek'
import api from '../services/api.js'
import ErrorBoundary from '../components/ErrorBoundary.jsx'

dayjs.extend(isBetween)
dayjs.extend(isoWeek)

const safeDayjs = (d) => {
  const result = d ? dayjs(d) : null
  return result && result.isValid() ? result : null
}

const toArray = (str) => (str ? String(str).split(',').map(s => s.trim()).filter(Boolean) : [])
const toCSV = (arr) => (arr || []).filter(Boolean).join(',')

const TIPOS_ACTIVIDAD = [
  { value: 'vacunacion', label: 'Vacunación' },
  { value: 'desparasitacion', label: 'Desparasitación' },
  { value: 'pesaje', label: 'Pesaje' },
  { value: 'siembra', label: 'Siembra' },
  { value: 'cosecha', label: 'Cosecha' },
  { value: 'rotacion', label: 'Rotación' },
  { value: 'inseminacion', label: 'Inseminación' },
  { value: 'parto', label: 'Parto' },
  { value: 'marcacion', label: 'Marcación' },
  { value: 'poda', label: 'Poda' },
  { value: 'fertilizacion', label: 'Fertilización' },
  { value: 'riego', label: 'Riego' },
]

const PRIORIDADES = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
]

const ESTADOS = [
  { value: 'programado', label: 'Programado' },
  { value: 'en_curso', label: 'En Curso' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'vencido', label: 'Vencido' },
]

const prioridadColor = {
  baja: 'blue',
  media: 'yellow',
  alta: 'orange',
  critica: 'red',
}

const estadoColor = {
  programado: 'blue',
  en_curso: 'cyan',
  completado: 'green',
  cancelado: 'gray',
  vencido: 'red',
}

const tipoIcon = {
  vacunacion: '💉', desparasitacion: '🪱', pesaje: '⚖️',
  siembra: '🌱', cosecha: '🌾', rotacion: '🔄',
  inseminacion: '🧬', parto: '🐄', marcacion: '🏷️',
  poda: '✂️', fertilizacion: '🧪', riego: '💧',
}

const ganttColor = {
  vacunacion: '#228be6', desparasitacion: '#15aabf', pesaje: '#40c057',
  siembra: '#fab005', cosecha: '#fd7e14', rotacion: '#7950f2',
  inseminacion: '#e64980', parto: '#fa5252', marcacion: '#868e96',
  poda: '#82c91e', fertilizacion: '#4c6ef5', riego: '#22b8cf',
}

const PLANTILLAS = [
  {
    value: 'vacunacion_aftosa', label: 'Vacunación Aftosa', icon: '💉',
    tipo_actividad: 'vacunacion',
    titulo: 'Vacunación Aftosa',
    descripcion: 'Aplicación de vacuna contra fiebre aftosa. Repetir cada 6 meses.',
    duracion_estimada: 4,
    prioridad: 'alta',
    periodicidad_dias: 180,
  },
  {
    value: 'desparasitacion', label: 'Desparasitación', icon: '🪱',
    tipo_actividad: 'desparasitacion',
    titulo: 'Desparasitación trimestral',
    descripcion: 'Aplicación de desparasitante interno y externo. Repetir cada 3 meses.',
    duracion_estimada: 2,
    prioridad: 'media',
    periodicidad_dias: 90,
  },
  {
    value: 'pesaje_mensual', label: 'Pesaje Mensual', icon: '⚖️',
    tipo_actividad: 'pesaje',
    titulo: 'Pesaje mensual de animales',
    descripcion: 'Registro de peso de todos los animales del lote.',
    duracion_estimada: 6,
    prioridad: 'media',
    periodicidad_dias: 30,
  },
  {
    value: 'rotacion_potreros', label: 'Rotación de Potreros', icon: '🔄',
    tipo_actividad: 'rotacion',
    titulo: 'Rotación de potreros',
    descripcion: 'Movimiento de animales al siguiente potrero según plan de pastoreo.',
    duracion_estimada: 3,
    prioridad: 'baja',
    periodicidad_dias: 30,
  },
  {
    value: 'aplicacion_fertilizante', label: 'Aplicación de Fertilizante', icon: '🧪',
    tipo_actividad: 'fertilizacion',
    titulo: 'Aplicación de fertilizante',
    descripcion: 'Aplicación de fertilizante en cultivos según recomendación técnica.',
    duracion_estimada: 5,
    prioridad: 'media',
    periodicidad_dias: 60,
  },
]

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const DENSITY_COLORS = {
  0: 'transparent',
  1: 'teal.3',
  2: 'yellow.5',
  3: 'orange.6',
}

const getDensityColor = (count) => {
  if (count === 0) return 'transparent'
  if (count <= 1) return DENSITY_COLORS[1]
  if (count <= 3) return DENSITY_COLORS[2]
  return DENSITY_COLORS[3]
}

const densityLevel = (count) => {
  if (count === 0) return 0
  if (count <= 1) return 1
  if (count <= 3) return 2
  return 3
}

const BAR_HEIGHT = 28
const BAR_GAP = 4
const COL_WIDTH = 40
const LABEL_WIDTH = 220
const HEADER_HEIGHT = 60

function WeekGrid({ start, days, ganttEnd }) {
  const weeks = []
  let cursor = dayjs(start)
  while (cursor.isBefore(ganttEnd) || cursor.isSame(ganttEnd, 'day')) {
    const weekEnd = cursor.add(6, 'day')
    weeks.push({ start: cursor, end: weekEnd, label: `W${cursor.isoWeek()}` })
    cursor = cursor.add(7, 'day')
  }
  return (
    <Box style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 2, background: '#fff' }}>
      {weeks.map((w, i) => (
        <Box
          key={i}
          style={{
            width: COL_WIDTH * 7,
            minWidth: COL_WIDTH * 7,
            borderRight: '1px solid #dee2e6',
            borderBottom: '2px solid #dee2e6',
            padding: 2,
          }}
        >
          <Text size="xs" ta="center" fw={600} c="dimmed">
            {w.start.format('MMM')} {w.start.date()}-{w.end.date()}
          </Text>
          <Text size="xs" ta="center" c="gray.5">{w.label}</Text>
        </Box>
      ))}
    </Box>
  )
}

function DayGrid({ start, totalDays }) {
  const cells = []
  for (let i = 0; i < totalDays; i++) {
    const d = dayjs(start).add(i, 'day')
    cells.push(
      <Box
        key={i}
        style={{
          width: COL_WIDTH,
          minWidth: COL_WIDTH,
          borderRight: '1px solid #f0f0f0',
          borderBottom: '1px solid #e9ecef',
          textAlign: 'center',
          fontSize: 10,
          color: d.day() === 0 || d.day() === 6 ? '#adb5bd' : '#868e96',
          background: d.day() === 0 || d.day() === 6 ? '#f8f9fa' : undefined,
        }}
      >
        {d.date()}
      </Box>
    )
  }
  return (
    <Box style={{ display: 'flex', position: 'sticky', top: 42, zIndex: 1, background: '#fff' }}>
      {cells}
    </Box>
  )
}

function getActivityEnd(a) {
  const prog = safeDayjs(a.fecha_programada)
  if (!prog) return dayjs()
  if (a.fecha_ejecucion) return safeDayjs(a.fecha_ejecucion) || prog
  if (a.duracion_estimada) return prog.add(a.duracion_estimada, 'day')
  return prog.add(1, 'day')
}

function GanttBar({ activity, startDay, ganttStart, ganttEnd, onClick }) {
  const aStart = dayjs(activity.fecha_programada)
  const aEnd = getActivityEnd(activity)

  const clampedStart = aStart.isBefore(ganttStart) ? dayjs(ganttStart) : aStart
  const clampedEnd = aEnd.isAfter(ganttEnd) ? dayjs(ganttEnd) : aEnd

  const left = clampedStart.diff(ganttStart, 'day') * COL_WIDTH
  const width = Math.max(clampedEnd.diff(clampedStart, 'day') * COL_WIDTH, COL_WIDTH * 0.5)

  const color = ganttColor[activity.tipo_actividad] || '#868e96'
  const isPast = dayjs().isAfter(aEnd)
  const isActive = activity.estado === 'en_curso'
  const isCompleted = activity.estado === 'completado'
  const opacity = isCompleted ? 0.5 : isPast && activity.estado !== 'completado' ? 0.8 : 1

  return (
    <Tooltip
      label={`${activity.titulo} (${activity.fecha_programada} - ${aEnd.format('YYYY-MM-DD')})`}
      withArrow
      withinPortal
    >
      <Box
        onClick={() => onClick?.(activity)}
        style={{
          position: 'absolute',
          left,
          width,
          top: 2,
          height: BAR_HEIGHT - 4,
          borderRadius: 4,
          background: color,
          opacity,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 4,
          paddingRight: 4,
          overflow: 'hidden',
          border: isActive ? `2px solid ${color}` : undefined,
          boxShadow: isActive ? `0 0 0 1px ${color}` : undefined,
          zIndex: isActive ? 1 : 0,
        }}
      >
        {width > 60 && (
          <Text size="xs" c="white" truncate style={{ fontSize: 11, fontWeight: 500 }}>
            {activity.titulo}
          </Text>
        )}
        {isCompleted && <IconCheck size={10} color="white" style={{ marginLeft: 'auto' }} />}
      </Box>
    </Tooltip>
  )
}

function MonthMiniCalendar({ month, year, activitiesByDate, onClickMonth }) {
  const firstDay = dayjs(new Date(year, month, 1))
  const daysInMonth = firstDay.daysInMonth()
  const startDay = firstDay.day()
  const days = []
  for (let i = 0; i < startDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = firstDay.date(d).format('YYYY-MM-DD')
    days.push({ day: d, date: dateStr, activities: activitiesByDate[dateStr] || [] })
  }

  return (
    <Paper
      p="xs"
      radius="md"
      withBorder
      style={{ cursor: 'pointer' }}
      onClick={() => onClickMonth?.(month)}
    >
      <Text ta="center" fw={600} size="sm" mb={4}>{MONTHS[month]}</Text>
      <SimpleGrid cols={7} spacing={1}>
        {WEEKDAYS.map(d => (
          <Text key={d} size="xs" ta="center" c="dimmed" style={{ fontSize: 8 }}>{d}</Text>
        ))}
        {days.map((day, i) => (
          <Box key={i} style={{ height: 16, textAlign: 'center' }}>
            {day && (
              <Tooltip
                label={`${day.date}: ${day.activities.length} actividades`}
                withArrow
              >
                <Text
                  size="xs"
                  style={{
                    fontSize: 9,
                    color: day.activities.length > 0 ? '#228be6' : '#adb5bd',
                    fontWeight: day.activities.length > 0 ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {day.day}
                </Text>
              </Tooltip>
            )}
          </Box>
        ))}
      </SimpleGrid>
      {days.some(d => d && d.activities.length > 0) && (
        <Group justify="center" gap={2} mt={4}>
          {[1, 2, 3].map(level => {
            const count = days.filter(d => d && densityLevel(d.activities.length) === level).length
            if (!count) return null
            return (
              <Tooltip key={level} label={`${count} días con ${level === 1 ? '1' : level === 2 ? '2-3' : '4+'} actividades`}>
                <Box
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: `var(--mantine-color-${level >= 3 ? 'red' : level >= 2 ? 'orange' : 'teal'}-${level >= 3 ? 7 : level >= 2 ? 6 : 5})`,
                  }}
                />
              </Tooltip>
            )
          })}
        </Group>
      )}
    </Paper>
  )
}

export default function Planeacion() {
  const [searchParams] = useSearchParams()
  const [data, setData] = useState([])
  const [lotes, setLotes] = useState([])
  const [animales, setAnimales] = useState([])
  const [siembras, setSiembras] = useState([])
  const [grupos, setGrupos] = useState([])
  const [insumos, setInsumos] = useState([])
  const [opened, { open, close }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState(null)
  const [filtroFechaIni, setFiltroFechaIni] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')
  const [indicadores, setIndicadores] = useState(null)
  const [viewMode, setViewMode] = useState('table')
  const [calendarDate, setCalendarDate] = useState(dayjs())
  const [calendarSubView, setCalendarSubView] = useState('month')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showProximas, setShowProximas] = useState(true)

  const initialForm = {
    tipo_actividad: '', titulo: '', descripcion: '',
    lote_id: '', animal_id: '', siembra_id: '',
    lotes_ids: '', grupos_ids: '', animales_ids: '',
    cultivos_ids: '', insumos_ids: '',
    fecha_programada: '', duracion_estimada: '',
    responsable: '', prioridad: 'media',
  }
  const [form, setForm] = useState(initialForm)

  const mockRequest = async (method, url, body) => {
    console.log(`[MOCK] ${method} ${url}`, body || '')
    return { data: method === 'GET' ? [] : { id: Date.now(), ...body } }
  }

  const loadData = async () => {
    try {
      const [actividades, lotesRes, animalesRes, siembrasRes, gruposRes, insumosRes] = await Promise.all([
        api.get('/plan-actividades/').catch(() => mockRequest('GET', '/plan-actividades/')),
        api.get('/lotes/').catch(() => ({ data: [] })),
        api.get('/animales/').catch(() => ({ data: [] })),
        api.get('/cultivos/').catch(() => ({ data: [] })),
        api.get('/grupos-manejo/').catch(() => ({ data: [] })),
        api.get('/finanzas/insumos/').catch(() => ({ data: [] })),
      ])
      setData(Array.isArray(actividades.data) ? actividades.data : [])
      setLotes(Array.isArray(lotesRes.data) ? lotesRes.data : [])
      setAnimales(Array.isArray(animalesRes.data) ? animalesRes.data : [])
      setSiembras(Array.isArray(siembrasRes.data) ? siembrasRes.data : [])
      setGrupos(Array.isArray(gruposRes.data) ? gruposRes.data : [])
      setInsumos(Array.isArray(insumosRes.data) ? insumosRes.data : [])
    } catch (e) {
      console.error('Error loading Planeacion data:', e)
    }
  }

  console.log('[Planeacion] data loaded:', data.length, 'items')

  const loadIndicadores = async () => {
    try {
      const res = await api.get('/indicadores-actividades/').catch(() => mockRequest('GET', '/indicadores-actividades/'))
      if (res.data && res.data.total !== undefined) {
        setIndicadores(res.data)
      } else {
        setIndicadores({
          total: data.length,
          completadas: data.filter(a => a.estado === 'completado').length,
          vencidas: data.filter(a => a.estado === 'vencido').length,
          cumplimiento: 0,
          oportunidad: 0,
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (data.length) loadIndicadores()
  }, [data])

  useEffect(() => {
    const desde = searchParams.get('desde')
    const id = searchParams.get('id')
    const tipo = searchParams.get('tipo')
    const loteId = searchParams.get('lote_id')
    if (desde || tipo) {
      const prefill = { ...initialForm }
      if (desde === 'animales' && id) {
        prefill.animal_id = id
        prefill.animales_ids = id
        prefill.tipo_actividad = 'vacunacion'
      }
      if (desde === 'lotes' && id) {
        prefill.lote_id = id
        prefill.lotes_ids = id
      }
      if (desde === 'cultivos' && id) {
        prefill.siembra_id = id
        prefill.cultivos_ids = id
        prefill.tipo_actividad = 'siembra'
      }
      if (tipo) {
        prefill.tipo_actividad = tipo
        if (loteId) {
          prefill.lote_id = loteId
          prefill.lotes_ids = loteId
        }
      }
      setForm(prefill)
      open()
    }
  }, [])

  const filteredData = useMemo(() => data.filter(a => {
    if (filtroTipo && a.tipo_actividad !== filtroTipo) return false
    if (filtroEstado && a.estado !== filtroEstado) return false
    if (filtroFechaIni && a.fecha_programada && a.fecha_programada < filtroFechaIni) return false
    if (filtroFechaFin && a.fecha_programada && a.fecha_programada > filtroFechaFin) return false
    return true
  }), [data, filtroTipo, filtroEstado, filtroFechaIni, filtroFechaFin])

  const proximasActividades = useMemo(() => {
    const today = dayjs().startOf('day')
    const thirtyDays = today.add(30, 'day')
    return (data || []).filter(a => {
      if (!a || a.estado === 'completado' || a.estado === 'cancelado') return false
      if (!a.fecha_programada) return false
      const d = safeDayjs(a.fecha_programada)
      return d && d.isBetween(today.subtract(1, 'day'), thirtyDays, 'day', '[]')
    }).sort((a, b) => {
      const da = safeDayjs(a.fecha_programada)
      const db = safeDayjs(b.fecha_programada)
      return (da ? da.unix() : 0) - (db ? db.unix() : 0)
    })
  }, [data])

  const proximasAgrupadas = useMemo(() => {
    const today = dayjs().startOf('day')
    const groups = { 1: [], 2: [], 3: [], 4: [] }
    proximasActividades.forEach(a => {
      const d = dayjs(a.fecha_programada)
      const diff = d.diff(today, 'day')
      const weekIdx = Math.min(Math.floor(diff / 7) + 1, 4)
      groups[weekIdx].push(a)
    })
    return groups
  }, [proximasActividades])

  const weekLabels = {
    1: 'Esta semana',
    2: 'Semana 2',
    3: 'Semana 3',
    4: 'Semana 4',
  }

  const calendarActivities = useMemo(() => {
    const map = {}
    ;(data || []).forEach(a => {
      if (!a || !a.fecha_programada) return
      const key = a.fecha_programada
      if (!map[key]) map[key] = []
      map[key].push(a)
    })
    return map
  }, [data])

  const calendarDays = useMemo(() => {
    if (!calendarDate || !calendarDate.isValid()) return []
    const startOfMonth = calendarDate.startOf('month')
    const endOfMonth = calendarDate.endOf('month')
    const startDay = startOfMonth.day()
    const days = []
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }
    const daysInMonth = calendarDate.daysInMonth()
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = calendarDate.date(d).format('YYYY-MM-DD')
      const count = (calendarActivities[dateStr] || []).length
      days.push({ day: d, date: dateStr, count, activities: calendarActivities[dateStr] || [] })
    }
    return days
  }, [calendarDate, calendarActivities])

  const yearActivities = useMemo(() => {
    const map = {}
    ;(data || []).forEach(a => {
      if (!a || !a.fecha_programada) return
      const key = a.fecha_programada
      if (!map[key]) map[key] = []
      map[key].push(a)
    })
    return map
  }, [data])

  const ganttData = useMemo(() => {
    const active = (filteredData || []).filter(a => a && a.estado !== 'cancelado' && a.fecha_programada)
    if (active.length === 0) {
      const now = dayjs()
      return { items: [], start: now, end: now.add(30, 'day'), totalDays: 30 }
    }

    let minDate = safeDayjs(active[0].fecha_programada) || dayjs()
    let maxDate = safeDayjs(active[0].fecha_programada) || dayjs()

    active.forEach(a => {
      const s = safeDayjs(a.fecha_programada)
      const e = getActivityEnd(a)
      if (s && s.isBefore(minDate)) minDate = s
      if (e && e.isAfter(maxDate)) maxDate = e
    })

    console.log('[Planeacion] Gantt range:', minDate.format('YYYY-MM-DD'), 'to', maxDate.format('YYYY-MM-DD'))

    const ganttStart = minDate.startOf('week').subtract(1, 'week')
    const ganttEnd = maxDate.endOf('week').add(1, 'week')
    const totalDays = ganttEnd.diff(ganttStart, 'day')

    return { items: active, start: ganttStart, end: ganttEnd, totalDays }
  }, [filteredData])

  const ganttMonths = useMemo(() => {
    const months = []
    let cursor = dayjs(ganttData.start)
    while (cursor.isBefore(ganttData.end)) {
      const monthStart = cursor
      const monthEnd = cursor.endOf('month')
      months.push({ start: monthStart, end: monthEnd, label: MONTHS[monthStart.month()], year: monthStart.year() })
      cursor = monthEnd.add(1, 'day')
    }
    return months
  }, [ganttData])

  const handleSubmit = async () => {
    const payload = { ...form }
    if (form.duracion_estimada === '' || form.duracion_estimada === null) {
      payload.duracion_estimada = null
    }
    if (!payload.animal_id && payload.animales_ids) {
      const first = toArray(payload.animales_ids)[0]
      payload.animal_id = first || ''
    }
    if (!payload.siembra_id && payload.cultivos_ids) {
      const first = toArray(payload.cultivos_ids)[0]
      payload.siembra_id = first || ''
    }
    try {
      if (editando) {
        await api.put(`/plan-actividades/${editando}`, payload)
          .catch(() => mockRequest('PUT', `/plan-actividades/${editando}`, payload))
        notifications.show({ title: 'Actividad actualizada', color: 'green' })
      } else {
        await api.post('/plan-actividades/', payload)
          .catch(() => mockRequest('POST', '/plan-actividades/', payload))
        notifications.show({ title: 'Actividad programada', color: 'green' })
      }
      close(); setEditando(null); setForm(initialForm); setSelectedTemplate(null); loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleEdit = (a) => {
    setEditando(a.id)
    setSelectedTemplate(null)
    setForm({
      tipo_actividad: a.tipo_actividad || '', titulo: a.titulo || '',
      descripcion: a.descripcion || '',
      lote_id: a.lote_id?.toString() || '',
      animal_id: a.animal_id?.toString() || '',
      siembra_id: a.siembra_id?.toString() || '',
      lotes_ids: a.lotes_ids || (a.lote_id ? a.lote_id.toString() : ''),
      grupos_ids: a.grupos_ids || '',
      animales_ids: a.animales_ids || (a.animal_id ? a.animal_id.toString() : ''),
      cultivos_ids: a.cultivos_ids || (a.siembra_id ? a.siembra_id.toString() : ''),
      insumos_ids: a.insumos_ids || '',
      fecha_programada: a.fecha_programada || '',
      duracion_estimada: a.duracion_estimada?.toString() || '',
      responsable: a.responsable || '', prioridad: a.prioridad || 'media',
    })
    open()
  }

  const cambiarEstado = async (id, nuevoEstado) => {
    const actividad = data.find(a => a.id === id)
    if (!actividad) return
    try {
      await api.put(`/plan-actividades/${id}`, { ...actividad, estado: nuevoEstado })
        .catch(() => mockRequest('PUT', `/plan-actividades/${id}`, { estado: nuevoEstado }))
      notifications.show({ title: `Actividad ${nuevoEstado === 'completado' ? 'completada' : 'cancelada'}`, color: 'green' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', color: 'red' })
    }
  }

  const openNew = () => {
    setEditando(null)
    setForm(initialForm)
    setSelectedTemplate(null)
    open()
  }

  const applyTemplate = (templateValue) => {
    if (!templateValue) {
      setSelectedTemplate(null)
      return
    }
    const tmpl = PLANTILLAS.find(t => t.value === templateValue)
    if (!tmpl) return
    setSelectedTemplate(templateValue)
    setForm(prev => ({
      ...prev,
      tipo_actividad: tmpl.tipo_actividad || '',
      titulo: tmpl.titulo || '',
      descripcion: tmpl.descripcion || '',
      duracion_estimada: tmpl.duracion_estimada || '',
      prioridad: tmpl.prioridad || 'media',
    }))
  }

  const getItemName = (list, id) => {
    if (!id) return '-'
    const item = list.find(l => l.id === Number(id))
    return item?.nombre || `#${id}`
  }

  const renderLotesCell = (a) => {
    const ids = a.lotes_ids ? toArray(a.lotes_ids) : (a.lote_id ? [a.lote_id] : [])
    if (ids.length === 0) return '-'
    return ids.map(id => getItemName(lotes, id)).join(', ')
  }

  const renderAnimalesCell = (a) => {
    const ids = a.animales_ids ? toArray(a.animales_ids) : (a.animal_id ? [a.animal_id] : [])
    if (ids.length === 0) return '-'
    return ids.map(id => getItemName(animales, id)).join(', ')
  }

  const renderSiembrasCell = (a) => {
    const ids = a.cultivos_ids ? toArray(a.cultivos_ids) : (a.siembra_id ? [a.siembra_id] : [])
    if (ids.length === 0) return '-'
    return ids.map(id => getItemName(siembras, id)).join(', ')
  }

  const formatDate = (dateStr) => {
    const d = safeDayjs(dateStr)
    return d ? d.format('DD/MM/YYYY') : '-'
  }

  const isToday = (dateStr) => {
    const d = safeDayjs(dateStr)
    return d ? d.isSame(dayjs(), 'day') : false
  }

  const isPastDue = (dateStr, estado) => {
    if (estado === 'completado' || estado === 'cancelado') return false
    const d = safeDayjs(dateStr)
    return d ? d.isBefore(dayjs(), 'day') : false
  }

  const handleGanttClick = (a) => handleEdit(a)

  const daysRemaining = (dateStr) => {
    const d = safeDayjs(dateStr)
    if (!d) return 0
    const today = dayjs().startOf('day')
    return d.diff(today, 'day')
  }

  return (
    <ErrorBoundary fallback={<Paper p="xl" withBorder><Text c="red" ta="center">Error al cargar el módulo de Planeación. Intente recargar la página.</Text></Paper>}>
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Planeación y Cronograma de Actividades</Title>
        <Group>
          {viewMode === 'calendar' && calendarSubView === 'month' && (
            <Button
              variant="default"
              leftSection={<IconChevronLeft size={16} />}
              onClick={() => setCalendarDate(calendarDate.subtract(1, 'month'))}
            >
              {calendarDate.subtract(1, 'month').format('MMM')}
            </Button>
          )}
          <Button leftSection={<IconPlus size={16} />} onClick={openNew}>Nueva Actividad</Button>
        </Group>
      </Group>

      {proximasActividades.length > 0 && (
        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="sm">
            <Group>
              <IconCalendarDue size={20} color="var(--mantine-color-orange-6)" />
              <Text fw={600}>Próximos 30 días</Text>
              <Badge color="orange" size="lg">{proximasActividades.length} actividades</Badge>
            </Group>
            <Button
              variant="subtle" size="xs"
              onClick={() => setShowProximas(!showProximas)}
            >
              {showProximas ? 'Ocultar' : 'Mostrar'}
            </Button>
          </Group>
          <Collapse in={showProximas}>
            <Stack gap="md">
              {[1, 2, 3, 4].map(weekNum => {
                const items = proximasAgrupadas[weekNum]
                if (!items || items.length === 0) return null
                const isCurrentWeek = weekNum === 1
                return (
                  <Box key={weekNum}>
                    <Group mb="xs">
                      <Badge
                        color={isCurrentWeek ? 'blue' : 'gray'}
                        variant={isCurrentWeek ? 'filled' : 'outline'}
                        size="sm"
                      >
                        {weekLabels[weekNum]}
                      </Badge>
                      <Text size="xs" c="dimmed">{items.length} actividad(es)</Text>
                    </Group>
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
                      {items.map(a => {
                        const remaining = daysRemaining(a.fecha_programada)
                        const vencida = isPastDue(a.fecha_programada, a.estado)
                        const urgente = remaining <= 2 && !vencida
                        return (
                          <Paper key={a.id} p="xs" radius="sm" withBorder
                            style={{
                              borderLeft: `4px solid var(--mantine-color-${vencida ? 'red' : urgente ? 'orange' : prioridadColor[a.prioridad] || 'blue'}-6)`,
                            }}
                          >
                            <Group justify="space-between" mb={2}>
                              <Group gap={4}>
                                <Text size="xs" c="dimmed">
                                  {tipoIcon[a.tipo_actividad] || ''} {formatDate(a.fecha_programada)}
                                </Text>
                              </Group>
                              <Badge
                                color={vencida ? 'red' : urgente ? 'orange' : 'green'}
                                size="xs"
                                variant={vencida ? 'filled' : 'light'}
                              >
                                {vencida ? 'Vencida' : `${remaining} día${remaining !== 1 ? 's' : ''}`}
                              </Badge>
                            </Group>
                            <Text size="sm" fw={500} lineClamp={1}>{a.titulo || a.tipo_actividad}</Text>
                            <Group gap={4} mt={2}>
                              <IconUser size={12} />
                              <Text size="xs" c="dimmed">{a.responsable || 'Sin responsable'}</Text>
                              <Badge color={estadoColor[a.estado] || 'blue'} size="xs" variant="light">{a.estado}</Badge>
                            </Group>
                          </Paper>
                        )
                      })}
                    </SimpleGrid>
                  </Box>
                )
              })}
            </Stack>
          </Collapse>
        </Paper>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Paper p="md" radius="md" withBorder>
          <Group><IconCalendar size={20} color="var(--mantine-color-blue-6)" /><Text size="xs" c="dimmed">Programadas</Text></Group>
          <Text size="xl" fw={700}>{indicadores?.total || data.length}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconCheck size={20} color="var(--mantine-color-green-6)" /><Text size="xs" c="dimmed">Completadas</Text></Group>
          <Text size="xl" fw={700} c="green">{indicadores?.completadas || data.filter(a => a.estado === 'completado').length}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconAlertTriangle size={20} color="var(--mantine-color-red-6)" /><Text size="xs" c="dimmed">Vencidas</Text></Group>
          <Text size="xl" fw={700} c="red">{indicadores?.vencidas || data.filter(a => a.estado === 'vencido').length}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed">Cumplimiento</Text>
          <Text size="xl" fw={700}>{indicadores?.cumplimiento || 0}%</Text>
          <Progress value={indicadores?.cumplimiento || 0} size="sm" mt={4} color="green" />
          <Text size="xs" c="dimmed" mt={4}>Oportunidad: {indicadores?.oportunidad || 0}%</Text>
          <Progress value={indicadores?.oportunidad || 0} size="sm" mt={2} color="blue" />
        </Paper>
      </SimpleGrid>

      <Paper p="sm" radius="md" withBorder>
        <Group gap="sm">
          <Select
            placeholder="Filtrar tipo" clearable
            data={TIPOS_ACTIVIDAD}
            value={filtroTipo}
            onChange={setFiltroTipo}
            style={{ width: 180 }}
          />
          <Select
            placeholder="Filtrar estado" clearable
            data={ESTADOS}
            value={filtroEstado}
            onChange={setFiltroEstado}
            style={{ width: 160 }}
          />
          <TextInput
            placeholder="Fecha inicio" type="date"
            value={filtroFechaIni}
            onChange={e => setFiltroFechaIni(e.target.value)}
            style={{ width: 160 }}
          />
          <TextInput
            placeholder="Fecha fin" type="date"
            value={filtroFechaFin}
            onChange={e => setFiltroFechaFin(e.target.value)}
            style={{ width: 160 }}
          />
          <SegmentedControl
            value={viewMode}
            onChange={setViewMode}
            data={[
              { value: 'table', label: <Group gap={4}><IconTable size={14} />Tabla</Group> },
              { value: 'calendar', label: <Group gap={4}><IconCalendar size={14} />Calendario</Group> },
              { value: 'gantt', label: <Group gap={4}><IconGripVertical size={14} />Gantt</Group> },
            ]}
            size="xs"
          />
        </Group>
      </Paper>

      {viewMode === 'table' ? (
        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha Prog.</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Título</Table.Th>
                <Table.Th>Lote</Table.Th>
                <Table.Th>Animal</Table.Th>
                <Table.Th>Responsable</Table.Th>
                <Table.Th>Prioridad</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(filteredData || []).map((a) => (
                <Table.Tr key={a.id}
                  style={isPastDue(a.fecha_programada, a.estado) ? { background: 'var(--mantine-color-red-0)' } : undefined}
                >
                  <Table.Td>
                    <Group gap={4}>
                      <IconCalendar size={14} />
                      <Text size="sm" fw={isToday(a.fecha_programada) ? 700 : 400}>
                        {formatDate(a.fecha_programada)}
                      </Text>
                      {isPastDue(a.fecha_programada, a.estado) && (
                        <IconAlertTriangle size={14} color="var(--mantine-color-red-6)" />
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge color="gray" size="sm">
                      {tipoIcon[a.tipo_actividad] || ''} {a.tipo_actividad}
                    </Badge>
                  </Table.Td>
                  <Table.Td fw={500}>{a.titulo || '-'}</Table.Td>
                  <Table.Td size="sm">{renderLotesCell(a)}</Table.Td>
                  <Table.Td size="sm">{renderAnimalesCell(a)}</Table.Td>
                  <Table.Td>{a.responsable || '-'}</Table.Td>
                  <Table.Td>
                    <Badge color={prioridadColor[a.prioridad] || 'gray'} size="sm">{a.prioridad || 'baja'}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={estadoColor[a.estado] || 'blue'} size="sm" variant="light">{a.estado || 'programado'}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <ActionIcon variant="light" color="blue" size="sm" onClick={() => handleEdit(a)}>
                        <IconEdit size={14} />
                      </ActionIcon>
                      {a.estado !== 'completado' && a.estado !== 'cancelado' && (
                        <>
                          <ActionIcon variant="light" color="green" size="sm" onClick={() => cambiarEstado(a.id, 'completado')}>
                            <IconCheck size={14} />
                          </ActionIcon>
                          <ActionIcon variant="light" color="gray" size="sm" onClick={() => cambiarEstado(a.id, 'cancelado')}>
                            <IconX size={14} />
                          </ActionIcon>
                        </>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {filteredData.length === 0 && (
                <Table.Tr><Table.Td colSpan={9}><Text c="dimmed" ta="center">No hay actividades programadas</Text></Table.Td></Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      ) : viewMode === 'calendar' ? (
        <Paper withBorder p="md">
          {calendarSubView === 'year' ? (
            <>
              <Group justify="space-between" mb="md">
                <Button
                  variant="subtle"
                  leftSection={<IconChevronLeft size={16} />}
                  onClick={() => setCalendarDate(calendarDate.subtract(1, 'year'))}
                >
                  {calendarDate.subtract(1, 'year').format('YYYY')}
                </Button>
                <Title order={4}>{calendarDate.format('YYYY')}</Title>
                <Button
                  variant="subtle"
                  rightSection={<IconChevronRight size={16} />}
                  onClick={() => setCalendarDate(calendarDate.add(1, 'year'))}
                >
                  {calendarDate.add(1, 'year').format('YYYY')}
                </Button>
              </Group>
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
                {Array.from({ length: 12 }, (_, i) => (
                  <MonthMiniCalendar
                    key={i}
                    month={i}
                    year={calendarDate.year()}
                    activitiesByDate={yearActivities}
                    onClickMonth={(m) => {
                      setCalendarDate(dayjs(new Date(calendarDate.year(), m, 1)))
                      setCalendarSubView('month')
                    }}
                  />
                ))}
              </SimpleGrid>
              <Center mt="md">
                <Button variant="light" size="xs" onClick={() => setCalendarSubView('month')}>
                  Ver calendario mensual
                </Button>
              </Center>
            </>
          ) : (
            <>
              <Group justify="space-between" mb="md">
                <Group>
                  <Button
                    variant="subtle"
                    leftSection={<IconChevronLeft size={16} />}
                    onClick={() => setCalendarDate(calendarDate.subtract(1, 'month'))}
                  >
                    Anterior
                  </Button>
                </Group>
                <Group>
                  <Title order={4}>{calendarDate.format('MMMM YYYY')}</Title>
                  <Button variant="default" size="xs" onClick={() => setCalendarSubView('year')}>
                    Vista anual
                  </Button>
                </Group>
                <Button
                  variant="subtle"
                  rightSection={<IconChevronRight size={16} />}
                  onClick={() => setCalendarDate(calendarDate.add(1, 'month'))}
                >
                  Siguiente
                </Button>
              </Group>

              <SimpleGrid cols={7} spacing={2}>
                {WEEKDAYS.map(d => (
                  <Text key={d} size="xs" fw={700} ta="center" c="dimmed" py={4}>{d}</Text>
                ))}
                {calendarDays.map((day, i) => (
                  <Paper
                    key={i}
                    p={4}
                    radius="sm"
                    withBorder={day !== null}
                    style={{
                      minHeight: 70,
                      background: day && day.count > 0
                        ? `var(--mantine-color-${densityLevel(day.count) >= 3 ? 'red' : densityLevel(day.count) >= 2 ? 'orange' : densityLevel(day.count) >= 1 ? 'teal' : 'gray'}-${densityLevel(day.count) >= 1 ? '0' : '0'})`
                        : undefined,
                      opacity: day ? 1 : 0.3,
                      cursor: day ? 'pointer' : 'default',
                    }}
                  >
                    {day && (
                      <>
                        <Text
                          size="xs"
                          fw={day.count > 0 ? 700 : 400}
                          ta="center"
                          c={isToday(day.date) ? 'blue.7' : day.count > 0 ? 'dark' : 'dimmed'}
                          style={isToday(day.date) ? {
                            background: 'var(--mantine-color-blue-1)',
                            borderRadius: '50%',
                            width: 22, height: 22,
                            lineHeight: '22px',
                            margin: '0 auto',
                          } : undefined}
                        >
                          {day.day}
                        </Text>
                        {day.count > 0 && (
                          <Stack align="center" gap={2} mt={2}>
                            <IconCircleFilled
                              size={8}
                              color={`var(--mantine-color-${densityLevel(day.count) >= 3 ? 'red' : densityLevel(day.count) >= 2 ? 'orange' : 'teal'}-${densityLevel(day.count) >= 3 ? 7 : densityLevel(day.count) >= 2 ? 6 : 5})`}
                            />
                            <Text size="xs" c="dimmed" ta="center">{day.count} act.</Text>
                          </Stack>
                        )}
                      </>
                    )}
                  </Paper>
                ))}
              </SimpleGrid>

              <Group justify="center" mt="md" gap="lg">
                <Group gap={4}>
                  <IconCircleFilled size={10} color="var(--mantine-color-teal-5)" />
                  <Text size="xs" c="dimmed">1 act</Text>
                </Group>
                <Group gap={4}>
                  <IconCircleFilled size={10} color="var(--mantine-color-orange-6)" />
                  <Text size="xs" c="dimmed">2-3 act</Text>
                </Group>
                <Group gap={4}>
                  <IconCircleFilled size={10} color="var(--mantine-color-red-7)" />
                  <Text size="xs" c="dimmed">4+ act</Text>
                </Group>
              </Group>
            </>
          )}
        </Paper>
      ) : (
        <Paper withBorder p={0} style={{ overflow: 'hidden' }}>
          <ScrollArea style={{ maxHeight: 600 }}>
            <Box style={{ minWidth: LABEL_WIDTH + ganttData.totalDays * COL_WIDTH }}>
              <Box style={{ display: 'flex' }}>
                <Box style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH, borderRight: '1px solid #dee2e6' }}>
                  <Box style={{ height: HEADER_HEIGHT, borderBottom: '2px solid #dee2e6', padding: 8 }}>
                    <Text fw={600} size="sm">Actividades</Text>
                  </Box>
                  {ganttData.items.map(a => (
                    <Box
                      key={a.id}
                      style={{
                        height: BAR_HEIGHT + BAR_GAP,
                        paddingLeft: 8,
                        paddingRight: 8,
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: ganttColor[a.tipo_actividad] || '#868e96',
                          marginRight: 6,
                          flexShrink: 0,
                        }}
                      />
                      <Text size="xs" truncate style={{ fontSize: 11 }}>
                        {a.titulo || a.tipo_actividad}
                      </Text>
                      {a.estado === 'en_curso' && (
                        <Badge size="xs" color="cyan" variant="light" ml={4} style={{ flexShrink: 0 }}>En curso</Badge>
                      )}
                    </Box>
                  ))}
                </Box>
                <Box style={{ flex: 1, overflowX: 'auto' }}>
                  <Box style={{ position: 'relative' }}>
                    <WeekGrid start={ganttData.start} days={ganttData.totalDays} ganttEnd={ganttData.end} />
                    <DayGrid start={ganttData.start} totalDays={ganttData.totalDays} />
                    <Box style={{ position: 'relative' }}>
                  {(ganttData.items || []).map(a => (
                    <Box
                      key={a.id}
                      style={{
                        height: BAR_HEIGHT + BAR_GAP,
                        position: 'relative',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <GanttBar
                        activity={a}
                        ganttStart={ganttData.start}
                        ganttEnd={ganttData.end}
                        onClick={handleGanttClick}
                      />
                    </Box>
                  ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </ScrollArea>
          <Box p="sm" style={{ borderTop: '1px solid #dee2e6' }}>
            <Group gap="md">
              <Text size="xs" fw={500}>Colores por tipo:</Text>
              {Object.entries(ganttColor).filter(([, v]) => v).map(([tipo, color]) => (
                <Group key={tipo} gap={4}>
                  <Box style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                  <Text size="xs" c="dimmed">{TIPOS_ACTIVIDAD.find(t => t.value === tipo)?.label || tipo}</Text>
                </Group>
              ))}
            </Group>
          </Box>
        </Paper>
      )}

      <Modal opened={opened} onClose={close} title={editando ? 'Editar Actividad' : 'Nueva Actividad Programada'} size="lg">
        <Stack>
          <Select
            label="Plantilla (predefinido)"
            placeholder="Seleccionar plantilla..."
            data={PLANTILLAS.map(t => ({ value: t.value, label: `${t.icon} ${t.label}` }))}
            value={selectedTemplate}
            onChange={applyTemplate}
            clearable
            searchable
            leftSection={<IconTemplate size={16} />}
          />

          <Divider label="Datos de la actividad" labelPosition="center" />

          <SimpleGrid cols={2}>
            <Select
              label="Tipo de Actividad" required
              data={TIPOS_ACTIVIDAD}
              value={form.tipo_actividad}
              onChange={v => setForm({ ...form, tipo_actividad: v })}
              searchable
            />
            <Select
              label="Prioridad"
              data={PRIORIDADES}
              value={form.prioridad}
              onChange={v => setForm({ ...form, prioridad: v })}
            />
            <TextInput
              label="Título" required
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
            />
            <TextInput
              label="Fecha Programada" type="date" required
              value={form.fecha_programada}
              onChange={e => setForm({ ...form, fecha_programada: e.target.value })}
            />
          </SimpleGrid>

          <Divider label="Recursos asignados" labelPosition="center" />

          <SimpleGrid cols={2}>
            <MultiSelect
              label="Lotes"
              placeholder="Seleccionar lotes..."
              data={lotes.map(l => ({ value: l.id.toString(), label: l.nombre }))}
              value={toArray(form.lotes_ids)}
              onChange={v => setForm({
                ...form,
                lotes_ids: toCSV(v),
                lote_id: v[0] || '',
              })}
              searchable
              clearable
            />
            <MultiSelect
              label="Grupos de Manejo"
              placeholder="Seleccionar grupos..."
              data={grupos.map(g => ({ value: g.id.toString(), label: g.nombre }))}
              value={toArray(form.grupos_ids)}
              onChange={v => setForm({ ...form, grupos_ids: toCSV(v) })}
              searchable
              clearable
            />
            <MultiSelect
              label="Animales"
              placeholder="Seleccionar animales..."
              data={animales.filter(a => a.activo !== false).map(a => ({ value: a.id.toString(), label: a.codigo || a.nombre }))}
              value={toArray(form.animales_ids)}
              onChange={v => setForm({
                ...form,
                animales_ids: toCSV(v),
                animal_id: v[0] || '',
              })}
              searchable
              clearable
            />
            <MultiSelect
              label="Cultivos / Siembras"
              placeholder="Seleccionar cultivos..."
              data={siembras.map(s => ({ value: s.id.toString(), label: s.nombre || `Siembra #${s.id}` }))}
              value={toArray(form.cultivos_ids)}
              onChange={v => setForm({
                ...form,
                cultivos_ids: toCSV(v),
                siembra_id: v[0] || '',
              })}
              searchable
              clearable
            />
            <MultiSelect
              label="Insumos"
              placeholder="Seleccionar insumos..."
              data={insumos.map(i => ({ value: i.id.toString(), label: i.nombre || `Insumo #${i.id}` }))}
              value={toArray(form.insumos_ids)}
              onChange={v => setForm({ ...form, insumos_ids: toCSV(v) })}
              searchable
              clearable
            />
            <NumberInput
              label="Duración Estimada (horas)"
              value={form.duracion_estimada === '' ? '' : Number(form.duracion_estimada)}
              onChange={v => setForm({ ...form, duracion_estimada: v === '' ? '' : v.toString() })}
              min={0}
            />
          </SimpleGrid>

          <TextInput
            label="Responsable"
            value={form.responsable}
            onChange={e => setForm({ ...form, responsable: e.target.value })}
          />

          <Textarea
            label="Descripción"
            value={form.descripcion}
            onChange={e => setForm({ ...form, descripcion: e.target.value })}
            minRows={3}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editando ? 'Actualizar' : 'Guardar'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
    </ErrorBoundary>
  )
}
