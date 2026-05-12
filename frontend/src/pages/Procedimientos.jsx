import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, ActionIcon, Stack, SimpleGrid,
  Text, Textarea, Card, Loader, Center,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPlus, IconSearch, IconEye, IconStethoscope, IconCalendarEvent,
  IconCurrencyDollar, IconChecklist, IconClipboardList, IconEdit,
} from '@tabler/icons-react'
import api from '../services/api.js'
import { formatCOP, formatNumber } from '../config.js'
import { useMobile } from '../hooks/useMobile.js'

const TIPOS_PROCEDIMIENTO = [
  { value: 'cirugia', label: 'Cirugía' },
  { value: 'exploracion', label: 'Exploración' },
  { value: 'biopsia', label: 'Biopsia' },
  { value: 'ecografia', label: 'Ecografía' },
  { value: 'radiografia', label: 'Radiografía' },
  { value: 'endoscopia', label: 'Endoscopia' },
  { value: 'dental', label: 'Dental' },
  { value: 'emergencia', label: 'Emergencia' },
  { value: 'otro', label: 'Otro' },
]

const ANESTESIA_OPTS = [
  { value: 'ninguna', label: 'Ninguna' },
  { value: 'local', label: 'Local' },
  { value: 'general', label: 'General' },
  { value: 'sedacion', label: 'Sedación' },
]

const RESULTADO_OPTS = [
  { value: 'exitoso', label: 'Exitoso', color: 'green' },
  { value: 'parcial', label: 'Parcial', color: 'yellow' },
  { value: 'fallido', label: 'Fallido', color: 'red' },
  { value: 'diferido', label: 'Diferido', color: 'blue' },
]

const RESULTADO_COLOR = {
  exitoso: 'green', parcial: 'yellow', fallido: 'red', diferido: 'blue',
}

const TIPO_COLOR = {
  cirugia: 'red', exploracion: 'blue', biopsia: 'violet',
  ecografia: 'cyan', radiografia: 'orange', endoscopia: 'teal',
  dental: 'pink', emergencia: 'grape', otro: 'gray',
}

const initialForm = {
  animal_id: '', fecha: new Date().toISOString().split('T')[0],
  tipo: 'exploracion', procedimiento_nombre: '',
  descripcion: '', hallazgos: '', diagnostico: '',
  anestesia: 'ninguna', anestesico_usado: '', dosis_anestesia: '',
  medicamentos_usados: '', materiales: '',
  veterinario_principal: '', veterinario_asistente: '',
  duracion_minutos: '', complicaciones: '',
  resultado: 'exitoso', costo: '',
  observaciones: '', seguimiento_recomendado: '',
}

function parseJsonList(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch { return val.split(',').map(s => s.trim()).filter(Boolean) }
}

export default function Procedimientos() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isMobile = useMobile()

  const [procedimientos, setProcedimientos] = useState([])
  const [animales, setAnimales] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState(null)
  const [filtroAnimal, setFiltroAnimal] = useState(null)
  const [form, setForm] = useState({ ...initialForm })
  const [editando, setEditando] = useState(null)
  const [stats, setStats] = useState({ procedimientos_mes: 0, tasa_exito: 0, costo_total_mes: 0, proximos_seguimientos: 0 })
  const [opened, { open, close }] = useDisclosure(false)
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (searchParams.get('animal_id')) {
      setFiltroAnimal(searchParams.get('animal_id'))
    }
  }, [searchParams])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filtroAnimal) params.animal_id = filtroAnimal
      if (filtroTipo) params.tipo = filtroTipo
      const [procs, anim, st] = await Promise.all([
        api.get('/procedimientos-veterinarios/', { params }),
        api.get('/animales/').catch(() => ({ data: [] })),
        api.get('/procedimientos-veterinarios/estadisticas/stats').catch(() => ({ data: {} })),
      ])
      setProcedimientos(procs.data)
      setAnimales(anim.data)
      setStats(st.data)
    } catch (err) {
      notifications.show({ title: 'Error al cargar', color: 'red' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [filtroAnimal, filtroTipo])

  const filtered = useMemo(() => {
    if (!search) return procedimientos
    const q = search.toLowerCase()
    return procedimientos.filter(p =>
      (p.procedimiento_nombre || '').toLowerCase().includes(q) ||
      (p.veterinario_principal || '').toLowerCase().includes(q) ||
      (p.animal_codigo || '').toLowerCase().includes(q)
    )
  }, [procedimientos, search])

  const animalOpts = useMemo(() =>
    animales.map(a => ({ value: a.id.toString(), label: `${a.codigo || ''} - ${a.nombre || a.especie || ''}` })),
    [animales]
  )

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        animal_id: parseInt(form.animal_id),
        duracion_minutos: form.duracion_minutos ? parseInt(form.duracion_minutos) : null,
        costo: form.costo ? parseFloat(form.costo) : null,
        medicamentos_usados: form.medicamentos_usados ? parseJsonList(form.medicamentos_usados) : [],
        materiales: form.materiales ? parseJsonList(form.materiales) : [],
      }
      if (editando) {
        await api.put(`/procedimientos-veterinarios/${editando}`, payload)
        notifications.show({ title: 'Procedimiento actualizado', color: 'green' })
      } else {
        await api.post('/procedimientos-veterinarios/', payload)
        notifications.show({ title: 'Procedimiento registrado', color: 'green' })
      }
      close()
      setEditando(null)
      setForm({ ...initialForm })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail, color: 'red' })
    }
  }

  const openEdit = (p) => {
    setEditando(p.id)
    setForm({
      animal_id: p.animal_id?.toString() || '',
      fecha: p.fecha || '',
      tipo: p.tipo || 'exploracion',
      procedimiento_nombre: p.procedimiento_nombre || '',
      descripcion: p.descripcion || '',
      hallazgos: p.hallazgos || '',
      diagnostico: p.diagnostico || '',
      anestesia: p.anestesia || 'ninguna',
      anestesico_usado: p.anestesico_usado || '',
      dosis_anestesia: p.dosis_anestesia || '',
      medicamentos_usados: p.medicamentos_usados ? (Array.isArray(p.medicamentos_usados) ? p.medicamentos_usados.join(', ') : '') : '',
      materiales: p.materiales ? (Array.isArray(p.materiales) ? p.materiales.join(', ') : '') : '',
      veterinario_principal: p.veterinario_principal || '',
      veterinario_asistente: p.veterinario_asistente || '',
      duracion_minutos: p.duracion_minutos?.toString() || '',
      complicaciones: p.complicaciones || '',
      resultado: p.resultado || 'exitoso',
      costo: p.costo?.toString() || '',
      observaciones: p.observaciones || '',
      seguimiento_recomendado: p.seguimiento_recomendado || '',
    })
    open()
  }

  const openDetailView = (p) => {
    setSelected(p)
    openDetail()
  }

  if (loading) {
    return <Center h={400}><Loader size="lg" /></Center>
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Procedimientos Veterinarios</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => { setEditando(null); setForm({ ...initialForm, fecha: new Date().toISOString().split('T')[0] }); open() }}
        >
          Nuevo
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <Card withBorder padding="md" radius="md">
          <Group>
            <IconStethoscope size={24} color="var(--mantine-color-blue-6)" />
            <div>
              <Text size="xs" c="dimmed">Procedimientos del Mes</Text>
              <Text size="xl" fw={700}>{stats.procedimientos_mes || 0}</Text>
            </div>
          </Group>
        </Card>
        <Card withBorder padding="md" radius="md">
          <Group>
            <IconChecklist size={24} color="var(--mantine-color-green-6)" />
            <div>
              <Text size="xs" c="dimmed">Tasa de Éxito</Text>
              <Text size="xl" fw={700}>{stats.tasa_exito || 0}%</Text>
            </div>
          </Group>
        </Card>
        <Card withBorder padding="md" radius="md">
          <Group>
            <IconCurrencyDollar size={24} color="var(--mantine-color-orange-6)" />
            <div>
              <Text size="xs" c="dimmed">Costo Total del Mes</Text>
              <Text size="xl" fw={700}>{stats.costo_total_mes ? formatCOP(stats.costo_total_mes) : '$0'}</Text>
            </div>
          </Group>
        </Card>
        <Card withBorder padding="md" radius="md">
          <Group>
            <IconCalendarEvent size={24} color="var(--mantine-color-violet-6)" />
            <div>
              <Text size="xs" c="dimmed">Próximos Seguimientos</Text>
              <Text size="xl" fw={700}>{stats.proximos_seguimientos || 0}</Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>

      <Paper p="sm" radius="md" withBorder>
        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Buscar..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <Select
            placeholder="Tipo"
            clearable
            data={TIPOS_PROCEDIMIENTO}
            value={filtroTipo}
            onChange={setFiltroTipo}
            style={{ width: isMobile ? 140 : 180 }}
          />
          <Select
            placeholder="Animal"
            clearable
            searchable
            data={animalOpts}
            value={filtroAnimal}
            onChange={setFiltroAnimal}
            style={{ width: isMobile ? 140 : 220 }}
          />
        </Group>
      </Paper>

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(p => (
            <Paper key={p.id} withBorder p="sm" radius="md" onClick={() => openDetailView(p)}>
              <Group justify="space-between" mb={4}>
                <Badge size="sm" color={TIPO_COLOR[p.tipo] || 'gray'}>{p.tipo}</Badge>
                <Badge size="sm" color={RESULTADO_COLOR[p.resultado] || 'gray'}>{p.resultado}</Badge>
              </Group>
              <Text fw={500} size="sm">{p.procedimiento_nombre}</Text>
              <Group justify="space-between" mt={4}>
                <Text size="xs" c="dimmed">{p.fecha}</Text>
                <Text size="xs" c="dimmed">{p.animal_codigo || `#${p.animal_id}`}</Text>
              </Group>
              <Group justify="space-between" mt={2}>
                <Text size="xs">{p.veterinario_principal || '-'}</Text>
                <Text size="xs" fw={500}>{p.costo ? formatCOP(p.costo) : ''}</Text>
              </Group>
            </Paper>
          ))}
          {filtered.length === 0 && <Text c="dimmed" ta="center" py="sm">Sin procedimientos</Text>}
        </div>
      ) : (
        <Paper withBorder style={{ overflowX: 'auto' }}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Animal</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Procedimiento</Table.Th>
                <Table.Th>Veterinario</Table.Th>
                <Table.Th>Resultado</Table.Th>
                <Table.Th>Costo</Table.Th>
                <Table.Th>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map(p => (
                <Table.Tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => openDetailView(p)}>
                  <Table.Td>{p.fecha}</Table.Td>
                  <Table.Td fw={500}>{p.animal_codigo || `#${p.animal_id}`}{p.animal_nombre ? ` - ${p.animal_nombre}` : ''}</Table.Td>
                  <Table.Td>
                    <Badge size="sm" color={TIPO_COLOR[p.tipo] || 'gray'} variant="light">{p.tipo}</Badge>
                  </Table.Td>
                  <Table.Td>{p.procedimiento_nombre}</Table.Td>
                  <Table.Td>{p.veterinario_principal || '-'}</Table.Td>
                  <Table.Td>
                    <Badge size="sm" color={RESULTADO_COLOR[p.resultado] || 'gray'}>{p.resultado}</Badge>
                  </Table.Td>
                  <Table.Td>{p.costo ? formatCOP(p.costo) : '-'}</Table.Td>
                  <Table.Td>
                    <ActionIcon variant="light" color="blue" onClick={(e) => { e.stopPropagation(); openEdit(p) }}>
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
              {filtered.length === 0 && (
                <Table.Tr><Table.Td colSpan={8}><Text c="dimmed" ta="center" py="sm">Sin procedimientos registrados</Text></Table.Td></Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      <Modal opened={opened} onClose={close} title={editando ? 'Editar Procedimiento' : 'Nuevo Procedimiento'} size="lg" fullScreen={isMobile}>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Select label="Animal" data={animalOpts} value={form.animal_id} onChange={v => setForm({ ...form, animal_id: v })} searchable required />
          <TextInput label="Fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required />
          <Select label="Tipo" data={TIPOS_PROCEDIMIENTO} value={form.tipo} onChange={v => setForm({ ...form, tipo: v })} required />
          <TextInput label="Nombre del Procedimiento" value={form.procedimiento_nombre} onChange={e => setForm({ ...form, procedimiento_nombre: e.target.value })} required />
          <Select label="Anestesia" data={ANESTESIA_OPTS} value={form.anestesia} onChange={v => setForm({ ...form, anestesia: v })} />
          {form.anestesia !== 'ninguna' && (
            <>
              <TextInput label="Anestésico Usado" value={form.anestesico_usado} onChange={e => setForm({ ...form, anestesico_usado: e.target.value })} />
              <TextInput label="Dosis Anestesia" value={form.dosis_anestesia} onChange={e => setForm({ ...form, dosis_anestesia: e.target.value })} />
            </>
          )}
          <Select label="Resultado" data={RESULTADO_OPTS} value={form.resultado} onChange={v => setForm({ ...form, resultado: v })} required />
          <NumberInput label="Costo" value={form.costo} onChange={v => setForm({ ...form, costo: v })} min={0} />
          <NumberInput label="Duración (min)" value={form.duracion_minutos} onChange={v => setForm({ ...form, duracion_minutos: v })} min={0} />
          <TextInput label="Veterinario Principal" value={form.veterinario_principal} onChange={e => setForm({ ...form, veterinario_principal: e.target.value })} />
          <TextInput label="Veterinario Asistente" value={form.veterinario_asistente} onChange={e => setForm({ ...form, veterinario_asistente: e.target.value })} />
        </SimpleGrid>
        <Textarea label="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} mt="sm" minRows={2} />
        <Textarea label="Hallazgos" value={form.hallazgos} onChange={e => setForm({ ...form, hallazgos: e.target.value })} mt="sm" minRows={2} />
        <Textarea label="Diagnóstico" value={form.diagnostico} onChange={e => setForm({ ...form, diagnostico: e.target.value })} mt="sm" minRows={2} />
        <TextInput label="Medicamentos (separados por coma)" value={form.medicamentos_usados} onChange={e => setForm({ ...form, medicamentos_usados: e.target.value })} mt="sm" />
        <TextInput label="Materiales (separados por coma)" value={form.materiales} onChange={e => setForm({ ...form, materiales: e.target.value })} mt="sm" />
        <Textarea label="Complicaciones" value={form.complicaciones} onChange={e => setForm({ ...form, complicaciones: e.target.value })} mt="sm" minRows={2} />
        <Textarea label="Seguimiento Recomendado" value={form.seguimiento_recomendado} onChange={e => setForm({ ...form, seguimiento_recomendado: e.target.value })} mt="sm" minRows={2} />
        <Textarea label="Observaciones" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} mt="sm" minRows={2} />
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editando ? 'Guardar' : 'Crear'}</Button>
        </Group>
      </Modal>

      <Modal opened={detailOpened} onClose={closeDetail} title="Detalle del Procedimiento" size="lg" fullScreen={isMobile}>
        {selected && (
          <Stack>
            <Paper withBorder p="sm">
              <Text fw={600} mb="xs">Información General</Text>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                <Text size="sm"><b>Fecha:</b> {selected.fecha}</Text>
                <Text size="sm"><b>Animal:</b> {selected.animal_codigo || `#${selected.animal_id}`} {selected.animal_nombre ? `- ${selected.animal_nombre}` : ''}</Text>
                <Text size="sm"><b>Tipo:</b> <Badge size="sm" color={TIPO_COLOR[selected.tipo] || 'gray'}>{selected.tipo}</Badge></Text>
                <Text size="sm"><b>Procedimiento:</b> {selected.procedimiento_nombre}</Text>
                <Text size="sm"><b>Veterinario:</b> {selected.veterinario_principal || '-'}</Text>
                <Text size="sm"><b>Asistente:</b> {selected.veterinario_asistente || '-'}</Text>
                <Text size="sm"><b>Duración:</b> {selected.duracion_minutos ? `${selected.duracion_minutos} min` : '-'}</Text>
                <Text size="sm"><b>Costo:</b> {selected.costo ? formatCOP(selected.costo) : '-'}</Text>
              </SimpleGrid>
            </Paper>
            {selected.hallazgos && (
              <Paper withBorder p="sm">
                <Text fw={600} mb="xs">Hallazgos</Text>
                <Text size="sm">{selected.hallazgos}</Text>
              </Paper>
            )}
            {selected.diagnostico && (
              <Paper withBorder p="sm">
                <Text fw={600} mb="xs">Diagnóstico</Text>
                <Text size="sm">{selected.diagnostico}</Text>
              </Paper>
            )}
            <Paper withBorder p="sm">
              <Text fw={600} mb="xs">Anestesia</Text>
              <SimpleGrid cols={2} spacing="xs">
                <Text size="sm"><b>Tipo:</b> {ANESTESIA_OPTS.find(a => a.value === selected.anestesia)?.label || selected.anestesia}</Text>
                {selected.anestesico_usado && <Text size="sm"><b>Anestésico:</b> {selected.anestesico_usado}</Text>}
                {selected.dosis_anestesia && <Text size="sm"><b>Dosis:</b> {selected.dosis_anestesia}</Text>}
              </SimpleGrid>
            </Paper>
            {selected.medicamentos_usados && selected.medicamentos_usados.length > 0 && (
              <Paper withBorder p="sm">
                <Text fw={600} mb="xs">Medicamentos</Text>
                <Group gap="xs">
                  {(Array.isArray(selected.medicamentos_usados) ? selected.medicamentos_usados : []).map((m, i) => (
                    <Badge key={i} size="sm" variant="light" color="cyan">{m}</Badge>
                  ))}
                </Group>
              </Paper>
            )}
            {selected.materiales && selected.materiales.length > 0 && (
              <Paper withBorder p="sm">
                <Text fw={600} mb="xs">Materiales</Text>
                <Group gap="xs">
                  {(Array.isArray(selected.materiales) ? selected.materiales : []).map((m, i) => (
                    <Badge key={i} size="sm" variant="light" color="grape">{m}</Badge>
                  ))}
                </Group>
              </Paper>
            )}
            {selected.complicaciones && (
              <Paper withBorder p="sm">
                <Text fw={600} mb="xs">Complicaciones</Text>
                <Text size="sm">{selected.complicaciones}</Text>
              </Paper>
            )}
            <Paper withBorder p="sm">
              <Text fw={600} mb="xs">Resultado</Text>
              <Group>
                <Badge size="lg" color={RESULTADO_COLOR[selected.resultado] || 'gray'}>{selected.resultado}</Badge>
              </Group>
            </Paper>
            {selected.seguimiento_recomendado && (
              <Paper withBorder p="sm" bg="blue.0">
                <Text fw={600} mb="xs">Seguimiento Recomendado</Text>
                <Text size="sm">{selected.seguimiento_recomendado}</Text>
              </Paper>
            )}
            {selected.observaciones && (
              <Paper withBorder p="sm">
                <Text fw={600} mb="xs">Observaciones</Text>
                <Text size="sm">{selected.observaciones}</Text>
              </Paper>
            )}
          </Stack>
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeDetail}>Cerrar</Button>
        </Group>
      </Modal>
    </Stack>
  )
}
