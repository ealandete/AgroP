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
import MobileTable from '../components/MobileTable.jsx'

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
          <MobileTable
            columns={[
              { key: 'insumo', label: 'Insumo', render: i => { const ins = insumos.find(s => s.id === i.insumo_id); return <Text fw={500}>{ins?.nombre || '-'}</Text> } },
              { key: 'lote', label: 'Lote', render: i => i.lote_almacen || '-', hideOnMobile: true },
              { key: 'cantidad', label: 'Cantidad', render: i => formatNumber(i.cantidad) },
              { key: 'stock', label: 'Stock', render: i => { const ins = insumos.find(s => s.id === i.insumo_id); return getStockBadge(i.cantidad, ins?.stock_minimo) } },
              { key: 'costo', label: 'Costo U.', render: i => i.costo_unitario ? formatCOP(i.costo_unitario) : '-', hideOnMobile: true },
              { key: 'vencimiento', label: 'Vencimiento', render: i => { const ff = new Date(i.fecha_vencimiento || ''); const diff = i.fecha_vencimiento ? Math.floor((ff - hoy) / (1000*60*60*24)) : null; return <Badge color={diff !== null && diff <= 30 ? (diff <= 7 ? 'red' : 'orange') : 'gray'} size="sm">{i.fecha_vencimiento || '-'}</Badge> } },
              { key: 'ubicacion', label: 'Ubicación', render: i => i.ubicacion || '-', hideOnMobile: true },
            ]}
            data={filteredInventario}
          />
        </Tabs.Panel>

        <Tabs.Panel value="insumos" pt="md">
          <MobileTable
            columns={[
              { key: 'codigo', label: 'Código', render: i => i.codigo },
              { key: 'nombre', label: 'Nombre', render: i => i.nombre },
              { key: 'tipo', label: 'Tipo', render: i => <Badge size="sm">{i.tipo || 'general'}</Badge>, hideOnMobile: true },
              { key: 'unidad', label: 'Unidad', render: i => i.unidad_medida, hideOnMobile: true },
              { key: 'stock_min', label: 'Stock Mín', render: i => i.stock_minimo ? formatNumber(i.stock_minimo) : '-', hideOnMobile: true },
              { key: 'estado', label: 'Estado', render: i => getStockBadge(i.stock_actual || 0, i.stock_minimo) },
              { key: 'acciones', label: 'Acciones', render: i => (
                <Group gap="xs">
                  <ActionIcon variant="light" color="blue" size="sm" onClick={(e) => { e?.stopPropagation?.(); setEditInsumo({ id: i.id, nombre: i.nombre || '', tipo: i.tipo || '', unidad_medida: i.unidad_medida || '', stock_minimo: i.stock_minimo || 0 }); openEditInsumo() }}><IconEdit size={14} /></ActionIcon>
                  <ActionIcon variant="light" color="red" size="sm" onClick={(e) => { e?.stopPropagation?.(); setDeleteConfirm(i.id) }}><IconTrash size={14} /></ActionIcon>
                </Group>
              )},
            ]}
            data={insumos}
          />
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

          <MobileTable
            columns={[
              { key: 'fecha', label: 'Fecha', render: c => c.fecha },
              { key: 'insumo', label: 'Insumo', render: c => { const ins = insumos.find(s => s.id === c.insumo_id); return ins?.nombre || '-' } },
              { key: 'cantidad', label: 'Cantidad', render: c => formatNumber(c.cantidad) },
              { key: 'tipo', label: 'Tipo Consumo', render: c => <Badge size="sm">{c.tipo_consumo || '-'}</Badge> },
              { key: 'referencia', label: 'Referencia', render: c => { if (c.tipo_consumo === 'animal' && c.animal_id) return `Animal #${c.animal_id}`; if (c.tipo_consumo === 'cultivo' && c.siembra_id) return `Siembra #${c.siembra_id}`; if (c.tipo_consumo === 'lote' && c.lote_id) return `Lote #${c.lote_id}`; return '-'; }, hideOnMobile: true },
              { key: 'responsable', label: 'Responsable', render: c => c.responsable || '-', hideOnMobile: true },
            ]}
            data={consumos}
          />
        </Tabs.Panel>

        <Tabs.Panel value="produccion" pt="md">
          <MobileTable
            columns={[
              { key: 'fecha', label: 'Fecha', render: p => p.fecha },
              { key: 'producto', label: 'Producto', render: p => p.producto },
              { key: 'cantidad', label: 'Cantidad', render: p => formatNumber(p.cantidad) },
              { key: 'acciones', label: 'Acciones', render: p => (
                <Group gap="xs">
                  <ActionIcon variant="light" color="blue" size="sm" onClick={(e) => { e?.stopPropagation?.(); setEditProd({ id: p.id, fecha: p.fecha || '', cantidad: p.cantidad || '', observaciones: p.observaciones || '' }); openEditProd() }}><IconEdit size={14} /></ActionIcon>
                  <ActionIcon variant="light" color="red" size="sm" onClick={(e) => { e?.stopPropagation?.(); handleDeleteProd(p.id) }}><IconTrash size={14} /></ActionIcon>
                </Group>
              )},
            ]}
            data={produccion}
          />
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
