import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal,
  Select, NumberInput, Badge, ActionIcon, Stack, Tabs,
  SimpleGrid, Text, Tooltip, Progress, Divider,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPlus, IconCurrencyDollar, IconUsers, IconEye, IconX,
  IconSettings, IconFileDescription, IconBuildingBank,
  IconChevronRight,
} from '@tabler/icons-react'
import api from '../services/api.js'
import { formatCOP } from '../config.js'

const PARAMS_KEY = 'agrop_parametros_nomina'
const NOMINA_KEY = 'agrop_nominas'

const PARAMS_DEFAULT = {
  smmlv: 1300000,
  auxilio_transporte: 200000,
  tarifa_eps_empleado: 4,
  tarifa_pension_empleado: 4,
  tarifa_eps_empleador: 8.5,
  tarifa_pension_empleador: 12,
  tarifa_arl_1: 0.522,
  tarifa_arl_2: 1.044,
  tarifa_arl_3: 2.436,
  tarifa_arl_4: 4.35,
  tarifa_arl_5: 6.96,
  tarifa_ccf: 4,
  tarifa_sena: 2,
  tarifa_icbf: 3,
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const ESTADO_COLORS = { pagada: 'green', pendiente: 'yellow', anulada: 'red' }

const getMesNombre = (m) => MESES[parseInt(m) - 1] || m

const getArlRate = (params, riesgo) => {
  const key = `tarifa_arl_${riesgo || 1}`
  return parseFloat(params[key]) || 0.522
}

const calcularEmpleado = (emp, params, extras) => {
  const salario = parseFloat(emp.salario_base) || 0
  const smmlv = parseFloat(params.smmlv) || 1300000
  const auxTransporte = parseFloat(params.auxilio_transporte) || 200000
  const riesgoArl = parseInt(emp.riesgo_arl || emp.arl) || 1
  const arlRate = getArlRate(params, riesgoArl)

  const horasExtras = parseFloat(extras?.horas_extras) || 0
  const bonificaciones = parseFloat(extras?.bonificaciones) || 0
  const otrasDeducciones = parseFloat(extras?.otras_deducciones) || 0
  const auxilio = salario <= smmlv * 2 ? auxTransporte : 0

  const devengado = salario + auxilio + horasExtras + bonificaciones

  const deduccionSalud = Math.round(salario * parseFloat(params.tarifa_eps_empleado) / 100)
  const deduccionPension = Math.round(salario * parseFloat(params.tarifa_pension_empleado) / 100)
  const totalDeducciones = deduccionSalud + deduccionPension + otrasDeducciones

  const aporteEPS = Math.round(salario * parseFloat(params.tarifa_eps_empleador) / 100)
  const aportePension = Math.round(salario * parseFloat(params.tarifa_pension_empleador) / 100)
  const aporteARL = Math.round(salario * arlRate / 100)
  const aporteCCF = Math.round(salario * parseFloat(params.tarifa_ccf) / 100)
  const aporteSENA = Math.round(salario * parseFloat(params.tarifa_sena) / 100)
  const aporteICBF = Math.round(salario * parseFloat(params.tarifa_icbf) / 100)
  const prima = Math.round(salario * 8.33 / 100)
  const cesantias = Math.round(salario * 8.33 / 100)
  const interesesCesantias = Math.round(cesantias * 12 / 100)
  const vacaciones = Math.round(salario * 4.17 / 100)

  const totalAportes = aporteEPS + aportePension + aporteARL + aporteCCF
    + aporteSENA + aporteICBF + prima + cesantias + interesesCesantias + vacaciones

  return {
    empleado_id: emp.id,
    nombre: `${emp.nombre || ''} ${emp.apellido || ''}`.trim(),
    cargo: emp.cargo || '-',
    salario_base: salario,
    dias_trabajados: 30,
    horas_extras: horasExtras,
    auxilio_transporte: auxilio,
    bonificaciones: bonificaciones,
    otras_deducciones: otrasDeducciones,
    deduccion_salud: deduccionSalud,
    deduccion_pension: deduccionPension,
    total_deducciones: totalDeducciones,
    devengado: devengado,
    neto: devengado - totalDeducciones,
    riesgo_arl: riesgoArl,
    aporte_eps: aporteEPS,
    aporte_pension: aportePension,
    aporte_arl: aporteARL,
    aporte_ccf: aporteCCF,
    aporte_sena: aporteSENA,
    aporte_icbf: aporteICBF,
    prima: prima,
    cesantias: cesantias,
    intereses_cesantias: interesesCesantias,
    vacaciones: vacaciones,
    total_aportes_empleador: totalAportes,
  }
}

const loadInitialNominas = () => {
  try {
    const stored = localStorage.getItem(NOMINA_KEY)
    if (stored) return JSON.parse(stored)
  } catch (e) { console.warn('Error loading nominas', e) }
  return []
}

const loadInitialParams = () => {
  try {
    const stored = localStorage.getItem(PARAMS_KEY)
    if (stored) return { ...PARAMS_DEFAULT, ...JSON.parse(stored) }
  } catch (e) { console.warn('Error loading params', e) }
  return { ...PARAMS_DEFAULT }
}

export default function Nomina() {
  const [data, setData] = useState(loadInitialNominas)
  const [personal, setPersonal] = useState([])
  const [parametros, setParametros] = useState(loadInitialParams)
  const [editParams, setEditParams] = useState(loadInitialParams)
  const [activeTab, setActiveTab] = useState('nomina')

  const [opened, { open, close }] = useDisclosure(false)
  const [detalleOpened, { open: openDetalle, close: closeDetalle }] = useDisclosure(false)

  const [periodo, setPeriodo] = useState({
    mes: (new Date().getMonth() + 1).toString(),
    anio: new Date().getFullYear().toString(),
  })
  const [detallesPreview, setDetallesPreview] = useState([])
  const [selectedNomina, setSelectedNomina] = useState(null)
  const [liqPeriodo, setLiqPeriodo] = useState(null)
  const [aportPeriodo, setAportPeriodo] = useState(null)

  useEffect(() => {
    api.get('/personal/', { params: { activo: true } }).then(r => {
      setPersonal(r.data)
    }).catch(() => {
      api.get('/personal/').then(r => {
        setPersonal(r.data.filter(p => p.estado === 'activo'))
      }).catch(() => {
        console.log('Mock GET /api/personal/')
        setPersonal([])
      })
    })
  }, [])

  const persistNominas = (nominas) => {
    localStorage.setItem(NOMINA_KEY, JSON.stringify(nominas))
    setData(nominas)
  }

  const persistParametros = (p) => {
    localStorage.setItem(PARAMS_KEY, JSON.stringify(p))
    setParametros(p)
  }

  const previewNomina = () => {
    const activos = personal.filter(p => p.estado === 'activo')
    const dets = activos.map(emp => calcularEmpleado(emp, parametros, {}))
    setDetallesPreview(dets)
    open()
  }

  const handleUpdatePreview = (idx, field, value) => {
    setDetallesPreview(prev => {
      const next = [...prev]
      const emp = personal.find(p => p.id === next[idx].empleado_id)
      if (emp) {
        const current = next[idx]
        const extras = {
          horas_extras: field === 'horas_extras' ? (value || 0) : current.horas_extras,
          bonificaciones: field === 'bonificaciones' ? (value || 0) : current.bonificaciones,
          otras_deducciones: field === 'otras_deducciones' ? (value || 0) : current.otras_deducciones,
        }
        next[idx] = calcularEmpleado(emp, parametros, extras)
      }
      return next
    })
  }

  const handleGenerar = () => {
    if (detallesPreview.length === 0) {
      notifications.show({ title: 'Error', message: 'No hay empleados activos', color: 'red' })
      return
    }
    const totalDevengado = detallesPreview.reduce((s, d) => s + d.devengado, 0)
    const totalDeducciones = detallesPreview.reduce((s, d) => s + d.total_deducciones, 0)
    const totalNeto = detallesPreview.reduce((s, d) => s + d.neto, 0)
    const totalAportes = detallesPreview.reduce((s, d) => s + d.total_aportes_empleador, 0)

    const nomina = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      periodo: `${periodo.anio}-${periodo.mes.padStart(2, '0')}`,
      mes: parseInt(periodo.mes),
      anio: parseInt(periodo.anio),
      fecha_generacion: new Date().toISOString().split('T')[0],
      total_devengado: totalDevengado,
      total_deducciones: totalDeducciones,
      total_neto: totalNeto,
      total_aportes_empleador: totalAportes,
      total_empleados: detallesPreview.length,
      estado: 'pendiente',
      detalles: detallesPreview,
    }

    console.log('Mock POST /api/nominas/', {
      periodo: nomina.periodo, mes: nomina.mes, anio: nomina.anio,
      total_devengado: totalDevengado, total_deducciones: totalDeducciones,
      total_neto: totalNeto, total_aportes_empleador: totalAportes,
      total_empleados: detallesPreview.length, estado: 'pendiente',
    })

    const updated = [...data, nomina]
    persistNominas(updated)
    notifications.show({ title: 'Nómina generada', message: `Período ${getMesNombre(periodo.mes)} ${periodo.anio}`, color: 'green' })
    close()
  }

  const anularNomina = (id) => {
    const updated = data.map(n => n.id === id ? { ...n, estado: 'anulada' } : n)
    persistNominas(updated)
    notifications.show({ title: 'Nómina anulada', color: 'orange' })
  }

  const verDetalle = (nomina) => {
    setSelectedNomina(nomina)
    openDetalle()
  }

  const handleSaveParametros = () => {
    persistParametros(editParams)
    notifications.show({ title: 'Parámetros guardados', message: 'Las reglas de nómina se actualizaron correctamente', color: 'green' })
  }

  const nominasOrdenadas = [...data].sort((a, b) =>
    `${b.anio}-${b.mes}`.localeCompare(`${a.anio}-${a.mes}`)
  )

  const totalActivos = personal.filter(p => p.estado === 'activo').length
  const nominaPeriodoActual = data.find(n => {
    const now = new Date()
    return n.mes === now.getMonth() + 1 && n.anio === now.getFullYear() && n.estado !== 'anulada'
  })
  const totalNetoPeriodo = nominaPeriodoActual ? nominaPeriodoActual.total_neto : 0
  const totalAportesPeriodo = nominaPeriodoActual ? nominaPeriodoActual.total_aportes_empleador : 0

  const periods = [...new Set(data.map(n => n.periodo))].sort().reverse()
  const liqNomina = liqPeriodo ? data.find(n => n.periodo === liqPeriodo) : null
  const aportNomina = aportPeriodo ? data.find(n => n.periodo === aportPeriodo) : null

  const abrirReglas = () => {
    setEditParams({ ...parametros })
    setActiveTab('reglas')
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Nómina</Title>
        <Group>
          <Button leftSection={<IconSettings size={16} />} variant="light" onClick={abrirReglas}>
            Parámetros
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={previewNomina}>
            Generar Nómina
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Paper withBorder p="md">
          <Group><IconUsers size={18} /><Text size="xs" c="dimmed">Empleados Activos</Text></Group>
          <Text fw={700} size="xl">{totalActivos}</Text>
        </Paper>
        <Paper withBorder p="md">
          <Group><IconCurrencyDollar size={18} /><Text size="xs" c="dimmed">Nómina del Periodo</Text></Group>
          <Text fw={700} size="xl">{totalNetoPeriodo > 0 ? formatCOP(totalNetoPeriodo) : '$0'}</Text>
          {nominaPeriodoActual && <Badge size="sm" color={ESTADO_COLORS[nominaPeriodoActual.estado]} mt={4}>{nominaPeriodoActual.estado}</Badge>}
        </Paper>
        <Paper withBorder p="md">
          <Group><IconBuildingBank size={18} /><Text size="xs" c="dimmed">Aportes Empleador</Text></Group>
          <Text fw={700} size="xl">{totalAportesPeriodo > 0 ? formatCOP(totalAportesPeriodo) : '$0'}</Text>
        </Paper>
        <Paper withBorder p="md">
          <Group><IconFileDescription size={18} /><Text size="xs" c="dimmed">Neto a Pagar</Text></Group>
          <Text fw={700} size="xl" c="green.7">{totalNetoPeriodo > 0 ? formatCOP(totalNetoPeriodo) : '$0'}</Text>
        </Paper>
      </SimpleGrid>

      <Progress value={totalActivos > 0 ? 100 : 0} color="green" size="xs" />

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="nomina" leftSection={<IconFileDescription size={16} />}>Nómina</Tabs.Tab>
          <Tabs.Tab value="liquidacion" leftSection={<IconChevronRight size={16} />}>Liquidación</Tabs.Tab>
          <Tabs.Tab value="aportes" leftSection={<IconBuildingBank size={16} />}>Aportes</Tabs.Tab>
          <Tabs.Tab value="reglas" leftSection={<IconSettings size={16} />}>Reglas</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="nomina" pt="md">
          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Periodo</Table.Th>
                  <Table.Th>Empleados</Table.Th>
                  <Table.Th>Devengado</Table.Th>
                  <Table.Th>Deducciones</Table.Th>
                  <Table.Th>Aportes Empleador</Table.Th>
                  <Table.Th>Neto</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th style={{ width: 120 }}>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {nominasOrdenadas.map((n) => (
                  <Table.Tr key={n.id}>
                    <Table.Td fw={500}>{getMesNombre(n.mes)} {n.anio}</Table.Td>
                    <Table.Td>{n.total_empleados}</Table.Td>
                    <Table.Td>{formatCOP(n.total_devengado)}</Table.Td>
                    <Table.Td c="red">{formatCOP(n.total_deducciones)}</Table.Td>
                    <Table.Td>{formatCOP(n.total_aportes_empleador || 0)}</Table.Td>
                    <Table.Td fw={700}>{formatCOP(n.total_neto)}</Table.Td>
                    <Table.Td>
                      <Badge color={ESTADO_COLORS[n.estado] || 'gray'} size="sm">{n.estado}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Tooltip label="Ver detalle">
                          <ActionIcon variant="light" color="blue" size="sm" onClick={() => verDetalle(n)}>
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        {n.estado !== 'anulada' && (
                          <Tooltip label="Anular">
                            <ActionIcon variant="light" color="red" size="sm" onClick={() => anularNomina(n.id)}>
                              <IconX size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {nominasOrdenadas.length === 0 && (
                  <Table.Tr><Table.Td colSpan={8}><Text c="dimmed" ta="center" py="md">Sin nóminas registradas. Genere una nueva nómina usando el botón superior.</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="liquidacion" pt="md">
          <Stack>
            <Group>
              <Select
                label="Período"
                placeholder="Seleccionar período"
                data={periods.map(p => ({ value: p, label: p }))}
                value={liqPeriodo}
                onChange={setLiqPeriodo}
                clearable
                style={{ width: 200 }}
              />
              {liqNomina && <Badge size="lg" color={ESTADO_COLORS[liqNomina.estado]} mt="xl">{liqNomina.estado}</Badge>}
            </Group>

            {liqNomina ? (
              <Paper withBorder>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Empleado</Table.Th>
                      <Table.Th>Cargo</Table.Th>
                      <Table.Th>Salario Base</Table.Th>
                      <Table.Th>Aux. Transporte</Table.Th>
                      <Table.Th>Horas Extras</Table.Th>
                      <Table.Th>Bonificaciones</Table.Th>
                      <Table.Th>Devengado</Table.Th>
                      <Table.Th>Salud (-4%)</Table.Th>
                      <Table.Th>Pensión (-4%)</Table.Th>
                      <Table.Th>Otras Deduc.</Table.Th>
                      <Table.Th>Total Deduc.</Table.Th>
                      <Table.Th>Neto</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {liqNomina.detalles?.map((d, i) => (
                      <Table.Tr key={d.empleado_id || i}>
                        <Table.Td fw={500}>{d.nombre}</Table.Td>
                        <Table.Td><Badge size="sm" variant="light">{d.cargo}</Badge></Table.Td>
                        <Table.Td>{formatCOP(d.salario_base)}</Table.Td>
                        <Table.Td>{d.auxilio_transporte > 0 ? formatCOP(d.auxilio_transporte) : '$0'}</Table.Td>
                        <Table.Td>{d.horas_extras > 0 ? formatCOP(d.horas_extras) : '$0'}</Table.Td>
                        <Table.Td>{d.bonificaciones > 0 ? formatCOP(d.bonificaciones) : '$0'}</Table.Td>
                        <Table.Td fw={600}>{formatCOP(d.devengado)}</Table.Td>
                        <Table.Td c="red">{formatCOP(d.deduccion_salud)}</Table.Td>
                        <Table.Td c="red">{formatCOP(d.deduccion_pension)}</Table.Td>
                        <Table.Td c="red">{d.otras_deducciones > 0 ? formatCOP(d.otras_deducciones) : '$0'}</Table.Td>
                        <Table.Td c="red" fw={600}>{formatCOP(d.total_deducciones)}</Table.Td>
                        <Table.Td fw={700} c="green.7">{formatCOP(d.neto)}</Table.Td>
                      </Table.Tr>
                    ))}
                    {liqNomina.detalles?.length > 0 && (
                      <Table.Tr fw={700}>
                        <Table.Td colSpan={6}><Text ta="right">Totales:</Text></Table.Td>
                        <Table.Td>{formatCOP(liqNomina.detalles.reduce((s, d) => s + d.devengado, 0))}</Table.Td>
                        <Table.Td c="red">{formatCOP(liqNomina.detalles.reduce((s, d) => s + d.deduccion_salud, 0))}</Table.Td>
                        <Table.Td c="red">{formatCOP(liqNomina.detalles.reduce((s, d) => s + d.deduccion_pension, 0))}</Table.Td>
                        <Table.Td c="red">{formatCOP(liqNomina.detalles.reduce((s, d) => s + d.otras_deducciones, 0))}</Table.Td>
                        <Table.Td c="red">{formatCOP(liqNomina.detalles.reduce((s, d) => s + d.total_deducciones, 0))}</Table.Td>
                        <Table.Td c="green.7">{formatCOP(liqNomina.detalles.reduce((s, d) => s + d.neto, 0))}</Table.Td>
                      </Table.Tr>
                    )}
                    {(!liqNomina.detalles || liqNomina.detalles.length === 0) && (
                      <Table.Tr><Table.Td colSpan={12}><Text c="dimmed" ta="center" py="md">Sin detalles disponibles</Text></Table.Td></Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>
            ) : (
              <Paper withBorder p="xl">
                <Text c="dimmed" ta="center">Seleccione un período para ver la liquidación detallada</Text>
              </Paper>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="aportes" pt="md">
          <Stack>
            <Group>
              <Select
                label="Período"
                placeholder="Seleccionar período"
                data={periods.map(p => ({ value: p, label: p }))}
                value={aportPeriodo}
                onChange={setAportPeriodo}
                clearable
                style={{ width: 200 }}
              />
              {aportNomina && <Badge size="lg" color={ESTADO_COLORS[aportNomina.estado]} mt="xl">{aportNomina.estado}</Badge>}
            </Group>

            {aportNomina ? (
              <Paper withBorder>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Empleado</Table.Th>
                      <Table.Th>EPS (8.5%)</Table.Th>
                      <Table.Th>Pensión (12%)</Table.Th>
                      <Table.Th>ARL</Table.Th>
                      <Table.Th>CCF (4%)</Table.Th>
                      <Table.Th>SENA (2%)</Table.Th>
                      <Table.Th>ICBF (3%)</Table.Th>
                      <Table.Th>Prima (8.33%)</Table.Th>
                      <Table.Th>Cesantías (8.33%)</Table.Th>
                      <Table.Th>Int. Cesantías (1%)</Table.Th>
                      <Table.Th>Vacaciones (4.17%)</Table.Th>
                      <Table.Th>Total Aportes</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {aportNomina.detalles?.map((d, i) => (
                      <Table.Tr key={d.empleado_id || i}>
                        <Table.Td fw={500}>{d.nombre}</Table.Td>
                        <Table.Td>{formatCOP(d.aporte_eps)}</Table.Td>
                        <Table.Td>{formatCOP(d.aporte_pension)}</Table.Td>
                        <Table.Td>{formatCOP(d.aporte_arl)}</Table.Td>
                        <Table.Td>{formatCOP(d.aporte_ccf)}</Table.Td>
                        <Table.Td>{formatCOP(d.aporte_sena)}</Table.Td>
                        <Table.Td>{formatCOP(d.aporte_icbf)}</Table.Td>
                        <Table.Td>{formatCOP(d.prima)}</Table.Td>
                        <Table.Td>{formatCOP(d.cesantias)}</Table.Td>
                        <Table.Td>{formatCOP(d.intereses_cesantias)}</Table.Td>
                        <Table.Td>{formatCOP(d.vacaciones)}</Table.Td>
                        <Table.Td fw={700}>{formatCOP(d.total_aportes_empleador)}</Table.Td>
                      </Table.Tr>
                    ))}
                    {aportNomina.detalles?.length > 0 && (
                      <Table.Tr fw={700}>
                        <Table.Td>Totales:</Table.Td>
                        <Table.Td>{formatCOP(aportNomina.detalles.reduce((s, d) => s + d.aporte_eps, 0))}</Table.Td>
                        <Table.Td>{formatCOP(aportNomina.detalles.reduce((s, d) => s + d.aporte_pension, 0))}</Table.Td>
                        <Table.Td>{formatCOP(aportNomina.detalles.reduce((s, d) => s + d.aporte_arl, 0))}</Table.Td>
                        <Table.Td>{formatCOP(aportNomina.detalles.reduce((s, d) => s + d.aporte_ccf, 0))}</Table.Td>
                        <Table.Td>{formatCOP(aportNomina.detalles.reduce((s, d) => s + d.aporte_sena, 0))}</Table.Td>
                        <Table.Td>{formatCOP(aportNomina.detalles.reduce((s, d) => s + d.aporte_icbf, 0))}</Table.Td>
                        <Table.Td>{formatCOP(aportNomina.detalles.reduce((s, d) => s + d.prima, 0))}</Table.Td>
                        <Table.Td>{formatCOP(aportNomina.detalles.reduce((s, d) => s + d.cesantias, 0))}</Table.Td>
                        <Table.Td>{formatCOP(aportNomina.detalles.reduce((s, d) => s + d.intereses_cesantias, 0))}</Table.Td>
                        <Table.Td>{formatCOP(aportNomina.detalles.reduce((s, d) => s + d.vacaciones, 0))}</Table.Td>
                        <Table.Td>{formatCOP(aportNomina.detalles.reduce((s, d) => s + d.total_aportes_empleador, 0))}</Table.Td>
                      </Table.Tr>
                    )}
                    {(!aportNomina.detalles || aportNomina.detalles.length === 0) && (
                      <Table.Tr><Table.Td colSpan={12}><Text c="dimmed" ta="center" py="md">Sin detalles disponibles</Text></Table.Td></Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>
            ) : (
              <Paper withBorder p="xl">
                <Text c="dimmed" ta="center">Seleccione un período para ver los aportes del empleador</Text>
              </Paper>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="reglas" pt="md">
          <Paper withBorder p="lg">
            <Stack>
              <Title order={5}>Parámetros Generales</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                <NumberInput
                  label="SMMLV (Salario Mínimo)"
                  value={editParams.smmlv}
                  onChange={v => setEditParams({ ...editParams, smmlv: v })}
                  min={0} prefix="$ " thousandSeparator="." decimalSeparator=","
                />
                <NumberInput
                  label="Auxilio de Transporte"
                  value={editParams.auxilio_transporte}
                  onChange={v => setEditParams({ ...editParams, auxilio_transporte: v })}
                  min={0} prefix="$ " thousandSeparator="." decimalSeparator=","
                />
              </SimpleGrid>

              <Divider label="Tarifas Empleado" labelPosition="center" />
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                <NumberInput
                  label="EPS Empleado (%)"
                  value={editParams.tarifa_eps_empleado}
                  onChange={v => setEditParams({ ...editParams, tarifa_eps_empleado: v })}
                  min={0} max={100} decimalScale={2} suffix="%"
                />
                <NumberInput
                  label="Pensión Empleado (%)"
                  value={editParams.tarifa_pension_empleado}
                  onChange={v => setEditParams({ ...editParams, tarifa_pension_empleado: v })}
                  min={0} max={100} decimalScale={2} suffix="%"
                />
              </SimpleGrid>

              <Divider label="Tarifas Empleador" labelPosition="center" />
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                <NumberInput
                  label="EPS Empleador (%)"
                  value={editParams.tarifa_eps_empleador}
                  onChange={v => setEditParams({ ...editParams, tarifa_eps_empleador: v })}
                  min={0} max={100} decimalScale={2} suffix="%"
                />
                <NumberInput
                  label="Pensión Empleador (%)"
                  value={editParams.tarifa_pension_empleador}
                  onChange={v => setEditParams({ ...editParams, tarifa_pension_empleador: v })}
                  min={0} max={100} decimalScale={2} suffix="%"
                />
                <NumberInput
                  label="CCF - Caja Compensación (%)"
                  value={editParams.tarifa_ccf}
                  onChange={v => setEditParams({ ...editParams, tarifa_ccf: v })}
                  min={0} max={100} decimalScale={2} suffix="%"
                />
                <NumberInput
                  label="SENA (%)"
                  value={editParams.tarifa_sena}
                  onChange={v => setEditParams({ ...editParams, tarifa_sena: v })}
                  min={0} max={100} decimalScale={2} suffix="%"
                />
                <NumberInput
                  label="ICBF (%)"
                  value={editParams.tarifa_icbf}
                  onChange={v => setEditParams({ ...editParams, tarifa_icbf: v })}
                  min={0} max={100} decimalScale={2} suffix="%"
                />
              </SimpleGrid>

              <Divider label="ARL por Nivel de Riesgo" labelPosition="center" />
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                {[1, 2, 3, 4, 5].map(r => (
                  <NumberInput
                    key={r}
                    label={`ARL Riesgo ${r} (%)`}
                    value={editParams[`tarifa_arl_${r}`]}
                    onChange={v => setEditParams({ ...editParams, [`tarifa_arl_${r}`]: v })}
                    min={0} max={100} decimalScale={3} suffix="%"
                  />
                ))}
              </SimpleGrid>

              <Divider label="Provisiones" labelPosition="center" />
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                <NumberInput label="Prima (%)" value={8.33} disabled suffix="%" />
                <NumberInput label="Cesantías (%)" value={8.33} disabled suffix="%" />
                <NumberInput label="Intereses Cesantías (%)" value={1} disabled suffix="%" />
                <NumberInput label="Vacaciones (%)" value={4.17} disabled suffix="%" />
              </SimpleGrid>

              <Group justify="flex-end">
                <Button onClick={handleSaveParametros}>Guardar Parámetros</Button>
              </Group>
            </Stack>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={opened} onClose={close} title="Generar Nómina" size="xl">
        <Stack>
          <SimpleGrid cols={2}>
            <Select
              label="Mes"
              data={Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: MESES[i] }))}
              value={periodo.mes}
              onChange={v => setPeriodo({ ...periodo, mes: v })}
            />
            <Select
              label="Año"
              data={[2024, 2025, 2026].map(a => ({ value: a.toString(), label: a.toString() }))}
              value={periodo.anio}
              onChange={v => setPeriodo({ ...periodo, anio: v })}
            />
          </SimpleGrid>

          <Divider label={`Empleados Activos (${detallesPreview.length})`} labelPosition="center" />

          <div style={{ overflowX: 'auto' }}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Empleado</Table.Th>
                  <Table.Th>Cargo</Table.Th>
                  <Table.Th>Salario Base</Table.Th>
                  <Table.Th>Aux. Trans.</Table.Th>
                  <Table.Th>Horas Extras</Table.Th>
                  <Table.Th>Bonificaciones</Table.Th>
                  <Table.Th>Devengado</Table.Th>
                  <Table.Th>Salud (-4%)</Table.Th>
                  <Table.Th>Pensión (-4%)</Table.Th>
                  <Table.Th>Otras Deduc.</Table.Th>
                  <Table.Th>Neto</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {detallesPreview.map((d, i) => (
                  <Table.Tr key={d.empleado_id || i}>
                    <Table.Td fw={500}>{d.nombre}</Table.Td>
                    <Table.Td><Badge size="sm" variant="light">{d.cargo}</Badge></Table.Td>
                    <Table.Td>{formatCOP(d.salario_base)}</Table.Td>
                    <Table.Td><Badge size="sm" color={d.auxilio_transporte > 0 ? 'blue' : 'gray'}>{formatCOP(d.auxilio_transporte)}</Badge></Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={d.horas_extras}
                        onChange={v => handleUpdatePreview(i, 'horas_extras', v || 0)}
                        min={0} size="xs" style={{ width: 100 }} prefix="$ " hideControls
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={d.bonificaciones}
                        onChange={v => handleUpdatePreview(i, 'bonificaciones', v || 0)}
                        min={0} size="xs" style={{ width: 100 }} prefix="$ " hideControls
                      />
                    </Table.Td>
                    <Table.Td fw={600}>{formatCOP(d.devengado)}</Table.Td>
                    <Table.Td c="red"><Badge size="sm" color="red" variant="light">{formatCOP(d.deduccion_salud)}</Badge></Table.Td>
                    <Table.Td c="red"><Badge size="sm" color="red" variant="light">{formatCOP(d.deduccion_pension)}</Badge></Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={d.otras_deducciones}
                        onChange={v => handleUpdatePreview(i, 'otras_deducciones', v || 0)}
                        min={0} size="xs" style={{ width: 100 }} prefix="$ " hideControls
                      />
                    </Table.Td>
                    <Table.Td fw={700} c="green.7">{formatCOP(d.neto)}</Table.Td>
                  </Table.Tr>
                ))}
                {detallesPreview.length > 0 && (
                  <Table.Tr fw={700}>
                    <Table.Td colSpan={6}><Text ta="right">Totales:</Text></Table.Td>
                    <Table.Td>{formatCOP(detallesPreview.reduce((s, d) => s + d.devengado, 0))}</Table.Td>
                    <Table.Td c="red">{formatCOP(detallesPreview.reduce((s, d) => s + d.deduccion_salud, 0))}</Table.Td>
                    <Table.Td c="red">{formatCOP(detallesPreview.reduce((s, d) => s + d.deduccion_pension, 0))}</Table.Td>
                    <Table.Td c="red">{formatCOP(detallesPreview.reduce((s, d) => s + d.otras_deducciones, 0))}</Table.Td>
                    <Table.Td c="green.7">{formatCOP(detallesPreview.reduce((s, d) => s + d.neto, 0))}</Table.Td>
                  </Table.Tr>
                )}
                {detallesPreview.length === 0 && (
                  <Table.Tr><Table.Td colSpan={11}><Text c="dimmed" ta="center" py="md">No hay empleados activos disponibles para este período</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </div>

          <Group justify="flex-end">
            <Button variant="default" onClick={close}>Cancelar</Button>
            <Button onClick={handleGenerar} disabled={detallesPreview.length === 0}>
              Generar Nómina
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={detalleOpened}
        onClose={closeDetalle}
        title={selectedNomina ? `Detalle - ${getMesNombre(selectedNomina.mes)} ${selectedNomina.anio}` : 'Detalle'}
        size="xl"
      >
        {selectedNomina && selectedNomina.detalles && (
          <Stack>
            <SimpleGrid cols={4}>
              <Paper withBorder p="sm" ta="center">
                <Text size="xs" c="dimmed">Total Devengado</Text>
                <Text fw={700} size="md">{formatCOP(selectedNomina.total_devengado)}</Text>
              </Paper>
              <Paper withBorder p="sm" ta="center">
                <Text size="xs" c="dimmed">Total Deducciones</Text>
                <Text fw={700} size="md" c="red">{formatCOP(selectedNomina.total_deducciones)}</Text>
              </Paper>
              <Paper withBorder p="sm" ta="center">
                <Text size="xs" c="dimmed">Aportes Empleador</Text>
                <Text fw={700} size="md" c="blue">{formatCOP(selectedNomina.total_aportes_empleador)}</Text>
              </Paper>
              <Paper withBorder p="sm" ta="center">
                <Text size="xs" c="dimmed">Neto a Pagar</Text>
                <Text fw={700} size="md" c="green.7">{formatCOP(selectedNomina.total_neto)}</Text>
              </Paper>
            </SimpleGrid>

            <Divider label="Liquidación por Empleado" labelPosition="center" />

            {selectedNomina.detalles.map((d, i) => {
              const costoTotal = d.salario_base + d.auxilio_transporte + d.total_aportes_empleador
              return (
                <Paper key={d.empleado_id || i} withBorder p="md">
                  <Group justify="space-between" mb="xs">
                    <Group>
                      <Text fw={700}>{d.nombre}</Text>
                      <Badge size="sm" variant="light">{d.cargo}</Badge>
                    </Group>
                    <Badge size="sm">ARL Riesgo {d.riesgo_arl || 1}</Badge>
                  </Group>

                  <SimpleGrid cols={{ base: 1, sm: 3 }}>
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed">Devengado</Text>
                      <Group gap={4}>
                        <Badge size="sm" variant="light" color="gray">Salario: {formatCOP(d.salario_base)}</Badge>
                        {d.auxilio_transporte > 0 && <Badge size="sm" variant="light" color="blue">Aux.Trans: {formatCOP(d.auxilio_transporte)}</Badge>}
                        {d.horas_extras > 0 && <Badge size="sm" variant="light" color="violet">H.Extras: {formatCOP(d.horas_extras)}</Badge>}
                        {d.bonificaciones > 0 && <Badge size="sm" variant="light" color="teal">Bonif: {formatCOP(d.bonificaciones)}</Badge>}
                      </Group>
                      <Text fw={600}>{formatCOP(d.devengado)}</Text>
                    </Stack>
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed">Deducciones</Text>
                      <Group gap={4}>
                        <Badge size="sm" color="red" variant="light">EPS: {formatCOP(d.deduccion_salud)}</Badge>
                        <Badge size="sm" color="red" variant="light">Pensión: {formatCOP(d.deduccion_pension)}</Badge>
                        {d.otras_deducciones > 0 && <Badge size="sm" color="orange" variant="light">Otras: {formatCOP(d.otras_deducciones)}</Badge>}
                      </Group>
                      <Text fw={600} c="red">{formatCOP(d.total_deducciones)}</Text>
                    </Stack>
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed">Aportes Empleador</Text>
                      <Group gap={4}>
                        <Badge size="sm" variant="light" color="indigo">EPS: {formatCOP(d.aporte_eps)}</Badge>
                        <Badge size="sm" variant="light" color="indigo">Pensión: {formatCOP(d.aporte_pension)}</Badge>
                        <Badge size="sm" variant="light" color="indigo">ARL: {formatCOP(d.aporte_arl)}</Badge>
                        <Badge size="sm" variant="light" color="indigo">CCF: {formatCOP(d.aporte_ccf)}</Badge>
                        <Badge size="sm" variant="light" color="indigo">SENA: {formatCOP(d.aporte_sena)}</Badge>
                        <Badge size="sm" variant="light" color="indigo">ICBF: {formatCOP(d.aporte_icbf)}</Badge>
                        <Badge size="sm" variant="light" color="cyan">Prima: {formatCOP(d.prima)}</Badge>
                        <Badge size="sm" variant="light" color="cyan">Cesantías: {formatCOP(d.cesantias)}</Badge>
                        <Badge size="sm" variant="light" color="cyan">Int.Ces: {formatCOP(d.intereses_cesantias)}</Badge>
                        <Badge size="sm" variant="light" color="cyan">Vacaciones: {formatCOP(d.vacaciones)}</Badge>
                      </Group>
                      <Text fw={600} c="blue">{formatCOP(d.total_aportes_empleador)}</Text>
                    </Stack>
                  </SimpleGrid>

                  <Divider my="xs" />

                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Costo total empleado: {formatCOP(costoTotal)}</Text>
                    <Badge size="lg" color="green">Neto: {formatCOP(d.neto)}</Badge>
                  </Group>
                </Paper>
              )
            })}

            <Group justify="flex-end">
              <Button variant="default" onClick={closeDetalle}>Cerrar</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
