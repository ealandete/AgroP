import { useEffect, useState, useMemo } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, ActionIcon, Stack, SimpleGrid,
  Text, Textarea, Card, Tooltip, Loader, Center, Divider,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useNavigate } from 'react-router-dom'
import {
  IconPlus, IconEdit, IconSearch, IconEye, IconTrash,
  IconAlertTriangle, IconCalendarEvent, IconList, IconPlant,
  IconRipple, IconArrowBack,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import api from '../services/api.js'
import { formatNumber, TIPOS_CULTIVO } from '../config.js'
import MobileTable from '../components/MobileTable.jsx'

const ESTADO_COLOR = { activo: 'green', cosechado: 'blue', perdido: 'red', planificado: 'yellow' }
const METODOS_SIEMBRA = ['directa', 'trasplante', 'voleo', 'surcos']
const ESTADOS_FILTRO = [
  { value: 'activo', label: 'Activo' },
  { value: 'cosechado', label: 'Cosechado' },
  { value: 'perdido', label: 'Perdido' },
  { value: 'planificado', label: 'Planificado' },
]

const initialForm = {
  cultivo: 'maiz', lote_id: '', variedad_id: '',
  fecha_siembra: new Date().toISOString().split('T')[0],
  fecha_cosecha_estimada: '', area_ha: '', cantidad_semilla: '',
  metodo_siembra: 'directa', estado: 'activo', observaciones: '',
}

function validateSiembraForm(form) {
  const errors = {}
  if (!form.cultivo) errors.cultivo = 'El cultivo es obligatorio'
  if (!form.lote_id) errors.lote_id = 'El lote es obligatorio'
  if (!form.fecha_siembra) errors.fecha_siembra = 'La fecha de siembra es obligatoria'
  if (form.area_ha !== '' && form.area_ha !== null && Number(form.area_ha) <= 0) errors.area_ha = 'El área debe ser mayor a 0'
  return errors
}

export default function Cultivos() {
  const navigate = useNavigate()
  const [siembras, setSiembras] = useState([])
  const [variedades, setVariedades] = useState([])
  const [lotes, setLotes] = useState([])
  const [actividadesCount, setActividadesCount] = useState({})
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState(null)
  const [filtroLote, setFiltroLote] = useState(null)

  const [nuevaOpened, { open: openNueva, close: closeNueva }] = useDisclosure(false)
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const [cosechaOpened, { open: openCosecha, close: closeCosecha }] = useDisclosure(false)
  const [perderOpened, { open: openPerder, close: closePerder }] = useDisclosure(false)
  const [eliminarOpened, { open: openEliminar, close: closeEliminar }] = useDisclosure(false)

  const [nuevaForm, setNuevaForm] = useState({ ...initialForm })
  const [editForm, setEditForm] = useState({})
  const [editId, setEditId] = useState(null)
  const [nuevaErrors, setNuevaErrors] = useState({})
  const [editErrors, setEditErrors] = useState({})
  const [cosechaForm, setCosechaForm] = useState({
    fecha: new Date().toISOString().split('T')[0], cantidad_kg: '',
    calidad: '', humedad_pct: '', metodo: '', destino: '', observaciones: '',
  })
  const [cosechaSiembraId, setCosechaSiembraId] = useState(null)
  const [cosechaLoteId, setCosechaLoteId] = useState(null)
  const [perderId, setPerderId] = useState(null)
  const [eliminarId, setEliminarId] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [s, v, l, a] = await Promise.all([
        api.get('/cultivos/'),
        api.get('/cultivos/variedades/'),
        api.get('/lotes/'),
        api.get('/plan-actividades/').catch(() => ({ data: [] })),
      ])
      setSiembras(s.data)
      setVariedades(v.data)
      setLotes(l.data)

      const counts = {}
      const actividades = Array.isArray(a.data) ? a.data : []
      actividades.forEach(act => {
        if (act.siembra_id) {
          counts[act.siembra_id] = (counts[act.siembra_id] || 0) + 1
        }
      })
      setActividadesCount(counts)
    } catch (err) {
      notifications.show({ title: 'Error al cargar datos', color: 'red' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filtered = useMemo(() => {
    return siembras.filter(s => {
      if (search && !s.cultivo.toLowerCase().includes(search.toLowerCase())) return false
      if (filtroEstado && s.estado !== filtroEstado) return false
      if (filtroLote && s.lote_id !== parseInt(filtroLote)) return false
      return true
    })
  }, [siembras, search, filtroEstado, filtroLote])

  const cultivoOptions = useMemo(() => {
    const dbValues = new Set(siembras.map(s => s.cultivo).filter(Boolean))
    return [...new Set([...TIPOS_CULTIVO, ...dbValues])]
  }, [siembras])

  const summary = useMemo(() => {
    const activas = siembras.filter(s => s.estado === 'activo').length
    const areaTotal = siembras.reduce((sum, s) => sum + (parseFloat(s.area_ha) || 0), 0)
    const conRendimiento = siembras.filter(s => s.rendimiento_ha)
    const rendimientoPromedio = conRendimiento.length
      ? conRendimiento.reduce((sum, s) => sum + parseFloat(s.rendimiento_ha), 0) / conRendimiento.length
      : 0
    return { activas, areaTotal, rendimientoPromedio }
  }, [siembras])

  const setNuevaField = (field, value) => {
    const updated = { ...nuevaForm, [field]: value }
    setNuevaForm(updated)
    const newErrors = { ...nuevaErrors }
    const allErrors = validateSiembraForm(updated)
    if (allErrors[field]) newErrors[field] = allErrors[field]
    else delete newErrors[field]
    setNuevaErrors(newErrors)
  }

  const isNuevaValid = Object.keys(validateSiembraForm(nuevaForm)).length === 0

  const handleNuevaSiembra = async () => {
    const validationErrors = validateSiembraForm(nuevaForm)
    setNuevaErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return
    try {
      await api.post('/cultivos/', nuevaForm)
      notifications.show({ title: 'Siembra registrada', color: 'green' })
      closeNueva()
      setNuevaForm({ ...initialForm })
      setNuevaErrors({})
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail, color: 'red' })
    }
  }

  const handleEditSiembra = (s) => {
    setEditId(s.id)
    setEditForm({
      cultivo: s.cultivo || 'maiz',
      lote_id: s.lote_id?.toString() || '',
      variedad_id: s.variedad_id?.toString() || '',
      fecha_siembra: s.fecha_siembra || '',
      fecha_cosecha_estimada: s.fecha_cosecha_estimada || '',
      area_ha: s.area_ha || '',
      cantidad_semilla: s.cantidad_semilla || '',
      metodo_siembra: s.metodo_siembra || 'directa',
      estado: s.estado || 'activo',
      observaciones: s.observaciones || '',
    })
    setEditErrors({})
    openEdit()
  }

  const setEditField = (field, value) => {
    const updated = { ...editForm, [field]: value }
    setEditForm(updated)
    const newErrors = { ...editErrors }
    const allErrors = validateSiembraForm(updated)
    if (allErrors[field]) newErrors[field] = allErrors[field]
    else delete newErrors[field]
    setEditErrors(newErrors)
  }

  const isEditValid = Object.keys(validateSiembraForm(editForm)).length === 0

  const handleUpdateSiembra = async () => {
    const validationErrors = validateSiembraForm(editForm)
    setEditErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return
    try {
      await api.put(`/cultivos/${editId}`, editForm)
      notifications.show({ title: 'Siembra actualizada', color: 'green' })
      closeEdit()
      setEditId(null)
      setEditErrors({})
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail, color: 'red' })
    }
  }

  const handleOpenCosecha = (s) => {
    setCosechaSiembraId(s.id)
    setCosechaLoteId(s.lote_id)
    setCosechaForm({
      fecha: new Date().toISOString().split('T')[0],
      cantidad_kg: '', calidad: '', humedad_pct: '',
      metodo: '', destino: '', observaciones: '',
    })
    openCosecha()
  }

  const handleRegistrarCosecha = async () => {
    try {
      await api.post(`/cultivos/${cosechaSiembraId}/cosechas`, {
        siembra_id: cosechaSiembraId,
        lote_id: cosechaLoteId,
        ...cosechaForm,
      })
      notifications.show({ title: 'Cosecha registrada', color: 'green' })
      closeCosecha()
      setCosechaSiembraId(null)
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail, color: 'red' })
    }
  }

  const handleOpenPerder = (id) => {
    setPerderId(id)
    openPerder()
  }

  const handleMarcarPerdido = async () => {
    try {
      const s = siembras.find(s => s.id === perderId)
      await api.put(`/cultivos/${perderId}`, { ...s, estado: 'perdido' })
      notifications.show({ title: 'Siembra marcada como perdida', color: 'orange' })
      closePerder()
      setPerderId(null)
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail, color: 'red' })
    }
  }

  const handleOpenEliminar = (id) => {
    setEliminarId(id)
    openEliminar()
  }

  const handleEliminar = async () => {
    try {
      await api.delete(`/cultivos/${eliminarId}`)
      notifications.show({ title: 'Siembra eliminada', color: 'green' })
      closeEliminar()
      setEliminarId(null)
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail, color: 'red' })
    }
  }

  const handleCrearActividad = (s) => {
    navigate('/planeacion')
  }

  const diasDesdeSiembra = (fecha) => {
    if (!fecha) return '-'
    const diff = dayjs().diff(dayjs(fecha), 'day')
    return diff >= 0 ? `${diff} días` : '0 días'
  }

  const loteNombre = (id) => {
    const l = lotes.find(l => l.id === id)
    return l?.nombre || `Lote #${id}`
  }

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    )
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Gestión de Cultivos</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setNuevaErrors({}); openNueva() }}>Nueva Siembra</Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Card withBorder padding="md" radius="md">
          <Group>
            <IconPlant size={24} color="var(--mantine-color-green-6)" />
            <div>
              <Text size="xs" c="dimmed">Siembras Activas</Text>
              <Text size="xl" fw={700}>{summary.activas}</Text>
            </div>
          </Group>
        </Card>
        <Card withBorder padding="md" radius="md">
          <Group>
            <IconRipple size={24} color="var(--mantine-color-blue-6)" />
            <div>
              <Text size="xs" c="dimmed">Área Cultivada (ha)</Text>
              <Text size="xl" fw={700}>{formatNumber(summary.areaTotal)}</Text>
            </div>
          </Group>
        </Card>
        <Card withBorder padding="md" radius="md">
          <Group>
            <IconList size={24} color="var(--mantine-color-violet-6)" />
            <div>
              <Text size="xs" c="dimmed">Rendimiento Promedio (kg/ha)</Text>
              <Text size="xl" fw={700}>{summary.rendimientoPromedio ? formatNumber(summary.rendimientoPromedio) : '-'}</Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>

      <Paper p="sm" radius="md" withBorder>
        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Buscar por cultivo..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <Select
            placeholder="Filtrar estado"
            clearable
            data={ESTADOS_FILTRO}
            value={filtroEstado}
            onChange={setFiltroEstado}
            style={{ width: 160 }}
          />
          <Select
            placeholder="Filtrar lote"
            clearable
            data={lotes.map(l => ({ value: l.id.toString(), label: l.nombre }))}
            value={filtroLote}
            onChange={setFiltroLote}
            style={{ width: 200 }}
            searchable
          />
        </Group>
      </Paper>

      <MobileTable
        columns={[
          { key: 'fecha', label: 'Fecha Siembra', render: s => s.fecha_siembra },
          { key: 'cultivo', label: 'Cultivo', render: s => <Text span fw={500} tt="capitalize">{s.cultivo}</Text> },
          { key: 'variedad', label: 'Variedad', render: s => variedades.find(v => v.id === s.variedad_id)?.variedad || '-', hideOnMobile: true },
          { key: 'lote', label: 'Lote', render: s => loteNombre(s.lote_id) },
          { key: 'area', label: 'Área (ha)', render: s => s.area_ha, hideOnMobile: true },
          { key: 'estado', label: 'Estado', render: s => <Badge color={ESTADO_COLOR[s.estado] || 'gray'} variant="light">{s.estado}</Badge> },
          { key: 'dias', label: 'Días', render: s => <Text size="sm" c={dayjs().diff(dayjs(s.fecha_siembra), 'day') > 365 ? 'red' : 'dimmed'}>{diasDesdeSiembra(s.fecha_siembra)}</Text>, hideOnMobile: true },
          { key: 'act', label: 'Act.', render: s => <Badge size="sm" variant="light" color="teal">{actividadesCount[s.id] || 0}</Badge>, hideOnMobile: true },
          { key: 'acciones', label: 'Acciones', render: s => (
            <Group gap={4} wrap="nowrap">
              <Tooltip label="Editar"><ActionIcon variant="light" color="blue" size="sm" onClick={(e) => { e?.stopPropagation?.(); handleEditSiembra(s) }}><IconEdit size={14} /></ActionIcon></Tooltip>
              <Tooltip label="Ver detalle"><ActionIcon variant="light" color="teal" size="sm" onClick={(e) => { e?.stopPropagation?.(); navigate(`/cultivos/ficha?id=${s.id}`) }}><IconEye size={14} /></ActionIcon></Tooltip>
              <Tooltip label="Registrar cosecha"><ActionIcon variant="light" color="green" size="sm" onClick={(e) => { e?.stopPropagation?.(); handleOpenCosecha(s) }}><IconArrowBack size={14} /></ActionIcon></Tooltip>
              <Tooltip label="Crear actividad"><ActionIcon variant="light" color="violet" size="sm" onClick={(e) => { e?.stopPropagation?.(); handleCrearActividad(s) }}><IconCalendarEvent size={14} /></ActionIcon></Tooltip>
              {s.estado === 'activo' && (
                <Tooltip label="Marcar como perdido"><ActionIcon variant="light" color="orange" size="sm" onClick={(e) => { e?.stopPropagation?.(); handleOpenPerder(s.id) }}><IconAlertTriangle size={14} /></ActionIcon></Tooltip>
              )}
              <Tooltip label="Eliminar"><ActionIcon variant="light" color="red" size="sm" onClick={(e) => { e?.stopPropagation?.(); handleOpenEliminar(s.id) }}><IconTrash size={14} /></ActionIcon></Tooltip>
            </Group>
          )},
        ]}
        data={filtered}
      />

      <Modal opened={nuevaOpened} onClose={closeNueva} title="Nueva Siembra" size="lg">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select label="Cultivo" data={cultivoOptions} value={nuevaForm.cultivo} onChange={v => setNuevaField('cultivo', v)} searchable required error={nuevaErrors.cultivo} />
          <Select label="Lote" data={lotes.map(l => ({ value: l.id.toString(), label: `${l.nombre} (${l.area_ha} ha)` }))} value={nuevaForm.lote_id} onChange={v => setNuevaField('lote_id', v)} searchable required error={nuevaErrors.lote_id} />
          <Select label="Variedad" data={variedades.filter(v => v.cultivo === nuevaForm.cultivo).map(v => ({ value: v.id.toString(), label: v.variedad }))} value={nuevaForm.variedad_id} onChange={v => setNuevaForm({ ...nuevaForm, variedad_id: v })} clearable />
          <Select label="Método Siembra" data={METODOS_SIEMBRA} value={nuevaForm.metodo_siembra} onChange={v => setNuevaForm({ ...nuevaForm, metodo_siembra: v })} />
          <TextInput label="Fecha Siembra" type="date" value={nuevaForm.fecha_siembra} onChange={e => setNuevaField('fecha_siembra', e.target.value)} required error={nuevaErrors.fecha_siembra} />
          <TextInput label="Fecha Cosecha Est." type="date" value={nuevaForm.fecha_cosecha_estimada} onChange={e => setNuevaForm({ ...nuevaForm, fecha_cosecha_estimada: e.target.value })} />
          <NumberInput label="Área (ha)" value={nuevaForm.area_ha} onChange={v => setNuevaField('area_ha', v)} min={0} error={nuevaErrors.area_ha} />
          <NumberInput label="Cantidad Semilla" value={nuevaForm.cantidad_semilla} onChange={v => setNuevaForm({ ...nuevaForm, cantidad_semilla: v })} min={0} />
          <Select label="Estado" data={ESTADOS_FILTRO} value={nuevaForm.estado} onChange={v => setNuevaForm({ ...nuevaForm, estado: v })} />
        </SimpleGrid>
        <Textarea label="Observaciones" value={nuevaForm.observaciones} onChange={e => setNuevaForm({ ...nuevaForm, observaciones: e.target.value })} mt="sm" minRows={2} />
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={closeNueva}>Cancelar</Button>
          <Button onClick={handleNuevaSiembra} disabled={!isNuevaValid}>Guardar</Button>
        </Group>
      </Modal>

      <Modal opened={editOpened} onClose={closeEdit} title="Editar Siembra" size="lg">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select label="Cultivo" data={cultivoOptions} value={editForm.cultivo} onChange={v => setEditField('cultivo', v)} searchable required error={editErrors.cultivo} />
          <Select label="Lote" data={lotes.map(l => ({ value: l.id.toString(), label: `${l.nombre} (${l.area_ha} ha)` }))} value={editForm.lote_id} onChange={v => setEditField('lote_id', v)} searchable required error={editErrors.lote_id} />
          <Select label="Variedad" data={variedades.filter(v => v.cultivo === editForm.cultivo).map(v => ({ value: v.id.toString(), label: v.variedad }))} value={editForm.variedad_id} onChange={v => setEditForm({ ...editForm, variedad_id: v })} clearable />
          <Select label="Método Siembra" data={METODOS_SIEMBRA} value={editForm.metodo_siembra} onChange={v => setEditForm({ ...editForm, metodo_siembra: v })} />
          <TextInput label="Fecha Siembra" type="date" value={editForm.fecha_siembra} onChange={e => setEditField('fecha_siembra', e.target.value)} required error={editErrors.fecha_siembra} />
          <TextInput label="Fecha Cosecha Est." type="date" value={editForm.fecha_cosecha_estimada} onChange={e => setEditForm({ ...editForm, fecha_cosecha_estimada: e.target.value })} />
          <NumberInput label="Área (ha)" value={editForm.area_ha} onChange={v => setEditField('area_ha', v)} min={0} error={editErrors.area_ha} />
          <NumberInput label="Cantidad Semilla" value={editForm.cantidad_semilla} onChange={v => setEditForm({ ...editForm, cantidad_semilla: v })} min={0} />
          <Select label="Estado" data={ESTADOS_FILTRO} value={editForm.estado} onChange={v => setEditForm({ ...editForm, estado: v })} />
        </SimpleGrid>
        <Textarea label="Observaciones" value={editForm.observaciones} onChange={e => setEditForm({ ...editForm, observaciones: e.target.value })} mt="sm" minRows={2} />
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={closeEdit}>Cancelar</Button>
          <Button onClick={handleUpdateSiembra} disabled={!isEditValid}>Actualizar</Button>
        </Group>
      </Modal>

      <Modal opened={cosechaOpened} onClose={closeCosecha} title="Registrar Cosecha" size="md">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput label="Fecha" type="date" value={cosechaForm.fecha} onChange={e => setCosechaForm({ ...cosechaForm, fecha: e.target.value })} />
          <NumberInput label="Cantidad (kg)" value={cosechaForm.cantidad_kg} onChange={v => setCosechaForm({ ...cosechaForm, cantidad_kg: v })} min={0} />
          <TextInput label="Calidad" value={cosechaForm.calidad} onChange={e => setCosechaForm({ ...cosechaForm, calidad: e.target.value })} />
          <NumberInput label="Humedad (%)" value={cosechaForm.humedad_pct} onChange={v => setCosechaForm({ ...cosechaForm, humedad_pct: v })} min={0} max={100} />
          <TextInput label="Método Cosecha" value={cosechaForm.metodo} onChange={e => setCosechaForm({ ...cosechaForm, metodo: e.target.value })} />
          <TextInput label="Destino" value={cosechaForm.destino} onChange={e => setCosechaForm({ ...cosechaForm, destino: e.target.value })} />
        </SimpleGrid>
        <Textarea label="Observaciones" value={cosechaForm.observaciones} onChange={e => setCosechaForm({ ...cosechaForm, observaciones: e.target.value })} mt="sm" minRows={2} />
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={closeCosecha}>Cancelar</Button>
          <Button onClick={handleRegistrarCosecha}>Registrar</Button>
        </Group>
      </Modal>

      <Modal opened={perderOpened} onClose={closePerder} title="Marcar como Perdido" size="sm">
        <Stack align="center" gap="md" py="md">
          <IconAlertTriangle size={48} color="var(--mantine-color-orange-6)" />
          <Text ta="center">¿Estás seguro de marcar esta siembra como <b>perdida</b>? Esta acción cambiará el estado de la siembra.</Text>
        </Stack>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closePerder}>Cancelar</Button>
          <Button color="orange" onClick={handleMarcarPerdido}>Sí, marcar como perdido</Button>
        </Group>
      </Modal>

      <Modal opened={eliminarOpened} onClose={closeEliminar} title="Eliminar Siembra" size="sm">
        <Stack align="center" gap="md" py="md">
          <IconTrash size={48} color="var(--mantine-color-red-6)" />
          <Text ta="center">¿Estás seguro de eliminar esta siembra? Esta acción no se puede deshacer.</Text>
        </Stack>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeEliminar}>Cancelar</Button>
          <Button color="red" onClick={handleEliminar}>Sí, eliminar</Button>
        </Group>
      </Modal>
    </Stack>
  )
}
