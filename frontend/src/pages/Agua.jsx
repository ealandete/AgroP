import { useEffect, useState, useCallback } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, Stack, SimpleGrid, Text, ActionIcon,
  Tabs, Textarea,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconDroplet, IconChartBar, IconFlask, IconAlertTriangle,
  IconPlus, IconEdit, IconMapPin,
} from '@tabler/icons-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import dayjs from 'dayjs'
import api from '../services/api.js'

const TIPOS_FUENTE = [
  { value: 'rio', label: 'Río', color: 'blue' },
  { value: 'pozo', label: 'Pozo', color: 'cyan' },
  { value: 'nacimiento', label: 'Nacimiento', color: 'green' },
  { value: 'embalse', label: 'Embalse', color: 'indigo' },
  { value: 'acueducto', label: 'Acueducto', color: 'teal' },
  { value: 'otro', label: 'Otro', color: 'gray' },
]

const TIPOS_USO = [
  { value: 'riego', label: 'Riego', color: 'blue' },
  { value: 'animal', label: 'Animal', color: 'orange' },
  { value: 'domestico', label: 'Doméstico', color: 'green' },
  { value: 'limpieza', label: 'Limpieza', color: 'cyan' },
  { value: 'otro', label: 'Otro', color: 'gray' },
]

function TabFuentes({ fuentes, lotes, onEdit, onNew }) {
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Fuentes de Agua</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={onNew}>Nueva Fuente</Button>
      </Group>
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Caudal (lps)</Table.Th>
              <Table.Th>Profundidad</Table.Th>
              <Table.Th>Coordenadas</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th style={{ width: 80 }}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {fuentes.map(f => {
              const tipo = TIPOS_FUENTE.find(t => t.value === f.tipo)
              return (
                <Table.Tr key={f.id}>
                  <Table.Td fw={500}>{f.nombre}</Table.Td>
                  <Table.Td><Badge color={tipo?.color || 'gray'} size="sm" variant="light">{tipo?.label || f.tipo}</Badge></Table.Td>
                  <Table.Td>{f.caudal_lps != null ? f.caudal_lps : '-'}</Table.Td>
                  <Table.Td>{f.profundidad_m != null ? `${f.profundidad_m} m` : '-'}</Table.Td>
                  <Table.Td>
                    {f.coordenadas ? (
                      <Group gap={4}>
                        <IconMapPin size={14} />
                        <Text size="sm">{f.coordenadas.lat?.toFixed(4) || '-'}, {f.coordenadas.lng?.toFixed(4) || '-'}</Text>
                      </Group>
                    ) : '-'}
                  </Table.Td>
                  <Table.Td><Badge color={f.activo ? 'green' : 'gray'} size="sm">{f.activo ? 'Activo' : 'Inactivo'}</Badge></Table.Td>
                  <Table.Td>
                    <ActionIcon variant="light" color="blue" size="sm" onClick={() => onEdit(f)}><IconEdit size={14} /></ActionIcon>
                  </Table.Td>
                </Table.Tr>
              )
            })}
            {fuentes.length === 0 && (
              <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center">Sin fuentes registradas</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}

function TabConsumo({ consumos, onNew }) {
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Consumo de Agua</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={onNew}>Registrar Consumo</Button>
      </Group>
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Fuente</Table.Th>
              <Table.Th>Cantidad (m³)</Table.Th>
              <Table.Th>Uso</Table.Th>
              <Table.Th>Lote</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {consumos.map(c => {
              const uso = TIPOS_USO.find(u => u.value === c.tipo_uso)
              return (
                <Table.Tr key={c.id}>
                  <Table.Td>{dayjs(c.fecha).format('DD/MM/YYYY')}</Table.Td>
                  <Table.Td fw={500}>{c.fuente_nombre || `#${c.fuente_id}`}</Table.Td>
                  <Table.Td>{c.cantidad_m3}</Table.Td>
                  <Table.Td><Badge color={uso?.color || 'gray'} size="sm" variant="light">{uso?.label || c.tipo_uso}</Badge></Table.Td>
                  <Table.Td>{c.lote_nombre || '-'}</Table.Td>
                </Table.Tr>
              )
            })}
            {consumos.length === 0 && (
              <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center">Sin consumos registrados</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}

function TabCalidad({ calidades, onNew }) {
  const getPhColor = (ph) => {
    if (ph == null) return 'gray'
    if (ph < 6.0 || ph > 8.5) return 'red'
    if (ph < 6.5 || ph > 8.0) return 'orange'
    return 'green'
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Calidad del Agua</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={onNew}>Nuevo Test</Button>
      </Group>
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Fuente</Table.Th>
              <Table.Th>pH</Table.Th>
              <Table.Th>Turbiedad (NTU)</Table.Th>
              <Table.Th>Coliformes</Table.Th>
              <Table.Th>Conductividad</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {calidades.map(c => (
              <Table.Tr key={c.id}>
                <Table.Td>{dayjs(c.fecha).format('DD/MM/YYYY')}</Table.Td>
                <Table.Td fw={500}>{c.fuente_nombre || `#${c.fuente_id}`}</Table.Td>
                <Table.Td>
                  <Badge color={getPhColor(c.ph)} size="sm">{c.ph != null ? c.ph : '-'}</Badge>
                </Table.Td>
                <Table.Td>{c.turbiedad_ntu != null ? c.turbiedad_ntu : '-'}</Table.Td>
                <Table.Td>{c.coliformes != null ? c.coliformes : '-'}</Table.Td>
                <Table.Td>{c.conductividad != null ? c.conductividad : '-'}</Table.Td>
              </Table.Tr>
            ))}
            {calidades.length === 0 && (
              <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin tests de calidad</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}

export default function Agua() {
  const [fuentes, setFuentes] = useState([])
  const [consumos, setConsumos] = useState([])
  const [calidades, setCalidades] = useState([])
  const [lotes, setLotes] = useState([])
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(false)

  const [fuenteModal, { open: openFuente, close: closeFuente }] = useDisclosure(false)
  const [consumoModal, { open: openConsumo, close: closeConsumo }] = useDisclosure(false)
  const [calidadModal, { open: openCalidad, close: closeCalidad }] = useDisclosure(false)
  const [editandoFuente, setEditandoFuente] = useState(null)
  const [fuenteForm, setFuenteForm] = useState({
    finca_id: '', nombre: '', tipo: 'rio', caudal_lps: '', profundidad_m: '',
    coordenadas: null, activo: true,
  })
  const [consumoForm, setConsumoForm] = useState({
    fuente_id: '', fecha: new Date().toISOString().split('T')[0],
    cantidad_m3: '', tipo_uso: 'riego', lote_id: '', observaciones: '',
  })
  const [calidadForm, setCalidadForm] = useState({
    fuente_id: '', fecha: new Date().toISOString().split('T')[0],
    ph: '', turbiedad_ntu: '', coliformes: '', conductividad: '', observaciones: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [fR, cR, qR, lR, rR] = await Promise.all([
        api.get('/agua/fuentes/'),
        api.get('/agua/consumo/'),
        api.get('/agua/calidad/'),
        api.get('/lotes/').catch(() => ({ data: [] })),
        api.get('/agua/resumen'),
      ])
      setFuentes(Array.isArray(fR.data) ? fR.data : [])
      setConsumos(Array.isArray(cR.data) ? cR.data : [])
      setCalidades(Array.isArray(qR.data) ? qR.data : [])
      setLotes(Array.isArray(lR.data) ? lR.data : [])
      setResumen(rR.data)
    } catch { setFuentes([]); setConsumos([]); setCalidades([]); setLotes([]) }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const fincaId = () => localStorage.getItem('agrop_finca_id') || ''

  const resetFuenteForm = () => setFuenteForm({
    finca_id: fincaId(), nombre: '', tipo: 'rio', caudal_lps: '',
    profundidad_m: '', coordenadas: null, activo: true,
  })

  const handleSaveFuente = async () => {
    if (!fuenteForm.nombre?.trim()) {
      notifications.show({ title: 'El nombre es obligatorio', color: 'yellow' })
      return
    }
    try {
      const payload = {
        ...fuenteForm,
        finca_id: parseInt(fuenteForm.finca_id || fincaId()),
        caudal_lps: fuenteForm.caudal_lps ? parseFloat(fuenteForm.caudal_lps) : null,
        profundidad_m: fuenteForm.profundidad_m ? parseFloat(fuenteForm.profundidad_m) : null,
      }
      if (editandoFuente) {
        await api.put(`/agua/fuentes/${editandoFuente}`, payload)
        notifications.show({ title: 'Fuente actualizada', color: 'green' })
      } else {
        await api.post('/agua/fuentes/', payload)
        notifications.show({ title: 'Fuente creada', color: 'green' })
      }
      closeFuente()
      setEditandoFuente(null)
      resetFuenteForm()
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleEditFuente = (f) => {
    setEditandoFuente(f.id)
    setFuenteForm({
      finca_id: f.finca_id?.toString() || fincaId(),
      nombre: f.nombre || '',
      tipo: f.tipo || 'rio',
      caudal_lps: f.caudal_lps?.toString() || '',
      profundidad_m: f.profundidad_m?.toString() || '',
      coordenadas: f.coordenadas || null,
      activo: f.activo !== false,
    })
    openFuente()
  }

  const handleSaveConsumo = async () => {
    if (!consumoForm.fuente_id || !consumoForm.cantidad_m3) {
      notifications.show({ title: 'Fuente y cantidad son obligatorios', color: 'yellow' })
      return
    }
    try {
      await api.post('/agua/consumo/', {
        ...consumoForm,
        fuente_id: parseInt(consumoForm.fuente_id),
        cantidad_m3: parseFloat(consumoForm.cantidad_m3),
        lote_id: consumoForm.lote_id ? parseInt(consumoForm.lote_id) : null,
      })
      notifications.show({ title: 'Consumo registrado', color: 'green' })
      closeConsumo()
      setConsumoForm({
        fuente_id: '', fecha: new Date().toISOString().split('T')[0],
        cantidad_m3: '', tipo_uso: 'riego', lote_id: '', observaciones: '',
      })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleSaveCalidad = async () => {
    if (!calidadForm.fuente_id) {
      notifications.show({ title: 'Selecciona una fuente', color: 'yellow' })
      return
    }
    try {
      await api.post('/agua/calidad/', {
        ...calidadForm,
        fuente_id: parseInt(calidadForm.fuente_id),
        ph: calidadForm.ph ? parseFloat(calidadForm.ph) : null,
        turbiedad_ntu: calidadForm.turbiedad_ntu ? parseFloat(calidadForm.turbiedad_ntu) : null,
        coliformes: calidadForm.coliformes ? parseInt(calidadForm.coliformes) : null,
        conductividad: calidadForm.conductividad ? parseFloat(calidadForm.conductividad) : null,
      })
      notifications.show({ title: 'Test de calidad registrado', color: 'green' })
      closeCalidad()
      setCalidadForm({
        fuente_id: '', fecha: new Date().toISOString().split('T')[0],
        ph: '', turbiedad_ntu: '', coliformes: '', conductividad: '', observaciones: '',
      })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const consumosMes = consumos.filter(c => dayjs(c.fecha).isSame(dayjs(), 'month'))
  const totalConsumoMes = consumosMes.reduce((s, c) => s + (c.cantidad_m3 || 0), 0)
  const consumoChartData = Array.from({ length: dayjs().daysInMonth() }, (_, i) => {
    const d = i + 1
    const dia = dayjs().date(d)
    const diaConsumos = consumosMes.filter(c => dayjs(c.fecha).date() === d)
    return {
      dia: dia.format('DD'),
      m3: diaConsumos.reduce((s, c) => s + (c.cantidad_m3 || 0), 0),
    }
  })

  return (
    <Stack>
      <Title order={3}>Gestión de Agua</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Paper p="md" radius="md" withBorder>
          <Group><IconDroplet size={28} color="var(--mantine-color-blue-6)" />
            <div><Text size="xs" c="dimmed">Fuentes Activas</Text>
              <Text size="xl" fw={700}>{resumen?.fuentes_activas ?? fuentes.filter(f => f.activo).length}</Text></div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconChartBar size={28} color="var(--mantine-color-cyan-6)" />
            <div><Text size="xs" c="dimmed">Consumo del Mes (m³)</Text>
              <Text size="xl" fw={700}>{totalConsumoMes.toFixed(1)}</Text></div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconFlask size={28} color="var(--mantine-color-green-6)" />
            <div><Text size="xs" c="dimmed">Último Test Calidad</Text>
              <Text size="xl" fw={700}>{resumen?.calidad_ultimo_test ? `pH ${resumen.calidad_ultimo_test.ph || '?'}` : 'N/A'}</Text>
              {resumen?.calidad_ultimo_test?.fecha && (
                <Text size="xs" c="dimmed">{dayjs(resumen.calidad_ultimo_test.fecha).format('DD/MM/YYYY')}</Text>
              )}
            </div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconAlertTriangle size={28} color="var(--mantine-color-red-6)" />
            <div><Text size="xs" c="dimmed">Alertas</Text>
              <Text size="xl" fw={700} c="red">{resumen?.alertas ?? 0}</Text></div>
          </Group>
        </Paper>
      </SimpleGrid>

      <Paper p="md" radius="md" withBorder>
        <Text fw={600} mb="sm">Consumo Diario del Mes (m³)</Text>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={consumoChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Bar dataKey="m3" fill="var(--mantine-color-cyan-6)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      <Tabs defaultValue="fuentes">
        <Tabs.List>
          <Tabs.Tab value="fuentes" leftSection={<IconDroplet size={16} />}>Fuentes</Tabs.Tab>
          <Tabs.Tab value="consumo" leftSection={<IconChartBar size={16} />}>Consumo</Tabs.Tab>
          <Tabs.Tab value="calidad" leftSection={<IconFlask size={16} />}>Calidad</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="fuentes" pt="md">
          <TabFuentes fuentes={fuentes} lotes={lotes}
            onNew={() => { setEditandoFuente(null); resetFuenteForm(); openFuente() }}
            onEdit={handleEditFuente}
          />
        </Tabs.Panel>
        <Tabs.Panel value="consumo" pt="md">
          <TabConsumo consumos={consumos}
            onNew={() => { setConsumoForm({ ...consumoForm, fecha: new Date().toISOString().split('T')[0] }); openConsumo() }}
          />
        </Tabs.Panel>
        <Tabs.Panel value="calidad" pt="md">
          <TabCalidad calidades={calidades}
            onNew={() => { setCalidadForm({ ...calidadForm, fecha: new Date().toISOString().split('T')[0] }); openCalidad() }}
          />
        </Tabs.Panel>
      </Tabs>

      <Modal opened={fuenteModal} onClose={closeFuente} title={editandoFuente ? 'Editar Fuente' : 'Nueva Fuente de Agua'} size="lg">
        <Stack>
          <TextInput label="Nombre *" value={fuenteForm.nombre} onChange={e => setFuenteForm({ ...fuenteForm, nombre: e.target.value })} required />
          <Select label="Tipo" data={TIPOS_FUENTE.map(t => ({ value: t.value, label: t.label }))}
            value={fuenteForm.tipo} onChange={v => setFuenteForm({ ...fuenteForm, tipo: v || 'rio' })} />
          <SimpleGrid cols={2}>
            <NumberInput label="Caudal (lps)" value={fuenteForm.caudal_lps ? parseFloat(fuenteForm.caudal_lps) : ''}
              onChange={v => setFuenteForm({ ...fuenteForm, caudal_lps: v?.toString() || '' })} min={0} decimalScale={2} />
            <NumberInput label="Profundidad (m)" value={fuenteForm.profundidad_m ? parseFloat(fuenteForm.profundidad_m) : ''}
              onChange={v => setFuenteForm({ ...fuenteForm, profundidad_m: v?.toString() || '' })} min={0} decimalScale={2} />
          </SimpleGrid>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeFuente}>Cancelar</Button>
            <Button onClick={handleSaveFuente}>{editandoFuente ? 'Actualizar' : 'Guardar'}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={consumoModal} onClose={closeConsumo} title="Registrar Consumo de Agua" size="md">
        <Stack>
          <Select label="Fuente *" data={fuentes.map(f => ({ value: f.id.toString(), label: f.nombre }))}
            value={consumoForm.fuente_id} onChange={v => setConsumoForm({ ...consumoForm, fuente_id: v })} searchable required />
          <TextInput label="Fecha *" type="date" value={consumoForm.fecha} onChange={e => setConsumoForm({ ...consumoForm, fecha: e.target.value })} required />
          <NumberInput label="Cantidad (m³) *" value={consumoForm.cantidad_m3 ? parseFloat(consumoForm.cantidad_m3) : ''}
            onChange={v => setConsumoForm({ ...consumoForm, cantidad_m3: v?.toString() || '' })} min={0} decimalScale={2} required />
          <Select label="Tipo de Uso" data={TIPOS_USO.map(u => ({ value: u.value, label: u.label }))}
            value={consumoForm.tipo_uso} onChange={v => setConsumoForm({ ...consumoForm, tipo_uso: v || 'riego' })} />
          <Select label="Lote (opcional)" data={lotes.map(l => ({ value: l.id.toString(), label: l.nombre }))}
            value={consumoForm.lote_id} onChange={v => setConsumoForm({ ...consumoForm, lote_id: v })} searchable clearable />
          <Textarea label="Observaciones" value={consumoForm.observaciones} onChange={e => setConsumoForm({ ...consumoForm, observaciones: e.target.value })} />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeConsumo}>Cancelar</Button>
            <Button onClick={handleSaveConsumo}>Registrar</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={calidadModal} onClose={closeCalidad} title="Nuevo Test de Calidad" size="md">
        <Stack>
          <Select label="Fuente *" data={fuentes.map(f => ({ value: f.id.toString(), label: f.nombre }))}
            value={calidadForm.fuente_id} onChange={v => setCalidadForm({ ...calidadForm, fuente_id: v })} searchable required />
          <TextInput label="Fecha *" type="date" value={calidadForm.fecha} onChange={e => setCalidadForm({ ...calidadForm, fecha: e.target.value })} required />
          <SimpleGrid cols={2}>
            <NumberInput label="pH" value={calidadForm.ph ? parseFloat(calidadForm.ph) : ''}
              onChange={v => setCalidadForm({ ...calidadForm, ph: v?.toString() || '' })} min={0} max={14} decimalScale={2} />
            <NumberInput label="Turbiedad (NTU)" value={calidadForm.turbiedad_ntu ? parseFloat(calidadForm.turbiedad_ntu) : ''}
              onChange={v => setCalidadForm({ ...calidadForm, turbiedad_ntu: v?.toString() || '' })} min={0} decimalScale={2} />
          </SimpleGrid>
          <SimpleGrid cols={2}>
            <NumberInput label="Coliformes" value={calidadForm.coliformes ? parseInt(calidadForm.coliformes) : ''}
              onChange={v => setCalidadForm({ ...calidadForm, coliformes: v?.toString() || '' })} min={0} />
            <NumberInput label="Conductividad" value={calidadForm.conductividad ? parseFloat(calidadForm.conductividad) : ''}
              onChange={v => setCalidadForm({ ...calidadForm, conductividad: v?.toString() || '' })} min={0} decimalScale={2} />
          </SimpleGrid>
          <Textarea label="Observaciones" value={calidadForm.observaciones} onChange={e => setCalidadForm({ ...calidadForm, observaciones: e.target.value })} />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeCalidad}>Cancelar</Button>
            <Button onClick={handleSaveCalidad}>Registrar</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
