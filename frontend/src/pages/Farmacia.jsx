import { useEffect, useState, useCallback } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, Stack, SimpleGrid, Text, ActionIcon,
  Tabs, Switch, Textarea,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPill, IconPlus, IconEdit, IconTrash, IconAlertTriangle,
  IconPackage, IconStethoscope, IconCalendarDue,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import api from '../services/api.js'

const CATEGORIAS = [
  { value: 'vacuna', label: 'Vacuna', color: 'blue' },
  { value: 'antibiotico', label: 'Antibiótico', color: 'red' },
  { value: 'antiparasitario', label: 'Antiparasitario', color: 'orange' },
  { value: 'antiinflamatorio', label: 'Antiinflamatorio', color: 'yellow' },
  { value: 'vitamina', label: 'Vitamina', color: 'green' },
  { value: 'suplemento', label: 'Suplemento', color: 'teal' },
  { value: 'desinfectante', label: 'Desinfectante', color: 'gray' },
  { value: 'otro', label: 'Otro', color: 'violet' },
]

const VIAS_ADMIN = [
  { value: 'oral', label: 'Oral' },
  { value: 'inyectable', label: 'Inyectable' },
  { value: 'topica', label: 'Tópica' },
  { value: 'intramuscular', label: 'Intramuscular' },
  { value: 'subcutanea', label: 'Subcutánea' },
  { value: 'intravenosa', label: 'Intravenosa' },
]

function MedForm({ form, setForm, errors }) {
  return (
    <Stack>
      <TextInput label="Nombre *" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required error={errors?.nombre} />
      <TextInput label="Principio Activo" value={form.principio_activo} onChange={e => setForm({ ...form, principio_activo: e.target.value })} />
      <Select label="Categoría *" data={CATEGORIAS.map(c => ({ value: c.value, label: c.label }))} value={form.categoria} onChange={v => setForm({ ...form, categoria: v })} required error={errors?.categoria} />
      <SimpleGrid cols={2}>
        <TextInput label="Presentación" value={form.presentacion} onChange={e => setForm({ ...form, presentacion: e.target.value })} />
        <TextInput label="Concentración" value={form.concentracion} onChange={e => setForm({ ...form, concentracion: e.target.value })} />
      </SimpleGrid>
      <Select label="Vía de Administración" data={VIAS_ADMIN} value={form.via_admin} onChange={v => setForm({ ...form, via_admin: v || 'oral' })} />
      <SimpleGrid cols={2}>
        <TextInput label="Dosis de Referencia" value={form.dosis_referencia} onChange={e => setForm({ ...form, dosis_referencia: e.target.value })} />
        <NumberInput label="Intervalo de Retiro (días)" value={form.intervalo_retiro} onChange={v => setForm({ ...form, intervalo_retiro: v })} min={0} />
      </SimpleGrid>
      <TextInput label="Fabricante" value={form.fabricante} onChange={e => setForm({ ...form, fabricante: e.target.value })} />
      <Switch label="Requiere Receta" checked={form.requiere_receta} onChange={e => setForm({ ...form, requiere_receta: e.currentTarget.checked })} />
    </Stack>
  )
}

function TabMedicamentos({ medicamentos, loading, onEdit, onDelete, onNew }) {
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Medicamentos</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={onNew}>Nuevo Medicamento</Button>
      </Group>
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Principio Activo</Table.Th>
              <Table.Th>Categoría</Table.Th>
              <Table.Th>Presentación</Table.Th>
              <Table.Th>Vía</Table.Th>
              <Table.Th>Stock</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th style={{ width: 80 }}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {medicamentos.map(m => {
              const cat = CATEGORIAS.find(c => c.value === m.categoria)
              return (
                <Table.Tr key={m.id}>
                  <Table.Td fw={500}>{m.nombre}</Table.Td>
                  <Table.Td>{m.principio_activo || '-'}</Table.Td>
                  <Table.Td><Badge color={cat?.color || 'gray'} size="sm" variant="light">{cat?.label || m.categoria}</Badge></Table.Td>
                  <Table.Td>{m.presentacion || '-'}</Table.Td>
                  <Table.Td>{VIAS_ADMIN.find(v => v.value === m.via_admin)?.label || m.via_admin}</Table.Td>
                  <Table.Td>
                    <Badge color={m.stock_actual > 0 ? 'green' : 'red'} size="sm">
                      {m.stock_actual > 0 ? `${m.stock_actual} uds` : 'Sin stock'}
                    </Badge>
                  </Table.Td>
                  <Table.Td><Badge color={m.activo ? 'green' : 'gray'} size="sm">{m.activo ? 'Activo' : 'Inactivo'}</Badge></Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <ActionIcon variant="light" color="blue" size="sm" onClick={() => onEdit(m)}><IconEdit size={14} /></ActionIcon>
                      <ActionIcon variant="light" color="red" size="sm" onClick={() => onDelete(m.id)}><IconTrash size={14} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )
            })}
            {medicamentos.length === 0 && (
              <Table.Tr><Table.Td colSpan={8}><Text c="dimmed" ta="center">Sin medicamentos registrados</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}

function TabInventario({ inventario, medicamentos, onAddStock }) {
  const hoy = dayjs()
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Inventario</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={onAddStock}>Registrar Entrada</Button>
      </Group>
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Medicamento</Table.Th>
              <Table.Th>Lote</Table.Th>
              <Table.Th>Cantidad</Table.Th>
              <Table.Th>Vencimiento</Table.Th>
              <Table.Th>Estado</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {inventario.map(i => {
              const venc = dayjs(i.fecha_vencimiento)
              const diffDays = venc.diff(hoy, 'day')
              let badgeColor = 'green'
              let badgeLabel = 'Vigente'
              if (diffDays < 0) { badgeColor = 'red'; badgeLabel = 'Vencido' }
              else if (diffDays <= 30) { badgeColor = 'orange'; badgeLabel = `Vence en ${diffDays}d` }
              return (
                <Table.Tr key={i.id}>
                  <Table.Td fw={500}>{i.medicina_nombre || `#${i.medicina_id}`}</Table.Td>
                  <Table.Td>{i.lote}</Table.Td>
                  <Table.Td>{i.cantidad}</Table.Td>
                  <Table.Td>{dayjs(i.fecha_vencimiento).format('DD/MM/YYYY')}</Table.Td>
                  <Table.Td><Badge color={badgeColor} size="sm">{badgeLabel}</Badge></Table.Td>
                </Table.Tr>
              )
            })}
            {inventario.length === 0 && (
              <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center">Sin inventario registrado</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}

function TabAplicaciones({ aplicaciones, onNewApp }) {
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Aplicaciones</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={onNewApp}>Registrar Aplicación</Button>
      </Group>
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Animal</Table.Th>
              <Table.Th>Medicamento</Table.Th>
              <Table.Th>Dosis</Table.Th>
              <Table.Th>Responsable</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {aplicaciones.map(a => (
              <Table.Tr key={a.id}>
                <Table.Td>{dayjs(a.fecha).format('DD/MM/YYYY')}</Table.Td>
                <Table.Td fw={500}>{a.animal_codigo || `#${a.animal_id}`}</Table.Td>
                <Table.Td>{a.medicina_nombre || `#${a.medicina_id}`}</Table.Td>
                <Table.Td>{a.dosis || '-'}</Table.Td>
                <Table.Td>{a.responsable || '-'}</Table.Td>
              </Table.Tr>
            ))}
            {aplicaciones.length === 0 && (
              <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center">Sin aplicaciones registradas</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}

export default function Farmacia() {
  const [medicamentos, setMedicamentos] = useState([])
  const [inventario, setInventario] = useState([])
  const [aplicaciones, setAplicaciones] = useState([])
  const [animales, setAnimales] = useState([])
  const [loading, setLoading] = useState(false)

  const [medModal, { open: openMed, close: closeMed }] = useDisclosure(false)
  const [stockModal, { open: openStock, close: closeStock }] = useDisclosure(false)
  const [appModal, { open: openApp, close: closeApp }] = useDisclosure(false)
  const [editandoMed, setEditandoMed] = useState(null)
  const [medForm, setMedForm] = useState({
    nombre: '', principio_activo: '', categoria: 'vacuna',
    presentacion: '', concentracion: '', via_admin: 'oral',
    dosis_referencia: '', intervalo_retiro: '', fabricante: '', requiere_receta: false,
  })
  const [stockForm, setStockForm] = useState({ medicina_id: '', lote: '', cantidad: 1, fecha_vencimiento: '' })
  const [appForm, setAppForm] = useState({ animal_id: '', medicina_id: '', fecha: new Date().toISOString().split('T')[0], dosis: '', responsable: '' })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [medR, invR, appR, animR] = await Promise.all([
        api.get('/farmacia/'),
        api.get('/farmacia/inventario'),
        api.get('/farmacia/aplicaciones'),
        api.get('/animales/').catch(() => ({ data: [] })),
      ])
      setMedicamentos(Array.isArray(medR.data) ? medR.data : [])
      setInventario(Array.isArray(invR.data) ? invR.data : [])
      setAplicaciones(Array.isArray(appR.data) ? appR.data : [])
      setAnimales(Array.isArray(animR.data) ? animR.data : [])
    } catch { setMedicamentos([]); setInventario([]); setAplicaciones([]); setAnimales([]) }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const proximosVencer = inventario.filter(i => {
    const diff = dayjs(i.fecha_vencimiento).diff(dayjs(), 'day')
    return diff >= 0 && diff <= 30
  }).length

  const sinStock = medicamentos.filter(m => m.stock_actual <= 0).length
  const appsMes = aplicaciones.filter(a => dayjs(a.fecha).isSame(dayjs(), 'month')).length

  const resetMedForm = () => setMedForm({
    nombre: '', principio_activo: '', categoria: 'vacuna',
    presentacion: '', concentracion: '', via_admin: 'oral',
    dosis_referencia: '', intervalo_retiro: '', fabricante: '', requiere_receta: false,
  })

  const handleSaveMed = async () => {
    if (!medForm.nombre?.trim() || !medForm.categoria) {
      notifications.show({ title: 'Nombre y categoría son obligatorios', color: 'yellow' })
      return
    }
    try {
      const payload = {
        ...medForm,
        intervalo_retiro: medForm.intervalo_retiro ? parseInt(medForm.intervalo_retiro) : null,
      }
      if (editandoMed) {
        await api.put(`/farmacia/${editandoMed}`, payload)
        notifications.show({ title: 'Medicamento actualizado', color: 'green' })
      } else {
        await api.post('/farmacia/', payload)
        notifications.show({ title: 'Medicamento creado', color: 'green' })
      }
      closeMed()
      setEditandoMed(null)
      resetMedForm()
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleEditMed = (m) => {
    setEditandoMed(m.id)
    setMedForm({
      nombre: m.nombre || '', principio_activo: m.principio_activo || '',
      categoria: m.categoria || 'vacuna', presentacion: m.presentacion || '',
      concentracion: m.concentracion || '', via_admin: m.via_admin || 'oral',
      dosis_referencia: m.dosis_referencia || '',
      intervalo_retiro: m.intervalo_retiro?.toString() || '',
      fabricante: m.fabricante || '', requiere_receta: m.requiere_receta || false,
    })
    openMed()
  }

  const handleDeleteMed = async (id) => {
    if (!confirm('¿Desactivar este medicamento?')) return
    try {
      await api.delete(`/farmacia/${id}`)
      notifications.show({ title: 'Medicamento desactivado', color: 'red' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', color: 'red' })
    }
  }

  const handleAddStock = async () => {
    if (!stockForm.medicina_id || !stockForm.lote?.trim() || !stockForm.fecha_vencimiento) {
      notifications.show({ title: 'Completa todos los campos', color: 'yellow' })
      return
    }
    try {
      await api.post('/farmacia/inventario', {
        ...stockForm,
        medicina_id: parseInt(stockForm.medicina_id),
        cantidad: parseFloat(stockForm.cantidad),
      })
      notifications.show({ title: 'Stock registrado', color: 'green' })
      closeStock()
      setStockForm({ medicina_id: '', lote: '', cantidad: 1, fecha_vencimiento: '' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleAddApp = async () => {
    if (!appForm.animal_id || !appForm.medicina_id) {
      notifications.show({ title: 'Animal y medicamento son obligatorios', color: 'yellow' })
      return
    }
    try {
      await api.post('/farmacia/aplicaciones', {
        ...appForm,
        animal_id: parseInt(appForm.animal_id),
        medicina_id: parseInt(appForm.medicina_id),
      })
      notifications.show({ title: 'Aplicación registrada', color: 'green' })
      closeApp()
      setAppForm({ animal_id: '', medicina_id: '', fecha: new Date().toISOString().split('T')[0], dosis: '', responsable: '' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  return (
    <Stack>
      <Title order={3}>Farmacia Veterinaria</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Paper p="md" radius="md" withBorder>
          <Group><IconPill size={28} color="var(--mantine-color-blue-6)" /><div><Text size="xs" c="dimmed">Medicamentos</Text><Text size="xl" fw={700}>{medicamentos.length}</Text></div></Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconCalendarDue size={28} color="var(--mantine-color-orange-6)" /><div><Text size="xs" c="dimmed">Próximos a vencer</Text><Text size="xl" fw={700} c="orange">{proximosVencer}</Text></div></Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconAlertTriangle size={28} color="var(--mantine-color-red-6)" /><div><Text size="xs" c="dimmed">Sin stock</Text><Text size="xl" fw={700} c="red">{sinStock}</Text></div></Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconStethoscope size={28} color="var(--mantine-color-green-6)" /><div><Text size="xs" c="dimmed">Aplicaciones del mes</Text><Text size="xl" fw={700} c="green">{appsMes}</Text></div></Group>
        </Paper>
      </SimpleGrid>

      {proximosVencer > 0 && (
        <Paper p="sm" withBorder bg="orange.0">
          <Group>
            <IconAlertTriangle size={20} color="var(--mantine-color-orange-6)" />
            <Text size="sm" fw={500}>{proximosVencer} medicamento(s) próximos a vencer (dentro de 30 días)</Text>
          </Group>
        </Paper>
      )}

      <Tabs defaultValue="medicamentos">
        <Tabs.List>
          <Tabs.Tab value="medicamentos" leftSection={<IconPill size={16} />}>Medicamentos</Tabs.Tab>
          <Tabs.Tab value="inventario" leftSection={<IconPackage size={16} />}>Inventario</Tabs.Tab>
          <Tabs.Tab value="aplicaciones" leftSection={<IconStethoscope size={16} />}>Aplicaciones</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="medicamentos" pt="md">
          <TabMedicamentos
            medicamentos={medicamentos} loading={loading}
            onEdit={handleEditMed} onDelete={handleDeleteMed}
            onNew={() => { setEditandoMed(null); resetMedForm(); openMed() }}
          />
        </Tabs.Panel>
        <Tabs.Panel value="inventario" pt="md">
          <TabInventario inventario={inventario} medicamentos={medicamentos}
            onAddStock={() => { setStockForm({ medicina_id: '', lote: '', cantidad: 1, fecha_vencimiento: '' }); openStock() }}
          />
        </Tabs.Panel>
        <Tabs.Panel value="aplicaciones" pt="md">
          <TabAplicaciones aplicaciones={aplicaciones}
            onNewApp={() => { setAppForm({ animal_id: '', medicina_id: '', fecha: new Date().toISOString().split('T')[0], dosis: '', responsable: '' }); openApp() }}
          />
        </Tabs.Panel>
      </Tabs>

      <Modal opened={medModal} onClose={closeMed} title={editandoMed ? 'Editar Medicamento' : 'Nuevo Medicamento'} size="lg">
        <MedForm form={medForm} setForm={setMedForm} />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeMed}>Cancelar</Button>
          <Button onClick={handleSaveMed}>{editandoMed ? 'Actualizar' : 'Guardar'}</Button>
        </Group>
      </Modal>

      <Modal opened={stockModal} onClose={closeStock} title="Registrar Entrada de Stock" size="md">
        <Stack>
          <Select label="Medicamento *" data={medicamentos.filter(m => m.activo).map(m => ({ value: m.id.toString(), label: m.nombre }))}
            value={stockForm.medicina_id} onChange={v => setStockForm({ ...stockForm, medicina_id: v })} searchable required />
          <TextInput label="Lote *" value={stockForm.lote} onChange={e => setStockForm({ ...stockForm, lote: e.target.value })} required />
          <NumberInput label="Cantidad *" value={stockForm.cantidad} onChange={v => setStockForm({ ...stockForm, cantidad: v })} min={0.1} required />
          <TextInput label="Fecha de Vencimiento *" type="date" value={stockForm.fecha_vencimiento} onChange={e => setStockForm({ ...stockForm, fecha_vencimiento: e.target.value })} required />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeStock}>Cancelar</Button>
            <Button onClick={handleAddStock}>Registrar</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={appModal} onClose={closeApp} title="Registrar Aplicación" size="md">
        <Stack>
          <Select label="Animal *" data={animales.map(a => ({ value: a.id.toString(), label: `${a.codigo || a.nombre || '#' + a.id} - ${a.especie}` }))}
            value={appForm.animal_id} onChange={v => setAppForm({ ...appForm, animal_id: v })} searchable required />
          <Select label="Medicamento *" data={medicamentos.filter(m => m.activo && m.stock_actual > 0).map(m => ({ value: m.id.toString(), label: `${m.nombre} (stock: ${m.stock_actual})` }))}
            value={appForm.medicina_id} onChange={v => setAppForm({ ...appForm, medicina_id: v })} searchable required />
          <TextInput label="Fecha *" type="date" value={appForm.fecha} onChange={e => setAppForm({ ...appForm, fecha: e.target.value })} required />
          <TextInput label="Dosis" value={appForm.dosis} onChange={e => setAppForm({ ...appForm, dosis: e.target.value })} />
          <TextInput label="Responsable" value={appForm.responsable} onChange={e => setAppForm({ ...appForm, responsable: e.target.value })} />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeApp}>Cancelar</Button>
            <Button onClick={handleAddApp}>Registrar</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
