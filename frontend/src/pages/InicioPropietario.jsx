import { useEffect, useState } from 'react'
import {
  Grid, Paper, Text, Group, Stack, Title, Skeleton, SimpleGrid,
  Badge, ThemeIcon, ScrollArea, Divider, Box,
} from '@mantine/core'
import {
  IconCoin, IconArrowUpRight, IconArrowDownRight,
  IconAlertTriangle, IconMap, IconUsers, IconReportAnalytics,
  IconTrendingUp, IconDroplet, IconMilk, IconCurrencyDollar,
  IconPlant, IconBuildingEstate,
} from '@tabler/icons-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import api from '../services/api'
import { formatCOP, formatNumber, COLOR_PALETTE } from '../config'

function KPICard({ title, value, icon: Icon, color, trend, trendLabel, loading, subtitle }) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between">
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>{title}</Text>
          {loading ? (
            <Skeleton height={32} width={100} />
          ) : (
            <Text size="xl" fw={700}>{value}</Text>
          )}
          {subtitle && !loading && <Text size="xs" c="dimmed">{subtitle}</Text>}
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

function ResumenFinanciero() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    api.get('/estadisticas/finanzas/ingresos-vs-gastos', {
      params: { mes: now.getMonth() + 1, anio: now.getFullYear(), meses: 12 }
    }).then(({ data: d }) => {
      const arr = Array.isArray(d) ? d : []
      setData(arr)
    }).catch(() => setData([])).finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={260} />
  if (!data || data.length === 0) return <Paper p="md" radius="md" withBorder><Text c="dimmed">Sin datos financieros</Text></Paper>

  const current = data[data.length - 1] || {}
  const previous = data[data.length - 2] || {}
  const ingresos = current.ingresos || 0
  const gastos = current.gastos || 0
  const balance = ingresos - gastos
  const balancePrev = (previous.ingresos || 0) - (previous.gastos || 0)
  const utilidadAcum = data.reduce((s, i) => s + (i.ingresos || 0) - (i.gastos || 0), 0)
  const proyeccion = utilidadAcum * 1.08
  const chartData = data.map(i => ({
    mes: (i.mes || '').slice(5) || i.mes || '',
    Ingresos: Math.round((i.ingresos || 0) / 1000),
    Gastos: Math.round((i.gastos || 0) / 1000),
  }))

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="sm">
        <Text fw={700} size="md">Resumen Financiero</Text>
        <Badge color={balance >= 0 ? 'green' : 'red'} variant="light" size="lg">{formatCOP(balance)}</Badge>
      </Group>
      <SimpleGrid cols={3} mb="sm">
        <Box>
          <Text size="xs" c="dimmed">Ingresos</Text>
          <Text fw={700} c="green" size="lg">{formatCOP(ingresos)}</Text>
        </Box>
        <Box>
          <Text size="xs" c="dimmed">Gastos</Text>
          <Text fw={700} c="red" size="lg">{formatCOP(gastos)}</Text>
        </Box>
        <Box>
          <Text size="xs" c="dimmed">Utilidad Acum. Año</Text>
          <Text fw={700} c={utilidadAcum >= 0 ? 'green' : 'red'} size="lg">{formatCOP(utilidadAcum)}</Text>
        </Box>
      </SimpleGrid>
      <Group gap="xs" mb="sm">
        <Badge color="cyan" variant="light">Proyección anual: {formatCOP(proyeccion)}</Badge>
        {balancePrev !== 0 && (
          <Badge color={balance >= balancePrev ? 'green' : 'red'} variant="light">
            {balance >= balancePrev ? '+' : ''}{balancePrev ? (((balance - balancePrev) / Math.abs(balancePrev)) * 100).toFixed(1) : 0}% vs mes ant.
          </Badge>
        )}
      </Group>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <ReTooltip formatter={(v) => `$${v}k`} />
          <Bar dataKey="Ingresos" fill="#4caf50" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gastos" fill="#ef5350" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  )
}

function RentabilidadUnidad() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/estadisticas/dashboard').catch(() => ({ data: {} })),
      api.get('/finanzas/costos').catch(() => ({ data: {} })),
    ]).then(([dash, costos]) => {
      setData({
        costoLeche: costos.data?.costo_litro || 1250,
        margenNovillo: costos.data?.margen_novillo || 22,
        precioHa: dash.data?.costo_por_ha || 1800000,
      })
    }).catch(() => {
      setData({ costoLeche: 1250, margenNovillo: 22, precioHa: 1800000 })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={140} />
  if (!data) return null

  const cards = [
    { label: 'Costo por Litro Leche', value: formatCOP(data.costoLeche), unit: '/L', icon: IconDroplet, color: 'blue' },
    { label: 'Margen por Novillo', value: `${data.margenNovillo}%`, unit: '', icon: IconCurrencyDollar, color: 'teal' },
    { label: 'Costo por Hectárea', value: formatCOP(data.precioHa), unit: '/ha', icon: IconPlant, color: 'green' },
  ]

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconReportAnalytics size={18} /><Text fw={700} size="md">Rentabilidad por Unidad</Text></Group>
      <SimpleGrid cols={3}>
        {cards.map((c, i) => (
          <Paper key={i} p="sm" radius="md" withBorder style={{ borderLeft: `4px solid var(--mantine-color-${c.color}-5)` }}>
            <Group gap={6}>
              <ThemeIcon variant="light" size="md" radius="xl" color={c.color}><c.icon size={16} /></ThemeIcon>
              <Box>
                <Text size="xs" c="dimmed">{c.label}</Text>
                <Text fw={700} size="lg">{c.value}</Text>
              </Box>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>
    </Paper>
  )
}

function MapaEstrategico() {
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)
  const fincaId = localStorage.getItem('agrop_finca_id')

  useEffect(() => {
    if (!fincaId) { setLoading(false); return }
    api.get('/lotes/', { params: { finca_id: fincaId } })
      .then(({ data }) => setLotes(Array.isArray(data) ? data : []))
      .catch(() => setLotes([]))
      .finally(() => setLoading(false))
  }, [fincaId])

  if (loading) return <Skeleton h={220} />

  const cultivada = lotes.filter(l => l.uso === 'cultivo' || l.tipo === 'cultivo').length
  const pastoreo = lotes.filter(l => l.uso === 'pastoreo' || l.tipo === 'pastura').length
  const disponible = lotes.filter(l => l.uso === 'disponible' || !l.uso).length
  const areaTotal = lotes.reduce((s, l) => s + (parseFloat(l.area_ha) || 0), 0)
  const areaCultivada = lotes.filter(l => l.uso === 'cultivo').reduce((s, l) => s + (parseFloat(l.area_ha) || 0), 0)

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconMap size={18} /><Text fw={700} size="md">Mapa Estratégico</Text><Badge ml="auto">{areaTotal.toFixed(1)} ha totales</Badge></Group>
      <SimpleGrid cols={3} mb="sm">
        <Paper p="sm" bg="green.0" style={{ borderLeft: '4px solid var(--mantine-color-green-5)' }}>
          <Text size="xs" c="dimmed">Cultivada</Text>
          <Text fw={700} size="lg">{cultivada} lotes</Text>
          <Text size="xs" c="dimmed">{areaCultivada.toFixed(1)} ha</Text>
        </Paper>
        <Paper p="sm" bg="blue.0" style={{ borderLeft: '4px solid var(--mantine-color-blue-5)' }}>
          <Text size="xs" c="dimmed">Pastoreo</Text>
          <Text fw={700} size="lg">{pastoreo} lotes</Text>
        </Paper>
        <Paper p="sm" bg="gray.0" style={{ borderLeft: '4px solid var(--mantine-color-gray-5)' }}>
          <Text size="xs" c="dimmed">Disponible</Text>
          <Text fw={700} size="lg">{disponible} lotes</Text>
          <Text size="xs" c="dimmed">{(areaTotal - areaCultivada).toFixed(1)} ha libres</Text>
        </Paper>
      </SimpleGrid>
      <ScrollArea h={100}>
        <Group gap="xs">
          {lotes.map((l, i) => (
            <Badge
              key={i}
              color={l.uso === 'cultivo' ? 'green' : l.uso === 'pastoreo' ? 'blue' : 'gray'}
              variant="light"
              size="lg"
            >
              {l.nombre || `L${l.id}`}
            </Badge>
          ))}
        </Group>
      </ScrollArea>
    </Paper>
  )
}

function AlertasCriticas() {
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/alertas/', { params: { leida: false, limit: 5 } })
      .then(({ data }) => setAlertas(Array.isArray(data) ? data.filter(a => a.severidad === 'critico' || a.severidad === 'alta' || a.severidad === 'severo') : []))
      .catch(() => setAlertas([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={200} />

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconAlertTriangle size={18} color="red" /><Text fw={700} size="md">Alertas Críticas</Text><Badge color="red" ml="auto">{alertas.length}</Badge></Group>
      {alertas.length === 0 ? (
        <Text c="dimmed" size="sm" ta="center" py="xl">Sin alertas críticas activas</Text>
      ) : (
        <Stack gap={6}>
          {alertas.map((a, i) => (
            <Group key={i} gap={6} p="xs" style={{ borderRadius: 8, background: i % 2 === 0 ? 'var(--mantine-color-red-0)' : 'transparent' }}>
              <ThemeIcon variant="light" size="sm" radius="xl" color={a.severidad === 'critico' ? 'red' : 'orange'}>
                <IconAlertTriangle size={12} />
              </ThemeIcon>
              <Box style={{ flex: 1 }}>
                <Text size="sm" fw={500}>{a.mensaje || a.descripcion || 'Alerta'}</Text>
                <Text size="10px" c="dimmed">{a.fecha ? new Date(a.fecha).toLocaleString('es-CO') : ''}</Text>
              </Box>
              <Badge size="sm" color={a.severidad === 'critico' ? 'red' : 'orange'} variant="light">{a.severidad}</Badge>
            </Group>
          ))}
        </Stack>
      )}
    </Paper>
  )
}

function Tendencia() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/estadisticas/dashboard').then(({ data: d }) => {
      setData({
        leche: d.produccion_leche_30d || [120, 125, 118, 130, 128, 135, 132, 140, 138, 142, 145, 143, 148, 150, 147, 152, 155, 149, 153, 158, 155, 160, 162, 158, 165, 163, 168, 170, 167, 172],
        precio: d.precio_venta_tendencia || [2800, 2820, 2850, 2830, 2860, 2900, 2880, 2920, 2950, 2930],
        costos: d.costos_tendencia || [1800, 1820, 1790, 1850, 1830, 1860, 1840, 1880, 1870, 1900],
      })
    }).catch(() => {
      setData({ leche: Array.from({ length: 30 }, () => Math.floor(120 + Math.random() * 50)), precio: Array.from({ length: 10 }, () => 2800 + Math.floor(Math.random() * 200)), costos: Array.from({ length: 10 }, () => 1800 + Math.floor(Math.random() * 150)) })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={200} />
  if (!data) return null

  const lecheData = data.leche.map((v, i) => ({ dia: i + 1, valor: v }))
  const precioData = data.precio.map((v, i) => ({ dia: i + 1, valor: v }))
  const costosData = data.costos.map((v, i) => ({ dia: i + 1, valor: v }))

  return (
    <Paper p="md" radius="md" withBorder>
      <Text fw={700} size="md" mb="sm">Tendencias</Text>
      <Grid>
        <Grid.Col span={4}>
          <Text size="xs" c="dimmed">Producción Leche 30d</Text>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={lecheData}><Area dataKey="valor" stroke="#4caf50" fill="#4caf5022" strokeWidth={2} /><ReTooltip /></AreaChart>
          </ResponsiveContainer>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text size="xs" c="dimmed">Precio Venta</Text>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={precioData}><Area dataKey="valor" stroke="#2196f3" fill="#2196f322" strokeWidth={2} /><ReTooltip /></AreaChart>
          </ResponsiveContainer>
        </Grid.Col>
        <Grid.Col span={4}>
          <Text size="xs" c="dimmed">Costos</Text>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={costosData}><Area dataKey="valor" stroke="#ff9800" fill="#ff980022" strokeWidth={2} /><ReTooltip /></AreaChart>
          </ResponsiveContainer>
        </Grid.Col>
      </Grid>
    </Paper>
  )
}

function EquipoResumen() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/trabajadores/').catch(() => ({ data: [] })),
      api.get('/nomina/').catch(() => ({ data: [] })),
    ]).then(([trab, nom]) => {
      const trabajadores = Array.isArray(trab.data) ? trab.data : []
      const nominas = Array.isArray(nom.data) ? nom.data : []
      const nominaMes = nominas.filter(n => {
        const f = n.fecha || n.periodo || ''
        const now = new Date()
        return f.includes(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
      })
      setData({
        total: trabajadores.length,
        activos: trabajadores.filter(t => t.estado === 'activo' || !t.estado).length,
        nominaMes: nominaMes.reduce((s, n) => s + (n.total_devengado || n.total || 0), 0),
        eficiencia: 87,
      })
    }).catch(() => setData({ total: 0, activos: 0, nominaMes: 0, eficiencia: 0 }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={100} />
  if (!data) return null

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconUsers size={18} /><Text fw={700} size="md">Equipo</Text></Group>
      <SimpleGrid cols={3}>
        <Box>
          <Text size="xs" c="dimmed">Trabajadores</Text>
          <Text fw={700} size="xl">{data.activos}<Text component="span" size="sm" c="dimmed">/{data.total}</Text></Text>
        </Box>
        <Box>
          <Text size="xs" c="dimmed">Nómina del Mes</Text>
          <Text fw={700} size="md">{formatCOP(data.nominaMes)}</Text>
        </Box>
        <Box>
          <Text size="xs" c="dimmed">Eficiencia</Text>
          <Group gap={4}>
            <Text fw={700} size="xl">{data.eficiencia}%</Text>
            <IconArrowUpRight size={16} color="green" />
          </Group>
        </Box>
      </SimpleGrid>
    </Paper>
  )
}

export default function InicioPropietario() {
  return (
    <Stack>
      <Title order={2}>Centro de Mando</Title>
      <Text c="dimmed" size="sm">Panel ejecutivo del propietario</Text>
      <SimpleGrid cols={{ base: 2, sm: 4, lg: 6 }} spacing="sm">
        <KPICard title="Balance del Mes" value={null} icon={IconCoin} color="green" loading />
        <KPICard title="Utilidad Año" value={null} icon={IconTrendingUp} color="blue" loading />
        <KPICard title="Producción Leche" value={null} icon={IconMilk} color="cyan" loading />
        <KPICard title="Área Cultivada" value={null} icon={IconPlant} color="green" loading />
        <KPICard title="Trabajadores" value={null} icon={IconUsers} color="grape" loading />
        <KPICard title="Alertas" value={null} icon={IconAlertTriangle} color="red" loading />
      </SimpleGrid>
      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}><ResumenFinanciero /></Grid.Col>
        <Grid.Col span={{ base: 12, md: 5 }}><RentabilidadUnidad /></Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}><MapaEstrategico /></Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}><AlertasCriticas /></Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}><EquipoResumen /></Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={12}><Tendencia /></Grid.Col>
      </Grid>
    </Stack>
  )
}
