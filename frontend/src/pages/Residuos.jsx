import { useEffect, useState, useCallback } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  NumberInput, Badge, Stack, SimpleGrid, Text, ActionIcon,
  Tabs, Textarea, Select, Card, Progress,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconRecycle, IconPlant, IconPercentage, IconClock,
  IconPlus, IconEdit, IconTrash,
} from '@tabler/icons-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import dayjs from 'dayjs'
import api from '../services/api.js'

const TIPOS_RESIDUO = [
  { value: 'organico', label: 'Orgánico', color: 'green' },
  { value: 'plastico', label: 'Plástico', color: 'yellow' },
  { value: 'papel', label: 'Papel/Cartón', color: 'blue' },
  { value: 'quimico', label: 'Químico', color: 'red' },
  { value: 'vidrio', label: 'Vidrio', color: 'cyan' },
  { value: 'textil', label: 'Textil', color: 'grape' },
  { value: 'otro', label: 'Otro', color: 'gray' },
]

const ORIGENES = [
  { value: 'establo', label: 'Establo' },
  { value: 'galpon', label: 'Galpón' },
  { value: 'cosecha', label: 'Cosecha' },
  { value: 'cocina', label: 'Cocina' },
  { value: 'taller', label: 'Taller' },
  { value: 'otro', label: 'Otro' },
]

const DISPOSICIONES = [
  { value: 'compost', label: 'Compost', color: 'green' },
  { value: 'reciclaje', label: 'Reciclaje', color: 'blue' },
  { value: 'relleno', label: 'Relleno Sanitario', color: 'red' },
  { value: 'incineracion', label: 'Incinaración', color: 'orange' },
  { value: 'lombricultivo', label: 'Lombricultivo', color: 'teal' },
  { value: 'otro', label: 'Otro', color: 'gray' },
]

const ESTADOS_COMPOST = [
  { value: 'activo', label: 'Activo', color: 'blue' },
  { value: 'lista', label: 'Lista', color: 'teal' },
  { value: 'en_correccion', label: 'En Corrección', color: 'orange' },
  { value: 'finalizado', label: 'Finalizado', color: 'green' },
]

const COLORES_TIPO = {
  organico: '#4CAF50', plastico: '#FFC107', papel: '#2196F3',
  quimico: '#f44336', vidrio: '#00BCD4', textil: '#9C27B0', otro: '#9E9E9E',
}

export default function Residuos() {
  const [residuos, setResiduos] = useState([])
  const [compost, setCompost] = useState([])
  const [estadisticas, setEstadisticas] = useState(null)
  const [loading, setLoading] = useState(false)

  const [residuoModal, { open: openResiduo, close: closeResiduo }] = useDisclosure(false)
  const [compostModal, { open: openCompost, close: closeCompost }] = useDisclosure(false)

  const [residuoForm, setResiduoForm] = useState({
    tipo: 'organico', origen: 'establo', cantidad_kg: '',
    fecha: new Date().toISOString().split('T')[0], disposicion: 'compost', observaciones: '',
  })

  const [compostForm, setCompostForm] = useState({
    nombre: '', fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_estimada_fin: '', materiales: '[]', volumen_m3: '',
    temperatura: '', humedad: '', estado: 'activo', observaciones: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [rR, cR, sR] = await Promise.all([
        api.get('/residuos/'),
        api.get('/residuos/compost'),
        api.get('/residuos/estadisticas'),
      ])
      setResiduos(Array.isArray(rR.data) ? rR.data : [])
      setCompost(Array.isArray(cR.data) ? cR.data : [])
      setEstadisticas(sR.data)
    } catch { setResiduos([]); setCompost([]) }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSaveResiduo = async () => {
    if (!residuoForm.cantidad_kg) {
      notifications.show({ title: 'La cantidad es obligatoria', color: 'yellow' })
      return
    }
    try {
      await api.post('/residuos/', {
        ...residuoForm,
        cantidad_kg: parseFloat(residuoForm.cantidad_kg),
      })
      notifications.show({ title: 'Residuo registrado', color: 'green' })
      closeResiduo()
      setResiduoForm({
        tipo: 'organico', origen: 'establo', cantidad_kg: '',
        fecha: new Date().toISOString().split('T')[0], disposicion: 'compost', observaciones: '',
      })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleSaveCompost = async () => {
    if (!compostForm.nombre?.trim()) {
      notifications.show({ title: 'El nombre es obligatorio', color: 'yellow' })
      return
    }
    try {
      const payload = {
        ...compostForm,
        materiales: compostForm.materiales ? JSON.parse(compostForm.materiales) : [],
        volumen_m3: compostForm.volumen_m3 ? parseFloat(compostForm.volumen_m3) : null,
        temperatura: compostForm.temperatura ? parseFloat(compostForm.temperatura) : null,
        humedad: compostForm.humedad ? parseFloat(compostForm.humedad) : null,
      }
      await api.post('/residuos/compost', payload)
      notifications.show({ title: 'Lote de compost creado', color: 'green' })
      closeCompost()
      setCompostForm({
        nombre: '', fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_estimada_fin: '', materiales: '[]', volumen_m3: '',
        temperatura: '', humedad: '', estado: 'activo', observaciones: '',
      })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const residuosMes = residuos.filter(r => dayjs(r.fecha).isSame(dayjs(), 'month'))
  const totalKgMes = residuosMes.reduce((s, r) => s + (r.cantidad_kg || 0), 0)

  const pieData = TIPOS_RESIDUO.map(t => {
    const kg = residuosMes.filter(r => r.tipo === t.value).reduce((s, r) => s + (r.cantidad_kg || 0), 0)
    return { name: t.label, value: kg, color: COLORES_TIPO[t.value] || '#999' }
  }).filter(d => d.value > 0)

  const getEstadoProgress = (estado) => {
    const map = { activo: 25, lista: 50, en_correccion: 40, finalizado: 100 }
    const colors = { activo: 'blue', lista: 'teal', en_correccion: 'orange', finalizado: 'green' }
    return { value: map[estado] || 10, color: colors[estado] || 'gray' }
  }

  return (
    <Stack>
      <Title order={3}>Gestión de Residuos y Compost</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Paper p="md" radius="md" withBorder>
          <Group><IconTrash size={28} color="var(--mantine-color-red-6)" />
            <div><Text size="xs" c="dimmed">Total Residuos Mes</Text>
              <Text size="xl" fw={700}>{totalKgMes.toFixed(1)} kg</Text></div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconRecycle size={28} color="var(--mantine-color-green-6)" />
            <div><Text size="xs" c="dimmed">Compost Activo</Text>
              <Text size="xl" fw={700}>{estadisticas?.compost_activo ?? compost.filter(c => c.estado === 'activo' || c.estado === 'en_correccion').length}</Text></div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconPercentage size={28} color="var(--mantine-color-blue-6)" />
            <div><Text size="xs" c="dimmed">Tasa Reciclaje</Text>
              <Text size="xl" fw={700}>{estadisticas?.tasa_reciclaje_pct ?? 0}%</Text></div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconClock size={28} color="var(--mantine-color-grape-6)" />
            <div><Text size="xs" c="dimmed">Próximo Compost</Text>
              <Text size="xl" fw={700}>{estadisticas?.proximo_compost_listo ? dayjs(estadisticas.proximo_compost_listo).format('DD/MM') : 'N/A'}</Text></div>
          </Group>
        </Paper>
      </SimpleGrid>

      <Tabs defaultValue="residuos">
        <Tabs.List>
          <Tabs.Tab value="residuos" leftSection={<IconTrash size={16} />}>Residuos</Tabs.Tab>
          <Tabs.Tab value="compost" leftSection={<IconRecycle size={16} />}>Compost</Tabs.Tab>
          <Tabs.Tab value="estadisticas" leftSection={<IconPlant size={16} />}>Estadísticas</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="residuos" pt="md">
          <Stack>
            <Group justify="space-between">
              <Title order={4}>Registro de Residuos</Title>
              <Button leftSection={<IconPlus size={16} />} onClick={openResiduo}>Registrar Residuo</Button>
            </Group>
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Tipo</Table.Th>
                    <Table.Th>Origen</Table.Th>
                    <Table.Th>Cantidad (kg)</Table.Th>
                    <Table.Th>Disposición</Table.Th>
                    <Table.Th>Observaciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {residuos.map(r => {
                    const tipo = TIPOS_RESIDUO.find(t => t.value === r.tipo)
                    const disp = DISPOSICIONES.find(d => d.value === r.disposicion)
                    return (
                      <Table.Tr key={r.id}>
                        <Table.Td>{dayjs(r.fecha).format('DD/MM/YYYY')}</Table.Td>
                        <Table.Td><Badge color={tipo?.color || 'gray'} size="sm" variant="light">{tipo?.label || r.tipo}</Badge></Table.Td>
                        <Table.Td>{ORIGENES.find(o => o.value === r.origen)?.label || r.origen}</Table.Td>
                        <Table.Td fw={500}>{r.cantidad_kg}</Table.Td>
                        <Table.Td><Badge color={disp?.color || 'gray'} size="sm">{disp?.label || r.disposicion}</Badge></Table.Td>
                        <Table.Td><Text size="sm" lineClamp={1}>{r.observaciones || '-'}</Text></Table.Td>
                      </Table.Tr>
                    )
                  })}
                  {residuos.length === 0 && (
                    <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin residuos registrados</Text></Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="compost" pt="md">
          <Stack>
            <Group justify="space-between">
              <Title order={4}>Lotes de Compost</Title>
              <Button leftSection={<IconPlus size={16} />} onClick={openCompost}>Nuevo Compost</Button>
            </Group>
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Nombre</Table.Th>
                    <Table.Th>Inicio</Table.Th>
                    <Table.Th>Fin Estimado</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th>Volumen (m³)</Table.Th>
                    <Table.Th>Temperatura</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {compost.map(c => {
                    const est = ESTADOS_COMPOST.find(e => e.value === c.estado)
                    const prog = getEstadoProgress(c.estado)
                    return (
                      <Table.Tr key={c.id}>
                        <Table.Td fw={500}>{c.nombre}</Table.Td>
                        <Table.Td>{dayjs(c.fecha_inicio).format('DD/MM/YYYY')}</Table.Td>
                        <Table.Td>{c.fecha_estimada_fin ? dayjs(c.fecha_estimada_fin).format('DD/MM/YYYY') : '-'}</Table.Td>
                        <Table.Td>
                          <Stack gap={2}>
                            <Badge color={est?.color || 'gray'} size="sm">{est?.label || c.estado}</Badge>
                            <Progress value={prog.value} color={prog.color} size="xs" w={80} />
                          </Stack>
                        </Table.Td>
                        <Table.Td>{c.volumen_m3 != null ? c.volumen_m3 : '-'}</Table.Td>
                        <Table.Td>{c.temperatura != null ? `${c.temperatura}°C` : '-'}</Table.Td>
                      </Table.Tr>
                    )
                  })}
                  {compost.length === 0 && (
                    <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin lotes de compost</Text></Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="estadisticas" pt="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Card withBorder p="md">
              <Text fw={600} mb="sm">Residuos por Tipo</Text>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Text c="dimmed" ta="center" py="xl">Sin datos este mes</Text>
              )}
            </Card>
            <Card withBorder p="md">
              <Text fw={600} mb="sm">Progreso Compost</Text>
              <Stack gap="md">
                {compost.filter(c => c.estado !== 'finalizado').slice(0, 5).map(c => {
                  const est = ESTADOS_COMPOST.find(e => e.value === c.estado)
                  const prog = getEstadoProgress(c.estado)
                  return (
                    <div key={c.id}>
                      <Group justify="space-between" mb={4}>
                        <Text size="sm">{c.nombre}</Text>
                        <Badge color={est?.color || 'gray'} size="xs">{est?.label || c.estado}</Badge>
                      </Group>
                      <Progress value={prog.value} color={prog.color} size="md" />
                    </div>
                  )
                })}
                {compost.filter(c => c.estado !== 'finalizado').length === 0 && (
                  <Text c="dimmed" ta="center" py="xl">No hay compost activo</Text>
                )}
              </Stack>
            </Card>
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={residuoModal} onClose={closeResiduo} title="Registrar Residuo" size="md">
        <Stack>
          <Select label="Tipo *" data={TIPOS_RESIDUO.map(t => ({ value: t.value, label: t.label }))}
            value={residuoForm.tipo} onChange={v => setResiduoForm({ ...residuoForm, tipo: v || 'organico' })} />
          <Select label="Origen *" data={ORIGENES.map(o => ({ value: o.value, label: o.label }))}
            value={residuoForm.origen} onChange={v => setResiduoForm({ ...residuoForm, origen: v || 'establo' })} />
          <NumberInput label="Cantidad (kg) *" value={residuoForm.cantidad_kg ? parseFloat(residuoForm.cantidad_kg) : ''}
            onChange={v => setResiduoForm({ ...residuoForm, cantidad_kg: v?.toString() || '' })} min={0} decimalScale={2} required />
          <TextInput label="Fecha *" type="date" value={residuoForm.fecha} onChange={e => setResiduoForm({ ...residuoForm, fecha: e.target.value })} required />
          <Select label="Disposición *" data={DISPOSICIONES.map(d => ({ value: d.value, label: d.label }))}
            value={residuoForm.disposicion} onChange={v => setResiduoForm({ ...residuoForm, disposicion: v || 'compost' })} />
          <Textarea label="Observaciones" value={residuoForm.observaciones} onChange={e => setResiduoForm({ ...residuoForm, observaciones: e.target.value })} />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeResiduo}>Cancelar</Button>
            <Button onClick={handleSaveResiduo}>Registrar</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={compostModal} onClose={closeCompost} title="Nuevo Lote de Compost" size="md">
        <Stack>
          <TextInput label="Nombre *" value={compostForm.nombre} onChange={e => setCompostForm({ ...compostForm, nombre: e.target.value })} required />
          <SimpleGrid cols={2}>
            <TextInput label="Fecha Inicio *" type="date" value={compostForm.fecha_inicio} onChange={e => setCompostForm({ ...compostForm, fecha_inicio: e.target.value })} required />
            <TextInput label="Fecha Estimada Fin" type="date" value={compostForm.fecha_estimada_fin} onChange={e => setCompostForm({ ...compostForm, fecha_estimada_fin: e.target.value })} />
          </SimpleGrid>
          <SimpleGrid cols={3}>
            <NumberInput label="Volumen (m³)" value={compostForm.volumen_m3 ? parseFloat(compostForm.volumen_m3) : ''}
              onChange={v => setCompostForm({ ...compostForm, volumen_m3: v?.toString() || '' })} min={0} decimalScale={2} />
            <NumberInput label="Temperatura (°C)" value={compostForm.temperatura ? parseFloat(compostForm.temperatura) : ''}
              onChange={v => setCompostForm({ ...compostForm, temperatura: v?.toString() || '' })} min={0} decimalScale={1} />
            <NumberInput label="Humedad (%)" value={compostForm.humedad ? parseFloat(compostForm.humedad) : ''}
              onChange={v => setCompostForm({ ...compostForm, humedad: v?.toString() || '' })} min={0} max={100} decimalScale={1} />
          </SimpleGrid>
          <Select label="Estado" data={ESTADOS_COMPOST.map(e => ({ value: e.value, label: e.label }))}
            value={compostForm.estado} onChange={v => setCompostForm({ ...compostForm, estado: v || 'activo' })} />
          <Textarea label="Materiales (JSON array)" value={compostForm.materiales}
            onChange={e => setCompostForm({ ...compostForm, materiales: e.target.value })}
            placeholder='["estiércol", "rastrojo", "ceniza"]' minRows={2} />
          <Textarea label="Observaciones" value={compostForm.observaciones} onChange={e => setCompostForm({ ...compostForm, observaciones: e.target.value })} />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeCompost}>Cancelar</Button>
            <Button onClick={handleSaveCompost}>Crear</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
