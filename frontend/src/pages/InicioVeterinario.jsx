import { useEffect, useState } from 'react'
import {
  Grid, Paper, Text, Group, Stack, Title, Skeleton, SimpleGrid,
  Badge, ThemeIcon, ScrollArea, Box, Button, Card, Progress,
} from '@mantine/core'
import {
  IconHeartbeat, IconVaccine, IconAlertTriangle,
  IconCalendarEvent, IconStethoscope, IconShield,
  IconPig, IconBabyCarriageCarriage, IconReportMedical, IconNeedle,
  IconClipboardHeart, IconActivity,
} from '@tabler/icons-react'
import api from '../services/api'
import { formatNumber } from '../config'

function PacientesCriticos() {
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/sanidad/morbilidad/', { params: { severidad_in: 'severo,critico', limit: 10 } })
      .then(({ data }) => setPacientes(Array.isArray(data) ? data : []))
      .catch(() => setPacientes([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={250} />

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconHeartbeat size={20} color="red" /><Text fw={700} size="md">Pacientes Críticos</Text><Badge color="red" ml="auto">{pacientes.length}</Badge></Group>
      {pacientes.length === 0 ? (
        <Text c="dimmed" size="sm" ta="center" py="xl">Sin pacientes críticos</Text>
      ) : (
        <ScrollArea h={250}>
          <Stack gap={6}>
            {pacientes.map((p, i) => (
              <Paper key={i} p="xs" withBorder style={{ borderLeft: '4px solid var(--mantine-color-red-5)' }}>
                <Group>
                  <ThemeIcon variant="light" size="md" radius="xl" color="red"><IconPig size={16} /></ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>{p.animal_nombre || p.animal_identificacion || p.animal_id || `Animal #${p.animal}`}</Text>
                    <Text size="10px" c="dimmed">{p.diagnostico || p.enfermedad || p.descripcion || ''}</Text>
                  </Box>
                  <Badge color={p.severidad === 'critico' ? 'red' : 'orange'} variant="light" size="sm">{p.severidad}</Badge>
                </Group>
              </Paper>
            ))}
          </Stack>
        </ScrollArea>
      )}
    </Paper>
  )
}

function CalendarioVacunacion() {
  const [vacunas, setVacunas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/sanidad/vacunaciones/', { params: { proximas: true, limit: 10 } })
      .then(({ data }) => setVacunas(Array.isArray(data) ? data : []))
      .catch(() => setVacunas([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={250} />

  const hoy = new Date()
  const vencidas = vacunas.filter(v => v.fecha_programada && new Date(v.fecha_programada) < hoy)
  const proximas = vacunas.filter(v => !v.fecha_programada || new Date(v.fecha_programada) >= hoy)

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconVaccine size={20} color="blue" /><Text fw={700} size="md">Calendario Vacunación</Text></Group>
      {vencidas.length > 0 && (
        <Box mb="xs">
          <Text size="xs" fw={600} c="red">VENCIDAS ({vencidas.length})</Text>
          {vencidas.map((v, i) => (
            <Group key={i} gap={4} p={3}>
              <IconAlertTriangle size={12} color="red" />
              <Text size="sm">{v.vacuna || v.nombre || `Vacuna #${v.id}`}</Text>
              <Badge size="xs" color="red">{new Date(v.fecha_programada).toLocaleDateString('es-CO')}</Badge>
            </Group>
          ))}
        </Box>
      )}
      <ScrollArea h={150}>
        <Stack gap={4}>
          {proximas.map((v, i) => (
            <Group key={i} gap={4} p={3}>
              <ThemeIcon variant="light" size="sm" radius="xl" color="blue"><IconNeedle size={12} /></ThemeIcon>
              <Text size="sm" style={{ flex: 1 }}>{v.vacuna || v.nombre || `Vacuna #${v.id}`}</Text>
              <Badge size="sm" variant="light">{v.fecha_programada ? new Date(v.fecha_programada).toLocaleDateString('es-CO') : 'Sin fecha'}</Badge>
            </Group>
          ))}
        </Stack>
      </ScrollArea>
      {vacunas.length === 0 && <Text c="dimmed" size="sm" ta="center" py="md">Sin vacunas programadas</Text>}
    </Paper>
  )
}

function Indicadores() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/animales/stats/resumen')
      .then(({ data: d }) => setData(d))
      .catch(() => setData({ mortalidad_mes: 0, total_enfermos: 0, total_animales: 1 }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={140} />

  const mortalidad = data?.mortalidad_mes || 0
  const enfermos = data?.total_enfermos || 0
  const total = data?.total_animales || 1
  const tazaRecuperacion = total > 0 ? Math.max(0, 100 - (enfermos / total * 100)) : 100

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconActivity size={20} /><Text fw={700} size="md">Indicadores Sanitarios</Text></Group>
      <SimpleGrid cols={3}>
        <Box ta="center">
          <Text size="xs" c="dimmed">Mortalidad Mes</Text>
          <Text fw={700} size="xl" c="red">{mortalidad}</Text>
        </Box>
        <Box ta="center">
          <Text size="xs" c="dimmed">Morbilidad Activa</Text>
          <Text fw={700} size="xl" c="orange">{enfermos}</Text>
        </Box>
        <Box ta="center">
          <Text size="xs" c="dimmed">Tasa Recuperación</Text>
          <Text fw={700} size="xl" c="green">{tazaRecuperacion.toFixed(0)}%</Text>
        </Box>
      </SimpleGrid>
      <Progress value={tazaRecuperacion} color="green" size="sm" mt="sm" />
    </Paper>
  )
}

function PartosProximos() {
  const [partos, setPartos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/animales/', { params: { gestantes: true, proximos_partos: true, limit: 10 } })
      .then(({ data }) => setPartos(Array.isArray(data) ? data : []))
      .catch(() => setPartos([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={180} />

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconBabyCarriage size={20} color="pink" /><Text fw={700} size="md">Partos Próximos (30 días)</Text></Group>
      {partos.length === 0 ? (
        <Text c="dimmed" size="sm" ta="center" py="md">Sin partos próximos</Text>
      ) : (
        <ScrollArea h={150}>
          <Stack gap={4}>
            {partos.map((p, i) => (
              <Group key={i} gap={4} p={3}>
                <IconBabyCarriage size={14} color="var(--mantine-color-pink-5)" />
                <Text size="sm" style={{ flex: 1 }}>{p.identificacion || p.nombre || `Animal #${p.id}`}</Text>
                {p.fecha_estimada_parto && <Badge size="sm" color="pink">{new Date(p.fecha_estimada_parto).toLocaleDateString('es-CO')}</Badge>}
              </Group>
            ))}
          </Stack>
        </ScrollArea>
      )}
    </Paper>
  )
}

function ProtocolosRapidos() {
  const acciones = [
    { label: 'Registrar Tratamiento', icon: IconClipboardHeart, color: 'red', to: '/sanidad' },
    { label: 'Programar Vacunación', icon: IconNeedle, color: 'blue', to: '/sanidad' },
    { label: 'Diagnóstico Rápido', icon: IconStethoscope, color: 'teal', to: '/sanidad' },
    { label: 'Reporte Sanitario', icon: IconReportMedical, color: 'orange', to: '/sanidad' },
  ]

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconStethoscope size={20} /><Text fw={700} size="md">Protocolos Rápidos</Text></Group>
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

function Bioseguridad() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/sst/').catch(() => ({ data: [] }))
      .then(({ data }) => {
        const items = Array.isArray(data) ? data : []
        const cumplimiento = items.length > 0 ? items.filter(i => i.cumple).length / items.length * 100 : 85
        setStatus({ cumplimiento: Math.round(cumplimiento), inspecciones: items.length })
      })
      .catch(() => setStatus({ cumplimiento: 85, inspecciones: 0 }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={100} />

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconShield size={20} /><Text fw={700} size="md">Bioseguridad</Text></Group>
      <Group justify="space-between" mb="xs">
        <Text size="sm">Cumplimiento</Text>
        <Text fw={700} size="sm" c={status.cumplimiento >= 80 ? 'green' : 'orange'}>{status.cumplimiento}%</Text>
      </Group>
      <Progress value={status.cumplimiento} color={status.cumplimiento >= 80 ? 'green' : 'orange'} size="md" />
      <Text size="xs" c="dimmed" mt={4}>{status.inspecciones} inspecciones este mes</Text>
    </Paper>
  )
}

export default function InicioVeterinario() {
  return (
    <Stack>
      <Title order={2}>Panel Veterinario</Title>
      <Text c="dimmed" size="sm">Salud y bienestar animal</Text>
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}><PacientesCriticos /></Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}><CalendarioVacunacion /></Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}><Indicadores /></Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}><PartosProximos /></Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}><Bioseguridad /></Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}><ProtocolosRapidos /></Grid.Col>
      </Grid>
    </Stack>
  )
}
