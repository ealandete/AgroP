import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, ActionIcon, Stack, SimpleGrid, Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconEdit, IconTrash, IconStethoscope, IconAlertTriangle } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatCOP } from '../config.js'

export default function Sanidad() {
  const [data, setData] = useState([])
  const [animales, setAnimales] = useState([])
  const [opened, { open, close }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    animal_id: '', fecha: new Date().toISOString().split('T')[0],
    tipo_evento: 'vacunacion', diagnostico: '', producto: '',
    veterinario: '', costo: '', fecha_proximo: '',
  })

  const loadData = () => {
    api.get('/sanidad/').then(r => setData(r.data))
    api.get('/animales/').then(r => setAnimales(r.data))
  }
  useEffect(loadData, [])

  const handleSubmit = async () => {
    try {
      if (editando) {
        await api.put(`/sanidad/${editando}`, form)
        notifications.show({ title: 'Evento sanitario actualizado', color: 'green' })
      } else {
        await api.post('/sanidad/', form)
        notifications.show({ title: 'Evento sanitario registrado', color: 'green' })
      }
      close()
      setEditando(null)
      setForm({ animal_id: '', fecha: new Date().toISOString().split('T')[0], tipo_evento: 'vacunacion', diagnostico: '', producto: '', veterinario: '', costo: '', fecha_proximo: '' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleEdit = (s) => {
    setEditando(s.id)
    setForm({
      animal_id: s.animal_id?.toString() || '',
      fecha: s.fecha || '',
      tipo_evento: s.tipo_evento || 'vacunacion',
      diagnostico: s.diagnostico || '',
      producto: s.producto || '',
      veterinario: s.veterinario || '',
      costo: s.costo?.toString() || '',
      fecha_proximo: s.fecha_proximo || '',
    })
    open()
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/sanidad/${id}`)
      notifications.show({ title: 'Evento eliminado', color: 'red' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const typeColors = {
    vacunacion: 'blue',
    desparasitacion: 'green',
    revision: 'orange',
    tratamiento: 'red',
    cirugia: 'violet',
    examen: 'cyan',
  }

  const isOverdue = (fecha) => {
    if (!fecha) return false
    return new Date(fecha) < new Date()
  }

  const getAnimalLabel = (animalId) => {
    const a = animales.find(an => an.id === animalId)
    return a ? (a.codigo || a.nombre) : `Animal #${animalId}`
  }

  const pendientes = data.filter(s => s.fecha_proximo && isOverdue(s.fecha_proximo)).length
  const totalCosto = data.reduce((sum, s) => sum + (parseFloat(s.costo) || 0), 0)

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Gestión Sanitaria</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setForm({ animal_id: '', fecha: new Date().toISOString().split('T')[0], tipo_evento: 'vacunacion', diagnostico: '', producto: '', veterinario: '', costo: '', fecha_proximo: '' }); open() }}>
          Nuevo Evento
        </Button>
      </Group>

      <SimpleGrid cols={3}>
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">Eventos Registrados</Text>
          <Text fw={700} size="xl">{data.length}</Text>
        </Paper>
        <Paper withBorder p="md">
          <Group><IconAlertTriangle size={18} color="red" /><Text size="xs" c="dimmed">Controles Pendientes</Text></Group>
          <Text fw={700} size="xl" c={pendientes > 0 ? 'red' : undefined}>{pendientes}</Text>
        </Paper>
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">Costo Total</Text>
          <Text fw={700} size="xl">{formatCOP(totalCosto)}</Text>
        </Paper>
      </SimpleGrid>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Animal</Table.Th>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Diagnóstico</Table.Th>
              <Table.Th>Producto</Table.Th>
              <Table.Th>Veterinario</Table.Th>
              <Table.Th>Costo</Table.Th>
              <Table.Th>Próximo Control</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((s) => (
              <Table.Tr key={s.id} bg={isOverdue(s.fecha_proximo) ? 'red.0' : undefined}>
                <Table.Td fw={500}>{getAnimalLabel(s.animal_id)}</Table.Td>
                <Table.Td>{s.fecha}</Table.Td>
                <Table.Td><Badge color={typeColors[s.tipo_evento] || 'gray'} size="sm">{s.tipo_evento}</Badge></Table.Td>
                <Table.Td>{s.diagnostico || '-'}</Table.Td>
                <Table.Td>{s.producto || '-'}</Table.Td>
                <Table.Td>{s.veterinario || '-'}</Table.Td>
                <Table.Td>{s.costo ? formatCOP(s.costo) : '-'}</Table.Td>
                <Table.Td>
                  {s.fecha_proximo ? (
                    <Badge color={isOverdue(s.fecha_proximo) ? 'red' : 'green'} size="sm">
                      {s.fecha_proximo}
                    </Badge>
                  ) : '-'}
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <ActionIcon variant="light" color="blue" onClick={() => handleEdit(s)}><IconEdit size={16} /></ActionIcon>
                    <ActionIcon variant="light" color="red" onClick={() => handleDelete(s.id)}><IconTrash size={16} /></ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {data.length === 0 && (
              <Table.Tr><Table.Td colSpan={9}><Text c="dimmed" ta="center">Sin eventos sanitarios registrados</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title={editando ? 'Editar Evento Sanitario' : 'Nuevo Evento Sanitario'} size="lg">
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
            label="Tipo Evento"
            data={[
              { value: 'vacunacion', label: 'Vacunación' },
              { value: 'desparasitacion', label: 'Desparasitación' },
              { value: 'revision', label: 'Revisión' },
              { value: 'tratamiento', label: 'Tratamiento' },
              { value: 'cirugia', label: 'Cirugía' },
              { value: 'examen', label: 'Examen' },
            ]}
            value={form.tipo_evento}
            onChange={v => setForm({ ...form, tipo_evento: v })}
          />
          <TextInput label="Fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required />
          <TextInput label="Próximo Control" type="date" value={form.fecha_proximo} onChange={e => setForm({ ...form, fecha_proximo: e.target.value })} />
          <TextInput label="Diagnóstico" value={form.diagnostico} onChange={e => setForm({ ...form, diagnostico: e.target.value })} />
          <TextInput label="Producto" value={form.producto} onChange={e => setForm({ ...form, producto: e.target.value })} />
          <TextInput label="Veterinario" value={form.veterinario} onChange={e => setForm({ ...form, veterinario: e.target.value })} />
          <NumberInput label="Costo" value={form.costo} onChange={v => setForm({ ...form, costo: v })} prefix="$ " min={0} />
        </SimpleGrid>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editando ? 'Actualizar' : 'Guardar'}</Button>
        </Group>
      </Modal>
    </Stack>
  )
}
