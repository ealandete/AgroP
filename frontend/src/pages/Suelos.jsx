import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, Stack, SimpleGrid, Text, ActionIcon,
  Tabs, Textarea, Card, Tooltip, Grid, Divider, ScrollArea,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconFlask, IconPlant, IconAlertTriangle, IconChartLine,
  IconPlus, IconEdit, IconEye, IconX, IconBulldozer,
} from '@tabler/icons-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import dayjs from 'dayjs'
import api from '../services/api.js'
import { formatNumber } from '../config.js'
import CoordinatePicker from '../components/CoordinatePicker.jsx'

const TEXTURAS = ['arenoso', 'franco', 'arcilloso', 'limoso', 'turboso']

const NPK_COLORS = {
  nitrogeno_ppm: { bajo: '#e74c3c', medio: '#f39c12', alto: '#27ae60' },
  fosforo_ppm: { bajo: '#e74c3c', medio: '#f39c12', alto: '#27ae60' },
  potasio_ppm: { bajo: '#e74c3c', medio: '#f39c12', alto: '#27ae60' },
}

function getNPKLevel(value, type) {
  if (value == null) return '—'
  if (type === 'nitrogeno_ppm') {
    if (value < 20) return { level: 'Bajo', color: NPK_COLORS.nitrogeno_ppm.bajo }
    if (value < 50) return { level: 'Medio', color: NPK_COLORS.nitrogeno_ppm.medio }
    return { level: 'Alto', color: NPK_COLORS.nitrogeno_ppm.alto }
  }
  if (type === 'fosforo_ppm') {
    if (value < 15) return { level: 'Bajo', color: NPK_COLORS.fosforo_ppm.bajo }
    if (value < 30) return { level: 'Medio', color: NPK_COLORS.fosforo_ppm.medio }
    return { level: 'Alto', color: NPK_COLORS.fosforo_ppm.alto }
  }
  if (type === 'potasio_ppm') {
    if (value < 0.2) return { level: 'Bajo', color: NPK_COLORS.potasio_ppm.bajo }
    if (value < 0.5) return { level: 'Medio', color: NPK_COLORS.potasio_ppm.medio }
    return { level: 'Alto', color: NPK_COLORS.potasio_ppm.alto }
  }
  return { level: '—', color: '#666' }
}

function getPhColor(ph) {
  if (ph == null) return 'gray'
  if (ph < 5.5 || ph > 7.5) return 'red'
  if (ph < 6.0 || ph > 7.0) return 'orange'
  return 'green'
}

function getMOPctColor(mo) {
  if (mo == null) return 'gray'
  if (mo < 3) return 'red'
  if (mo < 5) return 'orange'
  return 'green'
}

const initialForm = {
  lote_id: '', fecha: dayjs().format('YYYY-MM-DD'), ph: '', nitrogeno_ppm: '', fosforo_ppm: '',
  potasio_ppm: '', materia_organica_pct: '', humedad_pct: '', textura: '', profundidad_cm: '',
  conductividad_us_cm: '', densidad_aparente: '', capacidad_campo: '', punto_marchitez: '',
  cice: '', porcentaje_saturacion_bases: '', calcio_meq: '', magnesio_meq: '', sodio_meq: '',
  potasio_meq: '', aluminio_meq: '', hierro_ppm: '', manganeso_ppm: '', zinc_ppm: '',
  cobre_ppm: '', boro_ppm: '', observaciones: '', recomendaciones: '', tecnico_responsable: '',
}

function DetalleAnalisis({ a }) {
  if (!a) return null
  return (
    <Stack gap="xs">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xs">
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">pH</Text>
          <Text fw={600} c={getPhColor(a.ph)}>{a.ph ?? '—'}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">N (ppm)</Text>
          <Text fw={600} c={getNPKLevel(a.nitrogeno_ppm, 'nitrogeno_ppm')?.color}>{a.nitrogeno_ppm ?? '—'}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">P (ppm)</Text>
          <Text fw={600} c={getNPKLevel(a.fosforo_ppm, 'fosforo_ppm')?.color}>{a.fosforo_ppm ?? '—'}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">K (ppm)</Text>
          <Text fw={600} c={getNPKLevel(a.potasio_ppm, 'potasio_ppm')?.color}>{a.potasio_ppm ?? '—'}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">MO (%)</Text>
          <Text fw={600} c={getMOPctColor(a.materia_organica_pct)}>{a.materia_organica_pct ?? '—'}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Humedad (%)</Text>
          <Text fw={600}>{a.humedad_pct ?? '—'}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Textura</Text>
          <Text fw={600}>{a.textura || '—'}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Profundidad (cm)</Text>
          <Text fw={600}>{a.profundidad_cm ?? '—'}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Conductividad (µS/cm)</Text>
          <Text fw={600}>{a.conductividad_us_cm ?? '—'}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Densidad aparente</Text>
          <Text fw={600}>{a.densidad_aparente ?? '—'}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Capacidad campo (%)</Text>
          <Text fw={600}>{a.capacidad_campo ?? '—'}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Punto marchitez (%)</Text>
          <Text fw={600}>{a.punto_marchitez ?? '—'}</Text>
        </Card>
      </SimpleGrid>
      <Divider label="Capacidad de Intercambio Catiónico" labelPosition="center" />
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
        <Card withBorder padding="sm"><Text size="xs" c="dimmed">CICE</Text><Text fw={600}>{a.cice ?? '—'}</Text></Card>
        <Card withBorder padding="sm"><Text size="xs" c="dimmed">Sat. Bases (%)</Text><Text fw={600}>{a.porcentaje_saturacion_bases ?? '—'}</Text></Card>
        <Card withBorder padding="sm"><Text size="xs" c="dimmed">Ca (meq)</Text><Text fw={600}>{a.calcio_meq ?? '—'}</Text></Card>
        <Card withBorder padding="sm"><Text size="xs" c="dimmed">Mg (meq)</Text><Text fw={600}>{a.magnesio_meq ?? '—'}</Text></Card>
        <Card withBorder padding="sm"><Text size="xs" c="dimmed">Na (meq)</Text><Text fw={600}>{a.sodio_meq ?? '—'}</Text></Card>
        <Card withBorder padding="sm"><Text size="xs" c="dimmed">K (meq)</Text><Text fw={600}>{a.potasio_meq ?? '—'}</Text></Card>
        <Card withBorder padding="sm"><Text size="xs" c="dimmed">Al (meq)</Text><Text fw={600}>{a.aluminio_meq ?? '—'}</Text></Card>
      </SimpleGrid>
      <Divider label="Micronutrientes" labelPosition="center" />
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
        <Card withBorder padding="sm"><Text size="xs" c="dimmed">Fe (ppm)</Text><Text fw={600}>{a.hierro_ppm ?? '—'}</Text></Card>
        <Card withBorder padding="sm"><Text size="xs" c="dimmed">Mn (ppm)</Text><Text fw={600}>{a.manganeso_ppm ?? '—'}</Text></Card>
        <Card withBorder padding="sm"><Text size="xs" c="dimmed">Zn (ppm)</Text><Text fw={600}>{a.zinc_ppm ?? '—'}</Text></Card>
        <Card withBorder padding="sm"><Text size="xs" c="dimmed">Cu (ppm)</Text><Text fw={600}>{a.cobre_ppm ?? '—'}</Text></Card>
        <Card withBorder padding="sm"><Text size="xs" c="dimmed">B (ppm)</Text><Text fw={600}>{a.boro_ppm ?? '—'}</Text></Card>
      </SimpleGrid>
      {a.observaciones && (
        <Text size="sm"><Text component="span" fw={600}>Obs:</Text> {a.observaciones}</Text>
      )}
      {a.recomendaciones && (
        <Text size="sm"><Text component="span" fw={600}>Recomendaciones:</Text> {a.recomendaciones}</Text>
      )}
      {a.tecnico_responsable && (
        <Text size="sm"><Text component="span" fw={600}>Técnico:</Text> {a.tecnico_responsable}</Text>
      )}
    </Stack>
  )
}

function RecomendacionesPanel({ recomendaciones, loading }) {
  if (loading) return <Text size="sm" c="dimmed">Generando recomendaciones...</Text>
  if (!recomendaciones) return <Text size="sm" c="dimmed">Selecciona un análisis para ver recomendaciones</Text>
  return (
    <Stack gap="sm">
      <Text fw={600}>Cultivos Recomendados</Text>
      <Group gap="xs">
        {recomendaciones.cultivos_recomendados?.map((c, i) => (
          <Badge key={i} variant="light" color="green" size="lg">{c}</Badge>
        ))}
      </Group>
      <Divider label="Fertilización" labelPosition="center" />
      {recomendaciones.fertilizacion?.map((f, i) => (
        <Card key={i} withBorder padding="sm">
          <Group justify="space-between">
            <Text fw={500} size="sm">{f.nutriente}</Text>
            <Badge color={f.nivel === 'bajo' ? 'red' : f.nivel === 'moderado' ? 'orange' : 'green'} size="sm">{f.nivel}</Badge>
          </Group>
          <Text size="sm" mt={4}>{f.recomendacion}</Text>
        </Card>
      ))}
      {recomendaciones.observaciones?.length > 0 && (
        <>
          <Divider label="Observaciones" labelPosition="center" />
          {recomendaciones.observaciones.map((o, i) => (
            <Text key={i} size="sm">• {o}</Text>
          ))}
        </>
      )}
    </Stack>
  )
}

export default function Suelos() {
  const [analisis, setAnalisis] = useState([])
  const [lotes, setLotes] = useState([])
  const [loteFilter, setLoteFilter] = useState(null)
  const [resumen, setResumen] = useState({})
  const [selected, setSelected] = useState(null)
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false)
  const [newOpened, { open: openNew, close: closeNew }] = useDisclosure(false)
  const [recomendaciones, setRecomendaciones] = useState(null)
  const [recoLoading, setRecoLoading] = useState(false)
  const [compareIds, setCompareIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [activeTab, setActiveTab] = useState('lista')

  const fincaId = localStorage.getItem('agrop_finca_id') || '1'

  const loadAnalisis = useCallback(async () => {
    try {
      const params = { per_page: 100 }
      if (loteFilter) params.lote_id = loteFilter
      const { data } = await api.get('/suelos/analisis/', { params })
      setAnalisis(data.items || data)
    } catch { setAnalisis([]) }
  }, [loteFilter])

  const loadLotes = useCallback(async () => {
    try {
      const { data } = await api.get('/lotes/', { params: { finca_id: fincaId } })
      setLotes(data)
    } catch { setLotes([]) }
  }, [fincaId])

  const loadResumen = useCallback(async () => {
    try {
      const { data } = await api.get('/suelos/resumen')
      setResumen(data)
    } catch {}
  }, [])

  useEffect(() => { loadAnalisis(); loadLotes(); loadResumen() }, [loadAnalisis, loadLotes, loadResumen])

  const lotesMap = useMemo(() => {
    const m = {}
    lotes.forEach(l => { m[l.id] = l.nombre })
    return m
  }, [lotes])

  const handleDetail = async (a) => {
    setSelected(a)
    openDetail()
    setRecoLoading(true)
    setRecomendaciones(null)
    try {
      const { data } = await api.get(`/suelos/analisis/${a.id}/recomendaciones`)
      setRecomendaciones(data)
    } catch {}
    setRecoLoading(false)
  }

  const handleNew = () => {
    setForm({ ...initialForm, fecha: dayjs().format('YYYY-MM-DD') })
    openNew()
  }

  const handleSaveNew = async () => {
    setSaving(true)
    try {
      await api.post('/suelos/analisis/', form)
      notifications.show({ title: 'Análisis creado', color: 'green' })
      closeNew()
      loadAnalisis()
      loadResumen()
    } catch { notifications.show({ title: 'Error al crear análisis', color: 'red' }) }
    finally { setSaving(false) }
  }

  const phTrendData = useMemo(() => {
    if (!loteFilter) return []
    const filtered = analisis.filter(a => a.lote_id === loteFilter || loteFilter === null)
    return filtered.sort((a, b) => a.fecha?.localeCompare?.(b.fecha)).map(a => ({
      fecha: dayjs(a.fecha).format('DD/MM/YY'),
      ph: a.ph,
      'N (ppm)': a.nitrogeno_ppm,
      'P (ppm)': a.fosforo_ppm,
      'K (ppm)': a.potasio_ppm,
      'MO (%)': a.materia_organica_pct,
    }))
  }, [analisis, loteFilter])

  const compareAnalyses = useMemo(() => {
    if (compareIds.length !== 2) return []
    return compareIds.map(id => analisis.find(a => a.id === id)).filter(Boolean)
  }, [compareIds, analisis])

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Suelos / Análisis</Title>
        <Group>
          {selected && (
            <Button variant="light" color="blue" size="sm" onClick={() => {
              const idx = compareIds.indexOf(selected.id)
              if (idx >= 0) setCompareIds(prev => prev.filter(i => i !== selected.id))
              else if (compareIds.length < 2) setCompareIds(prev => [...prev, selected.id])
              else setCompareIds([compareIds[1], selected.id])
            }}>
              {compareIds.includes(selected?.id) ? 'Quitar de comparación' : 'Comparar'}
            </Button>
          )}
          <Button leftSection={<IconPlus size={16} />} onClick={handleNew}>Nuevo Análisis</Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm">
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Último Análisis</Text>
          <Text fw={700}>{resumen.ultimo_analisis ? dayjs(resumen.ultimo_analisis).format('DD/MM/YYYY') : '—'}</Text>
          {resumen.ultimo_lote && <Text size="xs" c="dimmed">{resumen.ultimo_lote}</Text>}
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Lotes Analizados</Text>
          <Text fw={700}>{resumen.lotes_analizados ?? '—'}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Con Deficiencias</Text>
          <Text fw={700} c={resumen.con_deficiencias > 0 ? 'red' : 'green'}>{resumen.con_deficiencias ?? '—'}</Text>
        </Card>
        <Card withBorder padding="sm">
          <Text size="xs" c="dimmed">Total Análisis</Text>
          <Text fw={700}>{resumen.total_analisis ?? '—'}</Text>
        </Card>
      </SimpleGrid>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="lista" leftSection={<IconFlask size={14} />}>Análisis</Tabs.Tab>
          <Tabs.Tab value="grafico" leftSection={<IconChartLine size={14} />}>Tendencias</Tabs.Tab>
          <Tabs.Tab value="comparar" leftSection={<IconEye size={14} />}>Comparar</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="lista" pt="sm">
          <Group mb="sm">
            <Select
              placeholder="Filtrar por lote"
              data={[{ value: '', label: 'Todos' }, ...lotes.map(l => ({ value: l.id.toString(), label: l.nombre }))]}
              value={loteFilter?.toString() || ''}
              onChange={v => setLoteFilter(v ? parseInt(v) : null)}
              clearable
              style={{ width: 250 }}
            />
          </Group>

          <Paper withBorder>
            <ScrollArea>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Lote</Table.Th>
                    <Table.Th>pH</Table.Th>
                    <Table.Th>N</Table.Th>
                    <Table.Th>P</Table.Th>
                    <Table.Th>K</Table.Th>
                    <Table.Th>MO</Table.Th>
                    <Table.Th>Textura</Table.Th>
                    <Table.Th style={{ width: 80 }}>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {analisis.map(a => (
                    <Table.Tr key={a.id} style={{ cursor: 'pointer' }} bg={selected?.id === a.id ? 'blue.0' : undefined}
                      onClick={() => setSelected(a)}>
                      <Table.Td>{dayjs(a.fecha).format('DD/MM/YYYY')}</Table.Td>
                      <Table.Td fw={500}>{lotesMap[a.lote_id] || `#${a.lote_id}`}</Table.Td>
                      <Table.Td>
                        <Badge color={getPhColor(a.ph)} size="sm" variant="light">{a.ph ?? '—'}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text c={getNPKLevel(a.nitrogeno_ppm, 'nitrogeno_ppm')?.color}>{a.nitrogeno_ppm != null ? `${a.nitrogeno_ppm}` : '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text c={getNPKLevel(a.fosforo_ppm, 'fosforo_ppm')?.color}>{a.fosforo_ppm != null ? `${a.fosforo_ppm}` : '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text c={getNPKLevel(a.potasio_ppm, 'potasio_ppm')?.color}>{a.potasio_ppm != null ? `${a.potasio_ppm}` : '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getMOPctColor(a.materia_organica_pct)} size="sm" variant="light">{a.materia_organica_pct != null ? `${a.materia_organica_pct}%` : '—'}</Badge>
                      </Table.Td>
                      <Table.Td>{a.textura || '—'}</Table.Td>
                      <Table.Td>
                        <Tooltip label="Ver detalle y recomendaciones">
                          <ActionIcon variant="light" color="blue" size="sm" onClick={e => { e.stopPropagation(); handleDetail(a) }}>
                            <IconEye size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {analisis.length === 0 && (
                    <Table.Tr><Table.Td colSpan={9}><Text c="dimmed" ta="center">Sin análisis registrados</Text></Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="grafico" pt="sm">
          <Select
            label="Seleccionar lote"
            data={lotes.map(l => ({ value: l.id.toString(), label: l.nombre }))}
            value={loteFilter?.toString() || ''}
            onChange={v => setLoteFilter(v ? parseInt(v) : null)}
            clearable
            mb="sm"
          />
          {phTrendData.length > 0 ? (
            <Paper withBorder p="md">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={phTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" fontSize={11} />
                  <YAxis fontSize={11} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="ph" stroke="#2196F3" strokeWidth={2} dot={{ r: 4 }} name="pH" />
                  <Line type="monotone" dataKey="N (ppm)" stroke="#4CAF50" strokeWidth={2} name="N" />
                  <Line type="monotone" dataKey="P (ppm)" stroke="#FF9800" strokeWidth={2} name="P" />
                  <Line type="monotone" dataKey="K (ppm)" stroke="#9C27B0" strokeWidth={2} name="K" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          ) : (
            <Text c="dimmed" ta="center" py="xl">Selecciona un lote con datos históricos</Text>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="comparar" pt="sm">
          <Text size="sm" mb="sm">Selecciona 2 análisis en la tabla y haz clic en "Comparar"</Text>
          {compareAnalyses.length === 2 ? (
            <Grid>
              {compareAnalyses.map((a, idx) => (
                <Grid.Col key={idx} span={6}>
                  <Paper withBorder p="sm">
                    <Text fw={600} mb="sm">{lotesMap[a.lote_id]} - {dayjs(a.fecha).format('DD/MM/YYYY')}</Text>
                    <DetalleAnalisis a={a} />
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
          ) : (
            <Text c="dimmed" ta="center" py="xl">Selecciona exactamente 2 análisis para comparar</Text>
          )}
        </Tabs.Panel>
      </Tabs>

      <Modal opened={detailOpened} onClose={closeDetail} title={`Análisis de Suelo`} size="xl">
        {selected && (
          <Grid>
            <Grid.Col span={{ base: 12, md: 7 }}>
              <DetalleAnalisis a={selected} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Paper withBorder p="sm" bg="gray.0">
                <Text fw={600} mb="sm">Recomendaciones</Text>
                <RecomendacionesPanel recomendaciones={recomendaciones} loading={recoLoading} />
              </Paper>
            </Grid.Col>
          </Grid>
        )}
      </Modal>

      <Modal opened={newOpened} onClose={closeNew} title="Nuevo Análisis de Suelo" size="lg">
        <ScrollArea h={550}>
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
              <Select label="Lote" data={lotes.map(l => ({ value: l.id.toString(), label: l.nombre }))}
                value={form.lote_id?.toString()} onChange={v => setForm(f => ({ ...f, lote_id: v ? parseInt(v) : '' }))} required />
              <TextInput label="Fecha" type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} required />
              <TextInput label="Técnico Responsable" value={form.tecnico_responsable} onChange={e => setForm(f => ({ ...f, tecnico_responsable: e.target.value }))} />
              <Select label="Textura" data={TEXTURAS} value={form.textura} onChange={v => setForm(f => ({ ...f, textura: v }))} />
            </SimpleGrid>

            <Divider label="Propiedades Físicas" labelPosition="center" />
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
              <NumberInput label="pH" value={form.ph} onChange={v => setForm(f => ({ ...f, ph: v }))} min={0} max={14} step={0.1} />
              <NumberInput label="Humedad (%)" value={form.humedad_pct} onChange={v => setForm(f => ({ ...f, humedad_pct: v }))} />
              <NumberInput label="Profundidad (cm)" value={form.profundidad_cm} onChange={v => setForm(f => ({ ...f, profundidad_cm: v }))} />
              <NumberInput label="Conductividad (µS/cm)" value={form.conductividad_us_cm} onChange={v => setForm(f => ({ ...f, conductividad_us_cm: v }))} />
              <NumberInput label="Densidad aparente" value={form.densidad_aparente} onChange={v => setForm(f => ({ ...f, densidad_aparente: v }))} step={0.01} />
              <NumberInput label="Capacidad campo (%)" value={form.capacidad_campo} onChange={v => setForm(f => ({ ...f, capacidad_campo: v }))} />
              <NumberInput label="Punto marchitez (%)" value={form.punto_marchitez} onChange={v => setForm(f => ({ ...f, punto_marchitez: v }))} />
            </SimpleGrid>

            <Divider label="Macronutrientes (ppm)" labelPosition="center" />
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
              <NumberInput label="Nitrógeno (N)" value={form.nitrogeno_ppm} onChange={v => setForm(f => ({ ...f, nitrogeno_ppm: v }))} />
              <NumberInput label="Fósforo (P)" value={form.fosforo_ppm} onChange={v => setForm(f => ({ ...f, fosforo_ppm: v }))} />
              <NumberInput label="Potasio (K)" value={form.potasio_ppm} onChange={v => setForm(f => ({ ...f, potasio_ppm: v }))} />
              <NumberInput label="Materia Orgánica (%)" value={form.materia_organica_pct} onChange={v => setForm(f => ({ ...f, materia_organica_pct: v }))} />
            </SimpleGrid>

            <Divider label="Capacidad de Intercambio Catiónico (meq/100g)" labelPosition="center" />
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
              <NumberInput label="CICE" value={form.cice} onChange={v => setForm(f => ({ ...f, cice: v }))} />
              <NumberInput label="Sat. Bases (%)" value={form.porcentaje_saturacion_bases} onChange={v => setForm(f => ({ ...f, porcentaje_saturacion_bases: v }))} />
              <NumberInput label="Calcio (Ca)" value={form.calcio_meq} onChange={v => setForm(f => ({ ...f, calcio_meq: v }))} />
              <NumberInput label="Magnesio (Mg)" value={form.magnesio_meq} onChange={v => setForm(f => ({ ...f, magnesio_meq: v }))} />
              <NumberInput label="Sodio (Na)" value={form.sodio_meq} onChange={v => setForm(f => ({ ...f, sodio_meq: v }))} />
              <NumberInput label="Potasio (K) meq" value={form.potasio_meq} onChange={v => setForm(f => ({ ...f, potasio_meq: v }))} />
              <NumberInput label="Aluminio (Al)" value={form.aluminio_meq} onChange={v => setForm(f => ({ ...f, aluminio_meq: v }))} />
            </SimpleGrid>

            <Divider label="Micronutrientes (ppm)" labelPosition="center" />
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
              <NumberInput label="Hierro (Fe)" value={form.hierro_ppm} onChange={v => setForm(f => ({ ...f, hierro_ppm: v }))} />
              <NumberInput label="Manganeso (Mn)" value={form.manganeso_ppm} onChange={v => setForm(f => ({ ...f, manganeso_ppm: v }))} />
              <NumberInput label="Zinc (Zn)" value={form.zinc_ppm} onChange={v => setForm(f => ({ ...f, zinc_ppm: v }))} />
              <NumberInput label="Cobre (Cu)" value={form.cobre_ppm} onChange={v => setForm(f => ({ ...f, cobre_ppm: v }))} />
              <NumberInput label="Boro (B)" value={form.boro_ppm} onChange={v => setForm(f => ({ ...f, boro_ppm: v }))} />
            </SimpleGrid>

            <Divider label="Observaciones" labelPosition="center" />
            <Textarea label="Observaciones" value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} />
            <Textarea label="Recomendaciones" value={form.recomendaciones} onChange={e => setForm(f => ({ ...f, recomendaciones: e.target.value }))} />

            <CoordinatePicker
              value={null}
              onChange={(coords) => {}}
              label="Ubicación de la muestra"
            />

            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={closeNew}>Cancelar</Button>
              <Button onClick={handleSaveNew} loading={saving}>Guardar</Button>
            </Group>
          </Stack>
        </ScrollArea>
      </Modal>
    </Stack>
  )
}
