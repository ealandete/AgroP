import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput, Select, NumberInput,
  Badge, ActionIcon, Stack, SimpleGrid, Text, Card, Tabs, Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPlus, IconEdit, IconSearch, IconTrash, IconTractor, IconTool,
  IconGauge, IconDroplet, IconCar, IconDeviceGamepad2, IconMilk,
  IconBuildingWarehouse, IconAlertTriangle,
} from '@tabler/icons-react'
import api from '../services/api.js'
import { formatCOP, formatNumber } from '../config.js'

const CATEGORIAS = [
  { value: 'tractor', label: 'Tractor', icon: IconTractor, color: 'green' },
  { value: 'cosechadora', label: 'Cosechadora', icon: IconGauge, color: 'yellow' },
  { value: 'sembradora', label: 'Sembradora', icon: IconDeviceGamepad2, color: 'blue' },
  { value: 'riego', label: 'Riego', icon: IconDroplet, color: 'cyan' },
  { value: 'vehiculo', label: 'Vehículo', icon: IconCar, color: 'orange' },
  { value: 'herramienta', label: 'Herramienta', icon: IconTool, color: 'grape' },
  { value: 'ordenha', label: 'Ordeña', icon: IconMilk, color: 'pink' },
  { value: 'galpon', label: 'Galpón', icon: IconBuildingWarehouse, color: 'teal' },
  { value: 'silo', label: 'Silo', icon: IconBuildingWarehouse, color: 'violet' },
  { value: 'otro', label: 'Otro', icon: IconTool, color: 'gray' },
]

const ESTADOS = [
  { value: 'operativo', label: 'Operativo', color: 'green' },
  { value: 'mantenimiento', label: 'En Mantenimiento', color: 'orange' },
  { value: 'averiado', label: 'Averiado', color: 'red' },
  { value: 'baja', label: 'De Baja', color: 'gray' },
]

const defaultForm = {
  finca_id: '', nombre: '', marca: '', modelo: '', año: '',
  categoria: 'tractor', numero_serie: '', placa: '', potencia_hp: '',
  capacidad: '', estado: 'operativo', fecha_compra: '', valor_compra: '',
  vida_util_anos: 10, valor_residual: '',
  proximo_mantenimiento_km: '', proximo_mantenimiento_horas: '',
}

export default function Equipos() {
  const [equipos, setEquipos] = useState([])
  const [alertas, setAlertas] = useState([])
  const [fincas, setFincas] = useState([])
  const [mantenimientos, setMantenimientos] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [tabEquipo, setTabEquipo] = useState('info')

  const [opened, { open, close }] = useDisclosure(false)
  const [mttoOpened, { open: openMtto, close: closeMtto }] = useDisclosure(false)
  const [editMttoOpened, { open: openEditMtto, close: closeEditMtto }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ ...defaultForm })
  const [mttoForm, setMttoForm] = useState({
    equipo_id: '', fecha: new Date().toISOString().split('T')[0],
    tipo: 'preventivo', descripcion: '', costo: '', proveedor: '',
    proximo_mantenimiento_fecha: '', kilometraje: '', horas_operacion: '',
  })
  const [editMttoId, setEditMttoId] = useState(null)

  const loadData = () => {
    api.get('/equipos/').then(r => setEquipos(r.data)).catch(() => {})
    api.get('/equipos/alertas-mantenimiento').then(r => setAlertas(r.data)).catch(() => {})
    api.get('/lotes/fincas/').then(r => setFincas(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }
  useEffect(loadData, [])

  const loadMantenimientos = (id) => {
    api.get(`/equipos/${id}/mantenimientos`).then(r => setMantenimientos(r.data)).catch(() => {})
  }

  const filtered = equipos.filter(e => {
    if (search && !(e.nombre || '').toLowerCase().includes(search.toLowerCase()) && !(e.marca || '').toLowerCase().includes(search.toLowerCase())) return false
    if (filtroCategoria && e.categoria !== filtroCategoria) return false
    if (filtroEstado && e.estado !== filtroEstado) return false
    return true
  })

  const summary = {
    total: equipos.length,
    operativos: equipos.filter(e => e.estado === 'operativo').length,
    enMantenimiento: equipos.filter(e => e.estado === 'mantenimiento').length,
    alertas: alertas.filter(a => a.dias_restantes !== null && a.dias_restantes <= 30).length,
  }

  const getCategoriaMeta = (cat) => CATEGORIAS.find(c => c.value === cat) || CATEGORIAS[CATEGORIAS.length - 1]
  const getEstadoBadge = (est) => {
    const e = ESTADOS.find(s => s.value === est)
    return e ? <Badge color={e.color} size="sm">{e.label}</Badge> : <Badge size="sm">{est}</Badge>
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        finca_id: parseInt(form.finca_id) || fincas[0]?.id,
        año: form.año ? parseInt(form.año) : null,
        potencia_hp: form.potencia_hp ? parseFloat(form.potencia_hp) : null,
        valor_compra: form.valor_compra ? parseFloat(form.valor_compra) : null,
        valor_residual: form.valor_residual ? parseFloat(form.valor_residual) : null,
        vida_util_anos: form.vida_util_anos ? parseInt(form.vida_util_anos) : 10,
        proximo_mantenimiento_km: form.proximo_mantenimiento_km ? parseFloat(form.proximo_mantenimiento_km) : null,
        proximo_mantenimiento_horas: form.proximo_mantenimiento_horas ? parseFloat(form.proximo_mantenimiento_horas) : null,
      }
      if (editando) await api.put(`/equipos/${editando}`, payload)
      else await api.post('/equipos/', payload)
      notifications.show({ title: editando ? 'Equipo actualizado' : 'Equipo creado', color: 'green' })
      close(); setEditando(null); setForm({ ...defaultForm }); loadData()
    } catch { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const openEdit = (eq) => {
    setEditando(eq.id)
    setForm({
      finca_id: eq.finca_id?.toString() || '',
      nombre: eq.nombre || '', marca: eq.marca || '', modelo: eq.modelo || '',
      año: eq.año?.toString() || '', categoria: eq.categoria || 'tractor',
      numero_serie: eq.numero_serie || '', placa: eq.placa || '',
      potencia_hp: eq.potencia_hp?.toString() || '', capacidad: eq.capacidad || '',
      estado: eq.estado || 'operativo', fecha_compra: eq.fecha_compra || '',
      valor_compra: eq.valor_compra?.toString() || '', vida_util_anos: eq.vida_util_anos || 10,
      valor_residual: eq.valor_residual?.toString() || '',
      proximo_mantenimiento_km: eq.proximo_mantenimiento_km?.toString() || '',
      proximo_mantenimiento_horas: eq.proximo_mantenimiento_horas?.toString() || '',
    })
    open()
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar este equipo?')) return
    try {
      await api.delete(`/equipos/${id}`)
      notifications.show({ title: 'Equipo desactivado', color: 'orange' })
      loadData()
    } catch { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const handleMttoSubmit = async () => {
    try {
      const payload = {
        ...mttoForm,
        costo: mttoForm.costo ? parseFloat(mttoForm.costo) : null,
        kilometraje: mttoForm.kilometraje ? parseFloat(mttoForm.kilometraje) : null,
        horas_operacion: mttoForm.horas_operacion ? parseFloat(mttoForm.horas_operacion) : null,
      }
      await api.post(`/equipos/${selected.id}/mantenimientos`, payload)
      notifications.show({ title: 'Mantenimiento registrado', color: 'green' })
      closeMtto(); loadMantenimientos(selected.id)
      setMttoForm({ ...mttoForm, fecha: new Date().toISOString().split('T')[0], tipo: 'preventivo', descripcion: '', costo: '', proveedor: '', proximo_mantenimiento_fecha: '', kilometraje: '', horas_operacion: '' })
    } catch { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const openEditMttoFn = (m) => {
    setEditMttoId(m.id)
    setMttoForm({
      equipo_id: m.equipo_id, fecha: m.fecha, tipo: m.tipo, descripcion: m.descripcion || '',
      costo: m.costo?.toString() || '', proveedor: m.proveedor || '',
      proximo_mantenimiento_fecha: m.proximo_mantenimiento_fecha || '',
      kilometraje: m.kilometraje?.toString() || '', horas_operacion: m.horas_operacion?.toString() || '',
    })
    openEditMtto()
  }

  const handleEditMttoSubmit = async () => {
    try {
      const payload = {
        ...mttoForm,
        costo: mttoForm.costo ? parseFloat(mttoForm.costo) : null,
        kilometraje: mttoForm.kilometraje ? parseFloat(mttoForm.kilometraje) : null,
        horas_operacion: mttoForm.horas_operacion ? parseFloat(mttoForm.horas_operacion) : null,
      }
      await api.put(`/equipos/mantenimientos/${editMttoId}`, payload)
      notifications.show({ title: 'Mantenimiento actualizado', color: 'green' })
      closeEditMtto(); setEditMttoId(null); loadMantenimientos(selected.id)
    } catch { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const totalCostos = mantenimientos.reduce((s, m) => s + (parseFloat(m.costo) || 0), 0)

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Equipos / Maquinaria ({filtered.length})</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setForm({ ...defaultForm }); open() }}>Nuevo Equipo</Button>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <Card withBorder padding="md" radius="md">
          <Text size="xs" c="dimmed">Total Equipos</Text>
          <Text fw={700} size="xl">{summary.total}</Text>
        </Card>
        <Card withBorder padding="md" radius="md" style={{ borderLeft: '4px solid var(--mantine-color-green-6)' }}>
          <Text size="xs" c="dimmed">Operativos</Text>
          <Text fw={700} size="xl" c="green.6">{summary.operativos}</Text>
        </Card>
        <Card withBorder padding="md" radius="md" style={{ borderLeft: '4px solid var(--mantine-color-orange-6)' }}>
          <Text size="xs" c="dimmed">En Mantenimiento</Text>
          <Text fw={700} size="xl" c="orange.6">{summary.enMantenimiento}</Text>
        </Card>
        <Card withBorder padding="md" radius="md" style={{ borderLeft: `4px solid var(--mantine-color-${summary.alertas > 0 ? 'red' : 'gray'}-6)` }}>
          <Text size="xs" c="dimmed">Alertas Próximas</Text>
          <Text fw={700} size="xl" c={summary.alertas > 0 ? 'red.6' : undefined}>{summary.alertas}</Text>
        </Card>
      </SimpleGrid>

      <Group>
        <TextInput placeholder="Buscar por nombre o marca..." leftSection={<IconSearch size={16} />} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
        <Select placeholder="Categoría" data={CATEGORIAS.map(c => ({ value: c.value, label: c.label }))} value={filtroCategoria} onChange={v => setFiltroCategoria(v || '')} clearable w={170} />
        <Select placeholder="Estado" data={ESTADOS.map(e => ({ value: e.value, label: e.label }))} value={filtroEstado} onChange={v => setFiltroEstado(v || '')} clearable w={180} />
      </Group>

      <Paper withBorder style={{ overflowX: 'auto' }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Categoría</Table.Th>
              <Table.Th>Marca / Modelo</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Próx. Mantenimiento</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map(eq => {
              const cat = getCategoriaMeta(eq.categoria)
              const CatIcon = cat.icon
              const proxKm = eq.proximo_mantenimiento_km
              const proxHoras = eq.proximo_mantenimiento_horas
              const proxLabel = proxKm ? `${formatNumber(proxKm)} km` : proxHoras ? `${formatNumber(proxHoras)} h` : '-'
              return (
                <Table.Tr key={eq.id} style={{ cursor: 'pointer' }} onClick={() => { setSelected(eq); setTabEquipo('info'); loadMantenimientos(eq.id) }}>
                  <Table.Td fw={500}>{eq.nombre}</Table.Td>
                  <Table.Td>
                    <Group gap={6}>
                      <CatIcon size={16} color={`var(--mantine-color-${cat.color}-6)`} />
                      <Text size="sm">{cat.label}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{eq.marca || '-'}{eq.modelo ? ` / ${eq.modelo}` : ''}</Text>
                  </Table.Td>
                  <Table.Td>{getEstadoBadge(eq.estado)}</Table.Td>
                  <Table.Td>
                    <Text size="sm" c={proxKm || proxHoras ? 'orange.7' : 'dimmed'}>
                      {proxLabel}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} onClick={e => e.stopPropagation()}>
                      <ActionIcon variant="light" color="blue" onClick={() => openEdit(eq)}><IconEdit size={16} /></ActionIcon>
                      <ActionIcon variant="light" color="red" onClick={() => handleDelete(eq.id)}><IconTrash size={16} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )
            })}
            {filtered.length === 0 && (
              <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin equipos registrados</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {alertas.filter(a => a.dias_restantes !== null && a.dias_restantes <= 30).length > 0 && (
        <Paper withBorder p="sm">
          <Group mb="xs">
            <IconAlertTriangle size={20} color="var(--mantine-color-orange-6)" />
            <Text fw={600} size="sm">Equipos con mantenimiento próximo</Text>
          </Group>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Equipo</Table.Th>
                <Table.Th>Categoría</Table.Th>
                <Table.Th>Marca</Table.Th>
                <Table.Th>Estado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {alertas.filter(a => a.dias_restantes !== null && a.dias_restantes <= 30).map(a => {
                const urgente = a.dias_restantes <= 0
                return (
                  <Table.Tr key={a.equipo_id}>
                    <Table.Td>
                      <Group gap={6}>
                        <Text size="sm" fw={500} c={urgente ? 'red' : 'orange'}>{a.equipo_nombre}</Text>
                        {urgente && <Badge size="xs" color="red">Vencido</Badge>}
                      </Group>
                    </Table.Td>
                    <Table.Td><Badge size="sm" variant="light">{a.categoria}</Badge></Table.Td>
                    <Table.Td><Text size="sm">{a.equipo_marca || '-'}</Text></Table.Td>
                    <Table.Td><Badge size="sm" color={urgente ? 'red' : 'orange'}>{urgente ? 'Requiere atención' : `${a.dias_restantes} días`}</Badge></Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      <Modal opened={opened} onClose={close} title={editando ? 'Editar Equipo' : 'Nuevo Equipo'} size="lg">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select label="Finca" data={fincas.map(f => ({ value: f.id.toString(), label: f.nombre }))} value={form.finca_id} onChange={v => setForm({ ...form, finca_id: v })} required />
          <TextInput label="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
          <Select label="Categoría" data={CATEGORIAS.map(c => ({ value: c.value, label: c.label }))} value={form.categoria} onChange={v => setForm({ ...form, categoria: v })} />
          <TextInput label="Marca" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} />
          <TextInput label="Modelo" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} />
          <NumberInput label="Año" value={form.año ? parseInt(form.año) : ''} onChange={v => setForm({ ...form, año: v ? v.toString() : '' })} min={1900} max={2100} />
          <TextInput label="Número de Serie" value={form.numero_serie} onChange={e => setForm({ ...form, numero_serie: e.target.value })} />
          <TextInput label="Placa" value={form.placa} onChange={e => setForm({ ...form, placa: e.target.value })} />
          <NumberInput label="Potencia (HP)" value={form.potencia_hp ? parseFloat(form.potencia_hp) : ''} onChange={v => setForm({ ...form, potencia_hp: v ? v.toString() : '' })} min={0} />
          <TextInput label="Capacidad" value={form.capacidad} onChange={e => setForm({ ...form, capacidad: e.target.value })} />
          <Select label="Estado" data={ESTADOS.map(e => ({ value: e.value, label: e.label }))} value={form.estado} onChange={v => setForm({ ...form, estado: v })} />
          <TextInput label="Fecha Compra" type="date" value={form.fecha_compra} onChange={e => setForm({ ...form, fecha_compra: e.target.value })} />
          <NumberInput label="Valor Compra" value={form.valor_compra ? parseFloat(form.valor_compra) : ''} onChange={v => setForm({ ...form, valor_compra: v ? v.toString() : '' })} min={0} decimalScale={2} />
          <NumberInput label="Vida Útil (años)" value={form.vida_util_anos} onChange={v => setForm({ ...form, vida_util_anos: v || 10 })} min={1} />
          <NumberInput label="Valor Residual" value={form.valor_residual ? parseFloat(form.valor_residual) : ''} onChange={v => setForm({ ...form, valor_residual: v ? v.toString() : '' })} min={0} decimalScale={2} />
          <NumberInput label="Próx. Mantto (km)" value={form.proximo_mantenimiento_km ? parseFloat(form.proximo_mantenimiento_km) : ''} onChange={v => setForm({ ...form, proximo_mantenimiento_km: v ? v.toString() : '' })} min={0} />
          <NumberInput label="Próx. Mantto (horas)" value={form.proximo_mantenimiento_horas ? parseFloat(form.proximo_mantenimiento_horas) : ''} onChange={v => setForm({ ...form, proximo_mantenimiento_horas: v ? v.toString() : '' })} min={0} />
        </SimpleGrid>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editando ? 'Guardar' : 'Crear'}</Button>
        </Group>
      </Modal>

      <Modal opened={!!selected && !opened && !mttoOpened && !editMttoOpened} onClose={() => setSelected(null)} title={selected?.nombre || ''} size="lg" withCloseButton={false} closeOnClickOutside={false}>
        {selected && (
          <Tabs value={tabEquipo} onChange={setTabEquipo}>
            <Tabs.List>
              <Tabs.Tab value="info">Info</Tabs.Tab>
              <Tabs.Tab value="mantenimientos">Mantenimientos</Tabs.Tab>
              <Tabs.Tab value="costos">Costos</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="info" pt="sm">
              <SimpleGrid cols={2} spacing="xs">
                <Text size="sm"><strong>Categoría:</strong> {getCategoriaMeta(selected.categoria).label}</Text>
                <Text size="sm"><strong>Marca:</strong> {selected.marca || '-'}</Text>
                <Text size="sm"><strong>Modelo:</strong> {selected.modelo || '-'}</Text>
                <Text size="sm"><strong>Año:</strong> {selected.año || '-'}</Text>
                <Text size="sm"><strong>Estado:</strong> {getEstadoBadge(selected.estado)}</Text>
                <Text size="sm"><strong>Serie:</strong> {selected.numero_serie || '-'}</Text>
                <Text size="sm"><strong>Placa:</strong> {selected.placa || '-'}</Text>
                <Text size="sm"><strong>Potencia:</strong> {selected.potencia_hp ? `${formatNumber(selected.potencia_hp)} HP` : '-'}</Text>
                <Text size="sm"><strong>Capacidad:</strong> {selected.capacidad || '-'}</Text>
                <Text size="sm"><strong>Fecha Compra:</strong> {selected.fecha_compra || '-'}</Text>
                <Text size="sm"><strong>Valor Compra:</strong> {selected.valor_compra ? formatCOP(selected.valor_compra) : '-'}</Text>
                <Text size="sm"><strong>Valor Residual:</strong> {selected.valor_residual ? formatCOP(selected.valor_residual) : '-'}</Text>
                <Text size="sm"><strong>Vida Útil:</strong> {selected.vida_util_anos ? `${selected.vida_util_anos} años` : '-'}</Text>
                <Text size="sm"><strong>Próx. Mantto (km):</strong> {selected.proximo_mantenimiento_km ? formatNumber(selected.proximo_mantenimiento_km) : '-'}</Text>
                <Text size="sm"><strong>Próx. Mantto (horas):</strong> {selected.proximo_mantenimiento_horas ? formatNumber(selected.proximo_mantenimiento_horas) : '-'}</Text>
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="mantenimientos" pt="sm">
              <Group justify="space-between" mb="sm">
                <Text size="sm" fw={500}>{mantenimientos.length} registros</Text>
                <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => { setMttoForm({ ...mttoForm, equipo_id: selected.id, fecha: new Date().toISOString().split('T')[0], tipo: 'preventivo' }); openMtto() }}>Registrar</Button>
              </Group>
              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Fecha</Table.Th>
                      <Table.Th>Tipo</Table.Th>
                      <Table.Th>Descripción</Table.Th>
                      <Table.Th>Costo</Table.Th>
                      <Table.Th>Proveedor</Table.Th>
                      <Table.Th>Próx. Fecha</Table.Th>
                      <Table.Th>Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {mantenimientos.map(m => (
                      <Table.Tr key={m.id}>
                        <Table.Td>{m.fecha}</Table.Td>
                        <Table.Td>
                          <Badge size="sm" color={m.tipo === 'preventivo' ? 'blue' : m.tipo === 'correctivo' ? 'red' : 'yellow'} variant="light">{m.tipo}</Badge>
                        </Table.Td>
                        <Table.Td><Text size="sm" lineClamp={2}>{m.descripcion || '-'}</Text></Table.Td>
                        <Table.Td>{m.costo ? formatCOP(m.costo) : '-'}</Table.Td>
                        <Table.Td><Text size="sm">{m.proveedor || '-'}</Text></Table.Td>
                        <Table.Td><Text size="sm" c={m.proximo_mantenimiento_fecha ? 'orange.7' : 'dimmed'}>{m.proximo_mantenimiento_fecha || '-'}</Text></Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            <ActionIcon variant="light" color="blue" size="sm" onClick={() => openEditMttoFn(m)}><IconEdit size={14} /></ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    {mantenimientos.length === 0 && (
                      <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center">Sin mantenimientos registrados</Text></Table.Td></Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </div>
            </Tabs.Panel>

            <Tabs.Panel value="costos" pt="sm">
              <Stack>
                <Card withBorder padding="md">
                  <Text size="xs" c="dimmed">Total invertido en mantenimiento</Text>
                  <Text fw={700} size="xl">{formatCOP(totalCostos)}</Text>
                </Card>
                <Text size="sm" c="dimmed">
                  {mantenimientos.length} mantenimientos registrados, promedio de {mantenimientos.length ? formatCOP(totalCostos / mantenimientos.length) : '$0'} por servicio.
                </Text>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setSelected(null)}>Cerrar</Button>
        </Group>
      </Modal>

      <Modal opened={mttoOpened} onClose={closeMtto} title="Registrar Mantenimiento" size="md">
        <Stack>
          <TextInput label="Fecha" type="date" value={mttoForm.fecha} onChange={e => setMttoForm({ ...mttoForm, fecha: e.target.value })} required />
          <Select label="Tipo" data={[{ value: 'preventivo', label: 'Preventivo' }, { value: 'correctivo', label: 'Correctivo' }, { value: 'revision', label: 'Revisión' }]} value={mttoForm.tipo} onChange={v => setMttoForm({ ...mttoForm, tipo: v })} />
          <TextInput label="Descripción" value={mttoForm.descripcion} onChange={e => setMttoForm({ ...mttoForm, descripcion: e.target.value })} />
          <NumberInput label="Costo" value={mttoForm.costo ? parseFloat(mttoForm.costo) : ''} onChange={v => setMttoForm({ ...mttoForm, costo: v ? v.toString() : '' })} min={0} decimalScale={2} />
          <TextInput label="Proveedor" value={mttoForm.proveedor} onChange={e => setMttoForm({ ...mttoForm, proveedor: e.target.value })} />
          <TextInput label="Próximo Mantenimiento (fecha)" type="date" value={mttoForm.proximo_mantenimiento_fecha} onChange={e => setMttoForm({ ...mttoForm, proximo_mantenimiento_fecha: e.target.value })} />
          <NumberInput label="Kilometraje" value={mttoForm.kilometraje ? parseFloat(mttoForm.kilometraje) : ''} onChange={v => setMttoForm({ ...mttoForm, kilometraje: v ? v.toString() : '' })} min={0} />
          <NumberInput label="Horas Operación" value={mttoForm.horas_operacion ? parseFloat(mttoForm.horas_operacion) : ''} onChange={v => setMttoForm({ ...mttoForm, horas_operacion: v ? v.toString() : '' })} min={0} />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeMtto}>Cancelar</Button>
            <Button onClick={handleMttoSubmit}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={editMttoOpened} onClose={closeEditMtto} title="Editar Mantenimiento" size="md">
        <Stack>
          <TextInput label="Fecha" type="date" value={mttoForm.fecha} onChange={e => setMttoForm({ ...mttoForm, fecha: e.target.value })} required />
          <Select label="Tipo" data={[{ value: 'preventivo', label: 'Preventivo' }, { value: 'correctivo', label: 'Correctivo' }, { value: 'revision', label: 'Revisión' }]} value={mttoForm.tipo} onChange={v => setMttoForm({ ...mttoForm, tipo: v })} />
          <TextInput label="Descripción" value={mttoForm.descripcion} onChange={e => setMttoForm({ ...mttoForm, descripcion: e.target.value })} />
          <NumberInput label="Costo" value={mttoForm.costo ? parseFloat(mttoForm.costo) : ''} onChange={v => setMttoForm({ ...mttoForm, costo: v ? v.toString() : '' })} min={0} decimalScale={2} />
          <TextInput label="Proveedor" value={mttoForm.proveedor} onChange={e => setMttoForm({ ...mttoForm, proveedor: e.target.value })} />
          <TextInput label="Próximo Mantenimiento (fecha)" type="date" value={mttoForm.proximo_mantenimiento_fecha} onChange={e => setMttoForm({ ...mttoForm, proximo_mantenimiento_fecha: e.target.value })} />
          <NumberInput label="Kilometraje" value={mttoForm.kilometraje ? parseFloat(mttoForm.kilometraje) : ''} onChange={v => setMttoForm({ ...mttoForm, kilometraje: v ? v.toString() : '' })} min={0} />
          <NumberInput label="Horas Operación" value={mttoForm.horas_operacion ? parseFloat(mttoForm.horas_operacion) : ''} onChange={v => setMttoForm({ ...mttoForm, horas_operacion: v ? v.toString() : '' })} min={0} />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeEditMtto}>Cancelar</Button>
            <Button onClick={handleEditMttoSubmit}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
