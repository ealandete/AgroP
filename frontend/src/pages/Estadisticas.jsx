import { useEffect, useState } from 'react'
import {
  Paper, Title, Group, Stack, Text, SimpleGrid, Skeleton,
  Grid, Table, Tabs, Badge, Progress,
} from '@mantine/core'
import { BarChart, LineChart } from '@mantine/charts'
import {
  IconStethoscope, IconCoin, IconGrowth, IconCloud,
  IconLayoutDashboard, IconAlertTriangle, IconSkull,
  IconTemperature, IconDroplet, IconMilk, IconWeight,
  IconPlant,
} from '@tabler/icons-react'
import api from '../services/api.js'
import { formatNumber, formatCOP } from '../config.js'

function StatCard({ title, value, icon: Icon, color, sub }) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between">
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>{title}</Text>
          <Text size="xl" fw={700}>{value}</Text>
          {sub && <Text size="xs" c="dimmed">{sub}</Text>}
        </Stack>
        <Paper radius="xl" p="sm" bg={`${color}.0`}>
          <Icon size={24} color={`var(--mantine-color-${color}-7)`} />
        </Paper>
      </Group>
    </Paper>
  )
}

const MOCK_MORBILIDAD = [
  { tipo_afectacion: 'enfermedad', activos: 12, graves: 3, leves: 9 },
  { tipo_afectacion: 'lesion', activos: 5, graves: 1, leves: 4 },
  { tipo_afectacion: 'desnutricion', activos: 3, graves: 2, leves: 1 },
  { tipo_afectacion: 'parasitosis', activos: 8, graves: 1, leves: 7 },
  { tipo_afectacion: 'estres_calorico', activos: 6, graves: 0, leves: 6 },
  { tipo_afectacion: 'mastitis', activos: 4, graves: 2, leves: 2 },
  { tipo_afectacion: 'pododermattitis', activos: 2, graves: 1, leves: 1 },
]

const MOCK_CLIMATICOS = [
  { fecha: '2026-05-01', temperatura: 28, precipitacion: 12, humedad: 75 },
  { fecha: '2026-05-02', temperatura: 30, precipitacion: 5, humedad: 68 },
  { fecha: '2026-05-03', temperatura: 26, precipitacion: 25, humedad: 82 },
  { fecha: '2026-05-04', temperatura: 27, precipitacion: 18, humedad: 78 },
  { fecha: '2026-05-05', temperatura: 31, precipitacion: 0, humedad: 60 },
  { fecha: '2026-05-06', temperatura: 29, precipitacion: 8, humedad: 72 },
  { fecha: '2026-05-07', temperatura: 25, precipitacion: 30, humedad: 85 },
]

export default function Estadisticas() {
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)
  const [muertes, setMuertes] = useState([])
  const [morbilidad, setMorbilidad] = useState([])
  const [climaticos, setClimaticos] = useState([])
  const [ingresos, setIngresos] = useState([])
  const [costos, setCostos] = useState([])
  const [ventas, setVentas] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/estadisticas/dashboard'),
      api.get('/estadisticas/animales/muertes-por-especie'),
      api.get('/morbilidad/').catch(() => ({ data: MOCK_MORBILIDAD })),
      api.get('/registros-climaticos/').catch(() => ({ data: MOCK_CLIMATICOS })),
      api.get('/estadisticas/finanzas/ingresos-vs-gastos', { params: { meses: 12 } }),
      api.get('/finanzas/costos'),
      api.get('/finanzas/ventas'),
    ]).then(([dash, muert, morb, clim, ing, cost, vent]) => {
      console.log('[MOCK] /morbilidad/', morb.data)
      console.log('[MOCK] /registros-climaticos/', clim.data)
      setDashboard(dash.data)
      setMuertes(muert.data)
      setMorbilidad(morb.data)
      setClimaticos(clim.data)
      setIngresos(ing.data)
      setCostos(cost.data)
      setVentas(vent.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton height={400} radius="md" />

  const totalMuertes = muertes.reduce((s, m) => s + (m.muertes || 0), 0)
  const totalAnimalesM = muertes.reduce((s, m) => s + (m.total || 0), 0)

  const costosPorCategoria = costos.reduce((acc, c) => {
    const cat = c.categoria_nombre || 'Sin categoría'
    acc[cat] = (acc[cat] || 0) + (parseFloat(c.monto) || 0)
    return acc
  }, {})
  const topCostos = Object.entries(costosPorCategoria)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const totalVentas = ventas.reduce((s, v) => s + (parseFloat(v.total) || 0), 0)
  const totalCostos = costos.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0)

  const climChartData = climaticos.map(c => ({
    fecha: c.fecha?.slice(5) || '',
    Temperatura: c.temperatura || 0,
    Precipitación: c.precipitacion || 0,
  }))

  const ingresoChartData = (ingresos || []).map(i => ({
    mes: i.mes?.slice(5) || '',
    Ingresos: Math.round((i.ingresos || 0) / 1000),
    Gastos: Math.round((i.gastos || 0) / 1000),
    Margen: i.ingresos ? Math.round(((i.ingresos - i.gastos) / i.ingresos) * 100) : 0,
  }))

  const morbChartData = morbilidad.map(m => ({
    tipo: m.tipo_afectacion,
    Activos: m.activos || 0,
  }))

  return (
    <Stack>
      <Title order={3}>Estadísticas</Title>

      <Tabs defaultValue="sanidad">
        <Tabs.List>
          <Tabs.Tab value="sanidad" leftSection={<IconStethoscope size={16} />}>Sanidad</Tabs.Tab>
          <Tabs.Tab value="financiero" leftSection={<IconCoin size={16} />}>Financiero</Tabs.Tab>
          <Tabs.Tab value="productividad" leftSection={<IconGrowth size={16} />}>Productividad</Tabs.Tab>
          <Tabs.Tab value="climatico" leftSection={<IconCloud size={16} />}>Climático</Tabs.Tab>
          <Tabs.Tab value="general" leftSection={<IconLayoutDashboard size={16} />}>Dashboard General</Tabs.Tab>
        </Tabs.List>

        {/* SANIDAD */}
        <Tabs.Panel value="sanidad" pt="md">
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <Paper p="md" radius="md" withBorder>
              <Group mb="md"><IconStethoscope size={20} color="var(--mantine-color-red-6)" /><Text fw={600}>Morbilidad por Tipo</Text></Group>
              <BarChart
                h={280}
                data={morbChartData}
                dataKey="tipo"
                series={[{ name: 'Activos', color: 'red.5' }]}
                tickLine="y"
                valueFormatter={v => `${v}`}
              />
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Group mb="md"><IconSkull size={20} color="var(--mantine-color-gray-6)" /><Text fw={600}>Mortalidad por Especie</Text></Group>
              <BarChart
                h={280}
                data={muertes.map(m => ({ Especie: m.especie, Muertes: m.muertes, Total: m.total }))}
                dataKey="Especie"
                series={[{ name: 'Muertes', color: 'gray.6' }]}
                tickLine="y"
              />
              <Text size="xs" c="dimmed" mt="xs">
                Total: {totalAnimalesM} | Muertes: {totalMuertes} ({totalAnimalesM > 0 ? ((totalMuertes / totalAnimalesM) * 100).toFixed(1) : 0}%)
              </Text>
            </Paper>
          </SimpleGrid>
          <Paper p="md" radius="md" withBorder mt="md">
            <Group mb="md"><IconAlertTriangle size={20} color="orange" /><Text fw={600}>Casos de Morbilidad Recientes</Text></Group>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tipo de Afectación</Table.Th>
                  <Table.Th>Activos</Table.Th>
                  <Table.Th>Graves</Table.Th>
                  <Table.Th>Leves</Table.Th>
                  <Table.Th>Severidad</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {morbilidad.map((m, i) => (
                  <Table.Tr key={i}>
                    <Table.Td tt="capitalize" fw={500}>{m.tipo_afectacion.replace(/_/g, ' ')}</Table.Td>
                    <Table.Td>{m.activos}</Table.Td>
                    <Table.Td c="red">{m.graves}</Table.Td>
                    <Table.Td c="yellow">{m.leves}</Table.Td>
                    <Table.Td>
                      <Badge color={m.graves > 0 ? 'red' : 'yellow'} size="sm">
                        {m.graves > 0 ? 'Grave' : 'Leve'}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        {/* FINANCIERO */}
        <Tabs.Panel value="financiero" pt="md">
          <SimpleGrid cols={{ base: 1, md: 3 }}>
            <StatCard title="Ingresos Totales" value={formatCOP(totalVentas)} icon={IconCoin} color="green" />
            <StatCard title="Costos Totales" value={formatCOP(totalCostos)} icon={IconCoin} color="red" />
            <StatCard
              title="Margen de Utilidad"
              value={`${totalVentas ? (((totalVentas - totalCostos) / totalVentas) * 100).toFixed(1) : 0}%`}
              icon={IconGrowth}
              color={totalVentas - totalCostos >= 0 ? 'green' : 'red'}
            />
          </SimpleGrid>
          <Grid mt="md">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Paper p="md" radius="md" withBorder>
                <Group mb="md"><IconCoin size={20} /><Text fw={600}>Costo vs Venta por Mes</Text></Group>
                <BarChart
                  h={300}
                  data={ingresoChartData}
                  dataKey="mes"
                  series={[
                    { name: 'Ingresos', color: 'green.6' },
                    { name: 'Gastos', color: 'red.5' },
                  ]}
                  valueFormatter={v => `$${v}k`}
                  tickLine="y"
                />
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" radius="md" withBorder h="100%">
                <Group mb="md"><IconGrowth size={20} /><Text fw={600}>Margen de Utilidad %</Text></Group>
                <LineChart
                  h={200}
                  data={ingresoChartData}
                  dataKey="mes"
                  series={[{ name: 'Margen', color: 'blue.6' }]}
                  valueFormatter={v => `${v}%`}
                  tickLine="y"
                  withDots={false}
                />
                <Text size="xs" c="dimmed" mt="md">Top 5 Costos</Text>
                <Stack gap={4} mt="sm">
                  {topCostos.map(([cat, monto], i) => (
                    <Group key={i} justify="space-between">
                      <Text size="xs">{cat}</Text>
                      <Text size="xs" fw={600}>{formatCOP(monto)}</Text>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* PRODUCTIVIDAD */}
        <Tabs.Panel value="productividad" pt="md">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            <Paper p="md" radius="md" withBorder>
              <Group><IconMilk size={20} color="var(--mantine-color-cyan-6)" /><Text size="xs" c="dimmed">Leche Promedio Diaria</Text></Group>
              <Text size="xl" fw={700}>{dashboard?.litros_leche_mes ? formatNumber(dashboard.litros_leche_mes / 30) : 0} L</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Group><IconWeight size={20} color="var(--mantine-color-orange-6)" /><Text size="xs" c="dimmed">Ganancia de Peso Prom.</Text></Group>
              <Text size="xl" fw={700}>{dashboard?.ganancia_peso_promedio ? formatNumber(dashboard.ganancia_peso_promedio) : 0} kg/día</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Group><IconGrowth size={20} color="var(--mantine-color-teal-6)" /><Text size="xs" c="dimmed">Conversión Alimenticia</Text></Group>
              <Text size="xl" fw={700}>{dashboard?.conversion_alimenticia ? formatNumber(dashboard.conversion_alimenticia) : 0}</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Group><IconPlant size={20} color="var(--mantine-color-green-6)" /><Text size="xs" c="dimmed">Rendimiento Cultivos</Text></Group>
              <Text size="xl" fw={700}>{dashboard?.rendimiento_cultivos ? formatNumber(dashboard.rendimiento_cultivos) : 0} kg/ha</Text>
            </Paper>
          </SimpleGrid>
          <Paper p="md" radius="md" withBorder mt="md">
            <Text fw={600} mb="md">Rendimiento de Cultivos</Text>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Cultivo</Table.Th>
                  <Table.Th>Rendimiento (kg/ha)</Table.Th>
                  <Table.Th>Área (ha)</Table.Th>
                  <Table.Th>Producción Total</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(dashboard?.rendimientos || []).map((r, i) => (
                  <Table.Tr key={i}>
                    <Table.Td tt="capitalize" fw={500}>{r.cultivo}</Table.Td>
                    <Table.Td>{formatNumber(r.rendimiento_promedio_ha)}</Table.Td>
                    <Table.Td>{formatNumber(r.area_sembrada_ha)}</Table.Td>
                    <Table.Td fw={600}>{formatNumber(r.produccion_total_kg || (r.rendimiento_promedio_ha * r.area_sembrada_ha))}</Table.Td>
                  </Table.Tr>
                ))}
                {(!dashboard?.rendimientos || dashboard.rendimientos.length === 0) && (
                  <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center">Sin datos de cosechas</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        {/* CLIMÁTICO */}
        <Tabs.Panel value="climatico" pt="md">
          <Paper p="md" radius="md" withBorder>
            <Group mb="md"><IconTemperature size={20} color="var(--mantine-color-red-6)" /><IconDroplet size={20} color="var(--mantine-color-blue-6)" /><Text fw={600}>Temperatura vs Precipitación</Text></Group>
            <BarChart
              h={300}
              data={climChartData}
              dataKey="fecha"
              series={[
                { name: 'Temperatura', color: 'red.5' },
                { name: 'Precipitación', color: 'blue.5' },
              ]}
              valueFormatter={v => `${v}`}
              tickLine="y"
            />
          </Paper>
          <Paper p="md" radius="md" withBorder mt="md">
            <Group mb="md"><IconCloud size={20} /><Text fw={600}>Registros Climáticos Recientes</Text></Group>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Temperatura (°C)</Table.Th>
                  <Table.Th>Precipitación (mm)</Table.Th>
                  <Table.Th>Humedad (%)</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {climaticos.map((c, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{c.fecha}</Table.Td>
                    <Table.Td fw={500}>{c.temperatura}°C</Table.Td>
                    <Table.Td>{c.precipitacion} mm</Table.Td>
                    <Table.Td>{c.humedad}%</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        {/* DASHBOARD GENERAL */}
        <Tabs.Panel value="general" pt="md">
          {dashboard && (
            <Stack>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                <StatCard title="Total Animales" value={dashboard.total_animales} icon={IconWeight} color="blue" />
                <StatCard title="Siembras Activas" value={dashboard.total_siembras_activas} icon={IconPlant} color="green" />
                <StatCard title="Leche (este mes)" value={`${formatNumber(dashboard.litros_leche_mes)} L`} icon={IconMilk} color="cyan" />
                <StatCard
                  title="Balance Mensual"
                  value={formatCOP(dashboard.balance_mes)}
                  icon={IconCoin}
                  color={dashboard.balance_mes >= 0 ? 'green' : 'red'}
                />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }}>
                <StatCard title="Bovinos" value={`${dashboard.total_bovinos || 0}`} icon={IconMilk} color="blue" />
                <StatCard title="Porcinos" value={`${dashboard.total_porcinos || 0}`} icon={IconWeight} color="pink" />
                <StatCard title="Aves" value={`${dashboard.total_aves || 0}`} icon={IconWeight} color="yellow" />
                <StatCard title="Caprinos" value={`${dashboard.total_caprinos || 0}`} icon={IconWeight} color="orange" />
                <StatCard title="Ovinos" value={`${dashboard.total_ovinos || 0}`} icon={IconWeight} color="grape" />
                <StatCard title="Equinos" value={`${dashboard.total_equinos || 0}`} icon={IconWeight} color="teal" />
              </SimpleGrid>

              <Grid>
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <Paper p="md" radius="md" withBorder>
                    <Text fw={600} mb="md">Ingresos vs Gastos (12 meses)</Text>
                    <BarChart
                      h={300}
                      data={ingresoChartData}
                      dataKey="mes"
                      series={[
                        { name: 'Ingresos', color: 'green.6' },
                        { name: 'Gastos', color: 'red.5' },
                      ]}
                      valueFormatter={v => `$${v}k`}
                      tickLine="y"
                    />
                  </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Paper p="md" radius="md" withBorder h="100%">
                    <Text fw={600} mb="md">Mortalidad por Especie</Text>
                    <BarChart
                      h={250}
                      data={muertes.map(m => ({ Especie: m.especie, Muertes: m.muertes }))}
                      dataKey="Especie"
                      series={[{ name: 'Muertes', color: 'red.5' }]}
                      tickLine="y"
                    />
                    <Text size="xs" c="dimmed" mt="xs">Total muertes: {totalMuertes}</Text>
                  </Paper>
                </Grid.Col>
              </Grid>
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
