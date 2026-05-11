import { useEffect, useState } from 'react'
import {
  Paper, Title, Group, Button, Stack, SimpleGrid, Text, Badge,
  Card, Select, TextInput, Table, FileInput, Divider, Alert,
  Modal, Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPig, IconPlant, IconCoin, IconMap, IconFileReport,
  IconFileTypePdf, IconFileSpreadsheet, IconFileTypeCsv,
  IconUpload, IconCheck, IconX, IconHistory,
  IconCalendar, IconFilter,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import api from '../services/api.js'

const REPORTES = [
  {
    key: 'animales', label: 'Animales', icon: IconPig, color: 'green',
    desc: 'Inventario agrupado por especie con conteos',
    pdfUrl: '/api/export/pdf/reporte-animales',
    excelUrl: '/api/export/excel/animales',
    csvUrl: '/api/export/csv/animales',
    hasEspecie: true,
  },
  {
    key: 'cultivos', label: 'Cultivos', icon: IconPlant, color: 'teal',
    desc: 'Siembras activas, rendimientos y cosechas',
    pdfUrl: '/api/export/pdf/reporte-cultivos',
    excelUrl: '/api/export/excel/siembras',
    csvUrl: '/api/export/csv/siembras',
    hasDateRange: false,
  },
  {
    key: 'lotes', label: 'Lotes', icon: IconMap, color: 'lime',
    desc: 'Uso de lotes, áreas, suelos y riego',
    pdfUrl: '/api/export/pdf/reporte-lotes',
    excelUrl: '/api/export/excel/lotes',
    csvUrl: '/api/export/csv/lotes',
    hasDateRange: false,
  },
  {
    key: 'financiero', label: 'Financiero', icon: IconCoin, color: 'blue',
    desc: 'Estado de resultados: ingresos vs gastos',
    pdfUrl: '/api/export/pdf/reporte-financiero',
    excelUrl: '/api/export/excel/ventas',
    csvUrl: '/api/export/csv/ventas',
    hasDateRange: true,
  },
  {
    key: 'completo', label: 'Reporte Completo', icon: IconFileReport, color: 'grape',
    desc: 'Informe general de toda la finca',
    pdfUrl: '/api/export/pdf/reporte-completo',
    excelUrl: '/api/export/excel/reporte-completo',
    hasDateRange: true,
  },
]

export default function Exportar() {
  const [fincas, setFincas] = useState([])
  const [filtroFinca, setFiltroFinca] = useState('')
  const [selectedReporte, setSelectedReporte] = useState(null)
  const [filtroEspecie, setFiltroEspecie] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [animalFile, setAnimalFile] = useState(null)
  const [siembraFile, setSiembraFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [generationLog, setGenerationLog] = useState([])
  const [logOpened, { open: openLog, close: closeLog }] = useDisclosure(false)

  useEffect(() => {
    api.get('/lotes/fincas/').then(r => setFincas(r.data)).catch(() => {})
    const log = JSON.parse(localStorage.getItem('agrop_report_log') || '[]')
    setGenerationLog(log)
  }, [])

  const addToLog = (tipo, formato) => {
    const entry = { tipo, formato, fecha: new Date().toISOString(), usuario: localStorage.getItem('agrop_user') || '-' }
    const log = [entry, ...generationLog].slice(0, 50)
    setGenerationLog(log)
    localStorage.setItem('agrop_report_log', JSON.stringify(log))
  }

  const handleDownload = (url, tipo, formato) => {
    const params = new URLSearchParams()
    if (filtroEspecie && tipo === 'animales') params.set('especie', filtroEspecie)
    const report = REPORTES.find(r => r.key === tipo)
    if (report?.hasDateRange && desde) params.set('desde', desde)
    if (report?.hasDateRange && hasta) params.set('hasta', hasta)
    const qs = params.toString()
    const fullUrl = qs ? `${url}?${qs}` : url
    window.open(fullUrl, '_blank')
    addToLog(tipo, formato)
  }

  const handleImportAnimales = async () => {
    if (!animalFile) return
    setImporting(true)
    setImportResult(null)
    try {
      const fd = new FormData()
      fd.append('file', animalFile)
      const { data } = await api.post('/export/importar/animales', fd)
      setImportResult(data)
      if (data.success) {
        notifications.show({ title: 'Importacion completada', message: `${data.created} animales creados`, color: 'green' })
      }
    } catch (err) {
      setImportResult({ success: false, error: err.response?.data?.detail || 'Error de conexion' })
    } finally {
      setImporting(false)
      setAnimalFile(null)
    }
  }

  const handleImportSiembras = async () => {
    if (!siembraFile) return
    setImporting(true)
    setImportResult(null)
    try {
      const fd = new FormData()
      fd.append('file', siembraFile)
      const { data } = await api.post('/export/importar/siembras', fd)
      setImportResult(data)
      if (data.success) {
        notifications.show({ title: 'Importacion completada', message: `${data.created} siembras creadas`, color: 'green' })
      }
    } catch (err) {
      setImportResult({ success: false, error: err.response?.data?.detail || 'Error de conexion' })
    } finally {
      setImporting(false)
      setSiembraFile(null)
    }
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Centro de Reportes</Title>
        <Button
          variant="light"
          leftSection={<IconHistory size={16} />}
          onClick={openLog}
        >
          Historial
        </Button>
      </Group>
      <Text c="dimmed">Genere reportes PDF, exporte datos a Excel/CSV o importe informacion desde archivos.</Text>

      {/* Filtros globales */}
      <Paper withBorder p="sm">
        <Group wrap="wrap" gap="sm">
          <Select
            placeholder="Finca"
            data={fincas.map(f => ({ value: f.id.toString(), label: f.nombre }))}
            value={filtroFinca}
            onChange={setFiltroFinca}
            clearable
            w={200}
            leftSection={<IconFilter size={14} />}
          />
          <Select
            placeholder="Filtrar por especie"
            data={['bovino','bufalino','porcino','aviar','caprino','ovino','equino']}
            value={filtroEspecie}
            onChange={setFiltroEspecie}
            clearable
            w={170}
            leftSection={<IconFilter size={14} />}
          />
          <TextInput
            type="date"
            placeholder="Desde"
            value={desde}
            onChange={e => setDesde(e.target.value)}
            w={160}
            leftSection={<IconCalendar size={14} />}
          />
          <TextInput
            type="date"
            placeholder="Hasta"
            value={hasta}
            onChange={e => setHasta(e.target.value)}
            w={160}
            leftSection={<IconCalendar size={14} />}
          />
        </Group>
      </Paper>

      {/* Reportes PDF */}
      <Title order={4}>Reportes PDF</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {REPORTES.map((r) => {
          const Icon = r.icon
          return (
            <Card
              key={r.key}
              withBorder
              padding="md"
              radius="md"
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedReporte(r.key === selectedReporte ? null : r.key)}
              bg={selectedReporte === r.key ? `${r.color}.0` : undefined}
            >
              <Group mb="sm">
                <Icon size={32} color={`var(--mantine-color-${r.color}-7)`} />
                <div style={{ flex: 1 }}>
                  <Text fw={600}>{r.label}</Text>
                  <Text size="xs" c="dimmed">{r.desc}</Text>
                </div>
              </Group>

              {selectedReporte === r.key && (
                <Stack gap="xs" mt="sm">
                  <Group gap={6}>
                    <Tooltip label="Descargar PDF">
                      <Button
                        size="xs"
                        variant="filled"
                        color="red"
                        leftSection={<IconFileTypePdf size={14} />}
                        onClick={(e) => { e.stopPropagation(); handleDownload(r.pdfUrl, r.key, 'PDF') }}
                      >
                        PDF
                      </Button>
                    </Tooltip>
                    <Tooltip label="Descargar Excel">
                      <Button
                        size="xs"
                        variant="filled"
                        color="green"
                        leftSection={<IconFileSpreadsheet size={14} />}
                        onClick={(e) => { e.stopPropagation(); handleDownload(r.excelUrl, r.key, 'Excel') }}
                      >
                        Excel
                      </Button>
                    </Tooltip>
                    {r.csvUrl && (
                      <Tooltip label="Descargar CSV">
                        <Button
                          size="xs"
                          variant="light"
                          color="blue"
                          leftSection={<IconFileTypeCsv size={14} />}
                          onClick={(e) => { e.stopPropagation(); handleDownload(r.csvUrl, r.key, 'CSV') }}
                        >
                          CSV
                        </Button>
                      </Tooltip>
                    )}
                  </Group>
                  <Text size="xs" c="dimmed">
                    {r.hasEspecie && filtroEspecie && `Especie: ${filtroEspecie} | `}
                    {r.hasDateRange && desde && `Desde: ${desde} | `}
                    {r.hasDateRange && hasta && `Hasta: ${hasta}`}
                  </Text>
                </Stack>
              )}
            </Card>
          )
        })}
      </SimpleGrid>

      <Divider my="md" />

      {/* Importacion */}
      <Title order={4}>Importar desde Excel</Title>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Paper withBorder p="md">
          <Group mb="sm">
            <IconUpload size={24} color="var(--mantine-color-green-6)" />
            <Text fw={600}>Importar Animales</Text>
          </Group>
          <Text size="xs" c="dimmed" mb="sm">
            Archivo Excel (.xlsx) con columnas: codigo, nombre, especie, sexo, peso_kg, raza
          </Text>
          <FileInput
            placeholder="Seleccionar archivo..."
            accept=".xlsx,.xls"
            value={animalFile}
            onChange={setAnimalFile}
            mb="sm"
          />
          <Button
            fullWidth
            variant="light"
            color="green"
            leftSection={<IconUpload size={14} />}
            onClick={handleImportAnimales}
            loading={importing}
            disabled={!animalFile}
          >
            Importar Animales
          </Button>
          {importResult && importResult.created != null && (
            <Alert
              mt="sm"
              color={importResult.success ? 'green' : 'red'}
              icon={importResult.success ? <IconCheck size={16} /> : <IconX size={16} />}
            >
              {importResult.success
                ? `Se importaron ${importResult.created} animales.`
                : `Error: ${importResult.error}`}
              {importResult.errors?.length > 0 && (
                <Text size="xs" mt={4}>
                  {importResult.errors.length} errores en filas: {importResult.errors.map(e => e.fila).join(', ')}
                </Text>
              )}
            </Alert>
          )}
        </Paper>

        <Paper withBorder p="md">
          <Group mb="sm">
            <IconUpload size={24} color="var(--mantine-color-teal-6)" />
            <Text fw={600}>Importar Siembras</Text>
          </Group>
          <Text size="xs" c="dimmed" mb="sm">
            Archivo Excel (.xlsx) con columnas: cultivo, lote, fecha_siembra, area_ha
          </Text>
          <FileInput
            placeholder="Seleccionar archivo..."
            accept=".xlsx,.xls"
            value={siembraFile}
            onChange={setSiembraFile}
            mb="sm"
          />
          <Button
            fullWidth
            variant="light"
            color="teal"
            leftSection={<IconUpload size={14} />}
            onClick={handleImportSiembras}
            loading={importing}
            disabled={!siembraFile}
          >
            Importar Siembras
          </Button>
          {importResult && importResult.created != null && (
            <Alert
              mt="sm"
              color={importResult.success ? 'green' : 'red'}
              icon={importResult.success ? <IconCheck size={16} /> : <IconX size={16} />}
            >
              {importResult.success
                ? `Se importaron ${importResult.created} siembras.`
                : `Error: ${importResult.error}`}
              {importResult.errors?.length > 0 && (
                <Text size="xs" mt={4}>
                  {importResult.errors.length} errores en filas: {importResult.errors.map(e => e.fila).join(', ')}
                </Text>
              )}
            </Alert>
          )}
        </Paper>
      </SimpleGrid>

      {/* Modal Historial */}
      <Modal opened={logOpened} onClose={closeLog} title="Historial de Reportes" size="lg">
        {generationLog.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">Aun no se han generado reportes.</Text>
        ) : (
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Reporte</Table.Th>
                <Table.Th>Formato</Table.Th>
                <Table.Th>Usuario</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {generationLog.map((entry, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{dayjs(entry.fecha).format('DD/MM/YYYY HH:mm')}</Table.Td>
                  <Table.Td tt="capitalize">{entry.tipo}</Table.Td>
                  <Table.Td>
                    <Badge size="sm" variant="light" color={
                      entry.formato === 'PDF' ? 'red' : entry.formato === 'Excel' ? 'green' : 'blue'
                    }>
                      {entry.formato}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{entry.usuario}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Modal>
    </Stack>
  )
}
