import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, ActionIcon, Stack, Tabs,
  Text, Textarea, PasswordInput, SimpleGrid, Card,
  Pagination, Switch, Code,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPlus, IconEdit, IconTrash, IconUsers,
  IconHistory, IconHeartbeat, IconBrain, IconRefresh,
  IconChevronDown, IconChevronRight,
  IconDeviceFloppy, IconCheck, IconX,
} from '@tabler/icons-react'
import api from '../services/api.js'

function TabUsuariosRoles() {
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [fincas, setFincas] = useState([])
  const [editUser, setEditUser] = useState(null)
  const [userOpened, { open: openUser, close: closeUser }] = useDisclosure(false)
  const [roleOpened, { open: openRole, close: closeRole }] = useDisclosure(false)
  const [userForm, setUserForm] = useState({
    email: '', password: '', nombre: '', apellido: '', rol_id: '', finca_id: '',
  })
  const [roleForm, setRoleForm] = useState({ nombre: '', descripcion: '' })

  const loadUsuarios = () => {
    api.get('/usuarios/').then(r => setUsuarios(Array.isArray(r.data) ? r.data : [])).catch(() => setUsuarios([]))
  }
  const loadRoles = () => {
    api.get('/roles/').then(r => setRoles(Array.isArray(r.data) ? r.data : [])).catch(() => setRoles([]))
  }
  const loadFincas = () => {
    api.get('/lotes/fincas/').then(r => setFincas(Array.isArray(r.data) ? r.data : [])).catch(() => setFincas([]))
  }

  useEffect(() => { loadUsuarios(); loadRoles(); loadFincas() }, [])

  const openNewUser = () => {
    setEditUser(null)
    setUserForm({ email: '', password: '', nombre: '', apellido: '', rol_id: '', finca_id: '' })
    openUser()
  }
  const openEditUser = (u) => {
    setEditUser(u.id)
    setUserForm({
      email: u.email || '',
      password: '',
      nombre: u.nombre || '',
      apellido: u.apellido || '',
      rol_id: u.rol_id?.toString() || '',
      finca_id: u.finca_id?.toString() || '',
    })
    openUser()
  }

  const handleUserSubmit = async () => {
    try {
      const payload = { ...userForm }
      if (!payload.password && editUser) delete payload.password
      if (editUser) {
        await api.put(`/usuarios/${editUser}`, payload)
        notifications.show({ title: 'Usuario actualizado', color: 'green' })
      } else {
        await api.post('/usuarios/', payload)
        notifications.show({ title: 'Usuario creado', color: 'green' })
      }
      closeUser()
      loadUsuarios()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error al procesar', color: 'red' })
    }
  }

  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/usuarios/${id}`)
      notifications.show({ title: 'Usuario eliminado', color: 'red' })
      loadUsuarios()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error al eliminar', color: 'red' })
    }
  }

  const handleToggleActivo = async (u) => {
    try {
      await api.put(`/usuarios/${u.id}`, { activo: !u.activo })
      loadUsuarios()
    } catch (err) {
      notifications.show({ title: 'Error', color: 'red' })
    }
  }

  const handleRoleSubmit = async () => {
    try {
      await api.post('/roles/', roleForm)
      notifications.show({ title: 'Rol creado', color: 'green' })
      closeRole()
      setRoleForm({ nombre: '', descripcion: '' })
      loadRoles()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error al crear rol', color: 'red' })
    }
  }

  const rolData = roles.map(r => ({ value: r.id.toString(), label: r.nombre }))
  const fincaData = fincas.map(f => ({ value: f.id.toString(), label: f.nombre }))

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Usuarios</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openNewUser}>Nuevo Usuario</Button>
      </Group>
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Email</Table.Th>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Apellido</Table.Th>
              <Table.Th>Rol</Table.Th>
              <Table.Th>Finca</Table.Th>
              <Table.Th>Activo</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {usuarios.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td>{u.email}</Table.Td>
                <Table.Td fw={500}>{u.nombre}</Table.Td>
                <Table.Td>{u.apellido}</Table.Td>
                <Table.Td><Badge size="sm" variant="light">{u.rol_nombre || u.rol_id}</Badge></Table.Td>
                <Table.Td>{u.finca_nombre || '-'}</Table.Td>
                <Table.Td>
                  <Switch size="sm" checked={u.activo} onChange={() => handleToggleActivo(u)} />
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <ActionIcon variant="light" color="blue" onClick={() => openEditUser(u)}><IconEdit size={16} /></ActionIcon>
                    <ActionIcon variant="light" color="red" onClick={() => handleDeleteUser(u.id)}><IconTrash size={16} /></ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {usuarios.length === 0 && (
              <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center">Sin usuarios</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={userOpened} onClose={closeUser} title={editUser ? 'Editar Usuario' : 'Nuevo Usuario'} size="md">
        <SimpleGrid cols={2}>
          <TextInput label="Email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
          <TextInput label="Contraseña" type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required={!editUser} />
          <TextInput label="Nombre" value={userForm.nombre} onChange={e => setUserForm({ ...userForm, nombre: e.target.value })} required />
          <TextInput label="Apellido" value={userForm.apellido} onChange={e => setUserForm({ ...userForm, apellido: e.target.value })} />
          <Select label="Rol" data={rolData} value={userForm.rol_id} onChange={v => setUserForm({ ...userForm, rol_id: v })} required searchable />
          <Select label="Finca" data={fincaData} value={userForm.finca_id} onChange={v => setUserForm({ ...userForm, finca_id: v })} clearable searchable />
        </SimpleGrid>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={closeUser}>Cancelar</Button>
          <Button onClick={handleUserSubmit}>{editUser ? 'Actualizar' : 'Crear'}</Button>
        </Group>
      </Modal>

      <Group justify="space-between" mt="lg">
        <Title order={4}>Roles</Title>
        <Button leftSection={<IconPlus size={16} />} variant="light" onClick={() => { setRoleForm({ nombre: '', descripcion: '' }); openRole() }}>Nuevo Rol</Button>
      </Group>
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Descripción</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {roles.map(r => (
              <Table.Tr key={r.id}>
                <Table.Td fw={500}>{r.nombre}</Table.Td>
                <Table.Td>{r.descripcion || '-'}</Table.Td>
              </Table.Tr>
            ))}
            {roles.length === 0 && (
              <Table.Tr><Table.Td colSpan={2}><Text c="dimmed" ta="center">Sin roles</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={roleOpened} onClose={closeRole} title="Nuevo Rol" size="sm">
        <Stack>
          <TextInput label="Nombre" value={roleForm.nombre} onChange={e => setRoleForm({ ...roleForm, nombre: e.target.value })} required />
          <Textarea label="Descripción" value={roleForm.descripcion} onChange={e => setRoleForm({ ...roleForm, descripcion: e.target.value })} />
        </Stack>
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={closeRole}>Cancelar</Button>
          <Button onClick={handleRoleSubmit}>Crear</Button>
        </Group>
      </Modal>
    </Stack>
  )
}

function TabAuditoria() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState({})
  const perPage = 20
  const [filters, setFilters] = useState({
    fecha_desde: '', fecha_hasta: '', tabla: '', accion: '',
  })
  const [tablas, setTablas] = useState([])

  const loadData = () => {
    const params = new URLSearchParams()
    params.set('page', page)
    params.set('per_page', perPage)
    if (filters.fecha_desde) params.set('fecha_desde', filters.fecha_desde)
    if (filters.fecha_hasta) params.set('fecha_hasta', filters.fecha_hasta)
    if (filters.tabla) params.set('tabla', filters.tabla)
    if (filters.accion) params.set('accion', filters.accion)
    api.get(`/auditoria/?${params.toString()}`).then(r => {
      setData(Array.isArray(r.data.data) ? r.data.data : [])
      setTotal(r.data.total || 0)
      const t = [...new Set((r.data.data || []).map(d => d.tabla).filter(Boolean))]
      setTablas(prev => prev.length ? prev : t)
    }).catch(() => setData([]))
  }

  useEffect(() => { loadData() }, [page])

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  const accionColor = { INSERT: 'green', UPDATE: 'blue', DELETE: 'red', LOGIN: 'gray', LOGOUT: 'orange' }

  return (
    <Stack>
      <Title order={4}>Logs de Auditoría</Title>
      <Paper withBorder p="sm">
        <Group gap="sm">
          <TextInput label="Fecha desde" type="date" size="xs" value={filters.fecha_desde}
            onChange={e => setFilters({ ...filters, fecha_desde: e.target.value })} />
          <TextInput label="Fecha hasta" type="date" size="xs" value={filters.fecha_hasta}
            onChange={e => setFilters({ ...filters, fecha_hasta: e.target.value })} />
          <Select label="Tabla" size="xs" data={tablas.map(t => ({ value: t, label: t }))}
            value={filters.tabla} onChange={v => setFilters({ ...filters, tabla: v })} clearable searchable />
          <Select label="Acción" size="xs" data={[
            { value: 'INSERT', label: 'INSERT' },
            { value: 'UPDATE', label: 'UPDATE' },
            { value: 'DELETE', label: 'DELETE' },
          ]} value={filters.accion} onChange={v => setFilters({ ...filters, accion: v })} clearable />
          <Button size="xs" mt="xl" onClick={() => { setPage(1); loadData() }}>Filtrar</Button>
        </Group>
      </Paper>
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Usuario</Table.Th>
              <Table.Th>Acción</Table.Th>
              <Table.Th>Tabla</Table.Th>
              <Table.Th>Registro ID</Table.Th>
              <Table.Th>Cambios</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((r) => (
              <>
                <Table.Tr key={r.id}>
                  <Table.Td>{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</Table.Td>
                  <Table.Td>{r.usuario_nombre || `ID: ${r.usuario_id}`}</Table.Td>
                  <Table.Td>
                    <Badge size="sm" color={accionColor[r.accion] || 'gray'}>{r.accion}</Badge>
                  </Table.Td>
                  <Table.Td>{r.tabla}</Table.Td>
                  <Table.Td>{r.registro_id ?? '-'}</Table.Td>
                  <Table.Td>
                    {(r.datos_prev || r.datos_nuevo) && (
                      <ActionIcon variant="light" size="sm" onClick={() => toggleExpand(r.id)}>
                        {expanded[r.id] ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                      </ActionIcon>
                    )}
                  </Table.Td>
                </Table.Tr>
                {expanded[r.id] && (
                  <Table.Tr key={`${r.id}-det`}>
                    <Table.Td colSpan={6}>
                      <Paper withBorder p="sm" bg="gray.0">
                        <SimpleGrid cols={2} spacing="xs">
                          {r.datos_prev && (
                            <div>
                              <Text size="xs" fw={700} c="red">Datos Anteriores</Text>
                              <Code block style={{ whiteSpace: 'pre-wrap', fontSize: 11 }}>
                                {JSON.stringify(r.datos_prev, null, 2)}
                              </Code>
                            </div>
                          )}
                          {r.datos_nuevo && (
                            <div>
                              <Text size="xs" fw={700} c="green">Datos Nuevos</Text>
                              <Code block style={{ whiteSpace: 'pre-wrap', fontSize: 11 }}>
                                {JSON.stringify(r.datos_nuevo, null, 2)}
                              </Code>
                            </div>
                          )}
                        </SimpleGrid>
                      </Paper>
                    </Table.Td>
                  </Table.Tr>
                )}
              </>
            ))}
            {data.length === 0 && (
              <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">Sin registros</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
      {totalPages > 1 && (
        <Group justify="center" mt="sm">
          <Pagination total={totalPages} value={page} onChange={setPage} />
        </Group>
      )}
    </Stack>
  )
}

function TabDiagnostico() {
  const [diag, setDiag] = useState(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostico = async () => {
    setLoading(true)
    try {
      const r = await api.get('/diagnostico/')
      setDiag(r.data)
    } catch {
      notifications.show({ title: 'Error', message: 'No se pudo ejecutar el diagnóstico', color: 'red' })
    }
    setLoading(false)
  }

  useEffect(() => { runDiagnostico() }, [])

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Diagnóstico del Sistema</Title>
        <Button leftSection={<IconRefresh size={16} />} onClick={runDiagnostico} loading={loading}>
          Ejecutar Diagnóstico
        </Button>
      </Group>
      {diag && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          <Card withBorder padding="md">
            <Group gap="xs">
              {diag.db_status === 'OK' ? <IconCheck size={24} color="green" /> : <IconX size={24} color="red" />}
              <div>
                <Text size="xs" c="dimmed">Conexión BD</Text>
                <Text fw={700} size="lg" c={diag.db_status === 'OK' ? 'green' : 'red'}>{diag.db_status}</Text>
              </div>
            </Group>
          </Card>
          <Card withBorder padding="md">
            <Text size="xs" c="dimmed">Total Tablas en BD</Text>
            <Text fw={700} size="lg">{diag.total_tablas}</Text>
          </Card>
          <Card withBorder padding="md">
            <Text size="xs" c="dimmed">Versión API</Text>
            <Text fw={700} size="lg">{diag.api_version}</Text>
          </Card>
          {diag.conteos && Object.entries(diag.conteos).map(([tbl, count]) => (
            <Card key={tbl} withBorder padding="md">
              <Text size="xs" c="dimmed" tt="capitalize">{tbl}</Text>
              <Text fw={700} size="lg">{count}</Text>
            </Card>
          ))}
          <Card withBorder padding="md">
            <Text size="xs" c="dimmed">Usuarios</Text>
            <Text fw={700} size="lg">{diag.usuarios_activos} / {diag.usuarios_total} activos</Text>
          </Card>
          <Card withBorder padding="md">
            <Text size="xs" c="dimmed">Último Log Auditoría</Text>
            <Text size="sm">{diag.ultima_auditoria ? new Date(diag.ultima_auditoria).toLocaleString() : 'N/A'}</Text>
          </Card>
        </SimpleGrid>
      )}
    </Stack>
  )
}

function TabConfigIA() {
  const [config, setConfig] = useState({
    api_key: '', modelo: '', url_base: '', temperatura: 0.7, max_tokens: 2048,
  })
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/config-ia/').then(r => setConfig(r.data)).catch(() => {})
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.put('/config-ia/', config)
      notifications.show({ title: 'Configuración IA guardada', color: 'green' })
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error al guardar', color: 'red' })
    }
    setLoading(false)
  }

  return (
    <Stack>
      <Title order={4}>Configuración IA</Title>
      <Paper withBorder p="md" maw={600}>
        <Stack>
          <PasswordInput
            label="API Key"
            value={config.api_key}
            onChange={e => setConfig({ ...config, api_key: e.target.value })}
            visible={showKey}
            onVisibilityChange={setShowKey}
          />
          <TextInput label="Modelo por defecto" value={config.modelo}
            onChange={e => setConfig({ ...config, modelo: e.target.value })} />
          <TextInput label="URL Base" value={config.url_base}
            onChange={e => setConfig({ ...config, url_base: e.target.value })} />
          <NumberInput label="Temperatura" value={config.temperatura} min={0} max={2} step={0.1}
            onChange={v => setConfig({ ...config, temperatura: v || 0 })} />
          <NumberInput label="Max Tokens" value={config.max_tokens} min={1} step={1}
            onChange={v => setConfig({ ...config, max_tokens: v || 2048 })} />
          <Group justify="flex-end" mt="md">
            <Button leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave} loading={loading}>
              Guardar Configuración
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  )
}

export default function AdminSistema() {
  return (
    <Stack>
      <Title order={3}>Administración del Sistema</Title>
      <Tabs defaultValue="usuarios">
        <Tabs.List>
          <Tabs.Tab value="usuarios" leftSection={<IconUsers size={16} />}>Usuarios y Roles</Tabs.Tab>
          <Tabs.Tab value="auditoria" leftSection={<IconHistory size={16} />}>Logs de Auditoría</Tabs.Tab>
          <Tabs.Tab value="diagnostico" leftSection={<IconHeartbeat size={16} />}>Diagnóstico del Sistema</Tabs.Tab>
          <Tabs.Tab value="config-ia" leftSection={<IconBrain size={16} />}>Configuración IA</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="usuarios" pt="md"><TabUsuariosRoles /></Tabs.Panel>
        <Tabs.Panel value="auditoria" pt="md"><TabAuditoria /></Tabs.Panel>
        <Tabs.Panel value="diagnostico" pt="md"><TabDiagnostico /></Tabs.Panel>
        <Tabs.Panel value="config-ia" pt="md"><TabConfigIA /></Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
