import { useEffect, useState } from 'react'
import {
  Paper, Title, Group, Button, Table, Badge, Stack,
  SimpleGrid, Text, Modal, Select, Progress, Alert,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconDatabase, IconDownload, IconRestore, IconAlertTriangle,
  IconRefresh, IconUpload, IconFileCode, IconCalendarEvent,
  IconCheck, IconX,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import api from '../services/api.js'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function Backup() {
  const [backups, setBackups] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [creando, setCreando] = useState(false)
  const [progress, setProgress] = useState(0)
  const [restoreId, setRestoreId] = useState(null)
  const [restoreName, setRestoreName] = useState('')
  const [opened, { open, close }] = useDisclosure(false)
  const [frecuencia, setFrecuencia] = useState('nunca')

  const loadStats = async () => {
    try {
      const r = await api.get('/backup/estadisticas')
      setStats(r.data)
    } catch { setStats(null) }
  }

  const loadBackups = async () => {
    setLoading(true)
    try {
      const r = await api.get('/backup/listar')
      setBackups(Array.isArray(r.data) ? r.data : [])
    } catch { setBackups([]) }
    setLoading(false)
  }

  const loadSchedule = async () => {
    try {
      const r = await api.get('/backup/programacion')
      setFrecuencia(r.data?.frecuencia || 'nunca')
    } catch { setFrecuencia('nunca') }
  }

  useEffect(() => { loadStats(); loadBackups(); loadSchedule() }, [])

  const crearBackup = async () => {
    setCreando(true)
    setProgress(30)
    try {
      const r = await api.post('/backup/crear')
      setProgress(100)
      notifications.show({ title: 'Backup creado', message: r.data.mensaje, color: 'green' })
      loadBackups()
      loadStats()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error al crear backup', color: 'red' })
    }
    setCreando(false)
    setTimeout(() => setProgress(0), 2000)
  }

  const descargarBackup = (filename) => {
    const token = localStorage.getItem('access_token')
    const url = `${API_BASE}/api/backup/descargar/${filename}`
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    if (token) {
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.blob())
        .then(blob => {
          const url2 = URL.createObjectURL(blob)
          const a2 = document.createElement('a')
          a2.href = url2
          a2.download = filename
          a2.click()
          URL.revokeObjectURL(url2)
        })
        .catch(() => notifications.show({ title: 'Error', message: 'No se pudo descargar', color: 'red' }))
    } else {
      a.click()
    }
  }

  const confirmarRestaurar = (id, name) => {
    setRestoreId(id)
    setRestoreName(name)
    open()
  }

  const restaurarBackup = async () => {
    if (!restoreId) return
    try {
      const r = await api.post(`/backup/restaurar/${restoreId}`)
      notifications.show({ title: 'Restaurado', message: r.data.mensaje, color: 'green' })
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error al restaurar', color: 'red' })
    }
    close()
  }

  const exportarJSON = async () => {
    const token = localStorage.getItem('access_token')
    const url = `${API_BASE}/api/backup/export/datos-completos`
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const blob = await res.blob()
      const url2 = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url2
      a.download = `agrop_datos_${dayjs().format('YYYYMMDD')}.json`
      a.click()
      URL.revokeObjectURL(url2)
      notifications.show({ title: 'Exportado', message: 'Datos exportados correctamente', color: 'green' })
    } catch {
      notifications.show({ title: 'Error', message: 'Error al exportar', color: 'red' })
    }
  }

  const guardarProgramacion = async (val) => {
    setFrecuencia(val)
    try {
      await api.post('/backup/programar', { frecuencia: val })
      notifications.show({ title: 'Programación guardada', color: 'green' })
    } catch { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const estadoColor = (estado) => {
    if (estado === 'completado') return 'green'
    if (estado === 'fallido') return 'red'
    if (estado === 'en_proceso') return 'yellow'
    return 'gray'
  }

  const estadoLabel = (estado) => {
    if (estado === 'completado') return 'Completado'
    if (estado === 'fallido') return 'Fallido'
    if (estado === 'en_proceso') return 'En Proceso'
    return estado
  }

  return (
    <Stack>
      <Title order={3}>Respaldos y Exportación</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <Paper p="md" radius="md" withBorder>
          <Group>
            <IconDatabase size={28} color="var(--mantine-color-blue-6)" />
            <div>
              <Text size="xs" c="dimmed">Último Backup</Text>
              <Text size="sm" fw={700}>
                {stats?.ultimo_backup ? dayjs(stats.ultimo_backup).format('DD/MM/YYYY HH:mm') : 'Sin backups'}
              </Text>
            </div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group>
            <IconUpload size={28} color="var(--mantine-color-teal-6)" />
            <div>
              <Text size="xs" c="dimmed">Tamaño Total</Text>
              <Text size="sm" fw={700}>{stats?.tamano_total || '0 B'}</Text>
            </div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group>
            <IconFileCode size={28} color="var(--mantine-color-grape-6)" />
            <div>
              <Text size="xs" c="dimmed">Tablas Respaldadas</Text>
              <Text size="sm" fw={700}>{stats?.tablas_respaldadas || 0}</Text>
            </div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group>
            {stats?.estado_ultimo === 'completado'
              ? <IconCheck size={28} color="var(--mantine-color-green-6)" />
              : <IconX size={28} color="var(--mantine-color-gray-6)" />
            }
            <div>
              <Text size="xs" c="dimmed">Estado</Text>
              <Badge color={stats?.estado_ultimo === 'completado' ? 'green' : 'gray'}>
                {stats?.estado_ultimo === 'completado' ? 'Respaldo OK' : 'Sin respaldo'}
              </Badge>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      <Group>
        <Button
          leftSection={<IconDatabase size={16} />}
          onClick={crearBackup}
          loading={creando}
        >
          Crear Backup Ahora
        </Button>
        <Button
          leftSection={<IconFileCode size={16} />}
          variant="light"
          onClick={exportarJSON}
        >
          Exportar Datos Completo
        </Button>
        <Button
          leftSection={<IconRefresh size={16} />}
          variant="default"
          onClick={() => { loadBackups(); loadStats() }}
        >
          Refrescar
        </Button>
      </Group>

      {creando && progress > 0 && (
        <Progress value={progress} color="green" animated size="sm" />
      )}

      <Paper withBorder>
        <Title order={5} p="md" pb={0}>Respaldos Disponibles</Title>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Tamaño</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {backups.map(b => (
              <Table.Tr key={b.id}>
                <Table.Td>
                  <Text size="sm">{dayjs(b.fecha).format('DD/MM/YYYY HH:mm')}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color="blue" size="sm" variant="light">
                    {b.tipo === 'completo' ? 'Completo' : b.tipo}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{b.tamano}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={estadoColor(b.estado)} size="sm">
                    {estadoLabel(b.estado)}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <Button
                      size="xs"
                      variant="light"
                      color="blue"
                      leftSection={<IconDownload size={14} />}
                      onClick={() => descargarBackup(b.filename)}
                      disabled={b.estado !== 'completado'}
                    >
                      Descargar
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      leftSection={<IconRestore size={14} />}
                      onClick={() => confirmarRestaurar(b.id, b.filename)}
                      disabled={b.estado !== 'completado'}
                    >
                      Restaurar
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {backups.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed" ta="center" py="xl">No hay backups disponibles</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Paper withBorder p="md">
        <Group justify="space-between">
          <Group>
            <IconCalendarEvent size={24} color="var(--mantine-color-blue-6)" />
            <div>
              <Text fw={500}>Programar Backup Automático</Text>
              <Text size="xs" c="dimmed">Seleccione la frecuencia para backups automáticos</Text>
            </div>
          </Group>
          <Select
            data={[
              { value: 'nunca', label: 'Nunca' },
              { value: 'diario', label: 'Diario' },
              { value: 'semanal', label: 'Semanal' },
              { value: 'mensual', label: 'Mensual' },
            ]}
            value={frecuencia}
            onChange={guardarProgramacion}
            w={160}
          />
        </Group>
      </Paper>

      <Modal
        opened={opened}
        onClose={close}
        title="Restaurar Backup"
        size="md"
      >
        <Alert icon={<IconAlertTriangle size={16} />} color="red" mb="md">
          ¿Está seguro de restaurar este backup? Todos los datos actuales se perderán.
        </Alert>
        <Text size="sm" mb="md">
          Backup: <strong>{restoreName}</strong>
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button color="red" onClick={restaurarBackup}>Confirmar Restauración</Button>
        </Group>
      </Modal>
    </Stack>
  )
}
