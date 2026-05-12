import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, Stack, SimpleGrid, Text, ActionIcon,
  Tabs, Textarea, Card, Tooltip, Switch,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconDeviceSdCard, IconTemperature, IconAlertTriangle, IconMap,
  IconPlus, IconEdit, IconX, IconEye, IconActivity,
} from '@tabler/icons-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import dayjs from 'dayjs'
import api from '../services/api.js'
import CoordinatePicker from '../components/CoordinatePicker.jsx'

const TIPOS_SENSOR = [
  { value: 'estacion_meteorologica', label: 'Estación Meteorológica', color: 'blue' },
  { value: 'sensor_suelo', label: 'Sensor de Suelo', color: 'brown' },
  { value: 'sensor_agua', label: 'Sensor de Agua', color: 'cyan' },
  { value: 'camara', label: 'Cámara', color: 'violet' },
  { value: 'dron', label: 'Dron', color: 'grape' },
  { value: 'gps_animal', label: 'GPS Animal', color: 'orange' },
  { value: 'gps_vehiculo', label: 'GPS Vehículo', color: 'red' },
  { value: 'otro', label: 'Otro', color: 'gray' },
]

const PROTOCOLOS = ['wifi', 'lorawan', 'gsm', 'sigfox', 'otro']

const VARIABLES_OPTS = [
  'temperatura', 'humedad', 'precipitacion', 'ph', 'humedad_suelo',
  'radiacion_solar', 'viento_velocidad', 'viento_direccion',
  'presion_atmosferica', 'caudal', 'nivel_agua', 'calidad_aire',
  'oxigeno_disuelto', 'conductividad', 'turbidez',
]

function TabSensores({ sensores, lotesMap, onEdit, onNew, onReadings, onToggle }) {
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Sensores</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={onNew}>Nuevo Sensor</Button>
      </Group>
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Lote</Table.Th>
              <Table.Th>Variables</Table.Th>
              <Table.Th>Última Lectura</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th style={{ width: 100 }}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sensores.map(s => {
              const tipo = TIPOS_SENSOR.find(t => t.value === s.tipo)
              return (
                <Table.Tr key={s.id}>
                  <Table.Td fw={500}>{s.nombre}</Table.Td>
                  <Table.Td><Badge color={tipo?.color || 'gray'} size="sm" variant="light">{tipo?.label || s.tipo}</Badge></Table.Td>
                  <Table.Td>{s.lote_nombre || '—'}</Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {(Array.isArray(s.variables_medidas) ? s.variables_medidas : []).slice(0, 3).map((v, i) => (
                        <Badge key={i} size="xs" variant="outline">{v}</Badge>
                      ))}
                      {Array.isArray(s.variables_medidas) && s.variables_medidas.length > 3 && (
                        <Badge size="xs" variant="outline">+{s.variables_medidas.length - 3}</Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {s.ultima_lectura ? (
                      <Text size="xs">{s.ultima_lectura.valor} {s.ultima_lectura.unidad}<br />{dayjs(s.ultima_lectura.fecha).format('DD/MM HH:mm')}</Text>
                    ) : '—'}
                  </Table.Td>
                  <Table.Td><Badge color={s.activo ? 'green' : 'gray'} size="sm">{s.activo ? 'Activo' : 'Inactivo'}</Badge></Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Tooltip label="Lecturas">
                        <ActionIcon variant="light" color="blue" size="sm" onClick={() => onReadings(s)}><IconActivity size={14} /></ActionIcon>
                      </Tooltip>
                      <Tooltip label="Editar">
                        <ActionIcon variant="light" color="orange" size="sm" onClick={() => onEdit(s)}><IconEdit size={14} /></ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )
            })}
            {sensores.length === 0 && (
              <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center">Sin sensores registrados</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}

function TabLecturas({ sensor, lecturas, onNewLectura }) {
  return (
    <Stack>
      {sensor ? (
        <>
          <Group justify="space-between">
            <Title order={4}>Lecturas: {sensor.nombre}</Title>
            <Button leftSection={<IconPlus size={16} />} onClick={onNewLectura}>Registrar Lectura</Button>
          </Group>
          {lecturas.length > 0 && (
            <Paper withBorder p="md">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lecturas.slice(0, 50).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tickFormatter={v => dayjs(v).format('DD/MM')} fontSize={11} />
                  <YAxis fontSize={11} />
                  <RechartsTooltip labelFormatter={v => dayjs(v).format('DD/MM/YYYY HH:mm')} />
                  <Legend />
                  <Line type="monotone" dataKey="valor" stroke="#2196F3" strokeWidth={2} dot={false} name={lecturas[0]?.variable || 'Valor'} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          )}
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Variable</Table.Th>
                  <Table.Th>Valor</Table.Th>
                  <Table.Th>Unidad</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {lecturas.map(l => (
                  <Table.Tr key={l.id}>
                    <Table.Td>{dayjs(l.fecha).format('DD/MM/YYYY HH:mm')}</Table.Td>
                    <Table.Td><Badge size="sm" variant="light">{l.variable}</Badge></Table.Td>
                    <Table.Td fw={500}>{l.valor}</Table.Td>
                    <Table.Td>{l.unidad || '—'}</Table.Td>
                  </Table.Tr>
                ))}
                {lecturas.length === 0 && (
                  <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center">Sin lecturas registradas</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </>
      ) : (
        <Text c="dimmed" ta="center" py="xl">Selecciona un sensor para ver sus lecturas</Text>
      )}
    </Stack>
  )
}

const initialSensorForm = {
  finca_id: '', lote_id: '', nombre: '', tipo: 'estacion_meteorologica',
  modelo: '', numero_serie: '', fabricante: '', fecha_instalacion: '',
  ubicacion_coordenadas: null, variables_medidas: [], frecuencia_lectura_min: '',
  protocolo: 'wifi', activo: true,
}

export default function Sensores() {
  const [sensores, setSensores] = useState([])
  const [lotes, setLotes] = useState([])
  const [resumen, setResumen] = useState({})
  const [selectedSensor, setSelectedSensor] = useState(null)
  const [lecturas, setLecturas] = useState([])
  const [activeTab, setActiveTab] = useState('sensores')

  const [sensorModal, { open: openSensor, close: closeSensor }] = useDisclosure(false)
  const [lecturaModal, { open: openLectura, close: closeLectura }] = useDisclosure(false)
  const [sensorForm, setSensorForm] = useState(initialSensorForm)
  const [lecturaForm, setLecturaForm] = useState({ fecha: dayjs().format('YYYY-MM-DDTHH:mm'), variable: '', valor: '', unidad: '' })
  const [saving, setSaving] = useState(false)
  const [editingSensor, setEditingSensor] = useState(null)

  const fincaId = localStorage.getItem('agrop_finca_id') || '1'

  const loadSensores = useCallback(async () => {
    try {
      const { data } = await api.get('/sensores/', { params: { finca_id: fincaId } })
      setSensores(data)
    } catch { setSensores([]) }
  }, [fincaId])

  const loadLotes = useCallback(async () => {
    try {
      const { data } = await api.get('/lotes/', { params: { finca_id: fincaId } })
      setLotes(data)
    } catch { setLotes([]) }
  }, [fincaId])

  const loadResumen = useCallback(async () => {
    try {
      const { data } = await api.get('/sensores/resumen')
      setResumen(data)
    } catch {}
  }, [])

  useEffect(() => { loadSensores(); loadLotes(); loadResumen() }, [loadSensores, loadLotes, loadResumen])

  const lotesMap = useMemo(() => {
    const m = {}
    lotes.forEach(l => { m[l.id] = l.nombre })
    return m
  }, [lotes])

  const handleReadings = async (s) => {
    setSelectedSensor(s)
    setActiveTab('lecturas')
    try {
      const { data } = await api.get(`/sensores/${s.id}/lecturas`)
      setLecturas(data)
    } catch { setLecturas([]) }
  }

  const handleNewSensor = () => {
    setEditingSensor(null)
    setSensorForm({ ...initialSensorForm, finca_id: parseInt(fincaId) })
    openSensor()
  }

  const handleEditSensor = (s) => {
    setEditingSensor(s)
    setSensorForm({
      finca_id: s.finca_id, lote_id: s.lote_id || '', nombre: s.nombre, tipo: s.tipo,
      modelo: s.modelo || '', numero_serie: s.numero_serie || '', fabricante: s.fabricante || '',
      fecha_instalacion: s.fecha_instalacion || '', ubicacion_coordenadas: s.ubicacion_coordenadas,
      variables_medidas: s.variables_medidas || [], frecuencia_lectura_min: s.frecuencia_lectura_min || '',
      protocolo: s.protocolo || 'wifi', activo: s.activo,
    })
    openSensor()
  }

  const handleSaveSensor = async () => {
    setSaving(true)
    try {
      if (editingSensor) {
        await api.put(`/sensores/${editingSensor.id}`, sensorForm)
        notifications.show({ title: 'Sensor actualizado', color: 'green' })
      } else {
        await api.post('/sensores/', sensorForm)
        notifications.show({ title: 'Sensor creado', color: 'green' })
      }
      closeSensor()
      loadSensores()
      loadResumen()
    } catch { notifications.show({ title: 'Error al guardar sensor', color: 'red' }) }
    finally { setSaving(false) }
  }

  const handleNewLectura = () => {
    setLecturaForm({ fecha: dayjs().format('YYYY-MM-DDTHH:mm'), variable: '', valor: '', unidad: '' })
    openLectura()
  }

  const handleSaveLectura = async () => {
    if (!selectedSensor) return
    setSaving(true)
    try {
      await api.post(`/sensores/${selectedSensor.id}/lecturas`, {
        ...lecturaForm,
        fecha: new Date(lecturaForm.fecha).toISOString(),
        valor: parseFloat(lecturaForm.valor),
      })
      notifications.show({ title: 'Lectura registrada', color: 'green' })
      closeLectura()
      handleReadings(selectedSensor)
    } catch { notifications.show({ title: 'Error al registrar lectura', color: 'red' }) }
    finally { setSaving(false) }
  }

  return (
    <Stack gap="md">
      <Title order={3}>Sensores y Estaciones</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm">
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Sensores Activos</Text>
          <Text fw={700} c="green">{resumen.activos ?? 0} / {resumen.total_sensores ?? 0}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Estaciones Meteorológicas</Text>
          <Text fw={700}>{resumen.estaciones_meteorologicas ?? 0}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Últimas Lecturas</Text>
          <Text fw={700}>{resumen.ultimas_lecturas?.length ?? 0}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Alertas</Text>
          <Text fw={700} c="orange">0</Text>
        </Card>
      </SimpleGrid>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="sensores" leftSection={<IconDeviceSdCard size={14} />}>Sensores</Tabs.Tab>
          <Tabs.Tab value="lecturas" leftSection={<IconActivity size={14} />}>Lecturas</Tabs.Tab>
          <Tabs.Tab value="mapa" leftSection={<IconMap size={14} />}>Mapa</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="sensores" pt="sm">
          <TabSensores sensores={sensores} lotesMap={lotesMap} onEdit={handleEditSensor} onNew={handleNewSensor}
            onReadings={handleReadings} />
        </Tabs.Panel>

        <Tabs.Panel value="lecturas" pt="sm">
          <TabLecturas sensor={selectedSensor} lecturas={lecturas} onNewLectura={handleNewLectura} />
        </Tabs.Panel>

        <Tabs.Panel value="mapa" pt="sm">
          <Paper withBorder p="xl" ta="center">
            <IconMap size={48} opacity={0.3} />
            <Text c="dimmed" mt="sm">Mapa de sensores (requiere Leaflet)</Text>
            <Text size="xs" c="dimmed">Los sensores con coordenadas aparecerán en un mapa interactivo</Text>
            {sensores.filter(s => s.ubicacion_coordenadas).length > 0 && (
              <Stack mt="md">
                {sensores.filter(s => s.ubicacion_coordenadas).map(s => (
                  <Paper key={s.id} withBorder p="xs">
                    <Group>
                      <Badge color={TIPOS_SENSOR.find(t => t.value === s.tipo)?.color || 'gray'} size="sm">{s.nombre}</Badge>
                      <Text size="xs" c="dimmed">{s.ubicacion_coordenadas?.lat?.toFixed(5)}, {s.ubicacion_coordenadas?.lng?.toFixed(5)}</Text>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={sensorModal} onClose={closeSensor} title={editingSensor ? 'Editar Sensor' : 'Nuevo Sensor'} size="md">
        <Stack gap="sm">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            <TextInput label="Nombre" value={sensorForm.nombre} onChange={e => setSensorForm(f => ({ ...f, nombre: e.target.value }))} required />
            <Select label="Tipo" data={TIPOS_SENSOR.map(t => ({ value: t.value, label: t.label }))}
              value={sensorForm.tipo} onChange={v => setSensorForm(f => ({ ...f, tipo: v }))} />
            <Select label="Lote" data={lotes.map(l => ({ value: l.id.toString(), label: l.nombre }))}
              value={sensorForm.lote_id?.toString() || ''} onChange={v => setSensorForm(f => ({ ...f, lote_id: v ? parseInt(v) : '' }))} clearable />
            <TextInput label="Modelo" value={sensorForm.modelo} onChange={e => setSensorForm(f => ({ ...f, modelo: e.target.value }))} />
            <TextInput label="Número de Serie" value={sensorForm.numero_serie} onChange={e => setSensorForm(f => ({ ...f, numero_serie: e.target.value }))} />
            <TextInput label="Fabricante" value={sensorForm.fabricante} onChange={e => setSensorForm(f => ({ ...f, fabricante: e.target.value }))} />
            <TextInput label="Fecha Instalación" type="date" value={sensorForm.fecha_instalacion} onChange={e => setSensorForm(f => ({ ...f, fecha_instalacion: e.target.value }))} />
            <NumberInput label="Frecuencia (min)" value={sensorForm.frecuencia_lectura_min} onChange={v => setSensorForm(f => ({ ...f, frecuencia_lectura_min: v }))} min={0} />
            <Select label="Protocolo" data={PROTOCOLOS} value={sensorForm.protocolo} onChange={v => setSensorForm(f => ({ ...f, protocolo: v }))} />
            <Switch label="Activo" checked={sensorForm.activo} onChange={e => setSensorForm(f => ({ ...f, activo: e.target.checked }))} />
          </SimpleGrid>

          <Select label="Variables a medir" data={VARIABLES_OPTS.map(v => ({ value: v, label: v }))}
            value={sensorForm.variables_medidas} onChange={v => setSensorForm(f => ({ ...f, variables_medidas: v }))} multiple searchable />

          <CoordinatePicker
            value={sensorForm.ubicacion_coordenadas}
            onChange={(coords) => setSensorForm(f => ({ ...f, ubicacion_coordenadas: coords }))}
            label="Ubicación del sensor"
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeSensor}>Cancelar</Button>
            <Button onClick={handleSaveSensor} loading={saving}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={lecturaModal} onClose={closeLectura} title="Registrar Lectura" size="sm">
        <Stack gap="sm">
          <TextInput label="Fecha y Hora" type="datetime-local" value={lecturaForm.fecha}
            onChange={e => setLecturaForm(f => ({ ...f, fecha: e.target.value }))} required />
          <Select label="Variable" data={selectedSensor?.variables_medidas?.map(v => ({ value: v, label: v })) || VARIABLES_OPTS.map(v => ({ value: v, label: v }))}
            value={lecturaForm.variable} onChange={v => setLecturaForm(f => ({ ...f, variable: v }))} required searchable />
          <NumberInput label="Valor" value={lecturaForm.valor} onChange={v => setLecturaForm(f => ({ ...f, valor: v }))} required />
          <TextInput label="Unidad" value={lecturaForm.unidad} onChange={e => setLecturaForm(f => ({ ...f, unidad: e.target.value }))} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeLectura}>Cancelar</Button>
            <Button onClick={handleSaveLectura} loading={saving}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
