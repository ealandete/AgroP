import {
  Paper, Title, Group, Button, Stack, SimpleGrid, Text, Switch,
  Select, Card, Tooltip, Box, TextInput,
} from '@mantine/core'
import { useTema } from '../store/TemaContext.jsx'
import LogoPicker from '../components/LogoPicker.jsx'
import {
  IconPalette, IconLayoutSidebar,
  IconPhoto, IconRestore, IconCheck,
} from '@tabler/icons-react'

const COLORES = [
  { name: 'Verde', color: 'green', hex: '#2e7d32' },
  { name: 'Azul', color: 'blue', hex: '#1976d2' },
  { name: 'Naranja', color: 'orange', hex: '#ed6c02' },
  { name: 'Rojo', color: 'red', hex: '#d32f2f' },
  { name: 'Violeta', color: 'violet', hex: '#7c3aed' },
  { name: 'Rosa', color: 'pink', hex: '#c2185b' },
  { name: 'Cyan', color: 'cyan', hex: '#00acc1' },
  { name: 'Teal', color: 'teal', hex: '#00897b' },
  { name: 'Lima', color: 'lime', hex: '#7cb342' },
  { name: 'Amarillo', color: 'yellow', hex: '#fdd835' },
  { name: 'Gris', color: 'gray', hex: '#616161' },
  { name: 'Oscuro', color: 'dark', hex: '#212121' },
]

export default function Personalizacion() {
  const { tema, actualizarTema } = useTema()

  const handleReset = () => {
    actualizarTema({
      primaryColor: 'green',
      customColor: '',
      layout: 'sidebar',
      compacto: false,
      fontSize: 'md',
      animaciones: true,
      fondo: 'default',
    })
  }

  const previewBg = tema.fondo === 'dots'
    ? { backgroundImage: 'radial-gradient(circle, var(--mantine-color-gray-3) 1px, transparent 1px)', backgroundSize: '20px 20px' }
    : tema.fondo === 'gradient'
    ? { background: 'linear-gradient(135deg, var(--mantine-color-gray-0), var(--mantine-color-gray-2))' }
    : tema.fondo === 'none'
    ? { background: 'white' }
    : {}

  return (
    <Stack>
      <Title order={3}>Personalización</Title>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Stack>
          <Paper withBorder p="md">
            <Group mb="sm">
              <IconPalette size={20} />
              <Text fw={600}>Color Principal</Text>
            </Group>
            <SimpleGrid cols={{ base: 4, sm: 6 }} spacing="xs" mb="sm">
              {COLORES.map(c => (
                <Tooltip key={c.color} label={c.name}>
                  <Box
                    style={{
                      width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                      border: tema.primaryColor === c.color && !tema.customColor
                        ? '3px solid var(--mantine-color-blue-6)'
                        : '2px solid transparent',
                      backgroundColor: c.hex,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onClick={() => actualizarTema({ primaryColor: c.color, customColor: '' })}
                  >
                    {tema.primaryColor === c.color && !tema.customColor && <IconCheck size={18} color="white" />}
                  </Box>
                </Tooltip>
              ))}
            </SimpleGrid>
            <TextInput
              label="Color personalizado (hex)"
              placeholder="#..."
              value={tema.customColor}
              onChange={e => actualizarTema({ customColor: e.target.value, primaryColor: '' })}
              size="sm"
            />
          </Paper>

          <Paper withBorder p="md">
            <Group mb="sm">
              <IconLayoutSidebar size={20} />
              <Text fw={600}>Diseño</Text>
            </Group>
            <Stack>
              <Select
                label="Tipo de navegación"
                data={[
                  { value: 'sidebar', label: 'Barra lateral' },
                  { value: 'topnav', label: 'Barra superior' },
                ]}
                value={tema.layout}
                onChange={v => actualizarTema({ layout: v })}
              />
              <Switch
                label="Modo compacto"
                description="Reduce el padding y densifica las tablas"
                checked={tema.compacto}
                onChange={e => actualizarTema({ compacto: e.currentTarget.checked })}
              />
              <Select
                label="Tamaño de letra"
                data={[
                  { value: 'sm', label: 'Pequeño' },
                  { value: 'md', label: 'Mediano' },
                  { value: 'lg', label: 'Grande' },
                ]}
                value={tema.fontSize}
                onChange={v => actualizarTema({ fontSize: v })}
              />
              <Switch
                label="Animaciones"
                description="Transiciones y efectos visuales"
                checked={tema.animaciones}
                onChange={e => actualizarTema({ animaciones: e.currentTarget.checked })}
              />
              <Select
                label="Fondo"
                data={[
                  { value: 'default', label: 'Por defecto' },
                  { value: 'dots', label: 'Puntos' },
                  { value: 'gradient', label: 'Degradado' },
                  { value: 'none', label: 'Ninguno' },
                ]}
                value={tema.fondo}
                onChange={v => actualizarTema({ fondo: v })}
              />
            </Stack>
          </Paper>

          <Paper withBorder p="md">
            <Group mb="sm">
              <IconPhoto size={20} />
              <Text fw={600}>Logo</Text>
            </Group>
            <LogoPicker />
          </Paper>

          <Button
            variant="light"
            color="red"
            leftSection={<IconRestore size={16} />}
            onClick={handleReset}
          >
            Restablecer por defecto
          </Button>
        </Stack>

        <Stack>
          <Text fw={600}>Vista previa</Text>
          <Paper
            withBorder
            p="lg"
            style={{
              ...previewBg,
              transition: tema.animaciones ? 'all 0.3s ease' : 'none',
            }}
          >
            <Card
              shadow="sm"
              p={tema.compacto ? 'sm' : 'lg'}
              radius="md"
              withBorder
              style={{
                fontSize: tema.fontSize === 'sm' ? 12 : tema.fontSize === 'lg' ? 18 : 14,
                transition: tema.animaciones ? 'all 0.3s ease' : 'none',
              }}
            >
              <Group mb="md">
                <Box
                  style={{
                    width: 40, height: 40, borderRadius: 8,
                    backgroundColor: 'var(--app-primary, var(--mantine-color-green-6))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <IconCheck size={24} color="white" />
                </Box>
                <Box>
                  <Text fw={700}>AgroP</Text>
                  <Text size="xs" c="dimmed">Sistema de Gestión Agropecuaria</Text>
                </Box>
              </Group>
              <Text size="sm" c="dimmed" mb="xs">
                Este es un ejemplo de cómo se verán los componentes con tu configuración actual.
              </Text>
              <Group>
                <Button size={tema.compacto ? 'compact-sm' : 'sm'} color={tema.primaryColor || undefined}>
                  Botón primario
                </Button>
                <Button size={tema.compacto ? 'compact-sm' : 'sm'} variant="light" color={tema.primaryColor || undefined}>
                  Secundario
                </Button>
              </Group>
            </Card>
          </Paper>
        </Stack>
      </SimpleGrid>
    </Stack>
  )
}
