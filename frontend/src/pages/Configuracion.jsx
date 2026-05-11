import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, ActionIcon, Stack, Tabs,
  SimpleGrid, Text, Switch, FileInput,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPlus, IconEdit, IconTrash, IconBuilding,
  IconUsers, IconSettings, IconDatabaseExport, IconDeviceFloppy,
  IconUpload, IconMap,
} from '@tabler/icons-react'
import api from '../services/api.js'

const ROLES = [
  { value: '1', label: 'Administrador' },
  { value: '2', label: 'Veterinario' },
  { value: '3', label: 'Agrónomo' },
  { value: '4', label: 'Operario' },
  { value: '5', label: 'Financiero' },
  { value: '6', label: 'Invitado' },
]

const ROL_COLORS = { 1: 'red', 2: 'blue', 3: 'green', 4: 'orange', 5: 'violet', 6: 'gray' }

function TabFinca() {
  const [finca, setFinca] = useState({
    id: null, nombre: '', direccion: '', ciudad: '', departamento: '',
    latitud: '', longitud: '', area_total: '', telefono: '',
  })
  const [lotesCount, setLotesCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [kmlFile, setKmlFile] = useState(null)

  useEffect(() => {
    api.get('/lotes/fincas/').then(r => {
      const data = Array.isArray(r.data) && r.data.length > 0 ? r.data[0] : {}
      setFinca({
        id: data.id || null,
        nombre: data.nombre || '',
        direccion: data.direccion || '',
        ciudad: data.ciudad || '',
        departamento: data.departamento || '',
        latitud: data.latitud ?? '',
        longitud: data.longitud ?? '',
        area_total: data.area_total ?? '',
        telefono: data.telefono || '',
      })
      setLotesCount(data.lotes_count || data.lotes?.length || 0)
    }).catch(() => {
      setFinca(prev => ({ ...prev }))
    })
  }, [])

  const handleSave = async () => {
    if (!finca.id) {
      notifications.show({ title: 'Error', message: 'No hay finca registrada para actualizar', color: 'red' })
      return
    }
    setLoading(true)
    try {
      const payload = {}
      for (const k of ['nombre', 'direccion', 'ciudad', 'departamento', 'latitud', 'longitud', 'area_total', 'telefono']) {
        payload[k] = finca[k]
      }
      await api.put(`/lotes/fincas/${finca.id}`, payload)
      notifications.show({ title: 'Finca actualizada', message: 'Los datos de la finca se guardaron correctamente', color: 'green' })
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error al guardar la finca', color: 'red' })
    }
    setLoading(false)
  }

  const setField = (field) => (value) => setFinca({ ...finca, [field]: value ?? '' })

  return (
    <Stack>
      <Title order={4}>Información de la Finca</Title>
      <Paper withBorder p="md">
        <Text size="sm" c="dimmed" mb="md">
          {lotesCount > 0 ? `Lotes registrados: ${lotesCount}` : 'No hay lotes registrados'}
        </Text>
        <SimpleGrid cols={2}>
          <TextInput label="Nombre" value={finca.nombre} onChange={e => setField('nombre')(e.target.value)} required />
          <TextInput label="Teléfono" value={finca.telefono} onChange={e => setField('telefono')(e.target.value)} />
          <TextInput label="Dirección" value={finca.direccion} onChange={e => setField('direccion')(e.target.value)} />
          <TextInput label="Ciudad" value={finca.ciudad} onChange={e => setField('ciudad')(e.target.value)} />
          <TextInput label="Departamento" value={finca.departamento} onChange={e => setField('departamento')(e.target.value)} />
          <NumberInput label="Área Total (ha)" value={finca.area_total || ''} onChange={v => setField('area_total')(v)} hideControls />
          <TextInput label="Latitud" value={finca.latitud} onChange={e => setField('latitud')(e.target.value)} />
          <TextInput label="Longitud" value={finca.longitud} onChange={e => setField('longitud')(e.target.value)} />
        </SimpleGrid>
        <Group justify="flex-end" mt="xl">
          <Button onClick={handleSave} loading={loading} leftSection={<IconDeviceFloppy size={16} />}>Guardar Cambios</Button>
        </Group>
      </Paper>

      <Title order={5}>Carga de Lotes por KML/KMZ</Title>
      <Paper withBorder p="md">
        <Group>
          <FileInput
            placeholder="Seleccionar archivo KML o KMZ"
            accept=".kml,.kmz"
            leftSection={<IconMap size={16} />}
            value={kmlFile}
            onChange={setKmlFile}
            clearable
            style={{ flex: 1 }}
          />
          <Button leftSection={<IconUpload size={16} />} disabled={!kmlFile} variant="light">
            Cargar Lotes
          </Button>
        </Group>
        <Text size="xs" c="dimmed" mt="xs">Funcionalidad en desarrollo. La carga automática de lotes estará disponible próximamente.</Text>
      </Paper>
    </Stack>
  )
}

function TabUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [opened, { open, close }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', password: '', rol_id: '4', activo: true,
  })

  const loadData = () => {
    api.get('/auth/usuarios').then(r => {
      setUsuarios(Array.isArray(r.data) ? r.data : [])
    }).catch(() => {
      setUsuarios([])
    })
  }
  useEffect(loadData, [])

  const handleSubmit = async () => {
    try {
      const payload = {}
      for (const k of ['nombre', 'apellido', 'email', 'password', 'rol_id']) {
        if (k === 'password' && editando && !form.password) continue
        payload[k] = form[k]
      }
      payload.activo = form.activo

      if (editando) {
        await api.put(`/auth/usuarios/${editando}`, payload)
        notifications.show({ title: 'Usuario actualizado', message: 'Los datos del usuario se actualizaron correctamente', color: 'green' })
      } else {
        await api.post('/auth/register', payload)
        notifications.show({ title: 'Usuario creado', message: 'El usuario se registró correctamente', color: 'green' })
      }
      close()
      setEditando(null)
      setForm({ nombre: '', apellido: '', email: '', password: '', rol_id: '4', activo: true })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || err.response?.data?.message || 'Error al procesar la solicitud', color: 'red' })
    }
  }

  const handleEdit = (u) => {
    setEditando(u.id)
    setForm({
      nombre: u.nombre || '',
      apellido: u.apellido || '',
      email: u.email || '',
      password: '',
      rol_id: u.rol_id?.toString() || u.rol?.toString() || '4',
      activo: u.activo !== undefined ? u.activo : true,
    })
    open()
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/auth/usuarios/${id}`)
      notifications.show({ title: 'Usuario eliminado', color: 'red' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error al eliminar el usuario', color: 'red' })
    }
  }

  const handleToggleActivo = async (u) => {
    try {
      await api.patch(`/auth/usuarios/${u.id}`, { activo: !u.activo })
      notifications.show({ title: u.activo ? 'Usuario desactivado' : 'Usuario activado', color: 'green' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error al cambiar el estado', color: 'red' })
    }
  }

  const getRolLabel = (rol) => {
    const r = ROLES.find(r => r.value === rol?.toString())
    return r ? r.label : rol
  }

  const getRolColor = (rol) => ROL_COLORS[rol?.toString()] || 'gray'

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Gestión de Usuarios</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setForm({ nombre: '', apellido: '', email: '', password: '', rol_id: '4', activo: true }); open() }}>
          Nuevo Usuario
        </Button>
      </Group>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Rol</Table.Th>
              <Table.Th>Activo</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {usuarios.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td fw={500}>{u.nombre} {u.apellido}</Table.Td>
                <Table.Td>{u.email}</Table.Td>
                <Table.Td><Badge color={getRolColor(u.rol_id || u.rol)} size="sm">{getRolLabel(u.rol_id || u.rol)}</Badge></Table.Td>
                <Table.Td>
                  <Switch
                    size="sm"
                    checked={u.activo}
                    onChange={() => handleToggleActivo(u)}
                    aria-label="Activo"
                  />
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <ActionIcon variant="light" color="blue" onClick={() => handleEdit(u)}><IconEdit size={16} /></ActionIcon>
                    <ActionIcon variant="light" color="red" onClick={() => handleDelete(u.id)}><IconTrash size={16} /></ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {usuarios.length === 0 && (
              <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center">Sin usuarios registrados</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title={editando ? 'Editar Usuario' : 'Nuevo Usuario'} size="md">
        <SimpleGrid cols={2}>
          <TextInput label="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
          <TextInput label="Apellido" value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} required />
          <TextInput label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required type="email" />
          <TextInput label="Contraseña" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="password" required={!editando} />
          <Select label="Rol" data={ROLES} value={form.rol_id} onChange={v => setForm({ ...form, rol_id: v })} required />
          <Switch label="Usuario activo" checked={form.activo} onChange={e => setForm({ ...form, activo: e.currentTarget.checked })} mt="md" />
        </SimpleGrid>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editando ? 'Actualizar' : 'Crear'}</Button>
        </Group>
      </Modal>
    </Stack>
  )
}

function TabParametros() {
  const [params, setParams] = useState([])

  useEffect(() => {
    api.get('/parametros/').then(r => {
      if (Array.isArray(r.data)) {
        setParams(r.data.map(p => ({ ...p, editValue: p.valor })))
      }
    }).catch(() => {
      setParams([])
    })
  }, [])

  const handleSave = async (p) => {
    try {
      await api.put(`/parametros/${p.id}`, { valor: p.editValue })
      notifications.show({ title: 'Parámetro actualizado', color: 'green' })
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error al guardar', color: 'red' })
    }
  }

  return (
    <Stack>
      <Title order={4}>Parámetros del Sistema</Title>
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Parámetro</Table.Th>
              <Table.Th>Valor</Table.Th>
              <Table.Th>Descripción</Table.Th>
              <Table.Th>Acción</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {params.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td fw={500}>{p.nombre}</Table.Td>
                <Table.Td>
                  <TextInput
                    size="xs"
                    value={p.editValue || ''}
                    onChange={e => setParams(params.map(x => x.id === p.id ? { ...x, editValue: e.target.value } : x))}
                  />
                </Table.Td>
                <Table.Td>{p.descripcion || '-'}</Table.Td>
                <Table.Td>
                  <Button size="xs" variant="light" onClick={() => handleSave(p)}>
                    Guardar
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
            {params.length === 0 && (
              <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center">Sin parámetros configurados</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}

function TabBackups() {
  const [loading, setLoading] = useState(false)

  const handleExport = () => {
    setLoading(true)
    notifications.show({ title: 'Exportación', message: 'Funcionalidad en desarrollo. Próximamente disponible.', color: 'blue' })
    setLoading(false)
  }

  return (
    <Stack>
      <Title order={4}>Respaldo de Base de Datos</Title>
      <Paper withBorder p="lg">
        <Group>
          <IconDatabaseExport size={40} color="var(--mantine-color-blue-6)" />
          <div>
            <Text fw={600}>Exportar Base de Datos</Text>
            <Text size="sm" c="dimmed">Descargue una copia completa de la base de datos del sistema.</Text>
          </div>
        </Group>
        <Group mt="md">
          <Button onClick={handleExport} loading={loading} leftSection={<IconDatabaseExport size={16} />}>
            Exportar Base de Datos
          </Button>
        </Group>
      </Paper>

      <Paper withBorder p="lg">
        <Group>
          <IconSettings size={40} color="var(--mantine-color-gray-6)" />
          <div>
            <Text fw={600}>Restaurar Base de Datos</Text>
            <Text size="sm" c="dimmed">Restaure una copia de seguridad previamente exportada. (Próximamente)</Text>
          </div>
        </Group>
        <Group mt="md">
          <Button variant="light" disabled leftSection={<IconDatabaseExport size={16} />}>
            Restaurar
          </Button>
        </Group>
      </Paper>
    </Stack>
  )
}

export default function Configuracion() {
  return (
    <Stack>
      <Title order={3}>Configuración</Title>

      <Tabs defaultValue="finca">
        <Tabs.List>
          <Tabs.Tab value="finca" leftSection={<IconBuilding size={16} />}>Finca</Tabs.Tab>
          <Tabs.Tab value="usuarios" leftSection={<IconUsers size={16} />}>Usuarios</Tabs.Tab>
          <Tabs.Tab value="parametros" leftSection={<IconSettings size={16} />}>Parámetros</Tabs.Tab>
          <Tabs.Tab value="backups" leftSection={<IconDatabaseExport size={16} />}>Backups</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="finca" pt="md"><TabFinca /></Tabs.Panel>
        <Tabs.Panel value="usuarios" pt="md"><TabUsuarios /></Tabs.Panel>
        <Tabs.Panel value="parametros" pt="md"><TabParametros /></Tabs.Panel>
        <Tabs.Panel value="backups" pt="md"><TabBackups /></Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
