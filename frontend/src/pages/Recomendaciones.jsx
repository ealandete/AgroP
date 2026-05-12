import { useState, useEffect } from 'react'
import {
  Tabs, Paper, Title, Text, Group, Stack, TextInput, Select,
  NumberInput, Button, Card, Badge, Grid, SimpleGrid, Table,
  Progress, RingProgress, List, ThemeIcon, Divider, Alert,
  Tooltip, Code, Kbd,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  IconBulb, IconLeaf, IconDroplet, IconCalculator, IconPlant,
  IconBrandAmongUs, IconFlask, IconCheck, IconX, IconAlertTriangle,
  IconInfoCircle, IconArrowRight, IconRipple, IconGauge,
  IconCurrencyPeso, IconClock, IconMapPin,
} from '@tabler/icons-react'
import api from '../services/api'
import { formatNumber, formatCOP } from '../config'

const TEXTURAS = [
  { value: 'arenosa', label: 'Arenosa' },
  { value: 'franco_arenosa', label: 'Franco Arenosa' },
  { value: 'franca', label: 'Franca' },
  { value: 'franco_arcillosa', label: 'Franco Arcillosa' },
  { value: 'arcillosa', label: 'Arcillosa' },
]

const CULTIVOS_LIST = [
  'coco','mango','cafe','cacao','platano','palma_africana','maiz',
  'yuca','arroz','papa','frijol','tomate','fresa','lechuga',
  'albahaca','mani','calabaza','citricos','pina','pastura','arboles',
]

const FUENTES_AGUA = [
  { value: 'rio', label: 'Río' },
  { value: 'nacimiento', label: 'Nacimiento' },
  { value: 'pozo', label: 'Pozo' },
  { value: 'embalse', label: 'Embalse' },
  { value: 'acueducto', label: 'Acueducto' },
]

const COMPAT_COLORS = { alta: 'green', media: 'yellow', baja: 'red', desconocida: 'gray' }
const COMPAT_ICONS = { alta: IconCheck, media: IconAlertTriangle, baja: IconX, desconocida: IconInfoCircle }

function AnalisisSueloTab() {
  const form = useForm({
    initialValues: {
      ph: 6.5, n_ppm: 30, p_ppm: 20, k_ppm: 0.3,
      mo_pct: 4, textura: 'franca', altitud_msnm: 500, precipitacion_mm: 1500,
    },
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const { data } = await api.post('/recomendaciones/analizar-suelo', values)
      setResult(data)
    } catch (err) {
      notifications.show({ title: 'Error al analizar', message: err.response?.data?.detail || 'Error de conexión', color: 'red' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Paper p="md" withBorder>
          <Title order={5} mb="md">Parámetros del Suelo</Title>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
              <NumberInput label="pH" {...form.getInputProps('ph')} min={0} max={14} step={0.1} decimalScale={1} />
              <NumberInput label="Nitrógeno (N ppm)" {...form.getInputProps('n_ppm')} min={0} step={5} />
              <NumberInput label="Fósforo (P ppm)" {...form.getInputProps('p_ppm')} min={0} step={5} />
              <NumberInput label="Potasio (K ppm)" {...form.getInputProps('k_ppm')} min={0} step={0.1} decimalScale={2} />
              <NumberInput label="Materia Orgánica (%)" {...form.getInputProps('mo_pct')} min={0} max={100} step={0.5} decimalScale={1} />
              <Select label="Textura" data={TEXTURAS} {...form.getInputProps('textura')} />
              <NumberInput label="Altitud (msnm)" {...form.getInputProps('altitud_msnm')} min={0} step={100} />
              <NumberInput label="Precipitación anual (mm)" {...form.getInputProps('precipitacion_mm')} min={0} step={100} />
              <Button type="submit" loading={loading} leftSection={<IconFlask size={16} />} fullWidth mt="sm">
                Analizar Suelo
              </Button>
            </Stack>
          </form>
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 7 }}>
        {result && (
          <Stack gap="md">
            <Paper p="md" withBorder>
              <Title order={5} mb="sm">Cultivos Recomendados</Title>
              {result.cultivos_recomendados.length === 0 ? (
                <Text c="dimmed" size="sm">No se encontraron cultivos compatibles</Text>
              ) : (
                <Stack gap="xs">
                  {result.cultivos_recomendados.slice(0, 8).map((c, i) => (
                    <Paper key={i} p="xs" withBorder style={{ borderLeft: `4px solid ${c.match_pct > 60 ? 'var(--mantine-color-green-6)' : c.match_pct > 40 ? 'var(--mantine-color-yellow-6)' : 'var(--mantine-color-gray-4)'}` }}>
                      <Group justify="space-between" mb={4}>
                        <Group gap="xs">
                          <IconLeaf size={16} style={{ textTransform: 'capitalize' }} />
                          <Text fw={600} size="sm" tt="capitalize">{c.cultivo}</Text>
                        </Group>
                        <Badge size="lg" color={c.match_pct > 60 ? 'green' : c.match_pct > 40 ? 'yellow' : 'gray'}>{c.match_pct}%</Badge>
                      </Group>
                      <Progress value={c.match_pct} color={c.match_pct > 60 ? 'green' : c.match_pct > 40 ? 'yellow' : 'gray'} size="sm" mb={4} />
                      <Group gap="xs">
                        <Text size="xs" c="dimmed">{formatNumber(c.rendimiento_est_kg_ha)} kg/ha</Text>
                        <Text size="xs" c="dimmed">|</Text>
                        <Text size="xs" c="dimmed">{c.ciclo_dias} días</Text>
                      </Group>
                      {c.razones.length > 0 && (
                        <Text size="xs" c="dimmed" lineClamp={1}>{c.razones.join(' • ')}</Text>
                      )}
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>

            <Grid>
              <Grid.Col span={6}>
                <Paper p="md" withBorder>
                  <Group gap="xs" mb="xs">
                    <IconCow size={18} />
                    <Title order={6}>Ganadería</Title>
                  </Group>
                  <Badge color={result.apto_ganaderia ? 'green' : 'orange'}>{result.apto_ganaderia ? 'Apto' : 'Limitado'}</Badge>
                  <Text size="xs" mt={4} c="dimmed">{result.ganaderia_observacion}</Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={6}>
                <Paper p="md" withBorder>
                  <Group gap="xs" mb="xs">
                    <IconDroplet size={18} />
                    <Title order={6}>Riego</Title>
                  </Group>
                  <Text size="sm">{result.riego_recomendado || 'No se requiere sistema especial'}</Text>
                </Paper>
              </Grid.Col>
            </Grid>

            {result.enmiendas.length > 0 && (
              <Paper p="md" withBorder>
                <Group gap="xs" mb="sm">
                  <IconFlask size={18} />
                  <Title order={5}>Enmiendas Recomendadas</Title>
                </Group>
                <Stack gap="xs">
                  {result.enmiendas.map((e, i) => (
                    <Paper key={i} p="xs" withBorder bg={e.prioridad === 'alta' ? 'red.0' : 'yellow.0'}>
                      <Group justify="space-between">
                        <div>
                          <Text size="sm" fw={600}>{e.tipo}</Text>
                          <Text size="xs" c="dimmed">{e.descripcion}</Text>
                        </div>
                        <Badge color={e.prioridad === 'alta' ? 'red' : 'yellow'} size="sm">{e.prioridad}</Badge>
                      </Group>
                      <Text size="xs" mt={2}><Kbd>{e.dosis}</Kbd></Text>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            )}

            {result.observaciones.length > 0 && (
              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                {result.observaciones.map((o, i) => <Text key={i} size="xs">{o}</Text>)}
              </Alert>
            )}
          </Stack>
        )}
      </Grid.Col>
    </Grid>
  )
}

function CultivosMixtosTab() {
  const [compatibilidades, setCompatibilidades] = useState([])
  const [rendimientos, setRendimientos] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const form = useForm({
    initialValues: { cultivo_principal: 'maiz', cultivo_secundario: 'frijol', area_ha: 1, lote_id: 1 },
  })

  useEffect(() => {
    api.get('/recomendaciones/especies-compatibles').then(r => {
      setCompatibilidades(r.data.compatibilidades || [])
      setRendimientos(r.data.rendimientos || {})
    }).catch(() => {})
  }, [])

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const { data } = await api.post('/recomendaciones/cultivos-mixtos', values)
      setResult(data)
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    } finally {
      setLoading(false)
    }
  }

  const IconComp = result ? COMPAT_ICONS[result.compatibilidad] || IconInfoCircle : null
  const color = result ? COMPAT_COLORS[result.compatibilidad] || 'gray' : 'gray'

  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Paper p="md" withBorder>
          <Title order={5} mb="md">Seleccionar Combinación</Title>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
              <Select label="Cultivo Principal" data={CULTIVOS_LIST.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))} searchable {...form.getInputProps('cultivo_principal')} />
              <Select label="Cultivo Secundario" data={CULTIVOS_LIST.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))} searchable {...form.getInputProps('cultivo_secundario')} />
              <NumberInput label="Área (ha)" {...form.getInputProps('area_ha')} min={0.1} step={0.5} decimalScale={2} />
              <Button type="submit" loading={loading} leftSection={<IconLeaf size={16} />} fullWidth mt="sm">
                Evaluar Compatibilidad
              </Button>
            </Stack>
          </form>
        </Paper>

        <Paper p="md" withBorder mt="md">
          <Title order={5} mb="sm">Combinaciones Conocidas</Title>
          <Stack gap="xs">
            {compatibilidades.filter(c => c.compatibilidad === 'alta').slice(0, 6).map((c, i) => (
              <Paper key={i} p="xs" withBorder bg="green.0">
                <Group gap="xs">
                  <Badge color="green" size="sm">Alta</Badge>
                  <Text size="sm" tt="capitalize">{c.cultivo1} + {c.cultivo2}</Text>
                </Group>
                <Text size="xs" c="dimmed">{c.notas}</Text>
              </Paper>
            ))}
          </Stack>
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 7 }}>
        {result && (
          <Stack gap="md">
            <Paper p="lg" withBorder style={{ borderLeft: `6px solid var(--mantine-color-${color}-6)` }}>
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <IconComp size={28} color={`var(--mantine-color-${color}-6)`} />
                  <Title order={4} tt="capitalize">{form.values.cultivo_principal} + {form.values.cultivo_secundario}</Title>
                </Group>
                <Badge size="xl" color={color} variant="filled" tt="capitalize">{result.compatibilidad}</Badge>
              </Group>
              <Text size="sm" mb="md">{result.notas}</Text>
              <Divider mb="md" />
              <SimpleGrid cols={2} spacing="md">
                <div>
                  <Text size="xs" c="dimmed">Espaciamiento</Text>
                  <Text size="sm" fw={500}>{result.espaciamiento_recomendado}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Sistema Ejemplo</Text>
                  <Text size="sm" fw={500}>{result.sistema_ejemplo}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Rend. Estimado Principal</Text>
                  <Text size="sm" fw={500}>{formatNumber(result.rendimiento_est_principal_kg)} kg</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Rend. Estimado Secundario</Text>
                  <Text size="sm" fw={500}>{formatNumber(result.rendimiento_est_secundario_kg)} kg</Text>
                </div>
              </SimpleGrid>
            </Paper>

            <Paper p="md" withBorder>
              <Title order={5} mb="sm">Tabla de Compatibilidades</Title>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Cultivo 1</Table.Th>
                    <Table.Th>Cultivo 2</Table.Th>
                    <Table.Th>Compatibilidad</Table.Th>
                    <Table.Th>Notas</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {compatibilidades.map((c, i) => (
                    <Table.Tr key={i}>
                      <Table.Td tt="capitalize">{c.cultivo1}</Table.Td>
                      <Table.Td tt="capitalize">{c.cultivo2}</Table.Td>
                      <Table.Td><Badge color={COMPAT_COLORS[c.compatibilidad]} size="sm" tt="capitalize">{c.compatibilidad}</Badge></Table.Td>
                      <Table.Td><Text size="xs">{c.notas}</Text></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        )}
        {!result && (
          <Paper p="xl" withBorder style={{ textAlign: 'center' }}>
            <IconLeaf size={48} color="var(--mantine-color-gray-4)" />
            <Text c="dimmed" mt="sm">Seleccione dos cultivos para evaluar su compatibilidad</Text>
          </Paper>
        )}
      </Grid.Col>
    </Grid>
  )
}

function RiegoTab() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const form = useForm({
    initialValues: { area_ha: 1, cultivo: 'tomate', textura: 'franca', pendiente_pct: 5, fuente_agua: 'rio' },
  })

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const { data } = await api.post('/recomendaciones/riego', values)
      setResult(data)
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Paper p="md" withBorder>
          <Title order={5} mb="md">Parámetros de Riego</Title>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
              <NumberInput label="Área (ha)" {...form.getInputProps('area_ha')} min={0.1} step={0.5} decimalScale={2} />
              <Select label="Cultivo" data={CULTIVOS_LIST.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))} searchable {...form.getInputProps('cultivo')} />
              <Select label="Textura del Suelo" data={TEXTURAS} {...form.getInputProps('textura')} />
              <NumberInput label="Pendiente (%)" {...form.getInputProps('pendiente_pct')} min={0} max={90} step={1} />
              <Select label="Fuente de Agua" data={FUENTES_AGUA} {...form.getInputProps('fuente_agua')} />
              <Button type="submit" loading={loading} leftSection={<IconDroplet size={16} />} fullWidth mt="sm">
                Recomendar Riego
              </Button>
            </Stack>
          </form>
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 7 }}>
        {result ? (
          <Stack gap="md">
            <Paper p="lg" withBorder style={{ borderLeft: '6px solid var(--mantine-color-blue-6)' }}>
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <IconRipple size={28} color="var(--mantine-color-blue-6)" />
                  <Title order={4}>{result.sistema}</Title>
                </Group>
                <Badge size="lg" color="blue">{result.eficiencia * 100}% Eficiencia</Badge>
              </Group>
              <Text size="sm" c="dimmed" mb="lg">{result.descripcion}</Text>

              <Paper p="sm" bg="blue.0" mb="md" style={{ textAlign: 'center', borderRadius: 8 }}>
                <Text size="sm" fw={600}>{result.diagrama}</Text>
              </Paper>

              <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
                <Paper p="sm" withBorder style={{ textAlign: 'center' }}>
                  <IconDroplet size={24} style={{ color: 'var(--mantine-color-blue-6)' }} />
                  <Text size="xs" c="dimmed" mt={4}>Agua Necesaria</Text>
                  <Text fw={700}>{result.agua_necesaria_mm_mes} mm/mes</Text>
                </Paper>
                <Paper p="sm" withBorder style={{ textAlign: 'center' }}>
                  <IconRipple size={24} style={{ color: 'var(--mantine-color-cyan-6)' }} />
                  <Text size="xs" c="dimmed" mt={4}>Volumen Total</Text>
                  <Text fw={700}>{formatNumber(result.agua_total_m3_mes)} m³/mes</Text>
                </Paper>
                <Paper p="sm" withBorder style={{ textAlign: 'center' }}>
                  <IconClock size={24} style={{ color: 'var(--mantine-color-grape-6)' }} />
                  <Text size="xs" c="dimmed" mt={4}>Riego Diario</Text>
                  <Text fw={700}>{result.horas_riego_dia} horas</Text>
                </Paper>
                <Paper p="sm" withBorder style={{ textAlign: 'center' }}>
                  <IconGauge size={24} style={{ color: 'var(--mantine-color-green-6)' }} />
                  <Text size="xs" c="dimmed" mt={4}>Frecuencia</Text>
                  <Text fw={700}>Cada {result.frecuencia_dias} días</Text>
                </Paper>
                <Paper p="sm" withBorder style={{ textAlign: 'center' }}>
                  <IconCurrencyPeso size={24} style={{ color: 'var(--mantine-color-orange-6)' }} />
                  <Text size="xs" c="dimmed" mt={4}>Costo por ha</Text>
                  <Text fw={700}>{formatCOP(result.costo_estimado_ha)}</Text>
                </Paper>
              </SimpleGrid>
            </Paper>
          </Stack>
        ) : (
          <Paper p="xl" withBorder style={{ textAlign: 'center' }}>
            <IconDroplet size={48} color="var(--mantine-color-gray-4)" />
            <Text c="dimmed" mt="sm">Ingrese los parámetros para obtener una recomendación de riego</Text>
          </Paper>
        )}
      </Grid.Col>
    </Grid>
  )
}

function CalculadoraTab() {
  const [tipo, setTipo] = useState('cultivo')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const [cultivo, setCultivo] = useState('maiz')
  const [area, setArea] = useState(1)
  const [rendimiento, setRendimiento] = useState('')
  const [precio, setPrecio] = useState('')
  const [costoHa, setCostoHa] = useState('')

  const [cabezas, setCabezas] = useState(10)
  const [peso, setPeso] = useState(450)
  const [dias, setDias] = useState(365)
  const [prodDiaria, setProdDiaria] = useState(15)
  const [precioKg, setPrecioKg] = useState('')
  const [costoUnit, setCostoUnit] = useState('')

  const handleCalcular = async () => {
    setLoading(true)
    try {
      const body = tipo === 'cultivo'
        ? { tipo: 'cultivo', cultivo, area_ha: area, rendimiento_esperado_kg_ha: Number(rendimiento) || undefined, precio_venta_kg: Number(precio) || undefined, costo_operativo_ha: Number(costoHa) || undefined }
        : tipo === 'pecuario'
          ? { tipo: 'pecuario', cabezas, peso_promedio_kg: peso, precio_venta_kg: Number(precioKg) || undefined, costo_unitario: Number(costoUnit) || undefined }
          : { tipo: 'leche', cabezas, produccion_diaria_l: prodDiaria, dias_ciclo: dias || undefined, precio_venta_kg: Number(precioKg) || undefined, costo_unitario: Number(costoUnit) || undefined }
      const { data } = await api.post('/recomendaciones/calcular-produccion', body)
      setResult(data)
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Paper p="md" withBorder>
          <Title order={5} mb="md">Calculadora de Producción</Title>
          <Stack gap="sm">
            <Select
              label="Tipo de Cálculo"
              data={[
                { value: 'cultivo', label: '🌱 Cultivos' },
                { value: 'pecuario', label: '🐄 Carne' },
                { value: 'leche', label: '🥛 Leche' },
              ]}
              value={tipo}
              onChange={setTipo}
            />
            {tipo === 'cultivo' ? (
              <>
                <Select label="Cultivo" data={CULTIVOS_LIST.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))} value={cultivo} onChange={setCultivo} searchable />
                <NumberInput label="Área (ha)" value={area} onChange={setArea} min={0.1} step={0.5} decimalScale={2} />
                <NumberInput label="Rendimiento esperado (kg/ha)" value={rendimiento} onChange={setRendimiento} min={0} step={500} placeholder="Usar referencia" />
                <NumberInput label="Precio venta ($/kg)" value={precio} onChange={setPrecio} min={0} step={100} />
                <NumberInput label="Costo operativo ($/ha)" value={costoHa} onChange={setCostoHa} min={0} step={100000} />
              </>
            ) : tipo === 'pecuario' ? (
              <>
                <NumberInput label="Número de cabezas" value={cabezas} onChange={setCabezas} min={1} step={1} />
                <NumberInput label="Peso promedio (kg)" value={peso} onChange={setPeso} min={1} step={10} />
                <NumberInput label="Precio venta ($/kg)" value={precioKg} onChange={setPrecioKg} min={0} step={100} />
                <NumberInput label="Costo unitario ($/kg)" value={costoUnit} onChange={setCostoUnit} min={0} step={100} />
              </>
            ) : (
              <>
                <NumberInput label="Número de vacas" value={cabezas} onChange={setCabezas} min={1} step={1} />
                <NumberInput label="Producción diaria (L/vaca)" value={prodDiaria} onChange={setProdDiaria} min={0.1} step={1} decimalScale={1} />
                <NumberInput label="Días del ciclo" value={dias} onChange={setDias} min={1} step={30} />
                <NumberInput label="Precio venta ($/L)" value={precioKg} onChange={setPrecioKg} min={0} step={100} />
                <NumberInput label="Costo unitario ($/L)" value={costoUnit} onChange={setCostoUnit} min={0} step={100} />
              </>
            )}
            <Button onClick={handleCalcular} loading={loading} leftSection={<IconCalculator size={16} />} fullWidth mt="sm">
              Calcular
            </Button>
          </Stack>
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 7 }}>
        {result ? (
          <Stack gap="md">
            <Paper p="lg" withBorder style={{ borderLeft: '6px solid var(--mantine-color-green-6)' }}>
              <Group gap="xs" mb="md">
                <IconCalculator size={24} color="var(--mantine-color-green-6)" />
                <Title order={4}>Resultados</Title>
              </Group>
              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" mb="md">
                <Text size="sm">{result.detalle}</Text>
              </Alert>
              <SimpleGrid cols={2} spacing="md">
                {result.produccion_total_kg != null && (
                  <Paper p="sm" withBorder style={{ textAlign: 'center' }}>
                    <Text size="xs" c="dimmed">Producción Total</Text>
                    <Text fw={700} size="lg">{formatNumber(result.produccion_total_kg)} {tipo === 'leche' ? 'L' : 'kg'}</Text>
                  </Paper>
                )}
                {result.ingreso_bruto != null && (
                  <Paper p="sm" withBorder style={{ textAlign: 'center' }}>
                    <Text size="xs" c="dimmed">Ingreso Bruto</Text>
                    <Text fw={700} size="lg" c="green">{formatCOP(result.ingreso_bruto)}</Text>
                  </Paper>
                )}
                {result.costo_total != null && (
                  <Paper p="sm" withBorder style={{ textAlign: 'center' }}>
                    <Text size="xs" c="dimmed">Costo Total</Text>
                    <Text fw={700} size="lg" c="red">{formatCOP(result.costo_total)}</Text>
                  </Paper>
                )}
                {result.utilidad_neta != null && (
                  <Paper p="sm" withBorder style={{ textAlign: 'center' }}>
                    <Text size="xs" c="dimmed">Utilidad Neta</Text>
                    <Text fw={700} size="lg" c={result.utilidad_neta >= 0 ? 'green' : 'red'}>{formatCOP(result.utilidad_neta)}</Text>
                  </Paper>
                )}
              </SimpleGrid>
              {result.rentabilidad_pct != null && (
                <Paper p="sm" withBorder mt="md" style={{ textAlign: 'center' }}>
                  <Text size="xs" c="dimmed">Rentabilidad</Text>
                  <RingProgress
                    size={100}
                    thickness={12}
                    sections={[{ value: Math.min(Math.abs(result.rentabilidad_pct), 100), color: result.rentabilidad_pct >= 0 ? 'green' : 'red' }]}
                    label={<Text fw={700} size="sm" ta="center">{result.rentabilidad_pct >= 0 ? '+' : ''}{result.rentabilidad_pct}%</Text>}
                  />
                </Paper>
              )}
            </Paper>
          </Stack>
        ) : (
          <Paper p="xl" withBorder style={{ textAlign: 'center' }}>
            <IconCalculator size={48} color="var(--mantine-color-gray-4)" />
            <Text c="dimmed" mt="sm">Configure los parámetros y presione Calcular</Text>
          </Paper>
        )}
      </Grid.Col>
    </Grid>
  )
}

export default function Recomendaciones() {
  return (
    <Stack gap="md">
      <Group gap="xs">
        <IconBulb size={28} color="var(--mantine-color-yellow-6)" />
        <Title order={3}>Recomendaciones Inteligentes</Title>
      </Group>
      <Text c="dimmed" size="sm">Motor de análisis de suelo, compatibilidad de cultivos, riego y cálculo de producción</Text>

      <Tabs defaultValue="suelo" variant="pills">
        <Tabs.List>
          <Tabs.Tab value="suelo" leftSection={<IconFlask size={16} />}>Análisis de Suelo</Tabs.Tab>
          <Tabs.Tab value="mixtos" leftSection={<IconLeaf size={16} />}>Cultivos Mixtos</Tabs.Tab>
          <Tabs.Tab value="riego" leftSection={<IconDroplet size={16} />}>Riego</Tabs.Tab>
          <Tabs.Tab value="calculadora" leftSection={<IconCalculator size={16} />}>Calculadora</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="suelo" pt="md"><AnalisisSueloTab /></Tabs.Panel>
        <Tabs.Panel value="mixtos" pt="md"><CultivosMixtosTab /></Tabs.Panel>
        <Tabs.Panel value="riego" pt="md"><RiegoTab /></Tabs.Panel>
        <Tabs.Panel value="calculadora" pt="md"><CalculadoraTab /></Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
