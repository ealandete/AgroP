import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, ActionIcon, Stack, Tabs,
  Textarea, SimpleGrid, Text, Loader, Center, Switch,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPlus, IconEdit, IconTrash,
  IconStethoscope, IconWeight, IconHeart,
  IconDroplet, IconTruck, IconCalendar, IconPaw,
  IconDeviceFloppy, IconArrowLeft, IconUpload, IconDownload, IconFile,
  IconQrcode, IconScan, IconHistory, IconStethoscope as IconVetStethoscope,
} from '@tabler/icons-react'
import QRGenerator from '../components/QRGenerator.jsx'
import QRScanner from '../components/QRScanner.jsx'
import api from '../services/api.js'
import { formatCOP, formatNumber, ESPECIES, ESTADOS_ANIMAL } from '../config.js'

const calcularEdad = (fechaNac) => {
  if (!fechaNac) return '-'
  const hoy = new Date()
  const nac = new Date(fechaNac)
  const diffMeses = (hoy.getFullYear() - nac.getFullYear()) * 12 + hoy.getMonth() - nac.getMonth()
  if (diffMeses < 12) return `${diffMeses} meses`
  const años = Math.floor(diffMeses / 12)
  const meses = diffMeses % 12
  return meses > 0 ? `${años} años, ${meses} meses` : `${años} años`
}

const sanidadTypeColors = {
  vacunacion: 'green',
  desparasitacion: 'blue',
  enfermedad: 'red',
  tratamiento: 'orange',
  control: 'gray',
}

const resultColor = (r) => {
  if (r === 'preñada') return 'green'
  if (r === 'vacia') return 'red'
  if (r === 'dudosa') return 'yellow'
  return 'gray'
}

export default function FichaAnimal() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const animalId = searchParams.get('id')
  const [animal, setAnimal] = useState(null)
  const [animales, setAnimales] = useState([])
  const [razas, setRazas] = useState([])
  const [loading, setLoading] = useState(false)
  const [savingBasic, setSavingBasic] = useState(false)

  const [sanidad, setSanidad] = useState([])
  const [pesajes, setPesajes] = useState([])
  const [reproduccion, setReproduccion] = useState([])
  const [lactancias, setLactancias] = useState([])
  const [ordenos, setOrdenos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [eventos, setEventos] = useState([])
  const [archivos, setArchivos] = useState([])

  const [sanidadOpened, { open: openSanidad, close: closeSanidad }] = useDisclosure(false)
  const [pesajeOpened, { open: openPesaje, close: closePesaje }] = useDisclosure(false)
  const [reproOpened, { open: openRepro, close: closeRepro }] = useDisclosure(false)
  const [editSanidad, setEditSanidad] = useState(null)
  const [editPesaje, setEditPesaje] = useState(null)
  const [editRepro, setEditRepro] = useState(null)
  const [qrGeneratorOpened, setQrGeneratorOpened] = useState(false)
  const [qrScannerOpened, setQrScannerOpened] = useState(false)

  const [sanidadForm, setSanidadForm] = useState({
    animal_id: '', fecha: new Date().toISOString().split('T')[0],
    tipo_evento: 'vacunacion', diagnostico: '', producto: '',
    veterinario: '', costo: '', fecha_proximo: '',
  })
  const [pesajeForm, setPesajeForm] = useState({
    animal_id: '', fecha: new Date().toISOString().split('T')[0],
    peso_kg: '', condicion_corporal: '', metodo: '',
  })
  const [reproForm, setReproForm] = useState({
    animal_id: '', tipo_servicio: 'monta_natural', fecha_servicio: '',
    resultado: '', fecha_parto_estimada: '', observaciones: '',
    numero_crias: '',
  })
  const [animalForm, setAnimalForm] = useState({})

  useEffect(() => {
    api.get('/animales/').then(r => setAnimales(r.data))
    api.get('/animales/razas/').then(r => setRazas(r.data))
  }, [])

  useEffect(() => {
    if (!animalId) return
    setLoading(true)
    api.get(`/animales/${animalId}`).then(r => {
      setAnimal(r.data)
      setAnimalForm(r.data)
    }).finally(() => setLoading(false))
  }, [animalId])

  const loadSections = () => {
    if (!animalId) return
    api.get('/sanidad/', { params: { animal_id: animalId } }).then(r => setSanidad(r.data))
    api.get('/pesajes/', { params: { animal_id: animalId } }).then(r => setPesajes(r.data))
    api.get('/reproduccion/', { params: { animal_id: animalId } }).then(r => setReproduccion(r.data))
    api.get('/lactancias/', { params: { animal_id: animalId } }).then(r => setLactancias(r.data))
    api.get('/ordenos/', { params: { animal_id: animalId } }).then(r => setOrdenos(r.data))
    api.get('/movimientos/', { params: { animal_id: animalId } }).then(r => setMovimientos(r.data))
    api.get(`/animales/${animalId}/eventos`).then(r => setEventos(r.data))
    loadArchivos()
  }

  const loadArchivos = () => {
    if (!animalId) return
    try {
      const stored = localStorage.getItem(`agrop_ficha_archivos_${animalId}`)
      setArchivos(stored ? JSON.parse(stored) : [])
    } catch { setArchivos([]) }
  }

  useEffect(() => {
    loadSections()
  }, [animalId])

  const handleSaveAnimal = async () => {
    setSavingBasic(true)
    try {
      await api.put(`/animales/${animalId}`, animalForm)
      const r = await api.get(`/animales/${animalId}`)
      setAnimal(r.data)
      setAnimalForm(r.data)
      notifications.show({ title: 'Datos actualizados', color: 'green' })
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    } finally {
      setSavingBasic(false)
    }
  }

  const handleSanidadSubmit = async () => {
    try {
      if (editSanidad) {
        await api.put(`/sanidad/${editSanidad}`, sanidadForm)
        notifications.show({ title: 'Evento sanitario actualizado', color: 'green' })
      } else {
        await api.post('/sanidad/', sanidadForm)
        notifications.show({ title: 'Evento sanitario registrado', color: 'green' })
      }
      closeSanidad()
      setEditSanidad(null)
      setSanidadForm({ animal_id: animalId, fecha: new Date().toISOString().split('T')[0], tipo_evento: 'vacunacion', diagnostico: '', producto: '', veterinario: '', costo: '', fecha_proximo: '' })
      loadSections()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handlePesajeSubmit = async () => {
    try {
      if (editPesaje) {
        await api.put(`/pesajes/${editPesaje}`, pesajeForm)
        notifications.show({ title: 'Pesaje actualizado', color: 'green' })
      } else {
        await api.post('/pesajes/', pesajeForm)
        notifications.show({ title: 'Pesaje registrado', color: 'green' })
      }
      closePesaje()
      setEditPesaje(null)
      setPesajeForm({ animal_id: animalId, fecha: new Date().toISOString().split('T')[0], peso_kg: '', condicion_corporal: '', metodo: '' })
      loadSections()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleReproSubmit = async () => {
    try {
      if (editRepro) {
        await api.put(`/reproduccion/${editRepro}`, reproForm)
        notifications.show({ title: 'Evento reproductivo actualizado', color: 'green' })
      } else {
        await api.post('/reproduccion/', reproForm)
        notifications.show({ title: 'Evento reproductivo registrado', color: 'green' })
      }
      closeRepro()
      setEditRepro(null)
      setReproForm({ animal_id: animalId, tipo_servicio: 'monta_natural', fecha_servicio: '', resultado: '', fecha_parto_estimada: '', observaciones: '', numero_crias: '' })
      loadSections()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleDeleteSanidad = async (id) => {
    try {
      await api.delete(`/sanidad/${id}`)
      notifications.show({ title: 'Evento eliminado', color: 'red' })
      loadSections()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleDeletePesaje = async (id) => {
    try {
      await api.delete(`/pesajes/${id}`)
      notifications.show({ title: 'Pesaje eliminado', color: 'red' })
      loadSections()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleUploadArchivo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const newFile = {
        id: Date.now(),
        nombre: file.name,
        tipo: 'documento',
        fecha: new Date().toISOString().split('T')[0],
        data: reader.result,
      }
      const updated = [...archivos, newFile]
      setArchivos(updated)
      localStorage.setItem(`agrop_ficha_archivos_${animalId}`, JSON.stringify(updated))
      notifications.show({ title: 'Archivo subido', color: 'green' })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleDownloadArchivo = (archivo) => {
    const a = document.createElement('a')
    a.href = archivo.data
    a.download = archivo.nombre
    a.click()
  }

  const handleDeleteArchivo = (id) => {
    const updated = archivos.filter(a => a.id !== id)
    setArchivos(updated)
    localStorage.setItem(`agrop_ficha_archivos_${animalId}`, JSON.stringify(updated))
    notifications.show({ title: 'Archivo eliminado', color: 'orange' })
  }

  const handleDeleteRepro = async (id) => {
    try {
      await api.delete(`/reproduccion/${id}`)
      notifications.show({ title: 'Evento eliminado', color: 'red' })
      loadSections()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const openSanidadModal = (s = null) => {
    if (s) {
      setEditSanidad(s.id)
      setSanidadForm({
        animal_id: s.animal_id?.toString() || animalId,
        fecha: s.fecha || '',
        tipo_evento: s.tipo_evento || 'vacunacion',
        diagnostico: s.diagnostico || '',
        producto: s.producto || '',
        veterinario: s.veterinario || '',
        costo: s.costo?.toString() || '',
        fecha_proximo: s.fecha_proximo || '',
      })
    } else {
      setEditSanidad(null)
      setSanidadForm({ animal_id: animalId || '', fecha: new Date().toISOString().split('T')[0], tipo_evento: 'vacunacion', diagnostico: '', producto: '', veterinario: '', costo: '', fecha_proximo: '' })
    }
    openSanidad()
  }

  const openPesajeModal = (p = null) => {
    if (p) {
      setEditPesaje(p.id)
      setPesajeForm({
        animal_id: p.animal_id?.toString() || animalId,
        fecha: p.fecha || '',
        peso_kg: p.peso_kg?.toString() || '',
        condicion_corporal: p.condicion_corporal?.toString() || '',
        metodo: p.metodo || '',
      })
    } else {
      setEditPesaje(null)
      setPesajeForm({ animal_id: animalId || '', fecha: new Date().toISOString().split('T')[0], peso_kg: '', condicion_corporal: '', metodo: '' })
    }
    openPesaje()
  }

  const openReproModal = (r = null) => {
    if (r) {
      setEditRepro(r.id)
      setReproForm({
        animal_id: r.animal_id?.toString() || animalId,
        tipo_servicio: r.tipo_servicio || 'monta_natural',
        fecha_servicio: r.fecha_servicio || '',
        resultado: r.resultado || '',
        fecha_parto_estimada: r.fecha_parto_estimada || '',
        observaciones: r.observaciones || '',
        numero_crias: r.numero_crias?.toString() || '',
      })
    } else {
      setEditRepro(null)
      setReproForm({ animal_id: animalId || '', tipo_servicio: 'monta_natural', fecha_servicio: '', resultado: '', fecha_parto_estimada: '', observaciones: '', numero_crias: '' })
    }
    openRepro()
  }

  const sortedPesajes = useMemo(() => [...pesajes].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)), [pesajes])
  const currentWeight = sortedPesajes.length > 0 ? sortedPesajes[sortedPesajes.length - 1].peso_kg : null
  const weight30DaysAgo = useMemo(() => {
    if (sortedPesajes.length === 0) return null
    const refDate = new Date()
    refDate.setDate(refDate.getDate() - 30)
    let closest = null
    let minDiff = Infinity
    for (const p of sortedPesajes) {
      const diff = Math.abs(new Date(p.fecha) - refDate)
      if (diff < minDiff) {
        minDiff = diff
        closest = p
      }
    }
    return closest
  }, [sortedPesajes])
  const weightChange30 = currentWeight && weight30DaysAgo ? currentWeight - weight30DaysAgo.peso_kg : null

  const showLactancias = animal?.especie === 'bovino' || animal?.especie === 'caprino'

  if (!animalId) {
    return (
      <Stack>
        <Title order={3}>Ficha Animal</Title>
        <Paper withBorder p="xl">
          <Stack align="center" gap="md">
            <IconPaw size={48} stroke={1.5} color="gray" />
            <Text c="dimmed">Seleccione un animal para ver su ficha completa</Text>
            <Select
              placeholder="Buscar animal..."
              data={animales.filter(a => a.activo).map(a => ({ value: a.id.toString(), label: `${a.codigo || ''} - ${a.nombre || 'Sin nombre'} (${a.especie || '?'})` }))}
              onChange={v => setSearchParams({ id: v })}
              searchable
              clearable
              style={{ width: 400 }}
            />
          </Stack>
        </Paper>
      </Stack>
    )
  }

  if (loading || !animal) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Button variant="light" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/animales')}>
          Volver a Animales
        </Button>
        <Button variant="light" color="green" leftSection={<IconScan size={16} />} onClick={() => setQrScannerOpened(true)}>
          Escanear
        </Button>
      </Group>

      {/* Header card */}
      <Paper withBorder p="lg" shadow="sm">
        <Group justify="space-between" wrap="wrap">
          <Group gap="xl" wrap="wrap">
            <div>
              <Group gap={4}>
                <Text size="xs" c="dimmed">Código</Text>
                <ActionIcon variant="subtle" color="green" size="sm" onClick={() => setQrGeneratorOpened(true)}>
                  <IconQrcode size={16} />
                </ActionIcon>
              </Group>
              <Text fw={700} size="lg">{animal.codigo || '-'}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Nombre</Text>
              <Text fw={700} size="lg">{animal.nombre || '-'}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Especie</Text>
              <Badge size="lg" variant="light" color="blue">{animal.especie || '-'}</Badge>
            </div>
            <div>
              <Text size="xs" c="dimmed">Raza</Text>
              <Text fw={500}>{razas.find(r => r.id === animal.raza_id)?.nombre || '-'}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Sexo</Text>
              <Badge size="lg" color={animal.sexo === 'H' ? 'pink' : 'blue'}>{animal.sexo === 'H' ? 'Hembra' : 'Macho'}</Badge>
            </div>
            <div>
              <Text size="xs" c="dimmed">Edad</Text>
              <Text fw={500}>{calcularEdad(animal.fecha_nacimiento)}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Peso Actual</Text>
              <Text fw={500}>{currentWeight ? `${formatNumber(currentWeight)} kg` : '-'}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Estado</Text>
              <Badge size="lg" color={animal.activo ? 'green' : 'red'}>{animal.activo ? 'Activo' : 'Inactivo'}</Badge>
            </div>
            <div>
              <Text size="xs" c="dimmed">Origen</Text>
              <Badge size="lg" variant="light" color={animal.estado_origen==='propio'?'blue':animal.estado_origen==='prestamo'?'orange':'grape'}>
                {ESTADOS_ANIMAL.find(e=>e.value===animal.estado_origen)?.label||animal.estado_origen}
              </Badge>
            </div>
            {animal.tiene_chapeta && animal.numero_chapeta && (
              <div>
                <Text size="xs" c="dimmed">Chapeta</Text>
                <Badge size="lg" variant="outline" color="dark">{animal.numero_chapeta}</Badge>
              </div>
            )}
          </Group>
        </Group>
      </Paper>

      {/* Stats row for pesajes */}
      {currentWeight && (
        <SimpleGrid cols={3}>
          <Paper withBorder p="md">
            <Text size="xs" c="dimmed">Peso Actual</Text>
            <Text fw={700} size="xl">{formatNumber(currentWeight)} kg</Text>
          </Paper>
          <Paper withBorder p="md">
            <Text size="xs" c="dimmed">Peso Hace ~30 Días</Text>
            <Text fw={700} size="xl">{weight30DaysAgo ? `${formatNumber(weight30DaysAgo.peso_kg)} kg (${weight30DaysAgo.fecha})` : '-'}</Text>
          </Paper>
          <Paper withBorder p="md">
            <Text size="xs" c="dimmed">Cambio 30 Días</Text>
            <Text fw={700} size="xl" c={weightChange30 > 0 ? 'green' : weightChange30 < 0 ? 'red' : undefined}>
              {weightChange30 !== null ? `${weightChange30 > 0 ? '+' : ''}${formatNumber(weightChange30)} kg` : '-'}
            </Text>
          </Paper>
        </SimpleGrid>
      )}

      {/* Tabs */}
      <Tabs defaultValue="basicos">
        <Tabs.List>
          <Tabs.Tab value="basicos" leftSection={<IconPaw size={16} />}>Datos Básicos</Tabs.Tab>
          <Tabs.Tab value="sanidad" leftSection={<IconStethoscope size={16} />}>Historial Sanitario</Tabs.Tab>
          <Tabs.Tab value="pesajes" leftSection={<IconWeight size={16} />}>Pesajes</Tabs.Tab>
          <Tabs.Tab value="reproduccion" leftSection={<IconHeart size={16} />}>Reproducción</Tabs.Tab>
          {showLactancias && (
            <Tabs.Tab value="lactancias" leftSection={<IconDroplet size={16} />}>Lactancias y Ordeño</Tabs.Tab>
          )}
          <Tabs.Tab value="movimientos" leftSection={<IconTruck size={16} />}>Movimientos</Tabs.Tab>
          <Tabs.Tab value="eventos" leftSection={<IconCalendar size={16} />}>Eventos</Tabs.Tab>
          <Tabs.Tab value="procedimientos" leftSection={<IconVetStethoscope size={16} />}>Procedimientos</Tabs.Tab>
          <Tabs.Tab value="archivos" leftSection={<IconFile size={16} />}>Archivos</Tabs.Tab>
        </Tabs.List>

        {/* Datos Básicos */}
        <Tabs.Panel value="basicos" pt="md">
          <Paper withBorder p="md">
            <Title order={5} mb="md">Datos del Animal</Title>
            <SimpleGrid cols={2}>
              <TextInput label="Código" value={animalForm.codigo || ''} onChange={e => setAnimalForm({ ...animalForm, codigo: e.target.value })} />
              <TextInput label="Nombre" value={animalForm.nombre || ''} onChange={e => setAnimalForm({ ...animalForm, nombre: e.target.value })} />
              <Select label="Especie" data={ESPECIES} value={animalForm.especie || ''} onChange={v => setAnimalForm({ ...animalForm, especie: v })} />
              <Select label="Sexo" data={[{ value: 'H', label: 'Hembra' }, { value: 'M', label: 'Macho' }]} value={animalForm.sexo || ''} onChange={v => setAnimalForm({ ...animalForm, sexo: v })} />
              <Select
                label="Raza"
                data={razas.filter(r => r.especie === animalForm.especie).map(r => ({ value: r.id.toString(), label: r.nombre }))}
                value={animalForm.raza_id?.toString() || ''}
                onChange={v => setAnimalForm({ ...animalForm, raza_id: v ? parseInt(v) : null })}
                clearable
              />
              <Select
                label="Estado"
                data={ESTADOS_ANIMAL}
                value={animalForm.estado_origen || 'propio'}
                onChange={v => setAnimalForm({ ...animalForm, estado_origen: v })}
              />
              <TextInput label="Número Chapeta" value={animalForm.numero_chapeta || ''} onChange={e => setAnimalForm({ ...animalForm, numero_chapeta: e.target.value })} />
              <Switch label="Tiene Chapeta" checked={animalForm.tiene_chapeta || false} onChange={e => setAnimalForm({ ...animalForm, tiene_chapeta: e.currentTarget.checked })} />
              <NumberInput label="Peso (kg)" value={animalForm.peso_kg || ''} onChange={v => setAnimalForm({ ...animalForm, peso_kg: v })} />
              <TextInput label="Color" value={animalForm.color || ''} onChange={e => setAnimalForm({ ...animalForm, color: e.target.value })} />
              <TextInput label="Microchip ID" value={animalForm.microchip_id || ''} onChange={e => setAnimalForm({ ...animalForm, microchip_id: e.target.value })} />
              <TextInput label="Marcas / Hierro" value={animalForm.marcas_hierro || ''} onChange={e => setAnimalForm({ ...animalForm, marcas_hierro: e.target.value })} />
              <TextInput label="Fecha Nacimiento" type="date" value={animalForm.fecha_nacimiento || ''} onChange={e => setAnimalForm({ ...animalForm, fecha_nacimiento: e.target.value })} />
              <TextInput label="Fecha Ingreso" type="date" value={animalForm.fecha_ingreso || ''} onChange={e => setAnimalForm({ ...animalForm, fecha_ingreso: e.target.value })} />
              <Switch label="Activo" checked={animalForm.activo} onChange={e => setAnimalForm({ ...animalForm, activo: e.currentTarget.checked })} />
            </SimpleGrid>
            <Group justify="flex-end" mt="xl">
              <Button leftSection={<IconDeviceFloppy size={16} />} onClick={handleSaveAnimal} loading={savingBasic}>
                Guardar Cambios
              </Button>
            </Group>
          </Paper>
        </Tabs.Panel>

        {/* Historial Sanitario */}
        <Tabs.Panel value="sanidad" pt="md">
          <Group justify="space-between" mb="md">
            <Title order={5}>Historial Sanitario</Title>
            <Button leftSection={<IconPlus size={16} />} onClick={() => openSanidadModal()}>
              Nuevo Evento
            </Button>
          </Group>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Diagnóstico</Table.Th>
                  <Table.Th>Producto</Table.Th>
                  <Table.Th>Veterinario</Table.Th>
                  <Table.Th>Costo</Table.Th>
                  <Table.Th>Próximo Control</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sanidad.map((s) => (
                  <Table.Tr key={s.id}>
                    <Table.Td>{s.fecha}</Table.Td>
                    <Table.Td><Badge color={sanidadTypeColors[s.tipo_evento] || 'gray'} size="sm">{s.tipo_evento}</Badge></Table.Td>
                    <Table.Td>{s.diagnostico || '-'}</Table.Td>
                    <Table.Td>{s.producto || '-'}</Table.Td>
                    <Table.Td>{s.veterinario || '-'}</Table.Td>
                    <Table.Td>{s.costo ? formatCOP(s.costo) : '-'}</Table.Td>
                    <Table.Td>
                      {s.fecha_proximo ? (
                        <Badge color={new Date(s.fecha_proximo) < new Date() ? 'red' : 'green'} size="sm">{s.fecha_proximo}</Badge>
                      ) : '-'}
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon variant="light" color="blue" onClick={() => openSanidadModal(s)}><IconEdit size={16} /></ActionIcon>
                        <ActionIcon variant="light" color="red" onClick={() => handleDeleteSanidad(s.id)}><IconTrash size={16} /></ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {sanidad.length === 0 && (
                  <Table.Tr><Table.Td colSpan={8}><Text c="dimmed" ta="center">Sin eventos sanitarios registrados</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        {/* Pesajes */}
        <Tabs.Panel value="pesajes" pt="md">
          <Group justify="space-between" mb="md">
            <Title order={5}>Registro de Pesajes</Title>
            <Button leftSection={<IconPlus size={16} />} onClick={() => openPesajeModal()}>
              Nuevo Pesaje
            </Button>
          </Group>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Peso (kg)</Table.Th>
                  <Table.Th>Cond. Corporal</Table.Th>
                  <Table.Th>Ganancia Diaria</Table.Th>
                  <Table.Th>Método</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sortedPesajes.map((p, idx) => {
                  const prev = idx > 0 ? sortedPesajes[idx - 1] : null
                  const days = prev ? Math.round((new Date(p.fecha) - new Date(prev.fecha)) / (1000 * 60 * 60 * 24)) : null
                  const dailyGain = days && days > 0 && prev.peso_kg ? (p.peso_kg - prev.peso_kg) / days : null
                  return (
                    <Table.Tr key={p.id}>
                      <Table.Td>{p.fecha}</Table.Td>
                      <Table.Td>{formatNumber(p.peso_kg)}</Table.Td>
                      <Table.Td>{p.condicion_corporal != null ? formatNumber(p.condicion_corporal) : '-'}</Table.Td>
                      <Table.Td>
                        {dailyGain !== null ? (
                          <Text c={dailyGain >= 0 ? 'green' : 'red'} span>
                            {dailyGain > 0 ? '+' : ''}{formatNumber(dailyGain)} kg/día
                          </Text>
                        ) : '-'}
                      </Table.Td>
                      <Table.Td>{p.metodo || '-'}</Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <ActionIcon variant="light" color="blue" onClick={() => openPesajeModal(p)}><IconEdit size={16} /></ActionIcon>
                          <ActionIcon variant="light" color="red" onClick={() => handleDeletePesaje(p.id)}><IconTrash size={16} /></ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
                {sortedPesajes.length === 0 && (
                  <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin pesajes registrados</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        {/* Reproducción */}
        <Tabs.Panel value="reproduccion" pt="md">
          <Group justify="space-between" mb="md">
            <Title order={5}>Historial Reproductivo</Title>
            <Button leftSection={<IconPlus size={16} />} onClick={() => openReproModal()}>
              Nuevo Evento
            </Button>
          </Group>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha Servicio</Table.Th>
                  <Table.Th>Tipo Servicio</Table.Th>
                  <Table.Th>Resultado</Table.Th>
                  <Table.Th>Parto Estimado</Table.Th>
                  <Table.Th>Núm. Crías</Table.Th>
                  <Table.Th>Observaciones</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {reproduccion.map((r) => (
                  <Table.Tr key={r.id}>
                    <Table.Td>{r.fecha_servicio || '-'}</Table.Td>
                    <Table.Td><Badge size="sm" variant="light">{r.tipo_servicio}</Badge></Table.Td>
                    <Table.Td>
                      {r.resultado ? (
                        <Badge color={resultColor(r.resultado)} size="sm">{r.resultado}</Badge>
                      ) : (
                        <Badge color="gray" size="sm">pendiente</Badge>
                      )}
                    </Table.Td>
                    <Table.Td>{r.fecha_parto_estimada || '-'}</Table.Td>
                    <Table.Td>{r.numero_crias || '-'}</Table.Td>
                    <Table.Td>{r.observaciones || '-'}</Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon variant="light" color="blue" onClick={() => openReproModal(r)}><IconEdit size={16} /></ActionIcon>
                        <ActionIcon variant="light" color="red" onClick={() => handleDeleteRepro(r.id)}><IconTrash size={16} /></ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {reproduccion.length === 0 && (
                  <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center">Sin eventos reproductivos</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        {/* Lactancias y Ordeño */}
        {showLactancias && (
          <Tabs.Panel value="lactancias" pt="md">
            <Title order={5} mb="md">Lactancias</Title>
            <Paper withBorder mb="lg">
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Inicio</Table.Th>
                    <Table.Th>Fin</Table.Th>
                    <Table.Th>Días en Leche</Table.Th>
                    <Table.Th>Total Leche (L)</Table.Th>
                    <Table.Th>Promedio Diario</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {lactancias.map((l) => (
                    <Table.Tr key={l.id}>
                      <Table.Td>{l.fecha_inicio || '-'}</Table.Td>
                      <Table.Td>{l.fecha_fin || 'Activa'}</Table.Td>
                      <Table.Td>{l.dias_en_leche ?? '-'}</Table.Td>
                      <Table.Td>{l.total_leche != null ? formatNumber(l.total_leche) : '-'}</Table.Td>
                      <Table.Td>{l.promedio_diario != null ? formatNumber(l.promedio_diario) : '-'}</Table.Td>
                    </Table.Tr>
                  ))}
                  {lactancias.length === 0 && (
                    <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center">Sin lactancias registradas</Text></Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>

            <Title order={5} mb="md">Ordeños</Title>
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Turno</Table.Th>
                    <Table.Th>Cantidad (L)</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {ordenos.map((o) => (
                    <Table.Tr key={o.id}>
                      <Table.Td>{o.fecha || '-'}</Table.Td>
                      <Table.Td>{o.turno || '-'}</Table.Td>
                      <Table.Td>{o.cantidad_litros != null ? formatNumber(o.cantidad_litros) : '-'}</Table.Td>
                    </Table.Tr>
                  ))}
                  {ordenos.length === 0 && (
                    <Table.Tr><Table.Td colSpan={3}><Text c="dimmed" ta="center">Sin ordeños registrados</Text></Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>
        )}

        {/* Movimientos */}
        <Tabs.Panel value="movimientos" pt="md">
          <Title order={5} mb="md">Historial de Movimientos</Title>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Origen</Table.Th>
                  <Table.Th>Destino</Table.Th>
                  <Table.Th>Motivo</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {movimientos.map((m) => (
                  <Table.Tr key={m.id}>
                    <Table.Td>{m.fecha || '-'}</Table.Td>
                    <Table.Td><Badge size="sm" variant="light">{m.tipo || '-'}</Badge></Table.Td>
                    <Table.Td>{m.origen || '-'}</Table.Td>
                    <Table.Td>{m.destino || '-'}</Table.Td>
                    <Table.Td>{m.motivo || '-'}</Table.Td>
                  </Table.Tr>
                ))}
                {movimientos.length === 0 && (
                  <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center">Sin movimientos registrados</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        {/* Eventos */}
        <Tabs.Panel value="eventos" pt="md">
          <Title order={5} mb="md">Todos los Eventos</Title>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Diagnóstico</Table.Th>
                  <Table.Th>Costo</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {eventos.map((e) => (
                  <Table.Tr key={e.id}>
                    <Table.Td>{e.fecha}</Table.Td>
                    <Table.Td><Badge size="sm">{e.tipo_evento}</Badge></Table.Td>
                    <Table.Td>{e.diagnostico || '-'}</Table.Td>
                    <Table.Td>{e.costo ? formatCOP(e.costo) : '-'}</Table.Td>
                  </Table.Tr>
                ))}
                {eventos.length === 0 && (
                  <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center">Sin eventos registrados</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        {/* Archivos */}
        <Tabs.Panel value="archivos" pt="md">
          <Group justify="space-between" mb="md">
            <Title order={5}>Archivos</Title>
            <Button leftSection={<IconUpload size={16} />} onClick={() => document.getElementById('archivo-input').click()}>
              Subir Archivo
            </Button>
            <input id="archivo-input" type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleUploadArchivo} />
          </Group>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nombre</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {archivos.map(a => (
                  <Table.Tr key={a.id}>
                    <Table.Td>{a.nombre}</Table.Td>
                    <Table.Td><Badge size="sm" variant="light">{a.tipo}</Badge></Table.Td>
                    <Table.Td>{a.fecha}</Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon variant="light" color="blue" onClick={() => handleDownloadArchivo(a)}><IconDownload size={16} /></ActionIcon>
                        <ActionIcon variant="light" color="red" onClick={() => handleDeleteArchivo(a.id)}><IconTrash size={16} /></ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {archivos.length === 0 && (
                  <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center">Sin archivos subidos</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="procedimientos" pt="md">
          <Stack align="center" py="xl" gap="md">
            <IconVetStethoscope size={48} color="var(--mantine-color-green-6)" />
            <Text ta="center" size="lg" fw={500}>Procedimientos Veterinarios</Text>
            <Text ta="center" size="sm" c="dimmed">
              Acceda al módulo de procedimientos para ver el historial completo de este animal.
            </Text>
            <Button
              size="lg"
              leftSection={<IconHistory size={20} />}
              onClick={() => navigate(`/procedimientos-veterinarios?animal_id=${animalId}`)}
            >
              Ver Historial de Procedimientos
            </Button>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Modal Sanidad */}
      <Modal opened={sanidadOpened} onClose={closeSanidad} title={editSanidad ? 'Editar Evento Sanitario' : 'Nuevo Evento Sanitario'} size="lg">
        <SimpleGrid cols={2}>
          <Select
            label="Tipo Evento"
            data={[
              { value: 'vacunacion', label: 'Vacunación' },
              { value: 'desparasitacion', label: 'Desparasitación' },
              { value: 'enfermedad', label: 'Enfermedad' },
              { value: 'tratamiento', label: 'Tratamiento' },
              { value: 'control', label: 'Control' },
            ]}
            value={sanidadForm.tipo_evento}
            onChange={v => setSanidadForm({ ...sanidadForm, tipo_evento: v })}
          />
          <TextInput label="Fecha" type="date" value={sanidadForm.fecha} onChange={e => setSanidadForm({ ...sanidadForm, fecha: e.target.value })} required />
          <TextInput label="Diagnóstico" value={sanidadForm.diagnostico} onChange={e => setSanidadForm({ ...sanidadForm, diagnostico: e.target.value })} />
          <TextInput label="Producto" value={sanidadForm.producto} onChange={e => setSanidadForm({ ...sanidadForm, producto: e.target.value })} />
          <TextInput label="Veterinario" value={sanidadForm.veterinario} onChange={e => setSanidadForm({ ...sanidadForm, veterinario: e.target.value })} />
          <TextInput label="Próximo Control" type="date" value={sanidadForm.fecha_proximo} onChange={e => setSanidadForm({ ...sanidadForm, fecha_proximo: e.target.value })} />
          <NumberInput label="Costo" value={sanidadForm.costo} onChange={v => setSanidadForm({ ...sanidadForm, costo: v })} prefix="$ " min={0} />
        </SimpleGrid>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={closeSanidad}>Cancelar</Button>
          <Button onClick={handleSanidadSubmit}>{editSanidad ? 'Actualizar' : 'Guardar'}</Button>
        </Group>
      </Modal>

      {/* Modal Pesaje */}
      <Modal opened={pesajeOpened} onClose={closePesaje} title={editPesaje ? 'Editar Pesaje' : 'Nuevo Pesaje'} size="md">
        <SimpleGrid cols={2}>
          <TextInput label="Fecha" type="date" value={pesajeForm.fecha} onChange={e => setPesajeForm({ ...pesajeForm, fecha: e.target.value })} required />
          <NumberInput label="Peso (kg)" value={pesajeForm.peso_kg} onChange={v => setPesajeForm({ ...pesajeForm, peso_kg: v })} required min={0} step={0.1} />
          <NumberInput label="Condición Corporal (1-5)" value={pesajeForm.condicion_corporal} onChange={v => setPesajeForm({ ...pesajeForm, condicion_corporal: v })} min={1} max={5} step={0.5} />
          <TextInput label="Método" value={pesajeForm.metodo} onChange={e => setPesajeForm({ ...pesajeForm, metodo: e.target.value })} placeholder="Báscula, Cinta, etc." />
        </SimpleGrid>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={closePesaje}>Cancelar</Button>
          <Button onClick={handlePesajeSubmit}>{editPesaje ? 'Actualizar' : 'Guardar'}</Button>
        </Group>
      </Modal>

      {/* Modal Reproducción */}
      <Modal opened={reproOpened} onClose={closeRepro} title={editRepro ? 'Editar Evento Reproductivo' : 'Nuevo Evento Reproductivo'} size="md">
        <SimpleGrid cols={2}>
          <Select
            label="Tipo Servicio"
            data={[
              { value: 'monta_natural', label: 'Monta Natural' },
              { value: 'inseminacion_artificial', label: 'Inseminación Artificial' },
              { value: 'transferencia_embrion', label: 'Transferencia Embrionaria' },
            ]}
            value={reproForm.tipo_servicio}
            onChange={v => setReproForm({ ...reproForm, tipo_servicio: v })}
          />
          <TextInput label="Fecha Servicio" type="date" value={reproForm.fecha_servicio} onChange={e => setReproForm({ ...reproForm, fecha_servicio: e.target.value })} required />
          <Select
            label="Resultado"
            data={[
              { value: 'preñada', label: 'Preñada' },
              { value: 'vacia', label: 'Vacía' },
              { value: 'dudosa', label: 'Dudosa' },
            ]}
            value={reproForm.resultado}
            onChange={v => setReproForm({ ...reproForm, resultado: v })}
            clearable
          />
          <TextInput label="Parto Estimado" type="date" value={reproForm.fecha_parto_estimada} onChange={e => setReproForm({ ...reproForm, fecha_parto_estimada: e.target.value })} />
          <NumberInput label="Número de Crías" value={reproForm.numero_crias} onChange={v => setReproForm({ ...reproForm, numero_crias: v })} min={0} />
          <TextInput label="Observaciones" value={reproForm.observaciones} onChange={e => setReproForm({ ...reproForm, observaciones: e.target.value })} />
        </SimpleGrid>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={closeRepro}>Cancelar</Button>
          <Button onClick={handleReproSubmit}>{editRepro ? 'Actualizar' : 'Guardar'}</Button>
        </Group>
      </Modal>

      <QRGenerator opened={qrGeneratorOpened} onClose={() => setQrGeneratorOpened(false)} animal={animal} />
      <QRScanner opened={qrScannerOpened} onClose={() => setQrScannerOpened(false)} />
    </Stack>
  )
}
