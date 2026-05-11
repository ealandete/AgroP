import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, Stack, SimpleGrid, Text, Tabs, ActionIcon,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconEdit, IconSkull, IconX, IconEgg, IconEggs, IconDroplet } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatNumber } from '../config.js'

const TIPO_COLORS = {
  huevo: 'yellow',
  carne: 'orange',
  doble: 'green',
}

export default function Avicola() {
  const [lotes, setLotes] = useState([])
  const [produccion, setProduccion] = useState([])
  const [razas, setRazas] = useState([])
  const [activeTab, setActiveTab] = useState('lotes')
  const [loteOpened, { open: loteOpen, close: loteClose }] = useDisclosure(false)
  const [prodOpened, { open: prodOpen, close: prodClose }] = useDisclosure(false)
  const [mortOpened, { open: mortOpen, close: mortClose }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [mortLoteId, setMortLoteId] = useState(null)
  const [mortForm, setMortForm] = useState({ mortalidad: '', causa: '' })
  const [loteForm, setLoteForm] = useState({
    codigo: '', galpon: '', fecha_ingreso: new Date().toISOString().split('T')[0],
    cantidad_inicial: '', tipo_produccion: 'huevo', raza_id: '',
  })
  const [prodForm, setProdForm] = useState({
    lote_aves_id: '', fecha: new Date().toISOString().split('T')[0],
    huevos_puestos: '', huevos_rotos: '', huevos_incubables: '',
    mortalidad_dia: '', alimento_consumido_kg: '',
  })

  const loadData = async () => {
    const [l, p, r] = await Promise.all([
      api.get('/lotes-aves/'),
      api.get('/produccion-huevos/'),
      api.get('/animales/razas/?especie=aviar'),
    ])
    setLotes(l.data)
    setProduccion(p.data)
    setRazas(r.data)
  }

  useEffect(() => { loadData() }, [])

  const handleLoteSubmit = async () => {
    try {
      const payload = {
        ...loteForm,
        cantidad_inicial: parseInt(loteForm.cantidad_inicial),
        raza_id: loteForm.raza_id ? parseInt(loteForm.raza_id) : null,
      }
      if (editando) {
        await api.put(`/lotes-aves/${editando}/`, payload)
        notifications.show({ title: 'Lote actualizado', color: 'green' })
      } else {
        await api.post('/lotes-aves/', payload)
        notifications.show({ title: 'Lote creado', color: 'green' })
      }
      loteClose()
      setEditando(null)
      setLoteForm({
        codigo: '', galpon: '', fecha_ingreso: new Date().toISOString().split('T')[0],
        cantidad_inicial: '', tipo_produccion: 'huevo', raza_id: '',
      })
      loadData()
    } catch {
      notifications.show({ title: 'Error', color: 'red' })
    }
  }

  const handleProdSubmit = async () => {
    try {
      await api.post('/produccion-huevos/', {
        ...prodForm,
        lote_aves_id: parseInt(prodForm.lote_aves_id),
        huevos_puestos: parseInt(prodForm.huevos_puestos) || 0,
        huevos_rotos: parseInt(prodForm.huevos_rotos) || 0,
        huevos_incubables: parseInt(prodForm.huevos_incubables) || 0,
        mortalidad_dia: parseInt(prodForm.mortalidad_dia) || 0,
        alimento_consumido_kg: parseFloat(prodForm.alimento_consumido_kg) || 0,
      })
      notifications.show({ title: 'Producción registrada', color: 'green' })
      prodClose()
      setProdForm({
        lote_aves_id: '', fecha: new Date().toISOString().split('T')[0],
        huevos_puestos: '', huevos_rotos: '', huevos_incubables: '',
        mortalidad_dia: '', alimento_consumido_kg: '',
      })
      loadData()
    } catch {
      notifications.show({ title: 'Error', color: 'red' })
    }
  }

  const handleEditLote = (l) => {
    setEditando(l.id)
    setLoteForm({
      codigo: l.codigo || '',
      galpon: l.galpon || '',
      fecha_ingreso: l.fecha_ingreso || '',
      cantidad_inicial: l.cantidad_inicial?.toString() || '',
      tipo_produccion: l.tipo_produccion || 'huevo',
      raza_id: l.raza_id?.toString() || '',
    })
    loteOpen()
  }

  const handleFinalizarLote = async (id) => {
    try {
      await api.put(`/lotes-aves/${id}/`, { estado: 'finalizado' })
      notifications.show({ title: 'Lote finalizado', color: 'green' })
      loadData()
    } catch {
      notifications.show({ title: 'Error', color: 'red' })
    }
  }

  const handleOpenMort = (loteId) => {
    setMortLoteId(loteId)
    setMortForm({ mortalidad: '', causa: '' })
    mortOpen()
  }

  const handleMortSubmit = async () => {
    try {
      const lote = lotes.find(l => l.id === mortLoteId)
      const nuevaActual = (parseInt(lote.cantidad_actual) || 0) - (parseInt(mortForm.mortalidad) || 0)
      await api.put(`/lotes-aves/${mortLoteId}/`, {
        cantidad_actual: Math.max(0, nuevaActual),
      })
      await api.post('/produccion-huevos/', {
        lote_aves_id: mortLoteId,
        fecha: new Date().toISOString().split('T')[0],
        mortalidad_dia: parseInt(mortForm.mortalidad) || 0,
        huevos_puestos: 0, huevos_rotos: 0, huevos_incubables: 0,
        alimento_consumido_kg: 0,
      })
      notifications.show({ title: 'Mortalidad registrada', color: 'green' })
      mortClose()
      loadData()
    } catch {
      notifications.show({ title: 'Error', color: 'red' })
    }
  }

  const getLoteName = (id) => {
    const l = lotes.find((l) => l.id === id)
    return l ? `${l.codigo} (${l.galpon})` : '-'
  }

  const hoy = new Date().toISOString().split('T')[0]
  const mesActual = hoy.slice(0, 7)
  const totalAves = lotes.filter(l => l.estado !== 'finalizado').reduce((s, l) => s + (parseInt(l.cantidad_actual) || 0), 0)
  const produccionHoy = produccion.filter(p => p.fecha === hoy).reduce((s, p) => s + (parseInt(p.huevos_puestos) || 0), 0)
  const mortalidadMes = produccion.filter(p => p.fecha.startsWith(mesActual)).reduce((s, p) => s + (parseInt(p.mortalidad_dia) || 0), 0)
  const avesEnPostura = lotes.filter(l => l.tipo_produccion === 'huevo' && l.estado !== 'finalizado').reduce((s, l) => s + (parseInt(l.cantidad_actual) || 0), 0)
  const postura = avesEnPostura > 0 ? ((produccionHoy / avesEnPostura) * 100).toFixed(1) : '0.0'

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Gestión Avícola</Title>
        <Group>
          {activeTab === 'lotes' && (
            <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setLoteForm({ codigo: '', galpon: '', fecha_ingreso: hoy, cantidad_inicial: '', tipo_produccion: 'huevo', raza_id: '' }); loteOpen() }}>Nuevo Lote</Button>
          )}
          {activeTab === 'produccion' && (
            <Button leftSection={<IconPlus size={16} />} onClick={() => { setProdForm({ lote_aves_id: '', fecha: hoy, huevos_puestos: '', huevos_rotos: '', huevos_incubables: '', mortalidad_dia: '', alimento_consumido_kg: '' }); prodOpen() }}>Registrar Producción</Button>
          )}
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconEggs size={20} color="var(--mantine-color-blue-6)" /><Text size="xs" c="dimmed">Total Aves</Text></Group>
          <Text size="xl" fw={700}>{formatNumber(totalAves)}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconSkull size={20} color="var(--mantine-color-red-6)" /><Text size="xs" c="dimmed">Mortalidad Mes</Text></Group>
          <Text size="xl" fw={700}>{formatNumber(mortalidadMes)}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconEgg size={20} color="var(--mantine-color-yellow-6)" /><Text size="xs" c="dimmed">Producción Hoy</Text></Group>
          <Text size="xl" fw={700}>{formatNumber(produccionHoy)}</Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group gap={8}><IconDroplet size={20} color="var(--mantine-color-green-6)" /><Text size="xs" c="dimmed">Postura %</Text></Group>
          <Text size="xl" fw={700}>{postura}%</Text>
        </Paper>
      </SimpleGrid>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="lotes">Lotes de Aves ({lotes.length})</Tabs.Tab>
          <Tabs.Tab value="produccion">Producción de Huevos</Tabs.Tab>
          <Tabs.Tab value="mortalidad">Mortalidad</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="lotes" pt="md">
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Código</Table.Th>
                  <Table.Th>Galpón</Table.Th>
                  <Table.Th>Fecha Ingreso</Table.Th>
                  <Table.Th>Cant. Inicial</Table.Th>
                  <Table.Th>Cant. Actual</Table.Th>
                  <Table.Th>Mortalidad</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {lotes.filter(l => l.estado !== 'finalizado').map((l) => (
                  <Table.Tr key={l.id}>
                    <Table.Td fw={500}>{l.codigo}</Table.Td>
                    <Table.Td>{l.galpon}</Table.Td>
                    <Table.Td>{l.fecha_ingreso}</Table.Td>
                    <Table.Td>{formatNumber(l.cantidad_inicial)}</Table.Td>
                    <Table.Td>{formatNumber(l.cantidad_actual)}</Table.Td>
                    <Table.Td>{formatNumber((parseInt(l.cantidad_inicial) || 0) - (parseInt(l.cantidad_actual) || 0))}</Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon variant="light" color="blue" size="sm" onClick={() => handleEditLote(l)}><IconEdit size={14} /></ActionIcon>
                        <ActionIcon variant="light" color="red" size="sm" onClick={() => handleOpenMort(l.id)}><IconSkull size={14} /></ActionIcon>
                        <ActionIcon variant="light" color="gray" size="sm" onClick={() => handleFinalizarLote(l.id)}><IconX size={14} /></ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {lotes.filter(l => l.estado !== 'finalizado').length === 0 && (
                  <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center" py="sm">No hay lotes activos</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="produccion" pt="md">
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Lote</Table.Th>
                  <Table.Th>Huevos Puestos</Table.Th>
                  <Table.Th>Rotos</Table.Th>
                  <Table.Th>Incubables</Table.Th>
                  <Table.Th>Alimento (kg)</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {produccion.toReversed().map((p) => (
                  <Table.Tr key={p.id}>
                    <Table.Td>{p.fecha}</Table.Td>
                    <Table.Td>{getLoteName(p.lote_aves_id)}</Table.Td>
                    <Table.Td fw={500}>{formatNumber(p.huevos_puestos)}</Table.Td>
                    <Table.Td c="red">{formatNumber(p.huevos_rotos)}</Table.Td>
                    <Table.Td>{formatNumber(p.huevos_incubables || 0)}</Table.Td>
                    <Table.Td>{formatNumber(p.alimento_consumido_kg)}</Table.Td>
                  </Table.Tr>
                ))}
                {produccion.length === 0 && (
                  <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center" py="sm">No hay registros de producción</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="mortalidad" pt="md">
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Lote</Table.Th>
                  <Table.Th>Mortalidad</Table.Th>
                  <Table.Th>Acumulado Lote</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {produccion.filter(p => (parseInt(p.mortalidad_dia) || 0) > 0).toReversed().map((p) => {
                  const lote = lotes.find(l => l.id === p.lote_aves_id)
                  const mortAcum = produccion.filter(x => x.lote_aves_id === p.lote_aves_id && x.fecha <= p.fecha).reduce((s, x) => s + (parseInt(x.mortalidad_dia) || 0), 0)
                  return (
                    <Table.Tr key={p.id}>
                      <Table.Td>{p.fecha}</Table.Td>
                      <Table.Td>{getLoteName(p.lote_aves_id)}</Table.Td>
                      <Table.Td c="red" fw={500}>{formatNumber(p.mortalidad_dia)}</Table.Td>
                      <Table.Td>{formatNumber(mortAcum)}</Table.Td>
                    </Table.Tr>
                  )
                })}
                {produccion.filter(p => (parseInt(p.mortalidad_dia) || 0) > 0).length === 0 && (
                  <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center" py="sm">Sin registros de mortalidad</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={loteOpened} onClose={() => { loteClose(); setEditando(null) }} title={editando ? 'Editar Lote' : 'Nuevo Lote'} size="md">
        <Stack>
          <SimpleGrid cols={2}>
            <TextInput label="Código" value={loteForm.codigo} onChange={(e) => setLoteForm({ ...loteForm, codigo: e.target.value })} required />
            <TextInput label="Galpón" value={loteForm.galpon} onChange={(e) => setLoteForm({ ...loteForm, galpon: e.target.value })} required />
            <TextInput label="Fecha Ingreso" type="date" value={loteForm.fecha_ingreso} onChange={(e) => setLoteForm({ ...loteForm, fecha_ingreso: e.target.value })} required />
            <NumberInput label="Cantidad Inicial" value={loteForm.cantidad_inicial} onChange={(v) => setLoteForm({ ...loteForm, cantidad_inicial: v })} min={1} required />
            <Select
              label="Tipo Producción"
              data={[
                { value: 'huevo', label: 'Huevo' },
                { value: 'carne', label: 'Carne' },
                { value: 'doble', label: 'Doble Propósito' },
              ]}
              value={loteForm.tipo_produccion}
              onChange={(v) => setLoteForm({ ...loteForm, tipo_produccion: v })}
              required
            />
            <Select
              label="Raza"
              placeholder="Seleccionar"
              data={razas.map((r) => ({ value: r.id.toString(), label: r.nombre }))}
              value={loteForm.raza_id}
              onChange={(v) => setLoteForm({ ...loteForm, raza_id: v })}
              clearable
            />
          </SimpleGrid>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { loteClose(); setEditando(null) }}>Cancelar</Button>
            <Button onClick={handleLoteSubmit}>{editando ? 'Actualizar' : 'Guardar'}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={prodOpened} onClose={prodClose} title="Registrar Producción" size="md">
        <Stack>
          <Select
            label="Lote"
            data={lotes.filter(l => l.estado !== 'finalizado').map((l) => ({ value: l.id.toString(), label: `${l.codigo} - ${l.galpon}` }))}
            value={prodForm.lote_aves_id}
            onChange={(v) => setProdForm({ ...prodForm, lote_aves_id: v })}
            searchable
            required
          />
          <TextInput label="Fecha" type="date" value={prodForm.fecha} onChange={(e) => setProdForm({ ...prodForm, fecha: e.target.value })} required />
          <SimpleGrid cols={2}>
            <NumberInput label="Huevos Puestos" value={prodForm.huevos_puestos} onChange={(v) => setProdForm({ ...prodForm, huevos_puestos: v })} min={0} />
            <NumberInput label="Huevos Rotos" value={prodForm.huevos_rotos} onChange={(v) => setProdForm({ ...prodForm, huevos_rotos: v })} min={0} />
            <NumberInput label="Huevos Incubables" value={prodForm.huevos_incubables} onChange={(v) => setProdForm({ ...prodForm, huevos_incubables: v })} min={0} />
            <NumberInput label="Mortalidad del Día" value={prodForm.mortalidad_dia} onChange={(v) => setProdForm({ ...prodForm, mortalidad_dia: v })} min={0} />
            <NumberInput label="Alimento (kg)" value={prodForm.alimento_consumido_kg} onChange={(v) => setProdForm({ ...prodForm, alimento_consumido_kg: v })} min={0} decimalScale={2} />
          </SimpleGrid>
          <Group justify="flex-end">
            <Button variant="default" onClick={prodClose}>Cancelar</Button>
            <Button onClick={handleProdSubmit}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={mortOpened} onClose={mortClose} title="Registrar Mortalidad" size="sm">
        <Stack>
          <NumberInput label="Aves muertas" value={mortForm.mortalidad} onChange={(v) => setMortForm({ ...mortForm, mortalidad: v })} min={1} required />
          <TextInput label="Causa (opcional)" value={mortForm.causa} onChange={(e) => setMortForm({ ...mortForm, causa: e.target.value })} />
          <Group justify="flex-end">
            <Button variant="default" onClick={mortClose}>Cancelar</Button>
            <Button color="red" onClick={handleMortSubmit}>Registrar</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
