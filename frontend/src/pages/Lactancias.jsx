import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, ActionIcon, Stack, SimpleGrid, Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconEdit, IconTrash, IconMilk, IconChartLine } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatCOP, formatNumber } from '../config.js'

export default function Lactancias() {
  const [data, setData] = useState([])
  const [animales, setAnimales] = useState([])
  const [ordeños, setOrdenos] = useState([])
  const [lactanciaSel, setLactanciaSel] = useState(null)
  const [opened, { open, close }] = useDisclosure(false)
  const [ordenioOpened, { open: openOrd, close: closeOrd }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    animal_id: '', fecha_inicio: '', fecha_fin: '',
    promedio_diario: '', produccion_total: '', pico_produccion: '',
    estado: 'activa',
  })
  const [formOrdenio, setFormOrdenio] = useState({
    fecha: new Date().toISOString().split('T')[0],
    litros_am: '', litros_pm: '',
  })

  const loadData = () => {
    api.get('/lactancias/').then(r => setData(r.data))
    api.get('/animales/').then(r => setAnimales(r.data))
  }
  useEffect(loadData, [])

  const loadOrdenos = (lactanciaId) => {
    api.get(`/lactancias/${lactanciaId}/ordenos`).then(r => setOrdenos(r.data))
  }

  const handleSubmit = async () => {
    try {
      if (editando) {
        await api.put(`/lactancias/${editando}`, form)
        notifications.show({ title: 'Lactancia actualizada', color: 'green' })
      } else {
        await api.post('/lactancias/', form)
        notifications.show({ title: 'Lactancia registrada', color: 'green' })
      }
      close()
      setEditando(null)
      setForm({ animal_id: '', fecha_inicio: '', fecha_fin: '', promedio_diario: '', produccion_total: '', pico_produccion: '', estado: 'activa' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleSubmitOrdenio = async () => {
    if (!lactanciaSel) return
    try {
      await api.post(`/lactancias/${lactanciaSel.id}/ordenos`, {
        ...formOrdenio,
        litros_total: (parseFloat(formOrdenio.litros_am) || 0) + (parseFloat(formOrdenio.litros_pm) || 0),
      })
      notifications.show({ title: 'Ordeño registrado', color: 'green' })
      closeOrd()
      setFormOrdenio({ fecha: new Date().toISOString().split('T')[0], litros_am: '', litros_pm: '' })
      loadOrdenos(lactanciaSel.id)
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleEdit = (l) => {
    setEditando(l.id)
    setForm({
      animal_id: l.animal_id?.toString() || '',
      fecha_inicio: l.fecha_inicio || '',
      fecha_fin: l.fecha_fin || '',
      promedio_diario: l.promedio_diario?.toString() || '',
      produccion_total: l.produccion_total?.toString() || '',
      pico_produccion: l.pico_produccion?.toString() || '',
      estado: l.estado || 'activa',
    })
    open()
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/lactancias/${id}`)
      notifications.show({ title: 'Lactancia eliminada', color: 'red' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const verOrdenos = (l) => {
    setLactanciaSel(l)
    loadOrdenos(l.id)
  }

  const getAnimalLabel = (animalId) => {
    const a = animales.find(an => an.id === animalId)
    return a ? (a.codigo || a.nombre) : `Animal #${animalId}`
  }

  const activas = data.filter(l => l.estado === 'activa').length
  const totalProduccion = data.reduce((sum, l) => sum + (parseFloat(l.produccion_total) || 0), 0)
  const promDiario = data.length > 0 ? data.reduce((sum, l) => sum + (parseFloat(l.promedio_diario) || 0), 0) / data.length : 0

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Gestión de Lactancias</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setForm({ animal_id: '', fecha_inicio: '', fecha_fin: '', promedio_diario: '', produccion_total: '', pico_produccion: '', estado: 'activa' }); open() }}>
          Nueva Lactancia
        </Button>
      </Group>

      <SimpleGrid cols={3}>
        <Paper withBorder p="md">
          <Group><IconMilk size={20} color="#2196F3" /><Text size="xs" c="dimmed">Lactancias Activas</Text></Group>
          <Text fw={700} size="xl">{activas}</Text>
        </Paper>
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">Producción Total</Text>
          <Text fw={700} size="xl">{formatNumber(totalProduccion)} L</Text>
        </Paper>
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">Promedio Diario Gral.</Text>
          <Text fw={700} size="xl">{formatNumber(promDiario)} L</Text>
        </Paper>
      </SimpleGrid>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Animal</Table.Th>
              <Table.Th>Inicio</Table.Th>
              <Table.Th>Prom. Diario (L)</Table.Th>
              <Table.Th>Prod. Total (L)</Table.Th>
              <Table.Th>Pico Prod. (L)</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((l) => (
              <Table.Tr key={l.id}>
                <Table.Td fw={500}>{getAnimalLabel(l.animal_id)}</Table.Td>
                <Table.Td>{l.fecha_inicio}</Table.Td>
                <Table.Td>{formatNumber(l.promedio_diario)}</Table.Td>
                <Table.Td>{formatNumber(l.produccion_total)}</Table.Td>
                <Table.Td>{formatNumber(l.pico_produccion)}</Table.Td>
                <Table.Td>
                  <Badge color={l.estado === 'activa' ? 'green' : l.estado === 'finalizada' ? 'blue' : 'gray'} size="sm">
                    {l.estado}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <ActionIcon variant="light" color="blue" onClick={() => handleEdit(l)}><IconEdit size={16} /></ActionIcon>
                    <ActionIcon variant="light" color="cyan" onClick={() => verOrdenos(l)}><IconMilk size={16} /></ActionIcon>
                    <ActionIcon variant="light" color="red" onClick={() => handleDelete(l.id)}><IconTrash size={16} /></ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {data.length === 0 && (
              <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center">Sin lactancias registradas</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {lactanciaSel && (
        <Paper withBorder p="md">
          <Group justify="space-between" mb="sm">
            <Title order={5}>
              <IconMilk size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Ordeños: {getAnimalLabel(lactanciaSel.animal_id)}
            </Title>
            <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => { setFormOrdenio({ fecha: new Date().toISOString().split('T')[0], litros_am: '', litros_pm: '' }); openOrd() }}>
              Registrar Ordeño
            </Button>
          </Group>

          <SimpleGrid cols={3} mb="md">
            <Paper withBorder p="xs">
              <Text size="xs" c="dimmed">Total Ordeños</Text>
              <Text fw={700}>{ordeños.length}</Text>
            </Paper>
            <Paper withBorder p="xs">
              <Text size="xs" c="dimmed">Promedio (L/día)</Text>
              <Text fw={700}>
                {ordeños.length > 0 ? formatNumber(ordeños.reduce((s, o) => s + (parseFloat(o.litros_total) || (parseFloat(o.litros_am) || 0) + (parseFloat(o.litros_pm) || 0)), 0) / ordeños.length) : '-'}
              </Text>
            </Paper>
            <Paper withBorder p="xs">
              <Text size="xs" c="dimmed">Total Acumulado (L)</Text>
              <Text fw={700}>{formatNumber(ordeños.reduce((s, o) => s + (parseFloat(o.litros_total) || (parseFloat(o.litros_am) || 0) + (parseFloat(o.litros_pm) || 0)), 0))}</Text>
            </Paper>
          </SimpleGrid>

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Litros AM</Table.Th>
                <Table.Th>Litros PM</Table.Th>
                <Table.Th>Total (L)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {ordeños.map((o) => (
                <Table.Tr key={o.id}>
                  <Table.Td>{o.fecha}</Table.Td>
                  <Table.Td>{formatNumber(o.litros_am)}</Table.Td>
                  <Table.Td>{formatNumber(o.litros_pm)}</Table.Td>
                  <Table.Td fw={500}>{formatNumber(o.litros_total || (parseFloat(o.litros_am) || 0) + (parseFloat(o.litros_pm) || 0))}</Table.Td>
                </Table.Tr>
              ))}
              {ordeños.length === 0 && (
                <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center">Sin ordeños registrados</Text></Table.Td></Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      <Modal opened={opened} onClose={close} title={editando ? 'Editar Lactancia' : 'Nueva Lactancia'} size="md">
        <SimpleGrid cols={2}>
          <Select
            label="Animal"
            data={animales.filter(a => a.activo).map(a => ({ value: a.id.toString(), label: a.codigo || a.nombre }))}
            value={form.animal_id}
            onChange={v => setForm({ ...form, animal_id: v })}
            searchable
            required
          />
          <Select
            label="Estado"
            data={[
              { value: 'activa', label: 'Activa' },
              { value: 'finalizada', label: 'Finalizada' },
              { value: 'secado', label: 'Secado' },
            ]}
            value={form.estado}
            onChange={v => setForm({ ...form, estado: v })}
          />
          <TextInput label="Fecha Inicio" type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} required />
          <TextInput label="Fecha Fin" type="date" value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} />
          <NumberInput label="Promedio Diario (L)" value={form.promedio_diario} onChange={v => setForm({ ...form, promedio_diario: v })} min={0} step={0.1} />
          <NumberInput label="Producción Total (L)" value={form.produccion_total} onChange={v => setForm({ ...form, produccion_total: v })} min={0} step={0.1} />
          <NumberInput label="Pico Producción (L)" value={form.pico_produccion} onChange={v => setForm({ ...form, pico_produccion: v })} min={0} step={0.1} />
        </SimpleGrid>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editando ? 'Actualizar' : 'Guardar'}</Button>
        </Group>
      </Modal>

      <Modal opened={ordenioOpened} onClose={closeOrd} title="Registrar Ordeño" size="sm">
        <Stack>
          <TextInput label="Fecha" type="date" value={formOrdenio.fecha} onChange={e => setFormOrdenio({ ...formOrdenio, fecha: e.target.value })} required />
          <NumberInput label="Litros AM" value={formOrdenio.litros_am} onChange={v => setFormOrdenio({ ...formOrdenio, litros_am: v })} min={0} step={0.1} />
          <NumberInput label="Litros PM" value={formOrdenio.litros_pm} onChange={v => setFormOrdenio({ ...formOrdenio, litros_pm: v })} min={0} step={0.1} />
        </Stack>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={closeOrd}>Cancelar</Button>
          <Button onClick={handleSubmitOrdenio}>Guardar</Button>
        </Group>
      </Modal>
    </Stack>
  )
}
