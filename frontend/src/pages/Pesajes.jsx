import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, ActionIcon, Stack, SimpleGrid, Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconEdit, IconTrash, IconWeight, IconTrendingUp } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatNumber } from '../config.js'

export default function Pesajes() {
  const [data, setData] = useState([])
  const [animales, setAnimales] = useState([])
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [opened, { open, close }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    animal_id: '', fecha: new Date().toISOString().split('T')[0],
    peso_kg: '', condicion_corporal: '',
  })

  const loadData = () => {
    api.get('/pesajes/').then(r => setData(r.data))
    api.get('/animales/').then(r => setAnimales(r.data))
  }
  useEffect(loadData, [])

  const handleSubmit = async () => {
    try {
      if (editando) {
        await api.put(`/pesajes/${editando}`, form)
        notifications.show({ title: 'Pesaje actualizado', color: 'green' })
      } else {
        await api.post('/pesajes/', form)
        notifications.show({ title: 'Pesaje registrado', color: 'green' })
      }
      close()
      setEditando(null)
      setForm({ animal_id: '', fecha: new Date().toISOString().split('T')[0], peso_kg: '', condicion_corporal: '' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleEdit = (p) => {
    setEditando(p.id)
    setForm({
      animal_id: p.animal_id?.toString() || '',
      fecha: p.fecha || '',
      peso_kg: p.peso_kg?.toString() || '',
      condicion_corporal: p.condicion_corporal?.toString() || '',
    })
    open()
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/pesajes/${id}`)
      notifications.show({ title: 'Pesaje eliminado', color: 'red' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const getAnimalLabel = (animalId) => {
    const a = animales.find(an => an.id === animalId)
    return a ? (a.codigo || a.nombre) : `Animal #${animalId}`
  }

  const selectedData = selectedAnimal
    ? data.filter(p => p.animal_id === selectedAnimal).sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    : []

  const currentWeight = selectedData.length > 0 ? selectedData[selectedData.length - 1].peso_kg : null
  const prevWeight = selectedData.length > 1 ? selectedData[selectedData.length - 2].peso_kg : null
  const firstWeight = selectedData.length > 0 ? selectedData[0].peso_kg : null
  const weightChange = currentWeight && prevWeight ? currentWeight - prevWeight : null
  const totalGain = currentWeight && firstWeight && selectedData.length > 1 ? currentWeight - firstWeight : null

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Registro de Pesajes</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setForm({ animal_id: '', fecha: new Date().toISOString().split('T')[0], peso_kg: '', condicion_corporal: '' }); open() }}>
          Nuevo Pesaje
        </Button>
      </Group>

      <Group align="flex-end">
        <Select
          label="Filtrar por Animal"
          placeholder="Seleccionar animal..."
          data={animales.filter(a => a.activo).map(a => ({ value: a.id.toString(), label: a.codigo || a.nombre }))}
          value={selectedAnimal?.toString() || null}
          onChange={v => setSelectedAnimal(v ? parseInt(v) : null)}
          searchable
          clearable
          style={{ width: 300 }}
        />
      </Group>

      {selectedAnimal && currentWeight && (
        <SimpleGrid cols={4}>
          <Paper withBorder p="md">
            <Text size="xs" c="dimmed">Peso Actual</Text>
            <Text fw={700} size="xl">{formatNumber(currentWeight)} kg</Text>
          </Paper>
          <Paper withBorder p="md">
            <Text size="xs" c="dimmed">Peso Anterior</Text>
            <Text fw={700} size="xl">{prevWeight ? `${formatNumber(prevWeight)} kg` : '-'}</Text>
          </Paper>
          <Paper withBorder p="md">
            <Text size="xs" c="dimmed">Último Cambio</Text>
            <Text fw={700} size="xl" c={weightChange > 0 ? 'green' : weightChange < 0 ? 'red' : undefined}>
              {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${formatNumber(weightChange)} kg` : '-'}
            </Text>
          </Paper>
          <Paper withBorder p="md">
            <Text size="xs" c="dimmed">Ganancia Total</Text>
            <Text fw={700} size="xl" c={totalGain > 0 ? 'green' : totalGain < 0 ? 'red' : undefined}>
              {totalGain !== null ? `${totalGain > 0 ? '+' : ''}${formatNumber(totalGain)} kg` : '-'}
            </Text>
          </Paper>
        </SimpleGrid>
      )}

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Animal</Table.Th>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Peso (kg)</Table.Th>
              <Table.Th>Cond. Corporal</Table.Th>
              <Table.Th>Ganancia Diaria</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((p, idx) => {
              const animalPesajes = data
                .filter(x => x.animal_id === p.animal_id)
                .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
              const currentIdx = animalPesajes.findIndex(x => x.id === p.id)
              const prev = currentIdx > 0 ? animalPesajes[currentIdx - 1] : null
              const days = prev ? Math.round((new Date(p.fecha) - new Date(prev.fecha)) / (1000 * 60 * 60 * 24)) : null
              const dailyGain = days && days > 0 && prev.peso_kg ? (p.peso_kg - prev.peso_kg) / days : null

              return (
                <Table.Tr key={p.id}>
                  <Table.Td fw={500}>{getAnimalLabel(p.animal_id)}</Table.Td>
                  <Table.Td>{p.fecha}</Table.Td>
                  <Table.Td>{formatNumber(p.peso_kg)}</Table.Td>
                  <Table.Td>{p.condicion_corporal != null ? formatNumber(p.condicion_corporal) : '-'}</Table.Td>
                  <Table.Td>
                    {dailyGain !== null ? (
                      <Text c={dailyGain >= 0 ? 'green' : 'red'} span>
                        {dailyGain > 0 ? '+' : ''}{formatNumber(dailyGain)} kg/día
                      </Text>
                    ) : '-'}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <ActionIcon variant="light" color="blue" onClick={() => handleEdit(p)}><IconEdit size={16} /></ActionIcon>
                      <ActionIcon variant="light" color="red" onClick={() => handleDelete(p.id)}><IconTrash size={16} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )
            })}
            {data.length === 0 && (
              <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin pesajes registrados</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title={editando ? 'Editar Pesaje' : 'Nuevo Pesaje'} size="md">
        <SimpleGrid cols={2}>
          <Select
            label="Animal"
            data={animales.filter(a => a.activo).map(a => ({ value: a.id.toString(), label: a.codigo || a.nombre }))}
            value={form.animal_id}
            onChange={v => setForm({ ...form, animal_id: v })}
            searchable
            required
          />
          <TextInput label="Fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required />
          <NumberInput label="Peso (kg)" value={form.peso_kg} onChange={v => setForm({ ...form, peso_kg: v })} required min={0} step={0.1} />
          <NumberInput label="Condición Corporal (1-5)" value={form.condicion_corporal} onChange={v => setForm({ ...form, condicion_corporal: v })} min={1} max={5} step={0.5} />
        </SimpleGrid>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editando ? 'Actualizar' : 'Guardar'}</Button>
        </Group>
      </Modal>
    </Stack>
  )
}
