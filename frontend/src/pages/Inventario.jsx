import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, Stack, SimpleGrid, Text, Tabs, Textarea, ActionIcon, Card,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconAlertTriangle, IconSearch, IconEdit, IconTrash, IconCurrencyDollar } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatNumber, formatCOP } from '../config.js'

export default function Inventario() {
  const [inventario, setInventario] = useState([])
  const [insumos, setInsumos] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [produccion, setProduccion] = useState([])
  const [consumos, setConsumos] = useState([])
  const [animales, setAnimales] = useState([])
  const [lotes, setLotes] = useState([])

  const [opened, { open, close }] = useDisclosure(false)
  const [editInsumoOpened, { open: openEditInsumo, close: closeEditInsumo }] = useDisclosure(false)
  const [editProdOpened, { open: openEditProd, close: closeEditProd }] = useDisclosure(false)
  const [consumoModalOpened, { open: openConsumo, close: closeConsumo }] = useDisclosure(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const [form, setForm] = useState({
    insumo_id: '', lote_almacen: '', cantidad: '', costo_unitario: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '', ubicacion: 'bodega', proveedor_id: '',
  })

  const [editInsumo, setEditInsumo] = useState({
    id: null, nombre: '', tipo: '', unidad_medida: '', stock_minimo: 0,
  })

  const [editProd, setEditProd] = useState({
    id: null, fecha: '', cantidad: '', observaciones: '',
  })

  const [consumoForm, setConsumoForm] = useState({
    insumo_id: '', cantidad: '', fecha: new Date().toISOString().split('T')[0],
    tipo_consumo: '', animal_id: '', siembra_id: '', lote_id: '',
    responsable: '', observaciones: '',
  })

  const [search, setSearch] = useState('')

  const loadData = async () => {
    const [inv, ins, prov, prod, cons, anim, lot] = await Promise.all([
      api.get('/finanzas/inventario'),
      api.get('/finanzas/insumos'),
      api.get('/finanzas/proveedores'),
      api.get('/finanzas/produccion'),
      api.get('/consumo-insumos').catch(() => ({ data: [] })),
      api.get('/animales').catch(() => ({ data: [] })),
      api.get('/lotes').catch(() => ({ data: [] })),
    ])
    setInventario(inv.data)
    setInsumos(ins.data)
    setProveedores(prov.data)
    setProduccion(prod.data)
    setConsumos(cons.data)
    setAnimales(anim.data)
    setLotes(lot.data)
  }
  useEffect(() => { loadData() }, [])

  const filteredInventario = inventario.filter(i => {
    const insumo = insumos.find(s => s.id === i.insumo_id)
    return (insumo?.nombre || '').toLowerCase().includes(search.toLowerCase())
  })

  const handleSubmit = async () => {
    try {
      await api.post('/finanzas/inventario', {
        ...form,
        insumo_id: parseInt(form.insumo_id),
        cantidad: parseFloat(form.cantidad),
        costo_unitario: parseFloat(form.costo_unitario || 0),
        proveedor_id: form.proveedor_id ? parseInt(form.proveedor_id) : null,
      })
      notifications.show({ title: 'Inventario actualizado', color: 'green' })
      close(); loadData()
    } catch (err) { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const handleEditInsumo = async () => {
    try {
      await api.put(`/finanzas/insumos/${editInsumo.id}`, {
        nombre: editInsumo.nombre,
        tipo: editInsumo.tipo,
        unidad_medida: editInsumo.unidad_medida,
        stock_minimo: parseFloat(editInsumo.stock_minimo || 0),
      })
      notifications.show({ title: 'Insumo actualizado', color: 'green' })
      closeEditInsumo(); loadData()
    } catch (err) { notifications.show({ title: 'Error al actualizar insumo', color: 'red' }) }
  }

  const handleDeleteInsumo = async (id) => {
    try {
      await api.delete(`/finanzas/insumos/${id}`)
      notifications.show({ title: 'Insumo eliminado', color: 'green' })
      setDeleteConfirm(null); loadData()
    } catch (err) { notifications.show({ title: 'Error al eliminar insumo', color: 'red' }) }
  }

  const handleEditProd = async () => {
    try {
      await api.put(`/finanzas/produccion/${editProd.id}`, {
        fecha: editProd.fecha,
        cantidad: parseFloat(editProd.cantidad),
        observaciones: editProd.observaciones,
      })
      notifications.show({ title: 'Producción actualizada', color: 'green' })
      closeEditProd(); loadData()
    } catch (err) { notifications.show({ title: 'Error al actualizar producción', color: 'red' }) }
  }

  const handleDeleteProd = async (id) => {
    try {
      await api.delete(`/finanzas/produccion/${id}`)
      notifications.show({ title: 'Producción eliminada', color: 'green' })
      loadData()
    } catch (err) { notifications.show({ title: 'Error al eliminar producción', color: 'red' }) }
  }

  const handleConsumoSubmit = async () => {
    try {
      const payload = {
        insumo_id: parseInt(consumoForm.insumo_id),
        cantidad: parseFloat(consumoForm.cantidad),
        fecha: consumoForm.fecha,
        tipo_consumo: consumoForm.tipo_consumo,
        responsable: consumoForm.responsable,
        observaciones: consumoForm.observaciones,
      }
      if (consumoForm.tipo_consumo === 'animal') payload.animal_id = parseInt(consumoForm.animal_id)
      if (consumoForm.tipo_consumo === 'cultivo') payload.siembra_id = parseInt(consumoForm.siembra_id)
      if (consumoForm.tipo_consumo === 'lote') payload.lote_id = parseInt(consumoForm.lote_id)

      console.log('Mock POST /api/consumo-insumos/', payload)
      notifications.show({ title: 'Consumo registrado (mock)', color: 'green' })
      closeConsumo()
      setConsumoForm({
        insumo_id: '', cantidad: '', fecha: new Date().toISOString().split('T')[0],
        tipo_consumo: '', animal_id: '', siembra_id: '', lote_id: '',
        responsable: '', observaciones: '',
      })
    } catch (err) { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const getStockBadge = (cantidad, stockMinimo) => {
    if (!stockMinimo || stockMinimo === 0) return <Badge color="gray" size="sm">Sin mínimo</Badge>
    if (cantidad <= stockMinimo) return <Badge color="red" size="sm">Crítico</Badge>
    if (cantidad <= stockMinimo * 1.5) return <Badge color="orange" size="sm">Bajo</Badge>
    return <Badge color="green" size="sm">Normal</Badge>
  }

  const totalConsumos = consumos.reduce((sum, c) => sum + parseFloat(c.cantidad || 0), 0)

  const hoy = new Date()
  const proximosVencer = inventario.filter(i => {
    if (!i.fecha_vencimiento) return false
    const fv = new Date(i.fecha_vencimiento)
    const diff = (fv - hoy) / (1000 * 60 * 60 * 24)
    return diff <= 30 && diff >= 0
  })

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Inventario e Insumos</Title>
        <Group>
          <Button leftSection={<IconPlus size={16} />} variant="light" onClick={() => {
            setForm({ ...form, cantidad: '', insumo_id: '' }); open()
          }}>Nuevo Insumo</Button>
          <Button leftSection={<IconPlus size={16} />} onClick={() => {
            setForm({ ...form, cantidad: '', insumo_id: '', costo_unitario: '', fecha_vencimiento: '' }); open()
          }}>Añadir Stock</Button>
        </Group>
      </Group>

      <TextInput placeholder="Buscar..." leftSection={<IconSearch size={16} />} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />

      {proximosVencer.length > 0 && (
        <Paper p="sm" radius="md" bg="orange.0" withBorder>
          <Group>
            <IconAlertTriangle size={20} color="var(--mantine-color-orange-6)" />
            <Text size="sm" c="orange.8" fw={500}>
              {proximosVencer.length} productos próximos a vencer en los próximos 30 días
            </Text>
          </Group>
        </Paper>
      )}

      <Tabs defaultValue="stock">
        <Tabs.List>
          <Tabs.Tab value="stock">Stock ({filteredInventario.length})</Tabs.Tab>
          <Tabs.Tab value="insumos">Insumos ({insumos.length})</Tabs.Tab>
          <Tabs.Tab value="consumos">Consumos ({consumos.length})</Tabs.Tab>
          <Tabs.Tab value="produccion">Producción ({produccion.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="stock" pt="md">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Insumo</Table.Th>
                <Table.Th>Lote</Table.Th>
                <Table.Th>Cantidad</Table.Th>
                <Table.Th>Stock</Table.Th>
                <Table.Th>Costo U.</Table.Th>
                <Table.Th>Vencimiento</Table.Th>
                <Table.Th>Ubicación</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredInventario.map((i) => {
                const insumo = insumos.find(s => s.id === i.insumo_id)
                const ff = new Date(i.fecha_vencimiento || '')
                const diff = i.fecha_vencimiento ? Math.floor((ff - hoy) / (1000*60*60*24)) : null
                return (
                  <Table.Tr key={i.id}>
                    <Table.Td fw={500}>{insumo?.nombre || '-'}</Table.Td>
                    <Table.Td>{i.lote_almacen || '-'}</Table.Td>
                    <Table.Td>{formatNumber(i.cantidad)}</Table.Td>
                    <Table.Td>{getStockBadge(i.cantidad, insumo?.stock_minimo)}</Table.Td>
                    <Table.Td>{i.costo_unitario ? formatCOP(i.costo_unitario) : '-'}</Table.Td>
                    <Table.Td>
                      <Badge color={diff !== null && diff <= 30 ? (diff <= 7 ? 'red' : 'orange') : 'gray'} size="sm">
                        {i.fecha_vencimiento || '-'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{i.ubicacion || '-'}</Table.Td>
                  </Table.Tr>
                )
              })}
              {filteredInventario.length === 0 && <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center">Sin stock</Text></Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="insumos" pt="md">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Código</Table.Th>
                <Table.Th>Nombre</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Unidad</Table.Th>
                <Table.Th>Stock Mín</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th style={{ width: 80 }}>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {insumos.map((i) => (
                <Table.Tr key={i.id}>
                  <Table.Td>{i.codigo}</Table.Td>
                  <Table.Td>{i.nombre}</Table.Td>
                  <Table.Td><Badge size="sm">{i.tipo || 'general'}</Badge></Table.Td>
                  <Table.Td>{i.unidad_medida}</Table.Td>
                  <Table.Td>{i.stock_minimo ? formatNumber(i.stock_minimo) : '-'}</Table.Td>
                  <Table.Td>{getStockBadge(i.stock_actual || 0, i.stock_minimo)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon variant="light" color="blue" size="sm" onClick={() => {
                        setEditInsumo({
                          id: i.id,
                          nombre: i.nombre || '',
                          tipo: i.tipo || '',
                          unidad_medida: i.unidad_medida || '',
                          stock_minimo: i.stock_minimo || 0,
                        })
                        openEditInsumo()
                      }}>
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon variant="light" color="red" size="sm" onClick={() => setDeleteConfirm(i.id)}>
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {insumos.length === 0 && <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center">Sin insumos registrados</Text></Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="consumos" pt="md">
          <Group justify="space-between" mb="md">
            <Group>
              <Card shadow="sm" p="sm" radius="md" withBorder>
                <Text size="xs" c="dimmed">Total Consumos</Text>
                <Text fw={700} size="lg">{formatNumber(totalConsumos)}</Text>
              </Card>
            </Group>
            <Button leftSection={<IconPlus size={16} />} onClick={openConsumo}>Registrar Consumo</Button>
          </Group>

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Insumo</Table.Th>
                <Table.Th>Cantidad</Table.Th>
                <Table.Th>Tipo Consumo</Table.Th>
                <Table.Th>Referencia</Table.Th>
                <Table.Th>Responsable</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {consumos.map((c) => {
                const insumo = insumos.find(s => s.id === c.insumo_id)
                let referencia = '-'
                if (c.tipo_consumo === 'animal' && c.animal_id) referencia = `Animal #${c.animal_id}`
                else if (c.tipo_consumo === 'cultivo' && c.siembra_id) referencia = `Siembra #${c.siembra_id}`
                else if (c.tipo_consumo === 'lote' && c.lote_id) referencia = `Lote #${c.lote_id}`
                return (
                  <Table.Tr key={c.id}>
                    <Table.Td>{c.fecha}</Table.Td>
                    <Table.Td>{insumo?.nombre || '-'}</Table.Td>
                    <Table.Td>{formatNumber(c.cantidad)}</Table.Td>
                    <Table.Td><Badge size="sm">{c.tipo_consumo || '-'}</Badge></Table.Td>
                    <Table.Td>{referencia}</Table.Td>
                    <Table.Td>{c.responsable || '-'}</Table.Td>
                  </Table.Tr>
                )
              })}
              {consumos.length === 0 && <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin consumos registrados</Text></Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="produccion" pt="md">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Producto</Table.Th>
                <Table.Th>Cantidad</Table.Th>
                <Table.Th style={{ width: 120 }}>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {produccion.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>{p.fecha}</Table.Td>
                  <Table.Td>{p.producto}</Table.Td>
                  <Table.Td>{formatNumber(p.cantidad)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon variant="light" color="blue" size="sm" onClick={() => {
                        setEditProd({
                          id: p.id,
                          fecha: p.fecha || '',
                          cantidad: p.cantidad || '',
                          observaciones: p.observaciones || '',
                        })
                        openEditProd()
                      }}>
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon variant="light" color="red" size="sm" onClick={() => handleDeleteProd(p.id)}>
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {produccion.length === 0 && <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center">Sin registros de producción</Text></Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={opened} onClose={close} title="Gestión de Stock" size="md">
        <Stack>
          <Select label="Insumo" data={insumos.map(i => ({ value: i.id.toString(), label: `${i.nombre} (${i.unidad_medida})` }))} value={form.insumo_id} onChange={v => setForm({ ...form, insumo_id: v })} searchable required />
          <SimpleGrid cols={2}>
            <TextInput label="Lote/Almacén" value={form.lote_almacen} onChange={e => setForm({ ...form, lote_almacen: e.target.value })} />
            <NumberInput label="Cantidad" value={form.cantidad} onChange={v => setForm({ ...form, cantidad: v })} min={0} required />
          </SimpleGrid>
          <SimpleGrid cols={2}>
            <NumberInput label="Costo Unitario" value={form.costo_unitario} onChange={v => setForm({ ...form, costo_unitario: v })} min={0} />
            <TextInput label="Fecha Ingreso" type="date" value={form.fecha_ingreso} onChange={e => setForm({ ...form, fecha_ingreso: e.target.value })} />
          </SimpleGrid>
          <SimpleGrid cols={2}>
            <TextInput label="Fecha Vencimiento" type="date" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} />
            <Select label="Ubicación" data={['bodega','galpon','silo','campo']} value={form.ubicacion} onChange={v => setForm({ ...form, ubicacion: v })} />
          </SimpleGrid>
          <Select label="Proveedor" data={proveedores.map(p => ({ value: p.id.toString(), label: p.nombre }))} value={form.proveedor_id} onChange={v => setForm({ ...form, proveedor_id: v })} clearable />
          <Group justify="flex-end"><Button variant="default" onClick={close}>Cancelar</Button><Button onClick={handleSubmit}>Guardar</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={editInsumoOpened} onClose={closeEditInsumo} title="Editar Insumo" size="sm">
        <Stack>
          <TextInput label="Nombre" value={editInsumo.nombre} onChange={e => setEditInsumo({ ...editInsumo, nombre: e.target.value })} required />
          <Select label="Tipo" data={['general','fertilizante','plaguicida','alimento','medicina','herramienta','semilla','empaque']} value={editInsumo.tipo} onChange={v => setEditInsumo({ ...editInsumo, tipo: v })} />
          <TextInput label="Unidad de Medida" value={editInsumo.unidad_medida} onChange={e => setEditInsumo({ ...editInsumo, unidad_medida: e.target.value })} required />
          <NumberInput label="Stock Mínimo" value={editInsumo.stock_minimo} onChange={v => setEditInsumo({ ...editInsumo, stock_minimo: v })} min={0} />
          <Group justify="flex-end"><Button variant="default" onClick={closeEditInsumo}>Cancelar</Button><Button onClick={handleEditInsumo}>Guardar</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={editProdOpened} onClose={closeEditProd} title="Editar Producción" size="sm">
        <Stack>
          <TextInput label="Fecha" type="date" value={editProd.fecha} onChange={e => setEditProd({ ...editProd, fecha: e.target.value })} required />
          <NumberInput label="Cantidad" value={editProd.cantidad} onChange={v => setEditProd({ ...editProd, cantidad: v })} min={0} required />
          <Textarea label="Observaciones" value={editProd.observaciones} onChange={e => setEditProd({ ...editProd, observaciones: e.target.value })} />
          <Group justify="flex-end"><Button variant="default" onClick={closeEditProd}>Cancelar</Button><Button onClick={handleEditProd}>Guardar</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={consumoModalOpened} onClose={closeConsumo} title="Registrar Consumo" size="md">
        <Stack>
          <Select label="Insumo" data={insumos.map(i => ({ value: i.id.toString(), label: `${i.nombre} (${i.unidad_medida})` }))} value={consumoForm.insumo_id} onChange={v => setConsumoForm({ ...consumoForm, insumo_id: v })} searchable required />
          <SimpleGrid cols={2}>
            <NumberInput label="Cantidad" value={consumoForm.cantidad} onChange={v => setConsumoForm({ ...consumoForm, cantidad: v })} min={0} required />
            <TextInput label="Fecha" type="date" value={consumoForm.fecha} onChange={e => setConsumoForm({ ...consumoForm, fecha: e.target.value })} />
          </SimpleGrid>
          <Select label="Tipo de Consumo" data={[
            { value: 'animal', label: 'Animal' },
            { value: 'cultivo', label: 'Cultivo/Siembra' },
            { value: 'lote', label: 'Lote' },
          ]} value={consumoForm.tipo_consumo} onChange={v => setConsumoForm({ ...consumoForm, tipo_consumo: v, animal_id: '', siembra_id: '', lote_id: '' })} required />
          {consumoForm.tipo_consumo === 'animal' && (
            <Select label="Animal" data={animales.map(a => ({ value: a.id.toString(), label: `${a.identificacion || a.id} - ${a.nombre || ''}` }))} value={consumoForm.animal_id} onChange={v => setConsumoForm({ ...consumoForm, animal_id: v })} searchable required />
          )}
          {consumoForm.tipo_consumo === 'cultivo' && (
            <TextInput label="ID Siembra" value={consumoForm.siembra_id} onChange={e => setConsumoForm({ ...consumoForm, siembra_id: e.target.value })} placeholder="Ingrese ID de la siembra" />
          )}
          {consumoForm.tipo_consumo === 'lote' && (
            <Select label="Lote" data={lotes.map(l => ({ value: l.id.toString(), label: l.nombre || `Lote #${l.id}` }))} value={consumoForm.lote_id} onChange={v => setConsumoForm({ ...consumoForm, lote_id: v })} searchable required />
          )}
          <TextInput label="Responsable" value={consumoForm.responsable} onChange={e => setConsumoForm({ ...consumoForm, responsable: e.target.value })} />
          <Textarea label="Observaciones" value={consumoForm.observaciones} onChange={e => setConsumoForm({ ...consumoForm, observaciones: e.target.value })} />
          <Group justify="flex-end"><Button variant="default" onClick={closeConsumo}>Cancelar</Button><Button onClick={handleConsumoSubmit}>Guardar</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar eliminación" size="sm">
        <Text mb="md">¿Está seguro de eliminar este insumo? Esta acción no se puede deshacer.</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button color="red" onClick={() => handleDeleteInsumo(deleteConfirm)}>Eliminar</Button>
        </Group>
      </Modal>
    </Stack>
  )
}
