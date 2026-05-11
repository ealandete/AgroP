import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, Stack, SimpleGrid, Text, Tabs, ActionIcon, Textarea, Alert,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPlus, IconEdit, IconTrash, IconFish, IconDroplet,
  IconTemperature, IconFlask, IconChartBubble, IconAlertTriangle,
} from '@tabler/icons-react'
import api from '../services/api.js'

const TIPO_ESTANQUE = [
  { value: 'tierra_concreto', label: 'Tierra/Concreto' },
  { value: 'geomembrana', label: 'Geomembrana' },
  { value: 'acuario', label: 'Acuario' },
]

const ESPECIES = [
  { value: 'tilapia', label: 'Tilapia' },
  { value: 'mojarra', label: 'Mojarra' },
  { value: 'cachama', label: 'Cachama' },
  { value: 'trucha', label: 'Trucha' },
  { value: 'bocachico', label: 'Bocachico' },
  { value: 'camarones', label: 'Camarones' },
  { value: 'otro', label: 'Otro' },
]

const TIPO_ALIMENTO = [
  { value: 'concentrado_inicio', label: 'Concentrado Inicio' },
  { value: 'concentrado_engorde', label: 'Concentrado Engorde' },
  { value: 'concentrado_finalizacion', label: 'Concentrado Finalización' },
  { value: 'harina_pescado', label: 'Harina de Pescado' },
  { value: 'suplemento_vitaminico', label: 'Suplemento Vitaminico' },
  { value: 'natural', label: 'Alimento Natural' },
  { value: 'otro', label: 'Otro' },
]

const ALERTA_CALIDAD = {
  ph: { min: 6.5, max: 8.5, label: 'pH' },
  oxigeno_disuelto_mgl: { min: 4, max: Infinity, label: 'Oxígeno (mg/L)' },
  amoniaco_mgl: { min: 0, max: 0.05, label: 'Amoniaco (mg/L)' },
  temperatura_agua: { min: 22, max: 30, label: 'Temperatura (°C)' },
}

function getCalidadAlertas(record) {
  const alerts = []
  if (record.ph != null && (record.ph < ALERTA_CALIDAD.ph.min || record.ph > ALERTA_CALIDAD.ph.max)) {
    alerts.push(`${ALERTA_CALIDAD.ph.label}: ${record.ph} (rango ${ALERTA_CALIDAD.ph.min}-${ALERTA_CALIDAD.ph.max})`)
  }
  if (record.oxigeno_disuelto_mgl != null && record.oxigeno_disuelto_mgl < ALERTA_CALIDAD.oxigeno_disuelto_mgl.min) {
    alerts.push(`${ALERTA_CALIDAD.oxigeno_disuelto_mgl.label}: ${record.oxigeno_disuelto_mgl} (mín ${ALERTA_CALIDAD.oxigeno_disuelto_mgl.min})`)
  }
  if (record.amoniaco_mgl != null && record.amoniaco_mgl > ALERTA_CALIDAD.amoniaco_mgl.max) {
    alerts.push(`${ALERTA_CALIDAD.amoniaco_mgl.label}: ${record.amoniaco_mgl} (máx ${ALERTA_CALIDAD.amoniaco_mgl.max})`)
  }
  if (record.temperatura_agua != null && (record.temperatura_agua < ALERTA_CALIDAD.temperatura_agua.min || record.temperatura_agua > ALERTA_CALIDAD.temperatura_agua.max)) {
    alerts.push(`${ALERTA_CALIDAD.temperatura_agua.label}: ${record.temperatura_agua}°C (rango ${ALERTA_CALIDAD.temperatura_agua.min}-${ALERTA_CALIDAD.temperatura_agua.max}°C)`)
  }
  return alerts
}

function valueColor(value, param) {
  if (value == null) return undefined
  const p = ALERTA_CALIDAD[param]
  if (!p) return undefined
  if (value < p.min) return 'red'
  if (value > p.max) return 'red'
  return 'green'
}

export default function Picicultura() {
  const [estanques, setEstanques] = useState([])
  const [cosechas, setCosechas] = useState([])
  const [calidad, setCalidad] = useState([])
  const [alimentacion, setAlimentacion] = useState([])
  const [fincas, setFincas] = useState([])
  const [resumen, setResumen] = useState(null)
  const [activeTab, setActiveTab] = useState('estanques')
  const [selectedEstanque, setSelectedEstanque] = useState(null)

  const [estOpened, { open: openEst, close: closeEst }] = useDisclosure(false)
  const [cosOpened, { open: openCos, close: closeCos }] = useDisclosure(false)
  const [calOpened, { open: openCal, close: closeCal }] = useDisclosure(false)
  const [aliOpened, { open: openAli, close: closeAli }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)

  const [estForm, setEstForm] = useState({
    finca_id: '', nombre: '', codigo: '', area_m2: '', profundidad_m: '',
    tipo: 'tierra_concreto', especie_cultivada: 'tilapia',
    capacidad_peces: '', sistema_aireacion: '', fecha_construccion: '',
  })
  const [cosForm, setCosForm] = useState({
    estanque_id: '', fecha: new Date().toISOString().split('T')[0],
    cantidad_kg: '', peso_promedio_g: '', sobrevivencia_pct: '', destino: '', observaciones: '',
  })
  const [calForm, setCalForm] = useState({
    estanque_id: '', fecha: new Date().toISOString().split('T')[0],
    temperatura_agua: '', ph: '', oxigeno_disuelto_mgl: '', amoniaco_mgl: '', turbidez: '', observaciones: '',
  })
  const [aliForm, setAliForm] = useState({
    estanque_id: '', fecha: new Date().toISOString().split('T')[0],
    tipo_alimento: 'concentrado_engorde', cantidad_kg: '', frecuencia_diaria: 1,
  })

  const loadFincas = async () => {
    try {
      const r = await api.get('/lotes/fincas/')
      setFincas(Array.isArray(r.data) ? r.data : [])
    } catch { setFincas([]) }
  }

  const loadData = async () => {
    try {
      const r = await api.get('/estanques/')
      setEstanques(Array.isArray(r.data) ? r.data : [])
    } catch { setEstanques([]) }
  }

  const loadResumen = async () => {
    try {
      const fi = localStorage.getItem('agrop_finca_id')
      const r = await api.get(`/estanques/resumen${fi ? `?finca_id=${fi}` : ''}`)
      setResumen(r.data)
    } catch { setResumen(null) }
  }

  const loadCosechas = async (estanqueId) => {
    if (!estanqueId) return
    try {
      const r = await api.get(`/estanques/${estanqueId}/cosechas`)
      setCosechas(Array.isArray(r.data) ? r.data : [])
    } catch { setCosechas([]) }
  }

  const loadCalidad = async (estanqueId) => {
    if (!estanqueId) return
    try {
      const r = await api.get(`/estanques/${estanqueId}/calidad-agua`)
      setCalidad(Array.isArray(r.data) ? r.data : [])
    } catch { setCalidad([]) }
  }

  const loadAlimentacion = async (estanqueId) => {
    if (!estanqueId) return
    try {
      const r = await api.get(`/estanques/${estanqueId}/alimentacion`)
      setAlimentacion(Array.isArray(r.data) ? r.data : [])
    } catch { setAlimentacion([]) }
  }

  useEffect(() => { loadFincas(); loadData(); loadResumen() }, [])

  useEffect(() => {
    if (selectedEstanque) {
      if (activeTab === 'cosechas') loadCosechas(selectedEstanque)
      else if (activeTab === 'calidad') loadCalidad(selectedEstanque)
      else if (activeTab === 'alimentacion') loadAlimentacion(selectedEstanque)
    }
  }, [selectedEstanque, activeTab])

  const handleEstSubmit = async () => {
    try {
      const payload = {
        ...estForm,
        finca_id: parseInt(estForm.finca_id),
        area_m2: estForm.area_m2 ? parseFloat(estForm.area_m2) : null,
        profundidad_m: estForm.profundidad_m ? parseFloat(estForm.profundidad_m) : null,
        capacidad_peces: estForm.capacidad_peces ? parseInt(estForm.capacidad_peces) : null,
        fecha_construccion: estForm.fecha_construccion || null,
      }
      if (editando) {
        await api.put(`/estanques/${editando}`, payload)
        notifications.show({ title: 'Estanque actualizado', color: 'green' })
      } else {
        await api.post('/estanques/', payload)
        notifications.show({ title: 'Estanque creado', color: 'green' })
      }
      closeEst(); setEditando(null)
      setEstForm({ finca_id: '', nombre: '', codigo: '', area_m2: '', profundidad_m: '', tipo: 'tierra_concreto', especie_cultivada: 'tilapia', capacidad_peces: '', sistema_aireacion: '', fecha_construccion: '' })
      loadData(); loadResumen()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleCosSubmit = async () => {
    try {
      const eid = parseInt(cosForm.estanque_id)
      const payload = {
        estanque_id: eid, fecha: cosForm.fecha,
        cantidad_kg: parseFloat(cosForm.cantidad_kg),
        peso_promedio_g: cosForm.peso_promedio_g ? parseFloat(cosForm.peso_promedio_g) : null,
        sobrevivencia_pct: cosForm.sobrevivencia_pct ? parseFloat(cosForm.sobrevivencia_pct) : null,
        destino: cosForm.destino || null, observaciones: cosForm.observaciones || null,
      }
      await api.post(`/estanques/${eid}/cosechas`, payload)
      notifications.show({ title: 'Cosecha registrada', color: 'green' })
      closeCos()
      setCosForm({ estanque_id: '', fecha: new Date().toISOString().split('T')[0], cantidad_kg: '', peso_promedio_g: '', sobrevivencia_pct: '', destino: '', observaciones: '' })
      if (selectedEstanque === eid) loadCosechas(eid)
      loadResumen()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleCalSubmit = async () => {
    try {
      const eid = parseInt(calForm.estanque_id)
      const payload = {
        estanque_id: eid, fecha: calForm.fecha,
        temperatura_agua: calForm.temperatura_agua ? parseFloat(calForm.temperatura_agua) : null,
        ph: calForm.ph ? parseFloat(calForm.ph) : null,
        oxigeno_disuelto_mgl: calForm.oxigeno_disuelto_mgl ? parseFloat(calForm.oxigeno_disuelto_mgl) : null,
        amoniaco_mgl: calForm.amoniaco_mgl ? parseFloat(calForm.amoniaco_mgl) : null,
        turbidez: calForm.turbidez ? parseFloat(calForm.turbidez) : null,
        observaciones: calForm.observaciones || null,
      }
      await api.post(`/estanques/${eid}/calidad-agua`, payload)
      notifications.show({ title: 'Calidad registrada', color: 'green' })
      closeCal()
      setCalForm({ estanque_id: '', fecha: new Date().toISOString().split('T')[0], temperatura_agua: '', ph: '', oxigeno_disuelto_mgl: '', amoniaco_mgl: '', turbidez: '', observaciones: '' })
      if (selectedEstanque === eid) loadCalidad(eid)
      loadResumen()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleAliSubmit = async () => {
    try {
      const eid = parseInt(aliForm.estanque_id)
      const payload = {
        estanque_id: eid, fecha: aliForm.fecha,
        tipo_alimento: aliForm.tipo_alimento,
        cantidad_kg: parseFloat(aliForm.cantidad_kg),
        frecuencia_diaria: parseInt(aliForm.frecuencia_diaria) || 1,
      }
      await api.post(`/estanques/${eid}/alimentacion`, payload)
      notifications.show({ title: 'Alimentación registrada', color: 'green' })
      closeAli()
      setAliForm({ estanque_id: '', fecha: new Date().toISOString().split('T')[0], tipo_alimento: 'concentrado_engorde', cantidad_kg: '', frecuencia_diaria: 1 })
      if (selectedEstanque === eid) loadAlimentacion(eid)
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/estanques/${id}`)
      notifications.show({ title: 'Estanque desactivado', color: 'orange' })
      loadData()
    } catch { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const openEditEst = (e) => {
    setEditando(e.id)
    setEstForm({
      finca_id: e.finca_id?.toString() || '',
      nombre: e.nombre || '', codigo: e.codigo || '',
      area_m2: e.area_m2?.toString() || '', profundidad_m: e.profundidad_m?.toString() || '',
      tipo: e.tipo || 'tierra_concreto',
      especie_cultivada: e.especie_cultivada || 'tilapia',
      capacidad_peces: e.capacidad_peces?.toString() || '',
      sistema_aireacion: e.sistema_aireacion || '', fecha_construccion: e.fecha_construccion || '',
    })
    openEst()
  }

  const activeAlerts = calidad.filter(r => getCalidadAlertas(r).length > 0)

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Picicultura</Title>
        <Group>
          <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setEstForm({ finca_id: '', nombre: '', codigo: '', area_m2: '', profundidad_m: '', tipo: 'tierra_concreto', especie_cultivada: 'tilapia', capacidad_peces: '', sistema_aireacion: '', fecha_construccion: '' }); openEst() }}>
            Nuevo Estanque
          </Button>
        </Group>
      </Group>

      {resumen && (
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <Paper p="md" radius="md" withBorder>
            <Group><IconFish size={20} color="var(--mantine-color-blue-6)" /><Text size="xs" c="dimmed">Estanques Activos</Text></Group>
            <Text size="xl" fw={700}>{resumen.estanques_activos}</Text>
          </Paper>
          <Paper p="md" radius="md" withBorder>
            <Group><IconChartBubble size={20} color="var(--mantine-color-teal-6)" /><Text size="xs" c="dimmed">Cosechas del Mes</Text></Group>
            <Text size="xl" fw={700}>{resumen.cosechas_mes}</Text>
          </Paper>
          <Paper p="md" radius="md" withBorder>
            <Group><IconFlask size={20} color="var(--mantine-color-orange-6)" /><Text size="xs" c="dimmed">Total Kg Producidos</Text></Group>
            <Text size="xl" fw={700}>{resumen.total_kg_mes?.toFixed(1)} kg</Text>
          </Paper>
          <Paper p="md" radius="md" withBorder>
            <Group><IconDroplet size={20} color="var(--mantine-color-cyan-6)" /><Text size="xs" c="dimmed">pH Promedio</Text></Group>
            <Text size="xl" fw={700}>{resumen.calidad_promedio_ph?.toFixed(1) || '-'}</Text>
          </Paper>
        </SimpleGrid>
      )}

      {activeAlerts.length > 0 && (
        <Alert icon={<IconAlertTriangle size={16} />} title="Alertas de Calidad de Agua" color="red" variant="light">
          {activeAlerts.slice(0, 3).map((r, i) => (
            <Text key={i} size="sm">
              {r.estanque_nombre || `Estanque #${r.estanque_id}`} ({r.fecha}): {getCalidadAlertas(r).join('; ')}
            </Text>
          ))}
          {activeAlerts.length > 3 && <Text size="sm" mt={4}>...y {activeAlerts.length - 3} más</Text>}
        </Alert>
      )}

      <Paper withBorder>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="estanques" leftSection={<IconFish size={16} />}>Estanques</Tabs.Tab>
            <Tabs.Tab value="cosechas" leftSection={<IconChartBubble size={16} />}>Cosechas</Tabs.Tab>
            <Tabs.Tab value="calidad" leftSection={<IconTemperature size={16} />}>Calidad de Agua</Tabs.Tab>
            <Tabs.Tab value="alimentacion" leftSection={<IconDroplet size={16} />}>Alimentación</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="estanques" pt="md">
            <Group mb="sm">
              <Select
                placeholder="Tipo" clearable data={TIPO_ESTANQUE}
                onChange={(v) => {
                  if (v) setSelectedEstanque(v === 'all' ? null : v)
                }}
                style={{ width: 180 }}
              />
            </Group>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nombre</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Especie</Table.Th>
                  <Table.Th>Área (m²)</Table.Th>
                  <Table.Th>Capacidad</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(estanques || []).map(e => (
                  <Table.Tr key={e.id}>
                    <Table.Td fw={500}>{e.nombre} {e.codigo && `(${e.codigo})`}</Table.Td>
                    <Table.Td><Badge size="sm" color="blue" variant="light">{TIPO_ESTANQUE.find(t => t.value === e.tipo)?.label || e.tipo}</Badge></Table.Td>
                    <Table.Td>{ESPECIES.find(s => s.value === e.especie_cultivada)?.label || e.especie_cultivada}</Table.Td>
                    <Table.Td>{e.area_m2?.toFixed(1)}</Table.Td>
                    <Table.Td>{e.capacidad_peces || '-'}</Table.Td>
                    <Table.Td><Badge color={e.activo ? 'green' : 'gray'} size="sm">{e.activo ? 'Activo' : 'Inactivo'}</Badge></Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon variant="light" color="blue" size="sm" onClick={() => openEditEst(e)}><IconEdit size={14} /></ActionIcon>
                        {e.activo && (
                          <ActionIcon variant="light" color="red" size="sm" onClick={() => handleDelete(e.id)}><IconTrash size={14} /></ActionIcon>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {estanques.length === 0 && (
                  <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center">No hay estanques registrados</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>

          <Tabs.Panel value="cosechas" pt="md">
            <Group mb="sm">
              <Select
                placeholder="Seleccionar estanque" clearable searchable
                data={(estanques || []).map(e => ({ value: e.id.toString(), label: e.nombre }))}
                value={selectedEstanque?.toString()}
                onChange={(v) => { setSelectedEstanque(v ? parseInt(v) : null); if (v) loadCosechas(parseInt(v)) }}
                style={{ width: 250 }}
              />
              <Button leftSection={<IconPlus size={14} />} size="sm" onClick={() => setCosForm({ ...cosForm, estanque_id: selectedEstanque?.toString() || '' }) || openCos()}>
                Registrar Cosecha
              </Button>
            </Group>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Estanque</Table.Th>
                  <Table.Th>Cantidad (kg)</Table.Th>
                  <Table.Th>Peso Prom. (g)</Table.Th>
                  <Table.Th>Sobrevivencia</Table.Th>
                  <Table.Th>Destino</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(cosechas || []).map(c => (
                  <Table.Tr key={c.id}>
                    <Table.Td>{c.fecha}</Table.Td>
                    <Table.Td>{c.estanque_nombre || `#${c.estanque_id}`}</Table.Td>
                    <Table.Td fw={500}>{c.cantidad_kg?.toFixed(1)}</Table.Td>
                    <Table.Td>{c.peso_promedio_g?.toFixed(0) || '-'}</Table.Td>
                    <Table.Td>{c.sobrevivencia_pct != null ? `${c.sobrevivencia_pct.toFixed(1)}%` : '-'}</Table.Td>
                    <Table.Td>{c.destino || '-'}</Table.Td>
                  </Table.Tr>
                ))}
                {cosechas.length === 0 && (
                  <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">No hay cosechas registradas</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>

          <Tabs.Panel value="calidad" pt="md">
            <Group mb="sm">
              <Select
                placeholder="Seleccionar estanque" clearable searchable
                data={(estanques || []).map(e => ({ value: e.id.toString(), label: e.nombre }))}
                value={selectedEstanque?.toString()}
                onChange={(v) => { setSelectedEstanque(v ? parseInt(v) : null); if (v) loadCalidad(parseInt(v)) }}
                style={{ width: 250 }}
              />
              <Button leftSection={<IconPlus size={14} />} size="sm" onClick={() => { setCalForm({ ...calForm, estanque_id: selectedEstanque?.toString() || '' }); openCal() }}>
                Registrar Calidad
              </Button>
            </Group>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Estanque</Table.Th>
                  <Table.Th>Temp (°C)</Table.Th>
                  <Table.Th>pH</Table.Th>
                  <Table.Th>Oxígeno (mg/L)</Table.Th>
                  <Table.Th>Amoniaco (mg/L)</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(calidad || []).map(c => {
                  const alerts = getCalidadAlertas(c)
                  return (
                    <Table.Tr key={c.id} style={alerts.length > 0 ? { background: 'var(--mantine-color-red-0)' } : undefined}>
                      <Table.Td>{c.fecha}</Table.Td>
                      <Table.Td>{c.estanque_nombre || `#${c.estanque_id}`}</Table.Td>
                      <Table.Td c={valueColor(c.temperatura_agua, 'temperatura_agua')}>{c.temperatura_agua?.toFixed(1) || '-'}</Table.Td>
                      <Table.Td c={valueColor(c.ph, 'ph')}>{c.ph?.toFixed(1) || '-'}</Table.Td>
                      <Table.Td c={valueColor(c.oxigeno_disuelto_mgl, 'oxigeno_disuelto_mgl')}>{c.oxigeno_disuelto_mgl?.toFixed(1) || '-'}</Table.Td>
                      <Table.Td c={valueColor(c.amoniaco_mgl, 'amoniaco_mgl')}>{c.amoniaco_mgl?.toFixed(3) || '-'}</Table.Td>
                    </Table.Tr>
                  )
                })}
                {calidad.length === 0 && (
                  <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">No hay registros de calidad</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>

          <Tabs.Panel value="alimentacion" pt="md">
            <Group mb="sm">
              <Select
                placeholder="Seleccionar estanque" clearable searchable
                data={(estanques || []).map(e => ({ value: e.id.toString(), label: e.nombre }))}
                value={selectedEstanque?.toString()}
                onChange={(v) => { setSelectedEstanque(v ? parseInt(v) : null); if (v) loadAlimentacion(parseInt(v)) }}
                style={{ width: 250 }}
              />
              <Button leftSection={<IconPlus size={14} />} size="sm" onClick={() => { setAliForm({ ...aliForm, estanque_id: selectedEstanque?.toString() || '' }); openAli() }}>
                Registrar Alimentación
              </Button>
            </Group>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Estanque</Table.Th>
                  <Table.Th>Tipo Alimento</Table.Th>
                  <Table.Th>Cantidad (kg)</Table.Th>
                  <Table.Th>Frecuencia Diaria</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(alimentacion || []).map(a => (
                  <Table.Tr key={a.id}>
                    <Table.Td>{a.fecha}</Table.Td>
                    <Table.Td>{a.estanque_nombre || `#${a.estanque_id}`}</Table.Td>
                    <Table.Td><Badge size="sm" color="grape" variant="light">{TIPO_ALIMENTO.find(t => t.value === a.tipo_alimento)?.label || a.tipo_alimento}</Badge></Table.Td>
                    <Table.Td fw={500}>{a.cantidad_kg?.toFixed(1)}</Table.Td>
                    <Table.Td>{a.frecuencia_diaria}x/día</Table.Td>
                  </Table.Tr>
                ))}
                {alimentacion.length === 0 && (
                  <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center">No hay registros de alimentación</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>
        </Tabs>
      </Paper>

      <Modal opened={estOpened} onClose={closeEst} title={editando ? 'Editar Estanque' : 'Nuevo Estanque'} size="lg">
        <Stack>
          <SimpleGrid cols={2}>
            <Select label="Finca" required data={(fincas || []).map(f => ({ value: f.id.toString(), label: f.nombre }))} value={estForm.finca_id} onChange={v => setEstForm({ ...estForm, finca_id: v })} searchable />
            <TextInput label="Nombre" required value={estForm.nombre} onChange={e => setEstForm({ ...estForm, nombre: e.target.value })} />
            <TextInput label="Código" value={estForm.codigo} onChange={e => setEstForm({ ...estForm, codigo: e.target.value })} />
            <Select label="Tipo" data={TIPO_ESTANQUE} value={estForm.tipo} onChange={v => setEstForm({ ...estForm, tipo: v })} />
            <Select label="Especie Cultivada" data={ESPECIES} value={estForm.especie_cultivada} onChange={v => setEstForm({ ...estForm, especie_cultivada: v })} />
            <NumberInput label="Área (m²)" value={estForm.area_m2 === '' ? '' : Number(estForm.area_m2)} onChange={v => setEstForm({ ...estForm, area_m2: v === '' ? '' : v.toString() })} min={0} />
            <NumberInput label="Profundidad (m)" value={estForm.profundidad_m === '' ? '' : Number(estForm.profundidad_m)} onChange={v => setEstForm({ ...estForm, profundidad_m: v === '' ? '' : v.toString() })} min={0} />
            <NumberInput label="Capacidad (peces)" value={estForm.capacidad_peces === '' ? '' : Number(estForm.capacidad_peces)} onChange={v => setEstForm({ ...estForm, capacidad_peces: v === '' ? '' : v.toString() })} min={0} />
            <TextInput label="Sistema de Aireación" value={estForm.sistema_aireacion} onChange={e => setEstForm({ ...estForm, sistema_aireacion: e.target.value })} />
            <TextInput label="Fecha Construcción" type="date" value={estForm.fecha_construccion} onChange={e => setEstForm({ ...estForm, fecha_construccion: e.target.value })} />
          </SimpleGrid>
          <Group justify="flex-end"><Button variant="default" onClick={closeEst}>Cancelar</Button><Button onClick={handleEstSubmit}>{editando ? 'Actualizar' : 'Guardar'}</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={cosOpened} onClose={closeCos} title="Registrar Cosecha" size="md">
        <Stack>
          <Select label="Estanque" required data={(estanques || []).map(e => ({ value: e.id.toString(), label: e.nombre }))} value={cosForm.estanque_id} onChange={v => setCosForm({ ...cosForm, estanque_id: v })} searchable />
          <TextInput label="Fecha" type="date" required value={cosForm.fecha} onChange={e => setCosForm({ ...cosForm, fecha: e.target.value })} />
          <NumberInput label="Cantidad (kg)" required value={cosForm.cantidad_kg === '' ? '' : Number(cosForm.cantidad_kg)} onChange={v => setCosForm({ ...cosForm, cantidad_kg: v === '' ? '' : v.toString() })} min={0} />
          <NumberInput label="Peso Promedio (g)" value={cosForm.peso_promedio_g === '' ? '' : Number(cosForm.peso_promedio_g)} onChange={v => setCosForm({ ...cosForm, peso_promedio_g: v === '' ? '' : v.toString() })} min={0} />
          <NumberInput label="Sobrevivencia (%)" value={cosForm.sobrevivencia_pct === '' ? '' : Number(cosForm.sobrevivencia_pct)} onChange={v => setCosForm({ ...cosForm, sobrevivencia_pct: v === '' ? '' : v.toString() })} min={0} max={100} />
          <TextInput label="Destino" value={cosForm.destino} onChange={e => setCosForm({ ...cosForm, destino: e.target.value })} />
          <Textarea label="Observaciones" value={cosForm.observaciones} onChange={e => setCosForm({ ...cosForm, observaciones: e.target.value })} />
          <Group justify="flex-end"><Button variant="default" onClick={closeCos}>Cancelar</Button><Button onClick={handleCosSubmit}>Guardar</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={calOpened} onClose={closeCal} title="Registrar Calidad de Agua" size="md">
        <Stack>
          <Select label="Estanque" required data={(estanques || []).map(e => ({ value: e.id.toString(), label: e.nombre }))} value={calForm.estanque_id} onChange={v => setCalForm({ ...calForm, estanque_id: v })} searchable />
          <TextInput label="Fecha" type="date" required value={calForm.fecha} onChange={e => setCalForm({ ...calForm, fecha: e.target.value })} />
          <SimpleGrid cols={2}>
            <NumberInput label="Temperatura (°C)" value={calForm.temperatura_agua === '' ? '' : Number(calForm.temperatura_agua)} onChange={v => setCalForm({ ...calForm, temperatura_agua: v === '' ? '' : v.toString() })} min={0} />
            <NumberInput label="pH" value={calForm.ph === '' ? '' : Number(calForm.ph)} onChange={v => setCalForm({ ...calForm, ph: v === '' ? '' : v.toString() })} min={0} max={14} step={0.1} />
            <NumberInput label="Oxígeno Disuelto (mg/L)" value={calForm.oxigeno_disuelto_mgl === '' ? '' : Number(calForm.oxigeno_disuelto_mgl)} onChange={v => setCalForm({ ...calForm, oxigeno_disuelto_mgl: v === '' ? '' : v.toString() })} min={0} />
            <NumberInput label="Amoniaco (mg/L)" value={calForm.amoniaco_mgl === '' ? '' : Number(calForm.amoniaco_mgl)} onChange={v => setCalForm({ ...calForm, amoniaco_mgl: v === '' ? '' : v.toString() })} min={0} step={0.001} />
            <NumberInput label="Turbidez" value={calForm.turbidez === '' ? '' : Number(calForm.turbidez)} onChange={v => setCalForm({ ...calForm, turbidez: v === '' ? '' : v.toString() })} min={0} />
          </SimpleGrid>
          <Textarea label="Observaciones" value={calForm.observaciones} onChange={e => setCalForm({ ...calForm, observaciones: e.target.value })} />
          <Group justify="flex-end"><Button variant="default" onClick={closeCal}>Cancelar</Button><Button onClick={handleCalSubmit}>Guardar</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={aliOpened} onClose={closeAli} title="Registrar Alimentación" size="md">
        <Stack>
          <Select label="Estanque" required data={(estanques || []).map(e => ({ value: e.id.toString(), label: e.nombre }))} value={aliForm.estanque_id} onChange={v => setAliForm({ ...aliForm, estanque_id: v })} searchable />
          <TextInput label="Fecha" type="date" required value={aliForm.fecha} onChange={e => setAliForm({ ...aliForm, fecha: e.target.value })} />
          <Select label="Tipo de Alimento" data={TIPO_ALIMENTO} value={aliForm.tipo_alimento} onChange={v => setAliForm({ ...aliForm, tipo_alimento: v })} />
          <NumberInput label="Cantidad (kg)" required value={aliForm.cantidad_kg === '' ? '' : Number(aliForm.cantidad_kg)} onChange={v => setAliForm({ ...aliForm, cantidad_kg: v === '' ? '' : v.toString() })} min={0} />
          <NumberInput label="Frecuencia Diaria" value={aliForm.frecuencia_diaria} onChange={v => setAliForm({ ...aliForm, frecuencia_diaria: v })} min={1} />
          <Group justify="flex-end"><Button variant="default" onClick={closeAli}>Cancelar</Button><Button onClick={handleAliSubmit}>Guardar</Button></Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
