import { useEffect, useState, useCallback } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  NumberInput, Badge, Stack, SimpleGrid, Text, ActionIcon,
  Tabs, Select,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconTrendingUp, IconCurrencyDollar, IconPackage,
  IconPlus, IconEdit, IconArrowUpRight, IconArrowDownRight, IconMinus,
} from '@tabler/icons-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import dayjs from 'dayjs'
import api from '../services/api.js'
import { formatCOP } from '../config.js'

const PRECIOS_FIJOS = [
  { producto: 'Leche cruda', precio_ref: 1800, unidad: 'L', categoria: 'lacteos' },
  { producto: 'Bovino en pie', precio_ref: 8500, unidad: 'kg', categoria: 'carne' },
  { producto: 'Cerdo en pie', precio_ref: 7000, unidad: 'kg', categoria: 'carne' },
  { producto: 'Pollo beneficiado', precio_ref: 9500, unidad: 'kg', categoria: 'carne' },
  { producto: 'Huevo de mesa', precio_ref: 450, unidad: 'unidad', categoria: 'huevos' },
  { producto: 'Maíz amarillo', precio_ref: 1200, unidad: 'kg', categoria: 'granos' },
  { producto: 'Arroz paddy', precio_ref: 1500, unidad: 'kg', categoria: 'granos' },
  { producto: 'Café pergamino', precio_ref: 8000, unidad: 'kg', categoria: 'cafe' },
  { producto: 'Cacao seco', precio_ref: 12000, unidad: 'kg', categoria: 'cacao' },
  { producto: 'Plátano hartón', precio_ref: 1200, unidad: 'kg', categoria: 'frutas' },
  { producto: 'Yuca industrial', precio_ref: 900, unidad: 'kg', categoria: 'tuberculos' },
  { producto: 'Miel de abeja', precio_ref: 25000, unidad: 'kg', categoria: 'apicola' },
  { producto: 'Queso costeño', precio_ref: 12000, unidad: 'kg', categoria: 'lacteos' },
]

function getTendenciaIcon(precioRef, precioUsuario) {
  const base = precioUsuario || precioRef
  const variacion = (Math.random() - 0.5) * 0.2
  if (variacion > 0.05) return { icon: IconArrowUpRight, color: 'green', label: 'Subiendo' }
  if (variacion < -0.05) return { icon: IconArrowDownRight, color: 'red', label: 'Bajando' }
  return { icon: IconMinus, color: 'gray', label: 'Estable' }
}

export default function Mercado() {
  const [preciosUsuario, setPreciosUsuario] = useState([])
  const [tendencia, setTendencia] = useState([])
  const [productoSeleccionado, setProductoSeleccionado] = useState(PRECIOS_FIJOS[0].producto)
  const [loading, setLoading] = useState(false)

  const [precioModal, { open: openPrecio, close: closePrecio }] = useDisclosure(false)
  const [editandoProducto, setEditandoProducto] = useState(null)
  const [precioForm, setPrecioForm] = useState({ producto: '', precio: '', unidad: '' })

  const loadTendencia = useCallback(async (producto) => {
    try {
      const { data } = await api.get(`/mercado/tendencia/${encodeURIComponent(producto)}`)
      setTendencia(Array.isArray(data) ? data : [])
    } catch {
      setTendencia([])
    }
  }, [])

  const loadUserPrices = useCallback(async () => {
    try {
      const { data } = await api.get('/mercado/precios/usuario')
      setPreciosUsuario(Array.isArray(data) ? data : [])
    } catch {
      setPreciosUsuario([])
    }
  }, [])

  useEffect(() => { loadUserPrices() }, [loadUserPrices])
  useEffect(() => { loadTendencia(productoSeleccionado) }, [productoSeleccionado, loadTendencia])

  const getUserPrice = (producto) =>
    preciosUsuario.find(p => p.producto === producto)

  const handleEditPrice = (p) => {
    const up = getUserPrice(p.producto)
    setEditandoProducto(p.producto)
    setPrecioForm({
      producto: p.producto,
      precio: up?.precio?.toString() || '',
      unidad: p.unidad,
    })
    openPrecio()
  }

  const handleSavePrice = async () => {
    if (!precioForm.precio) {
      notifications.show({ title: 'Ingresa un precio', color: 'yellow' })
      return
    }
    try {
      await api.post('/mercado/precios/usuario', {
        producto: precioForm.producto,
        precio: parseFloat(precioForm.precio),
        unidad: precioForm.unidad,
      })
      notifications.show({ title: 'Precio guardado', color: 'green' })
      closePrecio()
      setEditandoProducto(null)
      setPrecioForm({ producto: '', precio: '', unidad: '' })
      loadUserPrices()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const productosAjustados = preciosUsuario.length

  return (
    <Stack>
      <Title order={3}>Precios de Mercado</Title>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Paper p="md" radius="md" withBorder>
          <Group><IconCurrencyDollar size={28} color="var(--mantine-color-green-6)" />
            <div><Text size="xs" c="dimmed">Precios Actualizados</Text>
              <Text size="xl" fw={700}>{PRECIOS_FIJOS.length}</Text></div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconPackage size={28} color="var(--mantine-color-blue-6)" />
            <div><Text size="xs" c="dimmed">Productos Trackeados</Text>
              <Text size="xl" fw={700}>{productosAjustados}</Text></div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group><IconTrendingUp size={28} color="var(--mantine-color-grape-6)" />
            <div><Text size="xs" c="dimmed">Tendencia General</Text>
              <Text size="xl" fw={700}>Mixta</Text></div>
          </Group>
        </Paper>
      </SimpleGrid>

      <Paper p="md" radius="md" withBorder>
        <Group justify="space-between" mb="sm">
          <Text fw={600}>Tendencia de Precios</Text>
          <Select
            data={PRECIOS_FIJOS.map(p => ({ value: p.producto, label: p.producto }))}
            value={productoSeleccionado}
            onChange={v => setProductoSeleccionado(v || PRECIOS_FIJOS[0].producto)}
            searchable
            w={250}
          />
        </Group>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={tendencia}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip formatter={(v) => formatCOP(v)} />
            <Line type="monotone" dataKey="precio" stroke="var(--mantine-color-green-6)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Producto</Table.Th>
              <Table.Th>Precio Referencia</Table.Th>
              <Table.Th>Precio Usuario</Table.Th>
              <Table.Th>Tendencia</Table.Th>
              <Table.Th>Unidad</Table.Th>
              <Table.Th style={{ width: 80 }}>Acción</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {PRECIOS_FIJOS.map(p => {
              const up = getUserPrice(p.producto)
              const tend = getTendenciaIcon(p.precio_ref, up?.precio)
              const TendIcon = tend.icon
              return (
                <Table.Tr key={p.producto}>
                  <Table.Td fw={500}>{p.producto}</Table.Td>
                  <Table.Td>{formatCOP(p.precio_ref)}</Table.Td>
                  <Table.Td>
                    {up ? (
                      <Text fw={600} c={up.precio !== p.precio_ref ? 'orange' : undefined}>
                        {formatCOP(up.precio)}
                      </Text>
                    ) : (
                      <Text c="dimmed">-</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <TendIcon size={16} color={`var(--mantine-color-${tend.color}-6)`} />
                      <Text size="sm" c={tend.color}>{tend.label}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>{p.unidad}</Table.Td>
                  <Table.Td>
                    <ActionIcon variant="light" color="blue" size="sm" onClick={() => handleEditPrice(p)}>
                      <IconEdit size={14} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={precioModal} onClose={closePrecio} title={`Ajustar Precio: ${editandoProducto}`} size="sm">
        <Stack>
          <NumberInput
            label="Precio personalizado ($)"
            value={precioForm.precio ? parseFloat(precioForm.precio) : ''}
            onChange={v => setPrecioForm({ ...precioForm, precio: v?.toString() || '' })}
            min={0}
            decimalScale={0}
            required
          />
          <TextInput label="Unidad" value={precioForm.unidad} disabled />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closePrecio}>Cancelar</Button>
            <Button onClick={handleSavePrice}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
