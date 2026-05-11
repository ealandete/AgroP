import { useEffect, useState } from 'react'
import { Paper, Table, Title, Group, Button, Modal, TextInput, Select, NumberInput, Badge, Stack, SimpleGrid, Text, Tabs, Progress, Grid, ActionIcon, Divider, Textarea, Loader, Tooltip } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { BarChart } from '@mantine/charts'
import { IconPlus, IconReportMoney, IconReceipt, IconFileInvoice, IconChartPie, IconCash, IconTrendingUp, IconFileDownload, IconTrash, IconUserPlus, IconEdit } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatCOP, formatNumber } from '../config.js'

export default function Contabilidad() {
  const [ventas, setVentas] = useState([])
  const [costos, setCostos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [planCuentas, setPlanCuentas] = useState([])
  const [facturas, setFacturas] = useState([])
  const [ingresosMensuales, setIngresosMensuales] = useState([])
  const [presupuestos, setPresupuestos] = useState([])
  const [presupuestoSelected, setPresupuestoSelected] = useState(null)
  const [partidas, setPartidas] = useState([])
  const [opened, { open, close }] = useDisclosure(false)
  const [openedCliente, { open: openCliente, close: closeCliente }] = useDisclosure(false)
  const [openedMovimiento, { open: openMovimiento, close: closeMovimiento }] = useDisclosure(false)
  const [openedPresupuesto, { open: openPresupuesto, close: closePresupuesto }] = useDisclosure(false)
  const [loadingPresupuesto, setLoadingPresupuesto] = useState(false)
  const [loadingMovimiento, setLoadingMovimiento] = useState(false)
  const [fForm, setFForm] = useState({
    cliente_id: '', finca_id: 4, fecha_emision: new Date().toISOString().split('T')[0],
    forma_pago: 'contado', iva_porcentaje: 19, retencion_fuente_porcentaje: 0, retencion_ica_porcentaje: 0, observaciones: '',
  })
  const [items, setItems] = useState([])
  const [clienteForm, setClienteForm] = useState({
    tipo_documento: 'CC', numero_documento: '', dv: '', nombre: '', nombre_comercial: '',
    direccion: '', telefono: '', email: '', regimen: 'comun', responsabilidad_fiscal: 'IVA',
  })
  const [movForm, setMovForm] = useState({
    tipo: '', fecha: new Date().toISOString().split('T')[0], cuenta_contable_id: '',
    descripcion: '', monto: '', medio_pago: '', referencia: '',
  })
  const [presupuestoForm, setPresupuestoForm] = useState({
    nombre: '', periodo_inicio: '', periodo_fin: '', tipo: 'anual',
  })

  const loadData = async () => {
    const [v, c, cat, p, cli, pc, fac, im] = await Promise.all([
      api.get('/finanzas/ventas'), api.get('/finanzas/costos'),
      api.get('/finanzas/categorias'), api.get('/finanzas/productos'),
      api.get('/clientes/'), api.get('/plan-cuentas/'),
      api.get('/facturacion/'),
      api.get('/estadisticas/finanzas/ingresos-vs-gastos', { params: { meses: 12 } }),
    ])
    setVentas(v.data); setCostos(c.data); setCategorias(cat.data); setProductos(p.data)
    setClientes(cli.data); setPlanCuentas(pc.data); setFacturas(fac.data); setIngresosMensuales(im.data)
  }
  useEffect(() => { loadData() }, [])

  const totalIngresos = ventas.reduce((s, v) => s + (parseFloat(v.total) || 0), 0)
  const totalGastos = costos.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0)
  const balance = totalIngresos - totalGastos
  const margen = totalIngresos > 0 ? (balance / totalIngresos * 100) : 0

  const gastosPorCat = {}
  costos.forEach(c => { const cat = categorias.find(cat => cat.id === c.categoria_id); gastosPorCat[cat?.nombre || 'Sin cat'] = (gastosPorCat[cat?.nombre || 'Sin cat'] || 0) + (parseFloat(c.monto) || 0) })

  const addItem = () => setItems([...items, { producto_id: '', descripcion: '', cantidad: '', precio_unitario: '', unidad_medida: 'unidad', iva_porcentaje: fForm.iva_porcentaje }])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i, field, value) => { const ni = [...items]; ni[i] = { ...ni[i], [field]: value }; setItems(ni) }

  const calcSubtotal = () => items.reduce((s, it) => s + (parseFloat(it.cantidad || 0) * parseFloat(it.precio_unitario || 0)), 0)
  const calcIva = () => items.reduce((s, it) => {
    const sub = parseFloat(it.cantidad || 0) * parseFloat(it.precio_unitario || 0)
    const ivaPct = parseFloat(it.iva_porcentaje || fForm.iva_porcentaje || 0)
    return s + (sub * ivaPct / 100)
  }, 0)
  const subtotal = calcSubtotal()
  const ivaTotal = calcIva()
  const retFte = subtotal * (parseFloat(fForm.retencion_fuente_porcentaje || 0) / 100)
  const retIca = subtotal * (parseFloat(fForm.retencion_ica_porcentaje || 0) / 100)
  const totalNeto = subtotal + ivaTotal - retFte - retIca

  const handleEmitir = async () => {
    try {
      await api.post('/facturacion/', { ...fForm, items })
      notifications.show({ title: 'Factura emitida', color: 'green' })
      close(); setItems([]); loadData()
    } catch (err) { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const handleCrearCliente = async () => {
    try {
      const res = await api.post('/clientes/', clienteForm)
      await loadData()
      setFForm({ ...fForm, cliente_id: res.data.id.toString() })
      closeCliente()
      setClienteForm({ tipo_documento: 'CC', numero_documento: '', dv: '', nombre: '', nombre_comercial: '', direccion: '', telefono: '', email: '', regimen: 'comun', responsabilidad_fiscal: 'IVA' })
      notifications.show({ title: 'Cliente creado', color: 'green' })
    } catch (err) { notifications.show({ title: 'Error al crear cliente', color: 'red' }) }
  }

  const handleCrearMovimiento = async () => {
    setLoadingMovimiento(true)
    try {
      const payload = {
        fecha: movForm.fecha,
        descripcion: movForm.descripcion,
        monto: parseFloat(movForm.monto),
        categoria_id: parseInt(movForm.cuenta_contable_id),
        medio_pago: movForm.medio_pago || undefined,
        referencia: movForm.referencia || undefined,
      }
      if (movForm.tipo === 'Ingreso') {
        await api.post('/finanzas/ventas', payload)
      } else {
        await api.post('/finanzas/costos', payload)
      }
      notifications.show({ title: 'Movimiento registrado', color: 'green' })
      closeMovimiento()
      setMovForm({ tipo: '', fecha: new Date().toISOString().split('T')[0], cuenta_contable_id: '', descripcion: '', monto: '', medio_pago: '', referencia: '' })
      loadData()
    } catch (err) { notifications.show({ title: 'Error al registrar movimiento', color: 'red' }) }
    finally { setLoadingMovimiento(false) }
  }

  const loadPresupuestos = async () => {
    setLoadingPresupuesto(true)
    try {
      // TODO: implement backend router for /api/presupuestos/
      // const res = await api.get('/presupuestos/')
      // setPresupuestos(res.data)
      setPresupuestos([])
    } finally { setLoadingPresupuesto(false) }
  }
  useEffect(() => { loadPresupuestos() }, [])

  const handleCrearPresupuesto = async () => {
    try {
      // TODO: implement backend router for /api/presupuestos/
      // await api.post('/presupuestos/', presupuestoForm)
      notifications.show({ title: 'Presupuesto creado (mock)', color: 'green' })
      closePresupuesto()
      setPresupuestoForm({ nombre: '', periodo_inicio: '', periodo_fin: '', tipo: 'anual' })
      loadPresupuestos()
    } catch (err) { notifications.show({ title: 'Error al crear presupuesto', color: 'red' }) }
  }

  const loadPartidas = async (presupuestoId) => {
    try {
      // TODO: implement backend router for /api/presupuestos/:id/partidas
      // const res = await api.get(`/presupuestos/${presupuestoId}/partidas`)
      // setPartidas(res.data)
      setPartidas([])
    } catch (err) { notifications.show({ title: 'Error al cargar partidas', color: 'red' }) }
  }

  const selectPresupuesto = (p) => {
    setPresupuestoSelected(p)
    loadPartidas(p.id)
  }

  const diario = [...ventas.map(v => ({ ...v, _tipo: 'ingreso', _desc: `Venta ${productos.find(p => p.id === v.producto_id)?.nombre || ''}`, _cat: 'Ventas', _monto: parseFloat(v.total || 0) })), ...costos.map(c => ({ ...c, _tipo: 'gasto', _desc: c.descripcion, _cat: categorias.find(cat => cat.id === c.categoria_id)?.nombre || '', _monto: parseFloat(c.monto || 0) }))].sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)).slice(0, 50)

  const costosChart = Object.entries(gastosPorCat).map(([n, v]) => ({ Categoria: n.slice(0, 15), Monto: Math.round(v / 1000) }))

  return (
    <Stack>
      <Title order={3}>Contabilidad y Finanzas</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Paper p="md" radius="md" withBorder><Text size="xs" c="dimmed">Ingresos</Text><Text size="xl" fw={700} c="green">{formatCOP(totalIngresos)}</Text></Paper>
        <Paper p="md" radius="md" withBorder><Text size="xs" c="dimmed">Gastos</Text><Text size="xl" fw={700} c="red">{formatCOP(totalGastos)}</Text></Paper>
        <Paper p="md" radius="md" withBorder bg={balance >= 0 ? 'green.0' : 'red.0'}><Text size="xs" c="dimmed">Balance</Text><Text size="xl" fw={700} c={balance >= 0 ? 'green' : 'red'}>{formatCOP(balance)}</Text></Paper>
        <Paper p="md" radius="md" withBorder><Text size="xs" c="dimmed">Margen</Text><Text size="xl" fw={700} c={margen >= 0 ? 'green' : 'red'}>{margen.toFixed(1)}%</Text></Paper>
      </SimpleGrid>

      <Group><Button leftSection={<IconPlus size={16} />} onClick={() => { setItems([{ producto_id: '', descripcion: '', cantidad: '', precio_unitario: '', unidad_medida: 'unidad', iva_porcentaje: 19 }]); open() }}>Nueva Factura</Button></Group>

      <Tabs defaultValue="facturas">
        <Tabs.List>
          <Tabs.Tab value="facturas" leftSection={<IconFileInvoice size={16} />}>Facturación</Tabs.Tab>
          <Tabs.Tab value="diario" leftSection={<IconReceipt size={16} />}>Libro Diario</Tabs.Tab>
          <Tabs.Tab value="plan" leftSection={<IconReportMoney size={16} />}>Plan Cuentas</Tabs.Tab>
          <Tabs.Tab value="costos" leftSection={<IconChartPie size={16} />}>Costos</Tabs.Tab>
          <Tabs.Tab value="presupuesto" leftSection={<IconTrendingUp size={16} />}>Presupuesto</Tabs.Tab>
          <Tabs.Tab value="exportar" leftSection={<IconFileDownload size={16} />}>Reportes</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="facturas" pt="md">
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Factura</Table.Th><Table.Th>Fecha</Table.Th><Table.Th>Cliente</Table.Th><Table.Th>Subtotal</Table.Th><Table.Th>IVA</Table.Th><Table.Th>Total</Table.Th><Table.Th>Estado</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>{facturas.map(f => (<Table.Tr key={f.id}><Table.Td fw={600}>{f.prefijo}-{f.numero_factura}</Table.Td><Table.Td>{f.fecha_emision}</Table.Td><Table.Td>{clientes.find(c => c.id === f.cliente_id)?.nombre || ''}</Table.Td><Table.Td>{formatCOP(f.subtotal)}</Table.Td><Table.Td>{formatCOP(f.iva_total)}</Table.Td><Table.Td fw={700}>{formatCOP(f.total_neto)}</Table.Td><Table.Td><Badge size="sm" color={f.estado === 'pagada' ? 'green' : f.estado === 'pendiente' ? 'yellow' : f.estado === 'anulada' ? 'red' : 'blue'}>{f.estado}</Badge></Table.Td></Table.Tr>))}</Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="diario" pt="md">
          <Group mb="sm">
            <Button leftSection={<IconPlus size={16} />} size="sm" onClick={() => { setMovForm({ tipo: '', fecha: new Date().toISOString().split('T')[0], cuenta_contable_id: '', descripcion: '', monto: '', medio_pago: '', referencia: '' }); openMovimiento() }}>Nuevo Movimiento</Button>
          </Group>
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Fecha</Table.Th><Table.Th>Tipo</Table.Th><Table.Th>Descripción</Table.Th><Table.Th>Categoría</Table.Th><Table.Th>Monto</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>{diario.map((r, i) => (<Table.Tr key={i}><Table.Td>{r.fecha || ''}</Table.Td><Table.Td><Badge size="sm" color={r._tipo === 'ingreso' ? 'green' : 'red'}>{r._tipo}</Badge></Table.Td><Table.Td>{r._desc}</Table.Td><Table.Td>{r._cat}</Table.Td><Table.Td fw={600} c={r._tipo === 'ingreso' ? 'green' : 'red'}>{formatCOP(r._monto)}</Table.Td></Table.Tr>))}</Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="plan" pt="md">
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Código</Table.Th><Table.Th>Nombre</Table.Th><Table.Th>Tipo</Table.Th><Table.Th>Naturaleza</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>{planCuentas.map(pc => (<Table.Tr key={pc.id}><Table.Td fw={pc.nivel <= 2 ? 700 : 400}>{pc.codigo}</Table.Td><Table.Td style={{ paddingLeft: `${pc.nivel * 16}px` }}>{pc.nombre}</Table.Td><Table.Td><Badge size="sm" color={pc.tipo === 'ingreso' ? 'green' : pc.tipo === 'gasto' || pc.tipo === 'costo' ? 'red' : pc.tipo === 'activo' ? 'blue' : 'gray'}>{pc.tipo}</Badge></Table.Td><Table.Td>{pc.naturaleza}</Table.Td></Table.Tr>))}</Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel value="costos" pt="md">
          <Grid><Grid.Col span={{ base: 12, md: 8 }}><Paper p="md" withBorder><Text fw={600} mb="md">Distribución Gastos (miles COP)</Text><BarChart h={300} data={costosChart} dataKey="Categoria" series={[{ name: 'Monto', color: 'red.5' }]} valueFormatter={v => `$${v}k`} tickLine="y" /></Paper></Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}><Paper p="md" withBorder h="100%"><Text fw={600} mb="md">Top Gastos</Text><Stack>{Object.entries(gastosPorCat).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, val], i) => (<div key={i}><Group justify="space-between" mb={2}><Text size="xs">{name}</Text><Text size="xs" fw={600}>{formatCOP(val)}</Text></Group><Progress value={(val / totalGastos * 100) || 0} size="sm" color="red" /></div>))}</Stack></Paper></Grid.Col></Grid>
        </Tabs.Panel>

        <Tabs.Panel value="presupuesto" pt="md">
          <Group mb="md">
            <Button leftSection={<IconPlus size={16} />} size="sm" onClick={openPresupuesto}>Nuevo Presupuesto</Button>
          </Group>
          {loadingPresupuesto ? <Loader /> : (
            <>
              <Table striped highlightOnHover mb="md">
                <Table.Thead><Table.Tr><Table.Th>Nombre</Table.Th><Table.Th>Periodo</Table.Th><Table.Th>Tipo</Table.Th><Table.Th></Table.Th></Table.Tr></Table.Thead>
                <Table.Tbody>{presupuestos.length === 0 ? <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center" py="md">No hay presupuestos registrados</Text></Table.Td></Table.Tr> : presupuestos.map(p => (
                  <Table.Tr key={p.id} bg={presupuestoSelected?.id === p.id ? 'blue.0' : undefined} style={{ cursor: 'pointer' }} onClick={() => selectPresupuesto(p)}>
                    <Table.Td fw={600}>{p.nombre}</Table.Td>
                    <Table.Td>{p.periodo_inicio} - {p.periodo_fin}</Table.Td>
                    <Table.Td><Badge size="sm">{p.tipo}</Badge></Table.Td>
                    <Table.Td><ActionIcon variant="light" onClick={(e) => { e.stopPropagation(); selectPresupuesto(p) }}><IconEdit size={16} /></ActionIcon></Table.Td>
                  </Table.Tr>
                ))}</Table.Tbody>
              </Table>

              {presupuestoSelected && (
                <Paper p="md" withBorder mb="md">
                  <Text fw={600} mb="sm">Partidas: {presupuestoSelected.nombre}</Text>
                  <Table striped highlightOnHover>
                    <Table.Thead><Table.Tr><Table.Th>Cuenta</Table.Th><Table.Th>Valor Proyectado</Table.Th><Table.Th>Valor Ejecutado</Table.Th><Table.Th>Cumplimiento</Table.Th></Table.Tr></Table.Thead>
                    <Table.Tbody>{partidas.length === 0 ? <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center" py="sm">No hay partidas para este presupuesto</Text></Table.Td></Table.Tr> : partidas.map(pd => {
                      const cum = pd.valor_proyectado > 0 ? (pd.valor_ejecutado / pd.valor_proyectado * 100) : 0
                      return (
                        <Table.Tr key={pd.id}>
                          <Table.Td>{planCuentas.find(pc => pc.id === pd.cuenta_id)?.codigo} - {planCuentas.find(pc => pc.id === pd.cuenta_id)?.nombre}</Table.Td>
                          <Table.Td>{formatCOP(pd.valor_proyectado)}</Table.Td>
                          <Table.Td>{formatCOP(pd.valor_ejecutado)}</Table.Td>
                          <Table.Td><Progress value={Math.min(cum, 100)} size="sm" color={cum > 100 ? 'red' : cum > 80 ? 'yellow' : 'green'} w={120} /></Table.Td>
                        </Table.Tr>
                      )
                    })}</Table.Tbody>
                  </Table>
                </Paper>
              )}

              <Paper p="md" withBorder>
                <Text fw={600} mb="md">Ingresos vs Gastos (12 meses)</Text>
                <BarChart h={350} data={ingresosMensuales.map(i => ({ mes: i.mes.slice(5), Ingresos: Math.round(i.ingresos / 1000), Gastos: Math.round(i.gastos / 1000) }))} dataKey="mes" series={[{ name: 'Ingresos', color: 'green.6' }, { name: 'Gastos', color: 'red.5' }]} valueFormatter={v => `$${v}k`} tickLine="y" />
              </Paper>
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="exportar" pt="md">
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Paper p="lg" withBorder ta="center"><IconFileDownload size={32} /><Text fw={600} mt="sm">Balance PDF</Text><Button component="a" href="/api/export/pdf/reporte-financiero" mt="md" fullWidth variant="light">Descargar</Button></Paper>
            <Paper p="lg" withBorder ta="center"><IconFileInvoice size={32} /><Text fw={600} mt="sm">Ventas Excel</Text><Button component="a" href="/api/export/excel/ventas" mt="md" fullWidth variant="light">Descargar</Button></Paper>
            <Paper p="lg" withBorder ta="center"><IconCash size={32} /><Text fw={600} mt="sm">Gastos Excel</Text><Button component="a" href="/api/export/excel/costos" mt="md" fullWidth variant="light">Descargar</Button></Paper>
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={opened} onClose={close} title="Nueva Factura de Venta" size="xl">
        <Stack>
          <SimpleGrid cols={3}>
            <Group align="end" gap="xs" wrap="nowrap">
              <Select label="Cliente *" data={clientes.map(c => ({ value: c.id.toString(), label: c.nombre }))} value={fForm.cliente_id} onChange={v => setFForm({ ...fForm, cliente_id: v })} required searchable style={{ flex: 1 }} />
              <Tooltip label="Crear nuevo cliente">
                <ActionIcon variant="light" color="blue" size="lg" mt="xl" onClick={openCliente}><IconUserPlus size={20} /></ActionIcon>
              </Tooltip>
            </Group>
            <TextInput label="Fecha Emisión *" type="date" value={fForm.fecha_emision} onChange={e => setFForm({ ...fForm, fecha_emision: e.target.value })} required />
            <Select label="Forma de Pago" data={['contado','credito_30','credito_60','credito_90']} value={fForm.forma_pago} onChange={v => setFForm({ ...fForm, forma_pago: v })} />
          </SimpleGrid>

          <Divider label="Items de la Factura" labelPosition="center" />
          {items.map((it, i) => (
            <Group key={i} grow align="end">
              <Select label="Producto" data={productos.map(p => ({ value: p.id.toString(), label: p.nombre }))} value={it.producto_id} onChange={v => updateItem(i, 'producto_id', v)} />
              <TextInput label="Descripción" value={it.descripcion} onChange={e => updateItem(i, 'descripcion', e.target.value)} />
              <NumberInput label="Cant" value={it.cantidad} onChange={v => updateItem(i, 'cantidad', v)} min={0} />
              <NumberInput label="Precio $" value={it.precio_unitario} onChange={v => updateItem(i, 'precio_unitario', v)} min={0} />
              <NumberInput label="IVA %" value={it.iva_porcentaje} onChange={v => updateItem(i, 'iva_porcentaje', v)} min={0} max={19} w={70} />
              <Text size="xs" c="dimmed" mt="xl">{formatCOP(parseFloat(it.cantidad||0) * parseFloat(it.precio_unitario||0))}</Text>
              <ActionIcon color="red" variant="light" onClick={() => removeItem(i)}><IconTrash size={16} /></ActionIcon>
            </Group>
          ))}
          <Button variant="light" leftSection={<IconPlus size={14} />} onClick={addItem}>Agregar Item</Button>

          <Divider />
          <SimpleGrid cols={3}>
            <NumberInput label="% ReteFuente" value={fForm.retencion_fuente_porcentaje} onChange={v => setFForm({ ...fForm, retencion_fuente_porcentaje: v })} min={0} max={100} />
            <NumberInput label="% ReteICA" value={fForm.retencion_ica_porcentaje} onChange={v => setFForm({ ...fForm, retencion_ica_porcentaje: v })} min={0} max={100} />
            <TextInput label="Observaciones" value={fForm.observaciones} onChange={e => setFForm({ ...fForm, observaciones: e.target.value })} />
          </SimpleGrid>

          <Paper p="md" bg="gray.0" withBorder>
            <SimpleGrid cols={2}>
              <div><Text size="sm">Subtotal: <b>{formatCOP(subtotal)}</b></Text><Text size="sm">IVA: <b>{formatCOP(ivaTotal)}</b></Text><Text size="sm">ReteFuente: <b>{formatCOP(retFte)}</b></Text><Text size="sm">ReteICA: <b>{formatCOP(retIca)}</b></Text></div>
              <div><Text size="lg" fw={700}>TOTAL: {formatCOP(totalNeto)}</Text></div>
            </SimpleGrid>
          </Paper>

          <Group justify="flex-end"><Button variant="default" onClick={close}>Cancelar</Button><Button onClick={handleEmitir} disabled={items.length === 0}>Emitir Factura</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={openedCliente} onClose={closeCliente} title="Nuevo Cliente" size="md">
        <Stack>
          <SimpleGrid cols={2}>
            <Select label="Tipo Documento *" data={[{value:'CC',label:'CC'},{value:'NIT',label:'NIT'},{value:'CE',label:'CE'},{value:'PP',label:'PP'}]} value={clienteForm.tipo_documento} onChange={v => setClienteForm({...clienteForm, tipo_documento: v, dv: v === 'NIT' ? clienteForm.dv : ''})} />
            <TextInput label="Número Documento *" value={clienteForm.numero_documento} onChange={e => setClienteForm({...clienteForm, numero_documento: e.target.value})} />
          </SimpleGrid>
          {clienteForm.tipo_documento === 'NIT' && (
            <TextInput label="DV" value={clienteForm.dv} onChange={e => setClienteForm({...clienteForm, dv: e.target.value})} w={100} />
          )}
          <TextInput label="Nombre *" value={clienteForm.nombre} onChange={e => setClienteForm({...clienteForm, nombre: e.target.value})} />
          <TextInput label="Nombre Comercial" value={clienteForm.nombre_comercial} onChange={e => setClienteForm({...clienteForm, nombre_comercial: e.target.value})} />
          <SimpleGrid cols={2}>
            <TextInput label="Dirección" value={clienteForm.direccion} onChange={e => setClienteForm({...clienteForm, direccion: e.target.value})} />
            <TextInput label="Teléfono" value={clienteForm.telefono} onChange={e => setClienteForm({...clienteForm, telefono: e.target.value})} />
          </SimpleGrid>
          <TextInput label="Email" value={clienteForm.email} onChange={e => setClienteForm({...clienteForm, email: e.target.value})} />
          <SimpleGrid cols={2}>
            <Select label="Régimen *" data={[{value:'comun',label:'Común'},{value:'simplificado',label:'Simplificado'}]} value={clienteForm.regimen} onChange={v => setClienteForm({...clienteForm, regimen: v})} />
            <Select label="Responsabilidad Fiscal *" data={[{value:'IVA',label:'IVA'},{value:'INC',label:'INC'},{value:'no_responsable',label:'No Responsable'}]} value={clienteForm.responsabilidad_fiscal} onChange={v => setClienteForm({...clienteForm, responsabilidad_fiscal: v})} />
          </SimpleGrid>
          <Group justify="flex-end"><Button variant="default" onClick={closeCliente}>Cancelar</Button><Button onClick={handleCrearCliente} disabled={!clienteForm.numero_documento || !clienteForm.nombre}>Crear Cliente</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={openedMovimiento} onClose={closeMovimiento} title="Nuevo Movimiento" size="md">
        <Stack>
          <SimpleGrid cols={2}>
            <Select label="Tipo *" data={[{value:'Ingreso',label:'Ingreso'},{value:'Gasto',label:'Gasto'},{value:'Ajuste',label:'Ajuste'},{value:'Traslado',label:'Traslado'}]} value={movForm.tipo} onChange={v => setMovForm({...movForm, tipo: v})} />
            <TextInput label="Fecha *" type="date" value={movForm.fecha} onChange={e => setMovForm({...movForm, fecha: e.target.value})} />
          </SimpleGrid>
          <Select label="Cuenta Contable *" data={planCuentas.map(pc => ({ value: pc.id.toString(), label: `${pc.codigo} - ${pc.nombre}` }))} value={movForm.cuenta_contable_id} onChange={v => setMovForm({...movForm, cuenta_contable_id: v})} searchable />
          <Textarea label="Descripción" value={movForm.descripcion} onChange={e => setMovForm({...movForm, descripcion: e.target.value})} />
          <NumberInput label="Monto *" value={movForm.monto} onChange={v => setMovForm({...movForm, monto: v})} min={0} />
          {(movForm.tipo === 'Ingreso' || movForm.tipo === 'Gasto') && (
            <SimpleGrid cols={2}>
              <Select label="Medio de Pago" data={[{value:'efectivo',label:'Efectivo'},{value:'transferencia',label:'Transferencia'},{value:'tarjeta',label:'Tarjeta'},{value:'cheque',label:'Cheque'},{value:'otros',label:'Otros'}]} value={movForm.medio_pago} onChange={v => setMovForm({...movForm, medio_pago: v})} />
              <TextInput label="Referencia (Comprobante)" value={movForm.referencia} onChange={e => setMovForm({...movForm, referencia: e.target.value})} />
            </SimpleGrid>
          )}
          <Group justify="flex-end"><Button variant="default" onClick={closeMovimiento}>Cancelar</Button><Button onClick={handleCrearMovimiento} loading={loadingMovimiento} disabled={!movForm.tipo || !movForm.cuenta_contable_id || !movForm.monto}>Guardar Movimiento</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={openedPresupuesto} onClose={closePresupuesto} title="Nuevo Presupuesto" size="md">
        <Stack>
          <TextInput label="Nombre *" value={presupuestoForm.nombre} onChange={e => setPresupuestoForm({...presupuestoForm, nombre: e.target.value})} />
          <SimpleGrid cols={2}>
            <TextInput label="Periodo Inicio *" type="date" value={presupuestoForm.periodo_inicio} onChange={e => setPresupuestoForm({...presupuestoForm, periodo_inicio: e.target.value})} />
            <TextInput label="Periodo Fin *" type="date" value={presupuestoForm.periodo_fin} onChange={e => setPresupuestoForm({...presupuestoForm, periodo_fin: e.target.value})} />
          </SimpleGrid>
          <Select label="Tipo *" data={[{value:'anual',label:'Anual'},{value:'semestral',label:'Semestral'},{value:'trimestral',label:'Trimestral'},{value:'mensual',label:'Mensual'}]} value={presupuestoForm.tipo} onChange={v => setPresupuestoForm({...presupuestoForm, tipo: v})} />
          <Group justify="flex-end"><Button variant="default" onClick={closePresupuesto}>Cancelar</Button><Button onClick={handleCrearPresupuesto} disabled={!presupuestoForm.nombre || !presupuestoForm.periodo_inicio || !presupuestoForm.periodo_fin}>Crear Presupuesto</Button></Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
