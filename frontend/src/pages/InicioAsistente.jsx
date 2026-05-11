import { useEffect, useState } from 'react'
import {
  Grid, Paper, Text, Group, Stack, Title, Skeleton, SimpleGrid,
  Badge, ThemeIcon, ScrollArea, Box, Button, Card, TextInput, Select,
  Textarea, Divider, Table, Anchor,
} from '@mantine/core'
import {
  IconPig, IconStethoscope, IconMilk, IconWeight,
  IconFileSpreadsheet, IconClock, IconHelp, IconDownload,
  IconPlus, IconCheck, IconAlertCircle, IconTable,
  IconFileDescription,
} from '@tabler/icons-react'
import api from '../services/api'
import { formatCOP, formatNumber } from '../config'

function EntradaRapida() {
  const [form, setForm] = useState({ tipo: 'animal', identificacion: '', especie: 'bovino', peso: '', observacion: '' })
  const [saving, setSaving] = useState(false)

  const cards = [
    {
      icon: IconPig, color: 'blue', label: 'Registrar Animal',
      fields: (
        <Stack gap="xs">
          <TextInput size="sm" label="Identificación" placeholder="Ej: B-001" value={form.identificacion} onChange={e => setForm(f => ({ ...f, identificacion: e.target.value }))} />
          <Select size="sm" label="Especie" data={[{ value: 'bovino', label: 'Bovino' }, { value: 'porcino', label: 'Porcino' }, { value: 'ovino', label: 'Ovino' }, { value: 'caprino', label: 'Caprino' }]} value={form.especie} onChange={v => setForm(f => ({ ...f, especie: v || 'bovino' }))} />
        </Stack>
      ),
    },
    {
      icon: IconStethoscope, color: 'red', label: 'Evento Sanitario',
      fields: (
        <Stack gap="xs">
          <TextInput size="sm" label="Animal" placeholder="Identificación" />
          <Select size="sm" label="Tipo" data={[{ value: 'consulta', label: 'Consulta' }, { value: 'tratamiento', label: 'Tratamiento' }, { value: 'vacuna', label: 'Vacuna' }]} />
        </Stack>
      ),
    },
    {
      icon: IconMilk, color: 'cyan', label: 'Producción Leche',
      fields: (
        <Stack gap="xs">
          <TextInput size="sm" label="Litros" placeholder="Cantidad en L" type="number" />
          <Select size="sm" label="Turno" data={[{ value: 'am', label: 'Mañana' }, { value: 'pm', label: 'Tarde' }]} />
        </Stack>
      ),
    },
    {
      icon: IconWeight, color: 'teal', label: 'Registrar Peso',
      fields: (
        <Stack gap="xs">
          <TextInput size="sm" label="Animal" placeholder="Identificación" />
          <TextInput size="sm" label="Peso (kg)" placeholder="Ej: 450" type="number" />
        </Stack>
      ),
    },
    {
      icon: IconFileSpreadsheet, color: 'grape', label: 'Cargar Excel',
      fields: (
        <Stack gap="xs">
          <Button variant="light" color="grape" fullWidth leftSection={<IconFileSpreadsheet size={16} />}>Seleccionar archivo</Button>
          <Text size="xs" c="dimmed">Formatos: .xlsx, .csv</Text>
        </Stack>
      ),
    },
  ]

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconPlus size={20} /><Text fw={700} size="md">Entrada Rápida</Text></Group>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        {cards.map((c, i) => (
          <Card key={i} padding="md" radius="md" withBorder>
            <Group mb="sm">
              <ThemeIcon variant="light" size="lg" radius="xl" color={c.color}><c.icon size={20} /></ThemeIcon>
              <Text fw={600} size="sm">{c.label}</Text>
            </Group>
            {c.fields}
            <Button fullWidth mt="xs" size="sm" color={c.color} leftSection={<IconCheck size={14} />}>
              Guardar
            </Button>
          </Card>
        ))}
      </SimpleGrid>
    </Paper>
  )
}

function UltimosRegistros() {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/animales/', { params: { limit: 3, order: '-created_at' } }).catch(() => ({ data: [] })),
      api.get('/operaciones/', { params: { limit: 3, order: '-fecha' } }).catch(() => ({ data: [] })),
      api.get('/produccion/', { params: { limit: 3, order: '-fecha' } }).catch(() => ({ data: [] })),
    ]).then(([animales, operaciones, produccion]) => {
      const items = [
        ...(Array.isArray(animales.data) ? animales.data : []).map(a => ({ tipo: 'Animal', desc: a.identificacion || a.nombre || `#${a.id}`, fecha: a.created_at || a.fecha_ingreso })),
        ...(Array.isArray(operaciones.data) ? operaciones.data : []).map(o => ({ tipo: 'Operación', desc: o.nombre || o.titulo || `#${o.id}`, fecha: o.fecha })),
        ...(Array.isArray(produccion.data) ? produccion.data : []).map(p => ({ tipo: 'Producción', desc: `${p.cantidad || p.litros || 0} L`, fecha: p.fecha })),
      ].sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)).slice(0, 10)
      setRegistros(items)
    }).catch(() => setRegistros([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={200} />

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconTable size={20} /><Text fw={700} size="md">Últimos Registros</Text></Group>
      {registros.length === 0 ? (
        <Text c="dimmed" size="sm" ta="center" py="xl">Sin registros recientes</Text>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Descripción</Table.Th>
              <Table.Th>Fecha</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {registros.map((r, i) => (
              <Table.Tr key={i}>
                <Table.Td><Badge size="sm" color="blue" variant="light">{r.tipo}</Badge></Table.Td>
                <Table.Td><Text size="sm">{r.desc}</Text></Table.Td>
                <Table.Td><Text size="xs" c="dimmed">{r.fecha ? new Date(r.fecha).toLocaleDateString('es-CO') : '-'}</Text></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Paper>
  )
}

function Pendientes() {
  const [pendientes, setPendientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/plan-actividades/', { params: { estado: 'pendiente', limit: 5 } })
      .then(({ data }) => setPendientes(Array.isArray(data) ? data : []))
      .catch(() => setPendientes([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton h={140} />

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconAlertCircle size={20} /><Text fw={700} size="md">Pendientes</Text></Group>
      {pendientes.length === 0 ? (
        <Text c="dimmed" size="sm" ta="center" py="md">Sin pendientes</Text>
      ) : (
        <Stack gap={4}>
          {pendientes.map((p, i) => (
            <Group key={i} gap={4} p={3}>
              <IconClock size={14} color="var(--mantine-color-orange-5)" />
              <Text size="sm" style={{ flex: 1 }}>{p.nombre || p.titulo || p.descripcion || `Actividad #${p.id}`}</Text>
              {p.fecha_programada && <Badge size="xs">{new Date(p.fecha_programada).toLocaleDateString('es-CO')}</Badge>}
            </Group>
          ))}
        </Stack>
      )}
    </Paper>
  )
}

function Ayuda() {
  const enlaces = [
    { label: 'Plantilla Carga Animales', icon: IconFileDescription },
    { label: 'Guía Rápida: Sanidad', icon: IconFileDescription },
    { label: 'Formato Producción Diaria', icon: IconFileDescription },
    { label: 'Manual de Usuario', icon: IconFileDescription },
  ]

  return (
    <Paper p="md" radius="md" withBorder>
      <Group mb="sm"><IconHelp size={20} /><Text fw={700} size="md">Ayuda y Recursos</Text></Group>
      <Stack gap={6}>
        {enlaces.map((e, i) => (
          <Anchor key={i} href="#" size="sm">
            <Group gap={6}>
              <ThemeIcon variant="light" size="sm" radius="xl" color="gray"><e.icon size={14} /></ThemeIcon>
              <Text size="sm">{e.label}</Text>
              <IconDownload size={14} style={{ marginLeft: 'auto' }} />
            </Group>
          </Anchor>
        ))}
      </Stack>
    </Paper>
  )
}

export default function InicioAsistente() {
  return (
    <Stack>
      <Title order={2}>Panel Asistente</Title>
      <Text c="dimmed" size="sm">Entrada rápida de datos</Text>
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}><EntradaRapida /></Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack>
            <UltimosRegistros />
            <Pendientes />
            <Ayuda />
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
