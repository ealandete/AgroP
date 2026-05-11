import { useEffect, useState } from 'react'
import {
  Paper, Title, Group, Stack, Text, SimpleGrid, Skeleton, Grid, Table, RingProgress,
} from '@mantine/core'
import { BarChart } from '@mantine/charts'
import { IconPig, IconPlant, IconChartBar, IconAlertTriangle } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatNumber, formatCOP, COLOR_PALETTE } from '../config.js'

export default function Estadisticas() {
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState(null)
  const [muertes, setMuertes] = useState([])
  const [rendimientos, setRendimientos] = useState([])
  const [ph, setPh] = useState([])
  const [eventos, setEventos] = useState([])

  useEffect(() => {
    Promise.all([
      api.get('/estadisticas/dashboard'),
      api.get('/estadisticas/animales/muertes-por-especie'),
      api.get('/estadisticas/cultivos/rendimientos'),
      api.get('/estadisticas/suelos/ph-por-lote'),
      api.get('/estadisticas/eventos/tipos-frecuencia'),
    ]).then(([d, m, r, p, e]) => {
      setDashboard(d.data)
      setMuertes(m.data)
      setRendimientos(r.data)
      setPh(p.data)
      setEventos(e.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <Skeleton height={400} radius="md" />

  const totalMuertes = muertes.reduce((s, m) => s + (m.muertes || 0), 0)
  const totalAnimales = muertes.reduce((s, m) => s + (m.total || 0), 0)

  return (
    <Stack>
      <Title order={3}>Estadísticas y Análisis</Title>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Paper p="md" radius="md" withBorder>
          <Group mb="md"><IconPig size={22} color="var(--mantine-color-blue-6)" /><Text fw={600}>Mortalidad por Especie</Text></Group>
          <BarChart h={250}
            data={muertes.map(m => ({ Especie: m.especie, Muertes: m.muertes, Total: m.total }))}
            dataKey="Especie"
            series={[{ name: 'Muertes', color: 'red.5' }]}
            tickLine="y"
          />
          <Text size="xs" c="dimmed" mt="xs">Total animales: {totalAnimales} | Muertes: {totalMuertes} ({totalAnimales > 0 ? ((totalMuertes / totalAnimales) * 100).toFixed(1) : 0}%)</Text>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Group mb="md"><IconPlant size={22} color="var(--mantine-color-green-6)" /><Text fw={600}>Rendimiento por Cultivo (kg/ha)</Text></Group>
          <BarChart h={250}
            data={rendimientos.map(r => ({ Cultivo: r.cultivo, 'kg/ha': Math.round(r.rendimiento_promedio_ha) }))}
            dataKey="Cultivo"
            series={[{ name: 'kg/ha', color: 'green.6' }]}
            tickLine="y"
          />
        </Paper>
      </SimpleGrid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" radius="md" withBorder>
            <Group mb="md"><IconChartBar size={22} /><Text fw={600}>pH de Suelos por Lote</Text></Group>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Lote</Table.Th>
                  <Table.Th>pH</Table.Th>
                  <Table.Th>N (ppm)</Table.Th>
                  <Table.Th>Estado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {ph.map((s, i) => (
                  <Table.Tr key={i}>
                    <Table.Td fw={500}>{s.lote}</Table.Td>
                    <Table.Td>{s.ph}</Table.Td>
                    <Table.Td>{s.nitrogeno}</Table.Td>
                    <Table.Td>
                      {s.ph < 5.5 ? <Text c="red" size="xs" fw={600}>BAJO</Text> :
                       s.ph > 7.5 ? <Text c="orange" size="xs" fw={600}>ALTO</Text> :
                       <Text c="green" size="xs" fw={600}>ÓPTIMO</Text>}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" radius="md" withBorder>
            <Group mb="md"><IconAlertTriangle size={22} /><Text fw={600}>Frecuencia de Eventos Sanitarios</Text></Group>
            <Table>
              <Table.Thead>
                <Table.Tr><Table.Th>Tipo de Evento</Table.Th><Table.Th>Cantidad</Table.Th></Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {eventos.map((e, i) => (
                  <Table.Tr key={i}>
                    <Table.Td tt="capitalize">{e.tipo}</Table.Td>
                    <Table.Td fw={600}>{e.cantidad}</Table.Td>
                  </Table.Tr>
                ))}
                {eventos.length === 0 && <Table.Tr><Table.Td colSpan={2}><Text c="dimmed" ta="center">Sin eventos</Text></Table.Td></Table.Tr>}
              </Table.Tbody>
            </Table>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
