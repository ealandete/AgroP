import { useState } from 'react'
import {
  Paper, TextInput, Button, Title, Group, Stack, Badge,
  Timeline, Text, Code, SimpleGrid, Card, Select, Alert,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconSearch, IconVaccine, IconArrowsRight, IconHeart,
  IconMilk, IconShoppingCart, IconQrcode, IconAlertCircle,
  IconCalendarEvent,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import api from '../services/api.js'

const TIPO_COLORS = {
  sanitario: 'red',
  movimiento: 'blue',
  reproduccion: 'violet',
  produccion: 'green',
  venta: 'orange',
  tratamiento: 'teal',
  labor: 'cyan',
  cosecha: 'lime',
}

const TIPO_ICONS = {
  sanitario: IconVaccine,
  movimiento: IconArrowsRight,
  reproduccion: IconHeart,
  produccion: IconMilk,
  venta: IconShoppingCart,
  tratamiento: IconVaccine,
  labor: IconCalendarEvent,
  cosecha: IconMilk,
}

function TimelineEvent({ event }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = TIPO_ICONS[event.tipo] || IconAlertCircle
  const color = TIPO_COLORS[event.tipo] || 'gray'

  return (
    <Timeline.Item
      bullet={<Icon size={14} />}
      color={color}
      title={
        <Group gap={4}>
          <Badge color={color} size="sm" variant="light">{event.tipo}</Badge>
          <Text size="sm" fw={500}>{event.titulo}</Text>
        </Group>
      }
    >
      <Text size="xs" c="dimmed">{event.fecha}</Text>
      <Text size="sm">{event.descripcion}</Text>
      {event.responsable && (
        <Text size="xs" c="dimmed">Responsable: {event.responsable}</Text>
      )}
      {event.detalles && Object.keys(event.detalles).length > 0 && (
        <>
          <Button
            variant="subtle" size="xs" compact
            onClick={() => setExpanded(!expanded)}
            mt={4}
          >
            {expanded ? 'Ocultar detalles' : 'Ver detalles'}
          </Button>
          {expanded && (
            <Paper withBorder p="xs" mt={4}>
              <Code block>
                {JSON.stringify(event.detalles, null, 2)}
              </Code>
            </Paper>
          )}
        </>
      )}
    </Timeline.Item>
  )
}

export default function Trazabilidad() {
  const [searchType, setSearchType] = useState('animal')
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [traceData, setTraceData] = useState(null)
  const [qrValue, setQrValue] = useState('')
  const [qrData, setQrData] = useState(null)

  const handleSearch = async () => {
    if (!searchValue) return
    setLoading(true)
    setTraceData(null)
    try {
      let endpoint = ''
      if (searchType === 'animal') endpoint = `/trazabilidad/animal/${searchValue}`
      else if (searchType === 'cultivo') endpoint = `/trazabilidad/cultivo/${searchValue}`
      else if (searchType === 'producto') endpoint = `/trazabilidad/producto/${encodeURIComponent(searchValue)}`
      const r = await api.get(endpoint)
      setTraceData(r.data)
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.detail || 'No se encontro informacion',
        color: 'red',
      })
    }
    setLoading(false)
  }

  const handleQrSearch = async () => {
    if (!qrValue) return
    try {
      const r = await api.get(`/trazabilidad/qr/${encodeURIComponent(qrValue)}`)
      setQrData(r.data)
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.detail || 'No se encontro el producto',
        color: 'red',
      })
    }
  }

  const firstDate = traceData?.eventos?.length > 0 ? traceData.eventos[0]?.fecha : null
  const lastDate = traceData?.eventos?.length > 0 ? traceData.eventos[traceData.eventos.length - 1]?.fecha : null

  return (
    <Stack>
      <Title order={3}>Trazabilidad</Title>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Card withBorder p="md">
          <Text size="xs" c="dimmed">Total eventos</Text>
          <Text size="xl" fw={700}>{traceData?.total_eventos || 0}</Text>
        </Card>
        <Card withBorder p="md">
          <Text size="xs" c="dimmed">Periodo</Text>
          <Text size="sm" fw={500}>
            {firstDate && lastDate
              ? `${dayjs(firstDate).format('DD/MM/YYYY')} - ${dayjs(lastDate).format('DD/MM/YYYY')}`
              : 'N/A'}
          </Text>
        </Card>
        <Card withBorder p="md">
          <Text size="xs" c="dimmed">Certificaciones</Text>
          <Text size="xl" fw={700}>{(traceData?.certificaciones || []).length}</Text>
        </Card>
      </SimpleGrid>

      <Paper withBorder p="md">
        <Title order={5} mb="sm">Buscar trazabilidad</Title>
        <Group>
          <Select
            data={[
              { value: 'animal', label: 'Animal (ID o codigo)' },
              { value: 'cultivo', label: 'Cultivo (ID de siembra)' },
              { value: 'producto', label: 'Producto (ID o lote)' },
            ]}
            value={searchType}
            onChange={setSearchType}
            style={{ width: 220 }}
          />
          <TextInput
            placeholder={
              searchType === 'animal' ? 'ID o codigo del animal' :
              searchType === 'cultivo' ? 'ID de siembra' : 'ID o lote del producto'
            }
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ flex: 1 }}
          />
          <Button
            leftSection={<IconSearch size={16} />}
            onClick={handleSearch}
            loading={loading}
          >
            Buscar
          </Button>
        </Group>
      </Paper>

      {traceData && traceData.animal && (
        <Paper withBorder p="md">
          <Title order={5}>Datos del animal</Title>
          <SimpleGrid cols={{ base: 2, sm: 4 }} mt="sm">
            <div>
              <Text size="xs" c="dimmed">Codigo</Text>
              <Text size="sm" fw={500}>{traceData.animal.codigo || 'N/A'}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Especie</Text>
              <Text size="sm" fw={500}>{traceData.animal.especie}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Raza</Text>
              <Text size="sm" fw={500}>{traceData.animal.raza || 'N/A'}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Sexo</Text>
              <Text size="sm" fw={500}>{traceData.animal.sexo}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Nacimiento</Text>
              <Text size="sm">{traceData.animal.fecha_nacimiento ? dayjs(traceData.animal.fecha_nacimiento).format('DD/MM/YYYY') : 'N/A'}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Ingreso</Text>
              <Text size="sm">{dayjs(traceData.animal.fecha_ingreso).format('DD/MM/YYYY')}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Salida</Text>
              <Text size="sm">{traceData.animal.fecha_salida ? dayjs(traceData.animal.fecha_salida).format('DD/MM/YYYY') : 'Aun activo'}</Text>
            </div>
          </SimpleGrid>
        </Paper>
      )}

      {traceData && traceData.siembra && (
        <Paper withBorder p="md">
          <Title order={5}>Datos del cultivo</Title>
          <SimpleGrid cols={{ base: 2, sm: 4 }} mt="sm">
            <div>
              <Text size="xs" c="dimmed">Cultivo</Text>
              <Text size="sm" fw={500}>{traceData.siembra.cultivo}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Lote</Text>
              <Text size="sm" fw={500}>{traceData.siembra.lote || 'N/A'}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Siembra</Text>
              <Text size="sm">{dayjs(traceData.siembra.fecha_siembra).format('DD/MM/YYYY')}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">Estado</Text>
              <Badge color={traceData.siembra.estado === 'activo' ? 'green' : 'gray'}>{traceData.siembra.estado}</Badge>
            </div>
          </SimpleGrid>
        </Paper>
      )}

      {traceData && traceData.eventos && traceData.eventos.length > 0 && (
        <Paper withBorder p="md">
          <Title order={5} mb="sm">Linea de tiempo</Title>
          <Timeline active={traceData.eventos.length - 1} bulletSize={28} lineWidth={2}>
            {traceData.eventos.map((ev, i) => (
              <TimelineEvent key={i} event={ev} />
            ))}
          </Timeline>
        </Paper>
      )}

      {traceData && traceData.eventos && traceData.eventos.length === 0 && (
        <Alert icon={<IconAlertCircle size={16} />} color="gray">
          No se encontraron eventos para esta busqueda.
        </Alert>
      )}

      <Paper withBorder p="md">
        <Title order={5} mb="sm">Codigo QR de producto</Title>
        <Group>
          <TextInput
            placeholder="Codigo o ID del producto"
            value={qrValue}
            onChange={e => setQrValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQrSearch()}
            style={{ flex: 1 }}
          />
          <Button leftSection={<IconQrcode size={16} />} onClick={handleQrSearch}>
            Generar QR
          </Button>
        </Group>
        {qrData && (
          <Paper withBorder p="md" mt="sm">
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <div>
                <Text size="xs" c="dimmed">Producto</Text>
                <Text fw={500}>{qrData.producto.nombre}</Text>
                <Text size="xs" c="dimmed" mt={4}>Tipo</Text>
                <Text>{qrData.producto.tipo}</Text>
                <Text size="xs" c="dimmed" mt={4}>Finca origen</Text>
                <Text>{qrData.finca_origen.nombre}</Text>
                <Text size="xs" c="dimmed" mt={4}>URL de trazabilidad</Text>
                <Code>{qrData.trace_url}</Code>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed" mb="sm">Datos para QR</Text>
                <Code block>{qrData.qr_data}</Code>
                {qrData.certificaciones?.length > 0 && (
                  <div mt="sm">
                    <Text size="xs" c="dimmed">Certificaciones</Text>
                    {qrData.certificaciones.map((c, i) => (
                      <Badge key={i} color="green" size="sm" mr={4}>{c}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </SimpleGrid>
          </Paper>
        )}
      </Paper>
    </Stack>
  )
}
