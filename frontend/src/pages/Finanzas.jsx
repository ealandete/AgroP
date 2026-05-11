import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, Stack, SimpleGrid, Text, Tabs,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconSearch } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatCOP, formatNumber } from '../config.js'

export default function Finanzas() {
  const [ventas, setVentas] = useState([])
  const [costos, setCostos] = useState([])
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [vOpened, { open: vOpen, close: vClose }] = useDisclosure(false)
  const [cOpened, { open: cOpen, close: cClose }] = useDisclosure(false)
  const [vForm, setVForm] = useState({
    producto_id: '', finca_id: 1, fecha: new Date().toISOString().split('T')[0],
    cliente: '', cantidad: '', precio_unitario: '', medio_pago: 'efectivo',
  })
  const [cForm, setCForm] = useState({
    categoria_id: '', finca_id: 1, fecha: new Date().toISOString().split('T')[0],
    descripcion: '', monto: '', medio_pago: 'efectivo',
  })
  const [search, setSearch] = useState('')

  const loadData = async () => {
    const [v, c, p, cat] = await Promise.all([
      api.get('/finanzas/ventas'), api.get('/finanzas/costos'),
      api.get('/finanzas/productos'), api.get('/finanzas/categorias'),
    ])
    setVentas(v.data); setCostos(c.data); setProductos(p.data); setCategorias(cat.data)
  }
  useEffect(() => { loadData() }, [])

  const filteredVentas = ventas.filter(v => (v.cliente || '').toLowerCase().includes(search.toLowerCase()))
  const filteredCostos = costos.filter(c => (c.descripcion || '').toLowerCase().includes(search.toLowerCase()))

  const handleVenta = async () => {
    try {
      await api.post('/finanzas/ventas', { ...vForm, cantidad: parseFloat(vForm.cantidad), precio_unitario: parseFloat(vForm.precio_unitario), producto_id: parseInt(vForm.producto_id) })
      notifications.show({ title: 'Venta registrada', color: 'green' })
      vClose(); loadData()
    } catch (err) { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const handleCosto = async () => {
    try {
      await api.post('/finanzas/costos', { ...cForm, monto: parseFloat(cForm.monto), categoria_id: parseInt(cForm.categoria_id) || null })
      notifications.show({ title: 'Gasto registrado', color: 'green' })
      cClose(); loadData()
    } catch (err) { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const totalIngresos = ventas.reduce((s, v) => s + (parseFloat(v.total) || 0), 0)
  const totalGastos = costos.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0)

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Finanzas</Title>
        <Group>
          <Button leftSection={<IconPlus size={16} />} color="red" variant="light" onClick={cOpen}>Registrar Gasto</Button>
          <Button leftSection={<IconPlus size={16} />} onClick={vOpen}>Registrar Venta</Button>
        </Group>
      </Group>

      <TextInput placeholder="Buscar..." leftSection={<IconSearch size={16} />} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed">Ingresos Totales</Text>
          <Text size="xl" fw={700} c="green">{formatCOP(totalIngresos)}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed">Gastos Totales</Text>
          <Text size="xl" fw={700} c="red">{formatCOP(totalGastos)}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder bg={totalIngresos - totalGastos >= 0 ? 'green.0' : 'red.0'}>
          <Text size="xs" c="dimmed">Balance</Text>
          <Text size="xl" fw={700} c={totalIngresos - totalGastos >= 0 ? 'green' : 'red'}>{formatCOP(totalIngresos - totalGastos)}</Text>
        </Paper>
      </SimpleGrid>

      <Tabs defaultValue="ventas">
        <Tabs.List>
          <Tabs.Tab value="ventas">Ventas ({filteredVentas.length})</Tabs.Tab>
          <Tabs.Tab value="costos">Costos y Gastos ({filteredCostos.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="ventas" pt="md">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Producto</Table.Th>
                <Table.Th>Cliente</Table.Th>
                <Table.Th>Cantidad</Table.Th>
                <Table.Th>Precio</Table.Th>
                <Table.Th>Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredVentas.map((v) => (
                <Table.Tr key={v.id}>
                  <Table.Td>{v.fecha}</Table.Td>
                  <Table.Td>{productos.find(p => p.id === v.producto_id)?.nombre || '-'}</Table.Td>
                  <Table.Td>{v.cliente || '-'}</Table.Td>
                  <Table.Td>{formatNumber(v.cantidad)}</Table.Td>
                  <Table.Td>{formatCOP(v.precio_unitario)}</Table.Td>
                  <Table.Td fw={600}>{formatCOP(v.total)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="costos" pt="md">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Categoría</Table.Th>
                <Table.Th>Descripción</Table.Th>
                <Table.Th>Monto</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredCostos.map((c) => (
                <Table.Tr key={c.id}>
                  <Table.Td>{c.fecha}</Table.Td>
                  <Table.Td>{categorias.find(cat => cat.id === c.categoria_id)?.nombre || '-'}</Table.Td>
                  <Table.Td>{c.descripcion}</Table.Td>
                  <Table.Td fw={600} c="red">{formatCOP(c.monto)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={vOpened} onClose={vClose} title="Registrar Venta" size="md">
        <Stack>
          <Select label="Producto" data={productos.map(p => ({ value: p.id.toString(), label: `${p.nombre} (${p.unidad_medida})` }))} value={vForm.producto_id} onChange={v => setVForm({ ...vForm, producto_id: v })} required />
          <TextInput label="Cliente" value={vForm.cliente} onChange={e => setVForm({ ...vForm, cliente: e.target.value })} />
          <TextInput label="Fecha" type="date" value={vForm.fecha} onChange={e => setVForm({ ...vForm, fecha: e.target.value })} />
          <SimpleGrid cols={2}>
            <NumberInput label="Cantidad" value={vForm.cantidad} onChange={v => setVForm({ ...vForm, cantidad: v })} min={0} />
            <NumberInput label="Precio Unitario" value={vForm.precio_unitario} onChange={v => setVForm({ ...vForm, precio_unitario: v })} min={0} />
          </SimpleGrid>
          {vForm.cantidad && vForm.precio_unitario && (
            <Text fw={600}>Total: {formatCOP(parseFloat(vForm.cantidad) * parseFloat(vForm.precio_unitario))}</Text>
          )}
          <Group justify="flex-end"><Button variant="default" onClick={vClose}>Cancelar</Button><Button onClick={handleVenta}>Guardar</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={cOpened} onClose={cClose} title="Registrar Gasto" size="md">
        <Stack>
          <Select label="Categoría" data={categorias.filter(c => c.tipo === 'gasto').map(c => ({ value: c.id.toString(), label: c.nombre }))} value={cForm.categoria_id} onChange={v => setCForm({ ...cForm, categoria_id: v })} />
          <TextInput label="Descripción" value={cForm.descripcion} onChange={e => setCForm({ ...cForm, descripcion: e.target.value })} required />
          <TextInput label="Fecha" type="date" value={cForm.fecha} onChange={e => setCForm({ ...cForm, fecha: e.target.value })} />
          <NumberInput label="Monto" value={cForm.monto} onChange={v => setCForm({ ...cForm, monto: v })} min={0} required />
          <Group justify="flex-end"><Button variant="default" onClick={cClose}>Cancelar</Button><Button onClick={handleCosto}>Guardar</Button></Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
