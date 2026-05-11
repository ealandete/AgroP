import { useEffect, useState, useMemo } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, MultiSelect, Badge, ActionIcon, Stack, SimpleGrid,
  Text, Checkbox, Loader, Center, Card,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPlus, IconEdit, IconTrash, IconEye, IconUsersGroup,
  IconArrowLeft, IconDownload, IconUpload,
} from '@tabler/icons-react'
import api from '../services/api.js'

const TIPOS_GRUPO = [
  { value: 'sanitario', label: 'Sanitario', color: 'red' },
  { value: 'alimentacion', label: 'Alimentación', color: 'orange' },
  { value: 'reproduccion', label: 'Reproducción', color: 'pink' },
  { value: 'cuarentena', label: 'Cuarentena', color: 'yellow' },
  { value: 'engorde', label: 'Engorde', color: 'blue' },
]

export default function GruposManejo() {
  const [grupos, setGrupos] = useState([])
  const [animales, setAnimales] = useState([])
  const [loading, setLoading] = useState(false)
  const [opened, { open, close }] = useDisclosure(false)
  const [verAnimalesOpened, { open: openVerAnimales, close: closeVerAnimales }] = useDisclosure(false)
  const [asignarOpened, { open: openAsignar, close: closeAsignar }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [selectedGrupo, setSelectedGrupo] = useState(null)
  const [form, setForm] = useState({ nombre: '', tipo: 'sanitario', descripcion: '' })
  const [asignarForm, setAsignarForm] = useState({ grupo_id: '', animal_ids: [] })
  const [selectedAnimales, setSelectedAnimales] = useState([])

  const loadData = () => {
    setLoading(true)
    Promise.all([
      api.get('/grupos-manejo/'),
      api.get('/animales/'),
    ]).then(([gRes, aRes]) => {
      setGrupos(gRes.data)
      setAnimales(aRes.data)
    }).catch(() => {
      notifications.show({ title: 'Error al cargar datos', color: 'red' })
    }).finally(() => setLoading(false))
  }
  useEffect(loadData, [])

  const totalGrupos = grupos.length
  const animalesAgrupados = animales.filter(a => a.grupo_manejo_id).length
  const gruposActivos = grupos.filter(g => g.activo !== false).length

  const getAnimalCount = (groupId) => animales.filter(a => a.grupo_manejo_id === groupId).length

  const animalesEnGrupo = useMemo(() => {
    if (!selectedGrupo) return []
    return animales.filter(a => a.grupo_manejo_id === selectedGrupo.id)
  }, [selectedGrupo, animales])

  const animalesSinGrupo = useMemo(() =>
    animales.filter(a => !a.grupo_manejo_id),
    [animales]
  )

  const handleSubmit = async () => {
    try {
      if (editando) {
        await api.put(`/grupos-manejo/${editando}`, form)
        notifications.show({ title: 'Grupo actualizado', color: 'green' })
      } else {
        await api.post('/grupos-manejo/', form)
        notifications.show({ title: 'Grupo creado', color: 'green' })
      }
      close()
      setEditando(null)
      setForm({ nombre: '', tipo: 'sanitario', descripcion: '' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const openEdit = (grupo) => {
    setEditando(grupo.id)
    setForm({ nombre: grupo.nombre, tipo: grupo.tipo, descripcion: grupo.descripcion || '' })
    open()
  }

  const openNew = () => {
    setEditando(null)
    setForm({ nombre: '', tipo: 'sanitario', descripcion: '' })
    open()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este grupo?')) return
    try {
      await api.delete(`/grupos-manejo/${id}`)
      notifications.show({ title: 'Grupo eliminado', color: 'green' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleVerAnimales = (grupo) => {
    setSelectedGrupo(grupo)
    setSelectedAnimales([])
    openVerAnimales()
  }

  const handleRemoveAnimales = async () => {
    if (selectedAnimales.length === 0) return
    try {
      await Promise.all(selectedAnimales.map(id => api.put(`/animales/${id}`, { grupo_manejo_id: null })))
      notifications.show({ title: `${selectedAnimales.length} animales removidos del grupo`, color: 'green' })
      setSelectedAnimales([])
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleBulkAssign = async () => {
    if (!asignarForm.grupo_id || asignarForm.animal_ids.length === 0) return
    try {
      await Promise.all(asignarForm.animal_ids.map(id => api.put(`/animales/${id}`, { grupo_manejo_id: parseInt(asignarForm.grupo_id) })))
      notifications.show({ title: `${asignarForm.animal_ids.length} animales asignados al grupo`, color: 'green' })
      closeAsignar()
      setAsignarForm({ grupo_id: '', animal_ids: [] })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  if (loading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Grupos de Manejo</Title>
        <Group>
          <Button
            leftSection={<IconDownload size={16} />} variant="light" color="teal"
            onClick={async () => {
              try {
                const r = await api.get('/templates/download/grupos-asignacion', { responseType: 'blob' })
                const url = window.URL.createObjectURL(new Blob([r.data]))
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', 'plantilla_asignacion_grupos.xlsx')
                document.body.appendChild(link)
                link.click()
                link.remove()
                window.URL.revokeObjectURL(url)
                notifications.show({ title: 'Plantilla descargada', color: 'green' })
              } catch {
                notifications.show({ title: 'Error al descargar', color: 'red' })
              }
            }}
          >
            Descargar plantilla
          </Button>
          <Button
            leftSection={<IconUpload size={16} />} variant="light" color="blue"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.xlsx,.xls'
              input.onchange = async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const form = new FormData()
                form.append('file', file)
                try {
                  const r = await api.post('/templates/upload/grupos-asignacion', form)
                  notifications.show({
                    title: 'Carga completada',
                    message: `${r.data.asignados} asignados, ${r.data.errores?.length || 0} errores`,
                    color: r.data.errores?.length > 0 ? 'yellow' : 'green',
                  })
                  loadData()
                } catch (err) {
                  notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
                }
              }
              input.click()
            }}
          >
            Cargar asignación masiva
          </Button>
          <Button leftSection={<IconPlus size={16} />} variant="light" onClick={() => {
            setAsignarForm({ grupo_id: '', animal_ids: [] })
            openAsignar()
          }}>
            Asignar Animales
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={openNew}>
            Nuevo Grupo
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Card withBorder padding="md" radius="md">
          <Text size="xs" c="dimmed">Total Grupos</Text>
          <Text fw={700} size="xl">{totalGrupos}</Text>
        </Card>
        <Card withBorder padding="md" radius="md">
          <Text size="xs" c="dimmed">Animales Agrupados</Text>
          <Text fw={700} size="xl">{animalesAgrupados}</Text>
        </Card>
        <Card withBorder padding="md" radius="md">
          <Text size="xs" c="dimmed">Grupos Activos</Text>
          <Text fw={700} size="xl">{gruposActivos}</Text>
        </Card>
      </SimpleGrid>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Descripción</Table.Th>
              <Table.Th># Animales</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th style={{ width: 180 }}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {grupos.map(g => {
              const tipoInfo = TIPOS_GRUPO.find(t => t.value === g.tipo)
              return (
                <Table.Tr key={g.id}>
                  <Table.Td fw={500}>{g.nombre}</Table.Td>
                  <Table.Td>
                    <Badge color={tipoInfo?.color || 'gray'} size="sm">
                      {tipoInfo?.label || g.tipo}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{g.descripcion || '-'}</Table.Td>
                  <Table.Td>{getAnimalCount(g.id)}</Table.Td>
                  <Table.Td>
                    <Badge color={g.activo !== false ? 'green' : 'red'} size="sm">
                      {g.activo !== false ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <ActionIcon variant="light" color="blue" onClick={() => openEdit(g)}>
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon variant="light" color="red" onClick={() => handleDelete(g.id)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                      <ActionIcon variant="light" color="teal" onClick={() => handleVerAnimales(g)}>
                        <IconEye size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )
            })}
            {grupos.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed" ta="center">Sin grupos registrados</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title={editando ? 'Editar Grupo' : 'Nuevo Grupo'} size="md">
        <Stack>
          <TextInput
            label="Nombre"
            value={form.nombre}
            onChange={e => setForm({ ...form, nombre: e.target.value })}
            required
          />
          <Select
            label="Tipo"
            data={TIPOS_GRUPO}
            value={form.tipo}
            onChange={v => setForm({ ...form, tipo: v || 'sanitario' })}
          />
          <TextInput
            label="Descripción"
            value={form.descripcion}
            onChange={e => setForm({ ...form, descripcion: e.target.value })}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editando ? 'Guardar' : 'Crear'}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={verAnimalesOpened}
        onClose={closeVerAnimales}
        title={`Animales en: ${selectedGrupo?.nombre || ''}`}
        size="lg"
      >
        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 40 }}>
                  <Checkbox
                    checked={animalesEnGrupo.length > 0 && selectedAnimales.length === animalesEnGrupo.length}
                    indeterminate={selectedAnimales.length > 0 && selectedAnimales.length < animalesEnGrupo.length}
                    onChange={() => {
                      if (selectedAnimales.length === animalesEnGrupo.length) {
                        setSelectedAnimales([])
                      } else {
                        setSelectedAnimales(animalesEnGrupo.map(a => a.id))
                      }
                    }}
                  />
                </Table.Th>
                <Table.Th>Código</Table.Th>
                <Table.Th>Nombre</Table.Th>
                <Table.Th>Especie</Table.Th>
                <Table.Th>Estado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {animalesEnGrupo.map(a => (
                <Table.Tr key={a.id}>
                  <Table.Td>
                    <Checkbox
                      checked={selectedAnimales.includes(a.id)}
                      onChange={() => {
                        setSelectedAnimales(prev =>
                          prev.includes(a.id) ? prev.filter(id => id !== a.id) : [...prev, a.id]
                        )
                      }}
                    />
                  </Table.Td>
                  <Table.Td fw={500}>{a.codigo || '-'}</Table.Td>
                  <Table.Td>{a.nombre || '-'}</Table.Td>
                  <Table.Td>{a.especie || '-'}</Table.Td>
                  <Table.Td>
                    <Badge color={a.activo ? 'green' : 'red'} size="sm">
                      {a.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
              {animalesEnGrupo.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text c="dimmed" ta="center">No hay animales en este grupo</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>
        {selectedAnimales.length > 0 && (
          <Group justify="flex-end" mt="md">
            <Button color="red" leftSection={<IconTrash size={16} />} onClick={handleRemoveAnimales}>
              Remover {selectedAnimales.length} seleccionados
            </Button>
          </Group>
        )}
      </Modal>

      <Modal
        opened={asignarOpened}
        onClose={closeAsignar}
        title="Asignar Animales a Grupo"
        size="lg"
      >
        <Stack>
          <Select
            label="Grupo"
            placeholder="Seleccione un grupo"
            data={grupos.map(g => ({ value: g.id.toString(), label: g.nombre }))}
            value={asignarForm.grupo_id}
            onChange={v => setAsignarForm({ ...asignarForm, grupo_id: v || '' })}
            searchable
            required
          />
          <MultiSelect
            label="Animales"
            placeholder="Seleccione animales"
            data={animalesSinGrupo.map(a => ({
              value: a.id.toString(),
              label: `${a.codigo || ''} - ${a.nombre || 'Sin nombre'} (${a.especie || '?'})`,
            }))}
            value={asignarForm.animal_ids}
            onChange={v => setAsignarForm({ ...asignarForm, animal_ids: v })}
            searchable
            clearable
            required
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeAsignar}>Cancelar</Button>
            <Button
              onClick={handleBulkAssign}
              disabled={!asignarForm.grupo_id || asignarForm.animal_ids.length === 0}
            >
              Asignar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
