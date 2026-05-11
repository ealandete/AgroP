import { useEffect, useState } from 'react'
import {
  Paper, Title, Group, Button, Text, Stack, SimpleGrid, Card,
  Table, Badge, Modal, Loader, Alert,
} from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import { notifications } from '@mantine/notifications'
import {
  IconFileSpreadsheet, IconDownload, IconUpload, IconBrandGoogleDrive,
  IconCheck, IconX, IconAlertCircle, IconHistory,
} from '@tabler/icons-react'
import api from '../services/api.js'

const TEMPLATES = [
  { key: 'animales', label: 'Animales', desc: 'Carga masiva de animales', color: 'blue' },
  { key: 'siembras', label: 'Siembras', desc: 'Registro de siembras en lotes', color: 'green' },
  { key: 'lotes', label: 'Lotes', desc: 'Creación de lotes/potreros', color: 'orange' },
  { key: 'insumos', label: 'Insumos', desc: 'Catálogo de insumos', color: 'grape' },
  { key: 'inventario', label: 'Inventario', desc: 'Movimientos de inventario', color: 'teal' },
]

export default function Plantillas() {
  const [uploading, setUploading] = useState(null)
  const [results, setResults] = useState(null)
  const [history, setHistory] = useState([])
  const [historyOpened, setHistoryOpened] = useState(false)
  const [driveModalOpened, setDriveModalOpened] = useState(false)
  const [driveFileId, setDriveFileId] = useState('')
  const [driveTipo, setDriveTipo] = useState('animales')
  const openRefs = {}

  useEffect(() => {
    api.get('/templates/upload-history').then(r => setHistory(r.data)).catch(() => {})
  }, [])

  const descargar = async (tipo) => {
    try {
      const r = await api.get(`/templates/${tipo}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([r.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `plantilla_${tipo}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      notifications.show({ title: 'Plantilla descargada', color: 'green' })
    } catch {
      notifications.show({ title: 'Error al descargar', color: 'red' })
    }
  }

  const cargar = async (tipo, file) => {
    if (!file) return
    setUploading(tipo)
    setResults(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const r = await api.post(`/templates/upload/${tipo}`, form)
      setResults(r.data)
      notifications.show({
        title: 'Carga completada',
        message: `${r.data.creados} creados, ${r.data.errores?.length || 0} errores`,
        color: r.data.errores?.length > 0 ? 'yellow' : 'green',
      })
      api.get('/templates/upload-history').then(res => setHistory(res.data)).catch(() => {})
    } catch (err) {
      notifications.show({
        title: 'Error al cargar',
        message: err.response?.data?.detail || 'Error',
        color: 'red',
      })
    } finally {
      setUploading(null)
    }
  }

  const handleDriveImport = async () => {
    try {
      const r = await api.post(`/templates/google-drive/import?fileId=${driveFileId}&tipo=${driveTipo}`)
      notifications.show({ title: 'Importación simulada', message: r.data.message, color: 'green' })
      setDriveModalOpened(false)
      setDriveFileId('')
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Plantillas para Carga Masiva</Title>
        <Group>
          <Button
            variant="light"
            leftSection={<IconBrandGoogleDrive size={16} />}
            onClick={() => setDriveModalOpened(true)}
          >
            Google Drive
          </Button>
          <Button
            variant="light"
            leftSection={<IconHistory size={16} />}
            onClick={() => setHistoryOpened(true)}
          >
            Historial
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {TEMPLATES.map(t => {
          const openRef = (el) => { openRefs[t.key] = el }
          const isUploading = uploading === t.key
          return (
            <Card key={t.key} withBorder padding="md" radius="md" shadow="sm">
              <Group gap="xs" mb="sm">
                <IconFileSpreadsheet size={24} color={`var(--mantine-color-${t.color}-6)`} />
                <div>
                  <Text fw={600} size="md">{t.label}</Text>
                  <Text size="xs" c="dimmed">{t.desc}</Text>
                </div>
              </Group>

              <Stack gap="xs">
                <Button
                  variant="light"
                  color={t.color}
                  leftSection={<IconDownload size={16} />}
                  onClick={() => descargar(t.key)}
                  fullWidth
                  size="sm"
                >
                  Descargar Plantilla Excel
                </Button>

                <Dropzone
                  onDrop={(files) => cargar(t.key, files[0])}
                  accept={['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']}
                  loading={isUploading}
                  openRef={openRef}
                  maxSize={10 * 1024 ** 2}
                  style={{ borderStyle: 'dashed', borderWidth: 2, padding: '12px', cursor: 'pointer' }}
                >
                  <Group justify="center" gap="xs" style={{ pointerEvents: 'none' }}>
                    {isUploading ? (
                      <Loader size="sm" />
                    ) : (
                      <IconUpload size={20} color="var(--mantine-color-dimmed)" />
                    )}
                    <Text size="xs" c="dimmed">
                      {isUploading ? 'Procesando...' : 'Arrastra o haz clic para subir'}
                    </Text>
                  </Group>
                </Dropzone>

                <Button
                  variant="filled"
                  color={t.color}
                  leftSection={<IconUpload size={16} />}
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.xlsx,.xls'
                    input.onchange = (e) => {
                      if (e.target.files[0]) cargar(t.key, e.target.files[0])
                    }
                    input.click()
                  }}
                  fullWidth
                  size="sm"
                  disabled={isUploading}
                >
                  Cargar archivo
                </Button>
              </Stack>

              {results && uploading === null && (
                <Paper withBorder p="xs" mt="sm" bg={results.errores?.length > 0 ? 'yellow.0' : 'green.0'}>
                  <Text size="xs" fw={500}>
                    {results.creados > 0 && (
                      <Group gap={4}>
                        <IconCheck size={14} color="green" />
                        {results.creados} creados
                      </Group>
                    )}
                    {results.errores?.length > 0 && (
                      <Group gap={4} mt={4}>
                        <IconX size={14} color="red" />
                        {results.errores.length} errores
                      </Group>
                    )}
                  </Text>
                  {results.errores?.length > 0 && (
                    <Text size="xs" c="red" mt={4}>
                      {results.errores.slice(0, 3).join('; ')}
                    </Text>
                  )}
                </Paper>
              )}
            </Card>
          )
        })}
      </SimpleGrid>

      <Modal opened={historyOpened} onClose={() => setHistoryOpened(false)} title="Historial de Cargas" size="lg">
        {history.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">No hay cargas registradas</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Archivo</Table.Th>
                <Table.Th>Creados</Table.Th>
                <Table.Th>Errores</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {history.slice().reverse().map((h, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{new Date(h.timestamp).toLocaleString('es-CO')}</Table.Td>
                  <Table.Td>
                    <Badge size="sm">{h.tipo}</Badge>
                  </Table.Td>
                  <Table.Td>{h.filename}</Table.Td>
                  <Table.Td>
                    <Badge color="green">{h.creados}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={h.errores?.length > 0 ? 'red' : 'gray'}>
                      {h.errores?.length || 0}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Modal>

      <Modal opened={driveModalOpened} onClose={() => setDriveModalOpened(false)} title="Importar desde Google Drive" size="md">
        <Stack>
          <Alert icon={<IconAlertCircle size={16} />} color="blue">
            Funcionalidad simulada. En producción se integraría con la API de Google Drive.
          </Alert>
          <Button
            variant="outline"
            leftSection={<IconBrandGoogleDrive size={16} />}
            onClick={async () => {
              try {
                const r = await api.get('/templates/google-drive/auth-url')
                notifications.show({ title: 'URL de autorización', message: r.data.auth_url, color: 'blue' })
              } catch {
                notifications.show({ title: 'Error', color: 'red' })
              }
            }}
            fullWidth
          >
            Conectar Google Drive
          </Button>

          <Text size="sm" fw={500} mt="sm">Importar archivo por ID</Text>
          <Group>
            <input
              placeholder="File ID de Google Drive"
              value={driveFileId}
              onChange={e => setDriveFileId(e.target.value)}
              style={{
                flex: 1, padding: '8px 12px', border: '1px solid var(--mantine-color-gray-3)',
                borderRadius: 'var(--mantine-radius-sm)', fontSize: 14,
              }}
            />
          </Group>
          <select
            value={driveTipo}
            onChange={e => setDriveTipo(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', border: '1px solid var(--mantine-color-gray-3)',
              borderRadius: 'var(--mantine-radius-sm)', fontSize: 14,
            }}
          >
            {TEMPLATES.map(t => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          <Button
            onClick={handleDriveImport}
            disabled={!driveFileId}
            leftSection={<IconUpload size={16} />}
          >
            Importar desde Drive
          </Button>
        </Stack>
      </Modal>
    </Stack>
  )
}
