import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput, Select,
  Badge, ActionIcon, Stack, SimpleGrid, Text, Card, Tabs, Textarea,
  Timeline,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPlus, IconEdit, IconCertificate, IconAlertTriangle,
  IconSearch, IconCalendarDue, IconCheck, IconX,
} from '@tabler/icons-react'
import api from '../services/api.js'

const TIPOS_CERT = [
  { value: 'BPA', label: 'BPA', color: 'green' },
  { value: 'BPG', label: 'BPG', color: 'blue' },
  { value: 'organico', label: 'Orgánico', color: 'teal' },
  { value: 'GlobalGAP', label: 'GlobalGAP', color: 'violet' },
  { value: 'comercio_justo', label: 'Comercio Justo', color: 'orange' },
  { value: 'ICA', label: 'ICA', color: 'red' },
  { value: 'otro', label: 'Otro', color: 'gray' },
]

const ALCANCES = [
  { value: 'produccion', label: 'Producción' },
  { value: 'procesamiento', label: 'Procesamiento' },
  { value: 'comercializacion', label: 'Comercialización' },
  { value: 'toda_finca', label: 'Toda la Finca' },
]

const ESTADOS_CERT = [
  { value: 'activa', label: 'Activa', color: 'green' },
  { value: 'vencida', label: 'Vencida', color: 'red' },
  { value: 'en_proceso', label: 'En Proceso', color: 'blue' },
  { value: 'suspendida', label: 'Suspendida', color: 'orange' },
]

const TIPOS_NC = [
  { value: 'critica', label: 'Crítica', color: 'red' },
  { value: 'mayor', label: 'Mayor', color: 'orange' },
  { value: 'menor', label: 'Menor', color: 'yellow' },
]

const ESTADOS_NC = [
  { value: 'abierta', label: 'Abierta', color: 'red' },
  { value: 'en_correccion', label: 'En Corrección', color: 'blue' },
  { value: 'cerrada', label: 'Cerrada', color: 'green' },
]

const defaultCert = {
  finca_id: '', nombre: '', tipo: 'BPA', entidad_certificadora: '',
  fecha_emision: '', fecha_vencimiento: '', alcance: 'produccion',
  estado: 'activa', observaciones: '', archivo_url: '',
}

const defaultNC = {
  certificacion_id: '', fecha: new Date().toISOString().split('T')[0],
  descripcion: '', tipo: 'menor', estado: 'abierta',
  fecha_cierre: '', acciones_correctivas: '',
}

export default function Certificaciones() {
  const [certificaciones, setCertificaciones] = useState([])
  const [noConformidades, setNoConformidades] = useState([])
  const [alertas, setAlertas] = useState([])
  const [fincas, setFincas] = useState([])
  const [tab, setTab] = useState('certificaciones')
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const [cOpened, { open: openC, close: closeC }] = useDisclosure(false)
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const [ncOpened, { open: openNC, close: closeNC }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [formCert, setFormCert] = useState({ ...defaultCert })
  const [formNC, setFormNC] = useState({ ...defaultNC })
  const [selectedCert, setSelectedCert] = useState(null)

  const loadData = () => {
    api.get('/certificaciones/').then(r => setCertificaciones(r.data)).catch(() => {})
    api.get('/certificaciones/no-conformidades/').then(r => setNoConformidades(r.data)).catch(() => {})
    api.get('/certificaciones/alertas').then(r => setAlertas(r.data)).catch(() => {})
    api.get('/lotes/fincas/').then(r => setFincas(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }
  useEffect(loadData, [])

  const hoy = new Date()
  const activas = certificaciones.filter(c => c.estado === 'activa').length
  const proximasVencer = alertas.filter(a => a.dias_restantes <= 30 && a.dias_restantes >= 0).length
  const ncAbiertas = noConformidades.filter(n => n.estado !== 'cerrada').length
  const cumplimiento = certificaciones.length > 0
    ? Math.round((activas / certificaciones.length) * 100)
    : 100

  const filtered = certificaciones.filter(c => {
    if (search && !c.nombre?.toLowerCase().includes(search.toLowerCase())) return false
    if (filtroEstado && c.estado !== filtroEstado) return false
    return true
  })

  const getTipoBadge = (t) => {
    const found = TIPOS_CERT.find(x => x.value === t)
    return found ? <Badge color={found.color} size="sm" variant="light">{found.label}</Badge> : <Badge size="sm">{t}</Badge>
  }

  const getEstadoBadge = (e, vencimiento) => {
    const found = ESTADOS_CERT.find(x => x.value === e)
    if (e === 'activa' && vencimiento) {
      const venc = new Date(vencimiento)
      const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
      if (diff < 0) return <Badge color="red" size="sm">Vencida</Badge>
      if (diff <= 30) return <Badge color="orange" size="sm">Próximo a vencer</Badge>
    }
    return found ? <Badge color={found.color} size="sm">{found.label}</Badge> : <Badge size="sm">{e}</Badge>
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formCert,
        finca_id: parseInt(formCert.finca_id) || fincas[0]?.id,
      }
      if (editando) await api.put(`/certificaciones/${editando}`, payload)
      else await api.post('/certificaciones/', payload)
      notifications.show({ title: editando ? 'Certificación actualizada' : 'Certificación creada', color: 'green' })
      closeC(); setEditando(null); setFormCert({ ...defaultCert }); loadData()
    } catch { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const openEditCert = (c) => {
    setEditando(c.id)
    setFormCert({
      finca_id: c.finca_id?.toString() || '',
      nombre: c.nombre || '', tipo: c.tipo || 'BPA',
      entidad_certificadora: c.entidad_certificadora || '',
      fecha_emision: c.fecha_emision || '',
      fecha_vencimiento: c.fecha_vencimiento || '',
      alcance: c.alcance || 'produccion', estado: c.estado || 'activa',
      observaciones: c.observaciones || '', archivo_url: c.archivo_url || '',
    })
    openEdit()
  }

  const handleSubmitNC = async () => {
    try {
      const payload = {
        ...formNC,
        certificacion_id: selectedCert?.id || parseInt(formNC.certificacion_id),
        fecha_cierre: formNC.fecha_cierre || null,
      }
      await api.post('/certificaciones/no-conformidades/', payload)
      notifications.show({ title: 'No conformidad registrada', color: 'green' })
      closeNC(); setFormNC({ ...defaultNC }); loadData()
    } catch { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const getNcTipoBadge = (t) => {
    const found = TIPOS_NC.find(x => x.value === t)
    return found ? <Badge color={found.color} size="sm">{found.label}</Badge> : <Badge size="sm">{t}</Badge>
  }

  const getNcEstadoBadge = (e) => {
    const found = ESTADOS_NC.find(x => x.value === e)
    return found ? <Badge color={found.color} size="sm" variant="light">{found.label}</Badge> : <Badge size="sm">{e}</Badge>
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Certificaciones</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setFormCert({ ...defaultCert }); openC() }}>Nueva Certificación</Button>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <Card withBorder padding="md" radius="md" style={{ borderLeft: '4px solid var(--mantine-color-green-6)' }}>
          <Text size="xs" c="dimmed">Certificaciones Activas</Text>
          <Text fw={700} size="xl" c="green.6">{activas}</Text>
        </Card>
        <Card withBorder padding="md" radius="md" style={{ borderLeft: `4px solid var(--mantine-color-${proximasVencer > 0 ? 'red' : 'gray'}-6)` }}>
          <Text size="xs" c="dimmed">Próximas a Vencer</Text>
          <Text fw={700} size="xl" c={proximasVencer > 0 ? 'red.6' : undefined}>{proximasVencer}</Text>
        </Card>
        <Card withBorder padding="md" radius="md" style={{ borderLeft: `4px solid var(--mantine-color-${ncAbiertas > 0 ? 'orange' : 'gray'}-6)` }}>
          <Text size="xs" c="dimmed">No Conformidades Abiertas</Text>
          <Text fw={700} size="xl" c={ncAbiertas > 0 ? 'orange.6' : undefined}>{ncAbiertas}</Text>
        </Card>
        <Card withBorder padding="md" radius="md">
          <Text size="xs" c="dimmed">% Cumplimiento</Text>
          <Text fw={700} size="xl">{cumplimiento}%</Text>
        </Card>
      </SimpleGrid>

      {alertas.length > 0 && (
        <Paper withBorder p="sm">
          <Group mb="xs">
            <IconAlertTriangle size={20} color="var(--mantine-color-orange-6)" />
            <Text fw={600} size="sm">Alertas de Vencimiento</Text>
          </Group>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Certificación</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Entidad</Table.Th>
                <Table.Th>Vence</Table.Th>
                <Table.Th>Estado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {alertas.map(a => {
                const critica = a.dias_restantes <= 30
                return (
                  <Table.Tr key={a.id}>
                    <Table.Td fw={500} c={critica ? 'red' : 'orange'}>{a.nombre}</Table.Td>
                    <Table.Td>{getTipoBadge(a.tipo)}</Table.Td>
                    <Table.Td>{a.entidad_certificadora || '-'}</Table.Td>
                    <Table.Td>{a.fecha_vencimiento || '-'}</Table.Td>
                    <Table.Td>
                      <Badge color={critica ? 'red' : 'orange'} size="sm">
                        {critica ? `${a.dias_restantes} días (crítico)` : `${a.dias_restantes} días`}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="certificaciones" leftSection={<IconCertificate size={16} />}>Certificaciones</Tabs.Tab>
          <Tabs.Tab value="no-conformidades" leftSection={<IconX size={16} />}>No Conformidades</Tabs.Tab>
          <Tabs.Tab value="timeline" leftSection={<IconCalendarDue size={16} />}>Línea de Tiempo</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="certificaciones" pt="sm">
          <Group mb="sm">
            <TextInput
              placeholder="Buscar certificación..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, maxWidth: 400 }}
            />
            <Select
              placeholder="Estado"
              data={ESTADOS_CERT.map(e => ({ value: e.value, label: e.label }))}
              value={filtroEstado}
              onChange={v => setFiltroEstado(v || '')}
              clearable
              w={180}
            />
          </Group>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nombre</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Entidad</Table.Th>
                  <Table.Th>Emisión</Table.Th>
                  <Table.Th>Vencimiento</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th style={{ width: 160 }}>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map(c => (
                  <Table.Tr key={c.id}>
                    <Table.Td fw={500}>{c.nombre}</Table.Td>
                    <Table.Td>{getTipoBadge(c.tipo)}</Table.Td>
                    <Table.Td>{c.entidad_certificadora || '-'}</Table.Td>
                    <Table.Td>{c.fecha_emision || '-'}</Table.Td>
                    <Table.Td>
                      <Text c={c.fecha_vencimiento && new Date(c.fecha_vencimiento) < hoy ? 'red' : undefined} fw={c.fecha_vencimiento && new Date(c.fecha_vencimiento) < hoy ? 600 : undefined}>
                        {c.fecha_vencimiento || '-'}
                      </Text>
                    </Table.Td>
                    <Table.Td>{getEstadoBadge(c.estado, c.fecha_vencimiento)}</Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon variant="light" color="blue" size="sm" onClick={() => openEditCert(c)}><IconEdit size={14} /></ActionIcon>
                        <ActionIcon variant="light" color="red" size="sm" onClick={() => { setSelectedCert(c); setFormNC({ ...defaultNC, certificacion_id: c.id }); openNC() }}>
                          <IconX size={14} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {filtered.length === 0 && (
                  <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center">Sin certificaciones registradas</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="no-conformidades" pt="sm">
          <Group justify="space-between" mb="sm">
            <Text size="sm" c="dimmed">{noConformidades.length} registros</Text>
            <Button leftSection={<IconPlus size={16} />} onClick={() => { setSelectedCert(null); setFormNC({ ...defaultNC }); openNC() }}>
              Registrar No Conformidad
            </Button>
          </Group>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Descripción</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Fecha Cierre</Table.Th>
                  <Table.Th>Acciones Correctivas</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {noConformidades.map(n => (
                  <Table.Tr key={n.id}>
                    <Table.Td>{n.fecha}</Table.Td>
                    <Table.Td><Text size="sm" lineClamp={2}>{n.descripcion}</Text></Table.Td>
                    <Table.Td>{getNcTipoBadge(n.tipo)}</Table.Td>
                    <Table.Td>{getNcEstadoBadge(n.estado)}</Table.Td>
                    <Table.Td>{n.fecha_cierre || '-'}</Table.Td>
                    <Table.Td><Text size="sm" lineClamp={2}>{n.acciones_correctivas || '-'}</Text></Table.Td>
                  </Table.Tr>
                ))}
                {noConformidades.length === 0 && (
                  <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin no conformidades registradas</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="timeline" pt="sm">
          <Paper withBorder p="md">
            {certificaciones.length > 0 ? (
              <Timeline active={certificaciones.length - 1} bulletSize={24} lineWidth={2}>
                {certificaciones.map(c => (
                  <Timeline.Item
                    key={c.id}
                    title={c.nombre}
                    bullet={<IconCertificate size={12} />}
                  >
                    <Text c="dimmed" size="sm">
                      {getTipoBadge(c.tipo)} - {c.entidad_certificadora || 'Entidad no especificada'}
                    </Text>
                    <Text size="xs" mt={4}>
                      Emitida: {c.fecha_emision || '-'}
                      {c.fecha_vencimiento ? ` | Vence: ${c.fecha_vencimiento}` : ''}
                    </Text>
                    <Group mt="xs">
                      {getEstadoBadge(c.estado, c.fecha_vencimiento)}
                    </Group>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Text c="dimmed" ta="center">Sin certificaciones para mostrar</Text>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={cOpened} onClose={closeC} title="Nueva Certificación" size="lg">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select label="Finca" data={fincas.map(f => ({ value: f.id.toString(), label: f.nombre }))} value={formCert.finca_id} onChange={v => setFormCert({ ...formCert, finca_id: v })} required />
          <TextInput label="Nombre *" value={formCert.nombre} onChange={e => setFormCert({ ...formCert, nombre: e.target.value })} required />
          <Select label="Tipo" data={TIPOS_CERT.map(t => ({ value: t.value, label: t.label }))} value={formCert.tipo} onChange={v => setFormCert({ ...formCert, tipo: v })} />
          <TextInput label="Entidad Certificadora" value={formCert.entidad_certificadora} onChange={e => setFormCert({ ...formCert, entidad_certificadora: e.target.value })} />
          <TextInput label="Fecha Emisión *" type="date" value={formCert.fecha_emision} onChange={e => setFormCert({ ...formCert, fecha_emision: e.target.value })} required />
          <TextInput label="Fecha Vencimiento" type="date" value={formCert.fecha_vencimiento} onChange={e => setFormCert({ ...formCert, fecha_vencimiento: e.target.value })} />
          <Select label="Alcance" data={ALCANCES.map(a => ({ value: a.value, label: a.label }))} value={formCert.alcance} onChange={v => setFormCert({ ...formCert, alcance: v })} />
          <Select label="Estado" data={ESTADOS_CERT.map(e => ({ value: e.value, label: e.label }))} value={formCert.estado} onChange={v => setFormCert({ ...formCert, estado: v })} />
          <TextInput label="URL Archivo" value={formCert.archivo_url} onChange={e => setFormCert({ ...formCert, archivo_url: e.target.value })} />
        </SimpleGrid>
        <Textarea label="Observaciones" value={formCert.observaciones} onChange={e => setFormCert({ ...formCert, observaciones: e.target.value })} mt="sm" />
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={closeC}>Cancelar</Button>
          <Button onClick={handleSubmit}>Crear</Button>
        </Group>
      </Modal>

      <Modal opened={editOpened} onClose={closeEdit} title="Editar Certificación" size="lg">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select label="Finca" data={fincas.map(f => ({ value: f.id.toString(), label: f.nombre }))} value={formCert.finca_id} onChange={v => setFormCert({ ...formCert, finca_id: v })} required />
          <TextInput label="Nombre *" value={formCert.nombre} onChange={e => setFormCert({ ...formCert, nombre: e.target.value })} required />
          <Select label="Tipo" data={TIPOS_CERT.map(t => ({ value: t.value, label: t.label }))} value={formCert.tipo} onChange={v => setFormCert({ ...formCert, tipo: v })} />
          <TextInput label="Entidad Certificadora" value={formCert.entidad_certificadora} onChange={e => setFormCert({ ...formCert, entidad_certificadora: e.target.value })} />
          <TextInput label="Fecha Emisión" type="date" value={formCert.fecha_emision} onChange={e => setFormCert({ ...formCert, fecha_emision: e.target.value })} />
          <TextInput label="Fecha Vencimiento" type="date" value={formCert.fecha_vencimiento} onChange={e => setFormCert({ ...formCert, fecha_vencimiento: e.target.value })} />
          <Select label="Alcance" data={ALCANCES.map(a => ({ value: a.value, label: a.label }))} value={formCert.alcance} onChange={v => setFormCert({ ...formCert, alcance: v })} />
          <Select label="Estado" data={ESTADOS_CERT.map(e => ({ value: e.value, label: e.label }))} value={formCert.estado} onChange={v => setFormCert({ ...formCert, estado: v })} />
        </SimpleGrid>
        <Textarea label="Observaciones" value={formCert.observaciones} onChange={e => setFormCert({ ...formCert, observaciones: e.target.value })} mt="sm" />
        <TextInput label="URL Archivo" value={formCert.archivo_url} onChange={e => setFormCert({ ...formCert, archivo_url: e.target.value })} mt="sm" />
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={closeEdit}>Cancelar</Button>
          <Button onClick={handleSubmit}>Guardar</Button>
        </Group>
      </Modal>

      <Modal opened={ncOpened} onClose={closeNC} title="Registrar No Conformidad" size="md">
        <Stack>
          <Select
            label="Certificación"
            data={certificaciones.map(c => ({ value: c.id.toString(), label: c.nombre }))}
            value={formNC.certificacion_id?.toString() || (selectedCert?.id?.toString() || '')}
            onChange={v => setFormNC({ ...formNC, certificacion_id: v ? parseInt(v) : '' })}
            required
          />
          <TextInput label="Fecha" type="date" value={formNC.fecha} onChange={e => setFormNC({ ...formNC, fecha: e.target.value })} required />
          <Textarea label="Descripción *" value={formNC.descripcion} onChange={e => setFormNC({ ...formNC, descripcion: e.target.value })} required />
          <Select label="Tipo" data={TIPOS_NC.map(t => ({ value: t.value, label: t.label }))} value={formNC.tipo} onChange={v => setFormNC({ ...formNC, tipo: v })} />
          <Select label="Estado" data={ESTADOS_NC.map(e => ({ value: e.value, label: e.label }))} value={formNC.estado} onChange={v => setFormNC({ ...formNC, estado: v })} />
          <TextInput label="Fecha Cierre" type="date" value={formNC.fecha_cierre} onChange={e => setFormNC({ ...formNC, fecha_cierre: e.target.value })} />
          <Textarea label="Acciones Correctivas" value={formNC.acciones_correctivas} onChange={e => setFormNC({ ...formNC, acciones_correctivas: e.target.value })} />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeNC}>Cancelar</Button>
            <Button onClick={handleSubmitNC}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
