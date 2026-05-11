import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, Stack, SimpleGrid, Text, Tabs, ActionIcon,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconEdit, IconTrash, IconBug, IconVaccine, IconWeight } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatNumber } from '../config.js'

const ESTADO_COLMENA_MAP = {
  activa: { label: 'Activa', color: 'green' },
  inactiva: { label: 'Inactiva', color: 'gray' },
  enferma: { label: 'Enferma', color: 'red' },
  enjambre: { label: 'Enjambre', color: 'orange' },
}

const TIPOS_COLMENA = [
  { value: 'langstroth', label: 'Langstroth' },
  { value: 'africana', label: 'Africana' },
  { value: 'rustica', label: 'Rústica' },
  { value: 'nucleo', label: 'Núcleo' },
]

const ORIGENES_REINA = [
  { value: 'propia', label: 'Propia' },
  { value: 'comprada', label: 'Comprada' },
  { value: 'enjambre', label: 'Enjambre' },
]

export default function Apicultura() {
  const [colmenas, setColmenas] = useState([])
  const [cosechas, setCosechas] = useState([])
  const [revisiones, setRevisiones] = useState([])
  const [activeTab, setActiveTab] = useState('colmenas')
  const [colOpened, { open: openCol, close: closeCol }] = useDisclosure(false)
  const [cosOpened, { open: openCos, close: closeCos }] = useDisclosure(false)
  const [editandoCol, setEditandoCol] = useState(null)
  const [editandoCos, setEditandoCos] = useState(null)
  const [colForm, setColForm] = useState({
    codigo: '', apiario: '', fecha_instalacion: '',
    tipo_colmena: 'langstroth', origen_reina: 'propia',
  })
  const [cosForm, setCosForm] = useState({
    colmena_id: '', fecha: new Date().toISOString().split('T')[0],
    marcos_cosechados: '', kg_miel: '', kg_cera: '', kg_polen: '', tipo_floracion: '',
  })

  const loadAll = () => {
    api.get('/colmenas/').then(r => setColmenas(r.data))
    api.get('/cosechas-miel/').then(r => setCosechas(r.data))
    api.get('/revisiones-colmenas/').then(r => setRevisiones(r.data)).catch(() => {})
  }

  useEffect(loadAll, [])

  const handleColSubmit = async () => {
    try {
      if (editandoCol) {
        await api.put(`/colmenas/${editandoCol}/`, colForm)
        notifications.show({ title: 'Colmena actualizada', color: 'green' })
      } else {
        await api.post('/colmenas/', colForm)
        notifications.show({ title: 'Colmena registrada', color: 'green' })
      }
      closeCol()
      setEditandoCol(null)
      setColForm({ codigo: '', apiario: '', fecha_instalacion: '', tipo_colmena: 'langstroth', origen_reina: 'propia' })
      loadAll()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleCosSubmit = async () => {
    try {
      const payload = {
        colmena_id: parseInt(cosForm.colmena_id),
        fecha: cosForm.fecha,
        marcos_cosechados: parseInt(cosForm.marcos_cosechados) || 0,
        kg_miel: parseFloat(cosForm.kg_miel) || 0,
        kg_cera: parseFloat(cosForm.kg_cera) || 0,
        kg_polen: parseFloat(cosForm.kg_polen) || 0,
        tipo_floracion: cosForm.tipo_floracion,
      }
      if (editandoCos) {
        await api.put(`/cosechas-miel/${editandoCos}/`, payload)
        notifications.show({ title: 'Cosecha actualizada', color: 'green' })
      } else {
        await api.post('/cosechas-miel/', payload)
        notifications.show({ title: 'Cosecha registrada', color: 'green' })
      }
      closeCos()
      setEditandoCos(null)
      setCosForm({ colmena_id: '', fecha: new Date().toISOString().split('T')[0], marcos_cosechados: '', kg_miel: '', kg_cera: '', kg_polen: '', tipo_floracion: '' })
      loadAll()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleEditCol = (c) => {
    setEditandoCol(c.id)
    setColForm({
      codigo: c.codigo || '',
      apiario: c.apiario || '',
      fecha_instalacion: c.fecha_instalacion || '',
      tipo_colmena: c.tipo_colmena || 'langstroth',
      origen_reina: c.origen_reina || 'propia',
    })
    openCol()
  }

  const handleEditCos = (c) => {
    setEditandoCos(c.id)
    setCosForm({
      colmena_id: c.colmena_id?.toString() || '',
      fecha: c.fecha || '',
      marcos_cosechados: c.marcos_cosechados?.toString() || '',
      kg_miel: c.kg_miel?.toString() || '',
      kg_cera: c.kg_cera?.toString() || '',
      kg_polen: c.kg_polen?.toString() || '',
      tipo_floracion: c.tipo_floracion || '',
    })
    openCos()
  }

  const handleDeleteCos = async (id) => {
    try {
      await api.delete(`/cosechas-miel/${id}`)
      notifications.show({ title: 'Cosecha eliminada', color: 'red' })
      loadAll()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const getColmenaLabel = (id) => {
    const c = colmenas.find(co => co.id === id)
    return c ? c.codigo || `#${id}` : `#${id}`
  }

  const hoy = new Date().toISOString().split('T')[0]
  const mesActual = hoy.slice(0, 7)
  const activas = colmenas.filter(c => c.estado === 'activa').length
  const mielMes = cosechas.filter(c => c.fecha?.startsWith(mesActual)).reduce((s, c) => s + (parseFloat(c.kg_miel) || 0), 0)
  const pendientes = colmenas.filter(c => c.estado === 'activa' && (!c.ultima_revision || c.ultima_revision < mesActual)).length
  const porRevisar = colmenas.filter(c => c.estado === 'activa' && (!c.ultima_revision)).length
    + colmenas.filter(c => c.estado === 'enferma').length

  return (
    <Stack>
      <Group>
        <IconBug size={28} />
        <Title order={2}>Apicultura</Title>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconBug size={20} color="var(--mantine-color-green-6)" /><Text size="xs" c="dimmed">Colmenas Activas</Text></Group>
          <Text size="xl" fw={700} c="green">{activas}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconWeight size={20} color="var(--mantine-color-orange-6)" /><Text size="xs" c="dimmed">Total Miel Mes</Text></Group>
          <Text size="xl" fw={700}>{formatNumber(mielMes)} kg</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconVaccine size={20} color="var(--mantine-color-yellow-6)" /><Text size="xs" c="dimmed">Cosechas Pendientes</Text></Group>
          <Text size="xl" fw={700}>{pendientes}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconVaccine size={20} color="var(--mantine-color-red-6)" /><Text size="xs" c="dimmed">Colmenas por Revisar</Text></Group>
          <Text size="xl" fw={700}>{porRevisar}</Text>
        </Paper>
      </SimpleGrid>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="colmenas" leftSection={<IconBug size={16} />}>Colmenas ({colmenas.length})</Tabs.Tab>
          <Tabs.Tab value="cosechas" leftSection={<IconWeight size={16} />}>Cosechas de Miel</Tabs.Tab>
          <Tabs.Tab value="revisiones" leftSection={<IconVaccine size={16} />}>Revisiones</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="colmenas" pt="md">
          <Stack>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Gestión de colmenas</Text>
              <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditandoCol(null); setColForm({ codigo: '', apiario: '', fecha_instalacion: '', tipo_colmena: 'langstroth', origen_reina: 'propia' }); openCol() }}>
                Nueva Colmena
              </Button>
            </Group>
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Código</Table.Th>
                    <Table.Th>Apiario</Table.Th>
                    <Table.Th>Instalación</Table.Th>
                    <Table.Th>Tipo</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th>Última Revisión</Table.Th>
                    <Table.Th>Origen Reina</Table.Th>
                    <Table.Th>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {colmenas.map(c => (
                    <Table.Tr key={c.id}>
                      <Table.Td fw={500}>{c.codigo}</Table.Td>
                      <Table.Td>{c.apiario}</Table.Td>
                      <Table.Td>{c.fecha_instalacion || '-'}</Table.Td>
                      <Table.Td><Badge variant="light" size="sm">{c.tipo_colmena}</Badge></Table.Td>
                      <Table.Td>
                        <Badge color={ESTADO_COLMENA_MAP[c.estado]?.color || 'gray'} size="sm">
                          {ESTADO_COLMENA_MAP[c.estado]?.label || c.estado}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{c.ultima_revision || '-'}</Table.Td>
                      <Table.Td>{c.origen_reina || '-'}</Table.Td>
                      <Table.Td>
                        <ActionIcon variant="light" color="blue" size="sm" onClick={() => handleEditCol(c)}><IconEdit size={14} /></ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {colmenas.length === 0 && (
                    <Table.Tr><Table.Td colSpan={8}><Text ta="center" c="dimmed" py="sm">No hay colmenas registradas</Text></Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="cosechas" pt="md">
          <Stack>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Registro de cosechas de miel</Text>
              <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditandoCos(null); setCosForm({ colmena_id: '', fecha: hoy, marcos_cosechados: '', kg_miel: '', kg_cera: '', kg_polen: '', tipo_floracion: '' }); openCos() }}>
                Nueva Cosecha
              </Button>
            </Group>
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Colmena</Table.Th>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Marcos</Table.Th>
                    <Table.Th>Kg Miel</Table.Th>
                    <Table.Th>Cera (kg)</Table.Th>
                    <Table.Th>Polen (kg)</Table.Th>
                    <Table.Th>Tipo Floración</Table.Th>
                    <Table.Th>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {cosechas.toReversed().map(c => (
                    <Table.Tr key={c.id}>
                      <Table.Td fw={500}>{getColmenaLabel(c.colmena_id)}</Table.Td>
                      <Table.Td>{c.fecha}</Table.Td>
                      <Table.Td>{formatNumber(c.marcos_cosechados)}</Table.Td>
                      <Table.Td fw={500}>{formatNumber(c.kg_miel)}</Table.Td>
                      <Table.Td>{formatNumber(c.kg_cera)}</Table.Td>
                      <Table.Td>{formatNumber(c.kg_polen || 0)}</Table.Td>
                      <Table.Td>{c.tipo_floracion || '-'}</Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <ActionIcon variant="light" color="blue" size="sm" onClick={() => handleEditCos(c)}><IconEdit size={14} /></ActionIcon>
                          <ActionIcon variant="light" color="red" size="sm" onClick={() => handleDeleteCos(c.id)}><IconTrash size={14} /></ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {cosechas.length === 0 && (
                    <Table.Tr><Table.Td colSpan={8}><Text ta="center" c="dimmed" py="sm">No hay cosechas registradas</Text></Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="revisiones" pt="md">
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Colmena</Table.Th>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Observaciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {revisiones.toReversed().map(r => (
                  <Table.Tr key={r.id}>
                    <Table.Td fw={500}>{getColmenaLabel(r.colmena_id)}</Table.Td>
                    <Table.Td>{r.fecha}</Table.Td>
                    <Table.Td>
                      <Badge color={ESTADO_COLMENA_MAP[r.estado]?.color || 'gray'} size="sm">
                        {ESTADO_COLMENA_MAP[r.estado]?.label || r.estado}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{r.observaciones || '-'}</Table.Td>
                  </Table.Tr>
                ))}
                {revisiones.length === 0 && (
                  <Table.Tr><Table.Td colSpan={4}><Text ta="center" c="dimmed" py="sm">No hay revisiones registradas</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={colOpened} onClose={() => { closeCol(); setEditandoCol(null) }} title={editandoCol ? 'Editar Colmena' : 'Nueva Colmena'} size="md">
        <Stack>
          <TextInput label="Código" placeholder="Ej: C-001" value={colForm.codigo} onChange={e => setColForm({ ...colForm, codigo: e.target.value })} required />
          <TextInput label="Apiario" placeholder="Ej: Apiario Norte" value={colForm.apiario} onChange={e => setColForm({ ...colForm, apiario: e.target.value })} required />
          <TextInput label="Fecha Instalación" type="date" value={colForm.fecha_instalacion} onChange={e => setColForm({ ...colForm, fecha_instalacion: e.target.value })} />
          <SimpleGrid cols={2}>
            <Select label="Tipo Colmena" data={TIPOS_COLMENA} value={colForm.tipo_colmena} onChange={v => setColForm({ ...colForm, tipo_colmena: v })} />
            <Select label="Origen Reina" data={ORIGENES_REINA} value={colForm.origen_reina} onChange={v => setColForm({ ...colForm, origen_reina: v })} />
          </SimpleGrid>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { closeCol(); setEditandoCol(null) }}>Cancelar</Button>
            <Button onClick={handleColSubmit}>{editandoCol ? 'Actualizar' : 'Guardar'}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={cosOpened} onClose={() => { closeCos(); setEditandoCos(null) }} title={editandoCos ? 'Editar Cosecha' : 'Nueva Cosecha'} size="md">
        <Stack>
          <Select
            label="Colmena"
            placeholder="Seleccionar..."
            data={colmenas.map(c => ({ value: c.id.toString(), label: `${c.codigo || `#${c.id}`} - ${c.apiario || ''}` }))}
            value={cosForm.colmena_id?.toString() || null}
            onChange={v => setCosForm({ ...cosForm, colmena_id: v || '' })}
            searchable
            required
          />
          <TextInput label="Fecha" type="date" value={cosForm.fecha} onChange={e => setCosForm({ ...cosForm, fecha: e.target.value })} required />
          <SimpleGrid cols={2}>
            <NumberInput label="Marcos Cosechados" value={cosForm.marcos_cosechados} onChange={v => setCosForm({ ...cosForm, marcos_cosechados: v })} min={0} />
            <NumberInput label="Kg Miel" value={cosForm.kg_miel} onChange={v => setCosForm({ ...cosForm, kg_miel: v })} min={0} decimalScale={2} />
            <NumberInput label="Kg Cera" value={cosForm.kg_cera} onChange={v => setCosForm({ ...cosForm, kg_cera: v })} min={0} decimalScale={2} />
            <NumberInput label="Kg Polen" value={cosForm.kg_polen} onChange={v => setCosForm({ ...cosForm, kg_polen: v })} min={0} decimalScale={2} />
          </SimpleGrid>
          <TextInput label="Tipo Floración" placeholder="Ej: multifloral" value={cosForm.tipo_floracion} onChange={e => setCosForm({ ...cosForm, tipo_floracion: e.target.value })} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { closeCos(); setEditandoCos(null) }}>Cancelar</Button>
            <Button onClick={handleCosSubmit}>{editandoCos ? 'Actualizar' : 'Guardar'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
