import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, Stack, SimpleGrid, Text, ActionIcon,
  Tabs, Textarea, Card, Tooltip, Divider,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconTree, IconLeaf, IconRuler, IconActivity,
  IconPlus, IconEdit, IconEye, IconX,
} from '@tabler/icons-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import dayjs from 'dayjs'
import api from '../services/api.js'
import { formatNumber } from '../config.js'

const PROPOSITOS = [
  { value: 'comercial', label: 'Comercial', color: 'green' },
  { value: 'conservacion', label: 'Conservación', color: 'teal' },
  { value: 'sombra', label: 'Sombra', color: 'cyan' },
  { value: 'cercas_vivas', label: 'Cercas Vivas', color: 'lime' },
  { value: 'leña', label: 'Leña', color: 'orange' },
  { value: 'otro', label: 'Otro', color: 'gray' },
]

const ESTADOS_PLANTACION = [
  { value: 'establecimiento', label: 'Establecimiento', color: 'yellow' },
  { value: 'crecimiento', label: 'Crecimiento', color: 'blue' },
  { value: 'maduro', label: 'Maduro', color: 'green' },
  { value: 'cosechado', label: 'Cosechado', color: 'orange' },
]

export default function Forestal() {
  const [plantaciones, setPlantaciones] = useState([])
  const [especies, setEspecies] = useState([])
  const [lotes, setLotes] = useState([])
  const [resumen, setResumen] = useState({})
  const [selected, setSelected] = useState(null)
  const [crecimientos, setCrecimientos] = useState([])

  const [plantModal, { open: openPlant, close: closePlant }] = useDisclosure(false)
  const [crecModal, { open: openCrec, close: closeCrec }] = useDisclosure(false)
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false)

  const [plantForm, setPlantForm] = useState({
    lote_id: '', especie_id: '', especie: '', fecha_plantacion: dayjs().format('YYYY-MM-DD'),
    area_ha: '', densidad_arboles_ha: '', total_arboles: '', proposito: 'comercial', estado: 'establecimiento',
  })
  const [crecForm, setCrecForm] = useState({
    fecha: dayjs().format('YYYY-MM-DD'), altura_promedio_m: '', diametro_promedio_cm: '', sobrevivencia_pct: '', observaciones: '',
  })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [activeTab, setActiveTab] = useState('lista')

  const fincaId = localStorage.getItem('agrop_finca_id') || '1'

  const loadPlantaciones = useCallback(async () => {
    try {
      const { data } = await api.get('/forestal/plantaciones/')
      setPlantaciones(data)
    } catch (e) { setPlantaciones([]) }
  }, [])

  const loadEspecies = useCallback(async () => {
    try {
      const { data } = await api.get('/forestal/especies')
      setEspecies(data)
    } catch (e) { setEspecies([]) }
  }, [])

  const loadLotes = useCallback(async () => {
    try {
      const { data } = await api.get('/lotes/', { params: { finca_id: fincaId } })
      setLotes(data)
    } catch (e) { setLotes([]) }
  }, [fincaId])

  const loadResumen = useCallback(async () => {
    try {
      const { data } = await api.get('/forestal/resumen')
      setResumen(data)
    } catch (e) {}
  }, [])

  useEffect(() => { loadPlantaciones(); loadEspecies(); loadLotes(); loadResumen() },
    [loadPlantaciones, loadEspecies, loadLotes, loadResumen])

  const lotesMap = useMemo(() => {
    const m = {}
    lotes.forEach(l => { m[l.id] = l.nombre })
    return m
  }, [lotes])

  const edadPromedio = useMemo(() => {
    if (plantaciones.length === 0) return '—'
    let totalDays = 0
    let count = 0
    plantaciones.forEach(p => {
      if (p.fecha_plantacion) {
        totalDays += dayjs().diff(dayjs(p.fecha_plantacion), 'days')
        count++
      }
    })
    if (count === 0) return '—'
    const meses = Math.round(totalDays / count / 30)
    return `${meses} meses`
  }, [plantaciones])

  const sobrevivenciaPromedio = useMemo(() => {
    const vals = plantaciones
      .map(p => { try { return parseFloat(p.sobrevivencia_pct) } catch (e) { return null } })
      .filter(v => v != null)
    if (vals.length === 0) return '—'
    return `${(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)}%`
  }, [plantaciones])

  const handleDetail = async (p) => {
    setSelected(p)
    openDetail()
    try {
      const url = '/forestal/plantaciones/' + p.id + '/crecimientos'
      const { data } = await api.get(url)
      setCrecimientos(data)
    } catch (e) { setCrecimientos([]) }
  }

  const handleNewPlant = () => {
    setEditingId(null)
    setPlantForm({
      lote_id: '', especie_id: '', especie: '', fecha_plantacion: dayjs().format('YYYY-MM-DD'),
      area_ha: '', densidad_arboles_ha: '', total_arboles: '', proposito: 'comercial', estado: 'establecimiento',
    })
    openPlant()
  }

  const handleSavePlant = async () => {
    setSaving(true)
    try {
      const payload = { ...plantForm }
      if (payload.especie_id) {
        const esp = especies.find(e => e.id === parseInt(payload.especie_id))
        if (esp) payload.especie = esp.nombre_comun
      }
      if (editingId) {
        await api.put(`/forestal/plantaciones/${editingId}`, payload)
        notifications.show({ title: 'Plantación actualizada', color: 'green' })
      } else {
        await api.post('/forestal/plantaciones/', payload)
        notifications.show({ title: 'Plantación creada', color: 'green' })
      }
      closePlant()
      loadPlantaciones()
      loadResumen()
    } catch (e) { notifications.show({ title: 'Error al guardar', color: 'red' }) }
    finally { setSaving(false) }
  }

  const handleSaveCrec = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await api.post(`/forestal/plantaciones/${selected.id}/crecimientos`, {
        ...crecForm, altura_promedio_m: parseFloat(crecForm.altura_promedio_m) || null,
        diametro_promedio_cm: parseFloat(crecForm.diametro_promedio_cm) || null,
        sobrevivencia_pct: parseFloat(crecForm.sobrevivencia_pct) || null,
      })
      notifications.show({ title: 'Crecimiento registrado', color: 'green' })
      closeCrec()
      const { data } = await api.get(`/forestal/plantaciones/${selected.id}/crecimientos`)
      setCrecimientos(data)
    } catch (e) { notifications.show({ title: 'Error al registrar', color: 'red' }) }
    finally { setSaving(false) }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Forestal / Plantaciones</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleNewPlant}>Nueva Plantación</Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm">
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Plantaciones Activas</Text>
          <Text fw={700}>{resumen.plantaciones_activas ?? plantaciones.length}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Total Árboles</Text>
          <Text fw={700}>{formatNumber(resumen.total_arboles || 0)}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Área Reforestada (ha)</Text>
          <Text fw={700}>{formatNumber(resumen.area_reforestada_ha || 0)}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Edad Promedio</Text>
          <Text fw={700}>{edadPromedio}</Text>
        </Card>
      </SimpleGrid>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Especie</Table.Th>
              <Table.Th>Área (ha)</Table.Th>
              <Table.Th>Árboles</Table.Th>
              <Table.Th>Edad</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Propósito</Table.Th>
              <Table.Th style={{ width: 80 }}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {plantaciones.map(p => {
              const estado = ESTADOS_PLANTACION.find(e => e.value === p.estado)
              const proposito = PROPOSITOS.find(r => r.value === p.proposito)
              const edad = p.fecha_plantacion ? `${dayjs().diff(dayjs(p.fecha_plantacion), 'months')} meses` : '—'
              return (
                <Table.Tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => handleDetail(p)}>
                  <Table.Td fw={500}>{p.especie_nombre || p.especie}</Table.Td>
                  <Table.Td>{p.area_ha != null ? formatNumber(p.area_ha) : '—'}</Table.Td>
                  <Table.Td>{p.total_arboles ?? '—'}</Table.Td>
                  <Table.Td>{edad}</Table.Td>
                  <Table.Td><Badge color={estado?.color || 'gray'} size="sm" variant="light">{estado?.label || p.estado}</Badge></Table.Td>
                  <Table.Td><Badge color={proposito?.color || 'gray'} size="sm" variant="outline">{proposito?.label || p.proposito}</Badge></Table.Td>
                  <Table.Td>
                    <Tooltip label="Ver detalle">
                      <ActionIcon variant="light" color="blue" size="sm"><IconEye size={14} /></ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              )
            })}
            {plantaciones.length === 0 && (
              <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center">Sin plantaciones registradas</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={detailOpened} onClose={closeDetail} title={`Plantación: ${selected?.especie_nombre || selected?.especie || ''}`} size="lg">
        {selected && (
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="info" leftSection={<IconTree size={14} />}>Info</Tabs.Tab>
              <Tabs.Tab value="crecimiento" leftSection={<IconActivity size={14} />}>Crecimiento</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="info" pt="sm">
              <SimpleGrid cols={2} spacing="xs">
                <Text size="sm"><b>Lote:</b> {selected.lote_nombre || `#${selected.lote_id}`}</Text>
                <Text size="sm"><b>Especie:</b> {selected.especie_nombre || selected.especie}</Text>
                <Text size="sm"><b>Fecha siembra:</b> {dayjs(selected.fecha_plantacion).format('DD/MM/YYYY')}</Text>
                <Text size="sm"><b>Área:</b> {selected.area_ha ? `${selected.area_ha} ha` : '—'}</Text>
                <Text size="sm"><b>Densidad:</b> {selected.densidad_arboles_ha ? `${selected.densidad_arboles_ha} arb/ha` : '—'}</Text>
                <Text size="sm"><b>Total árboles:</b> {selected.total_arboles ?? '—'}</Text>
                <Text size="sm"><b>Estado:</b> {ESTADOS_PLANTACION.find(e => e.value === selected.estado)?.label || selected.estado}</Text>
                <Text size="sm"><b>Propósito:</b> {PROPOSITOS.find(r => r.value === selected.proposito)?.label || selected.proposito}</Text>
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="crecimiento" pt="sm">
              <Group justify="space-between" mb="sm">
                <Title order={5}>Registros de Crecimiento</Title>
                <Button leftSection={<IconPlus size={14} />} size="sm" onClick={() => {
                  setCrecForm({ fecha: dayjs().format('YYYY-MM-DD'), altura_promedio_m: '', diametro_promedio_cm: '', sobrevivencia_pct: '', observaciones: '' })
                  openCrec()
                }}>Registrar Crecimiento</Button>
              </Group>

              {crecimientos.length > 0 && (
                <Paper withBorder p="md" mb="sm">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={crecimientos}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="fecha" tickFormatter={v => dayjs(v).format('DD/MM/YY')} fontSize={11} />
                      <YAxis fontSize={11} />
                      <RechartsTooltip labelFormatter={v => dayjs(v).format('DD/MM/YYYY')} />
                      <Legend />
                      <Line type="monotone" dataKey="altura_promedio_m" stroke="#4CAF50" strokeWidth={2} dot name="Altura (m)" />
                      <Line type="monotone" dataKey="diametro_promedio_cm" stroke="#FF9800" strokeWidth={2} dot name="Diámetro (cm)" />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              )}

              <Paper withBorder>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Fecha</Table.Th>
                      <Table.Th>Altura (m)</Table.Th>
                      <Table.Th>Diámetro (cm)</Table.Th>
                      <Table.Th>Sobrevivencia (%)</Table.Th>
                      <Table.Th>Observaciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {crecimientos.map(c => (
                      <Table.Tr key={c.id}>
                        <Table.Td>{dayjs(c.fecha).format('DD/MM/YYYY')}</Table.Td>
                        <Table.Td>{c.altura_promedio_m ?? '—'}</Table.Td>
                        <Table.Td>{c.diametro_promedio_cm ?? '—'}</Table.Td>
                        <Table.Td>{c.sobrevivencia_pct != null ? `${c.sobrevivencia_pct}%` : '—'}</Table.Td>
                        <Table.Td>{c.observaciones || '—'}</Table.Td>
                      </Table.Tr>
                    ))}
                    {crecimientos.length === 0 && (
                      <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center">Sin registros de crecimiento</Text></Table.Td></Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Tabs.Panel>
          </Tabs>
        )}
      </Modal>

      <Modal opened={plantModal} onClose={closePlant} title={editingId ? 'Editar Plantación' : 'Nueva Plantación'} size="md">
        <Stack gap="sm">
          <Select label="Lote" data={lotes.map(l => ({ value: l.id.toString(), label: l.nombre }))}
            value={plantForm.lote_id?.toString()} onChange={v => setPlantForm(f => ({ ...f, lote_id: v ? parseInt(v) : '' }))} required />
          <Select label="Especie" data={especies.map(e => ({ value: e.id.toString(), label: e.nombre_comun }))}
            value={plantForm.especie_id?.toString()} onChange={v => setPlantForm(f => ({ ...f, especie_id: v ? parseInt(v) : '', especie: v ? especies.find(e => e.id === parseInt(v))?.nombre_comun || '' : '' }))} clearable searchable />
          <TextInput label="Especie (manual)" value={plantForm.especie} onChange={e => setPlantForm(f => ({ ...f, especie: e.target.value }))}
            disabled={!!plantForm.especie_id} />
          <TextInput label="Fecha Plantación" type="date" value={plantForm.fecha_plantacion} onChange={e => setPlantForm(f => ({ ...f, fecha_plantacion: e.target.value }))} required />
          <SimpleGrid cols={2} spacing="xs">
            <NumberInput label="Área (ha)" value={plantForm.area_ha} onChange={v => setPlantForm(f => ({ ...f, area_ha: v }))} min={0} />
            <NumberInput label="Densidad (arb/ha)" value={plantForm.densidad_arboles_ha} onChange={v => setPlantForm(f => ({ ...f, densidad_arboles_ha: v }))} min={0} />
            <NumberInput label="Total Árboles" value={plantForm.total_arboles} onChange={v => setPlantForm(f => ({ ...f, total_arboles: v }))} min={0} />
            <Select label="Propósito" data={PROPOSITOS.map(r => ({ value: r.value, label: r.label }))}
              value={plantForm.proposito} onChange={v => setPlantForm(f => ({ ...f, proposito: v }))} />
            <Select label="Estado" data={ESTADOS_PLANTACION.map(e => ({ value: e.value, label: e.label }))}
              value={plantForm.estado} onChange={v => setPlantForm(f => ({ ...f, estado: v }))} />
          </SimpleGrid>
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closePlant}>Cancelar</Button>
            <Button onClick={handleSavePlant} loading={saving}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={crecModal} onClose={closeCrec} title="Registrar Crecimiento" size="sm">
        <Stack gap="sm">
          <TextInput label="Fecha" type="date" value={crecForm.fecha} onChange={e => setCrecForm(f => ({ ...f, fecha: e.target.value }))} required />
          <NumberInput label="Altura promedio (m)" value={crecForm.altura_promedio_m} onChange={v => setCrecForm(f => ({ ...f, altura_promedio_m: v }))} step={0.1} />
          <NumberInput label="Diámetro promedio (cm)" value={crecForm.diametro_promedio_cm} onChange={v => setCrecForm(f => ({ ...f, diametro_promedio_cm: v }))} step={0.1} />
          <NumberInput label="Sobrevivencia (%)" value={crecForm.sobrevivencia_pct} onChange={v => setCrecForm(f => ({ ...f, sobrevivencia_pct: v }))} min={0} max={100} />
          <Textarea label="Observaciones" value={crecForm.observaciones} onChange={e => setCrecForm(f => ({ ...f, observaciones: e.target.value }))} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeCrec}>Cancelar</Button>
            <Button onClick={handleSaveCrec} loading={saving}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
