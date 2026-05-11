import { useState, useEffect, useCallback } from 'react'
import { Paper, Stack, Text, Title, Group, Button, ThemeIcon, Badge } from '@mantine/core'
import { IconPig, IconPlant, IconMap, IconChartBar, IconDashboard, IconArrowRight, IconArrowLeft, IconX, IconStar } from '@tabler/icons-react'

const STORAGE_KEY = 'agrop_tour_completado'

const STEPS = [
  {
    title: '¡Bienvenido a AgroP!',
    description: 'AgroP te ayuda a gestionar tu finca de manera fácil y eficiente. Lleva el control de tus animales, cultivos, contabilidad y más.',
    icon: IconStar,
    color: 'green',
  },
  {
    title: 'Navegación',
    description: 'Usa el menú lateral para moverte entre los módulos. Cada sección agrupa funcionalidades relacionadas con producción, gestión y análisis.',
    icon: IconDashboard,
    color: 'blue',
  },
  {
    title: 'Registra tu primer animal',
    description: 'Ve al módulo Ganadería y haz clic en "Nuevo". Ingresa el código, especie y sexo. ¡En segundos tendrás tu primer animal registrado!',
    icon: IconPig,
    color: 'orange',
  },
  {
    title: 'Explora el mapa',
    description: 'En Lotes y Mapas puedes dibujar tus terrenos, medir áreas y planificar el uso del suelo. Visualiza tus cultivos directamente en el mapa.',
    icon: IconMap,
    color: 'cyan',
  },
  {
    title: 'Reportes y estadísticas',
    description: 'Genera reportes, exporta datos a CSV y visualiza estadísticas de producción para tomar mejores decisiones.',
    icon: IconChartBar,
    color: 'grape',
  },
]

export default function Tour() {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      setTimeout(() => setActive(true), 600)
    }
  }, [])

  const completeTour = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setActive(false)
  }, [])

  const skipTour = useCallback(() => {
    completeTour()
  }, [completeTour])

  const nextStep = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      completeTour()
    }
  }, [step, completeTour])

  const prevStep = useCallback(() => {
    if (step > 0) setStep(s => s - 1)
  }, [step])

  if (!active) return null

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1
  const isFirst = step === 0

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Paper
        shadow="xl"
        p="xl"
        style={{
          maxWidth: 480, width: '90%', borderRadius: 20,
          position: 'relative',
        }}
      >
        <Button
          variant="subtle"
          color="gray"
          size="sm"
          onClick={skipTour}
          style={{ position: 'absolute', top: 8, right: 8 }}
        >
          <IconX size={18} />
        </Button>

        <Stack align="center" gap="lg">
          <ThemeIcon variant="light" color={current.color} size={80} radius={100}>
            <Icon size={40} />
          </ThemeIcon>

          <Title order={3} ta="center">{current.title}</Title>
          <Text ta="center" size="sm" c="dimmed">{current.description}</Text>

          <Group gap={6}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 24 : 8, height: 8, borderRadius: 4,
                  background: i === step ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-gray-3)',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </Group>

          <Group justify="space-between" style={{ width: '100%' }}>
            <Button
              variant="default"
              onClick={isFirst ? skipTour : prevStep}
              leftSection={!isFirst ? <IconArrowLeft size={16} /> : undefined}
            >
              {isFirst ? 'Saltar' : 'Anterior'}
            </Button>
            <Button
              color="green"
              onClick={nextStep}
              rightSection={!isLast ? <IconArrowRight size={16} /> : undefined}
            >
              {isLast ? '¡Comenzar!' : 'Siguiente'}
            </Button>
          </Group>
        </Stack>
      </Paper>
    </div>
  )
}
