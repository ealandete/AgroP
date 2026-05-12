import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Grid, Paper, Text, Group, Stack, Title, Skeleton, SimpleGrid,
  Badge, ActionIcon, Tooltip, Box, Divider, ThemeIcon, ScrollArea, Button,
  useMantineTheme, Modal, SegmentedControl,
} from '@mantine/core'
import { useMediaQuery, useDisclosure } from '@mantine/hooks'
import {
  IconPig, IconPlant, IconCoin, IconMilk, IconEgg,
  IconArrowUpRight, IconArrowDownRight, IconWeight, IconStethoscope,
  IconAlertTriangle, IconCalendarEvent, IconCloudRain, IconMap,
  IconGripVertical, IconRefresh, IconVaccine,
  IconDroplet, IconTemperature, IconLeaf, IconBox,
  IconHeartbeat, IconAlertCircle, IconChecklist,
  IconRobot, IconArrowRight, IconHistory,
  IconVaccine as IconVaccine2, IconActivity, IconScan,
  IconUsers, IconGauge, IconSettings,
  IconEye, IconEyeOff, IconArrowUp, IconArrowDown,
} from '@tabler/icons-react'
import {
  BarChart as ReBarChart, PieChart, Pie, Cell,
  Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import api from '../services/api'
import { formatCOP, formatNumber, COLOR_PALETTE } from '../config'
import { useAuth } from '../store/AuthContext'
import { useIdioma } from '../store/IdiomaContext.jsx'
import { WidgetProvider, useWidgets, WIDGETS_DISPONIBLES } from '../store/WidgetContext'
import DashboardWidget from '../components/DashboardWidget'
import WeatherWidget from '../components/WeatherWidget'
import QRScanner from '../components/QRScanner'

const WIDGET_ICONS = {
  IconCoin, IconHeart: IconStethoscope, IconPlant: IconLeaf,
  IconBox, IconCalendarEvent, IconBell: IconAlertTriangle,
  IconCloud: IconCloudRain, IconMap, IconActivity: IconHistory,
  IconUsers, IconDroplet, IconGauge,
}

const TIME_RANGES = [
  { value: 'today', label: 'time_hoy' },
  { value: 'week', label: 'time_semana' },
  { value: 'month', label: 'time_mes' },
  { value: 'quarter', label: 'time_trimestre' },
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

function TimeRangeSelector({ value, onChange }) {
  const { t } = useIdioma()
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
          {t(r.label)}
        </Badge>
      ))}
    </Group>
  )
}

function WidgetSelectorModal({ opened, onClose }) {
  const {
    activeWidgets, availableWidgets, allWidgets,
    addWidget, removeWidget, reorderWidgets, showWidget,
    resetDefaults, isHidden,
  } = useWidgets()
  const [tab, setTab] = useState('active')

  const handleMove = useCallback((id, dir) => {
    reorderWidgets(id, dir)
  }, [reorderWidgets])

  const sortedActive = useMemo(() => {
    return allWidgets
      .filter(w => activeWidgets.includes(w.id))
      .sort((a, b) => activeWidgets.indexOf(a.id) - activeWidgets.indexOf(b.id))
  }, [allWidgets, activeWidgets])

  const hidden = useMemo(() => {
    return allWidgets.filter(w => isHidden(w.id))
  }, [allWidgets, isHidden])

  const availableNotAdded = useMemo(() => {
    return availableWidgets.filter(w => !activeWidgets.includes(w.id) && !isHidden(w.id))
  }, [availableWidgets, activeWidgets, isHidden])

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600}>Personalizar Dashboard</Text>}
      size="xl"
      styles={{ body: { padding: 0 } }}
    >
      <Stack gap={0}>
        <Box px="md" pt="md" pb="xs">
          <SegmentedControl
            value={tab}
            onChange={setTab}
            data={[
              { label: `Activos (${sortedActive.length})`, value: 'active' },
              { label: `Disponibles (${availableNotAdded.length})`, value: 'available' },
              { label: `Ocultos (${hidden.length})`, value: 'hidden' },
            ]}
            fullWidth
            size="xs"
          />
        </Box>

        <Box px="md" pb="md">
          <Button variant="subtle" color="red" size="xs" onClick={resetDefaults}>
            Restaurar predeterminados
          </Button>
        </Box>

        {tab === 'active' && (
          <Stack gap={4} px="md" pb="md">
            {sortedActive.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">No hay widgets activos</Text>
            ) : (
              sortedActive.map((widget, index) => (
                <Paper key={widget.id} p="sm" radius="sm" withBorder>
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap={6}>
                      <ThemeIcon variant="light" size="sm" radius="md" color="green">
                        <IconGripVertical size={12} />
                      </ThemeIcon>
                      <Text size="sm" fw={500}>{widget.title}</Text>
                      <Badge size="sm" variant="light" color="gray">{widget.defaultWidth}</Badge>
                    </Group>
                    <Group gap={2}>
                      <ActionIcon
                        variant="subtle" color="gray" size="sm"
                        disabled={index === 0}
                        onClick={() => handleMove(widget.id, -1)}
                      >
                        <IconArrowUp size={14} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle" color="gray" size="sm"
                        disabled={index === sortedActive.length - 1}
                        onClick={() => handleMove(widget.id, 1)}
                      >
                        <IconArrowDown size={14} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="red" size="sm" onClick={() => removeWidget(widget.id)}>
                        <IconEyeOff size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Paper>
              ))
            )}
          </Stack>
        )}

        {tab === 'available' && (
          <Stack gap={4} px="md" pb="md">
            {availableNotAdded.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">Todos los widgets disponibles están activos</Text>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {availableNotAdded.map((widget) => {
                  const IconComp = WIDGET_ICONS[widget.icon] || IconPlant
                  return (
                    <Paper key={widget.id} p="sm" radius="sm" withBorder style={{ cursor: 'pointer' }} onClick={() => { addWidget(widget.id); showWidget(widget.id) }}>
                      <Group gap={6}>
                        <ThemeIcon variant="light" size="sm" radius="md" color="green">
                          <IconComp size={14} />
                        </ThemeIcon>
                        <Box style={{ flex: 1 }}>
                          <Text size="sm" fw={500}>{widget.title}</Text>
                          <Text size="10px" c="dimmed">{widget.roles.join(', ')}</Text>
                        </Box>
                        <Badge size="sm" variant="light" color="blue">{widget.defaultWidth}</Badge>
                      </Group>
                    </Paper>
                  )
                })}
              </SimpleGrid>
            )}
          </Stack>
        )}

        {tab === 'hidden' && (
          <Stack gap={4} px="md" pb="md">
            {hidden.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">No hay widgets ocultos</Text>
            ) : (
              hidden.map((widget) => {
                const IconComp = WIDGET_ICONS[widget.icon] || IconPlant
                return (
                  <Paper key={widget.id} p="sm" radius="sm" withBorder>
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap={6}>
                        <ThemeIcon variant="light" size="sm" radius="md" color="gray">
                          <IconComp size={14} />
                        </ThemeIcon>
                        <Text size="sm" fw={500}>{widget.title}</Text>
                      </Group>
                      <Button size="xs" variant="light" color="green" onClick={() => showWidget(widget.id)}>
                        <IconEye size={14} />
                      </Button>
                    </Group>
                  </Paper>
                )
              })
            )}
          </Stack>
        )}
      </Stack>
    </Modal>
  )
}

function ResumenFinancieroWidget({ timeRange }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = getTimeParams(timeRange)
    api.get('/estadisticas/finanzas/ingresos-vs-gastos', { params: { meses: 6, ...params } })
      .then(({ data: d }) => setData(Array.isArray(d) ? d : []))
      .catch(() => setError('Error al cargar datos financieros'))
      .finally(() => setLoading(false))
  }, [timeRange])

  useEffect(() => { fetchData() }, [fetchData])

  const isEmpty = !loading && !error && (!data || data.length === 0)

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    return data.map(i => ({
      mes: i.mes?.slice(5) || i.mes || '',
      Ingresos: Math.round((i.ingresos || 0) / 1000),
      Gastos: Math.round((i.gastos || 0) / 1000),
    }))
  }, [data])

  const totalIngresos = useMemo(() => data?.reduce((s, i) => s + (i.ingresos || 0), 0) || 0, [data])
  const totalGastos = useMemo(() => data?.reduce((s, i) => s + (i.gastos || 0), 0) || 0, [data])
  const balance = totalIngresos - totalGastos

  return (
    <DashboardWidget
      title="Resumen Financiero" icon={IconCoin} color="green"
      loading={loading} error={error} isEmpty={isEmpty}
      emptyMessage="Sin datos financieros" onRefresh={fetchData}
    >
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
    </DashboardWidget>
  )
}

function SaludHatoWidget() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.get('/animales/stats/resumen').catch(() => ({ data: {} })),
      api.get('/alertas/', { params: { tipo: 'sanitaria', limit: 5 } }).catch(() => ({ data: [] })),
    ]).then(([resumen, alertas]) => {
      setData({
        resumen: resumen.data,
        alertas: Array.isArray(alertas.data) ? alertas.data : [],
      })
    }).catch(() => setError('Error al cargar salud del hato'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const isEmpty = !loading && !error && (!data || !data.resumen)

  return (
    <DashboardWidget
      title="Salud del Hato" icon={IconStethoscope} color="red"
      loading={loading} error={error} isEmpty={isEmpty}
      emptyMessage="Sin datos de salud" onRefresh={fetchData}
    >
      {data && (
        <>
          <SimpleGrid cols={3} mb="sm">
            <Box>
              <Text size="xs" c="dimmed">Enfermos</Text>
              <Group gap={4}>
                <IconHeartbeat size={16} color="var(--mantine-color-red-6)" />
                <Text fw={700} size="sm">{data.resumen.total_enfermos || 0}</Text>
              </Group>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Vacunas Pend.</Text>
              <Group gap={4}>
                <IconVaccine size={16} color="var(--mantine-color-orange-6)" />
                <Text fw={700} size="sm">{data.resumen.vacunas_pendientes || 0}</Text>
              </Group>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">Mortalidad</Text>
              <Group gap={4}>
                <IconAlertCircle size={16} color="var(--mantine-color-gray-6)" />
                <Text fw={700} size="sm">{data.resumen.mortalidad_mes || 0}</Text>
              </Group>
            </Box>
          </SimpleGrid>
          <Divider mb="xs" />
          <Text size="xs" fw={600} mb={4} c="dimmed">Alertas Sanitarias</Text>
          {data.alertas.length === 0 ? (
            <Text size="xs" c="dimmed">Sin alertas activas</Text>
          ) : (
            <ScrollArea h={80}>
              <Stack gap={4}>
                {data.alertas.map((a, i) => (
                  <Group key={i} gap={4}>
                    <IconAlertTriangle size={12} color="var(--mantine-color-red-5)" />
                    <Text size="xs" lineClamp={1}>{a.mensaje || a.descripcion || 'Alerta sanitaria'}</Text>
                  </Group>
                ))}
              </Stack>
            </ScrollArea>
          )}
        </>
      )}
    </DashboardWidget>
  )
}

function CultivosActivosWidget() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    api.get('/estadisticas/dashboard')
      .then(({ data: d }) => setData({ siembras: d.total_siembras_activas || 0, area: d.area_cultivada_ha || 0, cosechas: d.proximas_cosechas || 0 }))
      .catch(() => setError('Error al cargar cultivos'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const isEmpty = !loading && !error && (!data || (data.siembras === 0 && data.area === 0 && data.cosechas === 0))

  return (
    <DashboardWidget
      title="Cultivos Activos" icon={IconLeaf} color="green"
      loading={loading} error={error} isEmpty={isEmpty}
      emptyMessage="Sin cultivos activos" onRefresh={fetchData}
    >
      <SimpleGrid cols={3}>
        <Box>
          <Text size="xs" c="dimmed">Siembras Activas</Text>
          <Group gap={4}>
            <IconLeaf size={16} color="var(--mantine-color-green-6)" />
            <Text fw={700} size="sm">{data?.siembras || 0}</Text>
          </Group>
        </Box>
        <Box>
          <Text size="xs" c="dimmed">Área Cultivada</Text>
          <Group gap={4}>
            <IconPlant size={16} color="var(--mantine-color-green-6)" />
            <Text fw={700} size="sm">{formatNumber(data?.area || 0)} ha</Text>
          </Group>
        </Box>
        <Box>
          <Text size="xs" c="dimmed">Próximas Cosechas</Text>
          <Group gap={4}>
            <IconCalendarEvent size={16} color="var(--mantine-color-green-6)" />
            <Text fw={700} size="sm">{data?.cosechas || 0}</Text>
          </Group>
        </Box>
      </SimpleGrid>
    </DashboardWidget>
  )
}

function InventarioCriticoWidget() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    api.get('/inventario/', { params: { criticos: true, limit: 10 } })
      .then(({ data }) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setError('Error al cargar inventario'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <DashboardWidget
      title="Inventario Crítico" icon={IconBox} color="orange"
      loading={loading} error={error} isEmpty={!loading && !error && items.length === 0}
      emptyMessage="Sin insumos críticos" onRefresh={fetchData}
    >
      <ScrollArea h={140}>
        <Stack gap={4}>
          {items.map((item, i) => (
            <Group key={i} justify="space-between">
              <Group gap={4}>
                <IconBox size={14} color="var(--mantine-color-orange-6)" />
                <Text size="xs">{item.nombre || item.insumo}</Text>
              </Group>
              <Badge color="orange" size="sm" variant="light">
                {item.stock_actual || 0}/{item.stock_minimo || 0}
              </Badge>
            </Group>
          ))}
        </Stack>
      </ScrollArea>
    </DashboardWidget>
  )
}

function ProximasActividadesWidget() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    api.get('/plan-actividades/', { params: { proximas: true, limit: 5 } })
      .then(({ data }) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setError('Error al cargar actividades'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <DashboardWidget
      title="Próximas Actividades" icon={IconCalendarEvent} color="blue"
      loading={loading} error={error} isEmpty={!loading && !error && tasks.length === 0}
      emptyMessage="Sin actividades pendientes" onRefresh={fetchData}
    >
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
    </DashboardWidget>
  )
}

function AlertasRecientesWidget() {
  const navigate = useNavigate()
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    api.get('/alertas/', { params: { leida: false, limit: 5 } })
      .then(({ data }) => setAlertas(Array.isArray(data) ? data : []))
      .catch(() => setError('Error al cargar alertas'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getAlertaRoute = (tipo) => {
    switch (tipo) {
      case 'inventario': return '/inventario'
      case 'sanitaria':
      case 'vacuna':
      case 'peso':
      case 'pesaje': return '/animales'
      case 'cosecha': return '/cultivos'
      default: return '/alertas'
    }
  }

  return (
    <DashboardWidget
      title="Alertas Recientes" icon={IconAlertTriangle} color="red"
      loading={loading} error={error} isEmpty={!loading && !error && alertas.length === 0}
      emptyMessage="Sin alertas pendientes" onRefresh={fetchData}
    >
      <ScrollArea h={200}>
        <Stack gap={6}>
          {alertas.map((a, i) => (
            <Paper
              key={i}
              p="xs"
              radius="sm"
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(getAlertaRoute(a.tipo))}
            >
              <Group gap={4} wrap="nowrap">
                <ThemeIcon variant="light" size="sm" radius="xl" color={a.tipo === 'sanitaria' ? 'red' : a.tipo === 'inventario' ? 'orange' : 'blue'}>
                  <IconAlertTriangle size={12} />
                </ThemeIcon>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text size="xs" fw={600} lineClamp={1}>{a.titulo || a.mensaje || 'Alerta'}</Text>
                  <Text size="10px" c="dimmed" lineClamp={1}>{a.descripcion || ''}</Text>
                  <Text size="10px" c="dimmed">{a.fecha ? new Date(a.fecha).toLocaleString('es-CO') : ''}</Text>
                </Box>
                <Badge size="sm" variant="light" color={a.tipo === 'sanitaria' ? 'red' : a.tipo === 'inventario' ? 'orange' : 'blue'}>{a.tipo}</Badge>
              </Group>
            </Paper>
          ))}
        </Stack>
      </ScrollArea>
    </DashboardWidget>
  )
}

function ClimaInternoWidget() {
  const [clima, setClima] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    api.get('/registros-climaticos/', { params: { limit: 1, order: '-fecha' } })
      .then(({ data }) => {
        const d = Array.isArray(data) ? data[0] : data
        setClima(d || null)
      })
      .catch(() => setError('Error al cargar clima'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <DashboardWidget
      title="Clima" icon={IconCloudRain} color="cyan"
      loading={loading} error={error} isEmpty={!loading && !error && !clima}
      emptyMessage="Sin registro climático" onRefresh={fetchData}
    >
      {clima && (
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
    </DashboardWidget>
  )
}

function MapaRapidoWidget() {
  const navigate = useNavigate()
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fincaId = localStorage.getItem('agrop_finca_id')

  const fetchData = useCallback(() => {
    if (!fincaId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    api.get('/lotes/', { params: { finca_id: fincaId } })
      .then(({ data }) => setLotes(Array.isArray(data) ? data : []))
      .catch(() => setError('Error al cargar mapa'))
      .finally(() => setLoading(false))
  }, [fincaId])

  useEffect(() => { fetchData() }, [fetchData])

  const center = useMemo(() => {
    if (lotes.length === 0) return [4.5709, -74.2973]
    const lote = lotes.find(l => l.latitud && l.longitud) || lotes[0]
    if (lote?.latitud && lote?.longitud) return [parseFloat(lote.latitud), parseFloat(lote.longitud)]
    return [4.5709, -74.2973]
  }, [lotes])

  return (
    <DashboardWidget
      title="Mapa de Lotes" icon={IconMap} color="teal"
      loading={loading} error={error} isEmpty={!loading && !fincaId}
      emptyMessage="Configure una finca para ver el mapa"
      onRefresh={fetchData}
    >
      <Box
        style={{ height: 180, borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}
        onClick={() => navigate('/lotes')}
      >
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
    </DashboardWidget>
  )
}

function ActividadRecienteWidget() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.allSettled([
      api.get('/alertas/', { params: { limit: 10, order: '-fecha' } }).catch(() => ({ data: [] })),
      api.get('/operaciones/', { params: { limit: 10, order: '-fecha' } }).catch(() => ({ data: [] })),
      api.get('/plan-actividades/', { params: { limit: 10, order: '-fecha_creacion' } }).catch(() => ({ data: [] })),
    ]).then(([alertas, operaciones, actividades]) => {
      const result = []
      const alertasData = Array.isArray(alertas.value?.data) ? alertas.value.data : []
      const operacionesData = Array.isArray(operaciones.value?.data) ? operaciones.value.data : []
      const actividadesData = Array.isArray(actividades.value?.data) ? actividades.value.data : []

      alertasData.forEach(a => result.push({
        id: `a-${a.id}`, type: 'alerta', text: a.mensaje || a.descripcion || 'Alerta',
        date: a.fecha, icon: IconAlertTriangle, color: 'red',
      }))
      operacionesData.forEach(o => result.push({
        id: `o-${o.id}`, type: 'operacion', text: o.nombre || o.descripcion || 'Operación',
        date: o.fecha, icon: IconActivity, color: 'blue',
      }))
      actividadesData.forEach(ac => result.push({
        id: `ac-${ac.id}`, type: 'actividad', text: ac.nombre || ac.titulo || 'Actividad',
        date: ac.fecha_creacion || ac.fecha, icon: IconCalendarEvent, color: 'green',
      }))
      result.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      setItems(result.slice(0, 10))
    }).catch(() => setError('Error al cargar actividad'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <DashboardWidget
      title="Actividad Reciente" icon={IconHistory} color="violet"
      loading={loading} error={error} isEmpty={!loading && !error && items.length === 0}
      emptyMessage="Sin actividad reciente" onRefresh={fetchData}
    >
      <ScrollArea h={240}>
        <Stack gap={6}>
          {items.map(item => (
            <Group key={item.id} gap={6} align="flex-start" wrap="nowrap">
              <ThemeIcon variant="light" size="sm" radius="xl" color={item.color}>
                <item.icon size={12} />
              </ThemeIcon>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="xs" lineClamp={1}>{item.text}</Text>
                <Text size="10px" c="dimmed">
                  {item.date ? new Date(item.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
              </Box>
            </Group>
          ))}
        </Stack>
      </ScrollArea>
    </DashboardWidget>
  )
}

function EquipoTrabajoWidget() {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    const today = new Date().toISOString().slice(0, 10)
    api.get('/trabajadores/', { params: { activos: true, limit: 20 } })
      .then(({ data }) => {
        const arr = Array.isArray(data) ? data : []
        const attendance = arr.filter(w => {
          if (w.asistencia_hoy) return true
          if (w.ultima_asistencia) {
            return w.ultima_asistencia.slice(0, 10) === today
          }
          return false
        })
        setWorkers(attendance.length > 0 ? attendance : arr.slice(0, 10))
      })
      .catch(() => setError('Error al cargar equipo'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <DashboardWidget
      title="Equipo de Trabajo" icon={IconUsers} color="blue"
      loading={loading} error={error} isEmpty={!loading && !error && workers.length === 0}
      emptyMessage="Sin trabajadores registrados" onRefresh={fetchData}
    >
      <ScrollArea h={160}>
        <Stack gap={4}>
          {workers.map((w, i) => (
            <Group key={i} gap={4} wrap="nowrap">
              <ThemeIcon variant="light" size="sm" radius="xl" color={w.asistencia_hoy || w.ultima_asistencia?.slice(0, 10) === new Date().toISOString().slice(0, 10) ? 'green' : 'gray'}>
                <IconUsers size={12} />
              </ThemeIcon>
              <Box style={{ flex: 1 }}>
                <Text size="xs" fw={500}>{w.nombre || `${w.nombres || ''} ${w.apellidos || ''}`}</Text>
                <Text size="10px" c="dimmed">{w.cargo || w.rol || w.tipo || ''}</Text>
              </Box>
              <Badge size="sm" variant="light" color={w.asistencia_hoy ? 'green' : 'gray'}>
                {w.asistencia_hoy ? 'Presente' : 'Sin registro'}
              </Badge>
            </Group>
          ))}
        </Stack>
      </ScrollArea>
    </DashboardWidget>
  )
}

function ProduccionWidget() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    api.get('/estadisticas/dashboard')
      .then(({ data: d }) => {
        setData({
          leche: d.produccion_leche_litros || d.leche_total || 0,
          huevos: d.produccion_huevos || d.huevos_total || 0,
          miel: d.produccion_miel_kg || d.miel_total || 0,
          carne: d.produccion_carne_kg || d.carne_total || 0,
        })
      })
      .catch(() => setError('Error al cargar producción'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  
  const allZero = !data || (data.leche === 0 && data.huevos === 0 && data.miel === 0 && data.carne === 0)

  return (
    <DashboardWidget
      title="Producción" icon={IconDroplet} color="yellow"
      loading={loading} error={error} isEmpty={!loading && !error && allZero}
      emptyMessage="Sin datos de producción" onRefresh={fetchData}
    >
      {data && (
        <SimpleGrid cols={2} spacing="sm">
          <Paper p="xs" radius="sm" withBorder>
            <Group gap={4}>
              <IconMilk size={16} color="var(--mantine-color-blue-6)" />
              <Box>
                <Text size="10px" c="dimmed">Leche</Text>
                <Text fw={700} size="sm">{formatNumber(data.leche)} L</Text>
              </Box>
            </Group>
          </Paper>
          <Paper p="xs" radius="sm" withBorder>
            <Group gap={4}>
              <IconEgg size={16} color="var(--mantine-color-orange-6)" />
              <Box>
                <Text size="10px" c="dimmed">Huevos</Text>
                <Text fw={700} size="sm">{formatNumber(data.huevos)} und</Text>
              </Box>
            </Group>
          </Paper>
          <Paper p="xs" radius="sm" withBorder>
            <Group gap={4}>
              <IconDroplet size={16} color="var(--mantine-color-yellow-6)" />
              <Box>
                <Text size="10px" c="dimmed">Miel</Text>
                <Text fw={700} size="sm">{formatNumber(data.miel)} kg</Text>
              </Box>
            </Group>
          </Paper>
          <Paper p="xs" radius="sm" withBorder>
            <Group gap={4}>
              <IconWeight size={16} color="var(--mantine-color-red-6)" />
              <Box>
                <Text size="10px" c="dimmed">Carne</Text>
                <Text fw={700} size="sm">{formatNumber(data.carne)} kg</Text>
              </Box>
            </Group>
          </Paper>
        </SimpleGrid>
      )}
    </DashboardWidget>
  )
}

function EficienciaWidget() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    api.get('/estadisticas/dashboard')
      .then(({ data: d }) => {
        const conversion = d.conversion_alimenticia || d.tasa_conversion || 0
        const mortalidad = d.tasa_mortalidad || d.mortalidad_porcentaje || 0
        const ocupacion = d.tasa_ocupacion || d.ocupacion_porcentaje || 0
        const eficiencia_val = d.eficiencia_general || d.eficiencia_global || 0
        setData({ conversion, mortalidad, ocupacion, eficiencia: eficiencia_val })
      })
      .catch(() => setError('Error al cargar eficiencia'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const allZero = !data || (data.conversion === 0 && data.mortalidad === 0 && data.ocupacion === 0 && data.eficiencia === 0)

  return (
    <DashboardWidget
      title="Eficiencia" icon={IconGauge} color="grape"
      loading={loading} error={error} isEmpty={!loading && !error && allZero}
      emptyMessage="Sin métricas de eficiencia" onRefresh={fetchData}
    >
      {data && (
        <SimpleGrid cols={2} spacing="sm">
          <Paper p="xs" radius="sm" withBorder>
            <Text size="10px" c="dimmed">Conv. Alimenticia</Text>
            <Text fw={700} size="sm">{data.conversion.toFixed(2)}</Text>
          </Paper>
          <Paper p="xs" radius="sm" withBorder>
            <Text size="10px" c="dimmed">Mortalidad</Text>
            <Text fw={700} size="sm" c={data.mortalidad > 5 ? 'red' : 'green'}>{data.mortalidad.toFixed(1)}%</Text>
          </Paper>
          <Paper p="xs" radius="sm" withBorder>
            <Text size="10px" c="dimmed">Ocupación</Text>
            <Text fw={700} size="sm">{data.ocupacion.toFixed(0)}%</Text>
          </Paper>
          <Paper p="xs" radius="sm" withBorder>
            <Text size="10px" c="dimmed">Eficiencia Global</Text>
            <Text fw={700} size="sm" c={data.eficiencia > 70 ? 'green' : data.eficiencia > 40 ? 'yellow' : 'red'}>
              {data.eficiencia.toFixed(0)}%
            </Text>
          </Paper>
        </SimpleGrid>
      )}
    </DashboardWidget>
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

const WIDGET_COMPONENTS = {
  resumen_financiero: ResumenFinancieroWidget,
  salud_hato: SaludHatoWidget,
  cultivos_activos: CultivosActivosWidget,
  inventario_critico: InventarioCriticoWidget,
  proximas_actividades: ProximasActividadesWidget,
  alertas_recientes: AlertasRecientesWidget,
  clima: ClimaInternoWidget,
  mapa_rapido: MapaRapidoWidget,
  actividad_reciente: ActividadRecienteWidget,
  equipo_trabajo: EquipoTrabajoWidget,
  produccion: ProduccionWidget,
  eficiencia: EficienciaWidget,
}

function DashboardContent() {
  const theme = useMantineTheme()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useIdioma()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [opened, { open, close }] = useDisclosure(false)
  const { activeWidgets, removeWidget } = useWidgets()
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('month')
  const [qrScannerOpened, setQrScannerOpened] = useState(false)
  const [suggestions, setSuggestions] = useState({ alertas: 0, sinPesaje: 0, vacunas: 0, cosechas: 0 })
  const [suggestionsLoading, setSuggestionsLoading] = useState(true)

  const fincaId = localStorage.getItem('agrop_finca_id')

  useEffect(() => {
    if (!fincaId) { setStatsLoading(false); return }
    const params = { ...getTimeParams(timeRange) }
    if (fincaId) params.finca_id = fincaId
    setStatsLoading(true)
    api.get('/estadisticas/dashboard', { params })
      .then(({ data }) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false))
  }, [timeRange, fincaId])

  useEffect(() => {
    Promise.allSettled([
      api.get('/alertas/', { params: { leida: false, limit: 0 } }).catch(() => ({ data: [] })),
      api.get('/plan-actividades/', { params: { tipo: 'vacunacion', estado: 'programado', limit: 0 } }).catch(() => ({ data: [] })),
      api.get('/cultivos/', { params: { estado: 'activo', limit: 0 } }).catch(() => ({ data: [] })),
      api.get('/animales/', { params: { limit: 200 } }).catch(() => ({ data: [] })),
      api.get('/pesajes/', { params: { limit: 200 } }).catch(() => ({ data: [] })),
    ]).then(([alertas, vacunas, cosechas, animales, pesajes]) => {
      const alertasData = Array.isArray(alertas.value?.data) ? alertas.value.data : []
      const vacunasData = Array.isArray(vacunas.value?.data) ? vacunas.value.data : []
      const cosechasData = Array.isArray(cosechas.value?.data) ? cosechas.value.data : []
      const animalesData = Array.isArray(animales.value?.data) ? animales.value.data : []
      const pesajesData = Array.isArray(pesajes.value?.data) ? pesajes.value.data : []

      const now = new Date()
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      const animalIdsConPesaje = new Set(pesajesData.filter(p => new Date(p.fecha) > sixtyDaysAgo).map(p => p.animal_id))
      const sinPesaje = animalesData.filter(a => a.activo && !animalIdsConPesaje.has(a.id)).length

      setSuggestions({
        alertas: alertasData.length,
        sinPesaje,
        vacunas: vacunasData.length,
        cosechas: cosechasData.length,
      })
    }).catch(() => {})
      .finally(() => setSuggestionsLoading(false))
  }, [])

  const hasSuggestions = !suggestionsLoading && (
    suggestions.alertas > 0 || suggestions.sinPesaje > 0 || suggestions.vacunas > 0 || suggestions.cosechas > 0
  )

  const handleTimeRangeChange = useCallback((range) => {
    setTimeRange(range)
  }, [])

  return (
    <Stack>
      <Group justify="space-between" wrap="wrap">
        <Title order={3} style={{ fontSize: isMobile ? 16 : 22 }}>
          {t('dashboard_titulo')}
          {stats?.finca_nombre && (
            <Text component="span" size="sm" c="dimmed" ml="xs">- {stats.finca_nombre}</Text>
          )}
        </Title>
        <Group gap="xs">
          <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
          <Tooltip label="Personalizar Dashboard">
            <Button variant="light" color="green" size="sm" leftSection={<IconSettings size={14} />} onClick={open}>
              Personalizar
            </Button>
          </Tooltip>
        </Group>
      </Group>

      <Paper p="md" radius="md" withBorder>
        <Group justify="space-between" wrap="wrap">
          <Group>
            <ThemeIcon variant="light" size="xl" radius="xl" color="green">
              <IconPlant size={24} />
            </ThemeIcon>
            <Box>
              <Text size="xl" fw={700}>
                {user?.nombre ? t('bienvenido_usuario').replace('{nombre}', user.nombre) : t('bienvenido')}
              </Text>
              <Text size="sm" c="dimmed">
                {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </Box>
          </Group>
          <Group gap="xs">
            <Button
              variant="light"
              color="grape"
              leftSection={<IconRobot size={16} />}
              onClick={() => navigate('/inicio-asistente')}
              size="sm"
            >
              {t('asistente_ia')}
            </Button>
            <Button
              variant="light"
              color="green"
              leftSection={<IconScan size={16} />}
              onClick={() => setQrScannerOpened(true)}
              size="sm"
            >
              {t('escanear')}
            </Button>
          </Group>
        </Group>
      </Paper>

      {hasSuggestions && (
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
          {suggestions.alertas > 0 && (
            <Paper p="sm" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate('/alertas')}>
              <Group gap="xs">
                <ThemeIcon variant="light" size="lg" radius="xl" color="red">
                  <IconAlertTriangle size={20} />
                </ThemeIcon>
                <Box style={{ flex: 1 }}>
                  <Text fw={600} size="sm">{suggestions.alertas} {t('alertas_sin_leer_label')}</Text>
                  <Text size="xs" c="dimmed">{t('alertas_requieren_atencion')}</Text>
                </Box>
                <IconArrowRight size={16} color="var(--mantine-color-gray-5)" />
              </Group>
            </Paper>
          )}
          {suggestions.sinPesaje > 0 && (
            <Paper p="sm" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate('/animales')}>
              <Group gap="xs">
                <ThemeIcon variant="light" size="lg" radius="xl" color="orange">
                  <IconWeight size={20} />
                </ThemeIcon>
                <Box style={{ flex: 1 }}>
                  <Text fw={600} size="sm">{suggestions.sinPesaje} {t('sin_pesaje_label')}</Text>
                  <Text size="xs" c="dimmed">{t('sin_pesaje_60d')}</Text>
                </Box>
                <IconArrowRight size={16} color="var(--mantine-color-gray-5)" />
              </Group>
            </Paper>
          )}
          {suggestions.vacunas > 0 && (
            <Paper p="sm" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate('/planeacion')}>
              <Group gap="xs">
                <ThemeIcon variant="light" size="lg" radius="xl" color="blue">
                  <IconVaccine2 size={20} />
                </ThemeIcon>
                <Box style={{ flex: 1 }}>
                  <Text fw={600} size="sm">{suggestions.vacunas} {t('vacunas_proximas')}</Text>
                  <Text size="xs" c="dimmed">{t('programadas_pendientes')}</Text>
                </Box>
                <IconArrowRight size={16} color="var(--mantine-color-gray-5)" />
              </Group>
            </Paper>
          )}
          {suggestions.cosechas > 0 && (
            <Paper p="sm" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate('/cultivos')}>
              <Group gap="xs">
                <ThemeIcon variant="light" size="lg" radius="xl" color="green">
                  <IconLeaf size={20} />
                </ThemeIcon>
                <Box style={{ flex: 1 }}>
                  <Text fw={600} size="sm">{suggestions.cosechas} {t('cosechas_activas')}</Text>
                  <Text size="xs" c="dimmed">{t('cultivos_en_produccion')}</Text>
                </Box>
                <IconArrowRight size={16} color="var(--mantine-color-gray-5)" />
              </Group>
            </Paper>
          )}
        </SimpleGrid>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <WeatherWidget />
        </Grid.Col>
      </Grid>

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} spacing="sm">
        <KPICard
          title={t('total_animales')}
          value={statsLoading ? '' : formatNumber(stats?.total_animales || 0)}
          icon={IconPig}
          color="blue"
          loading={statsLoading}
        />
        <KPICard
          title={t('cultivos_activos')}
          value={statsLoading ? '' : formatNumber(stats?.total_siembras_activas || 0)}
          icon={IconLeaf}
          color="green"
          loading={statsLoading}
        />
        <KPICard
          title={t('siembras_activas')}
          value={statsLoading ? '' : formatNumber(stats?.total_siembras_activas || 0)}
          icon={IconPlant}
          color="green"
          loading={statsLoading}
        />
        <KPICard
          title={t('balance_mes')}
          value={statsLoading ? '' : formatCOP(stats?.balance_mes || 0)}
          icon={IconCoin}
          color={stats?.balance_mes >= 0 ? 'green' : 'red'}
          trend={stats?.balance_mes >= 0 ? 1 : -1}
          trendLabel={t('vs_mes_anterior')}
          loading={statsLoading}
        />
        <KPICard
          title={t('alertas_sin_leer')}
          value={statsLoading ? '' : formatNumber(stats?.alertas_sin_leer || 0)}
          icon={IconAlertTriangle}
          color="red"
          loading={statsLoading}
        />
      </SimpleGrid>

      <Grid>
        {activeWidgets.map((widgetId) => {
          const def = WIDGETS_DISPONIBLES.find(w => w.id === widgetId)
          if (!def) return null
          const WidgetComponent = WIDGET_COMPONENTS[widgetId]
          if (!WidgetComponent) return null
          const span = def.defaultWidth === 'full' ? { base: 12, md: 12 } : { base: 12, md: 6 }

          return (
            <Grid.Col key={widgetId} span={span}>
              <WidgetComponent timeRange={timeRange} onRemove={() => removeWidget(widgetId)} />
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

      <WidgetSelectorModal opened={opened} onClose={close} />
      <QRScanner opened={qrScannerOpened} onClose={() => setQrScannerOpened(false)} />
    </Stack>
  )
}

export default function Dashboard() {
  return (
    <WidgetProvider>
      <DashboardContent />
    </WidgetProvider>
  )
}
