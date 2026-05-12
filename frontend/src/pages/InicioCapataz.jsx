import { useEffect, useState } from 'react'
import {
  Grid, Paper, Text, Group, Stack, Title, Skeleton, SimpleGrid,
  Badge, ThemeIcon, ScrollArea, Box, Checkbox, Button, Card,
} from '@mantine/core'
import {
  IconCalendarEvent, IconCloudRain, IconUsers,
  IconChecklist, IconAlertCircle, IconMilk, IconUserCheck,
  IconReport, IconBox, IconMap, IconTemperature,
  IconClock, IconArrowRight,
} from '@tabler/icons-react'
import api from '../services/api'
import { formatNumber } from '../config'

function HoyPanel() {
  const [clima, setClima] = useState(null)
  const [trabajadores, setTrabajadores] = useState([])

  useEffect(() => {
    api.get('/registros-climaticos/', { params: { limit: 1, order: '-fecha' } })
      .then(({ data }) => setClima(Array.isArray(data) ? data[0] : data))
      .catch(() => setClima(null))
    api.get('/trabajadores/', { params: { limit: 100 } })
      .then(({ data }) => setTrabajadores(Array.isArray(data) ? data : []))
      .catch(() => setTrabajadores([]))
  }, [])

  const hoy = new Date()
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const fechaStr = `${dias[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`
  const presentes = trabajadores.filter(t => t.estado === 'activo' || !t.estado).length

  return (
    <Paper p="md" radius="md" withBorder style={{ background: 'linear-gradient(135deg, var(--mantine-color-green-7), var(--mantine-color-teal-6))', color: 'white' }}>
      <Group justify="space-between">
        <Stack gap={2}>
          <Group gap={6}>
            <IconCalendarEvent size={20} />
            <Text fw={700} size="lg">{fechaStr}</Text>
          </Group>
          <Group gap="lg" mt="xs">
            {clima && (
              <Group gap={4}>
                <IconCloudRain size={16} />
                <Text size="sm">{clima.precipitacion || 0} mm</Text>
                <IconTemperature size={16} />
                <Text size="sm">{clima.temperatura || clima.temp || 0}°C</Text>
              </Group>
            )}
            <Group gap={4}>
              <IconUsers size={16} />
              <Text size="sm">{presentes} trabajadores presentes</Text>
            </Group>
          </Group>
        </Stack>
        <Badge color="white" variant="white" size="xl" style={{ color: 'var(--mantine-color-teal-7)' }}>
          {presentes} activos
        </Badge>
      </Group>
    </Paper>
  )
}

function TareasDelDia() {
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [completadas, setCompletadas] = useState([])

  useEffect(() => {
    const hoy = new Date().toISOString().slice(0, 10)
    api.get('/plan-actividades/', { params: { fecha: hoy, limit: 20 } })
      .then(({ data }) => setTareas(Array.isArray(data) ? data : []))
      .catch(() => setTareas([]))
      .finally(() => setLoading(false))
  }, [])

  const toggleTarea = (id) => {
    setCompletadas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  if (loading) return <Skeleton h={250} />

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconChecklist size={20} /><Text fw={700} size="md">Tareas del Día</Text><Badge ml="auto">{tareas.length}</Badge></Group>
      {tareas.length === 0 ? (
        <Text c="dimmed" size="sm" ta="center" py="xl">Sin tareas programadas para hoy</Text>
      ) : (
        <ScrollArea h={280}>
          <Stack gap={4}>
            {tareas.map((t, i) => (
              <Paper key={i} p="xs" withBorder style={{ borderLeft: `4px solid ${completadas.includes(t.id) ? 'var(--mantine-color-green-5)' : 'var(--mantine-color-orange-5)'}` }}>
                <Group>
                  <Checkbox checked={completadas.includes(t.id)} onChange={() => toggleTarea(t.id)} />
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" td={completadas.includes(t.id) ? 'line-through' : 'none'} fw={500}>{t.nombre || t.titulo || t.descripcion || `Actividad #${t.id}`}</Text>
                    <Text size="10px" c="dimmed">{t.lote ? `Lote: ${t.lote}` : ''} {t.responsable ? `| ${t.responsable}` : ''}</Text>
                  </Box>
                  <Badge size="sm" color={t.prioridad === 'alta' ? 'red' : t.prioridad === 'media' ? 'yellow' : 'blue'} variant="light">{t.prioridad || 'normal'}</Badge>
                </Group>
              </Paper>
            ))}
          </Stack>
        </ScrollArea>
      )}
    </Paper>
  )
}

function Cuadrilla() {
  const [trabajadores, setTrabajadores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/trabajadores/', { params: { limit: 50 } })
      .then(({ data }) => setTrabajadores(Array.isArray(data) ? data : []))
      .catch(() => setTrabajadores([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={200} />

  const ausentes = trabajadores.filter(t => t.estado === 'inactivo' || t.estado === 'ausente')
  const presentes = trabajadores.filter(t => t.estado === 'activo' || !t.estado)

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconUsers size={20} /><Text fw={700} size="md">Cuadrilla</Text></Group>
      <SimpleGrid cols={2} mb="sm">
        <Paper p="sm" bg="green.0" style={{ borderLeft: '4px solid green' }}>
          <Text size="xs" c="dimmed">Presentes</Text>
          <Text fw={700} size="xl">{presentes.length}</Text>
        </Paper>
        <Paper p="sm" bg="red.0" style={{ borderLeft: '4px solid red' }}>
          <Text size="xs" c="dimmed">Ausentes</Text>
          <Text fw={700} size="xl">{ausentes.length}</Text>
        </Paper>
      </SimpleGrid>
      <Button variant="light" color="blue" fullWidth leftSection={<IconUserCheck size={16} />} size="sm">
        Marcar Asistencia
      </Button>
    </Paper>
  )
}

function PendientesUrgentes() {
  const [pendientes, setPendientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const manana = new Date()
    manana.setDate(manana.getDate() + 2)
    api.get('/plan-actividades/', {
      params: {
        estado: 'pendiente',
        fecha_hasta: manana.toISOString().slice(0, 10),
        limit: 10,
      }
    }).then(({ data }) => setPendientes(Array.isArray(data) ? data : []))
      .catch(() => setPendientes([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={180} />

  const vencidas = pendientes.filter(t => t.fecha_programada && new Date(t.fecha_programada) < new Date())
  const proximas = pendientes.filter(t => !t.fecha_programada || new Date(t.fecha_programada) >= new Date())

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconAlertCircle size={20} color="red" /><Text fw={700} size="md">Pendientes Urgentes</Text></Group>
      {vencidas.length > 0 && (
        <Box mb="xs">
          <Text size="xs" fw={600} c="red">VENCIDAS ({vencidas.length})</Text>
          {vencidas.map((t, i) => (
            <Group key={i} gap={4} p={4}>
              <IconClock size={12} color="red" />
              <Text size="sm">{t.nombre || t.titulo || `Actividad #${t.id}`}</Text>
            </Group>
          ))}
        </Box>
      )}
      {proximas.slice(0, 5).map((t, i) => (
        <Group key={i} gap={4} p={4}>
          <IconAlertCircle size={12} color="orange" />
          <Text size="sm">{t.nombre || t.titulo || `Actividad #${t.id}`}</Text>
          {t.fecha_programada && <Badge size="xs">{new Date(t.fecha_programada).toLocaleDateString('es-CO')}</Badge>}
        </Group>
      ))}
      {pendientes.length === 0 && <Text c="dimmed" size="sm" ta="center" py="md">Sin pendientes urgentes</Text>}
    </Paper>
  )
}

function AccesoRapido() {
  const acciones = [
    { label: 'Registrar Producción Leche', icon: IconMilk, color: 'blue', to: '/animales' },
    { label: 'Marcar Asistencia', icon: IconUserCheck, color: 'green', to: '/trabajadores' },
    { label: 'Reportar Novedad', icon: IconReport, color: 'orange', to: '/operaciones' },
    { label: 'Cargar Insumo', icon: IconBox, color: 'grape', to: '/inventario' },
  ]

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconArrowRight size={20} /><Text fw={700} size="md">Acceso Rápido</Text></Group>
      <SimpleGrid cols={2}>
        {acciones.map((a, i) => (
          <Card key={i} padding="lg" radius="md" withBorder style={{ cursor: 'pointer' }}>
            <Group>
              <ThemeIcon variant="light" size="xl" radius="xl" color={a.color}>
                <a.icon size={24} />
              </ThemeIcon>
              <Text fw={600} size="sm">{a.label}</Text>
            </Group>
          </Card>
        ))}
      </SimpleGrid>
    </Paper>
  )
}

function LotesEnOperacion() {
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const hoy = new Date().toISOString().slice(0, 10)
    api.get('/plan-actividades/', { params: { fecha: hoy, limit: 50 } })
      .then(({ data }) => {
        const act = Array.isArray(data) ? data : []
        const loteIds = [...new Set(act.map(a => a.lote_id || a.lote).filter(Boolean))]
        if (loteIds.length === 0) return []
        return api.get('/lotes/', { params: { ids: loteIds.join(',') } })
      })
      .then(({ data }) => setLotes(Array.isArray(data) ? data : []))
      .catch(() => setLotes([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={120} />

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconMap size={20} /><Text fw={700} size="md">Lotes en Operación Hoy</Text></Group>
      {lotes.length === 0 ? (
        <Text c="dimmed" size="sm">Sin operaciones en lotes hoy</Text>
      ) : (
        <Group gap="xs">
          {lotes.map((l, i) => (
            <Badge key={i} color="teal" variant="light" size="lg">{l.nombre || `Lote ${l.id}`}</Badge>
          ))}
        </Group>
      )}
    </Paper>
  )
}

export default function InicioCapataz() {
  return (
    <Stack>
      <HoyPanel />
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}><TareasDelDia /></Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}><Cuadrilla /></Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}><PendientesUrgentes /></Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}><AccesoRapido /></Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}><LotesEnOperacion /></Grid.Col>
      </Grid>
    </Stack>
  )
}
