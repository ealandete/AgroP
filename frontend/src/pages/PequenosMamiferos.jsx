import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, Stack, SimpleGrid, Text, Tabs, ActionIcon,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconEdit, IconTrash, IconPaw, IconVaccine, IconHeartbeat, IconWeight, IconBabyBottle } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatNumber } from '../config.js'

const ESPECIES_PEQUENAS = [
  { value: 'conejo', label: 'Conejo' },
  { value: 'chiguiro', label: 'Chigüiro' },
  { value: 'cuy', label: 'Cuy' },
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
]

const ETAPAS = [
  { value: 'cria', label: 'Cría' },
  { value: 'levante', label: 'Levante' },
  { value: 'adulto', label: 'Adulto' },
  { value: 'reproductor', label: 'Reproductor' },
]

const SEXOS = [
  { value: 'M', label: 'Macho' },
  { value: 'H', label: 'Hembra' },
]

export default function PequenosMamiferos() {
  const [animales, setAnimales] = useState([])
  const [especieFiltro, setEspecieFiltro] = useState('todas')
  const [activeTab, setActiveTab] = useState('lista')
  const [opened, { open, close }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    codigo: '', nombre: '', especie: 'conejo', sexo: 'M',
    fecha_nacimiento: '', peso_kg: '', color: '', etapa: 'cria',
  })

  const loadAnimales = async () => {
    try {
      const especies = ['conejo', 'chiguiro', 'cuy', 'perro', 'gato']
      const resultados = await Promise.all(
        especies.map(esp => api.get(`/animales/?especie=${esp}`).then(r => r.data).catch(() => []))
      )
      setAnimales(resultados.flat())
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
      setForm({ codigo: '', nombre: '', especie: 'conejo', sexo: 'M', fecha_nacimiento: '', peso_kg: '', color: '', etapa: 'cria' })
      loadAnimales()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleEdit = (a) => {
    setEditando(a.id)
    setForm({
      codigo: a.codigo || '', nombre: a.nombre || '', especie: a.especie || 'conejo',
      sexo: a.sexo || 'M', fecha_nacimiento: a.fecha_nacimiento || '',
      peso_kg: a.peso_kg?.toString() || '', color: a.color || '', etapa: a.etapa || 'cria',
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

  const especiesPresentes = [...new Set(animales.map(a => a.especie))]
  const enProduccion = animales.filter(a => a.activo !== false && a.etapa !== 'cria').length

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>
          Pequeños Mamíferos
        </Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setForm({ codigo: '', nombre: '', especie: 'conejo', sexo: 'M', fecha_nacimiento: '', peso_kg: '', color: '', etapa: 'cria' }); open() }}>
          Nuevo Registro
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconPaw size={20} color="var(--mantine-color-blue-6)" /><Text size="xs" c="dimmed">Total Animales</Text></Group>
          <Text size="xl" fw={700}>{formatNumber(animales.length)}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconHeartbeat size={20} color="var(--mantine-color-green-6)" /><Text size="xs" c="dimmed">Especies</Text></Group>
          <Text size="xl" fw={700}>{especiesPresentes.length}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconWeight size={20} color="var(--mantine-color-orange-6)" /><Text size="xs" c="dimmed">En Producción</Text></Group>
          <Text size="xl" fw={700}>{formatNumber(enProduccion)}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconBabyBottle size={20} color="var(--mantine-color-pink-6)" /><Text size="xs" c="dimmed">Crías</Text></Group>
          <Text size="xl" fw={700}>{formatNumber(animales.filter(a => a.etapa === 'cria').length)}</Text>
        </Paper>
      </SimpleGrid>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="lista" leftSection={<IconPaw size={16} />}>Animales ({filtrados.length})</Tabs.Tab>
          <Tabs.Tab value="reproduccion" leftSection={<IconBabyBottle size={16} />}>Reproducción</Tabs.Tab>
          <Tabs.Tab value="salud" leftSection={<IconVaccine size={16} />}>Sanidad</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="lista" pt="md">
          <Group mb="sm">
            <Select
              label="Filtrar por especie"
              data={[
                { value: 'todas', label: 'Todas' },
                ...ESPECIES_PEQUENAS,
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
                  <Table.Th>Especie</Table.Th>
                  <Table.Th>Código</Table.Th>
                  <Table.Th>Sexo</Table.Th>
                  <Table.Th>Peso (kg)</Table.Th>
                  <Table.Th>Etapa</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtrados.map((a) => (
                  <Table.Tr key={a.id}>
                    <Table.Td>
                      <Badge size="sm" variant="light" color={
                        a.especie === 'conejo' ? 'pink' : a.especie === 'chiguiro' ? 'brown' : a.especie === 'cuy' ? 'yellow' : a.especie === 'perro' ? 'blue' : 'gray'
                      }>
                        {a.especie}
                      </Badge>
                    </Table.Td>
                    <Table.Td fw={500}>{a.codigo || a.nombre || `#${a.id}`}</Table.Td>
                    <Table.Td>{a.sexo === 'M' ? 'Macho' : 'Hembra'}</Table.Td>
                    <Table.Td>{a.peso_kg ? formatNumber(a.peso_kg) : '-'}</Table.Td>
                    <Table.Td>{a.etapa || '-'}</Table.Td>
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
                  <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center" py="sm">No hay animales registrados</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="reproduccion" pt="md">
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Paper p="md" radius="md" withBorder>
              <Group gap={8}><IconBabyBottle size={20} color="pink" /><Text size="xs" c="dimmed">Seguimiento de Camadas</Text></Group>
              <Text size="sm" mt="sm">Registrar camadas, número de crías por parto y peso al destete.</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Group gap={8}><IconWeight size={20} color="orange" /><Text size="xs" c="dimmed">Peso al Destete</Text></Group>
              <Text size="sm" mt="sm">Monitorear peso al destete para evaluar desarrollo.</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Group gap={8}><IconHeartbeat size={20} color="blue" /><Text size="xs" c="dimmed">Ciclos Reproductivos</Text></Group>
              <Text size="sm" mt="sm">
                {animales.filter(a => a.etapa === 'reproductor').length} reproductores activos
              </Text>
            </Paper>
          </SimpleGrid>
          <Paper withBorder mt="md" p="md">
            <Text size="sm" c="dimmed">
              El seguimiento detallado de reproducción se gestiona desde el módulo general de Animales, usando el sistema de eventos y pesajes.
            </Text>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="salud" pt="md">
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Paper p="md" radius="md" withBorder>
              <Group gap={8}><IconVaccine size={20} color="green" /><Text size="xs" c="dimmed">Conejos</Text></Group>
              <Text size="sm" mt="sm">Vacunación contra mixomatosis y enfermedad hemorrágica. Desparasitación periódica.</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Group gap={8}><IconHeartbeat size={20} color="brown" /><Text size="xs" c="dimmed">Chigüiros</Text></Group>
              <Text size="sm" mt="sm">Control de parásitos internos y externos. Revisión de piel y mucosas.</Text>
            </Paper>
            <Paper p="md" radius="md" withBorder>
              <Group gap={8}><IconVaccine size={20} color="yellow" /><Text size="xs" c="dimmed">Cuyes</Text></Group>
              <Text size="sm" mt="sm">Control de sarna, neumonía y deficiencia de vitamina C. Desparasitación regular.</Text>
            </Paper>
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={opened} onClose={() => { close(); setEditando(null) }} title={editando ? 'Editar Registro' : 'Nuevo Registro'} size="md">
        <Stack>
          <SimpleGrid cols={2}>
            <Select
              label="Especie"
              data={ESPECIES_PEQUENAS}
              value={form.especie}
              onChange={(v) => setForm({ ...form, especie: v })}
              required
            />
            <TextInput label="Código" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            <TextInput label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <Select
              label="Sexo"
              data={SEXOS}
              value={form.sexo}
              onChange={(v) => setForm({ ...form, sexo: v })}
              required
            />
            <TextInput label="Fecha Nacimiento" type="date" value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} />
            <NumberInput label="Peso (kg)" value={form.peso_kg} onChange={(v) => setForm({ ...form, peso_kg: v })} min={0} decimalScale={3} />
            <TextInput label="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            <Select
              label="Etapa"
              data={ETAPAS}
              value={form.etapa}
              onChange={(v) => setForm({ ...form, etapa: v })}
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
