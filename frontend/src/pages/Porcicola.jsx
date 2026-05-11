import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, ActionIcon, Stack, Tabs,
  SimpleGrid, Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconEdit, IconTrash, IconPig, IconWeight, IconHeart, IconBabyBottle } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatNumber } from '../config.js'

export default function Porcicola() {
  const [camadas, setCamadas] = useState([])
  const [engorde, setEngorde] = useState([])
  const [madres, setMadres] = useState([])
  const [lotes, setLotes] = useState([])
  const [cerdas, setCerdas] = useState([])
  const [activeTab, setActiveTab] = useState('engorde')
  const [camadaOpened, { open: openCamada, close: closeCamada }] = useDisclosure(false)
  const [engordeOpened, { open: openEngorde, close: closeEngorde }] = useDisclosure(false)
  const [editandoCamada, setEditandoCamada] = useState(null)
  const [editandoEngorde, setEditandoEngorde] = useState(null)
  const [camadaForm, setCamadaForm] = useState({
    madre_id: '', fecha_parto: '',
    lechones_vivos: '', lechones_muertos: '', lechones_momias: '',
    peso_promedio_kg: '', fecha_destete: '',
  })
  const [engordeForm, setEngordeForm] = useState({
    lote_id: '', codigo_lote: '', fecha_inicio: '',
    cantidad_inicial: '', peso_inicial_promedio: '',
  })

  const loadCamadas = () => {
    api.get('/camadas/').then(r => setCamadas(r.data))
  }

  const loadEngorde = () => {
    api.get('/engorde-porcino/').then(r => setEngorde(r.data))
  }

  const loadSelects = () => {
    api.get('/animales/?especie=porcino').then(r => {
      setCerdas(r.data)
      setMadres(r.data.filter(a => a.sexo === 'H'))
    })
    api.get('/lotes/').then(r => setLotes(r.data))
  }

  useEffect(() => {
    loadCamadas()
    loadEngorde()
    loadSelects()
  }, [])

  const handleSubmitCamada = async () => {
    try {
      const payload = {
        ...camadaForm,
        madre_id: parseInt(camadaForm.madre_id),
        lechones_vivos: parseInt(camadaForm.lechones_vivos) || 0,
        lechones_muertos: parseInt(camadaForm.lechones_muertos) || 0,
        lechones_momias: parseInt(camadaForm.lechones_momias) || 0,
        peso_promedio_kg: parseFloat(camadaForm.peso_promedio_kg) || 0,
      }
      if (editandoCamada) {
        await api.put(`/camadas/${editandoCamada}/`, payload)
        notifications.show({ title: 'Camada actualizada', color: 'green' })
      } else {
        await api.post('/camadas/', payload)
        notifications.show({ title: 'Camada registrada', color: 'green' })
      }
      closeCamada()
      setEditandoCamada(null)
      setCamadaForm({ madre_id: '', fecha_parto: '', lechones_vivos: '', lechones_muertos: '', lechones_momias: '', peso_promedio_kg: '', fecha_destete: '' })
      loadCamadas()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleSubmitEngorde = async () => {
    try {
      const payload = {
        ...engordeForm,
        lote_id: parseInt(engordeForm.lote_id),
        cantidad_inicial: parseInt(engordeForm.cantidad_inicial),
        peso_inicial_promedio: parseFloat(engordeForm.peso_inicial_promedio) || 0,
      }
      if (editandoEngorde) {
        await api.put(`/engorde-porcino/${editandoEngorde}/`, payload)
        notifications.show({ title: 'Engorde actualizado', color: 'green' })
      } else {
        await api.post('/engorde-porcino/', payload)
        notifications.show({ title: 'Engorde registrado', color: 'green' })
      }
      closeEngorde()
      setEditandoEngorde(null)
      setEngordeForm({ lote_id: '', codigo_lote: '', fecha_inicio: '', cantidad_inicial: '', peso_inicial_promedio: '' })
      loadEngorde()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleEditCamada = (c) => {
    setEditandoCamada(c.id)
    setCamadaForm({
      madre_id: c.madre_id?.toString() || '',
      fecha_parto: c.fecha_parto || '',
      lechones_vivos: c.lechones_vivos?.toString() || '',
      lechones_muertos: c.lechones_muertos?.toString() || '',
      lechones_momias: c.lechones_momias?.toString() || '',
      peso_promedio_kg: c.peso_promedio_kg?.toString() || '',
      fecha_destete: c.fecha_destete || '',
    })
    openCamada()
  }

  const handleEditEngorde = (e) => {
    setEditandoEngorde(e.id)
    setEngordeForm({
      lote_id: e.lote_id?.toString() || '',
      codigo_lote: e.codigo_lote || '',
      fecha_inicio: e.fecha_inicio || '',
      cantidad_inicial: e.cantidad_inicial?.toString() || '',
      peso_inicial_promedio: e.peso_inicial_promedio?.toString() || '',
    })
    openEngorde()
  }

  const handleDeleteCamada = async (id) => {
    try {
      await api.delete(`/camadas/${id}`)
      notifications.show({ title: 'Camada eliminada', color: 'red' })
      loadCamadas()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleDeleteEngorde = async (id) => {
    try {
      await api.delete(`/engorde-porcino/${id}`)
      notifications.show({ title: 'Engorde eliminado', color: 'red' })
      loadEngorde()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const getCerdaLabel = (madreId) => {
    const c = cerdas.find(a => a.id === madreId)
    return c ? (c.codigo || c.nombre) : `#${madreId}`
  }

  const getLoteLabel = (loteId) => {
    const l = lotes.find(a => a.id === loteId)
    return l ? (l.codigo || l.nombre) : `#${loteId}`
  }

  const hoy = new Date().toISOString().split('T')[0]
  const mesActual = hoy.slice(0, 7)
  const totalCerdos = cerdas.length + engorde.reduce((s, e) => s + (parseInt(e.cantidad_actual || e.cantidad_inicial) || 0), 0)
  const camadasActivas = camadas.filter(c => !c.fecha_destete || c.fecha_destete > hoy).length
  const engordeActivo = engorde.filter(e => e.estado === 'activo').length
  const destetadosMes = camadas.filter(c => c.fecha_destete?.startsWith(mesActual)).reduce((s, c) => s + (parseInt(c.lechones_destetados || c.lechones_vivos) || 0), 0)

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>
          <IconPig size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Gestión Porcícola
        </Title>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconPig size={20} color="var(--mantine-color-blue-6)" /><Text size="xs" c="dimmed">Total Cerdos</Text></Group>
          <Text size="xl" fw={700}>{formatNumber(totalCerdos)}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconBabyBottle size={20} color="var(--mantine-color-pink-6)" /><Text size="xs" c="dimmed">Camadas Activas</Text></Group>
          <Text size="xl" fw={700}>{camadasActivas}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconWeight size={20} color="var(--mantine-color-orange-6)" /><Text size="xs" c="dimmed">Engorde Activo</Text></Group>
          <Text size="xl" fw={700}>{engordeActivo}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconHeart size={20} color="var(--mantine-color-green-6)" /><Text size="xs" c="dimmed">Destetados Mes</Text></Group>
          <Text size="xl" fw={700}>{formatNumber(destetadosMes)}</Text>
        </Paper>
      </SimpleGrid>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="engorde" leftSection={<IconWeight size={16} />}>Engorde ({engordeActivo})</Tabs.Tab>
          <Tabs.Tab value="camadas" leftSection={<IconBabyBottle size={16} />}>Camadas ({camadas.length})</Tabs.Tab>
          <Tabs.Tab value="reproduccion" leftSection={<IconHeart size={16} />}>Reproducción</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="engorde" pt="md">
          <Stack>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Lotes de engorde porcino</Text>
              <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditandoEngorde(null); setEngordeForm({ lote_id: '', codigo_lote: '', fecha_inicio: '', cantidad_inicial: '', peso_inicial_promedio: '' }); openEngorde() }}>
                Nuevo Engorde
              </Button>
            </Group>
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Código Lote</Table.Th>
                    <Table.Th>Fecha Inicio</Table.Th>
                    <Table.Th>Cant. Inicial</Table.Th>
                    <Table.Th>Cant. Actual</Table.Th>
                    <Table.Th>Peso Prom. (kg)</Table.Th>
                    <Table.Th>Ganancia Diaria (g)</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {engorde.map((e) => (
                    <Table.Tr key={e.id}>
                      <Table.Td fw={500}>{e.codigo_lote}</Table.Td>
                      <Table.Td>{e.fecha_inicio}</Table.Td>
                      <Table.Td>{formatNumber(e.cantidad_inicial)}</Table.Td>
                      <Table.Td>{formatNumber(e.cantidad_actual ?? e.cantidad_inicial)}</Table.Td>
                      <Table.Td>{formatNumber(e.peso_inicial_promedio)}</Table.Td>
                      <Table.Td>{e.ganancia_diaria_g ? formatNumber(e.ganancia_diaria_g) : '-'}</Table.Td>
                      <Table.Td>
                        <Badge color={e.estado === 'activo' ? 'green' : 'blue'} size="sm">{e.estado}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <ActionIcon variant="light" color="blue" size="sm" onClick={() => handleEditEngorde(e)}><IconEdit size={14} /></ActionIcon>
                          <ActionIcon variant="light" color="red" size="sm" onClick={() => handleDeleteEngorde(e.id)}><IconTrash size={14} /></ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {engorde.length === 0 && (
                    <Table.Tr><Table.Td colSpan={8}><Text c="dimmed" ta="center" py="sm">Sin lotes de engorde</Text></Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="camadas" pt="md">
          <Stack>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Registro de camadas</Text>
              <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditandoCamada(null); setCamadaForm({ madre_id: '', fecha_parto: '', lechones_vivos: '', lechones_muertos: '', lechones_momias: '', peso_promedio_kg: '', fecha_destete: '' }); openCamada() }}>
                Nueva Camada
              </Button>
            </Group>
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Madre</Table.Th>
                    <Table.Th>Fecha Parto</Table.Th>
                    <Table.Th>Vivos</Table.Th>
                    <Table.Th>Muertos</Table.Th>
                    <Table.Th>Momias</Table.Th>
                    <Table.Th>Peso Prom. (kg)</Table.Th>
                    <Table.Th>Destete</Table.Th>
                    <Table.Th>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {camadas.map((c) => (
                    <Table.Tr key={c.id}>
                      <Table.Td fw={500}>{getCerdaLabel(c.madre_id)}</Table.Td>
                      <Table.Td>{c.fecha_parto}</Table.Td>
                      <Table.Td>{formatNumber(c.lechones_vivos)}</Table.Td>
                      <Table.Td c="red">{formatNumber(c.lechones_muertos)}</Table.Td>
                      <Table.Td>{formatNumber(c.lechones_momias)}</Table.Td>
                      <Table.Td>{formatNumber(c.peso_promedio_kg)}</Table.Td>
                      <Table.Td>{c.fecha_destete || '-'}</Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <ActionIcon variant="light" color="blue" size="sm" onClick={() => handleEditCamada(c)}><IconEdit size={14} /></ActionIcon>
                          <ActionIcon variant="light" color="red" size="sm" onClick={() => handleDeleteCamada(c.id)}><IconTrash size={14} /></ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {camadas.length === 0 && (
                    <Table.Tr><Table.Td colSpan={8}><Text c="dimmed" ta="center" py="sm">Sin camadas registradas</Text></Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="reproduccion" pt="md">
          <SimpleGrid cols={{ base: 2, sm: 3 }}>
            <Paper withBorder p="md">
              <Group><IconHeart size={20} color="#E91E63" /><Text size="xs" c="dimmed">Total Cerdas</Text></Group>
              <Text fw={700} size="xl">{madres.length}</Text>
            </Paper>
            <Paper withBorder p="md">
              <Group><IconBabyBottle size={20} color="#4CAF50" /><Text size="xs" c="dimmed">Total Camadas</Text></Group>
              <Text fw={700} size="xl">{camadas.length}</Text>
            </Paper>
            <Paper withBorder p="md">
              <Group><IconPig size={20} color="#2196F3" /><Text size="xs" c="dimmed">Total Lechones Nacidos</Text></Group>
              <Text fw={700} size="xl">{formatNumber(camadas.reduce((s, c) => s + (parseInt(c.lechones_vivos) || 0), 0))}</Text>
            </Paper>
            <Paper withBorder p="md">
              <Group><IconHeart size={20} color="#FF9800" /><Text size="xs" c="dimmed">Prom. Vivos / Camada</Text></Group>
              <Text fw={700} size="xl">
                {camadas.length > 0 ? formatNumber(camadas.reduce((s, c) => s + (parseInt(c.lechones_vivos) || 0), 0) / camadas.length) : '-'}
              </Text>
            </Paper>
            <Paper withBorder p="md">
              <Group><IconHeart size={20} color="#9C27B0" /><Text size="xs" c="dimmed">Cerdas con Camada</Text></Group>
              <Text fw={700} size="xl">{new Set(camadas.map(c => c.madre_id)).size}</Text>
            </Paper>
            <Paper withBorder p="md">
              <Group><IconWeight size={20} color="#00BCD4" /><Text size="xs" c="dimmed">Peso Prom. Nacimiento (kg)</Text></Group>
              <Text fw={700} size="xl">
                {camadas.length > 0 ? formatNumber(camadas.reduce((s, c) => s + (parseFloat(c.peso_promedio_kg) || 0), 0) / camadas.length) : '-'}
              </Text>
            </Paper>
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={camadaOpened} onClose={() => { closeCamada(); setEditandoCamada(null) }} title={editandoCamada ? 'Editar Camada' : 'Nueva Camada'} size="md">
        <Stack>
          <Select
            label="Madre"
            data={madres.map(a => ({ value: a.id.toString(), label: a.codigo || a.nombre || `#${a.id}` }))}
            value={camadaForm.madre_id}
            onChange={v => setCamadaForm({ ...camadaForm, madre_id: v })}
            searchable
            required
          />
          <TextInput label="Fecha Parto" type="date" value={camadaForm.fecha_parto} onChange={e => setCamadaForm({ ...camadaForm, fecha_parto: e.target.value })} required />
          <SimpleGrid cols={2}>
            <NumberInput label="Lechones Vivos" value={camadaForm.lechones_vivos} onChange={v => setCamadaForm({ ...camadaForm, lechones_vivos: v })} min={0} />
            <NumberInput label="Lechones Muertos" value={camadaForm.lechones_muertos} onChange={v => setCamadaForm({ ...camadaForm, lechones_muertos: v })} min={0} />
            <NumberInput label="Lechones Momias" value={camadaForm.lechones_momias} onChange={v => setCamadaForm({ ...camadaForm, lechones_momias: v })} min={0} />
            <NumberInput label="Peso Promedio (kg)" value={camadaForm.peso_promedio_kg} onChange={v => setCamadaForm({ ...camadaForm, peso_promedio_kg: v })} min={0} decimalScale={2} />
          </SimpleGrid>
          <TextInput label="Fecha Destete" type="date" value={camadaForm.fecha_destete} onChange={e => setCamadaForm({ ...camadaForm, fecha_destete: e.target.value })} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { closeCamada(); setEditandoCamada(null) }}>Cancelar</Button>
            <Button onClick={handleSubmitCamada}>{editandoCamada ? 'Actualizar' : 'Guardar'}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={engordeOpened} onClose={() => { closeEngorde(); setEditandoEngorde(null) }} title={editandoEngorde ? 'Editar Engorde' : 'Nuevo Engorde'} size="md">
        <Stack>
          <SimpleGrid cols={2}>
            <Select
              label="Lote"
              data={lotes.map(l => ({ value: l.id.toString(), label: l.codigo || l.nombre }))}
              value={engordeForm.lote_id}
              onChange={v => setEngordeForm({ ...engordeForm, lote_id: v })}
              searchable
              required
            />
            <TextInput label="Código Lote" value={engordeForm.codigo_lote} onChange={e => setEngordeForm({ ...engordeForm, codigo_lote: e.target.value })} required />
            <TextInput label="Fecha Inicio" type="date" value={engordeForm.fecha_inicio} onChange={e => setEngordeForm({ ...engordeForm, fecha_inicio: e.target.value })} required />
            <NumberInput label="Cantidad Inicial" value={engordeForm.cantidad_inicial} onChange={v => setEngordeForm({ ...engordeForm, cantidad_inicial: v })} min={1} required />
            <NumberInput label="Peso Inicial Prom. (kg)" value={engordeForm.peso_inicial_promedio} onChange={v => setEngordeForm({ ...engordeForm, peso_inicial_promedio: v })} min={0} decimalScale={2} />
          </SimpleGrid>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { closeEngorde(); setEditandoEngorde(null) }}>Cancelar</Button>
            <Button onClick={handleSubmitEngorde}>{editandoEngorde ? 'Actualizar' : 'Guardar'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
