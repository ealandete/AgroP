import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, Stack, SimpleGrid, Text, Tabs, ActionIcon,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconEdit, IconTrash, IconHorse, IconVaccine, IconHeartbeat, IconCalendarEvent } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatNumber } from '../config.js'

const PROPOSITOS_EQUINO = [
  { value: 'trabajo', label: 'Trabajo' },
  { value: 'carga', label: 'Carga' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'reproduccion', label: 'Reproducción' },
  { value: 'compania', label: 'Compañía' },
  { value: 'deporte', label: 'Deporte' },
]

const SEXOS = [
  { value: 'M', label: 'Macho' },
  { value: 'H', label: 'Hembra' },
]

export default function Equinos() {
  const [animales, setAnimales] = useState([])
  const [razas, setRazas] = useState([])
  const [eventos, setEventos] = useState([])
  const [activeTab, setActiveTab] = useState('lista')
  const [opened, { open, close }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    codigo: '', nombre: '', especie: 'equino', raza_id: '', sexo: 'M',
    fecha_nacimiento: '', peso_kg: '', color: '', proposito: 'trabajo',
  })

  const loadAnimales = async () => {
    try {
      const [a, r] = await Promise.all([
        api.get('/animales/?especie=equino'),
        api.get('/animales/razas/?especie=equino'),
      ])
      setAnimales(a.data)
      setRazas(r.data)
    } catch {
      notifications.show({ title: 'Error al cargar datos', color: 'red' })
    }
  }

  const loadEventos = async () => {
    try {
      const r = await api.get('/alertas/?tipo=vacuna&generar=true')
      setEventos(r.data || [])
    } catch {
      setEventos([])
    }
  }

  useEffect(() => { loadAnimales(); loadEventos() }, [])

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        raza_id: form.raza_id ? parseInt(form.raza_id) : null,
        peso_kg: parseFloat(form.peso_kg) || null,
      }
      if (editando) {
        await api.put(`/animales/${editando}/`, payload)
        notifications.show({ title: 'Equino actualizado', color: 'green' })
      } else {
        await api.post('/animales/', payload)
        notifications.show({ title: 'Equino registrado', color: 'green' })
      }
      close()
      setEditando(null)
      setForm({ codigo: '', nombre: '', especie: 'equino', raza_id: '', sexo: 'M', fecha_nacimiento: '', peso_kg: '', color: '', proposito: 'trabajo' })
      loadAnimales()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleEdit = (a) => {
    setEditando(a.id)
    setForm({
      codigo: a.codigo || '', nombre: a.nombre || '', especie: 'equino',
      raza_id: a.raza_id?.toString() || '', sexo: a.sexo || 'M',
      fecha_nacimiento: a.fecha_nacimiento || '', peso_kg: a.peso_kg?.toString() || '',
      color: a.color || '', proposito: a.proposito || 'trabajo',
    })
    open()
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/animales/${id}/`)
      notifications.show({ title: 'Equino desactivado', color: 'red' })
      loadAnimales()
    } catch {
      notifications.show({ title: 'Error', color: 'red' })
    }
  }

  const calcularEdad = (fn) => {
    if (!fn) return '-'
    const nac = new Date(fn)
    const hoy = new Date()
    const anos = hoy.getFullYear() - nac.getFullYear()
    const meses = hoy.getMonth() - nac.getMonth()
    return meses < 0 ? `${anos - 1}a ${12 + meses}m` : `${anos}a ${meses}m`
  }

  const total = animales.length
  const activos = animales.filter(a => a.activo !== false).length
  const edades = animales.map(a => a.fecha_nacimiento ? (new Date().getFullYear() - new Date(a.fecha_nacimiento).getFullYear()) : 0)
  const edadProm = edades.length > 0 ? (edades.reduce((s, e) => s + e, 0) / edades.length).toFixed(1) : '-'

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>
          Gestión de Equinos
        </Title>
        <Group>
          {activeTab === 'lista' && (
            <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setForm({ codigo: '', nombre: '', especie: 'equino', raza_id: '', sexo: 'M', fecha_nacimiento: '', peso_kg: '', color: '', proposito: 'trabajo' }); open() }}>
              Nuevo Equino
            </Button>
          )}
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 3 }}>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconHorse size={20} color="var(--mantine-color-brown-6)" /><Text size="xs" c="dimmed">Total Equinos</Text></Group>
          <Text size="xl" fw={700}>{formatNumber(total)}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconHeartbeat size={20} color="var(--mantine-color-green-6)" /><Text size="xs" c="dimmed">Activos</Text></Group>
          <Text size="xl" fw={700}>{formatNumber(activos)}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconCalendarEvent size={20} color="var(--mantine-color-blue-6)" /><Text size="xs" c="dimmed">Edad Promedio</Text></Group>
          <Text size="xl" fw={700}>{edadProm}{edadProm !== '-' ? ' años' : ''}</Text>
        </Paper>
      </SimpleGrid>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="lista" leftSection={<IconHorse size={16} />}>Equinos ({total})</Tabs.Tab>
          <Tabs.Tab value="salud" leftSection={<IconVaccine size={16} />}>Sanidad</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="lista" pt="md">
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nombre</Table.Th>
                  <Table.Th>Especie</Table.Th>
                  <Table.Th>Raza</Table.Th>
                  <Table.Th>Sexo</Table.Th>
                  <Table.Th>Edad</Table.Th>
                  <Table.Th>Propósito</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {animales.map((a) => (
                  <Table.Tr key={a.id}>
                    <Table.Td fw={500}>{a.nombre || a.codigo || `#${a.id}`}</Table.Td>
                    <Table.Td><Badge size="sm" variant="light">{a.especie}</Badge></Table.Td>
                    <Table.Td>{razas.find(r => r.id === a.raza_id)?.nombre || '-'}</Table.Td>
                    <Table.Td>{a.sexo === 'M' ? 'Macho' : 'Hembra'}</Table.Td>
                    <Table.Td>{calcularEdad(a.fecha_nacimiento)}</Table.Td>
                    <Table.Td>{a.proposito || '-'}</Table.Td>
                    <Table.Td><Badge color={a.activo !== false ? 'green' : 'red'} size="sm">{a.activo !== false ? 'Activo' : 'Inactivo'}</Badge></Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon variant="light" color="blue" size="sm" onClick={() => handleEdit(a)}><IconEdit size={14} /></ActionIcon>
                        <ActionIcon variant="light" color="red" size="sm" onClick={() => handleDelete(a.id)}><IconTrash size={14} /></ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {animales.length === 0 && (
                  <Table.Tr><Table.Td colSpan={8}><Text c="dimmed" ta="center" py="sm">No hay equinos registrados</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="salud" pt="md">
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Paper p="md" radius="md" withBorder>
              <Group gap={8}><IconVaccine size={20} color="orange" /><Text size="xs" c="dimmed">Vacunación</Text></Group>
              <Text size="sm" mt="sm">Registrar vacunaciones desde la ficha de cada animal</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Group gap={8}><IconHeartbeat size={20} color="blue" /><Text size="xs" c="dimmed">Desparasitación</Text></Group>
              <Text size="sm" mt="sm">Programar desparasitaciones cada 3 meses</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Group gap={8}><IconCalendarEvent size={20} color="green" /><Text size="xs" c="dimmed">Cuidado de Cascos</Text></Group>
              <Text size="sm" mt="sm">Herraje cada 6-8 semanas recomendado</Text>
            </Paper>
          </SimpleGrid>
          <Paper withBorder mt="md" p="md">
            <Text size="sm" c="dimmed">Los eventos de sanidad se gestionan desde la ficha individual de cada equino (módulo Animales).</Text>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={opened} onClose={() => { close(); setEditando(null) }} title={editando ? 'Editar Equino' : 'Nuevo Equino'} size="md">
        <Stack>
          <SimpleGrid cols={2}>
            <TextInput label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <TextInput label="Código" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            <Select
              label="Sexo"
              data={SEXOS}
              value={form.sexo}
              onChange={(v) => setForm({ ...form, sexo: v })}
              required
            />
            <Select
              label="Raza"
              placeholder="Seleccionar"
              data={razas.map((r) => ({ value: r.id.toString(), label: r.nombre }))}
              value={form.raza_id}
              onChange={(v) => setForm({ ...form, raza_id: v })}
              clearable
              searchable
            />
            <TextInput label="Fecha Nacimiento" type="date" value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} />
            <NumberInput label="Peso (kg)" value={form.peso_kg} onChange={(v) => setForm({ ...form, peso_kg: v })} min={0} decimalScale={2} />
            <TextInput label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            <Select
              label="Propósito"
              data={PROPOSITOS_EQUINO}
              value={form.proposito}
              onChange={(v) => setForm({ ...form, proposito: v })}
              clearable
            />
          </SimpleGrid>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { close(); setEditando(null) }}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editando ? 'Actualizar' : 'Guardar'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
