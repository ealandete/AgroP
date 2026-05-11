import { useEffect, useState } from 'react'
import {
  Grid, Paper, Text, Group, Stack, Title, Skeleton,
  SimpleGrid, RingProgress, Divider, Badge,
} from '@mantine/core'
import {
  IconPig, IconPlant, IconCoin, IconMilk, IconEgg, IconBug,
  IconArrowUpRight, IconArrowDownRight, IconWeight, IconStethoscope,
} from '@tabler/icons-react'
import api from '../services/api.js'
import { formatCOP, formatNumber } from '../config.js'
import { BarChart, LineChart } from '@mantine/charts'

function StatCard({ title, value, icon: Icon, color, trend, trendLabel }) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between">
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>{title}</Text>
          <Text size="xl" fw={700}>{value}</Text>
          {trend !== undefined && (
            <Group gap={4}>
              {trend >= 0 ? <IconArrowUpRight size={14} color="green" /> : <IconArrowDownRight size={14} color="red" />}
              <Text size="xs" c={trend >= 0 ? 'green' : 'red'}>{trendLabel}</Text>
            </Group>
          )}
        </Stack>
        <Paper radius="xl" p="sm" bg={`${color}.0`}>
          <Icon size={28} color={`var(--mantine-color-${color}-7)`} />
        </Paper>
      </Group>
    </Paper>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [ingresos, setIngresos] = useState([])
  const [rendimientos, setRendimientos] = useState([])
  const [eventosCount, setEventosCount] = useState(0)

  useEffect(() => {
    Promise.all([
      api.get('/estadisticas/dashboard'),
      api.get('/estadisticas/finanzas/ingresos-vs-gastos', { params: { meses: 6 } }),
      api.get('/estadisticas/cultivos/rendimientos'),
    ]).then(([dash, fin, rend]) => {
      setStats(dash.data)
      setIngresos(fin.data)
      setRendimientos(rend.data)
    })
  }, [])

  useEffect(() => {
    api.get('/estadisticas/eventos/tipos-frecuencia').then(({ data }) => {
      const total = Array.isArray(data) ? data.reduce((acc, e) => acc + (e.cantidad || 0), 0) : 0
      setEventosCount(total)
    }).catch(() => setEventosCount(0))
  }, [])

  if (!stats) return <Skeleton height={400} radius="md" />

  return (
    <Stack>
      <Title order={3}>Dashboard - Finca Magdalena</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <StatCard title="Total Animales" value={stats.total_animales} icon={IconPig} color="blue" />
        <StatCard title="Siembras Activas" value={stats.total_siembras_activas} icon={IconPlant} color="green" />
        <StatCard title="Leche (este mes)" value={`${formatNumber(stats.litros_leche_mes)} L`} icon={IconMilk} color="cyan" />
        <StatCard
          title="Balance Mensual"
          value={formatCOP(stats.balance_mes)}
          icon={IconCoin}
          color={stats.balance_mes >= 0 ? 'green' : 'red'}
          trend={stats.balance_mes >= 0 ? 1 : -1}
          trendLabel="vs mes anterior"
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }}>
        <StatCard title="Bovinos" value={`${stats.total_bovinos || 0}`} icon={IconMilk} color="blue" />
        <StatCard title="Porcinos" value={`${stats.total_porcinos || 0}`} icon={IconPig} color="pink" />
        <StatCard title="Aves" value={`${stats.total_aves || 0}`} icon={IconEgg} color="yellow" />
        <StatCard title="Caprinos" value={`${stats.total_caprinos || 0}`} icon={IconPig} color="orange" />
        <StatCard title="Ovinos" value={`${stats.total_ovinos || 0}`} icon={IconPig} color="grape" />
        <StatCard title="Equinos" value={`${stats.total_equinos || 0}`} icon={IconWeight} color="teal" />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} mt="md">
        <StatCard title="Huevos Hoy" value={`${stats.huevos_hoy || 0} und`} icon={IconEgg} color="yellow" />
        <StatCard title="Colmenas Activas" value={`${stats.colmenas_activas || 0}`} icon={IconBug} color="orange" />
        <StatCard title="Eventos Sanitarios" value={eventosCount} icon={IconStethoscope} color="red" />
      </SimpleGrid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" radius="md" withBorder>
            <Text fw={600} mb="md">Ingresos vs Gastos (6 meses)</Text>
            <BarChart
              h={300}
              data={ingresos.map(i => ({ mes: i.mes.slice(5), Ingresos: Math.round(i.ingresos/1000), Gastos: Math.round(i.gastos/1000) }))}
              dataKey="mes"
              series={[
                { name: 'Ingresos', color: 'green.6' },
                { name: 'Gastos', color: 'red.5' },
              ]}
              valueFormatter={(v) => `$${v}k`}
              tickLine="y"
            />
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" radius="md" withBorder h="100%">
            <Text fw={600} mb="md">Rendimiento por Cultivo (kg/ha)</Text>
            <Stack>
              {rendimientos.slice(0, 5).map((r, i) => (
                <div key={i}>
                  <Group justify="space-between" mb={4}>
                    <Text size="sm" tt="capitalize">{r.cultivo}</Text>
                    <Text size="sm" fw={600}>{formatNumber(r.rendimiento_promedio_ha)} kg/ha</Text>
                  </Group>
                  <Divider size="xs" />
                </div>
              ))}
              {rendimientos.length === 0 && <Text size="sm" c="dimmed">Sin datos de cosechas</Text>}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
