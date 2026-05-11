import { useEffect, useState } from 'react'
import { Paper, Table, Title, Group, Button, Modal, Select, NumberInput, TextInput, Textarea, Stack, SimpleGrid, Text, Badge, Loader, ActionIcon, Alert } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { BarChart } from '@mantine/charts'
import { IconPlus, IconBuildingBank, IconArrowRight, IconAlertCircle, IconRefresh } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatCOP } from '../config.js'

const EMPTY_DATA = {
  total_ingresos: 0, total_gastos: 0, balance: 0, margen: 0,
  total_animales: 0, area_total: 0, ingreso_por_finca: [], gasto_por_finca: [],
}

export default function Consolidado() {
  const [data, setData] = useState(null)
  const [fincas, setFincas] = useState([])
  const [fincaId, setFincaId] = useState('')
  const [insumos, setInsumos] = useState([])
  const [transferencias, setTransferencias] = useState([])
  const [opened, { open, close }] = useDisclosure(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    tipo: 'transferencia', insumo_id: '', finca_origen_id: '',
    finca_destino_id: '', cantidad: '', costo_unitario: '',
    fecha: new Date().toISOString().split('T')[0], observaciones: '',
  })

  const load = async () => {
    setError(null)
    const params = fincaId ? { finca_id: fincaId } : {}
    const results = await Promise.allSettled([
      api.get('/consolidado-contable/', { params }),
      api.get('/lotes/fincas/'),
      api.get('/finanzas/insumos/'),
      api.get('/transferencias-insumos/'),
    ])
    const [con, fins, ins, trans] = results.map(r => r.status === 'fulfilled' ? r.value : null)
    setData(con?.data || EMPTY_DATA)
    setFincas(Array.isArray(fins?.data) ? fins.data : [])
    setInsumos(ins?.data || [])
    setTransferencias(trans?.data || [])
    const errors = results.filter(r => r.status === 'rejected')
    if (errors.length > 0) {
      setError(`No se pudieron cargar algunos datos (${errors.length}/${results.length})`)
      notifications.show({ title: 'Error parcial al cargar datos', color: 'orange' })
    }
  }

  useEffect(() => { load() }, [fincaId])

  const handleCrear = async () => {
    setLoading(true)
    try {
      await api.post('/transferencias-insumos/', {
        insumo_id: parseInt(form.insumo_id),
        cantidad: parseFloat(form.cantidad),
        finca_origen_id: form.finca_origen_id ? parseInt(form.finca_origen_id) : null,
        finca_destino_id: parseInt(form.finca_destino_id),
        fecha: form.fecha,
        costo_unitario: form.costo_unitario ? parseFloat(form.costo_unitario) : null,
        tipo: form.tipo,
        observaciones: form.observaciones || null,
      })
      notifications.show({ title: 'Transferencia registrada', color: 'green' })
      close()
      setForm({ tipo: 'transferencia', insumo_id: '', finca_origen_id: '', finca_destino_id: '', cantidad: '', costo_unitario: '', fecha: new Date().toISOString().split('T')[0], observaciones: '' })
      load()
    } catch {
      notifications.show({ title: 'Error al registrar', color: 'red' })
    } finally { setLoading(false) }
  }

  if (!data) return <Loader />

  const ingresoChart = (data.ingreso_por_finca || []).map(f => ({
    Finca: (f.finca_nombre || '').slice(0, 12),
    Ingresos: Math.round((f.total_ingresos || 0) / 1000),
    Gastos: Math.round((f.total_gastos || 0) / 1000),
  }))

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Consolidado Contable</Title>
        <Group>
          {error && (
            <Button variant="subtle" color="orange" leftSection={<IconRefresh size={16} />} onClick={load}>
              Reintentar
            </Button>
          )}
          <Button leftSection={<IconPlus size={16} />} onClick={open}>Nueva Transferencia</Button>
        </Group>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Error parcial" color="orange" variant="outline">
          {error}
        </Alert>
      )}

      <Select
        label="Filtrar por finca"
        placeholder="Todas las fincas"
        data={[{ value: '', label: 'Todas las fincas' }, ...fincas.map(f => ({ value: f.id.toString(), label: f.nombre }))]}
        value={fincaId}
        onChange={setFincaId}
        clearable
        w={300}
      />

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed">Ingresos Totales</Text>
          <Text size="xl" fw={700} c="green">{formatCOP(data.total_ingresos ?? 0)}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed">Gastos Totales</Text>
          <Text size="xl" fw={700} c="red">{formatCOP(data.total_gastos ?? 0)}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder bg={(data.balance ?? 0) >= 0 ? 'green.0' : 'red.0'}>
          <Text size="xs" c="dimmed">Balance</Text>
          <Text size="xl" fw={700} c={(data.balance ?? 0) >= 0 ? 'green' : 'red'}>{formatCOP(data.balance ?? 0)}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed">Margen</Text>
          <Text size="xl" fw={700} c={(data.margen ?? 0) >= 0 ? 'green' : 'red'}>{(data.margen ?? 0).toFixed(1)}%</Text>
        </Paper>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Paper p="md" radius="md" withBorder>
          <Text fw={600} mb="md">Animales Activos</Text>
          <Text size="xl" fw={700}>{data.total_animales ?? 0}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Text fw={600} mb="md">Área Total (ha)</Text>
          <Text size="xl" fw={700}>{(data.area_total ?? 0).toFixed(2)}</Text>
        </Paper>
      </SimpleGrid>

      {ingresoChart.length > 0 && (
        <Paper p="md" radius="md" withBorder>
          <Text fw={600} mb="md">Ingresos vs Gastos por Finca (miles COP)</Text>
          <BarChart h={350} data={ingresoChart} dataKey="Finca" series={[{ name: 'Ingresos', color: 'green.6' }, { name: 'Gastos', color: 'red.5' }]} valueFormatter={v => `$${v}k`} tickLine="y" />
        </Paper>
      )}

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Paper p="md" radius="md" withBorder>
          <Text fw={600} mb="md">Ingresos por Finca</Text>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr><Table.Th>Finca</Table.Th><Table.Th>Ingresos</Table.Th><Table.Th>Gastos</Table.Th><Table.Th>Balance</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data.ingreso_por_finca || []).map(f => (
                <Table.Tr key={f.finca_id}>
                  <Table.Td>{f.finca_nombre}</Table.Td>
                  <Table.Td c="green">{formatCOP(f.total_ingresos ?? 0)}</Table.Td>
                  <Table.Td c="red">{formatCOP(f.total_gastos ?? 0)}</Table.Td>
                  <Table.Td fw={600} c={(f.balance ?? 0) >= 0 ? 'green' : 'red'}>{formatCOP(f.balance ?? 0)}</Table.Td>
                </Table.Tr>
              ))}
              {(data.ingreso_por_finca || []).length === 0 && (
                <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center" py="md">Sin datos</Text></Table.Td></Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Text fw={600} mb="md">Gastos por Finca</Text>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr><Table.Th>Finca</Table.Th><Table.Th>Gastos</Table.Th><Table.Th>% del Total</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data.gasto_por_finca || []).map(f => (
                <Table.Tr key={f.finca_id}>
                  <Table.Td>{f.finca_nombre}</Table.Td>
                  <Table.Td c="red">{formatCOP(f.total_gastos ?? 0)}</Table.Td>
                  <Table.Td>{(data.total_gastos ?? 0) > 0 ? (((f.total_gastos ?? 0) / (data.total_gastos ?? 0)) * 100).toFixed(1) : 0}%</Table.Td>
                </Table.Tr>
              ))}
              {(data.gasto_por_finca || []).length === 0 && (
                <Table.Tr><Table.Td colSpan={3}><Text c="dimmed" ta="center" py="md">Sin datos</Text></Table.Td></Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      </SimpleGrid>

      <Paper p="md" radius="md" withBorder>
        <Text fw={600} mb="md">Transferencias entre Fincas</Text>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr><Table.Th>Fecha</Table.Th><Table.Th>Tipo</Table.Th><Table.Th>Insumo</Table.Th><Table.Th>Origen</Table.Th><Table.Th>Destino</Table.Th><Table.Th>Cantidad</Table.Th><Table.Th>Costo Unit.</Table.Th></Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {transferencias.length === 0 ? (
              <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center" py="md">No hay transferencias registradas</Text></Table.Td></Table.Tr>
            ) : transferencias.map(t => (
              <Table.Tr key={t.id}>
                <Table.Td>{t.fecha}</Table.Td>
                <Table.Td><Badge size="sm" color={t.tipo === 'compra_conjunta' ? 'blue' : t.tipo === 'devolucion' ? 'orange' : 'violet'}>{t.tipo.replace('_', ' ')}</Badge></Table.Td>
                <Table.Td>{t.insumo_nombre || '—'}</Table.Td>
                <Table.Td>{t.finca_origen_nombre || 'Externo'}</Table.Td>
                <Table.Td>{t.finca_destino_nombre}</Table.Td>
                <Table.Td>{t.cantidad}</Table.Td>
                <Table.Td>{t.costo_unitario ? formatCOP(t.costo_unitario) : '—'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title="Nueva Transferencia de Insumo" size="md">
        <Stack>
          <Select label="Tipo *" data={[
            { value: 'compra_conjunta', label: 'Compra Conjunta' },
            { value: 'transferencia', label: 'Transferencia' },
            { value: 'devolucion', label: 'Devolución' },
          ]} value={form.tipo} onChange={v => setForm({ ...form, tipo: v })} />
          <Select label="Insumo *" data={insumos.map(i => ({ value: i.id.toString(), label: `${i.nombre} (${i.unidad_medida})` }))} value={form.insumo_id} onChange={v => setForm({ ...form, insumo_id: v })} searchable />
          <Select label="Finca Origen" data={fincas.map(f => ({ value: f.id.toString(), label: f.nombre }))} value={form.finca_origen_id} onChange={v => setForm({ ...form, finca_origen_id: v })} clearable placeholder="Externo / No aplica" />
          <Select label="Finca Destino *" data={fincas.map(f => ({ value: f.id.toString(), label: f.nombre }))} value={form.finca_destino_id} onChange={v => setForm({ ...form, finca_destino_id: v })} searchable />
          <NumberInput label="Cantidad *" value={form.cantidad} onChange={v => setForm({ ...form, cantidad: v })} min={0} />
          <NumberInput label="Costo Unitario" value={form.costo_unitario} onChange={v => setForm({ ...form, costo_unitario: v })} min={0} />
          <TextInput label="Fecha *" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
          <Textarea label="Observaciones" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>Cancelar</Button>
            <Button onClick={handleCrear} loading={loading} disabled={!form.insumo_id || !form.finca_destino_id || !form.cantidad}>Registrar</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
