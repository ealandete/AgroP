import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, Badge, ActionIcon, Stack, SimpleGrid, Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconEdit, IconTrash, IconHeart } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatCOP } from '../config.js'

export default function Reproduccion() {
  const [data, setData] = useState([])
  const [animales, setAnimales] = useState([])
  const [opened, { open, close }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    animal_id: '', tipo_servicio: 'monta_natural', fecha_servicio: '',
    resultado: '', fecha_parto_estimada: '', observaciones: '',
  })

  const loadData = () => {
    api.get('/reproduccion/').then(r => setData(r.data))
    api.get('/animales/').then(r => setAnimales(r.data))
  }
  useEffect(loadData, [])

  const handleSubmit = async () => {
    try {
      if (editando) {
        await api.put(`/reproduccion/${editando}`, form)
        notifications.show({ title: 'Evento actualizado', color: 'green' })
      } else {
        await api.post('/reproduccion/', form)
        notifications.show({ title: 'Evento registrado', color: 'green' })
      }
      close()
      setEditando(null)
      setForm({ animal_id: '', tipo_servicio: 'monta_natural', fecha_servicio: '', resultado: '', fecha_parto_estimada: '', observaciones: '' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleEdit = (r) => {
    setEditando(r.id)
    setForm({
      animal_id: r.animal_id?.toString() || '',
      tipo_servicio: r.tipo_servicio || 'monta_natural',
      fecha_servicio: r.fecha_servicio || '',
      resultado: r.resultado || '',
      fecha_parto_estimada: r.fecha_parto_estimada || '',
      observaciones: r.observaciones || '',
    })
    open()
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/reproduccion/${id}`)
      notifications.show({ title: 'Eliminado', color: 'red' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const resultColor = (r) => {
    if (r === 'preñada') return 'green'
    if (r === 'vacia') return 'red'
    if (r === 'dudosa') return 'yellow'
    return 'gray'
  }

  const getAnimalLabel = (animalId) => {
    const a = animales.find(an => an.id === animalId)
    return a ? (a.codigo || a.nombre) : `Animal #${animalId}`
  }

  const preñadas = data.filter(r => r.resultado === 'preñada').length
  const vacias = data.filter(r => r.resultado === 'vacia').length

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Gestión de Reproducción</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setForm({ animal_id: '', tipo_servicio: 'monta_natural', fecha_servicio: '', resultado: '', fecha_parto_estimada: '', observaciones: '' }); open() }}>
          Nuevo Evento
        </Button>
      </Group>

      <SimpleGrid cols={3}>
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">Total Eventos</Text>
          <Text fw={700} size="xl">{data.length}</Text>
        </Paper>
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">Preñadas</Text>
          <Text fw={700} size="xl" c="green">{preñadas}</Text>
        </Paper>
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">Vacías</Text>
          <Text fw={700} size="xl" c="red">{vacias}</Text>
        </Paper>
      </SimpleGrid>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Animal</Table.Th>
              <Table.Th>Tipo Servicio</Table.Th>
              <Table.Th>Fecha Servicio</Table.Th>
              <Table.Th>Resultado</Table.Th>
              <Table.Th>Parto Estimado</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td fw={500}>{getAnimalLabel(r.animal_id)}</Table.Td>
                <Table.Td><Badge size="sm" variant="light">{r.tipo_servicio}</Badge></Table.Td>
                <Table.Td>{r.fecha_servicio}</Table.Td>
                <Table.Td>
                  {r.resultado ? (
                    <Badge color={resultColor(r.resultado)} size="sm">{r.resultado}</Badge>
                  ) : (
                    <Badge color="gray" size="sm">pendiente</Badge>
                  )}
                </Table.Td>
                <Table.Td>{r.fecha_parto_estimada || '-'}</Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <ActionIcon variant="light" color="blue" onClick={() => handleEdit(r)}><IconEdit size={16} /></ActionIcon>
                    <ActionIcon variant="light" color="red" onClick={() => handleDelete(r.id)}><IconTrash size={16} /></ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {data.length === 0 && (
              <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin eventos de reproducción</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title={editando ? 'Editar Evento' : 'Nuevo Evento de Reproducción'} size="md">
        <SimpleGrid cols={2}>
          <Select
            label="Animal"
            data={animales.filter(a => a.activo && a.sexo === 'H').map(a => ({ value: a.id.toString(), label: a.codigo || a.nombre }))}
            value={form.animal_id}
            onChange={v => setForm({ ...form, animal_id: v })}
            searchable
            required
          />
          <Select
            label="Tipo Servicio"
            data={[
              { value: 'monta_natural', label: 'Monta Natural' },
              { value: 'inseminacion_artificial', label: 'Inseminación Artificial' },
              { value: 'transferencia_embrion', label: 'Transferencia Embrionaria' },
            ]}
            value={form.tipo_servicio}
            onChange={v => setForm({ ...form, tipo_servicio: v })}
          />
          <TextInput
            label="Fecha Servicio"
            type="date"
            value={form.fecha_servicio}
            onChange={e => setForm({ ...form, fecha_servicio: e.target.value })}
            required
          />
          <Select
            label="Resultado"
            data={[
              { value: 'preñada', label: 'Preñada' },
              { value: 'vacia', label: 'Vacía' },
              { value: 'dudosa', label: 'Dudosa' },
            ]}
            value={form.resultado}
            onChange={v => setForm({ ...form, resultado: v })}
            clearable
          />
          <TextInput
            label="Parto Estimado"
            type="date"
            value={form.fecha_parto_estimada}
            onChange={e => setForm({ ...form, fecha_parto_estimada: e.target.value })}
          />
          <TextInput
            label="Observaciones"
            value={form.observaciones}
            onChange={e => setForm({ ...form, observaciones: e.target.value })}
          />
        </SimpleGrid>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editando ? 'Actualizar' : 'Guardar'}</Button>
        </Group>
      </Modal>
    </Stack>
  )
}
