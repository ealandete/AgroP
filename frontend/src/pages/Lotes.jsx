import 'leaflet/dist/leaflet.css'
import 'leaflet-draw'
import L from 'leaflet'
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import {
  Paper, Title, Group, Button, TextInput, Select, NumberInput,
  Badge, Stack, SimpleGrid, Text, Grid, ActionIcon,
  ScrollArea, Modal, Table, Textarea, Card, Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPlus, IconEdit, IconSearch,
  IconEye, IconCheck, IconX, IconEditCircle,
} from '@tabler/icons-react'
import { MapContainer, TileLayer, Polygon, Popup, useMap, CircleMarker } from 'react-leaflet'
import api from '../services/api.js'
import { formatNumber } from '../config.js'

const SUELOS = ['franco', 'arcilloso', 'arenoso', 'limoso']
const USOS = ['cultivo', 'pastoreo', 'bosque', 'descanso', 'construccion']
const EXPOSICIONES = ['norte', 'sur', 'este', 'oeste', 'noreste', 'noroeste', 'sureste', 'suroeste', 'plano']
const RIEGOS = ['secano', 'aspersion', 'goteo', 'gravedad', 'microaspersion', 'pivote_central']
const COLORES = [
  { value: '#4CAF50', label: 'Verde' },
  { value: '#8BC34A', label: 'Verde Claro' },
  { value: '#FFC107', label: 'Amarillo' },
  { value: '#FF9800', label: 'Naranja' },
  { value: '#795548', label: 'Marrón' },
]
const USO_COLORS = {
  cultivo: 'green',
  pastoreo: 'blue',
  bosque: 'teal',
  descanso: 'yellow',
  construccion: 'red',
}

function coordsToLatLng(coords) {
  if (!coords || coords.type !== 'Polygon') return []
  return coords.coordinates[0].map(([lng, lat]) => [lat, lng])
}

function FlyToLot({ lotes, selectedId }) {
  const map = useMap()
  useEffect(() => {
    if (!selectedId) return
    const lot = lotes.find(l => l.id === selectedId)
    if (!lot) return
    const coords = coordsToLatLng(lot.coordenadas)
    if (coords.length > 0) {
      map.fitBounds(coords, { padding: [50, 50] })
    } else if (lot.latitud && lot.longitud) {
      map.setView([parseFloat(lot.latitud), parseFloat(lot.longitud)], 16)
    }
  }, [selectedId, lotes, map])
  return null
}

function FitBounds({ lotes, finca }) {
  const map = useMap()
  useEffect(() => {
    const bounds = []
    lotes.forEach(l => {
      if (l.coordenadas?.coordinates?.[0]) {
        l.coordenadas.coordinates[0].forEach(([lng, lat]) => bounds.push([lat, lng]))
      } else if (l.latitud && l.longitud) {
        bounds.push([parseFloat(l.latitud), parseFloat(l.longitud)])
      }
    })
    if (finca?.coordenadas?.coordinates?.[0]) {
      finca.coordenadas.coordinates[0].forEach(([lng, lat]) => bounds.push([lat, lng]))
    }
    if (finca?.latitud && finca?.longitud) {
      bounds.push([parseFloat(finca.latitud), parseFloat(finca.longitud)])
    }
    if (bounds.length > 0) map.fitBounds(bounds, { padding: [30, 30] })
  }, [lotes, finca, map])
  return null
}

function DrawControl({ lotes, editingPolygonId, onPolygonDrawn, startDrawing }) {
  const map = useMap()
  const drawnItemsRef = useRef(null)
  const onPolygonDrawnRef = useRef(onPolygonDrawn)

  useEffect(() => {
    onPolygonDrawnRef.current = onPolygonDrawn
  }, [onPolygonDrawn])

  useEffect(() => {
    const drawnItems = new L.FeatureGroup()
    drawnItemsRef.current = drawnItems
    map.addLayer(drawnItems)

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: { allowIntersection: false, showArea: true },
        polyline: false, rectangle: false, circle: false,
        circlemarker: false, marker: false,
      },
      edit: { featureGroup: drawnItems, remove: true },
    })
    map.addControl(drawControl)

    const handleCreated = (e) => {
      drawnItems.clearLayers()
      drawnItems.addLayer(e.layer)
      onPolygonDrawnRef.current(e.layer.toGeoJSON())
    }
    const handleEdited = (e) => {
      e.layers.eachLayer(layer => onPolygonDrawnRef.current(layer.toGeoJSON()))
    }
    const handleDeleted = () => onPolygonDrawnRef.current(null)

    map.on(L.Draw.Event.CREATED, handleCreated)
    map.on(L.Draw.Event.EDITED, handleEdited)
    map.on(L.Draw.Event.DELETED, handleDeleted)

    return () => {
      map.removeControl(drawControl)
      map.removeLayer(drawnItems)
      map.off(L.Draw.Event.CREATED, handleCreated)
      map.off(L.Draw.Event.EDITED, handleEdited)
      map.off(L.Draw.Event.DELETED, handleDeleted)
    }
  }, [map])

  useEffect(() => {
    const drawnItems = drawnItemsRef.current
    if (!drawnItems) return
    drawnItems.clearLayers()
    if (!editingPolygonId) return
    const lot = lotes.find(l => l.id === editingPolygonId)
    if (lot?.coordenadas) {
      const coords = coordsToLatLng(lot.coordenadas)
      if (coords.length > 0) {
        const polygon = L.polygon(coords, {
          color: '#D32F2F', weight: 2, fillOpacity: 0.3, dashArray: '6 4',
        })
        drawnItems.addLayer(polygon)
        map.fitBounds(polygon.getBounds(), { padding: [50, 50] })
      }
    }
  }, [editingPolygonId, lotes, map])

  useEffect(() => {
    if (startDrawing > 0) {
      const handler = new L.Draw.Polygon(map, {
        allowIntersection: false, showArea: true,
      })
      handler.enable()
    }
  }, [startDrawing, map])

  return null
}

function MapaLotes({ lotes, finca, selectedId, onSelect, editingPolygonId, onPolygonDrawn, startDrawing }) {
  return (
    <Paper withBorder style={{ height: 500, overflow: 'hidden', position: 'relative' }}>
      <MapContainer
        center={[parseFloat(finca?.latitud || 10.7535), parseFloat(finca?.longitud || -74.678)]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {finca?.coordenadas && (
          <Polygon
            positions={coordsToLatLng(finca.coordenadas)}
            pathOptions={{
              color: '#666', weight: 2, opacity: 0.6,
              fill: false, dashArray: '8 6',
            }}
          >
            <Popup><b>Límite de finca: {finca.nombre}</b></Popup>
          </Polygon>
        )}

        {finca?.latitud != null && finca?.longitud != null && (
          <CircleMarker
            center={[parseFloat(finca.latitud), parseFloat(finca.longitud)]}
            radius={8}
            pathOptions={{ color: '#666', fillColor: '#666', fillOpacity: 0.8, weight: 2 }}
          >
            <Popup>
              <b>{finca.nombre}</b><br />
              Centro de la finca<br />
              {parseFloat(finca.latitud).toFixed(5)}, {parseFloat(finca.longitud).toFixed(5)}
            </Popup>
          </CircleMarker>
        )}

        <DrawControl
          lotes={lotes}
          editingPolygonId={editingPolygonId}
          onPolygonDrawn={onPolygonDrawn}
          startDrawing={startDrawing}
        />

        {lotes.filter(l => l.id !== editingPolygonId).map(l => {
          const isActive = l.id === selectedId
          const coords = coordsToLatLng(l.coordenadas)
          return (
            <Polygon
              key={l.id}
              positions={coords}
              pathOptions={{
                color: isActive ? '#D32F2F' : (l.color || '#4CAF50'),
                fillColor: isActive ? '#D32F2F' : (l.color || '#4CAF50'),
                fillOpacity: isActive ? 0.45 : 0.2,
                weight: isActive ? 3 : 2,
              }}
              eventHandlers={{ click: () => onSelect(l) }}
            >
              <Popup>
                <b>{l.nombre}</b><br />
                {l.codigo && <>Código: {l.codigo}<br /></>}
                Área: {l.area_ha != null ? `${formatNumber(l.area_ha)} ha` : '—'}<br />
                Uso: {l.uso_actual || '—'}<br />
                {l.tipo_suelo && <>Suelo: {l.tipo_suelo}<br /></>}
                {l.sistema_riego && <>Riego: {l.sistema_riego}</>}
              </Popup>
            </Polygon>
          )
        })}

        <FitBounds lotes={lotes} finca={finca} />
        {selectedId && <FlyToLot lotes={lotes} selectedId={selectedId} />}
      </MapContainer>
    </Paper>
  )
}

function FarmInfoCard({ finca, lotCount }) {
  if (!finca) return null
  return (
    <Card withBorder padding="sm" mb="sm">
      <Group justify="space-between" wrap="nowrap">
        <div>
          <Text fw={600} size="sm">{finca.nombre || 'Finca'}</Text>
          <Group gap="xs" mt={2}>
            {finca.area_total != null && (
              <Text size="xs" c="dimmed">Área total: {formatNumber(finca.area_total)} ha</Text>
            )}
            {finca.latitud != null && finca.longitud != null && (
              <Text size="xs" c="dimmed">
                {parseFloat(finca.latitud).toFixed(5)}, {parseFloat(finca.longitud).toFixed(5)}
              </Text>
            )}
          </Group>
        </div>
        <Badge size="lg" variant="light" color="green">{lotCount} lotes</Badge>
      </Group>
    </Card>
  )
}

function PolygonEditor({ lot, onSave, onCancel }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (lot?.coordenadas) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setText(JSON.stringify(lot.coordenadas, null, 2))
    }
  }, [lot])

  const handleSave = () => {
    try {
      JSON.parse(text)
      setError('')
      onSave(text)
    } catch {
      setError('GeoJSON inválido. Debe ser un objeto JSON válido.')
    }
  }

  return (
    <Paper withBorder p="sm" mt="sm">
      <Text size="sm" fw={600} mb="xs">
        Editando polígono: {lot?.nombre}
      </Text>
      <Text size="xs" c="dimmed" mb="xs">
        Edita las coordenadas en formato GeoJSON. Formato: {'{"type":"Polygon","coordinates":[[[lng,lat],...]]}'}
      </Text>
      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        error={error}
        minRows={4}
        maxRows={10}
        styles={{ input: { fontFamily: 'monospace', fontSize: 12 } }}
        mb="xs"
      />
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSave}>Guardar Polígono</Button>
      </Group>
    </Paper>
  )
}

function LotForm({ form, setForm, onSave, onCancel, saving, isNew, onStartDrawing }) {
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))
  const [coordText, setCoordText] = useState('')
  const [coordError, setCoordError] = useState('')

  useEffect(() => {
    if (form.coordenadas && typeof form.coordenadas === 'object') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoordText(JSON.stringify(form.coordenadas, null, 2))
    } else {
      setCoordText('')
    }
  }, [form.coordenadas])

  const handleCoordChange = (value) => {
    setCoordText(value)
    setCoordError('')
    if (!value.trim()) {
      set('coordenadas', null)
      return
    }
    try {
      const parsed = JSON.parse(value)
      if (parsed && parsed.type === 'Polygon') {
        set('coordenadas', parsed)
      } else {
        setCoordError('Debe ser un GeoJSON de tipo Polygon')
      }
    } catch {
      setCoordError('JSON inválido')
    }
  }

  return (
    <ScrollArea h={520}>
      <Stack gap="md">
        <SimpleGrid cols={2} spacing="xs">
          <TextInput label="Nombre" value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
          <TextInput label="Código" value={form.codigo} onChange={e => set('codigo', e.target.value)} />
          <NumberInput label="Área (ha)" value={form.area_ha} onChange={v => set('area_ha', v)} min={0} />
          <NumberInput label="Altitud (msnm)" value={form.altitud_msnm || ''} onChange={v => set('altitud_msnm', v)} />
          <Select label="Tipo Suelo" data={SUELOS} value={form.tipo_suelo} onChange={v => set('tipo_suelo', v)} />
          <Select label="Uso Actual" data={USOS} value={form.uso_actual} onChange={v => set('uso_actual', v)} />
          <NumberInput label="Pendiente (%)" value={form.pendiente_pct || ''} onChange={v => set('pendiente_pct', v)} min={0} max={100} />
          <Select label="Exposición" data={EXPOSICIONES} value={form.exposicion || ''} onChange={v => set('exposicion', v)} clearable />
          <Select label="Sistema Riego" data={RIEGOS} value={form.sistema_riego} onChange={v => set('sistema_riego', v)} />
          <TextInput label="Fuente de Agua" value={form.fuente_agua || ''} onChange={e => set('fuente_agua', e.target.value)} />
          <NumberInput label="Caudal (lps)" value={form.caudal_lps || ''} onChange={v => set('caudal_lps', v)} />
          <TextInput label="Latitud" value={form.latitud} onChange={e => set('latitud', e.target.value)} />
          <TextInput label="Longitud" value={form.longitud} onChange={e => set('longitud', e.target.value)} />
          <Select label="Color" data={COLORES} value={form.color} onChange={v => set('color', v)} />
          {isNew && (
            <TextInput label="Finca ID" value={form.finca_id} onChange={e => set('finca_id', parseInt(e.target.value) || '')} />
          )}
        </SimpleGrid>

        <Stack gap={4}>
          <Group justify="space-between" align="center">
            <Text size="sm" fw={500}>Coordenadas (GeoJSON)</Text>
            <Button
              size="xs"
              variant="light"
              color="green"
              leftSection={<IconEditCircle size={14} />}
              onClick={onStartDrawing}
            >
              Dibujar polígono
            </Button>
          </Group>
          <Textarea
            description="Polígono en formato GeoJSON. Debe ser un objeto con type Polygon y coordinates."
            value={coordText}
            onChange={e => handleCoordChange(e.target.value)}
            error={coordError}
            minRows={5}
            maxRows={10}
            styles={{ input: { fontFamily: 'monospace', fontSize: 12 } }}
          />
        </Stack>

        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onCancel}>Cancelar</Button>
          <Button onClick={onSave} loading={saving}>Guardar</Button>
        </Group>
      </Stack>
    </ScrollArea>
  )
}

export default function Lotes() {
  const [lotes, setLotes] = useState([])
  const [cultivos, setCultivos] = useState([])
  const [search, setSearch] = useState('')
  const [usoFiltro, setUsoFiltro] = useState(null)
  const [selectedLote, setSelectedLote] = useState(null)
  const [finca, setFinca] = useState(null)
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const [newOpened, { open: openNew, close: closeNew }] = useDisclosure(false)
  const [saving, setSaving] = useState(false)
  const [editingPolygonId, setEditingPolygonId] = useState(null)
  const [startDrawing, setStartDrawing] = useState(0)

  const fincaId = localStorage.getItem('agrop_finca_id') || '1'

  const emptyForm = useMemo(() => ({
    finca_id: parseInt(fincaId), nombre: '', codigo: '', area_ha: '', tipo_suelo: 'franco',
    uso_actual: 'cultivo', latitud: '', longitud: '', color: '#4CAF50', coordenadas: null,
    altitud_msnm: '', pendiente_pct: '', exposicion: '',
    sistema_riego: 'secano', fuente_agua: '', caudal_lps: '',
  }), [fincaId])

  const [form, setForm] = useState(emptyForm)

  const loadLotes = useCallback(async () => {
    try {
      const { data } = await api.get('/lotes/', { params: { finca_id: fincaId } })
      setLotes(data)
    } catch { /* handled by interceptor */ }
  }, [fincaId])

  const loadCultivos = useCallback(async () => {
    try {
      const { data } = await api.get('/cultivos/')
      setCultivos(data)
    } catch { setCultivos([]) }
  }, [])

  const loadFinca = useCallback(async () => {
    try {
      const { data } = await api.get(`/lotes/fincas/${fincaId}/`)
      setFinca(data)
    } catch { /* handled by interceptor */ }
  }, [fincaId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLotes(); loadCultivos(); loadFinca()
  }, [loadLotes, loadCultivos, loadFinca])

  const cultivoCounts = useMemo(() => {
    const map = {}
    cultivos.forEach(c => {
      if (c.lote_id && c.estado === 'activo') {
        map[c.lote_id] = (map[c.lote_id] || 0) + 1
      }
    })
    return map
  }, [cultivos])

  const filtered = useMemo(() => {
    return lotes.filter(l => {
      if (search) {
        const q = search.toLowerCase()
        if (!l.nombre.toLowerCase().includes(q) && !(l.codigo || '').toLowerCase().includes(q)) return false
      }
      if (usoFiltro && l.uso_actual !== usoFiltro) return false
      return true
    })
  }, [lotes, search, usoFiltro])

  const handleSelect = useCallback((l) => {
    setSelectedLote(l)
  }, [])

  const handleViewOnMap = useCallback((l) => {
    setSelectedLote(l)
  }, [])

  const handleNew = useCallback(() => {
    setForm({ ...emptyForm, finca_id: parseInt(fincaId) })
    openNew()
  }, [emptyForm, fincaId, openNew])

  const handleEdit = useCallback((l) => {
    setForm({
      finca_id: l.finca_id || parseInt(fincaId),
      nombre: l.nombre || '',
      codigo: l.codigo || '',
      area_ha: l.area_ha || '',
      tipo_suelo: l.tipo_suelo || 'franco',
      uso_actual: l.uso_actual || 'cultivo',
      latitud: l.latitud || '',
      longitud: l.longitud || '',
      color: l.color || '#4CAF50',
      coordenadas: l.coordenadas || null,
      altitud_msnm: l.altitud_msnm || '',
      pendiente_pct: l.pendiente_pct || '',
      exposicion: l.exposicion || '',
      sistema_riego: l.sistema_riego || 'secano',
      fuente_agua: l.fuente_agua || '',
      caudal_lps: l.caudal_lps || '',
    })
    openEdit()
  }, [fincaId, openEdit])

  const buildPayload = (f) => {
    const p = { ...f }
    if (typeof p.coordenadas === 'string') {
      try { p.coordenadas = JSON.parse(p.coordenadas) } catch { p.coordenadas = null }
    }
    return p
  }

  const handleSaveNew = async () => {
    setSaving(true)
    try {
      const { data } = await api.post('/lotes/', buildPayload(form))
      notifications.show({ title: 'Lote creado', message: data.nombre, color: 'green' })
      closeNew()
      await loadLotes()
    } catch {
      notifications.show({ title: 'Error al crear lote', color: 'red' })
    } finally { setSaving(false) }
  }

  const handleSaveEdit = async () => {
    if (!selectedLote) return
    setSaving(true)
    try {
      await api.put(`/lotes/${selectedLote.id}`, buildPayload(form))
      notifications.show({ title: 'Lote actualizado', color: 'green' })
      closeEdit()
      await loadLotes()
    } catch {
      notifications.show({ title: 'Error al actualizar', color: 'red' })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!selectedLote) return
    if (!window.confirm(`¿Eliminar el lote "${selectedLote.nombre}"?`)) return
    setSaving(true)
    try {
      await api.delete(`/lotes/${selectedLote.id}`)
      notifications.show({ title: 'Lote eliminado', color: 'orange' })
      setSelectedLote(null)
      await loadLotes()
    } catch {
      notifications.show({ title: 'Error al eliminar', color: 'red' })
    } finally { setSaving(false) }
  }

  const handleStartEditPolygon = useCallback((l) => {
    setSelectedLote(l)
    setEditingPolygonId(l.id)
  }, [])

  const handleSavePolygon = async (id, coordText) => {
    try {
      const coordenadas = JSON.parse(coordText)
      await api.put(`/lotes/${id}`, { coordenadas })
      notifications.show({ title: 'Polígono actualizado', color: 'green' })
      setEditingPolygonId(null)
      await loadLotes()
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof SyntaxError ? 'GeoJSON inválido' : 'Error al guardar',
        color: 'red',
      })
    }
  }

  const handleCancelPolygon = useCallback(() => {
    setEditingPolygonId(null)
  }, [])

  const handleStartDrawing = useCallback(() => {
    setStartDrawing(c => c + 1)
  }, [])

  const handlePolygonDrawn = useCallback((geoJSON) => {
    if (geoJSON) {
      setForm(prev => ({ ...prev, coordenadas: geoJSON }))
      if (editingPolygonId) {
        setLotes(prev => prev.map(l =>
          l.id === editingPolygonId ? { ...l, coordenadas: geoJSON } : l
        ))
      }
    } else {
      setForm(prev => ({ ...prev, coordenadas: null }))
    }
  }, [editingPolygonId])

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={3}>Lotes y Terrenos</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleNew}>
          Nuevo Lote
        </Button>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack gap="sm">
            <Group>
              <TextInput
                placeholder="Buscar por nombre o código..."
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1 }}
              />
              <Select
                placeholder="Filtrar uso"
                data={[
                  { value: '', label: 'Todos' },
                  ...USOS.map(u => ({ value: u, label: u })),
                ]}
                value={usoFiltro || ''}
                onChange={v => setUsoFiltro(v || null)}
                clearable
                style={{ width: 160 }}
              />
            </Group>

            <Paper withBorder style={{ flex: 1 }}>
              <ScrollArea h={500}>
                {filtered.length === 0 ? (
                  <Text size="sm" c="dimmed" ta="center" py="xl">
                    {search || usoFiltro ? 'Sin resultados' : 'No hay lotes registrados'}
                  </Text>
                ) : (
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Nombre</Table.Th>
                        <Table.Th>Código</Table.Th>
                        <Table.Th>Área</Table.Th>
                        <Table.Th>Uso Actual</Table.Th>
                        <Table.Th>Cultivos</Table.Th>
                        <Table.Th>Polígono</Table.Th>
                        <Table.Th>Acciones</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filtered.map(l => (
                        <Table.Tr
                          key={l.id}
                          style={{ cursor: 'pointer' }}
                          bg={selectedLote?.id === l.id ? 'green.0' : undefined}
                          onClick={() => handleSelect(l)}
                        >
                          <Table.Td><Text size="sm" fw={500}>{l.nombre}</Text></Table.Td>
                          <Table.Td><Text size="sm">{l.codigo || '—'}</Text></Table.Td>
                          <Table.Td>
                            <Text size="sm">{l.area_ha != null ? `${formatNumber(l.area_ha)} ha` : '—'}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge size="sm" variant="light" color={USO_COLORS[l.uso_actual] || 'gray'}>
                              {l.uso_actual || '—'}
                            </Badge>
                          </Table.Td>
                          <Table.Td><Text size="sm">{cultivoCounts[l.id] || 0}</Text></Table.Td>
                          <Table.Td>
                            {l.coordenadas?.type === 'Polygon' ? (
                              <IconCheck size={16} color="green" />
                            ) : (
                              <IconX size={16} color="red" />
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4} wrap="nowrap">
                              <Tooltip label="Editar">
                                <ActionIcon
                                  variant="light" color="blue" size="sm"
                                  onClick={e => { e.stopPropagation(); handleEdit(l) }}
                                >
                                  <IconEdit size={14} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Ver en mapa">
                                <ActionIcon
                                  variant="light" color="green" size="sm"
                                  onClick={e => { e.stopPropagation(); handleViewOnMap(l) }}
                                >
                                  <IconEye size={14} />
                                </ActionIcon>
                              </Tooltip>
                              {l.coordenadas?.type === 'Polygon' && (
                                <Tooltip label="Editar polígono">
                                  <ActionIcon
                                    variant="light" color="orange" size="sm"
                                    onClick={e => { e.stopPropagation(); handleStartEditPolygon(l) }}
                                  >
                                    <IconEditCircle size={14} />
                                  </ActionIcon>
                                </Tooltip>
                              )}
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                )}
              </ScrollArea>
            </Paper>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 7 }}>
          <FarmInfoCard finca={finca} lotCount={lotes.length} />
          <MapaLotes
            lotes={lotes}
            finca={finca}
            selectedId={selectedLote?.id}
            onSelect={handleSelect}
            editingPolygonId={editingPolygonId}
            onPolygonDrawn={handlePolygonDrawn}
            startDrawing={startDrawing}
          />

          {editingPolygonId && (() => {
            const lot = lotes.find(l => l.id === editingPolygonId)
            if (!lot) return null
            return (
              <PolygonEditor
                lot={lot}
                onSave={(text) => handleSavePolygon(editingPolygonId, text)}
                onCancel={handleCancelPolygon}
              />
            )
          })()}

          {selectedLote && !editingPolygonId && (
            <Paper withBorder p="sm" mt="sm">
              <Group justify="space-between">
                <div>
                  <Text fw={600} size="sm">{selectedLote.nombre}</Text>
                  <Text size="xs" c="dimmed">
                    {selectedLote.codigo && `${selectedLote.codigo} · `}
                    {selectedLote.area_ha != null ? `${formatNumber(selectedLote.area_ha)} ha` : ''}
                    {selectedLote.uso_actual && ` · ${selectedLote.uso_actual}`}
                  </Text>
                </div>
                <Group gap={4}>
                  <Button size="xs" variant="light" onClick={() => handleEdit(selectedLote)}>
                    Editar lote
                  </Button>
                  {selectedLote.coordenadas?.type === 'Polygon' && (
                    <Button
                      size="xs"
                      variant="light"
                      color="orange"
                      onClick={() => handleStartEditPolygon(selectedLote)}
                    >
                      Editar Polígono
                    </Button>
                  )}
                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    onClick={handleDelete}
                    loading={saving}
                  >
                    Eliminar
                  </Button>
                </Group>
              </Group>
            </Paper>
          )}
        </Grid.Col>
      </Grid>

      <Modal opened={editOpened} onClose={closeEdit} title="Editar Lote" size="lg">
        <LotForm
          form={form}
          setForm={setForm}
          onSave={handleSaveEdit}
          onCancel={closeEdit}
          saving={saving}
          isNew={false}
          onStartDrawing={handleStartDrawing}
        />
      </Modal>

      <Modal opened={newOpened} onClose={closeNew} title="Nuevo Lote" size="lg">
        <LotForm
          form={form}
          setForm={setForm}
          onSave={handleSaveNew}
          onCancel={closeNew}
          saving={saving}
          isNew
          onStartDrawing={handleStartDrawing}
        />
      </Modal>
    </Stack>
  )
}
