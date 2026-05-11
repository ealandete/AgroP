import { useEffect, useState, useMemo } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, Stack, SimpleGrid, Text, Accordion,
  Card, Loader, Center, ActionIcon, Tooltip, Textarea, Grid,
  Divider, ThemeIcon, RingProgress, Progress,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  IconPlus, IconEdit, IconPlant, IconTractor, IconSpray,
  IconBasket, IconFlask, IconTimeline, IconCalendar, IconArrowBack,
  IconCircleCheck, IconClock, IconArrowLeft, IconHeartbeat,
  IconAlertTriangle, IconMapPin, IconBug,
} from '@tabler/icons-react'
import api from '../services/api.js'
import { formatNumber, formatCOP, TIPOS_CULTIVO } from '../config.js'

const ESTADO_COLOR = { activo: 'green', cosechado: 'blue', perdido: 'red', planificado: 'yellow' }
const LABOR_TIPOS = ['arado','siembra','riego','fertilizacion','control_plagas','cosecha','deshierbe','poda','otro']
const METODOS_SIEMBRA = ['directa','trasplante','voleo','surcos']
const TEXTURAS = ['franco','arcilloso','arenoso','limoso']
const CALIDADES = ['primera','segunda','tercera','exportacion','descarte']
const METODOS_COSECHA = ['manual','mecanica','mixta']
const DESTINOS = ['almacen','venta','procesamiento','semilla','autoconsumo']

function LaborModal({ opened, onClose, onSubmit, loteId }) {
  const [form, setForm] = useState({
    lote_id: loteId, fecha: new Date().toISOString().split('T')[0],
    tipo: 'riego', descripcion: '', horas: '', trabajadores: '', costo: '',
  })

  useEffect(() => { if (loteId) setForm(f => ({ ...f, lote_id: loteId })) }, [loteId])

  const handle = async () => {
    try {
      await api.post('/labores/', form)
      notifications.show({ title: 'Labor registrada', color: 'green' })
      onSubmit()
      onClose()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail, color: 'red' })
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Registrar Labor" size="lg">
      <SimpleGrid cols={2}>
        <TextInput label="Fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
        <Select label="Tipo" data={LABOR_TIPOS} value={form.tipo} onChange={v => setForm({ ...form, tipo: v })} />
        <Textarea label="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
        <NumberInput label="Horas" value={form.horas} onChange={v => setForm({ ...form, horas: v })} min={0} />
        <NumberInput label="Trabajadores" value={form.trabajadores} onChange={v => setForm({ ...form, trabajadores: v })} min={0} />
        <NumberInput label="Costo (COP)" value={form.costo} onChange={v => setForm({ ...form, costo: v })} min={0} />
      </SimpleGrid>
      <Group justify="flex-end" mt="xl">
        <Button variant="default" onClick={onClose}>Cancelar</Button>
        <Button onClick={handle}>Guardar</Button>
      </Group>
    </Modal>
  )
}

function CosechaModal({ opened, onClose, onSubmit, siembraId, loteId }) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0], cantidad_kg: '',
    calidad: 'primera', metodo: 'manual', destino: 'almacen',
  })

  const handle = async () => {
    try {
      await api.post(`/cultivos/${siembraId}/cosechas`, {
        siembra_id: siembraId, lote_id: loteId, ...form,
      })
      notifications.show({ title: 'Cosecha registrada', color: 'green' })
      onSubmit()
      onClose()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail, color: 'red' })
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Registrar Cosecha" size="md">
      <SimpleGrid cols={2}>
        <TextInput label="Fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
        <NumberInput label="Cantidad (kg)" value={form.cantidad_kg} onChange={v => setForm({ ...form, cantidad_kg: v })} min={0} />
        <Select label="Calidad" data={CALIDADES} value={form.calidad} onChange={v => setForm({ ...form, calidad: v })} />
        <Select label="Método" data={METODOS_COSECHA} value={form.metodo} onChange={v => setForm({ ...form, metodo: v })} />
        <Select label="Destino" data={DESTINOS} value={form.destino} onChange={v => setForm({ ...form, destino: v })} />
      </SimpleGrid>
      <Group justify="flex-end" mt="xl">
        <Button variant="default" onClick={onClose}>Cancelar</Button>
        <Button onClick={handle}>Guardar</Button>
      </Group>
    </Modal>
  )
}

function AnalisisModal({ opened, onClose, onSubmit, loteId }) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    ph: '', nitrogeno: '', fosforo: '', potasio: '', humedad: '', textura: 'franco',
  })

  const handle = async () => {
    try {
      await api.post(`/lotes/${loteId}/analisis`, form)
      notifications.show({ title: 'Análisis registrado', color: 'green' })
      onSubmit()
      onClose()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail, color: 'red' })
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Análisis de Suelo" size="md">
      <SimpleGrid cols={2}>
        <TextInput label="Fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
        <NumberInput label="pH" value={form.ph} onChange={v => setForm({ ...form, ph: v })} min={0} max={14} decimalScale={2} />
        <NumberInput label="Nitrógeno (ppm)" value={form.nitrogeno} onChange={v => setForm({ ...form, nitrogeno: v })} />
        <NumberInput label="Fósforo (ppm)" value={form.fosforo} onChange={v => setForm({ ...form, fosforo: v })} />
        <NumberInput label="Potasio (ppm)" value={form.potasio} onChange={v => setForm({ ...form, potasio: v })} />
        <NumberInput label="Humedad (%)" value={form.humedad} onChange={v => setForm({ ...form, humedad: v })} />
        <Select label="Textura" data={TEXTURAS} value={form.textura} onChange={v => setForm({ ...form, textura: v })} />
      </SimpleGrid>
      <Group justify="flex-end" mt="xl">
        <Button variant="default" onClick={onClose}>Cancelar</Button>
        <Button onClick={handle}>Guardar</Button>
      </Group>
    </Modal>
  )
}

export default function FichaCultivo() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const siembraId = searchParams.get('id')

  const [siembras, setSiembras] = useState([])
  const [siembra, setSiembra] = useState(null)
  const [lotes, setLotes] = useState([])
  const [variedades, setVariedades] = useState([])
  const [labores, setLabores] = useState([])
  const [cosechasList, setCosechasList] = useState([])
  const [analisis, setAnalisis] = useState([])
  const [loading, setLoading] = useState(false)
  const [editForm, setEditForm] = useState({})

  const [salud, setSalud] = useState(null)
  const [validacion, setValidacion] = useState(null)

  const [laborOpened, { open: openLabor, close: closeLabor }] = useDisclosure(false)
  const [cosechaOpened, { open: openCosecha, close: closeCosecha }] = useDisclosure(false)
  const [analOpened, { open: openAnal, close: closeAnal }] = useDisclosure(false)
  const [reportOpened, { open: openReport, close: closeReport }] = useDisclosure(false)

  useEffect(() => {
    const loadSelects = async () => {
      const [sRes, lRes] = await Promise.all([
        api.get('/cultivos/'),
        api.get('/lotes/'),
      ])
      setSiembras(sRes.data)
      setLotes(lRes.data)
    }
    loadSelects()
  }, [])

  useEffect(() => {
    if (!siembraId) return
    loadSiembra(siembraId)
  }, [siembraId])

  const loadSiembra = async (id) => {
    setLoading(true)
    try {
      const [sRes, vRes] = await Promise.all([
        api.get(`/cultivos/${id}`),
        api.get('/cultivos/variedades/'),
      ])
      setSiembra(sRes.data)
      setEditForm(sRes.data)
      setVariedades(vRes.data)

      if (sRes.data.lote_id) {
        const [labRes, cosRes, anaRes, salRes, valRes] = await Promise.all([
          api.get(`/labores/?lote_id=${sRes.data.lote_id}`),
          api.get(`/cultivos/${id}/cosechas`),
          api.get(`/lotes/${sRes.data.lote_id}/analisis`),
          api.get(`/cultivos/${id}/salud`).catch(() => null),
          api.get(`/cultivos/lotes/${sRes.data.lote_id}/validar-uso`).catch(() => null),
        ])
        setLabores(labRes.data)
        setCosechasList(cosRes.data)
        setAnalisis(anaRes.data)
        if (salRes) setSalud(salRes.data)
        if (valRes) setValidacion(valRes.data)
      }
    } catch (err) {
      notifications.show({ title: 'Error al cargar datos', color: 'red' })
    } finally {
      setLoading(false)
    }
  }

  const refreshLabores = async () => {
    if (!siembra?.lote_id) return
    const { data } = await api.get(`/labores/?lote_id=${siembra.lote_id}`)
    setLabores(data)
  }

  const refreshCosechas = async () => {
    if (!siembraId) return
    const { data } = await api.get(`/cultivos/${siembraId}/cosechas`)
    setCosechasList(data)
  }

  const refreshAnalisis = async () => {
    if (!siembra?.lote_id) return
    const { data } = await api.get(`/lotes/${siembra.lote_id}/analisis`)
    setAnalisis(data)
  }

  const refreshSalud = async () => {
    if (!siembraId) return
    const { data } = await api.get(`/cultivos/${siembraId}/salud`)
    setSalud(data)
  }

  const refreshValidacion = async () => {
    if (!siembra?.lote_id) return
    const { data } = await api.get(`/cultivos/lotes/${siembra.lote_id}/validar-uso`)
    setValidacion(data)
  }

  const [reportForm, setReportForm] = useState({
    ubicacion: '', tipo_afectacion: 'plaga', severidad: 'leve', observaciones: '',
  })

  const handleReport = async () => {
    try {
      await api.post(`/cultivos/${siembraId}/marcar-planta`, reportForm)
      notifications.show({ title: 'Problema reportado', color: 'green' })
      closeReport()
      setReportForm({ ubicacion: '', tipo_afectacion: 'plaga', severidad: 'leve', observaciones: '' })
      refreshSalud()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail, color: 'red' })
    }
  }

  const handleUpdateSiembra = async () => {
    try {
      await api.put(`/cultivos/${siembraId}`, editForm)
      notifications.show({ title: 'Datos actualizados', color: 'green' })
      setSiembra({ ...editForm })
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail, color: 'red' })
    }
  }

  const handleSelectSiembra = (id) => {
    setSearchParams({ id })
  }

  const lote = useMemo(() => lotes.find(l => l.id === siembra?.lote_id), [lotes, siembra])

  const tratamientos = useMemo(
    () => labores.filter(l => l.tipo === 'control_plagas' || l.tipo === 'fertilizacion'),
    [labores]
  )

  const timelineEvents = useMemo(() => {
    const events = []
    if (siembra) {
      events.push({
        fecha: siembra.fecha_siembra,
        tipo: 'siembra',
        icon: IconPlant,
        color: 'green',
        label: 'Siembra',
        detail: `${siembra.cultivo} - Área: ${siembra.area_ha} ha`,
      })
      if (siembra.fecha_cosecha_estimada) {
        events.push({
          fecha: siembra.fecha_cosecha_estimada,
          tipo: 'cosecha_est',
          icon: IconClock,
          color: 'yellow',
          label: 'Cosecha Estimada',
          detail: 'Fecha proyectada de cosecha',
        })
      }
    }
    labores.forEach(l => {
      events.push({
        fecha: l.fecha,
        tipo: `labor_${l.tipo}`,
        icon: l.tipo === 'control_plagas' || l.tipo === 'fertilizacion' ? IconSpray : IconTractor,
        color: 'blue',
        label: l.tipo.replace(/_/g, ' '),
        detail: `${l.descripcion || ''} — Horas: ${l.horas || '-'} | Costo: ${l.costo ? formatCOP(l.costo) : '-'}`,
      })
    })
    cosechasList.forEach(c => {
      events.push({
        fecha: c.fecha,
        tipo: 'cosecha',
        icon: IconBasket,
        color: 'teal',
        label: 'Cosecha',
        detail: `${formatNumber(c.cantidad_kg)} kg — ${c.calidad || ''} | ${c.metodo || ''}`,
      })
    })
    events.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    return events
  }, [siembra, labores, cosechasList])

  const loteName = lote?.nombre || '-'

  if (!siembraId) {
    return (
      <Stack>
        <Title order={3}>Ficha de Cultivo</Title>
        <Paper withBorder p="xl">
          <Stack align="center" gap="md">
            <IconPlant size={48} stroke={1.2} style={{ color: 'var(--mantine-color-dimmed)' }} />
            <Text c="dimmed">Selecciona una siembra para ver su ficha completa</Text>
            <Select
              placeholder="Buscar siembra..."
              data={siembras.map(s => ({
                value: s.id.toString(),
                label: `${s.cultivo} — ${lotes.find(l => l.id === s.lote_id)?.nombre || 'Lote ' + s.lote_id} (${s.fecha_siembra})`,
              }))}
              onChange={handleSelectSiembra}
              searchable
              clearable
              style={{ width: 480 }}
              size="md"
            />
          </Stack>
        </Paper>
      </Stack>
    )
  }

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    )
  }

  if (!siembra) {
    return (
      <Center h={200}>
        <Text c="dimmed">No se encontró la siembra</Text>
      </Center>
    )
  }

  return (
    <Stack gap="md">
      <Button variant="light" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/cultivos')}>
        Volver a Cultivos
      </Button>

      {/* Header Card */}
      <Paper withBorder p="md" bg="green.0">
        <Group justify="space-between" wrap="wrap">
          <Group>
            <ThemeIcon size="lg" radius="xl" color="green" variant="light">
              <IconPlant size={20} />
            </ThemeIcon>
            <div>
              <Title order={3} tt="capitalize">{siembra.cultivo}</Title>
              <Group gap="xs" mt={2}>
                <IconCalendar size={14} style={{ opacity: 0.6 }} />
                <Text size="sm" c="dimmed">{siembra.fecha_siembra}</Text>
                <Text size="sm" c="dimmed">•</Text>
                <Text size="sm" fw={500}>{loteName}</Text>
                <Text size="sm" c="dimmed">•</Text>
                <Text size="sm">{siembra.area_ha} ha</Text>
              </Group>
            </div>
          </Group>
          <Badge size="lg" color={ESTADO_COLOR[siembra.estado] || 'gray'}>
            {siembra.estado}
          </Badge>
        </Group>
      </Paper>

      {/* Area Validation Card */}
      {validacion && (
        <Paper withBorder p="md" bg={validacion.warnings?.length > 0 ? 'red.0' : 'blue.0'}>
          <Group justify="space-between" wrap="wrap">
            <Group>
              <ThemeIcon size="lg" radius="xl" color={validacion.warnings?.length > 0 ? 'red' : 'blue'} variant="light">
                <IconMapPin size={20} />
              </ThemeIcon>
              <div>
                <Text fw={600}>Validación de Uso del Lote</Text>
                <Group gap="xs" mt={2}>
                  <Text size="sm">Área del lote: <b>{validacion.area_ha} ha</b></Text>
                  <Text size="sm" c="dimmed">|</Text>
                  <Text size="sm">Cultivado: <b>{validacion.area_cultivada} ha</b></Text>
                  <Text size="sm" c="dimmed">|</Text>
                  <Text size="sm" c={validacion.area_disponible < 0 ? 'red' : 'green'}>
                    Disponible: <b>{validacion.area_disponible} ha</b>
                  </Text>
                </Group>
                {validacion.warnings?.map((w, i) => (
                  <Text key={i} size="sm" c="red" mt={4}>
                    <IconAlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {w}
                  </Text>
                ))}
              </div>
            </Group>
            <Button variant="light" size="xs" color={validacion.warnings?.length > 0 ? 'red' : 'blue'} onClick={refreshValidacion}>
              Recalcular
            </Button>
          </Group>
        </Paper>
      )}

      {/* Accordion Sections */}
      <Accordion defaultValue="salud">
        {/* 1. Datos de Siembra */}
        <Accordion.Item value="datos">
          <Accordion.Control icon={<IconEdit size={18} />}>
            <Text fw={600}>Datos de Siembra</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Paper withBorder p="md">
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                <Select
                  label="Cultivo"
                  data={TIPOS_CULTIVO}
                  value={editForm.cultivo}
                  onChange={v => setEditForm({ ...editForm, cultivo: v })}
                  searchable
                />
                <Select
                  label="Lote"
                  data={lotes.map(l => ({ value: l.id.toString(), label: `${l.nombre} (${l.area_ha} ha)` }))}
                  value={editForm.lote_id?.toString()}
                  onChange={v => setEditForm({ ...editForm, lote_id: parseInt(v) })}
                  searchable
                />
                <Select
                  label="Variedad"
                  data={variedades.filter(v => v.cultivo === editForm.cultivo).map(v => ({ value: v.id.toString(), label: v.variedad }))}
                  value={editForm.variedad_id?.toString()}
                  onChange={v => setEditForm({ ...editForm, variedad_id: v ? parseInt(v) : null })}
                  clearable
                />
                <TextInput label="Fecha Siembra" type="date" value={editForm.fecha_siembra || ''} onChange={e => setEditForm({ ...editForm, fecha_siembra: e.target.value })} />
                <TextInput label="Fecha Cosecha Est." type="date" value={editForm.fecha_cosecha_estimada || ''} onChange={e => setEditForm({ ...editForm, fecha_cosecha_estimada: e.target.value })} />
                <NumberInput label="Área (ha)" value={editForm.area_ha} onChange={v => setEditForm({ ...editForm, area_ha: v })} min={0} />
                <Select
                  label="Método de Siembra"
                  data={METODOS_SIEMBRA}
                  value={editForm.metodo_siembra}
                  onChange={v => setEditForm({ ...editForm, metodo_siembra: v })}
                />
                <Select
                  label="Estado"
                  data={['activo','cosechado','perdido','planificado']}
                  value={editForm.estado}
                  onChange={v => setEditForm({ ...editForm, estado: v })}
                />
              </SimpleGrid>
              <Group justify="flex-end" mt="md">
                <Button onClick={handleUpdateSiembra} leftSection={<IconCircleCheck size={16} />}>
                  Guardar Cambios
                </Button>
              </Group>
            </Paper>
          </Accordion.Panel>
        </Accordion.Item>

        {/* 2. Labores de Campo */}
        <Accordion.Item value="labores">
          <Accordion.Control icon={<IconTractor size={18} />}>
            <Text fw={600}>Labores de Campo ({labores.length})</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Group justify="flex-end" mb="sm">
              <Button leftSection={<IconPlus size={16} />} onClick={openLabor} size="sm">
                Nueva Labor
              </Button>
            </Group>
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Tipo</Table.Th>
                    <Table.Th>Descripción</Table.Th>
                    <Table.Th>Horas</Table.Th>
                    <Table.Th>Trab.</Table.Th>
                    <Table.Th>Costo</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {labores.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6}><Text c="dimmed" ta="center" py="sm">Sin labores registradas</Text></Table.Td>
                    </Table.Tr>
                  ) : (
                    labores.map((l, i) => (
                      <Table.Tr key={l.id || i}>
                        <Table.Td>{l.fecha}</Table.Td>
                        <Table.Td>
                          <Badge color={l.tipo === 'control_plagas' ? 'red' : l.tipo === 'fertilizacion' ? 'orange' : 'blue'} size="sm">
                            {l.tipo.replace(/_/g, ' ')}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{l.descripcion || '-'}</Table.Td>
                        <Table.Td>{l.horas != null ? l.horas : '-'}</Table.Td>
                        <Table.Td>{l.trabajadores != null ? l.trabajadores : '-'}</Table.Td>
                        <Table.Td>{l.costo ? formatCOP(l.costo) : '-'}</Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Accordion.Panel>
        </Accordion.Item>

        {/* 3. Tratamientos Fitosanitarios */}
        <Accordion.Item value="tratamientos">
          <Accordion.Control icon={<IconSpray size={18} />}>
            <Text fw={600}>Tratamientos Fitosanitarios ({tratamientos.length})</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Tipo</Table.Th>
                    <Table.Th>Descripción</Table.Th>
                    <Table.Th>Horas</Table.Th>
                    <Table.Th>Trab.</Table.Th>
                    <Table.Th>Costo</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {tratamientos.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6}><Text c="dimmed" ta="center" py="sm">Sin tratamientos registrados</Text></Table.Td>
                    </Table.Tr>
                  ) : (
                    tratamientos.map((t, i) => (
                      <Table.Tr key={t.id || i}>
                        <Table.Td>{t.fecha}</Table.Td>
                        <Table.Td>
                          <Badge color={t.tipo === 'control_plagas' ? 'red' : 'orange'} size="sm">
                            {t.tipo.replace(/_/g, ' ')}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{t.descripcion || '-'}</Table.Td>
                        <Table.Td>{t.horas != null ? t.horas : '-'}</Table.Td>
                        <Table.Td>{t.trabajadores != null ? t.trabajadores : '-'}</Table.Td>
                        <Table.Td>{t.costo ? formatCOP(t.costo) : '-'}</Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Accordion.Panel>
        </Accordion.Item>

        {/* 4. Cosechas */}
        <Accordion.Item value="cosechas">
          <Accordion.Control icon={<IconBasket size={18} />}>
            <Text fw={600}>Cosechas ({cosechasList.length})</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Group justify="flex-end" mb="sm">
              <Button leftSection={<IconPlus size={16} />} onClick={openCosecha} size="sm">
                Registrar Cosecha
              </Button>
            </Group>
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Cantidad (kg)</Table.Th>
                    <Table.Th>Calidad</Table.Th>
                    <Table.Th>Método</Table.Th>
                    <Table.Th>Destino</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {cosechasList.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={5}><Text c="dimmed" ta="center" py="sm">Sin cosechas registradas</Text></Table.Td>
                    </Table.Tr>
                  ) : (
                    cosechasList.map((c, i) => (
                      <Table.Tr key={c.id || i}>
                        <Table.Td>{c.fecha}</Table.Td>
                        <Table.Td fw={500}>{formatNumber(c.cantidad_kg)}</Table.Td>
                        <Table.Td><Badge variant="light" size="sm">{c.calidad || '-'}</Badge></Table.Td>
                        <Table.Td>{c.metodo || '-'}</Table.Td>
                        <Table.Td>{c.destino || '-'}</Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Accordion.Panel>
        </Accordion.Item>

        {/* 5. Análisis de Suelo */}
        <Accordion.Item value="analisis">
          <Accordion.Control icon={<IconFlask size={18} />}>
            <Text fw={600}>Análisis de Suelo ({analisis.length})</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Group justify="flex-end" mb="sm">
              <Button leftSection={<IconPlus size={16} />} onClick={openAnal} size="sm">
                Nuevo Análisis
              </Button>
            </Group>
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>pH</Table.Th>
                    <Table.Th>N (ppm)</Table.Th>
                    <Table.Th>P (ppm)</Table.Th>
                    <Table.Th>K (ppm)</Table.Th>
                    <Table.Th>Humedad (%)</Table.Th>
                    <Table.Th>Textura</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {analisis.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={7}><Text c="dimmed" ta="center" py="sm">Sin análisis de suelo</Text></Table.Td>
                    </Table.Tr>
                  ) : (
                    analisis.map((a, i) => (
                      <Table.Tr key={a.id || i}>
                        <Table.Td>{a.fecha}</Table.Td>
                        <Table.Td>{a.ph}</Table.Td>
                        <Table.Td>{a.nitrogeno}</Table.Td>
                        <Table.Td>{a.fosforo}</Table.Td>
                        <Table.Td>{a.potasio}</Table.Td>
                        <Table.Td>{a.humedad}</Table.Td>
                        <Table.Td>{a.textura || '-'}</Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Accordion.Panel>
        </Accordion.Item>

        {/* 6. Salud del Cultivo */}
        <Accordion.Item value="salud">
          <Accordion.Control icon={<IconHeartbeat size={18} />}>
            <Text fw={600}>Salud del Cultivo {salud && <Badge size="sm" color={salud.salud_pct >= 80 ? 'green' : salud.salud_pct >= 50 ? 'yellow' : 'red'}>{salud.salud_pct}%</Badge>}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            {salud ? (
              <Stack gap="md">
                <SimpleGrid cols={{ base: 1, md: 3 }}>
                  <Card withBorder ta="center" p="md">
                    <RingProgress
                      size={140}
                      thickness={16}
                      sections={[{ value: salud.salud_pct, color: salud.salud_pct >= 80 ? 'green' : salud.salud_pct >= 50 ? 'yellow' : 'red' }]}
                      label={
                        <Text ta="center" size="xl" fw={700}>
                          {salud.salud_pct}%
                        </Text>
                      }
                    />
                    <Text size="sm" c="dimmed">Plantas sanas</Text>
                  </Card>
                  <Card withBorder ta="center" p="md">
                    <Text size="xl" fw={700} c="green">{salud.total_plantas}</Text>
                    <Text size="sm" c="dimmed">Total estimado de plantas</Text>
                  </Card>
                  <Card withBorder ta="center" p="md">
                    <Text size="xl" fw={700} c="red">{salud.plantas_afectadas}</Text>
                    <Text size="sm" c="dimmed">Plantas afectadas</Text>
                  </Card>
                </SimpleGrid>

                <Group justify="space-between">
                  <Text fw={600}>Casos reportados ({salud.casos?.length || 0})</Text>
                  <Button leftSection={<IconPlus size={16} />} onClick={openReport} size="sm">
                    Reportar problema
                  </Button>
                </Group>

                <Paper withBorder>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Fecha</Table.Th>
                        <Table.Th>Tipo</Table.Th>
                        <Table.Th>Severidad</Table.Th>
                        <Table.Th>Ubicación</Table.Th>
                        <Table.Th>Observaciones</Table.Th>
                        <Table.Th>Estado</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {salud.casos?.length === 0 ? (
                        <Table.Tr>
                          <Table.Td colSpan={6}><Text c="dimmed" ta="center" py="sm">Sin problemas reportados</Text></Table.Td>
                        </Table.Tr>
                      ) : (
                        salud.casos?.map((c, i) => (
                          <Table.Tr key={c.id || i}>
                            <Table.Td>{c.fecha_deteccion}</Table.Td>
                            <Table.Td>
                              <Badge color={c.tipo_afectacion === 'plaga' ? 'orange' : c.tipo_afectacion === 'enfermedad' ? 'red' : 'blue'} size="sm">
                                {c.tipo_afectacion}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Badge color={c.severidad === 'alta' ? 'red' : c.severidad === 'media' ? 'yellow' : 'green'} size="sm">
                                {c.severidad}
                              </Badge>
                            </Table.Td>
                            <Table.Td>{c.ubicacion || '-'}</Table.Td>
                            <Table.Td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.observaciones || '-'}</Table.Td>
                            <Table.Td><Badge variant="light" size="sm">{c.estado_actual || 'activo'}</Badge></Table.Td>
                          </Table.Tr>
                        ))
                      )}
                    </Table.Tbody>
                  </Table>
                </Paper>
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="md">No se pudo cargar información de salud</Text>
            )}
          </Accordion.Panel>
        </Accordion.Item>

        {/* 7. Línea de Tiempo */}
        <Accordion.Item value="timeline">
          <Accordion.Control icon={<IconTimeline size={18} />}>
            <Text fw={600}>Línea de Tiempo</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Paper withBorder p="md">
              {timelineEvents.length === 0 ? (
                <Text c="dimmed" ta="center" py="md">Sin eventos registrados</Text>
              ) : (
                <Stack gap={0}>
                  {timelineEvents.map((ev, i) => (
                    <Group key={i} wrap="nowrap" gap="md" py="sm" style={{ borderBottom: i < timelineEvents.length - 1 ? '1px solid var(--mantine-color-gray-2)' : 'none' }}>
                      <div style={{ minWidth: 100 }}>
                        <Text size="sm" fw={500}>{ev.fecha}</Text>
                      </div>
                      <ThemeIcon size="md" radius="xl" color={ev.color} variant="light">
                        <ev.icon size={16} />
                      </ThemeIcon>
                      <div style={{ flex: 1 }}>
                        <Text size="sm" fw={600} tt="capitalize">{ev.label}</Text>
                        <Text size="xs" c="dimmed">{ev.detail}</Text>
                      </div>
                    </Group>
                  ))}
                </Stack>
              )}
            </Paper>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      {/* Modals */}
      <LaborModal
        opened={laborOpened}
        onClose={closeLabor}
        onSubmit={refreshLabores}
        loteId={siembra?.lote_id}
      />
      <CosechaModal
        opened={cosechaOpened}
        onClose={closeCosecha}
        onSubmit={refreshCosechas}
        siembraId={siembraId}
        loteId={siembra?.lote_id}
      />
      <AnalisisModal
        opened={analOpened}
        onClose={closeAnal}
        onSubmit={refreshAnalisis}
        loteId={siembra?.lote_id}
      />

      {/* Reportar Problema Modal */}
      <Modal opened={reportOpened} onClose={closeReport} title="Reportar Problema en Cultivo" size="md">
        <Stack gap="sm">
          <Select
            label="Tipo de afectación"
            data={[
              { value: 'plaga', label: 'Plaga' },
              { value: 'enfermedad', label: 'Enfermedad' },
              { value: 'maleza', label: 'Maleza' },
              { value: 'deficiencia', label: 'Deficiencia nutricional' },
              { value: 'otro', label: 'Otro' },
            ]}
            value={reportForm.tipo_afectacion}
            onChange={v => setReportForm({ ...reportForm, tipo_afectacion: v })}
          />
          <Select
            label="Severidad"
            data={[
              { value: 'leve', label: 'Leve' },
              { value: 'media', label: 'Media' },
              { value: 'alta', label: 'Alta' },
            ]}
            value={reportForm.severidad}
            onChange={v => setReportForm({ ...reportForm, severidad: v })}
          />
          <TextInput
            label="Ubicación"
            placeholder="Ej: fila 3, planta 15 | o coordenadas GPS"
            value={reportForm.ubicacion}
            onChange={e => setReportForm({ ...reportForm, ubicacion: e.target.value })}
          />
          <Textarea
            label="Observaciones"
            placeholder="Describe el problema..."
            value={reportForm.observaciones}
            onChange={e => setReportForm({ ...reportForm, observaciones: e.target.value })}
          />
        </Stack>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={closeReport}>Cancelar</Button>
          <Button onClick={handleReport} leftSection={<IconBug size={16} />}>Guardar</Button>
        </Group>
      </Modal>
    </Stack>
  )
}
