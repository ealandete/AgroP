import { useEffect, useState, useCallback } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  NumberInput, Badge, Stack, SimpleGrid, Text, ActionIcon,
  Tabs, Textarea, Select, Switch, Card, Divider,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconDna, IconHeartbeat, IconFlask, IconTrendingUp,
  IconPlus, IconEdit, IconGenderMale, IconBabyBottle,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import api from '../services/api.js'
import { formatCOP } from '../config.js'

const TIPOS_REPRODUCTOR = [
  { value: 'toro', label: 'Toro' },
  { value: 'verraco', label: 'Verraco' },
  { value: 'carnero', label: 'Carnero' },
  { value: 'gallo', label: 'Gallo' },
  { value: 'otro', label: 'Otro' },
]

const TIPOS_EMPADRE = [
  { value: 'monta', label: 'Monta Natural' },
  { value: 'IA', label: 'Inseminación Artificial' },
  { value: 'TE', label: 'Transferencia Embriones' },
]

function getResultadoBadge(resultado) {
  const colores = { pendiente: 'yellow', preñada: 'green', vacia: 'red' }
  const labels = { pendiente: 'Pendiente', preñada: 'Preñada', vacia: 'Vacía' }
  return <Badge color={colores[resultado] || 'gray'}>{labels[resultado] || resultado}</Badge>
}

export default function Mejoramiento() {
  const [reproductores, setReproductores] = useState([])
  const [empadres, setEmpadres] = useState([])
  const [hijos, setHijos] = useState([])
  const [animales, setAnimales] = useState([])
  const [estadisticas, setEstadisticas] = useState(null)
  const [loading, setLoading] = useState(false)

  const [reprodModal, { open: openReprod, close: closeReprod }] = useDisclosure(false)
  const [empadreModal, { open: openEmpadre, close: closeEmpadre }] = useDisclosure(false)
  const [hijosModal, { open: openHijos, close: closeHijos }] = useDisclosure(false)
  const [hijosData, setHijosData] = useState([])
  const [hijosReprodNombre, setHijosReprodNombre] = useState('')

  const [reprodForm, setReprodForm] = useState({
    animal_id: '', tipo: 'toro', registro_ica: '', registro_asociacion: '',
    score_conformacion: '', score_temperamento: '',
    fecha_ultima_evaluacion: '', proxima_evaluacion: '',
    semen_disponible: false, precio_semen: '', precio_monta: '',
    evaluacion_genetica: '{}', pedigree: '{}',
  })

  const [empadreForm, setEmpadreForm] = useState({
    reproductor_id: '', receptora_id: '', fecha: new Date().toISOString().split('T')[0],
    tipo: 'monta', observaciones: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [rR, eR, sR, aR] = await Promise.all([
        api.get('/mejoramiento/reproductores'),
        api.get('/mejoramiento/empadres'),
        api.get('/mejoramiento/estadisticas'),
        api.get('/animales/').catch(() => ({ data: [] })),
      ])
      setReproductores(Array.isArray(rR.data) ? rR.data : [])
      setEmpadres(Array.isArray(eR.data) ? eR.data : [])
      setEstadisticas(sR.data)
      setAnimales(Array.isArray(aR.data) ? aR.data : [])
    } catch { setReproductores([]); setEmpadres([]); setAnimales([]) }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSaveReprod = async () => {
    if (!reprodForm.animal_id) {
      notifications.show({ title: 'Selecciona un animal', color: 'yellow' })
      return
    }
    try {
      const payload = {
        ...reprodForm,
        animal_id: parseInt(reprodForm.animal_id),
        score_conformacion: reprodForm.score_conformacion ? parseInt(reprodForm.score_conformacion) : null,
        score_temperamento: reprodForm.score_temperamento ? parseInt(reprodForm.score_temperamento) : null,
        precio_semen: reprodForm.precio_semen ? parseFloat(reprodForm.precio_semen) : null,
        precio_monta: reprodForm.precio_monta ? parseFloat(reprodForm.precio_monta) : null,
        evaluacion_genetica: reprodForm.evaluacion_genetica ? JSON.parse(reprodForm.evaluacion_genetica) : null,
        pedigree: reprodForm.pedigree ? JSON.parse(reprodForm.pedigree) : null,
      }
      await api.post('/mejoramiento/reproductores', payload)
      notifications.show({ title: 'Reproductor registrado', color: 'green' })
      closeReprod()
      setReprodForm({
        animal_id: '', tipo: 'toro', registro_ica: '', registro_asociacion: '',
        score_conformacion: '', score_temperamento: '',
        fecha_ultima_evaluacion: '', proxima_evaluacion: '',
        semen_disponible: false, precio_semen: '', precio_monta: '',
        evaluacion_genetica: '{}', pedigree: '{}',
      })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleSaveEmpadre = async () => {
    if (!empadreForm.reproductor_id || !empadreForm.receptora_id) {
      notifications.show({ title: 'Reproductor y receptora son obligatorios', color: 'yellow' })
      return
    }
    try {
      await api.post('/mejoramiento/empadre', {
        ...empadreForm,
        reproductor_id: parseInt(empadreForm.reproductor_id),
        receptora_id: parseInt(empadreForm.receptora_id),
      })
      notifications.show({ title: 'Empadre registrado', color: 'green' })
      closeEmpadre()
      setEmpadreForm({
        reproductor_id: '', receptora_id: '', fecha: new Date().toISOString().split('T')[0],
        tipo: 'monta', observaciones: '',
      })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const verHijos = async (r) => {
    try {
      const { data } = await api.get(`/mejoramiento/reproductores/${r.id}/hijas`)
      setHijosData(Array.isArray(data) ? data : [])
      setHijosReprodNombre(r.animal_nombre || r.animal_codigo || `#${r.animal_id}`)
      openHijos()
    } catch {
      setHijosData([])
      openHijos()
    }
  }

  const empadresMes = empadres.filter(e => dayjs(e.fecha).isSame(dayjs(), 'month'))

  return (
    <Stack>
      <Title order={3}>Mejoramiento Genético</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Paper p="md" radius="md" withBorder>
          <Group><IconGenderMale size={28} color="var(--mantine-color-blue-6)" />
            <div><Text size="xs" c="dimmed">Reproductores Activos</Text>
              <Text size="xl" fw={700}>{estadisticas?.reproductores_activos ?? reproductores.filter(r => r.activo).length}</Text></div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconHeartbeat size={28} color="var(--mantine-color-pink-6)" />
            <div><Text size="xs" c="dimmed">Empadres del Mes</Text>
              <Text size="xl" fw={700}>{estadisticas?.empadres_mes ?? empadresMes.length}</Text></div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconFlask size={28} color="var(--mantine-color-green-6)" />
            <div><Text size="xs" c="dimmed">Tasa de Éxito</Text>
              <Text size="xl" fw={700}>{estadisticas?.tasa_exito_pct ?? 0}%</Text></div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconTrendingUp size={28} color="var(--mantine-color-grape-6)" />
            <div><Text size="xs" c="dimmed">Progreso Genético</Text>
              <Text size="xl" fw={700}>{estadisticas?.progreso_genetico || 'N/A'}</Text></div>
          </Group>
        </Paper>
      </SimpleGrid>

      <Tabs defaultValue="reproductores">
        <Tabs.List>
          <Tabs.Tab value="reproductores" leftSection={<IconDna size={16} />}>Reproductores</Tabs.Tab>
          <Tabs.Tab value="empadres" leftSection={<IconHeartbeat size={16} />}>Empadres</Tabs.Tab>
          <Tabs.Tab value="hijos" leftSection={<IconBabyBottle size={16} />}>Hijos</Tabs.Tab>
          <Tabs.Tab value="estadisticas" leftSection={<IconTrendingUp size={16} />}>Estadísticas</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="reproductores" pt="md">
          <Stack>
            <Group justify="space-between">
              <Title order={4}>Reproductores</Title>
              <Button leftSection={<IconPlus size={16} />} onClick={openReprod}>Nuevo Reproductor</Button>
            </Group>
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Animal</Table.Th>
                    <Table.Th>Tipo</Table.Th>
                    <Table.Th>Score</Table.Th>
                    <Table.Th>Semen</Table.Th>
                    <Table.Th>Precio Monta</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {reproductores.map(r => (
                    <Table.Tr key={r.id}>
                      <Table.Td fw={500}>{r.animal_nombre || r.animal_codigo || `#${r.animal_id}`}</Table.Td>
                      <Table.Td><Badge size="sm" variant="light">{TIPOS_REPRODUCTOR.find(t => t.value === r.tipo)?.label || r.tipo}</Badge></Table.Td>
                      <Table.Td>{r.score_conformacion != null ? `${r.score_conformacion}/100` : '-'}</Table.Td>
                      <Table.Td><Badge color={r.semen_disponible ? 'green' : 'gray'} size="sm">{r.semen_disponible ? 'Disponible' : 'No'}</Badge></Table.Td>
                      <Table.Td>{r.precio_monta ? formatCOP(r.precio_monta) : '-'}</Table.Td>
                      <Table.Td><Badge color={r.activo ? 'green' : 'red'} size="sm">{r.activo ? 'Activo' : 'Inactivo'}</Badge></Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <ActionIcon variant="light" color="blue" size="sm" onClick={() => verHijos(r)}><IconBabyBottle size={14} /></ActionIcon>
                          <ActionIcon variant="light" color="green" size="sm"><IconEdit size={14} /></ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {reproductores.length === 0 && (
                    <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center">Sin reproductores registrados</Text></Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="empadres" pt="md">
          <Stack>
            <Group justify="space-between">
              <Title order={4}>Empadres</Title>
              <Button leftSection={<IconPlus size={16} />} onClick={openEmpadre}>Planear Empadre</Button>
            </Group>
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Reproductor</Table.Th>
                    <Table.Th>Receptora</Table.Th>
                    <Table.Th>Tipo</Table.Th>
                    <Table.Th>Resultado</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {empadres.map(e => (
                    <Table.Tr key={e.id}>
                      <Table.Td>{dayjs(e.fecha).format('DD/MM/YYYY')}</Table.Td>
                      <Table.Td fw={500}>{e.reproductor_nombre || `#${e.reproductor_id}`}</Table.Td>
                      <Table.Td>{e.receptora_codigo || `#${e.receptora_id}`}</Table.Td>
                      <Table.Td>{TIPOS_EMPADRE.find(t => t.value === e.tipo)?.label || e.tipo}</Table.Td>
                      <Table.Td>{getResultadoBadge(e.resultado)}</Table.Td>
                    </Table.Tr>
                  ))}
                  {empadres.length === 0 && (
                    <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center">Sin empadres registrados</Text></Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="hijos" pt="md">
          <Stack>
            <Title order={4}>Hijos Registrados</Title>
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Animal</Table.Th>
                    <Table.Th>Empadre</Table.Th>
                    <Table.Th>Registrado</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {hijosData.length > 0 ? hijosData.map(h => (
                    <Table.Tr key={h.id}>
                      <Table.Td>{h.id}</Table.Td>
                      <Table.Td fw={500}>{h.animal_nombre || h.animal_codigo || `#${h.animal_id}`}</Table.Td>
                      <Table.Td>{h.empadre_id ? `#${h.empadre_id}` : '-'}</Table.Td>
                      <Table.Td>{dayjs(h.created_at).format('DD/MM/YYYY')}</Table.Td>
                    </Table.Tr>
                  )) : (
                    <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center">Selecciona un reproductor para ver sus hijos</Text></Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="estadisticas" pt="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Card withBorder p="md">
              <Text fw={600} mb="sm">Resumen Genético</Text>
              <Stack gap="xs">
                <Group justify="space-between"><Text size="sm">Total Reproductores:</Text><Text fw={600}>{estadisticas?.total_reproductores ?? 0}</Text></Group>
                <Group justify="space-between"><Text size="sm">Activos:</Text><Text fw={600} c="green">{estadisticas?.reproductores_activos ?? 0}</Text></Group>
                <Group justify="space-between"><Text size="sm">Empadres del Mes:</Text><Text fw={600}>{estadisticas?.empadres_mes ?? 0}</Text></Group>
                <Group justify="space-between"><Text size="sm">Tasa de Éxito:</Text><Text fw={600} c="green">{estadisticas?.tasa_exito_pct ?? 0}%</Text></Group>
                <Group justify="space-between"><Text size="sm">Total Hijos:</Text><Text fw={600}>{estadisticas?.total_hijos ?? 0}</Text></Group>
                <Group justify="space-between"><Text size="sm">Progreso Genético:</Text><Text fw={600} c="grape">{estadisticas?.progreso_genetico || 'N/A'}</Text></Group>
              </Stack>
            </Card>
            <Card withBorder p="md">
              <Text fw={600} mb="sm">Evaluación Genética</Text>
              <Text size="sm" c="dimmed">Selecciona un reproductor en la pestaña Reproductores y haz clic en el icono de hijos para ver su pedigrí y descendencia.</Text>
            </Card>
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={reprodModal} onClose={closeReprod} title="Nuevo Reproductor" size="lg">
        <Stack>
          <Select label="Animal *" data={animales.filter(a => a.activo).map(a => ({
            value: a.id.toString(), label: `${a.codigo || a.nombre || `#${a.id}`} - ${a.especie}`,
          }))} value={reprodForm.animal_id} onChange={v => setReprodForm({ ...reprodForm, animal_id: v })} searchable required />
          <Select label="Tipo" data={TIPOS_REPRODUCTOR} value={reprodForm.tipo} onChange={v => setReprodForm({ ...reprodForm, tipo: v || 'toro' })} />
          <SimpleGrid cols={2}>
            <TextInput label="Registro ICA" value={reprodForm.registro_ica} onChange={e => setReprodForm({ ...reprodForm, registro_ica: e.target.value })} />
            <TextInput label="Registro Asociación" value={reprodForm.registro_asociacion} onChange={e => setReprodForm({ ...reprodForm, registro_asociacion: e.target.value })} />
          </SimpleGrid>
          <SimpleGrid cols={2}>
            <NumberInput label="Score Conformación (1-100)" value={reprodForm.score_conformacion ? parseInt(reprodForm.score_conformacion) : ''}
              onChange={v => setReprodForm({ ...reprodForm, score_conformacion: v?.toString() || '' })} min={1} max={100} />
            <NumberInput label="Score Temperamento (1-100)" value={reprodForm.score_temperamento ? parseInt(reprodForm.score_temperamento) : ''}
              onChange={v => setReprodForm({ ...reprodForm, score_temperamento: v?.toString() || '' })} min={1} max={100} />
          </SimpleGrid>
          <SimpleGrid cols={2}>
            <TextInput label="Fecha Última Evaluación" type="date" value={reprodForm.fecha_ultima_evaluacion} onChange={e => setReprodForm({ ...reprodForm, fecha_ultima_evaluacion: e.target.value })} />
            <TextInput label="Próxima Evaluación" type="date" value={reprodForm.proxima_evaluacion} onChange={e => setReprodForm({ ...reprodForm, proxima_evaluacion: e.target.value })} />
          </SimpleGrid>
          <Switch label="Semen Disponible" checked={reprodForm.semen_disponible} onChange={e => setReprodForm({ ...reprodForm, semen_disponible: e.target.checked })} />
          <SimpleGrid cols={2}>
            <NumberInput label="Precio Semen ($)" value={reprodForm.precio_semen ? parseFloat(reprodForm.precio_semen) : ''}
              onChange={v => setReprodForm({ ...reprodForm, precio_semen: v?.toString() || '' })} min={0} />
            <NumberInput label="Precio Monta ($)" value={reprodForm.precio_monta ? parseFloat(reprodForm.precio_monta) : ''}
              onChange={v => setReprodForm({ ...reprodForm, precio_monta: v?.toString() || '' })} min={0} />
          </SimpleGrid>
          <Textarea label="Evaluación Genética (JSON)" value={reprodForm.evaluacion_genetica}
            onChange={e => setReprodForm({ ...reprodForm, evaluacion_genetica: e.target.value })}
            placeholder='{"cpr": 85, "leche_kg": 7500, "peso_destete": 280}' minRows={2} />
          <Textarea label="Pedigree (JSON)" value={reprodForm.pedigree}
            onChange={e => setReprodForm({ ...reprodForm, pedigree: e.target.value })}
            placeholder='{"padre": "Toro-001", "madre": "Vaca-045"}' minRows={2} />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeReprod}>Cancelar</Button>
            <Button onClick={handleSaveReprod}>Registrar</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={empadreModal} onClose={closeEmpadre} title="Planear Empadre" size="md">
        <Stack>
          <Select label="Reproductor *" data={reproductores.filter(r => r.activo).map(r => ({
            value: r.id.toString(), label: r.animal_nombre || r.animal_codigo || `#${r.animal_id}`,
          }))} value={empadreForm.reproductor_id} onChange={v => setEmpadreForm({ ...empadreForm, reproductor_id: v })} searchable required />
          <Select label="Receptora *" data={animales.filter(a => a.sexo === 'H' && a.activo).map(a => ({
            value: a.id.toString(), label: `${a.codigo || a.nombre || `#${a.id}`}`,
          }))} value={empadreForm.receptora_id} onChange={v => setEmpadreForm({ ...empadreForm, receptora_id: v })} searchable required />
          <TextInput label="Fecha" type="date" value={empadreForm.fecha} onChange={e => setEmpadreForm({ ...empadreForm, fecha: e.target.value })} required />
          <Select label="Tipo" data={TIPOS_EMPADRE} value={empadreForm.tipo} onChange={v => setEmpadreForm({ ...empadreForm, tipo: v || 'monta' })} />
          <Textarea label="Observaciones" value={empadreForm.observaciones} onChange={e => setEmpadreForm({ ...empadreForm, observaciones: e.target.value })} />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeEmpadre}>Cancelar</Button>
            <Button onClick={handleSaveEmpadre}>Registrar</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={hijosModal} onClose={closeHijos} title={`Hijos de: ${hijosReprodNombre}`} size="lg">
        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Animal</Table.Th>
                <Table.Th>Código</Table.Th>
                <Table.Th>Empadre</Table.Th>
                <Table.Th>Registrado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {hijosData.map(h => (
                <Table.Tr key={h.id}>
                  <Table.Td fw={500}>{h.animal_nombre || `#${h.animal_id}`}</Table.Td>
                  <Table.Td>{h.animal_codigo || '-'}</Table.Td>
                  <Table.Td>{h.empadre_id ? `#${h.empadre_id}` : '-'}</Table.Td>
                  <Table.Td>{dayjs(h.created_at).format('DD/MM/YYYY')}</Table.Td>
                </Table.Tr>
              ))}
              {hijosData.length === 0 && (
                <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center">Sin hijos registrados</Text></Table.Td></Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      </Modal>
    </Stack>
  )
}
