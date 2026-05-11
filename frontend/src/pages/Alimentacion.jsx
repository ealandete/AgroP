import { useEffect, useState, useCallback } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, Stack, SimpleGrid, Text, ActionIcon,
  Tabs, Textarea, Collapse, Progress,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconApple, IconClipboardList, IconChartBar, IconCoin,
  IconPlus, IconEdit, IconChefHat, IconListDetails,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import api from '../services/api.js'

const CATEGORIAS_ALIMENTO = [
  { value: 'concentrado', label: 'Concentrado', color: 'orange' },
  { value: 'forraje', label: 'Forraje', color: 'green' },
  { value: 'suplemento', label: 'Suplemento', color: 'blue' },
  { value: 'vitamina', label: 'Vitamina', color: 'violet' },
  { value: 'mineral', label: 'Mineral', color: 'grape' },
  { value: 'otro', label: 'Otro', color: 'gray' },
]

const TIPOS_DIETA = [
  { value: 'engorde', label: 'Engorde', color: 'red' },
  { value: 'leche', label: 'Leche', color: 'blue' },
  { value: 'cria', label: 'Cría', color: 'pink' },
  { value: 'mantenimiento', label: 'Mantenimiento', color: 'green' },
  { value: 'gestacion', label: 'Gestación', color: 'purple' },
]

function TabAlimentos({ alimentos, onEdit, onNew }) {
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Alimentos</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={onNew}>Nuevo Alimento</Button>
      </Group>
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Categoría</Table.Th>
              <Table.Th>Unidad</Table.Th>
              <Table.Th>Costo</Table.Th>
              <Table.Th>Proteína%</Table.Th>
              <Table.Th>Energía</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th style={{ width: 80 }}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {alimentos.map(a => {
              const cat = CATEGORIAS_ALIMENTO.find(c => c.value === a.categoria)
              const nc = a.composicion_nutricional || {}
              return (
                <Table.Tr key={a.id}>
                  <Table.Td fw={500}>{a.nombre}</Table.Td>
                  <Table.Td><Badge color={cat?.color || 'gray'} size="sm" variant="light">{cat?.label || a.categoria}</Badge></Table.Td>
                  <Table.Td>{a.unidad_medida}</Table.Td>
                  <Table.Td>{a.costo_unitario != null ? `$${a.costo_unitario}` : '-'}</Table.Td>
                  <Table.Td>{nc.proteina != null ? nc.proteina : '-'}</Table.Td>
                  <Table.Td>{nc.energia != null ? `${nc.energia} Mcal` : '-'}</Table.Td>
                  <Table.Td><Badge color={a.activo ? 'green' : 'gray'} size="sm">{a.activo ? 'Activo' : 'Inactivo'}</Badge></Table.Td>
                  <Table.Td>
                    <ActionIcon variant="light" color="blue" size="sm" onClick={() => onEdit(a)}><IconEdit size={14} /></ActionIcon>
                  </Table.Td>
                </Table.Tr>
              )
            })}
            {alimentos.length === 0 && (
              <Table.Tr><Table.Td colSpan={8}><Text c="dimmed" ta="center">Sin alimentos registrados</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}

function TabDietas({ dietas, alimentos, onNew, onAddComponente, dietaExpandida, setDietaExpandida }) {
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Dietas</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={onNew}>Nueva Dieta</Button>
      </Group>
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Especie</Table.Th>
              <Table.Th>Componentes</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th style={{ width: 120 }}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {dietas.map(d => {
              const tipo = TIPOS_DIETA.find(t => t.value === d.tipo)
              const expandida = dietaExpandida === d.id
              return (
                <>
                  <Table.Tr key={d.id}>
                    <Table.Td fw={500}>{d.nombre}</Table.Td>
                    <Table.Td><Badge color={tipo?.color || 'gray'} size="sm" variant="light">{tipo?.label || d.tipo}</Badge></Table.Td>
                    <Table.Td>{d.especie || '-'}</Table.Td>
                    <Table.Td>
                      <Badge color="blue" size="sm" variant="outline">{d.componentes?.length || 0} items</Badge>
                    </Table.Td>
                    <Table.Td><Badge color={d.activo ? 'green' : 'gray'} size="sm">{d.activo ? 'Activa' : 'Inactiva'}</Badge></Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon variant="light" color="teal" size="sm"
                          onClick={() => setDietaExpandida(expandida ? null : d.id)}>
                          <IconListDetails size={14} />
                        </ActionIcon>
                        <ActionIcon variant="light" color="green" size="sm"
                          onClick={() => onAddComponente(d)}>
                          <IconPlus size={14} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                  {expandida && (
                    <Table.Tr key={`${d.id}-detalle`}>
                      <Table.Td colSpan={6}>
                        <Paper p="sm" bg="gray.0" withBorder>
                          <Text size="sm" fw={600} mb="xs">Componentes de {d.nombre}</Text>
                          {d.componentes && d.componentes.length > 0 ? (
                            <Stack gap="xs">
                              {d.componentes.map(c => {
                                const pct = c.porcentaje || 0
                                return (
                                  <Group key={c.id} gap="sm">
                                    <Text size="sm" w={140}>{c.alimento_nombre || `#${c.alimento_id}`}</Text>
                                    <Progress value={pct} size="lg" w={200} color="green" />
                                    <Text size="sm" w={60}>{pct}%</Text>
                                    <Text size="sm" c="dimmed">{c.cantidad_kg != null ? `${c.cantidad_kg} kg` : ''}</Text>
                                  </Group>
                                )
                              })}
                            </Stack>
                          ) : (
                            <Text size="sm" c="dimmed">Sin componentes. Agrega usando el botón +</Text>
                          )}
                        </Paper>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </>
              )
            })}
            {dietas.length === 0 && (
              <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin dietas registradas</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}

function TabConsumoDiario({ consumos, onNew }) {
  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Consumo Diario</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={onNew}>Registrar Consumo</Button>
      </Group>
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Lote / Animal</Table.Th>
              <Table.Th>Alimento</Table.Th>
              <Table.Th>Cantidad (kg)</Table.Th>
              <Table.Th>Costo</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {consumos.map(c => (
              <Table.Tr key={c.id}>
                <Table.Td>{dayjs(c.fecha).format('DD/MM/YYYY')}</Table.Td>
                <Table.Td>{c.lote_nombre || c.animal_codigo || '-'}</Table.Td>
                <Table.Td fw={500}>{c.alimento_nombre || `#${c.alimento_id}`}</Table.Td>
                <Table.Td>{c.cantidad_kg}</Table.Td>
                <Table.Td>{c.costo != null ? `$${c.costo.toLocaleString()}` : '-'}</Table.Td>
              </Table.Tr>
            ))}
            {consumos.length === 0 && (
              <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center">Sin consumos registrados</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}

export default function Alimentacion() {
  const [alimentos, setAlimentos] = useState([])
  const [dietas, setDietas] = useState([])
  const [consumos, setConsumos] = useState([])
  const [lotes, setLotes] = useState([])
  const [animales, setAnimales] = useState([])
  const [loading, setLoading] = useState(false)
  const [dietaExpandida, setDietaExpandida] = useState(null)

  const [alimentoModal, { open: openAlimento, close: closeAlimento }] = useDisclosure(false)
  const [dietaModal, { open: openDieta, close: closeDieta }] = useDisclosure(false)
  const [componenteModal, { open: openComponente, close: closeComponente }] = useDisclosure(false)
  const [consumoModal, { open: openConsumo, close: closeConsumo }] = useDisclosure(false)
  const [editandoAlimento, setEditandoAlimento] = useState(null)
  const [dietaParaComponente, setDietaParaComponente] = useState(null)

  const [alimentoForm, setAlimentoForm] = useState({
    nombre: '', categoria: 'concentrado', unidad_medida: 'kg',
    costo_unitario: '', composicion_nutricional: '{}',
  })
  const [dietaForm, setDietaForm] = useState({
    nombre: '', tipo: 'engorde', especie: '', observaciones: '',
  })
  const [componenteForm, setComponenteForm] = useState({
    alimento_id: '', porcentaje: '', cantidad_kg: '', costo: '',
  })
  const [consumoForm, setConsumoForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    lote_id: '', animal_id: '', alimento_id: '', cantidad_kg: '', costo: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [alR, dR, cR, lR, aR] = await Promise.all([
        api.get('/alimentos/'),
        api.get('/dietas/'),
        api.get('/consumo-diario/'),
        api.get('/lotes/').catch(() => ({ data: [] })),
        api.get('/animales/').catch(() => ({ data: [] })),
      ])
      setAlimentos(Array.isArray(alR.data) ? alR.data : [])
      setDietas(Array.isArray(dR.data) ? dR.data : [])
      setConsumos(Array.isArray(cR.data) ? cR.data : [])
      setLotes(Array.isArray(lR.data) ? lR.data : [])
      setAnimales(Array.isArray(aR.data) ? aR.data : [])
    } catch { setAlimentos([]); setDietas([]); setConsumos([]); setLotes([]); setAnimales([]) }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const consumoMes = consumos.filter(c => dayjs(c.fecha).isSame(dayjs(), 'month'))
  const totalKgMes = consumoMes.reduce((s, c) => s + (c.cantidad_kg || 0), 0)
  const totalCostoMes = consumoMes.reduce((s, c) => s + (c.costo || 0), 0)

  const resetAlimentoForm = () => setAlimentoForm({
    nombre: '', categoria: 'concentrado', unidad_medida: 'kg',
    costo_unitario: '', composicion_nutricional: '{}',
  })

  const parseNutricional = (str) => {
    try { return JSON.parse(str) } catch { return {} }
  }

  const handleSaveAlimento = async () => {
    if (!alimentoForm.nombre?.trim() || !alimentoForm.categoria || !alimentoForm.unidad_medida) {
      notifications.show({ title: 'Nombre, categoría y unidad son obligatorios', color: 'yellow' })
      return
    }
    try {
      const payload = {
        nombre: alimentoForm.nombre,
        categoria: alimentoForm.categoria,
        unidad_medida: alimentoForm.unidad_medida,
        costo_unitario: alimentoForm.costo_unitario ? parseFloat(alimentoForm.costo_unitario) : null,
        composicion_nutricional: parseNutricional(alimentoForm.composicion_nutricional),
      }
      if (editandoAlimento) {
        await api.put(`/alimentos/${editandoAlimento}`, payload)
        notifications.show({ title: 'Alimento actualizado', color: 'green' })
      } else {
        await api.post('/alimentos/', payload)
        notifications.show({ title: 'Alimento creado', color: 'green' })
      }
      closeAlimento()
      setEditandoAlimento(null)
      resetAlimentoForm()
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleEditAlimento = (a) => {
    setEditandoAlimento(a.id)
    setAlimentoForm({
      nombre: a.nombre || '',
      categoria: a.categoria || 'concentrado',
      unidad_medida: a.unidad_medida || 'kg',
      costo_unitario: a.costo_unitario?.toString() || '',
      composicion_nutricional: a.composicion_nutricional ? JSON.stringify(a.composicion_nutricional, null, 2) : '{}',
    })
    openAlimento()
  }

  const handleSaveDieta = async () => {
    if (!dietaForm.nombre?.trim() || !dietaForm.tipo) {
      notifications.show({ title: 'Nombre y tipo son obligatorios', color: 'yellow' })
      return
    }
    try {
      await api.post('/dietas/', dietaForm)
      notifications.show({ title: 'Dieta creada', color: 'green' })
      closeDieta()
      setDietaForm({ nombre: '', tipo: 'engorde', especie: '', observaciones: '' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleAddComponente = (dieta) => {
    setDietaParaComponente(dieta)
    setComponenteForm({ alimento_id: '', porcentaje: '', cantidad_kg: '', costo: '' })
    openComponente()
  }

  const handleSaveComponente = async () => {
    if (!componenteForm.alimento_id || !dietaParaComponente) {
      notifications.show({ title: 'Selecciona un alimento', color: 'yellow' })
      return
    }
    try {
      await api.post(`/dietas/${dietaParaComponente.id}/componentes`, {
        ...componenteForm,
        alimento_id: parseInt(componenteForm.alimento_id),
        porcentaje: componenteForm.porcentaje ? parseFloat(componenteForm.porcentaje) : null,
        cantidad_kg: componenteForm.cantidad_kg ? parseFloat(componenteForm.cantidad_kg) : null,
        costo: componenteForm.costo ? parseFloat(componenteForm.costo) : null,
      })
      notifications.show({ title: 'Componente agregado', color: 'green' })
      closeComponente()
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleSaveConsumo = async () => {
    if (!consumoForm.alimento_id || !consumoForm.cantidad_kg) {
      notifications.show({ title: 'Alimento y cantidad son obligatorios', color: 'yellow' })
      return
    }
    try {
      await api.post('/consumo-diario/', {
        ...consumoForm,
        lote_id: consumoForm.lote_id ? parseInt(consumoForm.lote_id) : null,
        animal_id: consumoForm.animal_id ? parseInt(consumoForm.animal_id) : null,
        alimento_id: parseInt(consumoForm.alimento_id),
        cantidad_kg: parseFloat(consumoForm.cantidad_kg),
        costo: consumoForm.costo ? parseFloat(consumoForm.costo) : null,
      })
      notifications.show({ title: 'Consumo registrado', color: 'green' })
      closeConsumo()
      setConsumoForm({
        fecha: new Date().toISOString().split('T')[0],
        lote_id: '', animal_id: '', alimento_id: '', cantidad_kg: '', costo: '',
      })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  return (
    <Stack>
      <Title order={3}>Alimentación</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Paper p="md" radius="md" withBorder>
          <Group><IconApple size={28} color="var(--mantine-color-orange-6)" />
            <div><Text size="xs" c="dimmed">Alimentos</Text><Text size="xl" fw={700}>{alimentos.length}</Text></div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconChefHat size={28} color="var(--mantine-color-blue-6)" />
            <div><Text size="xs" c="dimmed">Dietas</Text><Text size="xl" fw={700}>{dietas.length}</Text></div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconChartBar size={28} color="var(--mantine-color-green-6)" />
            <div><Text size="xs" c="dimmed">Consumo Mes (kg)</Text><Text size="xl" fw={700}>{totalKgMes.toFixed(1)}</Text></div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconCoin size={28} color="var(--mantine-color-cyan-6)" />
            <div><Text size="xs" c="dimmed">Costo Total Mes</Text><Text size="xl" fw={700}>${totalCostoMes.toLocaleString()}</Text></div>
          </Group>
        </Paper>
      </SimpleGrid>

      <Tabs defaultValue="alimentos">
        <Tabs.List>
          <Tabs.Tab value="alimentos" leftSection={<IconApple size={16} />}>Alimentos</Tabs.Tab>
          <Tabs.Tab value="dietas" leftSection={<IconChefHat size={16} />}>Dietas</Tabs.Tab>
          <Tabs.Tab value="consumo" leftSection={<IconChartBar size={16} />}>Consumo Diario</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="alimentos" pt="md">
          <TabAlimentos alimentos={alimentos}
            onNew={() => { setEditandoAlimento(null); resetAlimentoForm(); openAlimento() }}
            onEdit={handleEditAlimento}
          />
        </Tabs.Panel>
        <Tabs.Panel value="dietas" pt="md">
          <TabDietas dietas={dietas} alimentos={alimentos}
            onNew={() => { setDietaForm({ nombre: '', tipo: 'engorde', especie: '', observaciones: '' }); openDieta() }}
            onAddComponente={handleAddComponente}
            dietaExpandida={dietaExpandida} setDietaExpandida={setDietaExpandida}
          />
        </Tabs.Panel>
        <Tabs.Panel value="consumo" pt="md">
          <TabConsumoDiario consumos={consumos}
            onNew={() => { setConsumoForm({ ...consumoForm, fecha: new Date().toISOString().split('T')[0] }); openConsumo() }}
          />
        </Tabs.Panel>
      </Tabs>

      <Modal opened={alimentoModal} onClose={closeAlimento} title={editandoAlimento ? 'Editar Alimento' : 'Nuevo Alimento'} size="lg">
        <Stack>
          <TextInput label="Nombre *" value={alimentoForm.nombre} onChange={e => setAlimentoForm({ ...alimentoForm, nombre: e.target.value })} required />
          <SimpleGrid cols={2}>
            <Select label="Categoría *" data={CATEGORIAS_ALIMENTO.map(c => ({ value: c.value, label: c.label }))}
              value={alimentoForm.categoria} onChange={v => setAlimentoForm({ ...alimentoForm, categoria: v })} required />
            <TextInput label="Unidad de Medida *" value={alimentoForm.unidad_medida} onChange={e => setAlimentoForm({ ...alimentoForm, unidad_medida: e.target.value })} required />
          </SimpleGrid>
          <NumberInput label="Costo Unitario" value={alimentoForm.costo_unitario ? parseFloat(alimentoForm.costo_unitario) : ''}
            onChange={v => setAlimentoForm({ ...alimentoForm, costo_unitario: v?.toString() || '' })} min={0} decimalScale={2} />
          <Textarea label="Composición Nutricional (JSON)" value={alimentoForm.composicion_nutricional}
            onChange={e => setAlimentoForm({ ...alimentoForm, composicion_nutricional: e.target.value })}
            placeholder='{"proteina": 16, "energia": 2.8, "fibra": 12, "grasa": 3}'
            minRows={4} autosize />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeAlimento}>Cancelar</Button>
            <Button onClick={handleSaveAlimento}>{editandoAlimento ? 'Actualizar' : 'Guardar'}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={dietaModal} onClose={closeDieta} title="Nueva Dieta" size="md">
        <Stack>
          <TextInput label="Nombre *" value={dietaForm.nombre} onChange={e => setDietaForm({ ...dietaForm, nombre: e.target.value })} required />
          <Select label="Tipo *" data={TIPOS_DIETA.map(t => ({ value: t.value, label: t.label }))}
            value={dietaForm.tipo} onChange={v => setDietaForm({ ...dietaForm, tipo: v || 'engorde' })} required />
          <TextInput label="Especie" value={dietaForm.especie} onChange={e => setDietaForm({ ...dietaForm, especie: e.target.value })} placeholder="bovino, porcino, etc" />
          <Textarea label="Observaciones" value={dietaForm.observaciones} onChange={e => setDietaForm({ ...dietaForm, observaciones: e.target.value })} />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeDieta}>Cancelar</Button>
            <Button onClick={handleSaveDieta}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={componenteModal} onClose={closeComponente} title={`Agregar Componente${dietaParaComponente ? ` - ${dietaParaComponente.nombre}` : ''}`} size="md">
        <Stack>
          <Select label="Alimento *" data={alimentos.filter(a => a.activo).map(a => ({ value: a.id.toString(), label: a.nombre }))}
            value={componenteForm.alimento_id} onChange={v => setComponenteForm({ ...componenteForm, alimento_id: v })} searchable required />
          <SimpleGrid cols={2}>
            <NumberInput label="Porcentaje (%)" value={componenteForm.porcentaje ? parseFloat(componenteForm.porcentaje) : ''}
              onChange={v => setComponenteForm({ ...componenteForm, porcentaje: v?.toString() || '' })} min={0} max={100} decimalScale={2} />
            <NumberInput label="Cantidad (kg)" value={componenteForm.cantidad_kg ? parseFloat(componenteForm.cantidad_kg) : ''}
              onChange={v => setComponenteForm({ ...componenteForm, cantidad_kg: v?.toString() || '' })} min={0} decimalScale={2} />
          </SimpleGrid>
          <NumberInput label="Costo" value={componenteForm.costo ? parseFloat(componenteForm.costo) : ''}
            onChange={v => setComponenteForm({ ...componenteForm, costo: v?.toString() || '' })} min={0} decimalScale={2} />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeComponente}>Cancelar</Button>
            <Button onClick={handleSaveComponente}>Agregar</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={consumoModal} onClose={closeConsumo} title="Registrar Consumo Diario" size="md">
        <Stack>
          <TextInput label="Fecha *" type="date" value={consumoForm.fecha} onChange={e => setConsumoForm({ ...consumoForm, fecha: e.target.value })} required />
          <Select label="Alimento *" data={alimentos.filter(a => a.activo).map(a => ({ value: a.id.toString(), label: a.nombre }))}
            value={consumoForm.alimento_id} onChange={v => setConsumoForm({ ...consumoForm, alimento_id: v })} searchable required />
          <NumberInput label="Cantidad (kg) *" value={consumoForm.cantidad_kg ? parseFloat(consumoForm.cantidad_kg) : ''}
            onChange={v => setConsumoForm({ ...consumoForm, cantidad_kg: v?.toString() || '' })} min={0} decimalScale={2} required />
          <Select label="Lote (opcional)" data={lotes.map(l => ({ value: l.id.toString(), label: l.nombre }))}
            value={consumoForm.lote_id} onChange={v => setConsumoForm({ ...consumoForm, lote_id: v })} searchable clearable />
          <Select label="Animal (opcional)" data={animales.map(a => ({ value: a.id.toString(), label: `${a.codigo || a.nombre || '#' + a.id} - ${a.especie}` }))}
            value={consumoForm.animal_id} onChange={v => setConsumoForm({ ...consumoForm, animal_id: v })} searchable clearable />
          <NumberInput label="Costo" value={consumoForm.costo ? parseFloat(consumoForm.costo) : ''}
            onChange={v => setConsumoForm({ ...consumoForm, costo: v?.toString() || '' })} min={0} decimalScale={2} />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeConsumo}>Cancelar</Button>
            <Button onClick={handleSaveConsumo}>Registrar</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
