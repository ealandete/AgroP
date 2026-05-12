import { useState, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Affix, ActionIcon, Paper, Stack, Text, Title, Group, Badge,
  Kbd, Button, ScrollArea, Tabs, ThemeIcon, TextInput, Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconHelp, IconX, IconBulb, IconBook, IconVocabulary,
  IconVideo, IconKeyboard, IconSearch, IconMap, IconPlant, IconCoin,
  IconPig, IconDashboard, IconUsers, IconBox, IconAlertTriangle,
  IconCalendarEvent, IconActivity, IconChartBar, IconFileDownload,
  IconShield, IconCertificate, IconBug, IconMail, IconDeviceSdCard,
  IconFish, IconTree, IconDroplet, IconApple, IconMedicineSyrup,
  IconTractor, IconUsersGroup, IconFileSpreadsheet, IconReportAnalytics,
  IconClipboardList, IconHealthRecognition, IconStethoscope, IconSettings,
  IconBulldozer, IconShieldCheck,
} from '@tabler/icons-react'
import ManualUsuario from './ManualUsuario'

const ROUTE_HELP = {
  '/': {
    title: 'Dashboard',
    description: 'Panel principal con indicadores clave de tu finca: total de animales, cultivos activos, alertas pendientes, ingresos y gastos del mes.',
    icon: IconDashboard,
    tips: [
      'Personaliza los widgets desde el menú de configuración',
      'Haz clic en cualquier tarjeta para ir al detalle',
      'Los gráficos se actualizan automáticamente',
      'Usa los filtros de fecha para ver periodos específicos',
    ],
    video: 'dashboard',
  },
  '/animales': {
    title: 'Ganadería',
    description: 'Gestiona todos tus animales: registro individual, grupos de manejo, salud, producción, pesajes, reproducción y más.',
    icon: IconPig,
    tips: [
      'Usa códigos únicos (chapeta/arete) para cada animal',
      'Asigna grupos de manejo para filtrar y buscar fácilmente',
      'Registra eventos de salud periódicamente (vacunas, desparasitaciones)',
      'Exporta tu inventario a CSV/Excel desde el botón Exportar',
      'Usa el filtro por especie para ver solo bovinos, porcinos, etc.',
    ],
    video: 'animales',
  },
  '/cultivos': {
    title: 'Cultivos',
    description: 'Administra siembras, cosechas y tratamientos. Asocia cada cultivo a un lote y lleva el control de costos de producción.',
    icon: IconPlant,
    tips: [
      'Planifica tus siembras por temporada',
      'Asocia cada cultivo a un lote en el mapa',
      'Lleva registro de tratamientos y fertilizantes aplicados',
      'Programa cosechas desde el módulo de Planeación',
      'Calcula costos de producción por cultivo',
    ],
    video: 'cultivos',
  },
  '/lotes': {
    title: 'Lotes y Mapas',
    description: 'Dibuja tus lotes en el mapa, mide áreas automáticamente, planifica el uso del suelo y visualiza la rotación de cultivos.',
    icon: IconMap,
    tips: [
      'Usa el dibujador de mapas para delimitar lotes con polígonos',
      'Mide áreas automáticamente',
      'Asigna cultivos a cada lote por temporada',
      'Visualiza la rotación de cultivos',
      'Exporta el mapa como imagen',
    ],
    video: 'lotes',
  },
  '/operaciones': {
    title: 'Operaciones',
    description: 'Registro de actividades diarias: labores culturales, mantenimiento, riego, aplicación de insumos y más.',
    icon: IconActivity,
    tips: [
      'Registra las operaciones diarias para llevar la trazabilidad',
      'Asigna tareas a trabajadores específicos',
      'Programa operaciones recurrentes',
      'Adjunta fotos a las operaciones realizadas',
    ],
    video: 'operaciones',
  },
  '/grupos-manejo': {
    title: 'Grupos de Manejo',
    description: 'Agrupa tus animales por categorías: destetos, levante, ceba, vientres, toros. Simplifica la gestión masiva.',
    icon: IconUsersGroup,
    tips: [
      'Crea grupos por etapa productiva',
      'Asigna animales de forma masiva a un grupo',
      'Usa grupos para filtrar en reportes',
      'Los grupos pueden basarse en edad, peso o raza',
    ],
    video: 'grupos-manejo',
  },
  '/plantillas': {
    title: 'Plantillas',
    description: 'Crea y gestiona plantillas para eventos, pesajes, operaciones y documentos. Ahorra tiempo en registros repetitivos.',
    icon: IconFileSpreadsheet,
    tips: [
      'Crea plantillas para eventos sanitarios recurrentes',
      'Usa plantillas para pesajes periódicos',
      'Comparte plantillas entre usuarios de la misma finca',
      'Personaliza los campos de cada plantilla',
    ],
    video: 'plantillas',
  },
  '/planeacion': {
    title: 'Planeación',
    description: 'Calendario de actividades programadas: vacunaciones, desparasitaciones, cosechas, inseminaciones y más.',
    icon: IconCalendarEvent,
    tips: [
      'Programa actividades con anticipación',
      'Recibe recordatorios de actividades próximas',
      'Visualiza el calendario por mes o semana',
      'Asigna responsables a cada actividad',
    ],
    video: 'planeacion',
  },
  '/equipos': {
    title: 'Equipos y Maquinaria',
    description: 'Control de equipos, maquinaria agrícola y vehículos: mantenimiento, combustible, horas de uso, asignación.',
    icon: IconTractor,
    tips: [
      'Registra cada equipo con su ficha técnica',
      'Programa mantenimientos preventivos',
      'Lleva control de combustible y horas de uso',
      'Recibe alertas de vencimiento de seguros o SOAT',
    ],
    video: 'equipos',
  },
  '/alertas': {
    title: 'Alertas',
    description: 'Notificaciones de eventos sanitarios, tareas vencidas, cumpleaños de animales, vencimientos y más.',
    icon: IconAlertTriangle,
    tips: [
      'Las alertas se generan automáticamente según la programación',
      'Marca alertas como leídas al atenderlas',
      'Configura tipos de alerta desde Administración',
      'Las alertas críticas se muestran en el Dashboard',
    ],
    video: 'alertas',
  },
  '/farmacia': {
    title: 'Farmacia',
    description: 'Control de medicamentos veterinarios: inventario, lotes, fechas de vencimiento, aplicaciones por animal.',
    icon: IconMedicineSyrup,
    tips: [
      'Registra cada medicamento con lote y vencimiento',
      'Asocia aplicaciones a animales específicos',
      'Recibe alertas de medicamentos próximos a vencer',
      'Lleva control de dosificación por especie',
    ],
    video: 'farmacia',
  },
  '/agua': {
    title: 'Agua',
    description: 'Gestión del recurso hídrico: fuentes de agua, consumo, calidad, infraestructura de riego y bebederos.',
    icon: IconDroplet,
    tips: [
      'Registra las fuentes de agua de tu finca',
      'Mide el consumo diario o semanal',
      'Programa análisis de calidad del agua',
      'Planifica el riego según cultivos y clima',
    ],
    video: 'agua',
  },
  '/alimentacion': {
    title: 'Alimentación',
    description: 'Gestión de la alimentación animal: raciones, suplementos, pastos, concentrados, programación de comidas.',
    icon: IconApple,
    tips: [
      'Crea raciones por tipo de animal y etapa productiva',
      'Programa horarios de alimentación',
      'Controla el inventario de concentrados y suplementos',
      'Calcula costos de alimentación por animal',
    ],
    video: 'alimentacion',
  },
  '/picicultura': {
    title: 'Picicultura',
    description: 'Gestión de peces: estanques, siembra de alevinos, cosecha, alimentación, parámetros de calidad de agua.',
    icon: IconFish,
    tips: [
      'Registra cada estanque con sus dimensiones',
      'Controla la densidad de siembra',
      'Mide parámetros de calidad de agua (pH, oxígeno, temperatura)',
      'Programa cosechas por peso promedio',
    ],
    video: 'picicultura',
  },
  '/suelos': {
    title: 'Suelos y Análisis',
    description: 'Análisis de suelos, fertilidad, pH, materia orgánica. Plan de fertilización por lote y cultivo.',
    icon: IconBulldozer,
    tips: [
      'Toma muestras de suelo por lote',
      'Registra resultados de análisis de laboratorio',
      'Genera planes de fertilización personalizados',
      'Histórico de análisis por lote',
    ],
    video: 'suelos',
  },
  '/sensores': {
    title: 'Sensores IoT',
    description: 'Integración con sensores: temperatura, humedad, lluvia, peso automático. Monitoreo en tiempo real.',
    icon: IconDeviceSdCard,
    tips: [
      'Conecta sensores compatibles vía API',
      'Visualiza datos en tiempo real en el Dashboard',
      'Configura alertas por umbrales',
      'Exporta históricos de sensores',
    ],
    video: 'sensores',
  },
  '/forestal': {
    title: 'Forestal',
    description: 'Gestión de plantaciones forestales: especies, lotes, crecimiento, podas, aprovechamiento y certificaciones.',
    icon: IconTree,
    tips: [
      'Registra parcelas forestales con especie y fecha de siembra',
      'Mide crecimiento periódicamente',
      'Programa podas y raleos',
      'Gestiona permisos de aprovechamiento',
    ],
    video: 'forestal',
  },
  '/especies': {
    title: 'Especies',
    description: 'Menú de acceso rápido a las diferentes especies: bovinos, porcinos, aves, equinos, ovinos, caprinos y más.',
    icon: IconPlant,
    tips: [
      'Selecciona la especie para ver sus registros',
      'Cada especie tiene sus propios parámetros',
      'Puedes personalizar los campos por especie',
      'Las especies se configuran desde Administración',
    ],
    video: 'especies',
  },
  '/contabilidad': {
    title: 'Contabilidad',
    description: 'Contabilidad completa con PUC colombiano integrado: facturas, costos, presupuestos, libro contable, ingresos vs gastos.',
    icon: IconCoin,
    tips: [
      'Usa el PUC colombiano integrado para clasificar cuentas',
      'Genera reportes de ingresos vs gastos mensuales',
      'Programa presupuestos anuales',
      'Exporta tu libro contable a Excel',
      'Concilia tus movimientos bancarios',
    ],
    video: 'contabilidad',
  },
  '/nomina': {
    title: 'Nómina',
    description: 'Gestión de nómina: liquidación de salarios, prestaciones sociales, seguridad social, provisiones.',
    icon: IconClipboardList,
    tips: [
      'Calcula la nómina automáticamente según SMMLV',
      'Liquida prestaciones sociales',
      'Genera comprobantes de pago',
      'Exporta reportes de nómina a Excel/PDF',
    ],
    video: 'nomina',
  },
  '/inventario': {
    title: 'Inventario',
    description: 'Control de insumos, productos agrícolas, concentrados, medicamentos, herramientas y todo tipo de existencias.',
    icon: IconBox,
    tips: [
      'Clasifica items por categoría',
      'Lleva control de entradas y salidas',
      'Configura stock mínimo para alertas',
      'Realiza inventarios físicos periódicos',
    ],
    video: 'inventario',
  },
  '/trabajadores': {
    title: 'Trabajadores',
    description: 'Gestión de empleados: registro, roles, horarios, asistencia, liquidación de prestaciones y contratos.',
    icon: IconUsers,
    tips: [
      'Registra cada trabajador con su documento y rol',
      'Controla la asistencia diaria',
      'Liquida prestaciones sociales automáticamente',
      'Gestiona contratos y afiliaciones',
    ],
    video: 'trabajadores',
  },
  '/mensajeria': {
    title: 'Mensajería',
    description: 'Sistema de mensajería interna entre usuarios de la finca. Notificaciones y comunicación interna.',
    icon: IconMail,
    tips: [
      'Envía mensajes a otros usuarios de tu finca',
      'Recibe notificaciones de eventos importantes',
      'Comparte documentos y archivos',
      'Los mensajes quedan registrados para auditoría',
    ],
    video: 'mensajeria',
  },
  '/sst': {
    title: 'SST (Seguridad y Salud)',
    description: 'Gestión de seguridad y salud en el trabajo: matriz de peligros, ARL, capacitaciones, incidentes, EPI.',
    icon: IconHealthRecognition,
    tips: [
      'Mantén actualizada la matriz de peligros',
      'Registra incidentes y accidentes de trabajo',
      'Programa capacitaciones periódicas',
      'Gestiona la entrega de EPI',
    ],
    video: 'sst',
  },
  '/bioseguridad': {
    title: 'Bioseguridad',
    description: 'Protocolos y registro de medidas sanitarias: ingreso a la finca, desinfección, cuarentenas, control de plagas.',
    icon: IconShield,
    tips: [
      'Define protocolos de bioseguridad por área',
      'Registra el ingreso de vehículos y personas',
      'Controla cuarentenas de nuevos animales',
      'Documenta las medidas de desinfección',
    ],
    video: 'bioseguridad',
  },
  '/procedimientos-veterinarios': {
    title: 'Procedimientos Veterinarios',
    description: 'Protocolos veterinarios: cirugías, tratamientos, diagnósticos, recetas, seguimiento de casos clínicos.',
    icon: IconStethoscope,
    tips: [
      'Documenta procedimientos con fotos y observaciones',
      'Asocia recetas a la farmacia',
      'Programa seguimientos de casos',
      'Genera informes veterinarios por animal',
    ],
    video: 'procedimientos-veterinarios',
  },
  '/certificaciones': {
    title: 'Certificaciones',
    description: 'Gestión de certificaciones agropecuarias: BPA, orgánico, comercio justo, global GAP, ICA.',
    icon: IconCertificate,
    tips: [
      'Lleva el registro de certificaciones vigentes',
      'Programa auditorías de seguimiento',
      'Adjunta documentos y actas',
      'Recibe alertas de vencimiento de certificaciones',
    ],
    video: 'certificaciones',
  },
  '/trazabilidad': {
    title: 'Trazabilidad',
    description: 'Seguimiento de productos desde el origen: animales, cultivos, insumos. Códigos QR y blockchain.',
    icon: IconSearch,
    tips: [
      'Usa códigos QR para identificar productos',
      'Consulta el historial completo de cada producto',
      'Integra con sistemas de trazabilidad ICA',
      'Genera reportes de trazabilidad por lote',
    ],
    video: 'trazabilidad',
  },
  '/estadisticas': {
    title: 'Estadísticas',
    description: 'Reportes gráficos y análisis de datos: producción, crecimiento, finanzas, comparativas, tendencias.',
    icon: IconChartBar,
    tips: [
      'Personaliza los gráficos por periodo y variable',
      'Exporta gráficos como imagen',
      'Compara periodos (mes a mes, año a año)',
      'Los datos se actualizan en tiempo real',
    ],
    video: 'estadisticas',
  },
  '/recomendaciones': {
    title: 'Recomendaciones',
    description: 'Recomendaciones inteligentes basadas en datos de la finca: sanidad, nutrición, manejo, mejora genética.',
    icon: IconBulb,
    tips: [
      'Las recomendaciones se generan automáticamente',
      'Basadas en datos históricos de tu finca',
      'Incluyen alertas tempranas de problemas',
      'Sugerencias de mejora productiva',
    ],
    video: 'recomendaciones',
  },
  '/exportar': {
    title: 'Reportes',
    description: 'Exportación de datos a CSV, Excel y PDF. Reportes personalizados por módulo y periodo.',
    icon: IconFileDownload,
    tips: [
      'Selecciona el módulo y periodo a exportar',
      'Elige el formato: CSV, Excel o PDF',
      'Programa exportaciones automáticas',
      'Los reportes incluyen gráficos en PDF',
    ],
    video: 'reportes',
  },
  '/cumplimiento': {
    title: 'Cumplimiento',
    description: 'Indicadores de cumplimiento: metas productivas, financieras, sanitarias. Seguimiento de objetivos.',
    icon: IconShieldCheck,
    tips: [
      'Define metas por periodo (mensual, trimestral, anual)',
      'Visualiza el avance de cada meta',
      'Recibe alertas de desviaciones',
      'Exporta informes de cumplimiento',
    ],
    video: 'cumplimiento',
  },
  '/admin-sistema': {
    title: 'Administración del Sistema',
    description: 'Configuración avanzada: usuarios, roles, permisos, respaldos, logs de actividad, parámetros globales.',
    icon: IconSettings,
    tips: [
      'Gestiona usuarios y roles de acceso',
      'Revisa los logs de actividad del sistema',
      'Configura respaldos automáticos',
      'Personaliza parámetros globales de la finca',
    ],
    video: 'admin-sistema',
  },
  '/configuracion': {
    title: 'Configuración',
    description: 'Ajustes de usuario y finca: perfil, preferencias, modo sencillo, notificaciones, personalización.',
    icon: IconSettings,
    tips: [
      'Activa Modo Sencillo para acceso rápido',
      'Configura tus notificaciones preferidas',
      'Cambia entre fincas desde aquí',
      'Personaliza la apariencia del sistema',
    ],
    video: 'configuracion',
  },
  '/consolidado': {
    title: 'Consolidado Contable',
    description: 'Visión consolidada de contabilidad, nómina, inventario y finanzas en un solo reporte.',
    icon: IconReportAnalytics,
    tips: [
      'Visualiza el estado financiero consolidado',
      'Incluye contabilidad, nómina e inventario',
      'Genera reportes por periodo',
      'Exporta el consolidado completo',
    ],
    video: 'consolidado',
  },
}

const DEFAULT_HELP = {
  title: 'AgroP',
  description: 'Bienvenido a AgroP. Selecciona un módulo en el menú lateral para empezar a gestionar tu finca.',
  icon: IconDashboard,
  tips: [
    'Usa el menú lateral para navegar entre módulos',
    'Activa Modo Sencillo desde el menú de usuario para acceso rápido',
    'Tus datos se guardan automáticamente',
    'Puedes cambiar de finca desde el menú superior',
    'Pulsa Ctrl+H para abrir esta ayuda desde cualquier pantalla',
  ],
  video: 'bienvenido',
}

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: 'Búsqueda global en el sistema' },
  { keys: ['Ctrl', 'N'], description: 'Nuevo registro (según módulo actual)' },
  { keys: ['Ctrl', 'E'], description: 'Exportar datos del módulo actual' },
  { keys: ['Ctrl', 'H'], description: 'Abrir / cerrar ayuda contextual' },
  { keys: ['Ctrl', 'M'], description: 'Alternar Modo Sencillo' },
  { keys: ['Escape'], description: 'Cerrar modal / Cancelar acción' },
  { keys: ['F5'], description: 'Recargar datos del módulo actual' },
  { keys: ['Ctrl', 'S'], description: 'Guardar formulario actual' },
  { keys: ['Ctrl', 'F'], description: 'Buscar en listados' },
  { keys: ['Ctrl', 'P'], description: 'Imprimir reporte actual' },
  { keys: ['?'], description: 'Mostrar esta ayuda' },
  { keys: ['Ctrl', 'Enter'], description: 'Enviar formulario / Guardar' },
]

const EXTRA_SHORTCUTS = [
  { keys: ['Ctrl', 'Shift', 'A'], description: 'Crear animal rápido' },
  { keys: ['Ctrl', 'Shift', 'E'], description: 'Registrar evento sanitario' },
  { keys: ['Ctrl', 'Shift', 'P'], description: 'Registrar pesaje' },
  { keys: ['Ctrl', 'Shift', 'V'], description: 'Abrir asistente virtual' },
  { keys: ['Ctrl', 'B'], description: 'Ir al Dashboard' },
  { keys: ['Alt', '1'], description: 'Ir a Ganadería' },
  { keys: ['Alt', '2'], description: 'Ir a Cultivos' },
  { keys: ['Alt', '3'], description: 'Ir a Lotes' },
  { keys: ['Alt', '4'], description: 'Ir a Contabilidad' },
  { keys: ['Ctrl', 'Shift', 'R'], description: 'Recargar todos los datos' },
]

const MODULE_VIDEOS = [
  { id: 'dashboard', label: 'Dashboard y resumen', tiempo: '3:24' },
  { id: 'animales', label: 'Gestión de animales', tiempo: '8:15' },
  { id: 'cultivos', label: 'Gestión de cultivos', tiempo: '6:42' },
  { id: 'lotes', label: 'Lotes y mapas', tiempo: '5:30' },
  { id: 'contabilidad', label: 'Contabilidad y finanzas', tiempo: '10:00' },
  { id: 'planeacion', label: 'Planeación y alertas', tiempo: '4:18' },
  { id: 'inventario', label: 'Inventario y farmacia', tiempo: '5:45' },
  { id: 'trabajadores', label: 'Trabajadores y nómina', tiempo: '7:20' },
  { id: 'reportes', label: 'Reportes y exportación', tiempo: '4:50' },
  { id: 'configuracion', label: 'Configuración del sistema', tiempo: '3:10' },
]

export default function HelpButton() {
  const location = useLocation()
  const [opened, { open, close }] = useDisclosure(false)
  const [manualOpened, { open: openManual, close: closeManual }] = useDisclosure(false)
  const [tab, setTab] = useState('como')
  const [search, setSearch] = useState('')

  const path = location.pathname
  const help = ROUTE_HELP[path] || DEFAULT_HELP

  const handleOpen = useCallback(() => {
    setTab('como')
    setSearch('')
    open()
  }, [open])

  const showVideo = useCallback((videoId, label) => {
    notifications.show({
      title: `Video: ${label}`,
      message: `Próximamente disponible. Video tutorial de ${label} en producción.`,
      color: 'blue',
      icon: <IconVideo size={16} />,
    })
  }, [])

  const reportProblem = useCallback(() => {
    notifications.show({
      title: 'Reportar problema',
      message: 'Puedes escribirnos a soporte@agrop.com o llamarnos al +57 300 000 0000',
      color: 'red',
      icon: <IconBug size={16} />,
    })
  }, [])

  const filteredVideos = useMemo(() => {
    if (!search) return MODULE_VIDEOS
    const q = search.toLowerCase()
    return MODULE_VIDEOS.filter(v => v.label.toLowerCase().includes(q) || v.id.includes(q))
  }, [search])

  return (
    <>
      <Affix position={{ bottom: 24, left: 24 }} zIndex={1000}>
        <Tooltip label={opened ? 'Cerrar ayuda' : 'Ayuda contextual'} position="right">
          <ActionIcon
            variant="filled"
            color="blue"
            size={48}
            radius="xl"
            onClick={handleOpen}
            styles={{ root: { boxShadow: '0 4px 16px rgba(0,0,0,0.25)' } }}
          >
            {opened ? <IconX size={24} /> : <IconHelp size={24} />}
          </ActionIcon>
        </Tooltip>
      </Affix>

      <Paper
        shadow="lg"
        withBorder
        style={{
          position: 'fixed',
          bottom: 84,
          left: 24,
          width: 400,
          maxHeight: 'calc(100vh - 180px)',
          borderRadius: 16,
          zIndex: 1000,
          display: opened ? 'flex' : 'none',
          flexDirection: 'column',
        }}
      >
        <Group p="md" pb={0} justify="space-between">
          <Group gap="xs">
            <ThemeIcon variant="light" color="blue" size="md" radius="xl">
              <help.icon size={18} />
            </ThemeIcon>
            <Title order={5}>{help.title}</Title>
          </Group>
          <ActionIcon variant="subtle" onClick={close} size="sm"><IconX size={16} /></ActionIcon>
        </Group>

        <Tabs value={tab} onChange={setTab} variant="pills" p="md" pb={0}>
          <Tabs.List>
            <Tabs.Tab value="como" leftSection={<IconBulb size={14} />}>Ayuda</Tabs.Tab>
            <Tabs.Tab value="tips" leftSection={<IconKeyboard size={14} />}>Tips</Tabs.Tab>
            <Tabs.Tab value="videos" leftSection={<IconVideo size={14} />}>Videos</Tabs.Tab>
            <Tabs.Tab value="glosario" leftSection={<IconVocabulary size={14} />}>Glosario</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <ScrollArea style={{ flex: 1 }} p="md" pt="sm">
          {tab === 'como' && (
            <Stack gap="sm">
              <Text size="sm">{help.description}</Text>

              <Button
                variant="light"
                color="blue"
                fullWidth
                rightSection={<IconBook size={14} />}
                onClick={() => { close(); openManual() }}
                mt="sm"
              >
                Manual de usuario completo
              </Button>

              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mt="md">Atajos de teclado principales</Text>
              {SHORTCUTS.map(s => (
                <Group key={s.keys.join('+')} justify="space-between">
                  <Text size="xs">{s.description}</Text>
                  <Group gap={4}>
                    {s.keys.map(k => <Kbd key={k} size="xs">{k}</Kbd>)}
                  </Group>
                </Group>
              ))}

              <Button
                variant="subtle"
                color="red"
                size="xs"
                leftSection={<IconBug size={14} />}
                onClick={reportProblem}
                mt="sm"
              >
                Reportar problema
              </Button>
            </Stack>
          )}

          {tab === 'tips' && (
            <Stack gap="sm">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">Consejos para {help.title}</Text>
              {help.tips.map((tip, i) => (
                <Group key={i} gap="sm" wrap="nowrap">
                  <ThemeIcon variant="light" color="yellow" size="sm" radius="xl">
                    <IconBulb size={12} />
                  </ThemeIcon>
                  <Text size="sm">{tip}</Text>
                </Group>
              ))}

              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mt="md">Atajos de teclado</Text>
              {[...SHORTCUTS, ...EXTRA_SHORTCUTS].map(s => (
                <Group key={s.keys.join('+')} justify="space-between">
                  <Text size="xs">{s.description}</Text>
                  <Group gap={4}>
                    {s.keys.map(k => <Kbd key={k} size="xs">{k}</Kbd>)}
                  </Group>
                </Group>
              ))}
            </Stack>
          )}

          {tab === 'videos' && (
            <Stack gap="sm">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">Buscar videos tutoriales</Text>
              <TextInput
                placeholder="Buscar videos..."
                value={search}
                onChange={e => setSearch(e.currentTarget.value)}
                leftSection={<IconSearch size={14} />}
                size="xs"
              />
              {filteredVideos.length === 0 && (
                <Text size="sm" c="dimmed">No se encontraron videos para "{search}"</Text>
              )}
              {filteredVideos.map(v => (
                <Button
                  key={v.id}
                  variant="light"
                  color="blue"
                  fullWidth
                  size="sm"
                  leftSection={<IconVideo size={16} />}
                  rightSection={<Text size="xs" c="dimmed">{v.tiempo}</Text>}
                  onClick={() => showVideo(v.id, v.label)}
                  styles={{ root: { justifyContent: 'space-between' } }}
                >
                  {v.label}
                </Button>
              ))}
              <Text size="xs" c="dimmed" mt="sm">
                Los videos están en producción. Pronto estarán disponibles en nuestra plataforma.
              </Text>
            </Stack>
          )}

          {tab === 'glosario' && (
            <Stack gap="sm">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">Términos agropecuarios</Text>
              {[
                { term: 'BPA', desc: 'Buenas Prácticas Agrícolas — estándares de calidad en producción agrícola' },
                { term: 'BPM', desc: 'Buenas Prácticas de Manufactura — normas de producción e higiene' },
                { term: 'PUC', desc: 'Plan Único de Cuentas — catálogo contable estandarizado colombiano' },
                { term: 'SMMLV', desc: 'Salario Mínimo Mensual Legal Vigente — monto mínimo salarial en Colombia' },
                { term: 'Chapeta', desc: 'Identificador físico del animal (arete o caravana)' },
                { term: 'Grupo de manejo', desc: 'Agrupación de animales por categoría productiva (levante, ceba, vientres)' },
                { term: 'Raza', desc: 'Clasificación genética que define características fenotípicas del animal' },
                { term: 'Lote', desc: 'Porción de terreno delimitada para uso agrícola o pecuario' },
                { term: 'Parcela', desc: 'Subdivisión de un lote para un cultivo específico' },
                { term: 'Siembra', desc: 'Plantación de semillas en un lote para producción agrícola' },
                { term: 'Cosecha', desc: 'Recolección de productos agrícolas en su punto óptimo' },
                { term: 'Evento sanitario', desc: 'Registro de salud del animal: vacuna, enfermedad, desparasitación' },
                { term: 'Pesaje', desc: 'Registro del peso del animal en una fecha determinada' },
                { term: 'GDP', desc: 'Ganancia Diaria de Peso — indicador de productividad en ceba' },
                { term: 'ICA', desc: 'Instituto Colombiano Agropecuario — entidad regulatoria sanitaria' },
                { term: 'ARL', desc: 'Administradora de Riesgos Laborales — aseguradora de accidentes de trabajo' },
                { term: 'EPS', desc: 'Entidad Promotora de Salud — aseguradora de salud en Colombia' },
                { term: 'Finca', desc: 'Unidad productiva agropecuaria, también llamada predio o hacienda' },
                { term: 'Rotación', desc: 'Alternancia de cultivos en un lote para preservar el suelo' },
                { term: 'Forraje', desc: 'Pastos y plantas utilizados para alimentación animal' },
                { term: 'Concentrado', desc: 'Alimento balanceado para animales de producción' },
                { term: 'EPI', desc: 'Elemento de Protección Individual — equipo de seguridad laboral' },
                { term: 'SST', desc: 'Seguridad y Salud en el Trabajo — normativa de prevención de riesgos' },
                { term: 'Producción', desc: 'Cantidad de producto generado: leche, carne, huevos, granos' },
                { term: 'Trazabilidad', desc: 'Seguimiento del producto desde el origen hasta el consumidor final' },
              ].map(g => (
                <Paper key={g.term} p="xs" withBorder>
                  <Group gap="xs">
                    <Badge size="sm" variant="filled" color="blue">{g.term}</Badge>
                    <Text size="sm">{g.desc}</Text>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </ScrollArea>
      </Paper>

      <ManualUsuario opened={manualOpened} onClose={closeManual} />
    </>
  )
}
