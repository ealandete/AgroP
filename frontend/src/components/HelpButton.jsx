import { useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Affix, ActionIcon, Paper, Stack, Text, Title, Group, Badge,
  Kbd, Button, ScrollArea, Tabs, ThemeIcon, SimpleGrid, NavLink,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconHelp, IconX, IconBulb, IconBook, IconVocabulary,
  IconVideo, IconKeyboard, IconFileText, IconArrowRight,
  IconChevronRight, IconSearch, IconMap, IconPlant, IconCoin,
  IconPig, IconDashboard,
} from '@tabler/icons-react'
import ManualUsuario from './ManualUsuario'

const ROUTE_HELP = {
  '/animales': {
    title: 'Animales',
    description: 'Registra tus animales, asigna grupos, lleva el control de salud y producción',
    icon: IconPig,
    tips: [
      'Usa códigos únicos para cada animal',
      'Asigna grupos de manejo para filtrar fácilmente',
      'Registra eventos de salud periódicamente',
      'Exporta tu inventario a CSV desde el botón Exportar',
    ],
  },
  '/cultivos': {
    title: 'Cultivos',
    description: 'Gestiona siembras, cosechas y tratamientos. Usa el mapa para ubicar tus lotes',
    icon: IconPlant,
    tips: [
      'Planifica tus siembras por temporada',
      'Asocia cada cultivo a un lote en el mapa',
      'Lleva registro de tratamientos y fertilizantes',
      'Programa cosechas desde el módulo de Planeación',
    ],
  },
  '/lotes': {
    title: 'Lotes y Mapas',
    description: 'Dibuja tus lotes en el mapa, mide áreas, planifica el uso del suelo',
    icon: IconMap,
    tips: [
      'Usa el dibujador de mapas para delimitar lotes',
      'Mide áreas automáticamente con el polígono',
      'Asigna cultivos a cada lote',
      'Visualiza la rotación de cultivos por temporada',
    ],
  },
  '/contabilidad': {
    title: 'Contabilidad',
    description: 'Lleva la contabilidad de tu finca: facturas, costos, presupuestos, PUC colombiano',
    icon: IconCoin,
    tips: [
      'Usa el PUC colombiano integrado para clasificar cuentas',
      'Genera reportes de ingresos vs gastos mensuales',
      'Programa presupuestos anuales',
      'Exporta tu libro contable a Excel',
    ],
  },
}

const DEFAULT_HELP = {
  title: 'AgroP',
  description: 'Bienvenido a AgroP. Selecciona un módulo en el menú lateral para empezar',
  icon: IconDashboard,
  tips: [
    'Usa el menú lateral para navegar entre módulos',
    'Activa Modo Sencillo desde el menú de usuario para acceso rápido',
    'Tus datos se guardan automáticamente',
    'Puedes cambiar de finca desde el menú superior',
  ],
}

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: 'Búsqueda global' },
  { keys: ['Ctrl', 'N'], description: 'Nuevo registro (según módulo)' },
  { keys: ['Ctrl', 'E'], description: 'Exportar datos actuales' },
  { keys: ['Ctrl', 'H'], description: 'Abrir ayuda contextual' },
  { keys: ['Ctrl', 'M'], description: 'Alternar Modo Sencillo' },
  { keys: ['Escape'], description: 'Cerrar modal / Cancelar' },
]

export default function HelpButton() {
  const location = useLocation()
  const [opened, { open, close }] = useDisclosure(false)
  const [manualOpened, { open: openManual, close: closeManual }] = useDisclosure(false)
  const [tab, setTab] = useState('como')

  const path = location.pathname
  const help = ROUTE_HELP[path] || DEFAULT_HELP

  const handleOpen = useCallback(() => {
    setTab('como')
    open()
  }, [open])

  return (
    <>
      <Affix position={{ bottom: 24, left: 24 }} zIndex={1000}>
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
      </Affix>

      <Paper
        shadow="lg"
        withBorder
        style={{
          position: 'fixed',
          bottom: 84,
          left: 24,
          width: 380,
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
            <Tabs.Tab value="como" leftSection={<IconBulb size={14} />}>¿Cómo funciona?</Tabs.Tab>
            <Tabs.Tab value="tips" leftSection={<IconKeyboard size={14} />}>Tips</Tabs.Tab>
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
                rightSection={<IconArrowRight size={14} />}
                onClick={() => { close(); openManual() }}
                mt="sm"
              >
                Manual de usuario completo
              </Button>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mt="md">Atajos de teclado</Text>
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
                color="gray"
                size="xs"
                leftSection={<IconVideo size={14} />}
                onClick={() => notifications.show({ title: 'Video tutorial', message: 'Próximamente disponible', color: 'blue' })}
                mt="sm"
              >
                Ver video tutorial
              </Button>
            </Stack>
          )}

          {tab === 'tips' && (
            <Stack gap="sm">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">Consejos rápidos</Text>
              {help.tips.map((tip, i) => (
                <Group key={i} gap="sm" wrap="nowrap">
                  <ThemeIcon variant="light" color="yellow" size="sm" radius="xl">
                    <IconBulb size={12} />
                  </ThemeIcon>
                  <Text size="sm">{tip}</Text>
                </Group>
              ))}
              <Text size="xs" fw={600} c="dimmed" tt="uppercase" mt="md">Atajos de teclado</Text>
              {SHORTCUTS.map(s => (
                <Group key={s.keys.join('+')} justify="space-between">
                  <Text size="xs">{s.description}</Text>
                  <Group gap={4}>
                    {s.keys.map(k => <Kbd key={k} size="xs">{k}</Kbd>)}
                  </Group>
                </Group>
              ))}
            </Stack>
          )}

          {tab === 'glosario' && (
            <Stack gap="sm">
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">Términos agropecuarios</Text>
              {[
                { term: 'BPA', desc: 'Buenas Prácticas Agrícolas — estándares de calidad' },
                { term: 'PUC', desc: 'Plan Único de Cuentas — catálogo contable colombiano' },
                { term: 'SMMLV', desc: 'Salario Mínimo Mensual Legal Vigente' },
                { term: 'Chapeta', desc: 'Identificador físico del animal (arete o caravana)' },
                { term: 'Grupo manejo', desc: 'Agrupación de animales por categoría productiva' },
                { term: 'Raza', desc: 'Clasificación genética del animal' },
                { term: 'Lote', desc: 'Porción de terreno delimitada para uso agrícola' },
                { term: 'Siembra', desc: 'Plantación de cultivos en un lote' },
                { term: 'Cosecha', desc: 'Recolección de productos agrícolas' },
                { term: 'Evento sanitario', desc: 'Registro de salud del animal (vacuna, enfermedad, etc.)' },
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
