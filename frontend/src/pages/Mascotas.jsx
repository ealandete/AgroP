import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, Stack, SimpleGrid, Text, Tabs, ActionIcon,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconEdit, IconTrash, IconDog, IconCat, IconVaccine, IconHeartbeat } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatNumber } from '../config.js'

const PROPOSITOS = [
  { value: 'compania', label: 'Compañía' },
  { value: 'pastoreo', label: 'Pastoreo' },
  { value: 'vigilancia', label: 'Vigilancia' },
  { value: 'caza', label: 'Caza' },
]

const SEXOS = [
  { value: 'M', label: 'Macho' },
  { value: 'H', label: 'Hembra' },
]

export default function Mascotas() {
  const [animales, setAnimales] = useState([])
  const [especieFiltro, setEspecieFiltro] = useState('todas')
  const [activeTab, setActiveTab] = useState('lista')
  const [opened, { open, close }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    codigo: '', nombre: '', especie: 'canino', raza_id: '', sexo: 'M',
    fecha_nacimiento: '', peso_kg: '', color: '', proposito: 'compania',
  })

  const loadAnimales = async () => {
    try {
      const [caninos, felinos] = await Promise.all([
        api.get('/animales/?especie=canino').catch(() => ({ data: [] })),
        api.get('/animales/?especie=felino').catch(() => ({ data: [] })),
      ])
      setAnimales([...caninos.data, ...felinos.data])
    } catch {
      notifications.show({ title: 'Error al cargar datos', color: 'red' })
    }
  }

  useEffect(() => { loadAnimales() }, [])

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        peso_kg: parseFloat(form.peso_kg) || null,
      }
      if (editando) {
        await api.put(`/animales/${editando}/`, payload)
        notifications.show({ title: 'Actualizado', color: 'green' })
      } else {
        await api.post('/animales/', payload)
        notifications.show({ title: 'Registrado', color: 'green' })
      }
      close()
      setEditando(null)
      setForm({ codigo: '', nombre: '', especie: 'canino', raza_id: '', sexo: 'M', fecha_nacimiento: '', peso_kg: '', color: '', proposito: 'compania' })
      loadAnimales()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleEdit = (a) => {
    setEditando(a.id)
    setForm({
      codigo: a.codigo || '', nombre: a.nombre || '', especie: a.especie || 'canino',
      sexo: a.sexo || 'M', fecha_nacimiento: a.fecha_nacimiento || '',
      peso_kg: a.peso_kg?.toString() || '', color: a.color || '', proposito: a.proposito || 'compania',
    })
    open()
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/animales/${id}/`)
      notifications.show({ title: 'Desactivado', color: 'red' })
      loadAnimales()
    } catch {
      notifications.show({ title: 'Error', color: 'red' })
    }
  }

  const filtrados = especieFiltro === 'todas'
    ? animales
    : animales.filter(a => a.especie === especieFiltro)
  const totalPerros = animales.filter(a => a.especie === 'canino').length
  const totalGatos = animales.filter(a => a.especie === 'felino').length
  const activos = animales.filter(a => a.activo !== false).length

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Mascotas</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setForm({ codigo: '', nombre: '', especie: 'canino', raza_id: '', sexo: 'M', fecha_nacimiento: '', peso_kg: '', color: '', proposito: 'compania' }); open() }}>
          Nuevo Registro
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconDog size={20} color="var(--mantine-color-orange-6)" /><Text size="xs" c="dimmed">Total Perros</Text></Group>
          <Text size="xl" fw={700}>{formatNumber(totalPerros)}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconCat size={20} color="var(--mantine-color-gray-6)" /><Text size="xs" c="dimmed">Total Gatos</Text></Group>
          <Text size="xl" fw={700}>{formatNumber(totalGatos)}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconHeartbeat size={20} color="var(--mantine-color-green-6)" /><Text size="xs" c="dimmed">Activos</Text></Group>
          <Text size="xl" fw={700}>{formatNumber(activos)}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconVaccine size={20} color="var(--mantine-color-pink-6)" /><Text size="xs" c="dimmed">Vacunados</Text></Group>
          <Text size="xl" fw={700}>{formatNumber(activos)}</Text>
        </Paper>
      </SimpleGrid>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="lista" leftSection={<IconDog size={16} />}>Registro ({filtrados.length})</Tabs.Tab>
          <Tabs.Tab value="salud" leftSection={<IconVaccine size={16} />}>Sanidad</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="lista" pt="md">
          <Group mb="sm">
            <Select
              label="Filtrar por especie"
              data={[
                { value: 'todas', label: 'Todas' },
                { value: 'canino', label: 'Perros' },
                { value: 'felino', label: 'Gatos' },
              ]}
              value={especieFiltro}
              onChange={setEspecieFiltro}
              w={200}
            />
          </Group>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nombre</Table.Th>
                  <Table.Th>Especie</Table.Th>
                  <Table.Th>Sexo</Table.Th>
                  <Table.Th>Color</Table.Th>
                  <Table.Th>Propósito</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtrados.map((a) => (
                  <Table.Tr key={a.id}>
                    <Table.Td fw={500}>{a.nombre || a.codigo || `#${a.id}`}</Table.Td>
                    <Table.Td>
                      <Badge size="sm" color={a.especie === 'canino' ? 'orange' : 'gray'} variant="light">
                        {a.especie === 'canino' ? 'Perro' : 'Gato'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{a.sexo === 'M' ? 'Macho' : 'Hembra'}</Table.Td>
                    <Table.Td>{a.color || '-'}</Table.Td>
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
                {filtrados.length === 0 && (
                  <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center" py="sm">No hay mascotas registradas</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="salud" pt="md">
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Paper p="md" radius="md" withBorder>
              <Group gap={8}><IconVaccine size={20} color="blue" /><Text size="xs" c="dimmed">Vacunación Antirrábica</Text></Group>
              <Text size="sm" mt="sm">Vacunar anualmente. Registrar en ficha del animal.</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Group gap={8}><IconHeartbeat size={20} color="green" /><Text size="xs" c="dimmed">Desparasitación</Text></Group>
              <Text size="sm" mt="sm">Desparasitación interna cada 3 meses, externa mensual.</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Group gap={8}><IconVaccine size={20} color="orange" /><Text size="xs" c="dimmed">Control Veterinario</Text></Group>
              <Text size="sm" mt="sm">Chequeo general recomendado cada 6 meses.</Text>
            </Paper>
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={opened} onClose={() => { close(); setEditando(null) }} title={editando ? 'Editar Mascota' : 'Nueva Mascota'} size="md">
        <Stack>
          <SimpleGrid cols={2}>
            <TextInput label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <TextInput label="Código" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            <Select
              label="Especie"
              data={[
                { value: 'canino', label: 'Perro' },
                { value: 'felino', label: 'Gato' },
              ]}
              value={form.especie}
              onChange={(v) => setForm({ ...form, especie: v })}
              required
            />
            <Select
              label="Sexo"
              data={SEXOS}
              value={form.sexo}
              onChange={(v) => setForm({ ...form, sexo: v })}
              required
            />
            <Select
              label="Propósito"
              data={PROPOSITOS}
              value={form.proposito}
              onChange={(v) => setForm({ ...form, proposito: v })}
              clearable
            />
            <TextInput label="Fecha Nacimiento" type="date" value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} />
            <NumberInput label="Peso (kg)" value={form.peso_kg} onChange={(v) => setForm({ ...form, peso_kg: v })} min={0} decimalScale={2} />
            <TextInput label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
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
