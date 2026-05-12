import { useEffect, useState } from 'react'
import {
  Paper, Title, Group, Button, Badge, Stack, SimpleGrid, Text,
  Card, Tabs, Table, TextInput, Select, Timeline, RingProgress,
  Center, Tooltip, Box, Anchor, Collapse, ActionIcon, SegmentedControl,
  Divider,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconShieldCheck, IconAlertTriangle, IconCalendarDue,
  IconSearch, IconCheck, IconX, IconMinus, IconFileDownload,
  IconUpload, IconEye, IconFilter, IconBuildingBank,
  IconCertificate, IconBug, IconLeaf, IconBuilding,
  IconArrowUpRight,
} from '@tabler/icons-react'
import api from '../services/api.js'

const CATEGORIAS = ['ICA', 'DIAN', 'Laboral', 'Ambiental', 'Municipal']
const CATEGORIA_ICONS = { ICA: IconCertificate, DIAN: IconBuildingBank, Laboral: IconBug, Ambiental: IconLeaf, Municipal: IconBuilding }

const STATUS_ICONS = {
  cumple: { icon: IconCheck, color: 'green', label: 'Cumple' },
  parcial: { icon: IconMinus, color: 'yellow', label: 'Parcial' },
  no_cumple: { icon: IconX, color: 'red', label: 'No cumple' },
}

const DOCUMENTOS_MOCK = [
  { id: 1, nombre: 'Registro Predial ICA - Formulario', codigo: 'ICA-001', tipo: 'pdf', url: '#' },
  { id: 2, nombre: 'Plan Sanitario Predial - Plantilla', codigo: 'ICA-005', tipo: 'docx', url: '#' },
  { id: 3, nombre: 'Matriz de requisitos legales SST', codigo: 'LAB-007', tipo: 'xlsx', url: '#' },
  { id: 4, nombre: 'Formato Registro de Insumos', codigo: 'ICA-004', tipo: 'xlsx', url: '#' },
  { id: 5, nombre: 'Guía para Facturación Electrónica DIAN', codigo: 'DAN-002', tipo: 'pdf', url: '#' },
  { id: 6, nombre: 'Plan de Manejo Ambiental - Plantilla', codigo: 'AMB-003', tipo: 'docx', url: '#' },
  { id: 7, nombre: 'Contrato Laboral - Modelo', codigo: 'LAB-001', tipo: 'docx', url: '#' },
  { id: 8, nombre: 'Formato COPASST', codigo: 'LAB-006', tipo: 'pdf', url: '#' },
  { id: 9, nombre: 'Solicitud Concesión de Aguas - Formato', codigo: 'AMB-002', tipo: 'pdf', url: '#' },
]

function getUrgenciaColor(dias) {
  if (dias <= 15) return 'red'
  if (dias <= 45) return 'orange'
  return 'teal'
}

function getScoreColor(pct) {
  if (pct >= 80) return 'green'
  if (pct >= 50) return 'orange'
  return 'red'
}

function StatusBadge({ status }) {
  const s = STATUS_ICONS[status]
  if (!s) return null
  return <Badge color={s.color} leftSection={<s.icon size={12} />} variant="light">{s.label}</Badge>
}

export default function Cumplimiento() {
  const [tab, setTab] = useState('checklist')
  const [filtroCat, setFiltroCat] = useState('')
  const [searchNorm, setSearchNorm] = useState('')
  const [resumen, setResumen] = useState(null)
  const [checklist, setChecklist] = useState(null)
  const [vencimientos, setVencimientos] = useState([])
  const [normatividad, setNormatividad] = useState([])
  const [documentos, setDocumentos] = useState(DOCUMENTOS_MOCK)
  const [loading, setLoading] = useState(true)
  const [expandedNorma, setExpandedNorma] = useState(null)

  const fincaId = localStorage.getItem('agrop_finca_id') || '1'

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/cumplimiento/resumen/${fincaId}`).then(r => setResumen(r.data)).catch(() => setResumen(null)),
      api.get(`/cumplimiento/${fincaId}/checklist`).then(r => setChecklist(r.data)).catch(() => setChecklist(null)),
      api.get(`/cumplimiento/${fincaId}/vencimientos`).then(r => setVencimientos(r.data)).catch(() => setVencimientos([])),
      api.get('/cumplimiento/normatividad').then(r => setNormatividad(r.data)).catch(() => setNormatividad([])),
    ]).finally(() => setLoading(false))
  }, [fincaId])

  const filteredChecklist = checklist?.items?.filter(i =>
    !filtroCat || i.categoria === filtroCat
  ) || []

  const filteredNormas = normatividad.filter(n => {
    if (filtroCat && n.categoria !== filtroCat) return false
    if (searchNorm) {
      const q = searchNorm.toLowerCase()
      if (!n.titulo?.toLowerCase().includes(q) &&
          !n.numero?.toLowerCase().includes(q) &&
          !n.descripcion?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const filteredDocs = documentos.filter(d =>
    !filtroCat || d.codigo?.startsWith(filtroCat.substring(0, 3).toUpperCase())
  )

  const criticalFailures = checklist?.items?.filter(i => i.critico && i.status === 'no_cumple') || []
  const partialCritical = checklist?.items?.filter(i => i.critico && i.status === 'parcial') || []

  const scorePct = resumen?.porcentaje_general ?? (checklist?.porcentaje_cumplimiento ?? 0)

  const hoy = new Date()
  const vencimientosCriticos = vencimientos.filter(v => v.urgencia === 'critica')

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>
          <Group gap="xs">
            <IconShieldCheck size={24} />
            Cumplimiento Normativo
          </Group>
        </Title>
      </Group>

      {vencimientosCriticos.length > 0 && (
        <Paper withBorder p="sm" bg="red.0" style={{ borderLeft: '4px solid var(--mantine-color-red-6)' }}>
          <Group>
            <IconAlertTriangle size={20} color="var(--mantine-color-red-6)" />
            <Text fw={600} size="sm" c="red.8">
              {vencimientosCriticos.length} vencimiento{vencimientosCriticos.length > 1 ? 's' : ''} crítico{vencimientosCriticos.length > 1 ? 's' : ''} próximo{vencimientosCriticos.length > 1 ? 's' : ''}
            </Text>
          </Group>
          <Group gap="xs" mt={4}>
            {vencimientosCriticos.slice(0, 3).map(v => (
              <Badge key={v.id} color="red" variant="light" size="sm">
                {v.titulo}: {v.dias_restantes} días
              </Badge>
            ))}
            {vencimientosCriticos.length > 3 && (
              <Badge color="red" variant="outline" size="sm">+{vencimientosCriticos.length - 3} más</Badge>
            )}
          </Group>
        </Paper>
      )}

      {criticalFailures.length > 0 && (
        <Paper withBorder p="sm" bg="orange.0" style={{ borderLeft: '4px solid var(--mantine-color-orange-6)' }}>
          <Group>
            <IconX size={20} color="var(--mantine-color-orange-6)" />
            <Text fw={600} size="sm" c="orange.8">
              {criticalFailures.length} requisito{criticalFailures.length > 1 ? 's' : ''} crítico{criticalFailures.length > 1 ? 's' : ''} incumplido{criticalFailures.length > 1 ? 's' : ''}
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mt={2}>
            {criticalFailures.map(r => r.requisito).join(', ')}
          </Text>
        </Paper>
      )}

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <Card withBorder padding="md" radius="md" style={{ borderLeft: `4px solid var(--mantine-color-${getScoreColor(scorePct)}-6)` }}>
          <Group justify="center">
            <RingProgress
              size={80}
              thickness={8}
              roundCaps
              sections={[{ value: scorePct, color: getScoreColor(scorePct) }]}
              label={<Center><Text fw={700} size="sm" c={getScoreColor(scorePct)}>{scorePct}%</Text></Center>}
            />
            <Box>
              <Text size="xs" c="dimmed">Cumplimiento</Text>
              <Text size="sm" fw={600}>Normativo</Text>
              <Text size="xs" c="dimmed">{checklist?.cumplidos || 0}/{checklist?.total_requisitos || 0} requisitos</Text>
            </Box>
          </Group>
        </Card>
        <Card withBorder padding="md" radius="md" style={{ borderLeft: `4px solid var(--mantine-color-${vencimientosCriticos.length > 0 ? 'red' : 'gray'}-6)` }}>
          <Group>
            <IconCalendarDue size={28} color={`var(--mantine-color-${vencimientosCriticos.length > 0 ? 'red' : 'gray'}-6)`} />
            <Box>
              <Text size="xs" c="dimmed">Vencimientos</Text>
              <Text size="xl" fw={700} c={vencimientosCriticos.length > 0 ? 'red.6' : undefined}>
                {vencimientos.length}
              </Text>
              <Text size="xs" c="dimmed">{resumen?.vencimientos_proximos || 0} próximos</Text>
            </Box>
          </Group>
        </Card>
        <Card withBorder padding="md" radius="md">
          <Group>
            <IconCertificate size={28} color="var(--mantine-color-blue-6)" />
            <Box>
              <Text size="xs" c="dimmed">Requisitos ICA</Text>
              <Text size="xl" fw={700}>{resumen?.categorias?.ICA?.cumplidos || 0}/{resumen?.categorias?.ICA?.total || 0}</Text>
              <Text size="xs" c="dimmed">{resumen?.categorias?.ICA?.porcentaje || 0}% cumplimiento</Text>
            </Box>
          </Group>
        </Card>
        <Card withBorder padding="md" radius="md">
          <Group>
            <IconBuildingBank size={28} color="var(--mantine-color-violet-6)" />
            <Box>
              <Text size="xs" c="dimmed">Obligaciones DIAN</Text>
              <Text size="xl" fw={700}>{resumen?.categorias?.DIAN?.cumplidos || 0}/{resumen?.categorias?.DIAN?.total || 0}</Text>
              <Text size="xs" c="dimmed">{resumen?.categorias?.DIAN?.porcentaje || 0}% cumplimiento</Text>
            </Box>
          </Group>
        </Card>
      </SimpleGrid>

      <Group>
        <SegmentedControl
          value={filtroCat}
          onChange={setFiltroCat}
          data={[
            { value: '', label: 'Todas' },
            ...CATEGORIAS.map(c => ({ value: c, label: c })),
          ]}
          size="xs"
        />
      </Group>

      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="checklist" leftSection={<IconCheck size={16} />}>Checklist</Tabs.Tab>
          <Tabs.Tab value="vencimientos" leftSection={<IconCalendarDue size={16} />}>
            Vencimientos
            {vencimientosCriticos.length > 0 && (
              <Badge size="xs" color="red" variant="filled" ml="xs">{vencimientosCriticos.length}</Badge>
            )}
          </Tabs.Tab>
          <Tabs.Tab value="normatividad" leftSection={<IconSearch size={16} />}>Normatividad</Tabs.Tab>
          <Tabs.Tab value="documentos" leftSection={<IconFileDownload size={16} />}>Documentos</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="checklist" pt="sm">
          {loading ? (
            <Text c="dimmed" ta="center" py="xl">Cargando checklist...</Text>
          ) : !checklist ? (
            <Text c="dimmed" ta="center" py="xl">Seleccione una finca para ver su checklist</Text>
          ) : (
            <>
              <Paper withBorder p="md" mb="sm" bg={`${getScoreColor(scorePct)}.0`}>
                <Group>
                  <RingProgress
                    size={100}
                    thickness={10}
                    roundCaps
                    sections={[{ value: scorePct, color: getScoreColor(scorePct) }]}
                    label={<Center><Text fw={700} size="lg" c={getScoreColor(scorePct)}>{scorePct}%</Text></Center>}
                  />
                  <Box>
                    <Text fw={600}>Cumplimiento General</Text>
                    <Text size="sm" c="dimmed">
                      {checklist.cumplidos} de {checklist.total_requisitos} requisitos cumplidos
                    </Text>
                    <Group gap="xs" mt="xs">
                      <Badge color="green" variant="light">{checklist.cumplidos} Cumplen</Badge>
                      <Badge color="yellow" variant="light">{checklist.items.filter(i => i.status === 'parcial').length} Parciales</Badge>
                      <Badge color="red" variant="light">{checklist.items.filter(i => i.status === 'no_cumple').length} Incumplen</Badge>
                    </Group>
                  </Box>
                </Group>
              </Paper>

              <Paper withBorder>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Código</Table.Th>
                      <Table.Th>Requisito</Table.Th>
                      <Table.Th>Norma</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th>Última Actualización</Table.Th>
                      <Table.Th style={{ width: 100 }}></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredChecklist.map(item => {
                      const CatIcon = CATEGORIA_ICONS[item.categoria] || IconShieldCheck
                      return (
                        <Table.Tr key={item.codigo} style={item.critico && item.status === 'no_cumple' ? { background: 'var(--mantine-color-red-0)' } : undefined}>
                          <Table.Td>
                            <Group gap={4}>
                              <CatIcon size={14} color="var(--mantine-color-gray-6)" />
                              <Text size="sm">{item.codigo}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4}>
                              <Text size="sm" fw={item.critico ? 600 : 400}>{item.requisito}</Text>
                              {item.critico && <Badge size="xs" color="red" variant="filled">Crítico</Badge>}
                            </Group>
                          </Table.Td>
                          <Table.Td><Text size="xs" c="dimmed">{item.norma}</Text></Table.Td>
                          <Table.Td><StatusBadge status={item.status} /></Table.Td>
                          <Table.Td><Text size="xs" c="dimmed">{item.last_update}</Text></Table.Td>
                          <Table.Td>
                            {item.status !== 'cumple' && (
                              <Tooltip label="Subir documento">
                                <Button size="xs" variant="light" color="blue" leftSection={<IconUpload size={12} />}>
                                  Subir
                                </Button>
                              </Tooltip>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      )
                    })}
                    {filteredChecklist.length === 0 && (
                      <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">No hay requisitos para mostrar</Text></Table.Td></Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="vencimientos" pt="sm">
          {loading ? (
            <Text c="dimmed" ta="center" py="xl">Cargando vencimientos...</Text>
          ) : vencimientos.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">Sin vencimientos próximos</Text>
          ) : (
            <>
              <Paper withBorder p="md" mb="sm">
                <SimpleGrid cols={{ base: 3 }}>
                  <Box ta="center">
                    <Text fw={700} size="xl" c="red">{vencimientos.filter(v => v.urgencia === 'critica').length}</Text>
                    <Text size="xs" c="dimmed">Críticos (&le;15 días)</Text>
                  </Box>
                  <Box ta="center">
                    <Text fw={700} size="xl" c="orange">{vencimientos.filter(v => v.urgencia === 'media').length}</Text>
                    <Text size="xs" c="dimmed">Medio (16-45 días)</Text>
                  </Box>
                  <Box ta="center">
                    <Text fw={700} size="xl" c="teal">{vencimientos.filter(v => v.urgencia === 'baja').length}</Text>
                    <Text size="xs" c="dimmed">Bajo (&gt;45 días)</Text>
                  </Box>
                </SimpleGrid>
              </Paper>
              <Timeline active={vencimientos.filter(v => v.dias_restantes <= 0).length} bulletSize={28} lineWidth={2}>
                {vencimientos.map(v => {
                  const color = getUrgenciaColor(v.dias_restantes)
                  return (
                    <Timeline.Item
                      key={v.id}
                      bullet={<IconCalendarDue size={14} />}
                      color={color}
                    >
                      <Group justify="space-between">
                        <Box>
                          <Text fw={600} size="sm">{v.titulo}</Text>
                          <Group gap="xs" mt={2}>
                            <Badge size="xs" color={color} variant="light">{v.dias_restantes} días</Badge>
                            <Badge size="xs" color="gray" variant="outline">{v.categoria}</Badge>
                            <Badge size="xs" color="gray" variant="outline">{v.tipo}</Badge>
                          </Group>
                          <Text size="xs" c="dimmed" mt={2}>Vence: {v.fecha_vencimiento}</Text>
                        </Box>
                        {v.dias_restantes <= 15 && (
                          <IconAlertTriangle size={20} color="var(--mantine-color-red-6)" />
                        )}
                      </Group>
                    </Timeline.Item>
                  )
                })}
              </Timeline>
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="normatividad" pt="sm">
          <Group mb="sm">
            <TextInput
              placeholder="Buscar por título, número o descripción..."
              leftSection={<IconSearch size={16} />}
              value={searchNorm}
              onChange={e => setSearchNorm(e.target.value)}
              style={{ flex: 1, maxWidth: 500 }}
            />
            <Text size="xs" c="dimmed">{filteredNormas.length} normas</Text>
          </Group>
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Norma</Table.Th>
                  <Table.Th>Título</Table.Th>
                  <Table.Th>Aplica a</Table.Th>
                  <Table.Th>Categoría</Table.Th>
                  <Table.Th style={{ width: 60 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredNormas.map((n, i) => {
                  const CatIcon = CATEGORIA_ICONS[n.categoria] || IconShieldCheck
                  return (
                    <>
                      <Table.Tr
                        key={i}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setExpandedNorma(expandedNorma === i ? null : i)}
                      >
                        <Table.Td><Text size="sm" fw={500}>{n.numero}</Text></Table.Td>
                        <Table.Td><Text size="sm">{n.titulo}</Text></Table.Td>
                        <Table.Td><Badge size="xs" variant="light">{n.aplica_a}</Badge></Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            <CatIcon size={14} />
                            <Text size="sm">{n.categoria}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <ActionIcon variant="subtle" size="sm">
                            <IconEye size={14} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                      {expandedNorma === i && (
                        <Table.Tr key={`${i}-detail`}>
                          <Table.Td colSpan={5}>
                            <Box p="sm" bg="gray.0" style={{ borderRadius: 4 }}>
                              <Text size="sm">{n.descripcion}</Text>
                              <Group mt="sm">
                                <Badge size="sm" color="blue" variant="light" leftSection={<IconArrowUpRight size={10} />}>
                                  Ver documento (simulado)
                                </Badge>
                              </Group>
                            </Box>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </>
                  )
                })}
                {filteredNormas.length === 0 && (
                  <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center">Sin normas registradas</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="documentos" pt="sm">
          <Group mb="sm" justify="space-between">
            <Text size="sm" c="dimmed">{filteredDocs.length} documentos disponibles</Text>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            {filteredDocs.map(d => (
              <Card key={d.id} withBorder padding="md" radius="md">
                <Group mb="xs">
                  <IconFileDownload size={24} color="var(--mantine-color-blue-6)" />
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={600} lineClamp={2}>{d.nombre}</Text>
                    <Group gap="xs" mt={2}>
                      <Badge size="xs" color="gray" variant="light">{d.codigo}</Badge>
                      <Badge size="xs" color="blue" variant="outline">{d.tipo.toUpperCase()}</Badge>
                    </Group>
                  </Box>
                </Group>
                <Group gap="xs">
                  <Button size="xs" variant="light" color="blue" leftSection={<IconFileDownload size={12} />} component="a" href={d.url}>
                    Descargar
                  </Button>
                  <Button size="xs" variant="light" color="green" leftSection={<IconUpload size={12} />}>
                    Subir
                  </Button>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
