import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, ActionIcon, Stack, Tabs,
  SimpleGrid, Text, Menu,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconHeart, IconMilk, IconWeight, IconStethoscope,
  IconBread, IconArrowsExchange, IconPlus, IconEdit,
  IconTrash, IconCalendar,
} from '@tabler/icons-react'
import api from '../services/api.js'
import { formatCOP, formatNumber } from '../config.js'

function TabReproduccion() {
  const [data, setData] = useState([])
  const [animales, setAnimales] = useState([])
  const [opened, { open, close }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    animal_id: '', tipo_servicio: 'monta_natural', fecha_servicio: '',
    resultado: '', fecha_parto_estimada: '',
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
        notifications.show({ title: 'Registro actualizado', color: 'green' })
      } else {
        await api.post('/reproduccion/', form)
        notifications.show({ title: 'Registro creado', color: 'green' })
      }
      close()
      setEditando(null)
      setForm({ animal_id: '', tipo_servicio: 'monta_natural', fecha_servicio: '', resultado: '', fecha_parto_estimada: '' })
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
    })
    open()
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/reproduccion/${id}`)
      notifications.show({ title: 'Registro eliminado', color: 'red' })
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

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Eventos de Reproducción</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setForm({ animal_id: '', tipo_servicio: 'monta_natural', fecha_servicio: '', resultado: '', fecha_parto_estimada: '' }); open() }}>
          Nuevo
        </Button>
      </Group>

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
                <Table.Td fw={500}>
                  {animales.find(a => a.id === r.animal_id)?.codigo || animales.find(a => a.id === r.animal_id)?.nombre || `#${r.animal_id}`}
                </Table.Td>
                <Table.Td><Badge size="sm" variant="light">{r.tipo_servicio}</Badge></Table.Td>
                <Table.Td>{r.fecha_servicio}</Table.Td>
                <Table.Td>
                  {r.resultado ? <Badge color={resultColor(r.resultado)} size="sm">{r.resultado}</Badge> : '-'}
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
              <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin registros</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title={editando ? 'Editar Registro' : 'Nuevo Registro'} size="md">
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
        </SimpleGrid>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editando ? 'Actualizar' : 'Guardar'}</Button>
        </Group>
      </Modal>
    </Stack>
  )
}

function TabLactancias() {
  const [data, setData] = useState([])
  const [animales, setAnimales] = useState([])
  const [ordeños, setOrdenos] = useState([])
  const [lactanciaSel, setLactanciaSel] = useState(null)
  const [opened, { open, close }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    animal_id: '', fecha_inicio: '', fecha_fin: '',
    promedio_diario: '', produccion_total: '', pico_produccion: '',
    estado: 'activa',
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
        notifications.show({ title: 'Lactancia creada', color: 'green' })
      }
      close()
      setEditando(null)
      setForm({ animal_id: '', fecha_inicio: '', fecha_fin: '', promedio_diario: '', produccion_total: '', pico_produccion: '', estado: 'activa' })
      loadData()
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

  const verOrdenos = (l) => {
    setLactanciaSel(l)
    loadOrdenos(l.id)
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Lactancias</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setForm({ animal_id: '', fecha_inicio: '', fecha_fin: '', promedio_diario: '', produccion_total: '', pico_produccion: '', estado: 'activa' }); open() }}>
          Nueva
        </Button>
      </Group>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Animal</Table.Th>
              <Table.Th>Inicio</Table.Th>
              <Table.Th>Prom. Diario (L)</Table.Th>
              <Table.Th>Total (L)</Table.Th>
              <Table.Th>Pico (L)</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((l) => (
              <Table.Tr key={l.id}>
                <Table.Td fw={500}>
                  {animales.find(a => a.id === l.animal_id)?.codigo || animales.find(a => a.id === l.animal_id)?.nombre || `#${l.animal_id}`}
                </Table.Td>
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
          <Title order={5} mb="sm">Ordeños de {animales.find(a => a.id === lactanciaSel.animal_id)?.codigo || `#${lactanciaSel.animal_id}`}</Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Litros AM</Table.Th>
                <Table.Th>Litros PM</Table.Th>
                <Table.Th>Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {ordeños.map((o) => (
                <Table.Tr key={o.id}>
                  <Table.Td>{o.fecha}</Table.Td>
                  <Table.Td>{formatNumber(o.litros_am)}</Table.Td>
                  <Table.Td>{formatNumber(o.litros_pm)}</Table.Td>
                  <Table.Td fw={500}>{formatNumber(o.litros_total || (o.litros_am || 0) + (o.litros_pm || 0))}</Table.Td>
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
          <NumberInput label="Promedio Diario (L)" value={form.promedio_diario} onChange={v => setForm({ ...form, promedio_diario: v })} />
          <NumberInput label="Producción Total (L)" value={form.produccion_total} onChange={v => setForm({ ...form, produccion_total: v })} />
          <NumberInput label="Pico Producción (L)" value={form.pico_produccion} onChange={v => setForm({ ...form, pico_produccion: v })} />
        </SimpleGrid>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editando ? 'Actualizar' : 'Guardar'}</Button>
        </Group>
      </Modal>
    </Stack>
  )
}

function TabPesajes() {
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

  const selectedData = selectedAnimal ? data.filter(p => p.animal_id === selectedAnimal) : []
  const currentWeight = selectedData.length > 0 ? selectedData[selectedData.length - 1].peso_kg : null
  const prevWeight = selectedData.length > 1 ? selectedData[selectedData.length - 2].peso_kg : null
  const weightChange = currentWeight && prevWeight ? currentWeight - prevWeight : null

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Pesajes</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setForm({ animal_id: '', fecha: new Date().toISOString().split('T')[0], peso_kg: '', condicion_corporal: '' }); open() }}>
          Nuevo Pesaje
        </Button>
      </Group>

      <Group align="flex-end">
        <Select
          label="Filtrar por Animal"
          data={animales.filter(a => a.activo).map(a => ({ value: a.id.toString(), label: a.codigo || a.nombre }))}
          value={selectedAnimal?.toString()}
          onChange={v => setSelectedAnimal(v ? parseInt(v) : null)}
          searchable
          clearable
          style={{ width: 300 }}
        />
      </Group>

      {selectedAnimal && currentWeight && (
        <SimpleGrid cols={3}>
          <Paper withBorder p="md">
            <Text size="xs" c="dimmed">Peso Actual</Text>
            <Text fw={700} size="xl">{formatNumber(currentWeight)} kg</Text>
          </Paper>
          <Paper withBorder p="md">
            <Text size="xs" c="dimmed">Peso Anterior</Text>
            <Text fw={700} size="xl">{prevWeight ? `${formatNumber(prevWeight)} kg` : '-'}</Text>
          </Paper>
          <Paper withBorder p="md">
            <Text size="xs" c="dimmed">Cambio</Text>
            <Text fw={700} size="xl" c={weightChange > 0 ? 'green' : weightChange < 0 ? 'red' : undefined}>
              {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${formatNumber(weightChange)} kg` : '-'}
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
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td fw={500}>
                  {animales.find(a => a.id === p.animal_id)?.codigo || animales.find(a => a.id === p.animal_id)?.nombre || `#${p.animal_id}`}
                </Table.Td>
                <Table.Td>{p.fecha}</Table.Td>
                <Table.Td>{formatNumber(p.peso_kg)}</Table.Td>
                <Table.Td>{p.condicion_corporal != null ? formatNumber(p.condicion_corporal) : '-'}</Table.Td>
                <Table.Td>
                  <ActionIcon variant="light" color="blue" onClick={() => handleEdit(p)}><IconEdit size={16} /></ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
            {data.length === 0 && (
              <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center">Sin pesajes registrados</Text></Table.Td></Table.Tr>
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
          <NumberInput label="Peso (kg)" value={form.peso_kg} onChange={v => setForm({ ...form, peso_kg: v })} required min={0} />
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

function TabSanidad() {
  const [data, setData] = useState([])
  const [animales, setAnimales] = useState([])
  const [opened, { open, close }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    animal_id: '', fecha: new Date().toISOString().split('T')[0], tipo_evento: 'vacunacion',
    diagnostico: '', producto: '', veterinario: '', costo: '',
    fecha_proximo: '',
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
        notifications.show({ title: 'Evento actualizado', color: 'green' })
      } else {
        await api.post('/sanidad/', form)
        notifications.show({ title: 'Evento registrado', color: 'green' })
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

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Eventos Sanitarios</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setForm({ animal_id: '', fecha: new Date().toISOString().split('T')[0], tipo_evento: 'vacunacion', diagnostico: '', producto: '', veterinario: '', costo: '', fecha_proximo: '' }); open() }}>
          Nuevo Evento
        </Button>
      </Group>

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
              <Table.Th>Próx. Control</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((s) => (
              <Table.Tr key={s.id} bg={isOverdue(s.fecha_proximo) ? 'red.0' : undefined}>
                <Table.Td fw={500}>
                  {animales.find(a => a.id === s.animal_id)?.codigo || animales.find(a => a.id === s.animal_id)?.nombre || `#${s.animal_id}`}
                </Table.Td>
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
                  <ActionIcon variant="light" color="blue" onClick={() => handleEdit(s)}><IconEdit size={16} /></ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
            {data.length === 0 && (
              <Table.Tr><Table.Td colSpan={9}><Text c="dimmed" ta="center">Sin eventos registrados</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title={editando ? 'Editar Evento' : 'Nuevo Evento'} size="lg">
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

function TabAlimentacion() {
  const [data, setData] = useState([])
  const [animales, setAnimales] = useState([])
  const [opened, { open, close }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    animal_id: '', lote_id: '', fecha: new Date().toISOString().split('T')[0],
    tipo_alimento: 'concentrado', cantidad_kg: '', costo: '',
    observaciones: '',
  })

  const loadData = () => {
    api.get('/alimentacion/').then(r => setData(r.data))
    api.get('/animales/').then(r => setAnimales(r.data))
  }
  useEffect(loadData, [])

  const handleSubmit = async () => {
    try {
      if (editando) {
        await api.put(`/alimentacion/${editando}`, form)
        notifications.show({ title: 'Registro actualizado', color: 'green' })
      } else {
        await api.post('/alimentacion/', form)
        notifications.show({ title: 'Registro creado', color: 'green' })
      }
      close()
      setEditando(null)
      setForm({ animal_id: '', lote_id: '', fecha: new Date().toISOString().split('T')[0], tipo_alimento: 'concentrado', cantidad_kg: '', costo: '', observaciones: '' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleEdit = (a) => {
    setEditando(a.id)
    setForm({
      animal_id: a.animal_id?.toString() || '',
      lote_id: a.lote_id?.toString() || '',
      fecha: a.fecha || '',
      tipo_alimento: a.tipo_alimento || 'concentrado',
      cantidad_kg: a.cantidad_kg?.toString() || '',
      costo: a.costo?.toString() || '',
      observaciones: a.observaciones || '',
    })
    open()
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Alimentación</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setForm({ animal_id: '', lote_id: '', fecha: new Date().toISOString().split('T')[0], tipo_alimento: 'concentrado', cantidad_kg: '', costo: '', observaciones: '' }); open() }}>
          Nuevo
        </Button>
      </Group>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Animal/Lote</Table.Th>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Tipo Alimento</Table.Th>
              <Table.Th>Cantidad (kg)</Table.Th>
              <Table.Th>Costo</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((a) => (
              <Table.Tr key={a.id}>
                <Table.Td fw={500}>
                  {a.animal_id ? animales.find(an => an.id === a.animal_id)?.codigo || `#${a.animal_id}` : a.lote_id ? `Lote #${a.lote_id}` : '-'}
                </Table.Td>
                <Table.Td>{a.fecha}</Table.Td>
                <Table.Td><Badge size="sm" variant="light">{a.tipo_alimento}</Badge></Table.Td>
                <Table.Td>{formatNumber(a.cantidad_kg)}</Table.Td>
                <Table.Td>{a.costo ? formatCOP(a.costo) : '-'}</Table.Td>
                <Table.Td>
                  <ActionIcon variant="light" color="blue" onClick={() => handleEdit(a)}><IconEdit size={16} /></ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
            {data.length === 0 && (
              <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin registros</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title={editando ? 'Editar Registro' : 'Nuevo Registro'} size="md">
        <SimpleGrid cols={2}>
          <Select
            label="Animal"
            data={animales.filter(a => a.activo).map(a => ({ value: a.id.toString(), label: a.codigo || a.nombre }))}
            value={form.animal_id}
            onChange={v => setForm({ ...form, animal_id: v, lote_id: '' })}
            searchable
            clearable
          />
          <TextInput label="Fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required />
          <Select
            label="Tipo Alimento"
            data={[
              { value: 'concentrado', label: 'Concentrado' },
              { value: 'forraje', label: 'Forraje' },
              { value: 'heno', label: 'Heno' },
              { value: 'ensilaje', label: 'Ensilaje' },
              { value: 'suplemento', label: 'Suplemento' },
              { value: 'sal_mineral', label: 'Sal Mineral' },
            ]}
            value={form.tipo_alimento}
            onChange={v => setForm({ ...form, tipo_alimento: v })}
          />
          <NumberInput label="Cantidad (kg)" value={form.cantidad_kg} onChange={v => setForm({ ...form, cantidad_kg: v })} required min={0} />
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

function TabMovimientos() {
  const [data, setData] = useState([])
  const [animales, setAnimales] = useState([])
  const [opened, { open, close }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    animal_id: '', tipo_movimiento: 'compra', fecha: new Date().toISOString().split('T')[0],
    lote_origen_id: '', lote_destino_id: '', motivo: '', valor: '',
  })

  const loadData = () => {
    api.get('/movimientos/').then(r => setData(r.data))
    api.get('/animales/').then(r => setAnimales(r.data))
  }
  useEffect(loadData, [])

  const handleSubmit = async () => {
    try {
      if (editando) {
        await api.put(`/movimientos/${editando}`, form)
        notifications.show({ title: 'Movimiento actualizado', color: 'green' })
      } else {
        await api.post('/movimientos/', form)
        notifications.show({ title: 'Movimiento creado', color: 'green' })
      }
      close()
      setEditando(null)
      setForm({ animal_id: '', tipo_movimiento: 'compra', fecha: new Date().toISOString().split('T')[0], lote_origen_id: '', lote_destino_id: '', motivo: '', valor: '' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleEdit = (m) => {
    setEditando(m.id)
    setForm({
      animal_id: m.animal_id?.toString() || '',
      tipo_movimiento: m.tipo_movimiento || 'compra',
      fecha: m.fecha || '',
      lote_origen_id: m.lote_origen_id?.toString() || '',
      lote_destino_id: m.lote_destino_id?.toString() || '',
      motivo: m.motivo || '',
      valor: m.valor?.toString() || '',
    })
    open()
  }

  const movColors = {
    compra: 'green', venta: 'blue', traslado: 'orange',
    muerte: 'red', nacimiento: 'cyan', alta: 'violet', baja: 'gray',
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Movimientos</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setForm({ animal_id: '', tipo_movimiento: 'compra', fecha: new Date().toISOString().split('T')[0], lote_origen_id: '', lote_destino_id: '', motivo: '', valor: '' }); open() }}>
          Nuevo
        </Button>
      </Group>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Animal</Table.Th>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Motivo</Table.Th>
              <Table.Th>Valor</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((m) => (
              <Table.Tr key={m.id}>
                <Table.Td fw={500}>
                  {animales.find(a => a.id === m.animal_id)?.codigo || `#${m.animal_id}`}
                </Table.Td>
                <Table.Td><Badge color={movColors[m.tipo_movimiento] || 'gray'} size="sm">{m.tipo_movimiento}</Badge></Table.Td>
                <Table.Td>{m.fecha}</Table.Td>
                <Table.Td>{m.motivo || '-'}</Table.Td>
                <Table.Td>{m.valor ? formatCOP(m.valor) : '-'}</Table.Td>
                <Table.Td>
                  <ActionIcon variant="light" color="blue" onClick={() => handleEdit(m)}><IconEdit size={16} /></ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
            {data.length === 0 && (
              <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin movimientos</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title={editando ? 'Editar Movimiento' : 'Nuevo Movimiento'} size="md">
        <SimpleGrid cols={2}>
          <Select
            label="Animal"
            data={animales.map(a => ({ value: a.id.toString(), label: a.codigo || a.nombre }))}
            value={form.animal_id}
            onChange={v => setForm({ ...form, animal_id: v })}
            searchable
            required
          />
          <Select
            label="Tipo Movimiento"
            data={[
              { value: 'compra', label: 'Compra' },
              { value: 'venta', label: 'Venta' },
              { value: 'traslado', label: 'Traslado' },
              { value: 'muerte', label: 'Muerte' },
              { value: 'nacimiento', label: 'Nacimiento' },
              { value: 'alta', label: 'Alta' },
              { value: 'baja', label: 'Baja' },
            ]}
            value={form.tipo_movimiento}
            onChange={v => setForm({ ...form, tipo_movimiento: v })}
          />
          <TextInput label="Fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required />
          <NumberInput label="Valor" value={form.valor} onChange={v => setForm({ ...form, valor: v })} prefix="$ " min={0} />
          <TextInput label="Motivo" value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} />
        </SimpleGrid>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editando ? 'Actualizar' : 'Guardar'}</Button>
        </Group>
      </Modal>
    </Stack>
  )
}

export default function Operaciones() {
  const [stats, setStats] = useState({
    reproduccion: 0,
    lactancias_activas: 0,
    ultimo_pesaje: '',
    eventos_pendientes: 0,
  })

  useEffect(() => {
    api.get('/reproduccion/?limit=1').then(r => setStats(s => ({ ...s, reproduccion: r.data.length > 0 ? r.data.length : 0 }))).catch(() => {})
    api.get('/lactancias/?estado=activa').then(r => setStats(s => ({ ...s, lactancias_activas: r.data.length }))).catch(() => {})
    api.get('/pesajes/').then(r => {
      if (r.data.length > 0) setStats(s => ({ ...s, ultimo_pesaje: r.data[r.data.length - 1].fecha }))
    }).catch(() => {})
    api.get('/sanidad/').then(r => {
      const pendientes = r.data.filter(s => s.fecha_proximo && new Date(s.fecha_proximo) < new Date()).length
      setStats(s => ({ ...s, eventos_pendientes: pendientes }))
    }).catch(() => {})
  }, [])

  return (
    <Stack>
      <Title order={3}>Centro de Operaciones</Title>

      <SimpleGrid cols={4}>
        <Paper withBorder p="md">
          <Group>
            <IconHeart size={24} color="#E91E63" />
            <div>
              <Text size="xs" c="dimmed">En Reproducción</Text>
              <Text fw={700}>{stats.reproduccion} animales</Text>
            </div>
          </Group>
        </Paper>
        <Paper withBorder p="md">
          <Group>
            <IconMilk size={24} color="#2196F3" />
            <div>
              <Text size="xs" c="dimmed">Lactancias Activas</Text>
              <Text fw={700}>{stats.lactancias_activas}</Text>
            </div>
          </Group>
        </Paper>
        <Paper withBorder p="md">
          <Group>
            <IconWeight size={24} color="#FF9800" />
            <div>
              <Text size="xs" c="dimmed">Último Pesaje</Text>
              <Text fw={700}>{stats.ultimo_pesaje || 'N/A'}</Text>
            </div>
          </Group>
        </Paper>
        <Paper withBorder p="md">
          <Group>
            <IconStethoscope size={24} color="red" />
            <div>
              <Text size="xs" c="dimmed">Controles Pendientes</Text>
              <Text fw={700} c={stats.eventos_pendientes > 0 ? 'red' : undefined}>{stats.eventos_pendientes}</Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      <Tabs defaultValue="reproduccion">
        <Tabs.List>
          <Tabs.Tab value="reproduccion" leftSection={<IconHeart size={16} />}>Reproducción</Tabs.Tab>
          <Tabs.Tab value="lactancias" leftSection={<IconMilk size={16} />}>Lactancias</Tabs.Tab>
          <Tabs.Tab value="pesajes" leftSection={<IconWeight size={16} />}>Pesajes</Tabs.Tab>
          <Tabs.Tab value="sanidad" leftSection={<IconStethoscope size={16} />}>Sanidad</Tabs.Tab>
          <Tabs.Tab value="alimentacion" leftSection={<IconBread size={16} />}>Alimentación</Tabs.Tab>
          <Tabs.Tab value="movimientos" leftSection={<IconArrowsExchange size={16} />}>Movimientos</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="reproduccion" pt="md"><TabReproduccion /></Tabs.Panel>
        <Tabs.Panel value="lactancias" pt="md"><TabLactancias /></Tabs.Panel>
        <Tabs.Panel value="pesajes" pt="md"><TabPesajes /></Tabs.Panel>
        <Tabs.Panel value="sanidad" pt="md"><TabSanidad /></Tabs.Panel>
        <Tabs.Panel value="alimentacion" pt="md"><TabAlimentacion /></Tabs.Panel>
        <Tabs.Panel value="movimientos" pt="md"><TabMovimientos /></Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
