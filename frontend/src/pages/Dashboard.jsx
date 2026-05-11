import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Grid, Paper, Text, Group, Stack, Title, Skeleton, SimpleGrid,
  Badge, ActionIcon, Tooltip, Box, Divider, ThemeIcon, ScrollArea,
  useMantineTheme,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconPig, IconPlant, IconCoin, IconMilk, IconEgg, IconBug,
  IconArrowUpRight, IconArrowDownRight, IconWeight, IconStethoscope,
  IconAlertTriangle, IconCalendarEvent, IconCloudRain, IconMap,
  IconGripVertical, IconX, IconRefresh, IconVaccine,
  IconDroplet, IconTemperature, IconSeedling, IconPackage,
  IconHeartbeat, IconAlertCircle, IconChecklist,
} from '@tabler/icons-react'
import {
  BarChart, BarChart as ReBarChart, PieChart, Pie, Cell,
  Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import api from '../services/api'
import { formatCOP, formatNumber, COLOR_PALETTE } from '../config'
import { useAuth } from '../store/AuthContext'

const ROLES = {
  ADMIN: 'admin',
  OPERARIO: 'operario',
  VETERINARIO: 'veterinario',
  AGRONOMO: 'agronomo',
}

const WIDGET_DEFS = {
  resumen_financiero: {
    id: 'resumen_financiero',
    label: 'Resumen Financiero',
    icon: IconCoin,
    color: 'green',
    roles: [ROLES.ADMIN, ROLES.AGRONOMO],
    defaultSize: { span: 6, md: 6 },
  },
  salud_hato: {
    id: 'salud_hato',
    label: 'Salud del Hato',
    icon: IconStethoscope,
    color: 'red',
    roles: [ROLES.ADMIN, ROLES.VETERINARIO],
    defaultSize: { span: 6, md: 6 },
  },
  cultivos_activos: {
    id: 'cultivos_activos',
    label: 'Cultivos Activos',
    icon: IconSeedling,
    color: 'green',
    roles: [ROLES.ADMIN, ROLES.AGRONOMO],
    defaultSize: { span: 6, md: 6 },
  },
  inventario_critico: {
    id: 'inventario_critico',
    label: 'Inventario Crítico',
    icon: IconPackage,
    color: 'orange',
    roles: [ROLES.ADMIN, ROLES.OPERARIO],
    defaultSize: { span: 6, md: 4 },
  },
  proximas_actividades: {
    id: 'proximas_actividades',
    label: 'Próximas Actividades',
    icon: IconCalendarEvent,
    color: 'blue',
    roles: [ROLES.ADMIN, ROLES.OPERARIO, ROLES.VETERINARIO, ROLES.AGRONOMO],
    defaultSize: { span: 6, md: 4 },
  },
  alertas_recientes: {
    id: 'alertas_recientes',
    label: 'Alertas Recientes',
    icon: IconAlertTriangle,
    color: 'red',
    roles: [ROLES.ADMIN, ROLES.VETERINARIO, ROLES.AGRONOMO, ROLES.OPERARIO],
    defaultSize: { span: 6, md: 4 },
  },
  clima: {
    id: 'clima',
    label: 'Clima',
    icon: IconCloudRain,
    color: 'cyan',
    roles: [ROLES.ADMIN, ROLES.AGRONOMO],
    defaultSize: { span: 6, md: 4 },
  },
  mapa_rapido: {
    id: 'mapa_rapido',
    label: 'Mapa Rápido',
    icon: IconMap,
    color: 'teal',
    roles: [ROLES.ADMIN, ROLES.AGRONOMO, ROLES.OPERARIO],
    defaultSize: { span: 6, md: 8 },
  },
}

const DEFAULT_WIDGET_ORDER = [
  'resumen_financiero',
  'salud_hato',
  'cultivos_activos',
  'inventario_critico',
  'proximas_actividades',
  'alertas_recientes',
  'clima',
  'mapa_rapido',
]

const TIME_RANGES = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'quarter', label: 'Este trimestre' },
]

function getTimeParams(range) {
  const now = new Date()
  switch (range) {
    case 'today':
      return {
        fecha_desde: now.toISOString().slice(0, 10),
        fecha_hasta: now.toISOString().slice(0, 10),
      }
    case 'week': {
      const start = new Date(now)
      start.setDate(start.getDate() - start.getDay())
      return {
        fecha_desde: start.toISOString().slice(0, 10),
        fecha_hasta: now.toISOString().slice(0, 10),
      }
    }
    case 'month':
      return {
        mes: now.getMonth() + 1,
        anio: now.getFullYear(),
      }
    case 'quarter': {
      const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      return {
        fecha_desde: qStart.toISOString().slice(0, 10),
        fecha_hasta: now.toISOString().slice(0, 10),
      }
    }
    default:
      return {}
  }
}

function KPICard({ title, value, icon: Icon, color, trend, trendLabel, loading }) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between">
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>{title}</Text>
          {loading ? (
            <Skeleton height={28} width={80} />
          ) : (
            <Text size="xl" fw={700}>{value}</Text>
          )}
          {trend !== undefined && !loading && (
            <Group gap={4}>
              {trend >= 0 ? <IconArrowUpRight size={14} color="green" /> : <IconArrowDownRight size={14} color="red" />}
              <Text size="xs" c={trend >= 0 ? 'green' : 'red'}>{trendLabel}</Text>
            </Group>
          )}
        </Stack>
        <ThemeIcon variant="light" size="xl" radius="xl" color={color}>
          <Icon size={24} />
        </ThemeIcon>
      </Group>
    </Paper>
  )
}

function WidgetHeader({ widget, onRemove }) {
  return (
    <Group justify="space-between" mb="sm">
      <Group gap={6}>
        <IconGripVertical size={16} color="var(--mantine-color-gray-4)" style={{ cursor: 'grab' }} />
        <ThemeIcon variant="light" size="sm" radius="md" color={widget.color}>
          <widget.icon size={14} />
        </ThemeIcon>
        <Text fw={600} size="sm">{widget.label}</Text>
      </Group>
      {onRemove && (
        <ActionIcon variant="subtle" color="gray" size="sm" onClick={onRemove}>
          <IconX size={14} />
        </ActionIcon>
      )}
    </Group>
  )
}

function ResumenFinancieroWidget({ timeRange }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = getTimeParams(timeRange)
    api.get('/estadisticas/finanzas/ingresos-vs-gastos', { params: { meses: 6, ...params } })
      .then(({ data: d }) => setData(Array.isArray(d) ? d : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [timeRange])

  if (loading) return <Skeleton height={220} />
  if (!data || data.length === 0) {
    return <Paper p="md" radius="md" withBorder h={260}>
      <WidgetHeader widget={WIDGET_DEFS.resumen_financiero} />
      <Text size="sm" c="dimmed" ta="center" mt="xl">Sin datos financieros</Text>
    </Paper>
  }

  const chartData = data.map(i => ({
    mes: i.mes?.slice(5) || i.mes || '',
    Ingresos: Math.round((i.ingresos || 0) / 1000),
    Gastos: Math.round((i.gastos || 0) / 1000),
  }))

  const totalIngresos = data.reduce((s, i) => s + (i.ingresos || 0), 0)
  const totalGastos = data.reduce((s, i) => s + (i.gastos || 0), 0)
  const balance = totalIngresos - totalGastos

  return (
    <Paper p="md" radius="md" withBorder>
      <WidgetHeader widget={WIDGET_DEFS.resumen_financiero} />
      <SimpleGrid cols={3} mb="sm">
        <Box>
          <Text size="xs" c="dimmed">Ingresos</Text>
          <Text fw={700} c="green" size="sm">{formatCOP(totalIngresos)}</Text>
        </Box>
        <Box>
          <Text size="xs" c="dimmed">Gastos</Text>
          <Text fw={700} c="red" size="sm">{formatCOP(totalGastos)}</Text>
        </Box>
        <Box>
          <Text size="xs" c="dimmed">Balance</Text>
          <Text fw={700} c={balance >= 0 ? 'green' : 'red'} size="sm">{formatCOP(balance)}</Text>
        </Box>
      </SimpleGrid>
      <ResponsiveContainer width="100%" height={200}>
        <ReBarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <ReTooltip formatter={(v) => `$${v}k`} />
          <Legend />
          <Bar dataKey="Ingresos" fill="#4caf50" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gastos" fill="#ef5350" radius={[4, 4, 0, 0]} />
        </ReBarChart>
      </ResponsiveContainer>
    </Paper>
  )
}

function SaludHatoWidget() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/animales/stats/resumen').catch(() => ({ data: {} })),
      api.get('/alertas/', { params: { tipo: 'sanitaria', limit: 5 } }).catch(() => ({ data: [] })),
    ]).then(([resumen, alertas]) => {
      setData({
        resumen: resumen.data,
        alertas: Array.isArray(alertas.data) ? alertas.data : [],
      })
    }).catch(() => setData({ resumen: {}, alertas: [] }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton height={220} />
  if (!data) return null

  const { resumen, alertas } = data

  return (
    <Paper p="md" radius="md" withBorder>
      <WidgetHeader widget={WIDGET_DEFS.salud_hato} />
      <SimpleGrid cols={3} mb="sm">
        <Box>
          <Text size="xs" c="dimmed">Enfermos</Text>
          <Group gap={4}>
            <IconHeartbeat size={16} color="var(--mantine-color-red-6)" />
            <Text fw={700} size="sm">{resumen.total_enfermos || 0}</Text>
          </Group>
        </Box>
        <Box>
          <Text size="xs" c="dimmed">Vacunas Pend.</Text>
          <Group gap={4}>
            <IconVaccine size={16} color="var(--mantine-color-orange-6)" />
            <Text fw={700} size="sm">{resumen.vacunas_pendientes || 0}</Text>
          </Group>
        </Box>
        <Box>
          <Text size="xs" c="dimmed">Mortalidad</Text>
          <Group gap={4}>
            <IconAlertCircle size={16} color="var(--mantine-color-gray-6)" />
            <Text fw={700} size="sm">{resumen.mortalidad_mes || 0}</Text>
          </Group>
        </Box>
      </SimpleGrid>
      <Divider mb="xs" />
      <Text size="xs" fw={600} mb={4} c="dimmed">Alertas Sanitarias</Text>
      {alertas.length === 0 ? (
        <Text size="xs" c="dimmed">Sin alertas activas</Text>
      ) : (
        <ScrollArea h={80}>
          <Stack gap={4}>
            {alertas.map((a, i) => (
              <Group key={i} gap={4}>
                <IconAlertTriangle size={12} color="var(--mantine-color-red-5)" />
                <Text size="xs" lineClamp={1}>{a.mensaje || a.descripcion || 'Alerta sanitaria'}</Text>
              </Group>
            ))}
          </Stack>
        </ScrollArea>
      )}
    </Paper>
  )
}

function CultivosActivosWidget() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/estadisticas/dashboard')
      .then(({ data: d }) => setData({ siembras: d.total_siembras_activas || 0, area: d.area_cultivada_ha || 0, cosechas: d.proximas_cosechas || 0 }))
      .catch(() => setData({ siembras: 0, area: 0, cosechas: 0 }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton height={140} />

  return (
    <Paper p="md" radius="md" withBorder>
      <WidgetHeader widget={WIDGET_DEFS.cultivos_activos} />
      <SimpleGrid cols={3}>
        <Box>
          <Text size="xs" c="dimmed">Siembras Activas</Text>
          <Group gap={4}>
            <IconSeedling size={16} color="var(--mantine-color-green-6)" />
            <Text fw={700} size="sm">{data.siembras}</Text>
          </Group>
        </Box>
        <Box>
          <Text size="xs" c="dimmed">Área Cultivada</Text>
          <Group gap={4}>
            <IconPlant size={16} color="var(--mantine-color-green-6)" />
            <Text fw={700} size="sm">{formatNumber(data.area)} ha</Text>
          </Group>
        </Box>
        <Box>
          <Text size="xs" c="dimmed">Próximas Cosechas</Text>
          <Group gap={4}>
            <IconCalendarEvent size={16} color="var(--mantine-color-green-6)" />
            <Text fw={700} size="sm">{data.cosechas}</Text>
          </Group>
        </Box>
      </SimpleGrid>
    </Paper>
  )
}

function InventarioCriticoWidget() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/inventario/', { params: { criticos: true, limit: 10 } })
      .then(({ data }) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton height={140} />

  return (
    <Paper p="md" radius="md" withBorder>
      <WidgetHeader widget={WIDGET_DEFS.inventario_critico} />
      {items.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="md">Sin insumos críticos</Text>
      ) : (
        <ScrollArea h={140}>
          <Stack gap={4}>
            {items.map((item, i) => (
              <Group key={i} justify="space-between">
                <Group gap={4}>
                  <IconPackage size={14} color="var(--mantine-color-orange-6)" />
                  <Text size="xs">{item.nombre || item.insumo}</Text>
                </Group>
                <Badge color="orange" size="sm" variant="light">
                  {item.stock_actual || 0}/{item.stock_minimo || 0}
                </Badge>
              </Group>
            ))}
          </Stack>
        </ScrollArea>
      )}
    </Paper>
  )
}

function ProximasActividadesWidget() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/plan-actividades/', { params: { proximas: true, limit: 5 } })
      .then(({ data }) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton height={160} />

  return (
    <Paper p="md" radius="md" withBorder>
      <WidgetHeader widget={WIDGET_DEFS.proximas_actividades} />
      {tasks.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="md">Sin actividades pendientes</Text>
      ) : (
        <ScrollArea h={160}>
          <Stack gap={6}>
            {tasks.map((t, i) => (
              <Group key={i} gap={4} wrap="nowrap">
                <ThemeIcon variant="light" size="sm" radius="xl" color={t.prioridad === 'alta' ? 'red' : t.prioridad === 'media' ? 'yellow' : 'blue'}>
                  <IconChecklist size={12} />
                </ThemeIcon>
                <Box style={{ flex: 1 }}>
                  <Text size="xs" lineClamp={1}>{t.nombre || t.titulo || t.descripcion}</Text>
                  <Text size="10px" c="dimmed">{t.fecha_programada ? new Date(t.fecha_programada).toLocaleDateString('es-CO') : ''}</Text>
                </Box>
                <Badge size="sm" variant="light" color={t.estado === 'pendiente' ? 'yellow' : 'blue'}>{t.estado}</Badge>
              </Group>
            ))}
          </Stack>
        </ScrollArea>
      )}
    </Paper>
  )
}

function AlertasRecientesWidget() {
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/alertas/', { params: { leida: false, limit: 5 } })
      .then(({ data }) => setAlertas(Array.isArray(data) ? data : []))
      .catch(() => setAlertas([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton height={160} />

  return (
    <Paper p="md" radius="md" withBorder>
      <WidgetHeader widget={WIDGET_DEFS.alertas_recientes} />
      {alertas.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="md">Sin alertas pendientes</Text>
      ) : (
        <ScrollArea h={160}>
          <Stack gap={6}>
            {alertas.map((a, i) => (
              <Group key={i} gap={4} wrap="nowrap">
                <ThemeIcon variant="light" size="sm" radius="xl" color={a.tipo === 'sanitaria' ? 'red' : a.tipo === 'inventario' ? 'orange' : 'blue'}>
                  <IconAlertTriangle size={12} />
                </ThemeIcon>
                <Box style={{ flex: 1 }}>
                  <Text size="xs" lineClamp={1}>{a.mensaje || a.descripcion || 'Alerta'}</Text>
                  <Text size="10px" c="dimmed">{a.fecha ? new Date(a.fecha).toLocaleString('es-CO') : ''}</Text>
                </Box>
                <Badge size="sm" variant="light" color={a.tipo === 'sanitaria' ? 'red' : a.tipo === 'inventario' ? 'orange' : 'blue'}>{a.tipo}</Badge>
              </Group>
            ))}
          </Stack>
        </ScrollArea>
      )}
    </Paper>
  )
}

function ClimaWidget() {
  const [clima, setClima] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/registros-climaticos/', { params: { limit: 1, order: '-fecha' } })
      .then(({ data }) => {
        const d = Array.isArray(data) ? data[0] : data
        setClima(d || null)
      })
      .catch(() => setClima(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton height={140} />

  return (
    <Paper p="md" radius="md" withBorder>
      <WidgetHeader widget={WIDGET_DEFS.clima} />
      {!clima ? (
        <Text size="sm" c="dimmed" ta="center" py="md">Sin registro climático</Text>
      ) : (
        <SimpleGrid cols={3}>
          <Box ta="center">
            <IconDroplet size={20} color="var(--mantine-color-blue-6)" />
            <Text size="xs" c="dimmed">Lluvia</Text>
            <Text fw={700} size="sm">{clima.precipitacion || 0} mm</Text>
          </Box>
          <Box ta="center">
            <IconTemperature size={20} color="var(--mantine-color-orange-6)" />
            <Text size="xs" c="dimmed">Temperatura</Text>
            <Text fw={700} size="sm">{clima.temperatura || clima.temp || 0}°C</Text>
          </Box>
          <Box ta="center">
            <IconCloudRain size={20} color="var(--mantine-color-gray-6)" />
            <Text size="xs" c="dimmed">Humedad</Text>
            <Text fw={700} size="sm">{clima.humedad || 0}%</Text>
          </Box>
        </SimpleGrid>
      )}
    </Paper>
  )
}

function MapaRapidoWidget() {
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)
  const fincaId = localStorage.getItem('agrop_finca_id')

  useEffect(() => {
    if (!fincaId) {
      setLoading(false)
      return
    }
    api.get('/lotes/', { params: { finca_id: fincaId } })
      .then(({ data }) => setLotes(Array.isArray(data) ? data : []))
      .catch(() => setLotes([]))
      .finally(() => setLoading(false))
  }, [fincaId])

  const center = useMemo(() => {
    if (lotes.length === 0) return [4.5709, -74.2973]
    const lote = lotes.find(l => l.latitud && l.longitud) || lotes[0]
    if (lote?.latitud && lote?.longitud) return [parseFloat(lote.latitud), parseFloat(lote.longitud)]
    return [4.5709, -74.2973]
  }, [lotes])

  if (loading) return <Skeleton height={200} />

  return (
    <Paper p="md" radius="md" withBorder>
      <WidgetHeader widget={WIDGET_DEFS.mapa_rapido} />
      <Box style={{ height: 180, borderRadius: 8, overflow: 'hidden' }}>
        <MapContainer center={center} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {lotes.filter(l => l.latitud && l.longitud).map((lote, i) => (
            <Marker key={i} position={[parseFloat(lote.latitud), parseFloat(lote.longitud)]}>
              <Popup>{lote.nombre || `Lote ${lote.id}`}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </Box>
    </Paper>
  )
}

function GastosPieChart() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/finanzas/costos')
      .then(({ data: d }) => {
        const arr = Array.isArray(d) ? d : (d.categorias || d.gastos || [])
        setData(arr.slice(0, 6))
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton height={220} />
  if (data.length === 0) return null

  return (
    <Paper p="md" radius="md" withBorder>
      <Text fw={600} size="sm" mb="sm">Distribución de Gastos</Text>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="valor || monto || total"
            nameKey="nombre || categoria || concepto"
            label={({ nombre, categoria, concepto, percent }) => `${(nombre || categoria || concepto || '').slice(0, 8)} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLOR_PALETTE[i % COLOR_PALETTE.length]} />
            ))}
          </Pie>
          <ReTooltip />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  )
}

function MortalidadChart() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/animales/stats/resumen')
      .then(({ data: d }) => {
        const especies = ['bovino', 'porcino', 'aviar', 'ovino', 'caprino', 'equino']
        const chartData = especies.map(e => ({
          especie: e.charAt(0).toUpperCase() + e.slice(1),
          mortalidad: d[`mortalidad_${e}`] || d[`muertes_${e}`] || 0,
        })).filter(e => e.mortalidad > 0)
        setData(chartData)
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton height={220} />
  if (data.length === 0) return null

  return (
    <Paper p="md" radius="md" withBorder>
      <Text fw={600} size="sm" mb="sm">Mortalidad por Especie</Text>
      <ResponsiveContainer width="100%" height={220}>
        <ReBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="especie" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <ReTooltip />
          <Bar dataKey="mortalidad" fill="#ef5350" radius={[4, 4, 0, 0]} />
        </ReBarChart>
      </ResponsiveContainer>
    </Paper>
  )
}

function TimeRangeSelector({ value, onChange }) {
  return (
    <Group gap={4}>
      {TIME_RANGES.map((r) => (
        <Badge
          key={r.value}
          variant={value === r.value ? 'filled' : 'light'}
          color="green"
          size="sm"
          style={{ cursor: 'pointer' }}
          onClick={() => onChange(r.value)}
        >
          {r.label}
        </Badge>
      ))}
    </Group>
  )
}

function getVisibleWidgets(role, hiddenWidgets) {
  return DEFAULT_WIDGET_ORDER.filter((id) => {
    const def = WIDGET_DEFS[id]
    if (!def) return false
    if (hiddenWidgets.includes(id)) return false
    return def.roles.includes(role) || role === ROLES.ADMIN
  })
}

export default function Dashboard() {
  const theme = useMantineTheme()
  const { user } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('month')
  const [widgetOrder, setWidgetOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('agrop_dashboard_widget_order')
      return saved ? JSON.parse(saved) : DEFAULT_WIDGET_ORDER
    } catch {
      return DEFAULT_WIDGET_ORDER
    }
  })
  const [hiddenWidgets, setHiddenWidgets] = useState([])

  const role = user?.rol || ROLES.ADMIN
  const fincaId = localStorage.getItem('agrop_finca_id')

  const visibleWidgets = useMemo(() => {
    return widgetOrder.filter((id) => {
      const def = WIDGET_DEFS[id]
      if (!def) return false
      if (hiddenWidgets.includes(id)) return false
      return def.roles.includes(role)
    })
  }, [widgetOrder, hiddenWidgets, role])

  useEffect(() => {
    const params = { ...getTimeParams(timeRange) }
    if (fincaId) params.finca_id = fincaId
    setStatsLoading(true)
    api.get('/estadisticas/dashboard', { params })
      .then(({ data }) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false))
  }, [timeRange, fincaId])

  const reorderWidget = useCallback((id, direction) => {
    setWidgetOrder((prev) => {
      const idx = prev.indexOf(id)
      if (idx === -1) return prev
      const newOrder = [...prev]
      const target = idx + direction
      if (target < 0 || target >= newOrder.length) return prev
      ;[newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]]
      localStorage.setItem('agrop_dashboard_widget_order', JSON.stringify(newOrder))
      return newOrder
    })
  }, [])

  const hideWidget = useCallback((id) => {
    setHiddenWidgets((prev) => [...prev, id])
  }, [])

  const resetWidgets = useCallback(() => {
    setWidgetOrder(DEFAULT_WIDGET_ORDER)
    setHiddenWidgets([])
    localStorage.setItem('agrop_dashboard_widget_order', JSON.stringify(DEFAULT_WIDGET_ORDER))
  }, [])

  const handleTimeRangeChange = useCallback((range) => {
    setTimeRange(range)
  }, [])

  return (
    <Stack>
      <Group justify="space-between" wrap="wrap">
        <Title order={3} style={{ fontSize: isMobile ? 16 : 22 }}>
          Dashboard
          {stats?.finca_nombre && (
            <Text component="span" size="sm" c="dimmed" ml="xs">- {stats.finca_nombre}</Text>
          )}
        </Title>
        <Group gap="xs">
          <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
          <Tooltip label="Reordenar widgets">
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={resetWidgets}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} spacing="sm">
        <KPICard
          title="Total Animales"
          value={statsLoading ? '' : formatNumber(stats?.total_animales || 0)}
          icon={IconPig}
          color="blue"
          loading={statsLoading}
        />
        <KPICard
          title="Cultivos Activos"
          value={statsLoading ? '' : formatNumber(stats?.total_siembras_activas || 0)}
          icon={IconSeedling}
          color="green"
          loading={statsLoading}
        />
        <KPICard
          title="Siembras Activas"
          value={statsLoading ? '' : formatNumber(stats?.total_siembras_activas || 0)}
          icon={IconPlant}
          color="green"
          loading={statsLoading}
        />
        <KPICard
          title="Balance del Mes"
          value={statsLoading ? '' : formatCOP(stats?.balance_mes || 0)}
          icon={IconCoin}
          color={stats?.balance_mes >= 0 ? 'green' : 'red'}
          trend={stats?.balance_mes >= 0 ? 1 : -1}
          trendLabel="vs mes anterior"
          loading={statsLoading}
        />
        <KPICard
          title="Alertas Sin Leer"
          value={statsLoading ? '' : formatNumber(stats?.alertas_sin_leer || 0)}
          icon={IconAlertTriangle}
          color="red"
          loading={statsLoading}
        />
      </SimpleGrid>

      <Grid>
        {visibleWidgets.map((widgetId, index) => {
          const def = WIDGET_DEFS[widgetId]
          if (!def) return null

          const span = def.defaultSize || { span: 6, md: 4 }
          const canMoveUp = index > 0
          const canMoveDown = index < visibleWidgets.length - 1

          return (
            <Grid.Col key={widgetId} span={{ base: 12, md: span.md || span.span || 4 }}>
              <Box style={{ position: 'relative' }}>
                {widgetId === 'resumen_financiero' && <ResumenFinancieroWidget timeRange={timeRange} />}
                {widgetId === 'salud_hato' && <SaludHatoWidget />}
                {widgetId === 'cultivos_activos' && <CultivosActivosWidget />}
                {widgetId === 'inventario_critico' && <InventarioCriticoWidget />}
                {widgetId === 'proximas_actividades' && <ProximasActividadesWidget />}
                {widgetId === 'alertas_recientes' && <AlertasRecientesWidget />}
                {widgetId === 'clima' && <ClimaWidget />}
                {widgetId === 'mapa_rapido' && <MapaRapidoWidget />}
                {!isMobile && (
                  <Group gap={2} justify="center" mt={4}>
                    <ActionIcon variant="subtle" color="gray" size="xs" disabled={!canMoveUp} onClick={() => reorderWidget(widgetId, -1)}>
                      ↑
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="gray" size="xs" disabled={!canMoveDown} onClick={() => reorderWidget(widgetId, 1)}>
                      ↓
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" size="xs" onClick={() => hideWidget(widgetId)}>
                      <IconX size={12} />
                    </ActionIcon>
                  </Group>
                )}
              </Box>
            </Grid.Col>
          )
        })}
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <GastosPieChart />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <MortalidadChart />
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
