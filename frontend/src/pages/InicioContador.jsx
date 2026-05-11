import { useEffect, useState } from 'react'
import {
  Grid, Paper, Text, Group, Stack, Title, Skeleton, SimpleGrid,
  Badge, ThemeIcon, ScrollArea, Box, Button, Card, Progress, Table,
} from '@mantine/core'
import {
  IconCoin, IconArrowUpRight, IconArrowDownRight,
  IconFileInvoice, IconUsers, IconCalendarDue,
  IconReportAnalytics, IconChartBar, IconCurrencyDollar,
  IconReceipt, IconCash, IconBuildingBank, IconFileSpreadsheet,
  IconAlertTriangle, IconCheck,
} from '@tabler/icons-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import { formatCOP, formatNumber } from '../config'

function CierreDelMes() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    api.get('/estadisticas/finanzas/ingresos-vs-gastos', {
      params: { mes: now.getMonth() + 1, anio: now.getFullYear(), meses: 3 }
    }).then(({ data: d }) => {
      const arr = Array.isArray(d) ? d : []
      setData(arr)
    }).catch(() => setData([])).finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={220} />
  if (!data || data.length === 0) return <Paper p="md" radius="md" withBorder><Text c="dimmed">Sin datos</Text></Paper>

  const current = data[data.length - 1] || {}
  const previous = data[data.length - 2] || {}
  const ingresos = current.ingresos || 0
  const gastos = current.gastos || 0
  const balance = ingresos - gastos
  const prevBalance = (previous.ingresos || 0) - (previous.gastos || 0)
  const diff = prevBalance ? ((balance - prevBalance) / Math.abs(prevBalance) * 100).toFixed(1) : 0

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconCoin size={20} /><Text fw={700} size="md">Cierre del Mes</Text></Group>
      <SimpleGrid cols={3} mb="sm">
        <Paper p="sm" bg="green.0" style={{ borderLeft: '4px solid green' }}>
          <Text size="xs" c="dimmed">Ingresos</Text>
          <Text fw={700} size="lg" c="green">{formatCOP(ingresos)}</Text>
          <Text size="10px" c={diff > 0 ? 'green' : 'red'}>
            {diff > 0 ? '+' : ''}{diff}% vs mes ant
          </Text>
        </Paper>
        <Paper p="sm" bg="red.0" style={{ borderLeft: '4px solid red' }}>
          <Text size="xs" c="dimmed">Gastos</Text>
          <Text fw={700} size="lg" c="red">{formatCOP(gastos)}</Text>
        </Paper>
        <Paper p="sm" bg={balance >= 0 ? 'green.0' : 'red.0'} style={{ borderLeft: `4px solid ${balance >= 0 ? 'green' : 'red'}` }}>
          <Text size="xs" c="dimmed">Utilidad</Text>
          <Text fw={700} size="lg" c={balance >= 0 ? 'green' : 'red'}>{formatCOP(balance)}</Text>
        </Paper>
      </SimpleGrid>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data.slice(-6).map(i => ({ mes: (i.mes || '').slice(5) || i.mes, Ingresos: Math.round((i.ingresos || 0) / 1000), Gastos: Math.round((i.gastos || 0) / 1000) }))}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
          <ReTooltip formatter={(v) => `$${v}k`} />
          <Bar dataKey="Ingresos" fill="#4caf50" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gastos" fill="#ef5350" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  )
}

function FacturacionReciente() {
  const [facturas, setFacturas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/contabilidad/facturas/', { params: { limit: 5, order: '-fecha' } })
      .then(({ data }) => setFacturas(Array.isArray(data) ? data : []))
      .catch(() => setFacturas([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={200} />

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconReceipt size={20} /><Text fw={700} size="md">Facturación Reciente</Text></Group>
      {facturas.length === 0 ? (
        <Text c="dimmed" size="sm" ta="center" py="xl">Sin facturas recientes</Text>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>Cliente</Table.Th>
              <Table.Th>Valor</Table.Th>
              <Table.Th>Estado</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {facturas.map((f, i) => (
              <Table.Tr key={i}>
                <Table.Td><Text size="sm">{f.numero || f.id}</Text></Table.Td>
                <Table.Td><Text size="sm">{f.cliente_nombre || f.cliente || '-'}</Text></Table.Td>
                <Table.Td><Text size="sm" fw={500}>{formatCOP(f.total || f.valor || 0)}</Text></Table.Td>
                <Table.Td><Badge size="sm" color={f.estado === 'pagada' ? 'green' : f.estado === 'pendiente' ? 'yellow' : 'gray'}>{f.estado || 'pendiente'}</Badge></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Paper>
  )
}

function NominaStatus() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    api.get('/nomina/', { params: { mes: now.getMonth() + 1, anio: now.getFullYear() } })
      .then(({ data }) => {
        const items = Array.isArray(data) ? data : []
        const pagadas = items.filter(n => n.estado === 'pagada' || n.estado === 'pagado')
        const pendientes = items.filter(n => n.estado === 'pendiente' || !n.estado)
        setData({
          total: items.length,
          pagadas: pagadas.length,
          pendientes: pendientes.length,
          monto: items.reduce((s, n) => s + (n.total_devengado || n.total || 0), 0),
        })
      }).catch(() => setData({ total: 0, pagadas: 0, pendientes: 0, monto: 0 }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={120} />
  if (!data) return null

  const pct = data.total > 0 ? (data.pagadas / data.total) * 100 : 0

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconUsers size={20} /><Text fw={700} size="md">Nómina del Mes</Text></Group>
      <SimpleGrid cols={2} mb="sm">
        <Box>
          <Text size="xs" c="dimmed">Total</Text>
          <Text fw={700} size="lg">{data.total} empleados</Text>
        </Box>
        <Box>
          <Text size="xs" c="dimmed">Monto</Text>
          <Text fw={700} size="md">{formatCOP(data.monto)}</Text>
        </Box>
      </SimpleGrid>
      <Group justify="space-between" mb={4}>
        <Text size="xs">{data.pagadas} pagadas</Text>
        <Text size="xs">{data.pendientes} pendientes</Text>
      </Group>
      <Progress value={pct} color={pct === 100 ? 'green' : 'yellow'} size="sm" />
    </Paper>
  )
}

function Obligaciones() {
  const obligaciones = [
    { label: 'Retefuente', fecha: '15/05/2026', monto: 2840000, estado: 'pendiente' },
    { label: 'IVA', fecha: '20/05/2026', monto: 5100000, estado: 'pendiente' },
    { label: 'Parafiscales', fecha: '10/05/2026', monto: 1890000, estado: 'pagado' },
    { label: 'Seguridad Social', fecha: '08/05/2026', monto: 3200000, estado: 'pagado' },
  ]

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconCalendarDue size={20} /><Text fw={700} size="md">Obligaciones</Text></Group>
      <Stack gap={6}>
        {obligaciones.map((o, i) => (
          <Group key={i} justify="space-between" p={4} style={{ borderRadius: 6, background: o.estado === 'pendiente' ? 'var(--mantine-color-yellow-0)' : 'var(--mantine-color-green-0)' }}>
            <Box>
              <Text size="sm" fw={500}>{o.label}</Text>
              <Text size="10px" c="dimmed">Vence: {o.fecha}</Text>
            </Box>
            <Group gap={4}>
              <Text size="sm" fw={600}>{formatCOP(o.monto)}</Text>
              {o.estado === 'pagado' ? <IconCheck size={14} color="green" /> : <IconAlertTriangle size={14} color="orange" />}
            </Group>
          </Group>
        ))}
      </Stack>
    </Paper>
  )
}

function IndicadoresFinancieros() {
  const indicadores = [
    { label: 'ROA', value: '8.2%', trend: 1, color: 'green' },
    { label: 'Margen Operacional', value: '22.5%', trend: 1, color: 'green' },
    { label: 'Liquidez', value: '1.8', trend: 1, color: 'blue' },
    { label: 'Endeudamiento', value: '35.2%', trend: -1, color: 'orange' },
  ]

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconChartBar size={20} /><Text fw={700} size="md">Indicadores Financieros</Text></Group>
      <SimpleGrid cols={2}>
        {indicadores.map((ind, i) => (
          <Paper key={i} p="sm" withBorder>
            <Text size="xs" c="dimmed">{ind.label}</Text>
            <Group gap={4}>
              <Text fw={700} size="lg">{ind.value}</Text>
              {ind.trend > 0 ? <IconArrowUpRight size={14} color="green" /> : <IconArrowDownRight size={14} color="red" />}
            </Group>
          </Paper>
        ))}
      </SimpleGrid>
    </Paper>
  )
}

function AccesoRapidoContador() {
  const acciones = [
    { label: 'Nueva Factura', icon: IconFileInvoice, color: 'blue' },
    { label: 'Generar Nómina', icon: IconUsers, color: 'green' },
    { label: 'Libro Diario', icon: IconFileSpreadsheet, color: 'grape' },
    { label: 'Exportar PUC', icon: IconFileInvoice, color: 'orange' },
  ]

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconCurrencyDollar size={20} /><Text fw={700} size="md">Acceso Rápido</Text></Group>
      <SimpleGrid cols={2}>
        {acciones.map((a, i) => (
          <Card key={i} padding="md" radius="md" withBorder style={{ cursor: 'pointer' }}>
            <Group>
              <ThemeIcon variant="light" size="lg" radius="xl" color={a.color}><a.icon size={20} /></ThemeIcon>
              <Text fw={600} size="sm">{a.label}</Text>
            </Group>
          </Card>
        ))}
      </SimpleGrid>
    </Paper>
  )
}

export default function InicioContador() {
  return (
    <Stack>
      <Title order={2}>Panel Contable</Title>
      <Text c="dimmed" size="sm">Gestión financiera y contable</Text>
      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}><CierreDelMes /></Grid.Col>
        <Grid.Col span={{ base: 12, md: 5 }}><IndicadoresFinancieros /></Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={{ base: 12, md: 5 }}><FacturacionReciente /></Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}><NominaStatus /></Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}><Obligaciones /></Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}><AccesoRapidoContador /></Grid.Col>
      </Grid>
    </Stack>
  )
}
