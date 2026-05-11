import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, Stack, SimpleGrid, Text, Tabs, Textarea, ActionIcon,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconAlertTriangle, IconSchool, IconShield, IconEdit, IconTrash } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatCOP } from '../config.js'

export default function SST() {
  const [incidentes, setIncidentes] = useState([])
  const [capacitaciones, setCapacitaciones] = useState([])
  const [epps, setEpps] = useState([])
  const [personal, setPersonal] = useState([])

  const [inciModal, { open: openInci, close: closeInci }] = useDisclosure(false)
  const [capModal, { open: openCap, close: closeCap }] = useDisclosure(false)
  const [eppModal, { open: openEpp, close: closeEpp }] = useDisclosure(false)

  const [inciForm, setInciForm] = useState({
    fecha: new Date().toISOString().split('T')[0], tipo: 'accidente',
    empleado_id: '', descripcion: '', gravedad: 'leve', estado: 'reportado',
  })
  const [capForm, setCapForm] = useState({
    fecha: new Date().toISOString().split('T')[0], tema: '',
    empleado_id: '', instructor: '', duracion_horas: '', estado: 'pendiente',
  })
  const [eppForm, setEppForm] = useState({
    empleado_id: '', tipo: '', talla: '', fecha_entrega: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '', estado: 'entregado',
  })

  const loadData = () => {
    api.get('/personal/').then(r => setPersonal(r.data)).catch(() => {
      console.log('Mock GET /api/personal/')
      setPersonal([])
    })
    console.log('Mock GET /api/sst/incidentes')
    setIncidentes([])
    console.log('Mock GET /api/sst/capacitaciones')
    setCapacitaciones([])
    console.log('Mock GET /api/sst/epp')
    setEpps([])
  }
  useEffect(loadData, [])

  const getEmpleadoLabel = (id) => {
    const e = personal.find(p => p.id === id)
    return e ? `${e.nombre || ''} ${e.apellido || ''}`.trim() : `#${id}`
  }

  const handleInciSubmit = async () => {
    console.log('Mock POST /api/sst/incidentes', inciForm)
    notifications.show({ title: 'Incidente registrado (mock)', color: 'green' })
    closeInci()
    loadData()
  }

  const handleCapSubmit = async () => {
    console.log('Mock POST /api/sst/capacitaciones', capForm)
    notifications.show({ title: 'Capacitación registrada (mock)', color: 'green' })
    closeCap()
    loadData()
  }

  const handleEppSubmit = async () => {
    console.log('Mock POST /api/sst/epp', eppForm)
    notifications.show({ title: 'EPP registrado (mock)', color: 'green' })
    closeEpp()
    loadData()
  }

  const gravedadColors = { leve: 'yellow', moderado: 'orange', grave: 'red', fatal: 'dark' }
  const estadoInciColors = { reportado: 'blue', investigando: 'violet', cerrado: 'green' }

  const incidentesMes = incidentes.filter(i => {
    if (!i.fecha) return false
    const f = new Date(i.fecha)
    const now = new Date()
    return f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear()
  }).length

  const capPendientes = capacitaciones.filter(c => c.estado === 'pendiente').length

  const eppPorVencer = epps.filter(e => {
    if (!e.fecha_vencimiento) return false
    const fv = new Date(e.fecha_vencimiento)
    const diff = (fv - new Date()) / (1000 * 60 * 60 * 24)
    return diff <= 30 && diff >= 0
  }).length

  return (
    <Stack>
      <Title order={3}>Seguridad y Salud en el Trabajo</Title>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Paper withBorder p="md">
          <Group><IconAlertTriangle size={18} color="orange" /><Text size="xs" c="dimmed">Incidentes del Mes</Text></Group>
          <Text fw={700} size="xl">{incidentesMes}</Text>
        </Paper>
        <Paper withBorder p="md">
          <Group><IconSchool size={18} color="blue" /><Text size="xs" c="dimmed">Capacitaciones Pendientes</Text></Group>
          <Text fw={700} size="xl" c={capPendientes > 0 ? 'orange' : undefined}>{capPendientes}</Text>
        </Paper>
        <Paper withBorder p="md">
          <Group><IconShield size={18} color="red" /><Text size="xs" c="dimmed">EPP por Vencer</Text></Group>
          <Text fw={700} size="xl" c={eppPorVencer > 0 ? 'red' : undefined}>{eppPorVencer}</Text>
        </Paper>
      </SimpleGrid>

      <Tabs defaultValue="incidentes">
        <Tabs.List>
          <Tabs.Tab value="incidentes" leftSection={<IconAlertTriangle size={16} />}>Incidentes ({incidentes.length})</Tabs.Tab>
          <Tabs.Tab value="capacitaciones" leftSection={<IconSchool size={16} />}>Capacitaciones ({capacitaciones.length})</Tabs.Tab>
          <Tabs.Tab value="epp" leftSection={<IconShield size={16} />}>EPP ({epps.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="incidentes" pt="md">
          <Group mb="md">
            <Button leftSection={<IconPlus size={16} />} onClick={() => { setInciForm({ fecha: new Date().toISOString().split('T')[0], tipo: 'accidente', empleado_id: '', descripcion: '', gravedad: 'leve', estado: 'reportado' }); openInci() }}>
              Nuevo Incidente
            </Button>
          </Group>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Empleado</Table.Th>
                  <Table.Th>Descripción</Table.Th>
                  <Table.Th>Gravedad</Table.Th>
                  <Table.Th>Estado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {incidentes.map((i) => (
                  <Table.Tr key={i.id}>
                    <Table.Td>{i.fecha}</Table.Td>
                    <Table.Td><Badge size="sm">{i.tipo}</Badge></Table.Td>
                    <Table.Td>{getEmpleadoLabel(i.empleado_id)}</Table.Td>
                    <Table.Td>{i.descripcion || '-'}</Table.Td>
                    <Table.Td><Badge color={gravedadColors[i.gravedad] || 'gray'} size="sm">{i.gravedad}</Badge></Table.Td>
                    <Table.Td><Badge color={estadoInciColors[i.estado] || 'gray'} size="sm">{i.estado}</Badge></Table.Td>
                  </Table.Tr>
                ))}
                {incidentes.length === 0 && <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin incidentes registrados</Text></Table.Td></Table.Tr>}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="capacitaciones" pt="md">
          <Group mb="md">
            <Button leftSection={<IconPlus size={16} />} onClick={() => { setCapForm({ fecha: new Date().toISOString().split('T')[0], tema: '', empleado_id: '', instructor: '', duracion_horas: '', estado: 'pendiente' }); openCap() }}>
              Nueva Capacitación
            </Button>
          </Group>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Tema</Table.Th>
                  <Table.Th>Empleado</Table.Th>
                  <Table.Th>Instructor</Table.Th>
                  <Table.Th>Duración</Table.Th>
                  <Table.Th>Estado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {capacitaciones.map((c) => (
                  <Table.Tr key={c.id}>
                    <Table.Td>{c.fecha}</Table.Td>
                    <Table.Td fw={500}>{c.tema}</Table.Td>
                    <Table.Td>{getEmpleadoLabel(c.empleado_id)}</Table.Td>
                    <Table.Td>{c.instructor || '-'}</Table.Td>
                    <Table.Td>{c.duracion_horas ? `${c.duracion_horas}h` : '-'}</Table.Td>
                    <Table.Td>
                      <Badge color={c.estado === 'realizada' ? 'green' : c.estado === 'pendiente' ? 'yellow' : 'gray'} size="sm">{c.estado}</Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {capacitaciones.length === 0 && <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin capacitaciones registradas</Text></Table.Td></Table.Tr>}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="epp" pt="md">
          <Group mb="md">
            <Button leftSection={<IconPlus size={16} />} onClick={() => { setEppForm({ empleado_id: '', tipo: '', talla: '', fecha_entrega: new Date().toISOString().split('T')[0], fecha_vencimiento: '', estado: 'entregado' }); openEpp() }}>
              Nuevo EPP
            </Button>
          </Group>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Empleado</Table.Th>
                  <Table.Th>Tipo EPP</Table.Th>
                  <Table.Th>Talla</Table.Th>
                  <Table.Th>Fecha Entrega</Table.Th>
                  <Table.Th>Fecha Vencimiento</Table.Th>
                  <Table.Th>Estado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {epps.map((e) => {
                  const hoy = new Date()
                  const fv = e.fecha_vencimiento ? new Date(e.fecha_vencimiento) : null
                  const diff = fv ? Math.floor((fv - hoy) / (1000 * 60 * 60 * 24)) : null
                  const vencePronto = diff !== null && diff <= 30
                  return (
                    <Table.Tr key={e.id} bg={vencePronto ? 'red.0' : undefined}>
                      <Table.Td>{getEmpleadoLabel(e.empleado_id)}</Table.Td>
                      <Table.Td fw={500}>{e.tipo}</Table.Td>
                      <Table.Td>{e.talla || '-'}</Table.Td>
                      <Table.Td>{e.fecha_entrega}</Table.Td>
                      <Table.Td>
                        <Badge color={vencePronto ? 'red' : 'green'} size="sm">
                          {e.fecha_vencimiento || '-'}
                        </Badge>
                      </Table.Td>
                      <Table.Td><Badge color={e.estado === 'entregado' ? 'green' : 'gray'} size="sm">{e.estado}</Badge></Table.Td>
                    </Table.Tr>
                  )
                })}
                {epps.length === 0 && <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin EPP registrados</Text></Table.Td></Table.Tr>}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={inciModal} onClose={closeInci} title="Nuevo Incidente" size="md">
        <Stack>
          <SimpleGrid cols={2}>
            <TextInput label="Fecha *" type="date" value={inciForm.fecha} onChange={e => setInciForm({ ...inciForm, fecha: e.target.value })} required />
            <Select label="Tipo" data={[
              { value: 'accidente', label: 'Accidente' },
              { value: 'incidente', label: 'Incidente' },
              { value: 'cuasi-accidente', label: 'Cuasi-accidente' },
              { value: 'enfermedad', label: 'Enfermedad Laboral' },
            ]} value={inciForm.tipo} onChange={v => setInciForm({ ...inciForm, tipo: v })} />
          </SimpleGrid>
          <Select label="Empleado *" data={personal.map(p => ({ value: p.id.toString(), label: `${p.nombre || ''} ${p.apellido || ''}`.trim() }))} value={inciForm.empleado_id} onChange={v => setInciForm({ ...inciForm, empleado_id: v })} searchable required />
          <Textarea label="Descripción" value={inciForm.descripcion} onChange={e => setInciForm({ ...inciForm, descripcion: e.target.value })} minRows={3} />
          <SimpleGrid cols={2}>
            <Select label="Gravedad" data={[
              { value: 'leve', label: 'Leve' },
              { value: 'moderado', label: 'Moderado' },
              { value: 'grave', label: 'Grave' },
              { value: 'fatal', label: 'Fatal' },
            ]} value={inciForm.gravedad} onChange={v => setInciForm({ ...inciForm, gravedad: v })} />
            <Select label="Estado" data={[
              { value: 'reportado', label: 'Reportado' },
              { value: 'investigando', label: 'Investigando' },
              { value: 'cerrado', label: 'Cerrado' },
            ]} value={inciForm.estado} onChange={v => setInciForm({ ...inciForm, estado: v })} />
          </SimpleGrid>
          <Group justify="flex-end"><Button variant="default" onClick={closeInci}>Cancelar</Button><Button onClick={handleInciSubmit}>Guardar</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={capModal} onClose={closeCap} title="Nueva Capacitación" size="md">
        <Stack>
          <SimpleGrid cols={2}>
            <TextInput label="Fecha *" type="date" value={capForm.fecha} onChange={e => setCapForm({ ...capForm, fecha: e.target.value })} required />
            <TextInput label="Tema *" value={capForm.tema} onChange={e => setCapForm({ ...capForm, tema: e.target.value })} required />
          </SimpleGrid>
          <Select label="Empleado *" data={personal.map(p => ({ value: p.id.toString(), label: `${p.nombre || ''} ${p.apellido || ''}`.trim() }))} value={capForm.empleado_id} onChange={v => setCapForm({ ...capForm, empleado_id: v })} searchable required />
          <SimpleGrid cols={2}>
            <TextInput label="Instructor" value={capForm.instructor} onChange={e => setCapForm({ ...capForm, instructor: e.target.value })} />
            <NumberInput label="Duración (horas)" value={capForm.duracion_horas} onChange={v => setCapForm({ ...capForm, duracion_horas: v })} min={0} />
          </SimpleGrid>
          <Select label="Estado" data={[
            { value: 'pendiente', label: 'Pendiente' },
            { value: 'realizada', label: 'Realizada' },
            { value: 'cancelada', label: 'Cancelada' },
          ]} value={capForm.estado} onChange={v => setCapForm({ ...capForm, estado: v })} />
          <Group justify="flex-end"><Button variant="default" onClick={closeCap}>Cancelar</Button><Button onClick={handleCapSubmit}>Guardar</Button></Group>
        </Stack>
      </Modal>

      <Modal opened={eppModal} onClose={closeEpp} title="Nuevo EPP" size="md">
        <Stack>
          <Select label="Empleado *" data={personal.map(p => ({ value: p.id.toString(), label: `${p.nombre || ''} ${p.apellido || ''}`.trim() }))} value={eppForm.empleado_id} onChange={v => setEppForm({ ...eppForm, empleado_id: v })} searchable required />
          <SimpleGrid cols={2}>
            <Select label="Tipo EPP" data={[
              { value: 'casco', label: 'Casco' },
              { value: 'guantes', label: 'Guantes' },
              { value: 'botas', label: 'Botas' },
              { value: 'gafas', label: 'Gafas' },
              { value: 'respirador', label: 'Respirador' },
              { value: 'arnes', label: 'Arnés' },
              { value: 'protector_auditivo', label: 'Protector Auditivo' },
              { value: 'overol', label: 'Overol' },
              { value: 'otros', label: 'Otros' },
            ]} value={eppForm.tipo} onChange={v => setEppForm({ ...eppForm, tipo: v })} />
            <TextInput label="Talla" value={eppForm.talla} onChange={e => setEppForm({ ...eppForm, talla: e.target.value })} />
          </SimpleGrid>
          <SimpleGrid cols={2}>
            <TextInput label="Fecha Entrega *" type="date" value={eppForm.fecha_entrega} onChange={e => setEppForm({ ...eppForm, fecha_entrega: e.target.value })} required />
            <TextInput label="Fecha Vencimiento" type="date" value={eppForm.fecha_vencimiento} onChange={e => setEppForm({ ...eppForm, fecha_vencimiento: e.target.value })} />
          </SimpleGrid>
          <Group justify="flex-end"><Button variant="default" onClick={closeEpp}>Cancelar</Button><Button onClick={handleEppSubmit}>Guardar</Button></Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
