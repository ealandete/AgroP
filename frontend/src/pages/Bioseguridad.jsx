import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput, Select,
  Badge, ActionIcon, Stack, SimpleGrid, Text, Card, Tabs, Textarea,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPlus, IconEdit, IconUser, IconSpray, IconTruck,
  IconAlertTriangle, IconDoorExit, IconSearch,
} from '@tabler/icons-react'
import api from '../services/api.js'

const MOTIVOS = [
  { value: 'visita', label: 'Visita', color: 'blue' },
  { value: 'tecnico', label: 'Técnico', color: 'cyan' },
  { value: 'veterinario', label: 'Veterinario', color: 'green' },
  { value: 'proveedor', label: 'Proveedor', color: 'orange' },
  { value: 'transporte', label: 'Transporte', color: 'yellow' },
  { value: 'autoridad', label: 'Autoridad', color: 'red' },
  { value: 'otro', label: 'Otro', color: 'gray' },
]

const AREAS_DESINF = [
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'galpon', label: 'Galpón' },
  { value: 'establo', label: 'Establo' },
  { value: 'bodega', label: 'Bodega' },
  { value: 'vehiculo', label: 'Vehículo' },
  { value: 'equipo', label: 'Equipo' },
  { value: 'otro', label: 'Otro' },
]

const TIPOS_DESINF = [
  { value: 'cal', label: 'Cal' },
  { value: 'bactericida', label: 'Bactericida' },
  { value: 'virucida', label: 'Virucida' },
  { value: 'otro', label: 'Otro' },
]

const TIPOS_VEHICULO = [
  { value: 'propio', label: 'Propio' },
  { value: 'proveedor', label: 'Proveedor' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'visita', label: 'Visita' },
]

const defaultVisita = {
  finca_id: '', nombre: '', identificacion: '', empresa: '',
  motivo: 'visita', fecha_ingreso: '', fecha_salida: '',
  firma: '', observaciones: '', areas_visitadas: '',
}

const defaultDesinfeccion = {
  finca_id: '', fecha: new Date().toISOString().split('T')[0],
  area: 'ingreso', tipo: 'cal', producto: '', concentracion: '',
  responsable: '', observaciones: '',
}

const defaultVehiculo = {
  finca_id: '', placa: '', conductor: '', empresa: '',
  fecha: new Date().toISOString().split('T')[0],
  tipo: 'visita', desinfeccion_si_no: false, observaciones: '',
}

export default function Bioseguridad() {
  const [visitas, setVisitas] = useState([])
  const [desinfecciones, setDesinfecciones] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [resumen, setResumen] = useState(null)
  const [fincas, setFincas] = useState([])
  const [tab, setTab] = useState('visitas')
  const [search, setSearch] = useState('')

  const [vOpened, { open: openV, close: closeV }] = useDisclosure(false)
  const [dOpened, { open: openD, close: closeD }] = useDisclosure(false)
  const [vehOpened, { open: openVeh, close: closeVeh }] = useDisclosure(false)
  const [salidaOpened, { open: openSalida, close: closeSalida }] = useDisclosure(false)
  const [editandoVisita, setEditandoVisita] = useState(null)
  const [formVisita, setFormVisita] = useState({ ...defaultVisita })
  const [formDesinfeccion, setFormDesinfeccion] = useState({ ...defaultDesinfeccion })
  const [formVehiculo, setFormVehiculo] = useState({ ...defaultVehiculo })
  const [salidaForm, setSalidaForm] = useState({ fecha_salida: '', observaciones: '' })
  const [selectedVisita, setSelectedVisita] = useState(null)

  const loadData = () => {
    api.get('/bioseguridad/visitas/').then(r => setVisitas(r.data)).catch(() => {})
    api.get('/bioseguridad/desinfeccion/').then(r => setDesinfecciones(r.data)).catch(() => {})
    api.get('/bioseguridad/vehiculos/').then(r => setVehiculos(r.data)).catch(() => {})
    api.get('/bioseguridad/resumen').then(r => setResumen(r.data)).catch(() => {})
    api.get('/lotes/fincas/').then(r => setFincas(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }
  useEffect(loadData, [])

  const filteredVisitas = visitas.filter(v => {
    if (!search) return true
    const q = search.toLowerCase()
    return v.nombre?.toLowerCase().includes(q) || v.identificacion?.toLowerCase().includes(q) || v.empresa?.toLowerCase().includes(q)
  })

  const getMotivoBadge = (m) => {
    const found = MOTIVOS.find(x => x.value === m)
    return found ? <Badge color={found.color} size="sm">{found.label}</Badge> : <Badge size="sm">{m}</Badge>
  }

  const handleSubmitVisita = async () => {
    try {
      const payload = {
        ...formVisita,
        finca_id: parseInt(formVisita.finca_id) || fincas[0]?.id,
        fecha_ingreso: formVisita.fecha_ingreso ? new Date(formVisita.fecha_ingreso).toISOString() : new Date().toISOString(),
        fecha_salida: formVisita.fecha_salida ? new Date(formVisita.fecha_salida).toISOString() : null,
      }
      await api.post('/bioseguridad/visitas/', payload)
      notifications.show({ title: 'Visita registrada', color: 'green' })
      closeV(); setFormVisita({ ...defaultVisita }); loadData()
    } catch { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const openRegistrarSalida = (v) => {
    setSelectedVisita(v)
    setSalidaForm({ fecha_salida: new Date().toISOString().slice(0, 16), observaciones: '' })
    openSalida()
  }

  const handleRegistrarSalida = async () => {
    try {
      await api.put(`/bioseguridad/visitas/${selectedVisita.id}`, {
        ...salidaForm,
        fecha_salida: new Date(salidaForm.fecha_salida).toISOString(),
      })
      notifications.show({ title: 'Salida registrada', color: 'green' })
      closeSalida(); loadData()
    } catch { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const handleSubmitDesinfeccion = async () => {
    try {
      const payload = {
        ...formDesinfeccion,
        finca_id: parseInt(formDesinfeccion.finca_id) || fincas[0]?.id,
      }
      await api.post('/bioseguridad/desinfeccion/', payload)
      notifications.show({ title: 'Desinfección registrada', color: 'green' })
      closeD(); setFormDesinfeccion({ ...defaultDesinfeccion }); loadData()
    } catch { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const handleSubmitVehiculo = async () => {
    try {
      const payload = {
        ...formVehiculo,
        finca_id: parseInt(formVehiculo.finca_id) || fincas[0]?.id,
        desinfeccion_si_no: formVehiculo.desinfeccion_si_no === true || formVehiculo.desinfeccion_si_no === 'true',
      }
      await api.post('/bioseguridad/vehiculos/', payload)
      notifications.show({ title: 'Vehículo registrado', color: 'green' })
      closeVeh(); setFormVehiculo({ ...defaultVehiculo }); loadData()
    } catch { notifications.show({ title: 'Error', color: 'red' }) }
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Bioseguridad</Title>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <Card withBorder padding="md" radius="md">
          <Text size="xs" c="dimmed">Visitas del Mes</Text>
          <Text fw={700} size="xl">{resumen?.visitas_mes || 0}</Text>
        </Card>
        <Card withBorder padding="md" radius="md" style={{ borderLeft: '4px solid var(--mantine-color-cyan-6)' }}>
          <Text size="xs" c="dimmed">Desinfecciones</Text>
          <Text fw={700} size="xl" c="cyan.6">{resumen?.desinfecciones_mes || 0}</Text>
        </Card>
        <Card withBorder padding="md" radius="md" style={{ borderLeft: '4px solid var(--mantine-color-blue-6)' }}>
          <Text size="xs" c="dimmed">Vehículos Controlados</Text>
          <Text fw={700} size="xl" c="blue.6">{resumen?.vehiculos_mes || 0}</Text>
        </Card>
        <Card withBorder padding="md" radius="md" style={{ borderLeft: `4px solid var(--mantine-color-${(resumen?.alertas_bioseguridad || 0) > 0 ? 'red' : 'gray'}-6)` }}>
          <Text size="xs" c="dimmed">Alertas Bioseguridad</Text>
          <Text fw={700} size="xl" c={(resumen?.alertas_bioseguridad || 0) > 0 ? 'red.6' : undefined}>{resumen?.alertas_bioseguridad || 0}</Text>
        </Card>
      </SimpleGrid>

      {resumen?.alertas_bioseguridad > 0 && (
        <Paper withBorder p="sm" bg="red.0">
          <Group gap="xs">
            <IconAlertTriangle size={20} color="var(--mantine-color-red-6)" />
            <Text fw={600} size="sm" c="red.7">
              {resumen.alertas_bioseguridad} vehículo(s) sin desinfección registrada este mes
            </Text>
          </Group>
        </Paper>
      )}

      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="visitas" leftSection={<IconUser size={16} />}>Control Visitas</Tabs.Tab>
          <Tabs.Tab value="desinfeccion" leftSection={<IconSpray size={16} />}>Desinfección</Tabs.Tab>
          <Tabs.Tab value="vehiculos" leftSection={<IconTruck size={16} />}>Vehículos</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="visitas" pt="sm">
          <Group justify="space-between" mb="sm">
            <TextInput
              placeholder="Buscar visitante..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, maxWidth: 400 }}
            />
            <Button leftSection={<IconPlus size={16} />} onClick={() => { setFormVisita({ ...defaultVisita }); openV() }}>
              Registrar Visita
            </Button>
          </Group>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha Ingreso</Table.Th>
                  <Table.Th>Visitante</Table.Th>
                  <Table.Th>Identificación</Table.Th>
                  <Table.Th>Empresa</Table.Th>
                  <Table.Th>Motivo</Table.Th>
                  <Table.Th>Ingreso / Salida</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredVisitas.map(v => (
                  <Table.Tr key={v.id}>
                    <Table.Td>{v.fecha_ingreso ? new Date(v.fecha_ingreso).toLocaleString('es-CO') : '-'}</Table.Td>
                    <Table.Td fw={500}>{v.nombre}</Table.Td>
                    <Table.Td>{v.identificacion || '-'}</Table.Td>
                    <Table.Td>{v.empresa || '-'}</Table.Td>
                    <Table.Td>{getMotivoBadge(v.motivo)}</Table.Td>
                    <Table.Td>
                      {v.fecha_salida ? (
                        <Badge color="green" size="sm">Completada</Badge>
                      ) : (
                        <Badge color="orange" size="sm">En curso</Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        {!v.fecha_salida && (
                          <ActionIcon variant="light" color="green" size="sm" onClick={() => openRegistrarSalida(v)}>
                            <IconDoorExit size={14} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {filteredVisitas.length === 0 && (
                  <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center">Sin visitas registradas</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="desinfeccion" pt="sm">
          <Group justify="space-between" mb="sm">
            <Text size="sm" c="dimmed">{desinfecciones.length} registros</Text>
            <Button leftSection={<IconPlus size={16} />} onClick={() => { setFormDesinfeccion({ ...defaultDesinfeccion }); openD() }}>
              Nueva Desinfección
            </Button>
          </Group>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Área</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Producto</Table.Th>
                  <Table.Th>Concentración</Table.Th>
                  <Table.Th>Responsable</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {desinfecciones.map(d => (
                  <Table.Tr key={d.id}>
                    <Table.Td>{d.fecha}</Table.Td>
                    <Table.Td><Badge size="sm" variant="light">{AREAS_DESINF.find(a => a.value === d.area)?.label || d.area}</Badge></Table.Td>
                    <Table.Td><Badge size="sm" color="cyan">{TIPOS_DESINF.find(t => t.value === d.tipo)?.label || d.tipo}</Badge></Table.Td>
                    <Table.Td>{d.producto || '-'}</Table.Td>
                    <Table.Td>{d.concentracion || '-'}</Table.Td>
                    <Table.Td>{d.responsable || '-'}</Table.Td>
                  </Table.Tr>
                ))}
                {desinfecciones.length === 0 && (
                  <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin desinfecciones registradas</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="vehiculos" pt="sm">
          <Group justify="space-between" mb="sm">
            <Text size="sm" c="dimmed">{vehiculos.length} registros</Text>
            <Button leftSection={<IconPlus size={16} />} onClick={() => { setFormVehiculo({ ...defaultVehiculo }); openVeh() }}>
              Registrar Vehículo
            </Button>
          </Group>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Placa</Table.Th>
                  <Table.Th>Conductor</Table.Th>
                  <Table.Th>Empresa</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Desinfección</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {vehiculos.map(v => (
                  <Table.Tr key={v.id}>
                    <Table.Td>{v.fecha}</Table.Td>
                    <Table.Td fw={500}>{v.placa}</Table.Td>
                    <Table.Td>{v.conductor || '-'}</Table.Td>
                    <Table.Td>{v.empresa || '-'}</Table.Td>
                    <Table.Td><Badge size="sm" color={v.tipo === 'propio' ? 'blue' : v.tipo === 'visita' ? 'yellow' : 'orange'} variant="light">{TIPOS_VEHICULO.find(t => t.value === v.tipo)?.label || v.tipo}</Badge></Table.Td>
                    <Table.Td>
                      {v.desinfeccion_si_no ? (
                        <Badge color="green" size="sm">Sí</Badge>
                      ) : (
                        <Badge color="red" size="sm">No</Badge>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
                {vehiculos.length === 0 && (
                  <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin vehículos registrados</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={vOpened} onClose={closeV} title="Registrar Visita" size="lg">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select label="Finca" data={fincas.map(f => ({ value: f.id.toString(), label: f.nombre }))} value={formVisita.finca_id} onChange={v => setFormVisita({ ...formVisita, finca_id: v })} required />
          <TextInput label="Nombre *" value={formVisita.nombre} onChange={e => setFormVisita({ ...formVisita, nombre: e.target.value })} required />
          <TextInput label="Identificación" value={formVisita.identificacion} onChange={e => setFormVisita({ ...formVisita, identificacion: e.target.value })} />
          <TextInput label="Empresa" value={formVisita.empresa} onChange={e => setFormVisita({ ...formVisita, empresa: e.target.value })} />
          <Select label="Motivo" data={MOTIVOS.map(m => ({ value: m.value, label: m.label }))} value={formVisita.motivo} onChange={v => setFormVisita({ ...formVisita, motivo: v })} />
          <TextInput label="Fecha Ingreso *" type="datetime-local" value={formVisita.fecha_ingreso} onChange={e => setFormVisita({ ...formVisita, fecha_ingreso: e.target.value })} required />
          <TextInput label="Fecha Salida" type="datetime-local" value={formVisita.fecha_salida} onChange={e => setFormVisita({ ...formVisita, fecha_salida: e.target.value })} />
          <TextInput label="Firma (base64)" value={formVisita.firma} onChange={e => setFormVisita({ ...formVisita, firma: e.target.value })} />
        </SimpleGrid>
        <Textarea label="Áreas Visitadas" value={formVisita.areas_visitadas} onChange={e => setFormVisita({ ...formVisita, areas_visitadas: e.target.value })} mt="sm" />
        <Textarea label="Observaciones" value={formVisita.observaciones} onChange={e => setFormVisita({ ...formVisita, observaciones: e.target.value })} mt="sm" />
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={closeV}>Cancelar</Button>
          <Button onClick={handleSubmitVisita}>Guardar</Button>
        </Group>
      </Modal>

      <Modal opened={salidaOpened} onClose={closeSalida} title="Registrar Salida" size="md">
        <Text size="sm" mb="md">Visitante: <strong>{selectedVisita?.nombre}</strong></Text>
        <Stack>
          <TextInput label="Fecha Salida *" type="datetime-local" value={salidaForm.fecha_salida} onChange={e => setSalidaForm({ ...salidaForm, fecha_salida: e.target.value })} required />
          <Textarea label="Observaciones" value={salidaForm.observaciones} onChange={e => setSalidaForm({ ...salidaForm, observaciones: e.target.value })} />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeSalida}>Cancelar</Button>
            <Button onClick={handleRegistrarSalida} color="green">Registrar Salida</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={dOpened} onClose={closeD} title="Nueva Desinfección" size="md">
        <Stack>
          <Select label="Finca" data={fincas.map(f => ({ value: f.id.toString(), label: f.nombre }))} value={formDesinfeccion.finca_id} onChange={v => setFormDesinfeccion({ ...formDesinfeccion, finca_id: v })} required />
          <TextInput label="Fecha" type="date" value={formDesinfeccion.fecha} onChange={e => setFormDesinfeccion({ ...formDesinfeccion, fecha: e.target.value })} required />
          <Select label="Área" data={AREAS_DESINF.map(a => ({ value: a.value, label: a.label }))} value={formDesinfeccion.area} onChange={v => setFormDesinfeccion({ ...formDesinfeccion, area: v })} />
          <Select label="Tipo" data={TIPOS_DESINF.map(t => ({ value: t.value, label: t.label }))} value={formDesinfeccion.tipo} onChange={v => setFormDesinfeccion({ ...formDesinfeccion, tipo: v })} />
          <TextInput label="Producto" value={formDesinfeccion.producto} onChange={e => setFormDesinfeccion({ ...formDesinfeccion, producto: e.target.value })} />
          <TextInput label="Concentración" value={formDesinfeccion.concentracion} onChange={e => setFormDesinfeccion({ ...formDesinfeccion, concentracion: e.target.value })} />
          <TextInput label="Responsable" value={formDesinfeccion.responsable} onChange={e => setFormDesinfeccion({ ...formDesinfeccion, responsable: e.target.value })} />
          <Textarea label="Observaciones" value={formDesinfeccion.observaciones} onChange={e => setFormDesinfeccion({ ...formDesinfeccion, observaciones: e.target.value })} />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeD}>Cancelar</Button>
            <Button onClick={handleSubmitDesinfeccion}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={vehOpened} onClose={closeVeh} title="Registrar Vehículo" size="md">
        <Stack>
          <Select label="Finca" data={fincas.map(f => ({ value: f.id.toString(), label: f.nombre }))} value={formVehiculo.finca_id} onChange={v => setFormVehiculo({ ...formVehiculo, finca_id: v })} required />
          <TextInput label="Placa *" value={formVehiculo.placa} onChange={e => setFormVehiculo({ ...formVehiculo, placa: e.target.value })} required />
          <TextInput label="Conductor" value={formVehiculo.conductor} onChange={e => setFormVehiculo({ ...formVehiculo, conductor: e.target.value })} />
          <TextInput label="Empresa" value={formVehiculo.empresa} onChange={e => setFormVehiculo({ ...formVehiculo, empresa: e.target.value })} />
          <TextInput label="Fecha" type="date" value={formVehiculo.fecha} onChange={e => setFormVehiculo({ ...formVehiculo, fecha: e.target.value })} required />
          <Select label="Tipo" data={TIPOS_VEHICULO.map(t => ({ value: t.value, label: t.label }))} value={formVehiculo.tipo} onChange={v => setFormVehiculo({ ...formVehiculo, tipo: v })} />
          <Select
            label="Desinfección"
            data={[{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }]}
            value={formVehiculo.desinfeccion_si_no === true || formVehiculo.desinfeccion_si_no === 'true' ? 'true' : 'false'}
            onChange={v => setFormVehiculo({ ...formVehiculo, desinfeccion_si_no: v === 'true' })}
          />
          <Textarea label="Observaciones" value={formVehiculo.observaciones} onChange={e => setFormVehiculo({ ...formVehiculo, observaciones: e.target.value })} />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeVeh}>Cancelar</Button>
            <Button onClick={handleSubmitVehiculo}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
